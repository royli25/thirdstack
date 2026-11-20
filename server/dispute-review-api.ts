import express, { type Express } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { config } from "./config.js";
import { FundingError } from "./funding.js";
import { DisputeReviewService } from "./dispute-review.js";
import { WalletOperations } from "./wallet-operations.js";
export function disputeReviewRoutes(
  app: Express,
  service: DisputeReviewService,
  accountAccess?: express.RequestHandler,
  operations = new WalletOperations(service.stripe),
) {
  const router = express.Router();
  if (accountAccess) router.use(accountAccess);
  else
    router.use((req, res, next) => {
      if (!config.adminToken || config.adminToken === config.token) {
        res.status(503).json({
          error:
            "Admin funding review is disabled. Configure a separate admin access token on the server.",
        });
        return;
      }
      const expected = Buffer.from(config.adminToken);
      const actual = Buffer.from(
        req.headers.authorization?.replace(/^Bearer /, "") || "",
      );
      if (
        actual.length !== expected.length ||
        !timingSafeEqual(actual, expected)
      ) {
        res.status(401).json({
          error: "Enter the admin access token to review disputed payments.",
        });
        return;
      }
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        const origin = req.header("origin");
        try {
          if (origin && new URL(origin).host !== req.headers.host)
            throw new Error();
        } catch {
          res
            .status(403)
            .json({ error: "Cross-origin writes are not allowed" });
          return;
        }
        if (!req.is("application/json")) {
          res.status(415).json({ error: "JSON content type required" });
          return;
        }
      }
      res.locals.adminActor = `admin credential ${createHash("sha256").update(config.adminToken).digest("hex").slice(0, 12)}`;
      next();
    });
  router.use(express.json({ limit: "24kb" }));
  const handle =
    (fn: express.RequestHandler): express.RequestHandler =>
    async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (e) {
        if (e instanceof z.ZodError)
          res
            .status(400)
            .json({ error: e.issues.map((i) => i.message).join("; ") });
        else if (e instanceof FundingError)
          res.status(e.status).json({ error: e.message });
        else
          res.status(500).json({
            error: "Dispute review failed. The saved review was retained.",
          });
      }
    };
  router.get(
    "/disputes",
    handle(async (req, res) => {
      const q = z
        .object({
          status: z
            .enum(["all", "needs_review", "in_review", "reviewed"])
            .default("all"),
          q: z.string().max(300).default(""),
          page: z.coerce.number().int().min(1).max(10000).default(1),
        })
        .strict()
        .parse(req.query);
      res.json(await service.list(q.status, q.q, q.page));
    }),
  );
  router.get(
    "/disputes/:id",
    handle(async (req, res) => {
      const id = z.uuid().parse(req.params.id);
      res.json(await service.forPayment(id, () => service.detail(id)));
    }),
  );
  router.post(
    "/disputes/:id/review",
    handle(async (req, res) => {
      const id = z.uuid().parse(req.params.id);
      res.json(
        await service.forPayment(id, () =>
          service.review(id, req.body, res.locals.adminActor),
        ),
      );
    }),
  );
  router.post(
    "/disputes/:id/recheck",
    handle(async (req, res) => {
      z.object({}).strict().parse(req.body);
      const id = z.uuid().parse(req.params.id);
      res.json(
        await service.forPayment(id, async () => {
          await service.get(id);
          await service.stripe.reconcile(id, true);
          return service.detail(id);
        }),
      );
    }),
  );
  // Operator money actions. Each is verified against Stripe, runs under the
  // account lock, and records the authenticated administrator.
  router.post(
    "/disputes/:id/release",
    handle(async (req, res) => {
      const id = z.uuid().parse(req.params.id);
      const released = await operations.releaseDispute(
        id,
        req.body,
        res.locals.adminActor,
      );
      res.json({
        ...released,
        detail: await service.forPayment(id, () => service.detail(id)),
      });
    }),
  );
  router.get(
    "/payments",
    handle(async (req, res) => {
      const q = z
        .object({ q: z.string().max(300).default("") })
        .strict()
        .parse(req.query);
      res.json({ items: await operations.payments(q.q) });
    }),
  );
  router.get(
    "/refunds/:id",
    handle(async (req, res) => {
      res.json(await operations.refundQuote(z.uuid().parse(req.params.id)));
    }),
  );
  router.post(
    "/refunds/:id",
    handle(async (req, res) => {
      res.json(
        await operations.requestRefund(
          z.uuid().parse(req.params.id),
          req.body,
          res.locals.adminActor,
        ),
      );
    }),
  );
  router.post(
    "/refund-requests/:id/resolve",
    handle(async (req, res) => {
      z.object({}).strict().parse(req.body);
      res.json(
        await operations.resolveRefund(
          z.uuid().parse(req.params.id),
          res.locals.adminActor,
        ),
      );
    }),
  );
  // Operator balance adjustments. The operator names the account and the mode.
  router.get(
    "/adjustments",
    handle(async (req, res) => {
      const q = z
        .object({ q: z.string().max(300).default("") })
        .strict()
        .parse(req.query);
      res.json({
        accounts: await operations.adjustableAccounts(q.q),
        items: await operations.adjustments(),
      });
    }),
  );
  router.post(
    "/adjustments",
    handle(async (req, res) => {
      res.json(await operations.adjust(req.body, res.locals.adminActor));
    }),
  );
  router.get(
    "/alerts",
    handle(async (_req, res) => {
      res.json({ items: await operations.alerts() });
    }),
  );
  router.post(
    "/alerts/:id/resolve",
    handle(async (req, res) => {
      res.json(
        await operations.resolveAlert(
          z.uuid().parse(req.params.id),
          req.body,
          res.locals.adminActor,
        ),
      );
    }),
  );
  // Rail configuration detail is for operators. Customers only ever see
  // "not available" without the reason.
  router.get(
    "/status",
    handle(async (_req, res) => {
      res.json(operations.railStatus());
    }),
  );
  router.use((_req, res) => {
    res.status(404).json({ error: "Admin funding route not found." });
  });
  app.use("/api/admin/funding", router);
}
