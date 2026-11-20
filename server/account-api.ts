import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { z } from "zod";
import { Accounts, AccountError, type VerifiedIdentity } from "./accounts.js";
import { ApiKeyError, requiredApiKeyScope } from "./api-keys.js";
import type { Store } from "./store.js";
import type { McpOAuth } from "./mcp-oauth.js";
export function sameOriginWrite(req: Request, res: Response): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return true;
  try {
    const origin = req.header("origin");
    if (origin && new URL(origin).host !== req.headers.host) throw new Error();
  } catch {
    res.status(403).json({ error: "Cross-origin writes are not allowed" });
    return false;
  }
  if (!req.is("application/json")) {
    res.status(415).json({ error: "JSON content type required" });
    return false;
  }
  return true;
}
export function accountFailure(error: unknown, res: Response) {
  if (error instanceof AccountError || error instanceof ApiKeyError)
    res.status(error.status).json({
      error: error.message,
      ...(error instanceof AccountError && error.code
        ? { code: error.code }
        : {}),
    });
  else if (error instanceof z.ZodError)
    res
      .status(400)
      .json({ error: error.issues.map((i) => i.message).join("; ") });
  else
    res.status(503).json({
      error: "Account access could not be verified. Try again shortly.",
    });
}
/** Keep the verified actor; restrict company preview to one explicit target per request. */
export function accountPreviewAccess(accounts: Accounts) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const role = req.header("x-octolab-preview");
    const targetHeader = req.header("x-octolab-preview-target");
    if (!role && !targetHeader) return next();
    try {
      if (role !== "user" && role !== "company")
        throw new AccountError(400, "Unknown preview role.");
      const identity = await accounts.identity(req);
      if (!accounts.isPlatformAdmin(identity.userId))
        throw new AccountError(
          403,
          "Only administrators can preview another role.",
        );
      // User preview removes admin powers and uses the administrator’s own personal account.
      if (targetHeader && role !== "company")
        throw new AccountError(
          400,
          "A company target requires company preview.",
        );
      if (role === "company" && !targetHeader)
        throw new AccountError(400, "Choose a company to preview.");
      const target = targetHeader
        ? await accounts.companies.resolvePreviewTarget(identity, targetHeader)
        : undefined;
      if (target) {
        const path = normalizedPath(req);
        const metadata =
          ["/auth/me", "/auth/config", "/auth/preview-targets"].includes(
            path,
          ) && ["GET", "HEAD"].includes(req.method);
        const selectedCompany =
          target.kind === "company" &&
          new RegExp(
            `^/companies/${target.id}(?:/(?:insights|members|access-history|resubmit))?$`,
          ).test(path);
        const providerInsights =
          target.kind === "provider" &&
          path === "/auth/preview-insights" &&
          ["GET", "HEAD"].includes(req.method);
        if (!metadata && !selectedCompany && !providerInsights)
          throw new AccountError(
            403,
            "This action is outside the selected company preview. Return to admin to continue.",
          );
      }
      accounts.previewScope.run(
        { role, actorId: identity.userId, target },
        next,
      );
    } catch (error) {
      accountFailure(error, res);
    }
  };
}
export function accountRoutes(
  app: Express,
  accounts?: Accounts,
  oauth?: McpOAuth,
) {
  app.get("/api/auth/config", (_req, res) =>
    res.json(
      accounts
        ? {
            ...accounts.publicConfig(),
            ...(oauth?.settings
              ? { oauth: { resource: oauth.settings.resource } }
              : {}),
          }
        : { enabled: false },
    ),
  );
  if (!accounts) return;
  const router = express.Router();
  router.use(async (req, res, next) => {
    try {
      if (!sameOriginWrite(req, res)) return;
      res.locals.account = await accounts.identity(req);
      next();
    } catch (error) {
      accountFailure(error, res);
    }
  });
  router.use(express.json({ limit: "12kb" }));
  router.get("/me", async (_req, res) => {
    try {
      res.json(await accounts.profile(res.locals.account));
    } catch (error) {
      accountFailure(error, res);
    }
  });
  router.get("/preview-targets", async (_req, res) => {
    try {
      res.json(await accounts.companies.previewTargets(res.locals.account));
    } catch (error) {
      accountFailure(error, res);
    }
  });
  router.get("/preview-insights", async (_req, res) => {
    try {
      const context = accounts.previewScope.getStore();
      if (
        context?.target?.kind !== "provider" ||
        context.actorId !== res.locals.account.userId
      )
        throw new AccountError(
          403,
          "Select an integrated provider to preview.",
        );
      res.json(
        await accounts.companies.aggregateInsights(context.target.providerId!),
      );
    } catch (error) {
      accountFailure(error, res);
    }
  });
  // Set this account's type (business or user) once, right after the first sign-in.
  router.post("/account-type", async (req, res) => {
    try {
      res.json(await accounts.chooseAccountType(res.locals.account, req.body));
    } catch (error) {
      accountFailure(error, res);
    }
  });
  router.post("/companies", async (req, res) => {
    try {
      // Only business accounts can register a tool company.
      await accounts.assertAccountType(res.locals.account, "business");
      res
        .status(201)
        .json(await accounts.companies.register(res.locals.account, req.body));
    } catch (error) {
      accountFailure(error, res);
    }
  });
  router.use((_req, res) => {
    res.status(404).json({ error: "Account route not found." });
  });
  app.use("/api/auth", router);
}
export function accountAccess(
  accounts: Accounts,
  store: Store,
  keys: import("./api-keys.js").ApiKeyService,
  oauth?: McpOAuth,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!sameOriginWrite(req, res)) return;
      const path = normalizedPath(req);
      const credential =
        req.header("authorization")?.replace(/^Bearer /, "") || "";
      if (credential.startsWith("oct_key_")) {
        const workspaceId = await accounts.keyAccountScope(credential);
        await store.scope.run(workspaceId, async () => {
          const key = await keys.authenticate(credential),
            scope = requiredApiKeyScope(req.method, `/api${path}`);
          if (!scope || !key.scopes.includes(scope))
            throw new ApiKeyError(
              403,
              "This API key does not permit this operation.",
            );
          res.locals.apiKeyId = key.id;
          store.actorScope.run({ kind: "api_key", id: key.id }, next);
        });
        return;
      }
      const identity = await accounts.identity(req, true);
      if (identity.oauthClientId) {
        if (!oauth || !requiredApiKeyScope(req.method, `/api${path}`))
          throw new AccountError(
            403,
            "This agent connection does not permit this operation.",
          );
        const workspace = await oauth.workspace(identity);
        store.scope.run(workspace, () =>
          store.actorScope.run({ kind: "account", id: identity.userId }, next),
        );
        return;
      }
      await accounts.assertAccountType(identity, "user");
      if (!accounts.isAdmin(identity.userId) && operatorRestricted(req, path))
        throw new AccountError(
          403,
          "Administrator access is required for this operator action.",
        );
      const accountScope = await accounts.personalAccountScope(identity);
      res.locals.account = identity;
      store.scope.run(accountScope, () =>
        store.actorScope.run({ kind: "account", id: identity.userId }, next),
      );
    } catch (error) {
      accountFailure(error, res);
    }
  };
}
function normalizedPath(req: Request) {
  try {
    return (
      decodeURIComponent(req.path).toLowerCase().replace(/\/+$/, "") || "/"
    );
  } catch {
    throw new AccountError(400, "Invalid request path.");
  }
}
function operatorRestricted(req: Request, path: string) {
  if (
    path.startsWith("/provider-lab") ||
    path.startsWith("/company-insights") ||
    path.startsWith("/seller") ||
    path.startsWith("/provider-activity") ||
    path === "/observations/aggregate"
  )
    return true;
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return false;
  if (
    path.startsWith("/tasks") ||
    ["/observations", "/observations/proposals"].includes(path)
  )
    return true;
  return /^\/observations\/[^/]+\/(?:approve|evaluate|consent|cases)(?:\/|$)/i.test(
    path,
  );
}
export function adminAccountAccess(accounts: Accounts, store: Store) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!sameOriginWrite(req, res)) return;
      const identity: VerifiedIdentity = await accounts.identity(req);
      accounts.assertAdmin(identity);
      if (!accounts.isAdmin(identity.userId))
        throw new AccountError(
          403,
          "Administrator access is required for payment review.",
        );
      res.locals.adminActor = `account ${identity.userId}`;
      store.actorScope.run({ kind: "account", id: identity.userId }, next);
    } catch (error) {
      accountFailure(error, res);
    }
  };
}

