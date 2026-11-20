import type { Express, Request, Response } from "express";
import { z } from "zod";
import { ApiKeyError } from "./api-keys.js";
import { config } from "./config.js";
import { Observatory, ObservationError } from "./observation.js";
import { providerRegistry, registeredToolSchema } from "./provider-adapters.js";
import {
  assignProviderAccount,
  providerAccountForCall,
} from "./provider-accounts.js";
import { ProviderBilling } from "./provider-billing.js";

export function providerManagementRoutes(app: Express, obs: Observatory) {
  const billing = new ProviderBilling(obs);
  const route =
    (fn: (req: Request, res: Response) => Promise<unknown>) =>
    async (req: Request, res: Response) => {
      try {
        if (res.locals.apiKeyId)
          throw new ApiKeyError(
            403,
            "Only the account owner can access provider billing and setup.",
          );
        if (
          req.method !== "GET" &&
          !res.locals.account &&
          config.token.length < 24
        )
          throw new ObservationError(
            503,
            "Protect the account with owner access before importing or reviewing billing records.",
          );
        await fn(req, res);
      } catch (error) {
        if (error instanceof z.ZodError)
          res
            .status(400)
            .json({ error: error.issues.map((i) => i.message).join("; ") });
        else if (
          error instanceof ObservationError ||
          error instanceof ApiKeyError
        )
          res.status(error.status).json({ error: error.message });
        else
          res.status(500).json({
            error:
              "Provider billing operation failed. Refresh before retrying.",
          });
      }
    };
  app.get(
    "/api/account/provider-adapters",
    route(async (_req, res) =>
      res.json({
        adapters: await Promise.all(
          providerRegistry.list().map(async (a) => ({
            ...providerRegistry.snapshot(a.tool),
            capabilities: a.capabilities,
            credential: providerRegistry.credentialStatus(a.tool),
            accountReference:
              (await providerAccountForCall(obs.db.store, a.tool)) ?? null,
            accountManagedByServer: !!providerRegistry.accountReference(a.tool),
            checks: {
              allowlisted: true,
              inputValidation: true,
              responseValidation: true,
              deterministicEstimate: true,
              remoteCredentialVerification: false,
            },
          })),
        ),
        meaning:
          "Local configuration checks only. No provider requests or spending. Rotation identifiers are private to this server process.",
      }),
    ),
  );
  app.post(
    "/api/account/provider-adapters/:tool/account",
    route(async (req, res) =>
      res.json(
        await assignProviderAccount(
          obs.db.store,
          registeredToolSchema.parse(req.params.tool),
          req.body,
        ),
      ),
    ),
  );
  app.get(
    "/api/account/provider-billing",
    route(async (req, res) => {
      const days = z.coerce
        .number()
        .pipe(z.union([z.literal(7), z.literal(30), z.literal(90)]))
        .default(7)
        .parse(req.query.days);
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      start.setUTCDate(start.getUTCDate() - days + 1);
      res.json(await billing.overview(start.toISOString()));
    }),
  );
  app.post(
    "/api/account/provider-billing/imports",
    route(async (req, res) =>
      res.status(201).json(await billing.import(req.body)),
    ),
  );
  app.post(
    "/api/account/provider-billing/imports/:id/review",
    route(async (req, res) =>
      res.json(
        await billing.review(
          z.uuid().parse(req.params.id),
          req.body,
          res.locals.account?.userId,
        ),
      ),
    ),
  );
  app.get(
    "/api/account/provider-billing/export",
    route(async (_req, res) => {
      const report = await billing.overview();
      // Explicit allowlist: no raw requests, provider outputs, private explanations or secrets.
      res.json({
        version: "provider-billing-export-v1",
        exportedAt: new Date().toISOString(),
        batches: report.batches.map((b) => ({
          id: b.id,
          provider: b.provider,
          accountReference: b.accountReference,
          sourceKind: b.sourceKind,
          sourceReference: b.sourceReference,
          currency: b.currency,
          windowStart: b.windowStart,
          windowEnd: b.windowEnd,
          contentHash: b.contentHash,
          supersedesBatchId: b.supersedesBatchId,
          creditRate: b.creditRate,
          review: b.review
            ? {
                decision: b.review.decision,
                at: b.review.at,
                actor: b.review.actor,
                batchHash: b.review.batchHash,
              }
            : null,
          effective: b.effective,
          lines: b.lines.map((l) => ({
            recordId: l.recordId,
            callSource: l.callSource,
            requestId: l.requestId,
            amountMicros: l.amountMicros,
            credits: l.credits,
            status: l.status,
            callId: l.callId,
            estimatedMicros: l.estimatedMicros,
            reportedUsd: l.reportedUsd,
            reportedCredits: l.reportedCredits,
            convertedCreditMicros: l.convertedCreditMicros,
            reconciledMicros: l.reconciledMicros,
            varianceMicros: l.varianceMicros,
          })),
        })),
      });
    }),
  );
}
