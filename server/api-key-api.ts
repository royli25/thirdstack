import type { Express, Request, Response } from "express";
import { config } from "./config.js";
import { z } from "zod";
import { ApiKeyService, ApiKeyError } from "./api-keys.js";
import { API_KEY_SCOPES, API_KEY_TOOLS } from "./api-key-types.js";
export function apiKeyRoutes(
  app: Express,
  keys: ApiKeyService,
  accountAuth = false,
) {
  const handle =
    (fn: (req: Request, res: Response) => unknown) =>
    async (req: Request, res: Response) => {
      try {
        if (res.locals.apiKeyId)
          throw new ApiKeyError(
            403,
            "Only a signed-in account or local owner can manage API keys.",
          );
        if (req.method !== "GET" && !accountAuth && config.token.length < 24)
          throw new ApiKeyError(
            503,
            "Configure a local owner token of at least 24 characters before issuing API keys.",
          );
        await fn(req, res);
      } catch (e) {
        if (e instanceof z.ZodError)
          res
            .status(400)
            .json({ error: e.issues.map((i) => i.message).join("; ") });
        else if (e instanceof ApiKeyError)
          res.status(e.status).json({ error: e.message });
        else
          res.status(500).json({
            error:
              "API key operation failed. Refresh the key list before retrying.",
          });
      }
    };
  app.get(
    "/api/account/api-keys",
    handle(async (_req, res) =>
      res.json({
        enabled: accountAuth || config.token.length >= 24,
        unavailableReason:
          !accountAuth && config.token.length < 24
            ? "Protect this account with an owner access token before issuing agent keys."
            : null,
        workspaceId: keys.workspaceId,
        keys: await keys.list(),
        scopes: API_KEY_SCOPES,
        tools: API_KEY_TOOLS,
        accountModel: accountAuth ? "authenticated_account" : "local_account",
        limitBasis: "configured_provider_estimates",
      }),
    ),
  );
  app.post(
    "/api/account/api-keys",
    handle(async (req, res) =>
      res.status(201).json(await keys.create(req.body)),
    ),
  );
  app.get(
    "/api/account/api-keys/:id",
    handle(async (req, res) => {
      const id = z.uuid().parse(req.params.id);
      res.json({ key: await keys.get(id), events: await keys.events(id) });
    }),
  );
  app.post(
    "/api/account/api-keys/:id",
    handle(async (req, res) =>
      res.json(await keys.update(z.uuid().parse(req.params.id), req.body)),
    ),
  );
  app.post(
    "/api/account/api-keys/:id/revoke",
    handle(async (req, res) =>
      res.json(await keys.revoke(z.uuid().parse(req.params.id), req.body)),
    ),
  );
}
