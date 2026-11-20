import express, { type Express } from "express";
import { z } from "zod";
import { Accounts, AccountError } from "./accounts.js";
import { sameOriginWrite, accountFailure } from "./account-api.js";
import { SettingsBusyError } from "./provider-settings-gate.js";
import type { ToolSettings } from "./tool-settings.js";
export function toolSettingsRoutes(
  app: Express,
  service: ToolSettings,
  accounts?: Accounts,
) {
  const router = express.Router();
  router.use(async (req, res, next) => {
    try {
      if (!accounts)
        throw new AccountError(
          503,
          "Platform settings require hosted account access.",
        );
      if (!sameOriginWrite(req, res)) return;
      const identity = await accounts.identity(req);
      accounts.assertAdmin(identity);
      res.locals.toolSettingsActor = identity.userId;
      next();
    } catch (error) {
      accountFailure(error, res);
    }
  });
  router.use(express.json({ limit: "16kb" }));
  const handle =
    (fn: express.RequestHandler): express.RequestHandler =>
    async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        if (error instanceof AccountError) accountFailure(error, res);
        else if (error instanceof SettingsBusyError)
          res.status(409).json({ error: error.message });
        else if (error instanceof z.ZodError)
          res.status(400).json({
            error: "Settings are invalid. Check field values and retry.",
          });
        else
          res.status(503).json({
            error:
              "Platform settings could not be saved or loaded. Refresh before retrying. No automatic retry was made.",
          });
      }
    };
  router.get(
    "/",
    handle(async (_req, res) => {
      res.json(await service.view());
    }),
  );
  router.get(
    "/history",
    handle(async (_req, res) => {
      res.json(await service.history());
    }),
  );
  router.post(
    "/",
    handle(async (req, res) => {
      res.json(await service.change(res.locals.toolSettingsActor, req.body));
    }),
  );
  app.use("/api/admin/tool-settings", router);
}
