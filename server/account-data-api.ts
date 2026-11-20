import { readActivity, readUsage } from "./account-reads.js";
import { providerIds } from "./provider-catalog.js";
import { providerManagementRoutes } from "./provider-management-api.js";
import { ApiKeyError } from "./api-keys.js";
import type { Express } from "express";
import { z } from "zod";
import { config } from "./config.js";
import { connections } from "./observation-connections.js";
import { Observatory, ObservationError } from "./observation.js";
import { discoveryInput } from "./tool-discovery.js";
import type { ActivityItem, AccountUsage } from "./account-data-types.js";
const period = z.coerce
  .number()
  .pipe(z.union([z.literal(7), z.literal(30), z.literal(90)]))
  .default(7);
export async function accountActivity(
  obs: Observatory,
  since: string,
): Promise<ActivityItem[]> {
  return (await readActivity(obs, since)).items;
}
export function accountUsage(
  items: ActivityItem[],
  days: number,
  since: string,
): AccountUsage {
  const usd = items.filter((i) => i.reportedUsd !== null);
  const timed = items.filter((i) => typeof i.latencyMs === "number");
  return {
    days,
    since,
    requests: items.length,
    succeeded: items.filter((i) => i.status === "succeeded").length,
    failed: items.filter((i) => i.status === "failed").length,
    interrupted: items.filter((i) => i.status === "interrupted").length,
    running: items.filter((i) => i.status === "running").length,
    estimatedMicros: items.reduce(
      (sum, i) => sum + (i.status === "running" ? 0 : i.estimateMicros),
      0,
    ),
    reportedUsd: usd.length
      ? usd.reduce((sum, i) => sum + i.reportedUsd!, 0)
      : null,
    usdReportingCalls: usd.length,
    averageLatencyMs: timed.length
      ? Math.round(
          timed.reduce((sum, i) => sum + i.latencyMs!, 0) / timed.length,
        )
      : null,
    latencySamples: timed.length,
    series: Array.from({ length: days }, (_, n) => {
      const date = new Date(Date.parse(since) + n * 86400000)
        .toISOString()
        .slice(0, 10);
      const calls = items.filter((i) => i.startedAt.slice(0, 10) === date);
      return {
        date,
        requests: calls.length,
        estimatedMicros: calls.reduce(
          (sum, i) => sum + (i.status === "running" ? 0 : i.estimateMicros),
          0,
        ),
      };
    }),
    providers: providerIds.map((provider) => {
      const calls = items.filter((i) => i.provider === provider);
      const reported = calls.filter((i) => i.reportedCredits !== null);
      return {
        provider,
        requests: calls.length,
        estimatedMicros: calls.reduce(
          (sum, i) => sum + (i.status === "running" ? 0 : i.estimateMicros),
          0,
        ),
        reportedCredits: reported.length
          ? reported.reduce((sum, i) => sum + i.reportedCredits!, 0)
          : null,
        creditReportingCalls: reported.length,
      };
    }),
  };
}
export function accountDataRoutes(app: Express, obs: Observatory) {
  providerManagementRoutes(app, obs);
  const route =
    (
      fn: (
        req: import("express").Request,
        res: import("express").Response,
      ) => unknown,
    ) =>
    async (req: import("express").Request, res: import("express").Response) => {
      try {
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
        else res.status(500).json({ error: "The account request failed." });
      }
    };
  const since = (days: number) => {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - days + 1);
    return start.toISOString();
  };
  app.get(
    "/api/account/operator-allowance",
    route(async (_req, res) => res.json(await obs.db.store.allowance.status())),
  );
  app.get(
    "/api/account/routing",
    route(async (_req, res) => res.json(await obs.routingPolicy())),
  );
  app.post(
    "/api/account/routing",
    route(async (req, res) =>
      res.json(await obs.updateRoutingPolicy(req.body)),
    ),
  );
  app.post(
    "/api/account/preview",
    route(async (req, res) =>
      res.json(
        await obs.preview(discoveryInput.parse(req.body), res.locals.apiKeyId),
      ),
    ),
  );
  app.get(
    "/api/account/usage",
    route(async (req, res) => {
      const days = period.parse(req.query.days);
      const start = since(days);
      res.json(await readUsage(obs, days, start));
    }),
  );
  app.get(
    "/api/account/activity",
    route(async (req, res) => {
      const input = z
        .object({
          days: period,
          provider: z.enum(["all", ...providerIds]).default("all"),
          status: z
            .enum(["all", "succeeded", "failed", "interrupted", "running"])
            .default("all"),
          q: z.string().max(500).default(""),
          page: z.coerce.number().int().min(1).max(100000).default(1),
          export: z.literal("true").optional(),
        })
        .parse(req.query);
      const result = await readActivity(obs, since(input.days), input);
      if (input.export && result.total > 10000)
        throw new ObservationError(
          413,
          "Exports support up to 10,000 requests. Narrow the date range or filters.",
        );
      res.json(result);
    }),
  );
  app.get(
    "/api/account/connection",
    route(async (_req, res) =>
      res.json({
        clients: await connections(obs.db),
        providers: Object.fromEntries(
          Object.entries(config.keys).map(([name, key]) => [
            name,
            Boolean(key),
          ]),
        ),
        sessionBudgetMicros: config.agentSessionBudgetMicros,
        requestsPerMinute: config.rpm,
        routing: "explicit_agent_selection",
        heartbeat: false,
      }),
    ),
  );
}
