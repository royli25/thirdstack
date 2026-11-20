import type { Request, Response, Router } from "express";
import { z } from "zod";
import type { Observatory } from "./observation.js";
import type { ProviderId } from "./types.js";
import { providerRegistry } from "./provider-adapters.js";
import { toolCapabilities } from "./provider-capabilities.js";
import { taskTypes, taskTypeLabels } from "./seller-taxonomy.js";
import {
  analyzeSeller,
  loadSellerData,
  type SellerReportOptions,
  type SellerSessionData,
} from "./seller-report.js";
import {
  alerts,
  comparePeriods,
  digest,
  exportCsv,
  exportSections,
  findings,
  listingImpact,
  trend,
} from "./seller-insights.js";
import {
  SellerError,
  lintListing,
  listingInput,
  type SellerStore,
} from "./seller-store.js";

const providers = [
  ...new Set(providerRegistry.list().map((a) => a.provider)),
] as [ProviderId, ...ProviderId[]];
const query = z.object({
  days: z.enum(["7", "30", "90"]).default("30"),
  taskType: z.enum(taskTypes).optional(),
  host: z.string().trim().min(1).max(100).optional(),
});

export type SellerDeps = {
  loadData: () => Promise<SellerSessionData[]>;
  sellers: SellerStore;
  simulated: () => Promise<{ note: string } | null>;
};
export type SellerAction = "read" | "write" | "review";
/** Who is asking, which provider they may see, and what they may do. */
export type SellerAccess = {
  provider: ProviderId;
  actor?: string;
  /** Throws when the action is not permitted. */
  allow(action: SellerAction): void;
  audit?(what: string): Promise<void>;
};
export function localSellerDeps(
  obs: Observatory,
  sellers: SellerStore,
): SellerDeps {
  return {
    loadData: () => loadSellerData(obs),
    sellers,
    simulated: async () => {
      const row = await obs.db.store.db
        .prepare("SELECT body FROM workspace_settings WHERE key='simulation'")
        .get();
      return row ? JSON.parse(row.body as string) : null;
    },
  };
}

/**
 * Everything a tool company uses after it is onboarded. Every response is aggregate:
 * no objective, query, URL, stated reason, answer or session ID leaves through here.
 *
 * The default access trusts the single local operator and addresses a provider
 * directly. Hosted mode supplies `resolve` to bind the request to a company's
 * approved provider and enforce its roles.
 */