/** Company and global admin operations require account identity, independent of personal data access. */
export function companyAccountRoutes(app: Express, accounts?: Accounts) {
  if (!accounts) return;
  const router = express.Router();
  router.use(async (req, res, next) => {
    if (!/^\/(?:companies|admin\/companies)(?:\/|$)/i.test(req.path)) {
      next("router");
      return;
    }
    try {
      if (!sameOriginWrite(req, res)) return;
      res.locals.account = await accounts.identity(req);
      // Company pages are for business accounts. /admin/companies stays admin-only.
      if (/^\/companies(?:\/|$)/i.test(req.path))
        await accounts.assertAccountType(res.locals.account, "business");
      next();
    } catch (error) {
      accountFailure(error, res);
    }
  });
  router.use(express.json({ limit: "12kb" }));
  const route =
    (fn: (req: Request, res: Response) => Promise<unknown>) =>
    async (req: Request, res: Response) => {
      try {
        await fn(req, res);
      } catch (error) {
        accountFailure(error, res);
      }
    };
  router.get(
    "/companies/:id",
    route(async (req, res) =>
      res.json(
        await accounts.companies.get(res.locals.account, String(req.params.id)),
      ),
    ),
  );
  router.post(
    "/companies/:id/resubmit",
    route(async (req, res) =>
      res.json(
        await accounts.companies.resubmit(
          res.locals.account,
          String(req.params.id),
          req.body,
        ),
      ),
    ),
  );
  router.get(
    "/companies/:id/members",
    route(async (req, res) =>
      res.json(
        await accounts.companies.team.list(
          res.locals.account,
          String(req.params.id),
        ),
      ),
    ),
  );
  router.post(
    "/companies/:id/members",
    route(async (req, res) =>
      res.json(
        await accounts.companies.team.change(
          res.locals.account,
          String(req.params.id),
          req.body,
        ),
      ),
    ),
  );
  router.get(
    "/companies/:id/access-history",
    route(async (req, res) =>
      res.json(
        await accounts.companies.team.audit(
          res.locals.account,
          String(req.params.id),
        ),
      ),
    ),
  );
  router.get(
    "/companies/:id/insights",
    route(async (req, res) =>
      res.json(
        await accounts.companies.insights(
          res.locals.account,
          String(req.params.id),
        ),
      ),
    ),
  );
  router.get(
    "/admin/companies",
    route(async (req, res) =>
      res.json(await accounts.companies.queue(res.locals.account, req.query)),
    ),
  );
  router.get(
    "/admin/companies/:id/history",
    route(async (req, res) =>
      res.json(
        await accounts.companies.history(
          res.locals.account,
          String(req.params.id),
        ),
      ),
    ),
  );
  router.post(
    "/admin/companies/:id/review",
    route(async (req, res) =>
      res.json(
        await accounts.companies.review(
          res.locals.account,
          String(req.params.id),
          req.body,
        ),
      ),
    ),
  );
  app.use("/api", router);
}
