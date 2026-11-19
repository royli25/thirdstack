import { staticAssets } from "./static-assets.js";
import {
  providerEntry,
  providerIds,
  searchProviderIds,
} from "./provider-catalog.js";
import { accountAllowanceAdminRoutes } from "./account-allowance-api.js";
import { ToolSettings } from "./tool-settings.js";
import { toolSettingsRoutes } from "./tool-settings-api.js";
import { PostgresDatabase } from "./database.js";
import { SettingsBusyError } from "./provider-settings-gate.js";
import { providerActivity } from "./provider-activity.js";
import { toolCapabilities } from "./provider-capabilities.js";
import { type Accounts } from "./accounts.js";
import {
  accountRoutes,
  accountAccess,
  companyAccountRoutes,
  adminAccountAccess,
  accountPreviewAccess,
} from "./account-api.js";
import express from "express";
import { ApiKeyError, requiredApiKeyScope } from "./api-keys.js";
import { apiKeyRoutes } from "./api-key-api.js";
import { mcpAuthenticator, mountMcpEndpoint } from "./mcp-http.js";
import { McpOAuth, mcpOAuthRoutes } from "./mcp-oauth.js";
import { ConnectorStore, PostgresConnectorDb } from "./connectors.js";
import {
  hostedConnectorRoutes,
  localConnectorRoutes,
} from "./connector-api.js";
import { DisputeReviewService } from "./dispute-review.js";
import { disputeReviewRoutes } from "./dispute-review-api.js";
import { FundingService } from "./funding.js";
import { fundingRoutes, stripeWebhookRoute } from "./funding-api.js";
import { StripeFundingService } from "./stripe-funding.js";
import { accountDataRoutes } from "./account-data-api.js";
import { sanitizedEventData } from "./sanitized.js";
import { analytics } from "./analytics.js";
import { randomUUID, timingSafeEqual, createHash } from "node:crypto";
import { z } from "zod";
import { config, providerAuthMode, providerEnabled } from "./config.js";
import { Store, StorageConflict } from "./store.js";
import { Engine } from "./engine.js";
import type { Task } from "./types.js";
import { publicEvidenceUrl } from "./url-policy.js";
import { acceptedOrganizations, resultCsv } from "./results.js";
import { Observatory } from "./observation.js";
import { observationRoutes } from "./observation-api.js";
import { ProviderLab } from "./provider-lab.js";
import { providerLabRoutes } from "./provider-lab-api.js";
import { companyReport } from "./company-insights.js";
import { sellerReport } from "./seller-report.js";
import {
  sellerRoutes,
  localSellerDeps,
  type SellerDeps,
} from "./seller-api.js";
import { SellerStore, PostgresSellerDb } from "./seller-store.js";
import { hostedSellerRoutes, loadSellerDataHosted } from "./seller-hosted.js";
const domain = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
    "Enter a hostname, such as example.com",
  );
