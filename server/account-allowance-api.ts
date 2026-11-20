import { PostgresDatabase } from "./database.js";
import express, { type Express } from "express";
import { z } from "zod";
import { type Accounts, AccountError } from "./accounts.js";
import { accountFailure, sameOriginWrite } from "./account-api.js";
import { AllowanceError } from "./account-allowance.js";
import type { Store } from "./store.js";
/** Global operator administration, independent of a customer account or preview role. */
export function accountAllowanceAdminRoutes(
  app: Express,
  store: Store,
  accounts?: Accounts,
) {
  const router = express.Router();
  router.use(async (req, res, next) => {
    try {
      if (!accounts)
        throw new AccountError(503, "Hosted account access is required.");
      if (!sameOriginWrite(req, res)) return;
      const identity = await accounts.identity(req);
      accounts.assertAdmin(identity);
      if (!accounts.isAdmin(identity.userId))
        throw new AccountError(
          403,
          "Platform administrator access is required.",
        );
      res.locals.allowanceAdmin = identity.userId;
      next();
    } catch (error) {
      accountFailure(error, res);
    }
  });
  router.use(express.json({ limit: "8kb" }));
  const handle =
    (fn: express.RequestHandler): express.RequestHandler =>
    async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        if (error instanceof AllowanceError)
          res.status(error.status).json({
            error: error.message,
            code: error.code,
            ...(error.operatorAllowance
              ? { operatorAllowance: error.operatorAllowance }
              : {}),
          });
        else if (error instanceof z.ZodError)
          res
            .status(400)
            .json({ error: error.issues.map((i) => i.message).join("; ") });
        else
          res.status(503).json({
            error:
              "Account allowance could not be verified. No automatic retry was made.",
          });
      }
    };
  router.get(
    "/",
    handle(async (req, res) => {
      res.json(
        await store.allowance.list(
          req.query.after === undefined
            ? undefined
            : z.string().parse(req.query.after),
        ),
      );
    }),
  );
  router.post(
    "/:id",
    handle(async (req, res) => {
      const accountId = z.uuid().parse(req.params.id);
      if (!accounts || !(store.db instanceof PostgresDatabase))
        throw new AllowanceError(503, "Hosted account access is required.");
      const result = await store.db.pool.query<{ id: string }>(
        `SELECT id FROM auth.users
         WHERE id=$1 AND deleted_at IS NULL AND email_confirmed_at IS NOT NULL
           AND (banned_until IS NULL OR banned_until<=now())`,
        [accountId],
      );
      if (!result.rows[0]) throw new AllowanceError(404, "Account not found.");
      res.json(
        await store.allowance.change(
          await accounts.personalAccountScope({ userId: accountId }),
          res.locals.allowanceAdmin,
          req.body,
        ),
      );
    }),
  );
  app.use("/api/admin/account-allowances", router);
}
