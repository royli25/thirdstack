/**
 * Management routes for company connectors.
 *
 * Local (SQLite) mode: the single operator registers and reviews at
 * `/api/connectors`, behind the same owner check as every other `/api` route.
 * API keys cannot reach these routes.
 *
 * Hosted (PostgreSQL) mode: an approved company's owner registers and maintains
 * its own connectors at `/api/companies/:companyId/connectors`; analysts can
 * read them. Only platform administrators review, at `/api/admin/connectors`.
 */
import express, {
  type Express,
  type Request,
  type Response,
  type Router,
} from "express";
import { z } from "zod";
import {
  AccountError,
  type Accounts,
  type VerifiedIdentity,
} from "./accounts.js";
import { accountFailure, sameOriginWrite } from "./account-api.js";
import { ConnectorError, view, type ConnectorStore } from "./connectors.js";

type Action = "read" | "write" | "review";
interface Access {
  /** Only this company's connectors; undefined means every connector. */
  companyId?: string | null;
  actor?: string;
  allow(action: Action): void;
}

function fail(error: unknown, res: Response) {
  if (error instanceof ConnectorError)
    res.status(error.status).json({ error: error.message });
  else if (error instanceof z.ZodError)
    res.status(400).json({
      error: error.issues
        .map((i) => `${i.path.join(".") || "input"}: ${i.message}`)
        .join("; "),
    });
  else accountFailure(error, res);
}

function mount(
  router: Router,
  base: string,
  connectors: ConnectorStore,
  resolve: (req: Request, res: Response) => Promise<Access>,
) {
  const route =
    (
      action: Action,
      fn: (req: Request, res: Response, access: Access) => Promise<unknown>,
    ) =>
    async (req: Request, res: Response) => {
      try {
        const access = await resolve(req, res);
        access.allow(action);
        await fn(req, res, access);
      } catch (error) {
        fail(error, res);
      }
    };
  const owned = async (req: Request, access: Access) => {
    const c = await connectors.require(String(req.params.connectorId));
    // Another company's connector is indistinguishable from a missing one.
    if (access.companyId !== undefined && c.companyId !== access.companyId)
      throw new ConnectorError(404, "Connector not found.");
    return c;
  };
  router.get(
    base,
    route("read", async (_req, res, access) =>
      res.json({
        connectors: await connectors.list(
          access.companyId === undefined ? {} : { companyId: access.companyId },
        ),
        tokenStorage: connectors.secrets.available,
      }),
    ),
  );
  if (!base.startsWith("/admin"))
    router.post(
      base,
      route("write", async (req, res, access) =>
        res.status(201).json(
          await connectors.create(req.body, {
            companyId: access.companyId ?? null,
            actor: access.actor,
          }),
        ),
      ),
    );
  router.get(
    `${base}/:connectorId`,
    route("read", async (req, res, access) => {
      const c = await owned(req, access);
      res.json({
        connector: view(c),
        events: await connectors.events(c.id, 50),
      });
    }),
  );
  const update = route("write", async (req, res, access) => {
    const c = await owned(req, access);
    res.json(await connectors.update(c.id, req.body, access.actor));
  });
  router.patch(`${base}/:connectorId`, update);
  // The dashboard's request helper sends POST.
  router.post(`${base}/:connectorId/update`, update);
  router.post(
    `${base}/:connectorId/refresh`,
    route("write", async (req, res, access) => {
      const c = await owned(req, access);
      res.json(await connectors.refresh(c.id, access.actor));
    }),
  );
  router.post(
    `${base}/:connectorId/review`,
    route("review", async (req, res, access) => {
      const c = await owned(req, access);
      res.json(await connectors.review(c.id, req.body, access.actor));
    }),
  );
}

/** The local operator owns and reviews everything. */
export function localConnectorRoutes(app: Express, connectors: ConnectorStore) {
  const router = express.Router();
  mount(router, "/connectors", connectors, async () => ({
    companyId: null,
    actor: "local_operator",
    allow() {},
  }));
  app.use("/api", router);
}

export function hostedConnectorRoutes(
  app: Express,
  accounts: Accounts,
  connectors: ConnectorStore,
) {
  const router = express.Router();
  router.use(async (req, res, next) => {
    if (
      !/^\/(?:companies\/[^/]+\/connectors|admin\/connectors)(?:\/|$)/i.test(
        req.path,
      )
    ) {
      next("router");
      return;
    }
    try {
      if (!sameOriginWrite(req, res)) return;
      res.locals.account = await accounts.identity(req);
      // Company connectors are for business accounts; /admin/connectors stays admin-only.
      if (/^\/companies\//i.test(req.path))
        await accounts.assertAccountType(res.locals.account, "business");
      next();
    } catch (error) {
      accountFailure(error, res);
    }
  });
  router.use(express.json({ limit: "16kb" }));
  mount(
    router,
    "/companies/:companyId/connectors",
    connectors,
    async (req, res) => {
      const identity: VerifiedIdentity = res.locals.account;
      const company = await accounts.companies.get(
        identity,
        String(req.params.companyId),
      );
      if (company.status !== "approved")
        throw new AccountError(
          403,
          "Company approval is required before registering connectors.",
        );
      return {
        companyId: company.id,
        actor: identity.userId,
        allow(action) {
          if (action === "read") return;
          if (
            action === "write" &&
            (company.role === "owner" || company.role === "platform_admin")
          )
            return;
          throw new AccountError(
            403,
            action === "review"
              ? "Only a platform administrator can review a connector."
              : "Only the company owner can change connectors.",
          );
        },
      };
    },
  );
  mount(router, "/admin/connectors", connectors, async (_req, res) => {
    const identity: VerifiedIdentity = res.locals.account;
    accounts.assertAdmin(identity);
    return { actor: identity.userId, allow() {} };
  });
  app.use("/api", router);
}
