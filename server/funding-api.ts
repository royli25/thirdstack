import express, { type Express, type Request, type Response } from "express";
import { z } from "zod";
import { FundingError, FundingService } from "./funding.js";
import { StripeFundingService } from "./stripe-funding.js";
import { STATEMENT_MAX_LINES } from "./wallet.js";
import { statementCsv } from "./wallet-statement.js";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use dates as YYYY-MM-DD.");
/** A statement range in whole UTC days; `to` is the last day included. */
const statementRange = z
  .object({
    from: day,
    to: day,
    format: z.enum(["csv", "json"]).default("csv"),
  })
  .strict()
  .transform((input, context) => {
    const from = new Date(`${input.from}T00:00:00.000Z`);
    const last = new Date(`${input.to}T00:00:00.000Z`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(last.getTime())) {
      context.addIssue({ code: "custom", message: "Use dates as YYYY-MM-DD." });
      return z.NEVER;
    }
    const days = (last.getTime() - from.getTime()) / 86_400_000 + 1;
    if (days < 1 || days > 366) {
      context.addIssue({
        code: "custom",
        message: "Choose a range of 1 to 366 days, with the start date first.",
      });
      return z.NEVER;
    }
    return {
      ...input,
      fromAt: from.toISOString(),
      toAt: new Date(last.getTime() + 86_400_000).toISOString(),
    };
  });
export function stripeWebhookRoute(app: Express, stripe: StripeFundingService) {
  // These exact endpoints use Stripe signatures instead of the account credential.
  // They must precede all JSON parsing so signature verification receives original bytes.
  // Sandbox and live events have separate endpoints and signing secrets: the
  // path, not the payload, decides which rail verifies an event.
  for (const [path, mode] of [
    ["/api/webhooks/stripe", "test"],
    ["/api/webhooks/stripe/live", "live"],
  ] as const)
    app.post(
      path,
      express.raw({ type: "application/json", limit: "512kb" }),
      webhookHandler(stripe, mode),
    );
}
function webhookHandler(
  stripe: StripeFundingService,
  mode: "test" | "live",
): express.RequestHandler {
  return async (req, res) => {
    {
      if (!Buffer.isBuffer(req.body)) {
        res
          .status(415)
          .json({ error: "Stripe webhook requires a JSON request body." });
        return;
      }
      const signature = req.header("stripe-signature");
      if (!signature) {
        res.status(400).json({ error: "Missing Stripe webhook signature." });
        return;
      }
      try {
        res.json(await stripe.webhook(req.body, signature, mode));
      } catch (error) {
        res.status(error instanceof FundingError ? error.status : 500).json({
          error:
            error instanceof FundingError
              ? error.message
              : "Stripe event processing failed. Retry delivery.",
        });
      }
    }
  };
}
export function fundingRoutes(
  app: Express,
  service: FundingService,
  stripe: StripeFundingService,
) {
  const route =
    (fn: (req: Request, res: Response) => unknown) =>
    async (req: Request, res: Response) => {
      try {
        await fn(req, res);
      } catch (error) {
        if (error instanceof z.ZodError)
          res
            .status(400)
            .json({ error: error.issues.map((i) => i.message).join("; ") });
        else if (error instanceof FundingError)
          res.status(error.status).json({ error: error.message });
        else
          res.status(500).json({
            error: "Deposit operation failed. No automatic retry was made.",
          });
      }
    };
  app.get(
    "/api/account/funding",
    route(async (req, res) =>
      res.json(
        await service.store.db.read(async () => {
          const light = req.query.summary === "true";
          const summary = await service.summary(!light);
          const stripeDeposits = Number(
            (await service.store.db
              .prepare(
                "SELECT COUNT(*) AS n FROM stripe_deposits WHERE payment_intent_id IS NOT NULL",
              )
              .get())!.n,
          );
          return {
            ...summary,
            ...(light
              ? {
                  stripe: await stripe.accountStatus(),
                  wallet: await stripe.walletStatus(),
                }
              : await stripe.summary()),
            stripeDeposits,
            totalDeposits: summary.totalDeposits + stripeDeposits,
          };
        }),
      ),
    ),
  );
  // Per-call wallet activity: charged, released, in progress and refused calls.
  app.get(
    "/api/account/funding/activity",
    route(async (req, res) => {
      const input = z
        .object({
          days: z.enum(["7", "30", "90", "365"]).default("30"),
          page: z.coerce.number().int().min(1).max(100000).default(1),
        })
        .strict()
        .parse(req.query);
      res.json(
        await service.store.db.read(() =>
          stripe.walletActivity({
            since: new Date(
              Date.now() - Number(input.days) * 86_400_000,
            ).toISOString(),
            page: input.page,
          }),
        ),
      );
    }),
  );
  // Dated statement with opening and closing balances. Read-only.
  app.get(
    "/api/account/funding/statement",
    route(async (req, res) => {
      const input = statementRange.parse(req.query);
      const statement = await service.store.db.read(() =>
        stripe.walletStatement(input.fromAt, input.toAt),
      );
      if (!statement)
        throw new FundingError(
          413,
          `Statements hold up to ${STATEMENT_MAX_LINES.toLocaleString("en-US")} lines. Choose a shorter date range.`,
        );
      if (input.format === "json") {
        res.json(statement);
        return;
      }
      res
        .type("text/csv; charset=utf-8")
        .set(
          "Content-Disposition",
          `attachment; filename="two-hands-${statement.mode === "live" ? "credits" : "sandbox-credits"}-${input.from}-to-${input.to}.csv"`,
        )
        .set("Cache-Control", "no-store")
        .send(statementCsv(statement));
    }),
  );
  app.post(
    "/api/account/funding/deposits",
    route(async (req, res) =>
      res.status(201).json(await service.create(req.body)),
    ),
  );
  app.post(
    "/api/account/funding/stripe",
    route(async (req, res) =>
      res.status(201).json(await stripe.create(req.body)),
    ),
  );
  app.get(
    "/api/account/funding/stripe/:id",
    route(async (req, res) =>
      res.json(await stripe.get(z.uuid().parse(req.params.id))),
    ),
  );
  app.post(
    "/api/account/funding/stripe/:id/reconcile",
    route(async (req, res) => {
      z.object({}).strict().parse(req.body);
      res.json(await stripe.reconcile(z.uuid().parse(req.params.id), true));
    }),
  );
  app.get(
    "/api/account/funding/deposits/:id",
    route(async (req, res) =>
      res.json(await service.get(z.uuid().parse(req.params.id))),
    ),
  );
  app.post(
    "/api/account/funding/deposits/:id/verify",
    route(async (req, res) =>
      res.json(await service.verify(z.uuid().parse(req.params.id), req.body)),
    ),
  );
}