export function sellerRoutes(
  app: Pick<Router, "get" | "post" | "put">,
  deps: SellerDeps,
  options: {
    base?: string;
    resolve?: (req: Request, res: Response) => Promise<SellerAccess>;
    fail?: (error: unknown, res: Response) => void;
    /** Operator-only maintenance routes. */
    admin?: boolean;
  } = {},
) {
  const { sellers } = deps;
  const resolve =
    options.resolve ??
    (async (req: Request): Promise<SellerAccess> => {
      const provider = z.enum(providers).safeParse(req.params.provider);
      if (!provider.success)
        throw new SellerError(404, "Unknown tool company.");
      return { provider: provider.data, allow() {} };
    });
  const route =
    (
      action: SellerAction,
      fn: (
        req: Request,
        res: Response,
        provider: ProviderId,
        access: SellerAccess,
      ) => Promise<void>,
      audit?: string,
    ) =>
    async (req: Request, res: Response) => {
      try {
        const access = await resolve(req, res);
        access.allow(action);
        await fn(req, res, access.provider, access);
        if (audit) await access.audit?.(audit);
      } catch (e) {
        if (res.headersSent) return;
        if (e instanceof z.ZodError)
          res.status(400).json({
            error: e.issues[0]?.message ?? "Invalid request.",
            field: e.issues[0]?.path.join(".") || undefined,
          });
        else if (e instanceof SellerError)
          res.status(e.status).json({ error: e.message });
        else if (options.fail) options.fail(e, res);
        else res.status(500).json({ error: "Seller request failed." });
      }
    };
  /** Loads once per request and applies the seller's own settings and the naming rule. */
  async function context(req: Request, provider: ProviderId) {
    const q = query.parse(req.query);
    const settings = await sellers.settings(provider);
    const agreed = new Set<string>();
    for (const p of providers)
      if (p !== provider && (await sellers.settings(p)).namedComparison)
        agreed.add(p);
    const options: SellerReportOptions = {
      days: Number(q.days),
      // Named comparison is mutual: both companies must have agreed.
      named: settings.namedComparison,
      canName: (p) => agreed.has(p),
      taskType: q.taskType,
      host: q.host,
      internalHosts: await sellers.internalHosts(),
    };
    return {
      data: await deps.loadData(),
      settings,
      options,
      simulated: await deps.simulated(),
    };
  }
  const base = options.base ?? "/api/seller/:provider";

  app.get(
    `${base}/overview`,
    route(
      "read",
      async (req, res, provider) => {
        const c = await context(req, provider);
        const compared = comparePeriods(c.data, provider, c.options);
        const found = findings(compared.current);
        const listings = await sellers.listings(provider);
        const { current } = compared;
        res.json({
          provider,
          providerName: current.providerName,
          simulated: c.simulated,
          window: current.window,
          funnel: current.funnel,
          change: compared.change,
          dataQuality: current.dataQuality,
          alerts: alerts(current, compared.previous, c.settings.alerts),
          findings: found.slice(0, 3),
          findingCount: found.length,
          trend: trend(current, current.days > 30 ? "week" : "day"),
          listing: {
            liveVersion:
              listings.find((l) => l.status === "live")?.version ?? 0,
            pendingVersion:
              listings.find((l) => l.status === "pending")?.version ?? null,
          },
          namedComparison: c.settings.namedComparison,
          filters: {
            taskTypes: taskTypes.map((t) => ({
              key: t,
              label: taskTypeLabels[t],
            })),
            hosts: current.hosts.map((h) => h.key),
          },
        });
      },
      "overview",
    ),
  );
  app.get(
    `${base}/report`,
    route(
      "read",
      async (req, res, provider) => {
        const c = await context(req, provider);
        res.json({
          ...analyzeSeller(c.data, provider, c.options),
          simulated: c.simulated,
        });
      },
      "report",
    ),
  );
  app.get(
    `${base}/trend`,
    route("read", async (req, res, provider) => {
      const c = await context(req, provider);
      const bucket = z.enum(["day", "week"]).parse(req.query.bucket ?? "day");
      const a = analyzeSeller(c.data, provider, c.options);
      res.json({
        window: a.window,
        bucket,
        minSample: a.minSample,
        points: trend(a, bucket),
      });
    }),
  );
  app.get(
    `${base}/findings`,
    route("read", async (req, res, provider) => {
      const c = await context(req, provider);
      res.json({
        findings: findings(analyzeSeller(c.data, provider, c.options)),
      });
    }),
  );
  app.get(
    `${base}/alerts`,
    route("read", async (req, res, provider) => {
      const c = await context(req, provider);
      const compared = comparePeriods(c.data, provider, c.options);
      res.json({
        window: compared.current.window,
        thresholds: c.settings.alerts,
        change: compared.change,
        alerts: alerts(compared.current, compared.previous, c.settings.alerts),
      });
    }),
  );
  app.get(
    `${base}/digest`,
    route("read", async (req, res, provider) => {
      const c = await context(req, provider);
      const compared = comparePeriods(c.data, provider, c.options);
      const summary = digest(
        compared,
        findings(compared.current),
        alerts(compared.current, compared.previous, c.settings.alerts),
      );
      if (req.query.format === "text")
        res.type("text/plain").send(summary.text);
      else res.json(summary);
    }),
  );
  app.get(
    `${base}/listing-impact`,
    route("read", async (req, res, provider) => {
      const c = await context(req, provider);
      res.json(
        listingImpact(c.data, provider, await sellers.listings(provider), {
          ...c.options,
          days: 90,
        }),
      );
    }),
  );
  app.get(
    `${base}/export`,
    route(
      "read",
      async (req, res, provider) => {
        const c = await context(req, provider);
        const section = z.enum(exportSections).parse(req.query.section);
        res
          .type("text/csv")
          .attachment(`${provider}-${section}-${c.options.days}d.csv`)
          .send(exportCsv(analyzeSeller(c.data, provider, c.options), section));
      },
      "export",
    ),
  );
  app.get(
    `${base}/listing`,
    route("read", async (_req, res, provider) => {
      const listings = await sellers.listings(provider);
      const tool = providerRegistry.list().find((a) => a.provider === provider)!
        .tool as keyof typeof toolCapabilities;
      const builtIn = toolCapabilities[tool];
      const live = listings.find((l) => l.status === "live");
      res.json({
        tool,
        // What agents are shown right now.
        current: {
          version: live?.version ?? 0,
          description: live?.description ?? builtIn.description,
          useWhen: live?.useWhen ?? builtIn.useWhen,
          limitations: live?.limitations ?? builtIn.limitations,
        },
        pending: listings.find((l) => l.status === "pending") ?? null,
        history: listings,
        limits: { description: 600, useWhen: 400, limitations: 600 },
      });
    }),
  );
  app.post(
    `${base}/listing/check`,
    route("read", async (req, res, provider) => {
      const input = listingInput.parse(req.body);
      const problems = lintListing(provider, input);
      res.json({ ok: !problems.length, problems });
    }),
  );
  app.post(
    `${base}/listing`,
    route("write", async (req, res, provider, access) => {
      res
        .status(201)
        .json(await sellers.submitListing(provider, req.body, access.actor));
    }),
  );
  app.post(
    `${base}/listing/withdraw`,
    route("write", async (req, res, provider, access) => {
      const { version } = z
        .object({ version: z.number().int().min(1) })
        .strict()
        .parse(req.body);
      res.json(await sellers.withdrawListing(provider, version, access.actor));
    }),
  );
  // A reviewer's action. In hosted mode this belongs to platform administrators only.
  app.post(
    `${base}/listing/review`,
    route("review", async (req, res, provider, access) => {
      res.json(await sellers.reviewListing(provider, req.body, access.actor));
    }),
  );
  app.get(
    `${base}/settings`,
    route("read", async (_req, res, provider) => {
      res.json(await sellers.settings(provider));
    }),
  );
  for (const method of ["put", "post"] as const)
    app[method](
      `${base}/settings`,
      route("write", async (req, res, provider, access) => {
        res.json(
          await sellers.updateSettings(provider, req.body, access.actor),
        );
      }),
    );
  app.get(
    `${base}/history`,
    route("read", async (_req, res, provider) => {
      res.json({ events: await sellers.events(provider) });
    }),
  );
  if (!options.admin) return;
  app.get("/api/seller-admin/internal-hosts", async (_req, res) => {
    res.json({ hosts: await sellers.internalHosts() });
  });
  app.put("/api/seller-admin/internal-hosts", async (req, res) => {
    try {
      res.json({ hosts: await sellers.setInternalHosts(req.body?.hosts) });
    } catch {
      res.status(400).json({ error: "Send up to 50 host names." });
    }
  });
}
