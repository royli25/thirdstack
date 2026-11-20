import { AllowanceError, allowanceOwnerAction } from "./account-allowance.js";
import { WalletError } from "./wallet.js";
import { SettingsBusyError } from "./provider-settings-gate.js";
import { ApiKeyError } from "./api-keys.js";
import { ConnectorError } from "./connectors.js";
import { discoveryInput } from "./tool-discovery.js";
import { observationListItem } from "./observation-types.js";
import {
  clientIdentity,
  recordConnection,
  connections,
} from "./observation-connections.js";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import {
  Observatory,
  ObservationError,
  sessionInput,
  agentSessionInput,
  outcomeInput,
  evaluationInput,
} from "./observation.js";
export function observationRoutes(app: Express, obs: Observatory) {
  const route =
    (fn: (req: Request, res: Response) => unknown) =>
    async (req: Request, res: Response) => {
      try {
        const reportedClient = req.header("X-APILayer-MCP-Client");
        if (reportedClient) {
          if (reportedClient.length > 2000)
            throw new ObservationError(400, "Invalid MCP client identity.");
          let parsed: unknown;
          try {
            parsed = JSON.parse(
              Buffer.from(reportedClient, "base64url").toString("utf8"),
            );
          } catch {
            throw new ObservationError(400, "Invalid MCP client identity.");
          }
          await recordConnection(
            obs.db,
            clientIdentity.parse(parsed),
            req.params.id ? String(req.params.id) : undefined,
          );
        }
        await fn(req, res);
      } catch (e) {
        if (e instanceof AllowanceError)
          res.status(e.status).json({
            error: e.message,
            code: e.code,
            operatorAllowance: e.operatorAllowance,
            // Present only for a refused paid call, not for admin errors.
            ...(e.operatorAllowance
              ? { ownerAction: allowanceOwnerAction(e.operatorAllowance) }
              : {}),
          });
        else if (e instanceof WalletError)
          res.status(e.status).json({
            error: e.message,
            code: e.code,
            wallet: e.wallet,
            ownerAction: e.ownerAction,
          });
        else if (e instanceof z.ZodError)
          res.status(400).json({
            error: e.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; "),
          });
        else if (
          e instanceof ObservationError ||
          e instanceof ApiKeyError ||
          e instanceof ConnectorError ||
          e instanceof SettingsBusyError
        )
          res.status(e.status).json({ error: e.message });
        else
          res.status(500).json({
            error: "Observation operation failed. No automatic retry was made.",
          });
      }
    };
  app.get(
    "/api/observations/connection",
    route(async (_req, res) => {
      const clients = await connections(obs.db);
      res.json({
        ...clients[0],
        lastSeenAt: clients[0]?.lastSeenAt ?? null,
        clientName: clients[0]?.clientName ?? null,
        clients,
        liveStatus: "Last observed request; not a live heartbeat",
      });
    }),
  );
  app.post(
    "/api/observations/connection",
    route(async (req, res) =>
      res.json(await recordConnection(obs.db, clientIdentity.parse(req.body))),
    ),
  );
  app.get(
    "/api/observations",
    route(async (_req, res) =>
      res.json((await obs.db.list()).map(observationListItem)),
    ),
  );
  app.get(
    "/api/observations/route-decisions",
    route(async (_req, res) => res.json(await obs.routeDecisions())),
  );
  app.get(
    "/api/observations/summary",
    route(async (_req, res) => res.json(await obs.summary())),
  );
  app.get(
    "/api/observations/catalog",
    route(async (_req, res) =>
      res.json(await obs.catalog(res.locals.apiKeyId)),
    ),
  );
  app.get(
    "/api/observations/connector-tools",
    route(async (_req, res) => res.json(await obs.connectorTools())),
  );
  app.get(
    "/api/observations/aggregate",
    route(async (_req, res) => res.json(await obs.commercialAggregate())),
  );
  app.post(
    "/api/observations",
    route(async (req, res) =>
      res
        .status(201)
        .json(
          await obs.create(sessionInput.parse(req.body), "operator_entered"),
        ),
    ),
  );
  app.post(
    "/api/observations/agent-sessions",
    route(async (req, res) =>
      res
        .status(201)
        .json(
          await obs.createAgentSession(
            agentSessionInput.parse(req.body),
            res.locals.apiKeyId,
          ),
        ),
    ),
  );
  app.post(
    "/api/observations/proposals",
    route(async (req, res) =>
      res
        .status(201)
        .json(await obs.create(sessionInput.parse(req.body), "agent_reported")),
    ),
  );
  app.get(
    "/api/observations/:id",
    route(async (req, res) => {
      const s = await obs.db.detail(String(req.params.id));
      if (!s) throw new ObservationError(404, "Session not found.");
      res.json(s);
    }),
  );
  app.get(
    "/api/observations/:id/calls/:callId",
    route(async (req, res) => {
      await obs.require(String(req.params.id));
      const call = (await obs.db.calls(String(req.params.id))).find(
        (c) => c.id === req.params.callId,
      );
      if (!call)
        throw new ObservationError(404, "Tool call not found in this session.");
      res.json({ ...call, cached: true });
    }),
  );
  app.post(
    "/api/observations/:id/approve",
    route(async (req, res) => {
      const input = z
        .object({ intentHash: z.string().length(64) })
        .strict()
        .parse(req.body);
      res.json(await obs.approve(String(req.params.id), input.intentHash));
    }),
  );
  app.post(
    "/api/observations/:id/discover",
    route(async (req, res) => {
      const input = discoveryInput.parse(req.body);
      res.json(
        await obs.discover(
          String(req.params.id),
          input,
          undefined,
          res.locals.apiKeyId,
        ),
      );
    }),
  );
  app.post(
    "/api/observations/:id/call",
    route(async (req, res) =>
      res.json(
        await obs.execute(String(req.params.id), req.body, res.locals.apiKeyId),
      ),
    ),
  );
  app.post(
    "/api/observations/:id/connector-call",
    route(async (req, res) =>
      res.json(
        await obs.connectorCall(
          String(req.params.id),
          req.body,
          res.locals.apiKeyId,
        ),
      ),
    ),
  );
  app.post(
    "/api/observations/:id/route",
    route(async (req, res) =>
      res.json(
        await obs.route(String(req.params.id), req.body, res.locals.apiKeyId),
      ),
    ),
  );
  app.post(
    "/api/observations/:id/outcome",
    route(async (req, res) =>
      res.json(
        await obs.outcome(String(req.params.id), outcomeInput.parse(req.body)),
      ),
    ),
  );
  app.post(
    "/api/observations/:id/evaluate",
    route(async (req, res) =>
      res.json(
        await obs.evaluate(
          String(req.params.id),
          evaluationInput.parse(req.body),
        ),
      ),
    ),
  );
  app.post(
    "/api/observations/:id/consent",
    route(async (req, res) => {
      const { consent } = z
        .object({ consent: z.boolean() })
        .strict()
        .parse(req.body);
      res.json(await obs.consent(String(req.params.id), consent));
    }),
  );
  app.post(
    "/api/observations/:id/cases",
    route(async (req, res) => {
      const input = z
        .object({
          evaluationId: z.string().uuid(),
          reason: z.string().trim().min(10).max(4000),
        })
        .strict()
        .parse(req.body);
      res.json(
        await obs.openCase(
          String(req.params.id),
          input.evaluationId,
          input.reason,
        ),
      );
    }),
  );
  app.post(
    "/api/observations/:id/cases/:caseId",
    route(async (req, res) => {
      const input = z
        .object({
          status: z.enum(["resolved", "dismissed"]),
          resolution: z.string().trim().min(10).max(4000),
        })
        .strict()
        .parse(req.body);
      res.json(
        await obs.resolveCase(
          String(req.params.id),
          String(req.params.caseId),
          input.status,
          input.resolution,
        ),
      );
    }),
  );
  app.get(
    "/api/observations/:id/export",
    route(async (req, res) => {
      const s = await obs.db.detail(String(req.params.id));
      if (!s) throw new ObservationError(404, "Session not found.");
      res.json({
        version: "observation-summary-v1",
        exportedAt: new Date().toISOString(),
        id: s.id,
        intentHash: s.intentHash,
        approvedAt: s.approvedAt,
        authorizationSource:
          s.authorizationSource ?? (s.approvedAt ? "workspace_operator" : null),
        status: s.status,
        createdAt: s.createdAt,
        estimatedMicros: s.spentMicros,
        budgetMicros: s.budgetMicros,
        reservedMicros: s.reservedMicros,
        modelLabelIncluded: false,
        modelSource: s.modelSource,
        integrity: s.integrity,
        integrityScope:
          "Local hash chain consistency; not independent attestation",
        calls: s.calls.map((c) => ({
          id: c.id,
          tool: c.tool,
          status: c.status,
          startedAt: c.startedAt,
          finishedAt: c.finishedAt,
          latencyMs: c.latencyMs,
          httpStatus: c.httpStatus,
          estimateMicros: c.estimateMicros,
        })),
        outcomes: s.outcomes.map((o) => ({
          id: o.id,
          at: o.at,
          source: o.source,
        })),
        evaluations: s.evaluations.map((e) => ({
          id: e.id,
          at: e.at,
          outcomeId: e.outcomeId,
          intentHash: e.intentHash,
          source: e.source,
          reviewerKind: e.reviewer?.kind || "unspecified",
          score: e.score,
          coverage: e.coverage,
        })),
        cases: s.cases.map((c) => ({
          id: c.id,
          evaluationId: c.evaluationId,
          status: c.status,
          at: c.at,
        })),
        chainHead: s.events.at(-1)?.hash,
        commercialConsent: s.commercialConsent,
        includesResearchContent: false,
      });
    }),
  );
  app.post(
    "/api/observations/:id/delete",
    route(async (req, res) => {
      await obs.db.transaction(async () => {
        const s = await obs.require(String(req.params.id));
        if (req.body?.confirmSessionId !== s.id)
          throw new ObservationError(
            400,
            "Confirm this session ID to delete its local records.",
          );
        if ((await obs.db.calls(s.id)).some((c) => c.status === "running"))
          throw new ObservationError(409, "Wait for active calls to finish.");
        await obs.db.remove(s.id);
      });
      res.json({ ok: true });
    }),
  );
}
