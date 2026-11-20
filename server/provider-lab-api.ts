import { AllowanceError } from "./account-allowance.js";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { ObservationError } from "./observation.js";
import { SettingsBusyError } from "./provider-settings-gate.js";
import type { ProviderLab } from "./provider-lab.js";
export function providerLabRoutes(app: Express, lab: ProviderLab) {
  const route =
    (fn: (req: Request, res: Response) => unknown) =>
    async (req: Request, res: Response) => {
      try {
        await fn(req, res);
      } catch (e) {
        if (e instanceof AllowanceError)
          res.status(e.status).json({
            error: e.message,
            code: e.code,
            operatorAllowance: e.operatorAllowance,
          });
        else if (e instanceof z.ZodError)
          res
            .status(400)
            .json({ error: e.issues.map((i) => i.message).join("; ") });
        else if (
          e instanceof ObservationError ||
          e instanceof SettingsBusyError
        )
          res.status(e.status).json({ error: e.message });
        else
          res.status(500).json({
            error:
              "Provider lab operation failed. No automatic retry was made.",
          });
      }
    };
  app.post(
    "/api/provider-lab/suites",
    route(async (req, res) =>
      res.status(201).json(await lab.suites.save(req.body, randomUUID())),
    ),
  );
  app.post(
    "/api/provider-lab/suites/:id",
    route(async (req, res) =>
      res.json(
        await lab.suites.save(req.body, z.string().uuid().parse(req.params.id)),
      ),
    ),
  );
  app.post(
    "/api/provider-lab/replays",
    route(async (req, res) => res.status(201).json(await lab.replay(req.body))),
  );
  app.get(
    "/api/provider-lab",
    route(async (_req, res) => res.json(await lab.overview())),
  );
  app.post(
    "/api/provider-lab/runs",
    route(async (req, res) => res.status(202).json(await lab.start(req.body))),
  );
  app.get(
    "/api/provider-lab/runs/:id",
    route(async (req, res) => res.json(await lab.get(String(req.params.id)))),
  );
  app.post(
    "/api/provider-lab/runs/:id/stop",
    route(async (req, res) => {
      z.object({}).strict().parse(req.body);
      res.json(await lab.cancel(String(req.params.id)));
    }),
  );
  app.post(
    "/api/provider-lab/runs/:id/calls/:callId/review",
    route(async (req, res) =>
      res.json(
        await lab.review(
          String(req.params.id),
          String(req.params.callId),
          req.body,
        ),
      ),
    ),
  );
  app.post(
    "/api/provider-lab/experiments",
    route(async (req, res) =>
      res.status(201).json(await lab.saveExperiment(req.body)),
    ),
  );
  app.post(
    "/api/provider-lab/experiments/:id",
    route(async (req, res) =>
      res.json(await lab.saveExperiment(req.body, String(req.params.id))),
    ),
  );
}
