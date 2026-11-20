import { AsyncLocalStorage } from "node:async_hooks";
import express from "express";
import request from "supertest";
import { describe, it, expect } from "vitest";
import { Accounts, AccountError } from "../server/accounts";
import { Companies } from "../server/companies";
import {
  accountPreviewAccess,
  accountAccess,
  accountFailure,
} from "../server/account-api";

// Exercise real authorization and profile methods with isolated database responses.
function fixture() {
  const accounts = Object.create(Accounts.prototype) as Accounts;
  Object.assign(accounts, {
    settings: { adminUserIds: ["admin"] },
    previewScope: new AsyncLocalStorage(),
    database: {
      pool: {
        query: async (sql: string) =>
          sql.includes("workspace_memberships")
            ? { rows: [{ id: "own" }], rowCount: 1 }
            : { rows: [], rowCount: 0 },
      },
    },
    identity: async (req: express.Request) => {
      const userId = req.header("authorization");
      if (!userId) throw new AccountError(401, "Sign in required.");
      return {
        userId,
        email: "fixture@invalid",
        sessionId: "fixture",
        expiresAt: Date.now() + 60000,
      };
    },
  });
  Object.assign(accounts, { companies: new Companies(accounts) });
  const app = express();
  app.use(accountPreviewAccess(accounts));
  app.get("/profile", async (req, res) => {
    res.json(await accounts.profile(await accounts.identity(req)));
  });
  app.get("/admin", async (req, res) => {
    try {
      await accounts.companies.queue(await accounts.identity(req));
      res.json({ ok: true });
    } catch (e) {
      accountFailure(e, res);
    }
  });
  const store = {
    scope: new AsyncLocalStorage(),
    actorScope: new AsyncLocalStorage(),
  };
  app.use(accountAccess(accounts, store as never, {} as never));
  app.all("/{*path}", (_req, res) =>
    res.json({ scope: store.scope.getStore() }),
  );
  return { app, accounts };
}

describe("administrator role preview", () => {
  it("removes administrator access and restores it without changing the admin account", async () => {
    const { app, accounts } = fixture();
    const [preview, normal] = await Promise.all([
      request(app)
        .get("/profile")
        .set({ authorization: "admin", "X-Octolab-Preview": "user" }),
      request(app).get("/profile").set("authorization", "admin"),
    ]);
    expect(preview.body).toMatchObject({
      isAdmin: false,
      canPreview: true,
      hasPersonalAccount: true,
    });
    expect(normal.body.isAdmin).toBe(true);
    expect(normal.body).not.toHaveProperty("workspaces");
    expect(accounts.isAdmin("admin")).toBe(true);
    const response = await request(app).get("/observations").set({
      authorization: "admin",
      "X-Octolab-Preview": "user",
      "X-Octolab-Workspace": "other",
    });
    expect(response.body).toEqual({ scope: "own" });
  });
  it("enforces operator and company admin restrictions during user preview", async () => {
    const { app } = fixture();
    for (const role of ["user"]) {
      const headers = {
        authorization: "admin",
        "X-Octolab-Preview": role,
        "X-Octolab-Workspace": "own",
      };
      expect(
        (await request(app).get("/observations").set(headers)).status,
      ).toBe(200);
      expect(
        (await request(app).get("/provider-lab").set(headers)).status,
      ).toBe(403);
      expect((await request(app).get("/admin").set(headers)).status).toBe(403);
      expect(
        (await request(app).post("/observations").set(headers).send({})).status,
      ).toBe(403);
    }
  });
  it("rejects non-admin, anonymous, and unsupported preview requests", async () => {
    const { app } = fixture();
    expect(
      (
        await request(app)
          .get("/profile")
          .set({ authorization: "user", "X-Octolab-Preview": "user" })
      ).status,
    ).toBe(403);
    expect(
      (await request(app).get("/profile").set("X-Octolab-Preview", "company"))
        .status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .get("/profile")
          .set({ authorization: "admin", "X-Octolab-Preview": "admin" })
      ).status,
    ).toBe(400);
  });
});