const intentSchema = z.object({
  prompt: z.string().trim().min(10).max(4000),
  query: z.string().trim().min(3).max(500),
  queries: z.array(z.string().trim().min(3).max(500)).min(1).max(5).optional(),
  requiredCount: z.number().int().min(1).max(100),
  budgetMicros: z.number().int().min(1000).max(5000000),
  criteria: z
    .array(z.string().trim().min(3).max(160))
    .min(1)
    .max(8)
    .refine((a) => new Set(a).size === a.length, "Criteria must be unique"),
  domains: z.array(domain).max(10),
  mode: z.enum(["route", "compare"]),
  preference: z.enum(["balanced", "cost", "latency"]),
  consent: z.boolean(),
});
function publicTask(t: Task) {
  return {
    id: t.id,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    status: t.status,
    query: t.intent.query,
    spentMicros: t.spentMicros,
    budgetMicros: t.intent.budgetMicros,
    sourceCount: t.sources.length,
  };
}
export function createApp(
  store: Store,
  engine = new Engine(store),
  observatory = new Observatory(store, undefined, engine.timestamps),
  providerLab = new ProviderLab(store, undefined, engine.timestamps),
  funding = new FundingService(store),
  stripeFunding = new StripeFundingService(funding),
  accounts?: Accounts,
  toolSettings = new ToolSettings(
    store.db instanceof PostgresDatabase ? store.db : undefined,
  ),
) {
  const app = express();
  app.locals.apiKeys = observatory.db.apiKeys;
  app.locals.funding = funding;
  app.locals.stripeFunding = stripeFunding;
  app.locals.providerLab = providerLab;
  app.locals.toolSettings = toolSettings;
  // Startup failures are observed by health/startup; never create an unhandled rejection.
  void toolSettings.ready.catch(() => {});
  observatory.controlledSamples = async () =>
    await providerLab.controlledSamples();
  app.disable("x-powered-by");
  const oauth = accounts ? new McpOAuth(accounts) : undefined;
  app.locals.oauth = oauth;
  app.use((_req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
      "Content-Security-Policy": `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'${accounts ? " " + new URL(accounts.settings.url).origin : ""}; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`,
    });
    next();
  });
  // Existing agents can keep calling the previously published account endpoints.
  app.use("/api", (req, _res, next) => {
    req.url = req.url.replace(/^\/workspace(?=\/)/i, "/account");
    next();
  });
  app.get("/healthz", async (_req, res) => {
    await toolSettings.ready;
    await store.db.prepare("SELECT 1").get();
    res.json({ ok: true });
  });
  // Remote MCP (Streamable HTTP). Mounted before the global JSON parser and the
  // browser fallback; tool operations re-enter `/api` with the caller's credential.
  app.locals.mcp = mountMcpEndpoint(
    app,
    mcpAuthenticator({
      store,
      apiKeys: observatory.db.apiKeys,
      accounts,
      oauth,
    }),
    {},
    oauth?.settings?.metadata,
  );
  mcpOAuthRoutes(app, oauth);
  app.get("/api/public/catalog", (_req, res) =>
    res.json(
      Object.entries(toolCapabilities).map(([tool, capability]) => {
        const provider = tool.split("_")[0] as import("./types.js").ProviderId;
        return {
          tool,
          provider,
          description: capability.description,
          available:
            providerEnabled(provider) &&
            (!!config.keys[provider] ||
              (provider === "firecrawl" && config.allowKeylessFirecrawl)),
          estimatedMicros: config.prices[provider],
        };
      }),
    ),
  );
  if (accounts) app.use("/api", accountPreviewAccess(accounts));
  accountRoutes(app, accounts, oauth);
  const sellers = new SellerStore(
    store.db instanceof PostgresDatabase
      ? new PostgresSellerDb(store.db.pool)
      : store,
  );
  app.locals.sellers = sellers;
  const sellerDeps: SellerDeps =
    store.db instanceof PostgresDatabase
      ? {
          loadData: (
            (pool) => () =>
              loadSellerDataHosted(pool)
          )(store.db.pool),
          sellers,
          simulated: async () => null,
        }
      : localSellerDeps(observatory, sellers);
  // Agents are shown seller-approved listing text wherever a tool is described.
  observatory.listings = async () => await sellers.liveAll();
  if (accounts) hostedSellerRoutes(app, accounts, sellerDeps);
  // Company-supplied MCP connectors share one global catalog in both modes.
  const connectors = (observatory.connectors ??= new ConnectorStore(
    store.db instanceof PostgresDatabase
      ? new PostgresConnectorDb(store.db.pool)
      : store,
  ));
  app.locals.connectors = connectors;
  if (accounts) hostedConnectorRoutes(app, accounts, connectors);
  companyAccountRoutes(app, accounts);
  accountAllowanceAdminRoutes(app, store, accounts);
  toolSettingsRoutes(app, toolSettings, accounts);
  if (accounts)
    stripeFunding.accountScopeForWebhook = (identity) =>
      accounts.paymentAccountScope(identity);
  stripeWebhookRoute(app, stripeFunding);
  disputeReviewRoutes(
    app,
    new DisputeReviewService(stripeFunding),
    accounts ? adminAccountAccess(accounts, store) : undefined,
  );
  if (accounts)
    app.use(
      "/api",
      accountAccess(accounts, store, observatory.db.apiKeys, oauth),
    );
  else
    app.use("/api", async (req, res, next) => {
      if (
        !config.token &&
        !["127.0.0.1", "localhost", "[::1]"].includes(req.hostname)
      ) {
        res.status(403).json({
          error:
            "Unrecognized local host. Set API_TOKEN when using a public hostname.",
        });
        return;
      }
      if (
        config.token.length < 24 &&
        (await observatory.db.apiKeys.hasIssuedKeys())
      ) {
        res.status(503).json({
          error:
            "Scoped key access requires a local owner token of at least 24 characters. Restore owner access before using this account.",
        });
        return;
      }
      const credential =
        req.headers.authorization?.replace(/^Bearer /, "") || "";
      const actual = Buffer.from(credential);
      const expected = Buffer.from(config.token);
      const owner =
        config.token &&
        actual.length === expected.length &&
        timingSafeEqual(actual, expected);
      if (!owner && credential.startsWith("oct_key_")) {
        try {
          const key = await observatory.db.apiKeys.authenticate(credential);
          const scope = requiredApiKeyScope(
            req.method,
            `/api${req.path.replace(/\/+$/, "")}`,
          );
          if (!scope || !key.scopes.includes(scope))
            throw new ApiKeyError(
              403,
              "This API key does not permit this operation.",
            );
          res.locals.apiKeyId = key.id;
        } catch (e) {
          res.status(e instanceof ApiKeyError ? e.status : 401).json({
            error: e instanceof ApiKeyError ? e.message : "Invalid API key.",
          });
          return;
        }
      } else if (!owner && config.token) {
        res
          .status(401)
          .json({ error: "Enter the server access token to connect." });
        return;
      }
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        const origin = req.headers.origin;
        if (
          origin &&
          (() => {
            try {
              return new URL(origin).host !== req.headers.host;
            } catch {
              return true;
            }
          })()
        ) {
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
      next();
    });
  app.use("/api/observations", express.json({ limit: "160kb" }));
  app.use("/api/provider-lab/suites", express.json({ limit: "256kb" }));
  app.use(
    "/api/account/provider-billing/imports",
    express.json({ limit: "256kb" }),
  );
  app.use(express.json({ limit: "24kb" }));
  apiKeyRoutes(app, observatory.db.apiKeys, !!accounts);
  observationRoutes(app, observatory);
  if (!accounts) localConnectorRoutes(app, connectors);
  // Hosted company routes remain scoped to company members; this view is for operators.
  sellerRoutes(app, sellerDeps, { admin: true });
  accountDataRoutes(app, observatory);
  fundingRoutes(app, funding, stripeFunding);
  providerLabRoutes(app, providerLab);
  app.get("/api/provider-activity/:provider", async (req, res) => {
    const provider = z.enum(providerIds).safeParse(req.params.provider),
      days = z.enum(["7", "30", "90"]).safeParse(req.query.days ?? "30");
    if (!provider.success || !days.success) {
      res.status(400).json({
        error: "Choose a supported provider and a 7, 30, or 90 day window.",
      });
      return;
    }
    res.json(
      await providerActivity(observatory, provider.data, Number(days.data)),
    );
  });
  app.get("/api/company-insights/:provider/choices", async (req, res) => {
    const p = z.enum(providerIds).safeParse(req.params.provider);
    const days = z.enum(["7", "30", "90"]).safeParse(req.query.days ?? "30");
    const named = z.enum(["0", "1"]).safeParse(req.query.named ?? "0");
    if (!p.success || !days.success || !named.success) {
      res.status(400).json({
        error: "Choose a supported provider, a 7, 30 or 90 day window.",
      });
      return;
    }
    res.json(
      await sellerReport(observatory, p.data, {
        days: Number(days.data),
        named: named.data === "1",
      }),
    );
  });
  app.get("/api/company-insights/:provider", async (req, res) => {
    const p = z.enum(providerIds).safeParse(req.params.provider);
    const source = z
      .enum(["demo", "local"])
      .safeParse(req.query.source ?? "demo");
    const scope = z
      .enum(["aggregate", "account", "workspace"])
      .safeParse(req.query.scope ?? "aggregate");
    if (!p.success || !source.success || !scope.success) {
      res
        .status(400)
        .json({ error: "Choose a supported provider and data source." });
      return;
    }
    res.json(
      await companyReport(
        p.data,
        source.data,
        observatory,
        providerLab,
        scope.data !== "aggregate",
      ),
    );
  });
  async function idempotency(
    req: express.Request,
    res: express.Response,
    taskId: string,
    operation: string,
    args: unknown,
  ) {
    const key = req.get("Idempotency-Key");
    if (!key) return { handled: false, key: undefined, hash: undefined };
    if (!/^[a-zA-Z0-9._:-]{8,128}$/.test(key)) {
      res.status(400).json({
        error: "Idempotency-Key must be 8–128 opaque identifier characters",
      });
      return { handled: true };
    }
    const hash = createHash("sha256")
      .update(JSON.stringify(args))
      .digest("hex");
    const receipt = await store.receipt(taskId, operation, key);
    if (receipt) {
      if (receipt.argsHash !== hash) {
        res.status(409).json({
          error:
            "This Idempotency-Key was already used for different arguments",
        });
      } else {
        res.status(receipt.status).json({ ...receipt.body, replayed: true });
      }
      return { handled: true };
    }
    return { handled: false, key, hash };
  }
  app.get("/api/health", (_req, res) =>
    res.json({
      ok: true,
      providers: engine.available(),
      providerAuth: Object.fromEntries(
        providerIds.map((p) => [
          p,
          engine.available()[p] ? providerAuthMode(p) : "unconfigured",
        ]),
      ),
      estimates: config.prices,
      rateCardVersion: config.rateCardVersion,
      policyVersion: config.policyVersion,
      minCohort: 0,
      providerIssues: engine.providerIssues(),
    }),
  );
  const taskWrites = new Map<string, Promise<void>>();
  app.use("/api/tasks/:id", async (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      next();
      return;
    }
    const key = `${store.workspaceId}:${req.params.id}`;
    const previous = taskWrites.get(key) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    taskWrites.set(key, current);
    const done = () => {
      release();
      if (taskWrites.get(key) === current) taskWrites.delete(key);
    };
    await previous;
    res.once("finish", done);
    res.once("close", done);
    if (res.destroyed) {
      done();
      return;
    }
    next();
  });
  app.get("/api/tasks", async (_req, res) =>
    res.json((await store.tasks()).map(publicTask)),
  );
  app.post("/api/tasks", async (req, res) => {
    const parsed = intentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
      return;
    }
    if ((await store.tasks()).length >= 500) {
      res.status(409).json({
        error:
          "Local task limit reached. Apply the retention policy before creating more tasks.",
      });
      return;
    }
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      intent: parsed.data,
      createdAt: now,
      updatedAt: now,
      status: "ready",
      spentMicros: 0,
      reservedMicros: 0,
      sources: [],
      assessments: [],
    };
    await store.transaction(async () => {
      await store.save(task);
      await store.event(task.id, "intent_created", {
        ...parsed.data,
        rubricVersion: "user-rubric-v1",
        consentScope: parsed.data.consent
          ? "local task storage and aggregated provider analytics"
          : "local task storage only",
      });
    });
    res.status(201).json(task);
  });
  app.get("/api/tasks/:id", async (req, res) => {
    const task = await store.get(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json({
      ...task,
      events: await store.events(task.id),
      organizations: acceptedOrganizations(task),
    });
  });
  app.post("/api/tasks/:id/sources", async (req, res) => {
    const task = await store.get(req.params.id);
    const taskVersion = JSON.stringify(task);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (engine.active.has(task.id)) {
      res.status(409).json({
        error: "Wait for the active operation to finish before adding evidence",
      });
      return;
    }
    const parsed = z
      .object({
        url: z.string().trim().max(4096),
        title: z.string().trim().max(200).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Provide a valid evidence URL" });
      return;
    }
    let url: string;
    try {
      url = publicEvidenceUrl(parsed.data.url, task.intent.domains);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
      return;
    }
    const existing = task.sources.find((s) => s.url === url);
    if (existing) {
      res.json(existing);
      return;
    }
    if (task.sources.filter((s) => s.provider === "user").length >= 20) {
      res
        .status(409)
        .json({ error: "Limit of 20 manually supplied evidence URLs reached" });
      return;
    }
    const source = {
      id: randomUUID(),
      title: parsed.data.title || new URL(url).hostname,
      url,
      snippet: "",
      provider: "user" as const,
      callId: null,
      contentVersion: 1,
    };
    task.sources.push(source);
    task.updatedAt = new Date().toISOString();
    await store.transaction(async () => {
      await store.saveIfUnchanged(task, taskVersion);
      await store.event(task.id, "evidence_added", {
        sourceId: source.id,
        url,
        origin: "user",
        note: "User-supplied URL; no provider request or verified content yet",
      });
    });
    res.status(201).json(source);
  });
  app.post("/api/tasks/:id/privacy", async (req, res) => {
    const task = await store.get(req.params.id);
    const taskVersion = JSON.stringify(task);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const parsed = z.object({ consent: z.boolean() }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Provide an explicit consent choice" });
      return;
    }
    task.intent.consent = parsed.data.consent;
    task.updatedAt = new Date().toISOString();
    await store.transaction(async () => {
      await store.saveIfUnchanged(task, taskVersion);
      await store.event(task.id, "consent_updated", {
        consent: parsed.data.consent,
        scope: parsed.data.consent
          ? "de-identified local aggregates"
          : "local task storage only",
      });
    });
    res.json({ ok: true, consent: task.intent.consent });
  });
  app.post("/api/tasks/:id/delete", async (req, res) => {
    const task = await store.get(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (req.body?.confirmTaskId !== task.id) {
      res.status(400).json({
        error: "Confirm the exact task ID to delete its local history",
      });
      return;
    }
    if (engine.active.has(task.id) || task.reservedMicros > 0) {
      res.status(409).json({
        error:
          "Stop the active operation and let its ledger settle before deleting",
      });
      return;
    }
    await store.db.prepare("DELETE FROM tasks WHERE id=?").run(task.id);
    res.json({ ok: true });
  });
  app.post("/api/tasks/:id/run", async (req, res) => {
    const task = await store.get(req.params.id);
    const taskVersion = JSON.stringify(task);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const parsed = z
      .object({ query: z.string().trim().min(3).max(500).optional() })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query" });
      return;
    }
    const queries =
      parsed.data.query ?? task.intent.queries ?? task.intent.query;
    const receipt = await idempotency(req, res, task.id, "research.search", {
      queries,
      domains: task.intent.domains,
      mode: task.intent.mode,
    });
    if (receipt.handled) return;
    if (engine.active.has(task.id)) {
      res
        .status(409)
        .json({ error: "This task already has an operation in progress" });
      return;
    }
    if (engine.active.size >= 3) {
      res.status(429).json({
        error: "Three tasks are already running. Try again when one finishes.",
      });
      return;
    }
    if (
      (await store.events(task.id)).filter((e) => e.type === "provider_request")
        .length >= 50
    ) {
      res.status(409).json({
        error:
          "Task safety cap of 50 provider attempts reached. Create a new task to continue.",
      });
      return;
    }
    const available = engine.available();
    if (!searchProviderIds.some((p) => available[p])) {
      res.status(409).json({
        error: `Configure ${searchProviderIds
          .map((p) => providerEntry(p)!.credentialEnv)
          .join(" or ")} on the server before running live research.`,
      });
      return;
    }
    const remaining =
      task.intent.budgetMicros - task.spentMicros - task.reservedMicros;
    if (
      remaining <
      Math.min(
        ...searchProviderIds
          .filter((p) => available[p])
          .map((p) => config.prices[p]),
      )
    ) {
      res
        .status(409)
        .json({ error: "The remaining task budget cannot cover a search." });
      return;
    }
    await store.transaction(async () => {
      if (receipt.key)
        await store.beginReceipt(
          task.id,
          "research.search",
          receipt.key,
          receipt.hash!,
        );
      task.status = "running";
      task.error = undefined;
      task.updatedAt = new Date().toISOString();
      await store.saveIfUnchanged(task, taskVersion);
    });
    engine.active.add(task.id);
    void engine.execute(task.id, queries).then(async () => {
      if (receipt.key)
        await store.finishReceipt(
          task.id,
          "research.search",
          receipt.key,
          202,
          {
            taskId: task.id,
          },
        );
    });
    res.status(202).json({ taskId: task.id });
  });
  app.post("/api/tasks/:id/cancel", async (req, res) => {
    if (!(await store.get(req.params.id))) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json({ requested: await engine.cancel(req.params.id) });
  });
  app.post("/api/tasks/:id/fetch", async (req, res) => {
    const task = await store.get(req.params.id);
    const taskVersion = JSON.stringify(task);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const parsed = z
      .object({ sourceId: z.string().uuid() })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid source ID" });
      return;
    }
    const receipt = await idempotency(req, res, task.id, "research.fetch_url", {
      sourceId: parsed.data.sourceId,
    });
    if (receipt.handled) return;
    if (!engine.available().firecrawl) {
      res.status(409).json({
        error:
          engine.providerIssues().firecrawl ||
          "Configure FIRECRAWL_API_KEY or explicitly enable FIRECRAWL_ALLOW_KEYLESS for capped free extraction",
      });
      return;
    }
    if (engine.active.has(task.id) || engine.active.size >= 3) {
      res.status(409).json({
        error: "An operation is in progress. Try again when it completes.",
      });
      return;
    }
    const previousStatus = task.status;
    await store.transaction(async () => {
      if (receipt.key)
        await store.beginReceipt(
          task.id,
          "research.fetch_url",
          receipt.key,
          receipt.hash!,
        );
      task.status = "running";
      await store.saveIfUnchanged(task, taskVersion);
    });
    engine.active.add(task.id);
    let responseStatus = 200;
    let responseBody: Record<string, unknown> = { ok: true };
    try {
      await engine.fetchUrl(task, parsed.data.sourceId);
    } catch (e) {
      responseStatus = 400;
      responseBody = {
        error: e instanceof Error ? e.message : "Extraction failed",
      };
    } finally {
      engine.active.delete(task.id);
      engine.cancelled.delete(task.id);
      await store.transaction(async () => {
        const fresh = (await store.get(task.id))!;
        fresh.status = previousStatus;
        fresh.updatedAt = new Date().toISOString();
        await store.save(fresh);
        if (receipt.key)
          await store.finishReceipt(
            task.id,
            "research.fetch_url",
            receipt.key,
            responseStatus,
            responseBody,
          );
      });
    }
    res.status(responseStatus).json(responseBody);
  });
  app.post("/api/tasks/:id/assessments", async (req, res) => {
    const task = await store.get(req.params.id);
    const taskVersion = JSON.stringify(task);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const parsed = z
      .object({
        sourceId: z.string().uuid(),
        organization: z.string().trim().max(120),
        criteria: z.record(z.string(), z.enum(["pass", "fail", "unknown"])),
        disposition: z.enum(["accepted", "rejected", "pending"]),
        evidenceVersions: z
          .record(z.string().uuid(), z.number().int().min(1))
          .optional(),
        note: z.string().trim().max(2000),
        evidence: z
          .record(z.string(), z.array(z.string().uuid()).min(1).max(20))
          .optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid assessment" });
      return;
    }
    const a = {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
      evidenceVersions:
        parsed.data.evidenceVersions || ({} as Record<string, number>),
    };
    if (
      !task.sources.some((s) => s.id === a.sourceId) ||
      Object.keys(a.criteria).length !== task.intent.criteria.length ||
      task.intent.criteria.some((c) => !Object.hasOwn(a.criteria, c))
    ) {
      res.status(400).json({
        error:
          "Assessment must reference an existing source and every intent criterion",
      });
      return;
    }
    if (
      a.evidence &&
      (Object.keys(a.evidence).some((c) => !task.intent.criteria.includes(c)) ||
        Object.values(a.evidence)
          .flat()
          .some((id) => !task.sources.some((s) => s.id === id)))
    ) {
      res.status(400).json({
        error: "Evidence links must reference this task’s sources and rubric",
      });
      return;
    }
    if (
      a.disposition === "accepted" &&
      (!a.organization ||
        task.intent.criteria.some((c) => a.criteria[c] !== "pass") ||
        !a.note)
    ) {
      res.status(400).json({
        error:
          "Acceptance requires an organization, all criteria passed, and an evidence note",
      });
      return;
    }
    a.evidence = Object.fromEntries(
      task.intent.criteria.map((c) => [c, a.evidence?.[c] || [a.sourceId]]),
    );
    const referenced = Object.values(a.evidence).flat();
    if (
      a.disposition === "accepted" &&
      referenced.some(
        (id) =>
          a.evidenceVersions[id] !==
          (task.sources.find((s) => s.id === id)!.contentVersion ?? 1),
      )
    ) {
      res.status(409).json({
        error:
          "Evidence changed or its version was not supplied. Reload the task and review the current evidence before accepting.",
      });
      return;
    }
    if (
      a.disposition === "accepted" &&
      referenced.some((id) => {
        const source = task.sources.find((s) => s.id === id)!;
        return (
          source.extraction?.pageStatus !== undefined &&
          source.extraction.pageStatus >= 400
        );
      })
    ) {
      res.status(409).json({
        error:
          "A referenced page returned an HTTP error. Replace or re-extract that evidence before accepting.",
      });
      return;
    }
    a.evidenceVersions = Object.fromEntries(
      Object.values(a.evidence)
        .flat()
        .map((id) => [
          id,
          task.sources.find((s) => s.id === id)!.contentVersion ?? 1,
        ]),
    );
    task.assessments = task.assessments
      .filter((v) => v.sourceId !== a.sourceId)
      .concat(a);
    task.updatedAt = new Date().toISOString();
    await store.transaction(async () => {
      await store.saveIfUnchanged(task, taskVersion);
      await store.event(task.id, "user_feedback", {
        ...a,
        evaluator: "human",
        rubricVersion: "user-rubric-v1",
        evidenceRefs: [task.sources.find((s) => s.id === a.sourceId)!.url],
      });
    });
    res.json({ ok: true });
  });
  app.get("/api/tasks/:id/results", async (req, res) => {
    const task = await store.get(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json({
      organizations: acceptedOrganizations(task),
      requiredCount: task.intent.requiredCount,
      reviewType: "human",
      csv: resultCsv(task),
    });
  });
  app.get("/api/tasks/:id/export", async (req, res) => {
    const task = await store.get(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    // Strict allowlist: no prompts, queries, URLs, content, credentials, organization names or feedback notes.
    const events = (await store.events(task.id)).map((e) => ({
      id: e.id,
      callId: e.callId,
      type: e.type,
      at: e.at,
      ...sanitizedEventData(e.data, e.type),
    }));
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="apilayer-${task.id}.json"`,
    );
    res.json({
      schemaVersion: 1,
      scope: "sanitized task summary",
      id: task.id,
      status: task.status,
      spentMicros: task.spentMicros,
      chargeType: "estimate",
      events,
    });
  });
  app.get("/api/analytics", async (_req, res) =>
    res.json(await analytics(store)),
  );
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API endpoint not found" }),
  );
  staticAssets(app);
  app.get("/{*path}", (_req, res, next) =>
    res
      .set("Cache-Control", "no-cache")
      .sendFile("index.html", { root: "dist" }, (err) =>
        err ? next(err) : undefined,
      ),
  );
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const status =
        err instanceof StorageConflict || err instanceof SettingsBusyError
          ? 409
          : err.type === "entity.too.large"
            ? 413
            : err instanceof SyntaxError
              ? 400
              : 500;
      res.status(status).json({
        error:
          status === 409
            ? err.message
            : status === 413
              ? "Request too large"
              : status === 400
                ? "Invalid JSON"
                : "Internal server error",
      });
    },
  );
  return app;
}
