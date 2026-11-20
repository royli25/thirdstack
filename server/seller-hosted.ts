import express, { type Express } from "express";
import type { Pool } from "pg";
import {
  AccountError,
  type Accounts,
  type VerifiedIdentity,
} from "./accounts.js";
import { accountFailure, sameOriginWrite } from "./account-api.js";
import type { ProviderId } from "./types.js";
import type { SellerSessionData } from "./seller-report.js";
import {
  sellerRoutes,
  type SellerAccess,
  type SellerDeps,
} from "./seller-api.js";

const json = (value: unknown) =>
  typeof value === "string" ? JSON.parse(value) : value;

/**
 * Reads what seller reports need across every customer workspace, for sessions that
 * allow commercial aggregates. Text an agent or user wrote (objectives, queries,
 * reasons, answers, page content) is dropped here and never reaches the analysis.
 */
export async function loadSellerDataHosted(
  pool: Pool,
  days = 200,
): Promise<SellerSessionData[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const eligible = `SELECT workspace_id,id FROM octolab.observation_sessions
    WHERE (body::jsonb->>'commercialConsent')='true' AND body::jsonb->>'createdAt' >= $1`;
  const [sessions, events, calls] = await Promise.all([
    pool.query(
      `SELECT workspace_id,id,body FROM octolab.observation_sessions
       WHERE (body::jsonb->>'commercialConsent')='true' AND body::jsonb->>'createdAt' >= $1`,
      [since],
    ),
    pool.query(
      `SELECT e.workspace_id,e.session_id,e.id,e.body FROM octolab.observation_events e
       JOIN (${eligible}) s ON s.workspace_id=e.workspace_id AND s.id=e.session_id
       WHERE e.body::jsonb->>'type' IN ('tools_offered','tool_called') ORDER BY e.id`,
      [since],
    ),
    pool.query(
      `SELECT c.workspace_id,c.session_id,c.body FROM octolab.observation_calls c
       JOIN (${eligible}) s ON s.workspace_id=c.workspace_id AND s.id=c.session_id ORDER BY c.rowid`,
      [since],
    ),
  ]);
  const key = (r: { workspace_id: string; session_id?: string; id?: string }) =>
    `${r.workspace_id}/${r.session_id ?? r.id}`;
  const out = new Map<string, SellerSessionData>();
  for (const row of sessions.rows) {
    const s = json(row.body);
    out.set(key(row), {
      session: {
        id: s.id,
        createdAt: s.createdAt,
        host: s.host,
        taskType: s.taskType,
        commercialConsent: true,
        // Counted only as "how many distinct accounts"; never returned.
        apiKeyId: row.workspace_id,
        outcomes: (Array.isArray(s.outcomes) ? s.outcomes : []).map(
          (o: { evidenceCallIds?: string[] }) => ({
            evidenceCallIds: o.evidenceCallIds ?? [],
          }),
        ),
      } as unknown as SellerSessionData["session"],
      events: [],
      calls: [],
    });
  }
  for (const row of events.rows) {
    const e = json(row.body);
    const d = e.data ?? {};
    out.get(key(row))?.events.push({
      id: Number(row.id),
      type: e.type,
      data:
        e.type === "tool_called"
          ? { callId: d.callId, selectedBy: d.selectedBy }
          : {
              operations: (Array.isArray(d.operations) ? d.operations : []).map(
                (o: { operation: string; content?: string }) => ({
                  operation: o.operation,
                  content: o.content,
                }),
              ),
              tools: (Array.isArray(d.tools) ? d.tools : []).map(
                (t: Record<string, unknown>) => ({
                  tool: t.tool,
                  provider: t.provider,
                  listingVersion: t.listingVersion,
                  discoveryMatches: (Array.isArray(t.discoveryMatches)
                    ? t.discoveryMatches
                    : []
                  ).map((m: { operationIndex: number; status: string }) => ({
                    operationIndex: m.operationIndex,
                    status: m.status,
                  })),
                }),
              ),
            },
    } as unknown as SellerSessionData["events"][number]);
  }
  for (const row of calls.rows) {
    const c = json(row.body);
    const usd = c.result?.usage?.providerReportedUsd;
    out.get(key(row))?.calls.push({
      id: c.id,
      tool: c.tool,
      provider: c.provider,
      status: c.status,
      reasonTheme: c.reasonTheme,
      estimateMicros: c.estimateMicros,
      latencyMs: c.latencyMs,
      httpStatus: c.httpStatus,
      // Keep only what failure classification reads.
      error: /time/i.test(c.error ?? "")
        ? "timeout"
        : c.error
          ? "error"
          : undefined,
      result: c.result
        ? {
            ...(typeof usd === "number"
              ? { usage: { providerReportedUsd: usd } }
              : {}),
            ...(Array.isArray(c.result.sources)
              ? { sources: c.result.sources.length ? [1] : [] }
              : {}),
          }
        : undefined,
    } as unknown as SellerSessionData["calls"][number]);
  }
  return [...out.values()];
}

/**
 * Company-member routes at /api/companies/:id/seller. The company's approved provider
 * decides what is shown; nothing in the request can change that binding.
 */
export function hostedSellerRoutes(
  app: Express,
  accounts: Accounts,
  deps: SellerDeps,
) {
  const router = express.Router();
  router.use(async (req, res, next) => {
    if (!/^\/companies\/[^/]+\/seller(?:\/|$)/i.test(req.path)) {
      next("router");
      return;
    }
    try {
      if (!sameOriginWrite(req, res)) return;
      res.locals.account = await accounts.identity(req);
      // Company seller pages are for business accounts.
      await accounts.assertAccountType(res.locals.account, "business");
      next();
    } catch (error) {
      accountFailure(error, res);
    }
  });
  router.use(express.json({ limit: "12kb" }));
  sellerRoutes(router, deps, {
    base: "/companies/:id/seller",
    fail: accountFailure,
    async resolve(req, res): Promise<SellerAccess> {
      const identity: VerifiedIdentity = res.locals.account;
      const company = await accounts.companies.get(
        identity,
        String(req.params.id),
      );
      if (
        company.status !== "approved" ||
        !company.providerId ||
        !company.insightsEnabled
      )
        throw new AccountError(
          403,
          "Company approval and insight release are required before seller tools are available.",
        );
      return {
        provider: company.providerId as ProviderId,
        actor: identity.userId,
        allow(action) {
          if (action === "read") return;
          if (action === "write" && company.role !== "analyst") return;
          if (action === "review" && company.role === "platform_admin") return;
          throw new AccountError(
            403,
            action === "review"
              ? "Only a platform administrator can review a listing."
              : "Only the company owner can change this.",
          );
        },
        audit: (what) =>
          accounts.companies.team.reportAccess(
            identity,
            company.id,
            `seller:${what}`,
          ),
      };
    },
  });
  app.use("/api", router);
}
