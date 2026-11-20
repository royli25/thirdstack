import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { Store } from "../server/store";
import { FundingService } from "../server/funding";
import { StripeFundingService } from "../server/stripe-funding";
import { DisputeReviewService } from "../server/dispute-review";
import { FixtureStripeGateway, fixtureStripeSettings } from "./fixtures/stripe";
import { config } from "../server/config";
import { createApp } from "../server/app";
let store: Store,
  stripe: StripeFundingService,
  gateway: FixtureStripeGateway,
  reviews: DisputeReviewService;
let token: string, adminToken: string;
beforeEach(() => {
  store = new Store(":memory:");
  gateway = new FixtureStripeGateway();
  stripe = new StripeFundingService(
    new FundingService(store, {
      enabled: false,
      recipient: "",
      rpcUrl: "https://fixture.invalid",
    }),
    { ...fixtureStripeSettings },
    gateway,
  );
  reviews = new DisputeReviewService(stripe);
  token = config.token;
  adminToken = config.adminToken;
  config.token = "workspace-fixture";
  config.adminToken = "admin-fixture";
});
afterEach(async () => {
  await store.close();
  config.token = token;
  config.adminToken = adminToken;
});
async function disputed() {
  const payment = await stripe.create({
    requestKey: randomUUID(),
    amount: "10",
  });
  gateway.pay(payment.checkoutSessionId!, 0, true);
  await stripe.reconcile(payment.id);
  return await reviews.get(payment.id);
}
const input = (
  c: Awaited<ReturnType<DisputeReviewService["get"]>>,
  extra = {},
) => ({
  requestKey: randomUUID(),
  revision: c.revision,
  evidenceFingerprint: c.evidenceFingerprint,
  status: "reviewed",
  note: "Checked payment proof; retain credit hold.",
  ...extra,
});
describe("admin dispute review workflow", () => {
  it("queues historical disputed payments automatically and keeps ordinary payments out", async () => {
    const ordinary = await stripe.create({
      requestKey: randomUUID(),
      amount: "5",
    });
    await expect(
      (async () => await reviews.get(ordinary.id))(),
    ).rejects.toThrow(/No dispute/);
    const c = await disputed();
    expect((await reviews.list()).items.map((c) => c.payment.id)).toEqual([
      c.payment.id,
    ]);
    expect(c.reviewStatus).toBe("needs_review");
    expect(c.revision).toBe(0);
    expect(c.holdRetained).toBe(true);
  });
  it("saves separate admin status and immutable evidence audit without restoring credits", async () => {
    const c = await disputed();
    const body = input(c);
    const result = await reviews.review(c.payment.id, body, "admin fixture");
    expect(result.item.reviewStatus).toBe("reviewed");
    expect(result.item.revision).toBe(1);
    expect(result.history[0]).toMatchObject({
      actor: "admin fixture",
      previousStatus: "needs_review",
      status: "reviewed",
      revision: 1,
    });
    expect(result.history[0].evidence.disputed).toBe(true);
    expect((await stripe.get(c.payment.id)).status).toBe("disputed");
    expect(await stripe.funding.ledger.balance()).toBe(0);
    expect(await new DisputeReviewService(stripe).detail(c.payment.id)).toEqual(
      result,
    );
  });
  it("replays lost responses once and rejects changed request details or actors", async () => {
    const c = await disputed(),
      body = input(c);
    await reviews.review(c.payment.id, body, "admin A");
    await reviews.review(c.payment.id, body, "admin A");
    expect((await reviews.detail(c.payment.id)).history).toHaveLength(1);
    await expect(
      (async () =>
        await reviews.review(
          c.payment.id,
          { ...body, note: "Changed note for same key." },
          "admin A",
        ))(),
    ).rejects.toThrow(/different details/);
    await expect(
      (async () => await reviews.review(c.payment.id, body, "admin B"))(),
    ).rejects.toThrow(/different details/);
  });
  it("rejects stale review revisions and stale payment evidence", async () => {
    const c = await disputed();
    await reviews.review(
      c.payment.id,
      input(c, { status: "in_review" }),
      "admin A",
    );
    await expect(
      (async () => await reviews.review(c.payment.id, input(c), "admin B"))(),
    ).rejects.toThrow(/changed/);
    const latest = await reviews.get(c.payment.id);
    gateway.pay(c.payment.checkoutSessionId!, 250, true);
    await stripe.reconcile(c.payment.id);
    await expect(
      (async () =>
        await reviews.review(c.payment.id, input(latest), "admin B"))(),
    ).rejects.toThrow(/changed/);
    expect((await reviews.detail(c.payment.id)).history).toHaveLength(1);
  });
  it("reopens reviewed cases only for meaningful financial evidence changes", async () => {
    const c = await disputed();
    await reviews.review(c.payment.id, input(c), "admin");
    await stripe.reconcile(c.payment.id);
    expect((await reviews.get(c.payment.id)).reviewStatus).toBe("reviewed");
    gateway.pay(c.payment.checkoutSessionId!, 100, true);
    await stripe.reconcile(c.payment.id);
    const changed = await reviews.get(c.payment.id);
    expect(changed.reviewStatus).toBe("needs_review");
    expect(changed.evidenceChanged).toBe(true);
    expect(changed.note).toContain("retain credit hold");
    const reviewed = await reviews.review(
      c.payment.id,
      input(changed),
      "admin",
    );
    expect(reviewed.item.evidenceChanged).toBe(false);
    expect(reviewed.history).toHaveLength(2);
  });
  it("records review and audit in one transaction", async () => {
    const c = await disputed();
    await store.db.exec(
      "CREATE TRIGGER fail_admin_audit BEFORE INSERT ON funding_dispute_review_events BEGIN SELECT RAISE(ABORT,'fixture rollback'); END;",
    );
    await expect(
      (async () => await reviews.review(c.payment.id, input(c), "admin"))(),
    ).rejects.toThrow();
    expect((await reviews.get(c.payment.id)).revision).toBe(0);
    expect((await reviews.detail(c.payment.id)).history).toHaveLength(0);
  });
  it("requires bounded notes and refuses unsupported financial actions", async () => {
    const c = await disputed();
    for (const extra of [
      { note: "short" },
      { note: "x".repeat(4001) },
      { status: "restore_credits" },
      { revision: -1 },
      { actor: "fake user" },
    ])
      await expect(
        (async () =>
          await reviews.review(c.payment.id, input(c, extra), "admin"))(),
      ).rejects.toThrow();
    expect(await stripe.funding.ledger.balance()).toBe(0);
  });
  it("filters queue status and notes while preserving global counts", async () => {
    const first = await disputed(),
      second = await disputed();
    await reviews.review(
      first.payment.id,
      input(first, {
        status: "in_review",
        note: "Investigating unique review marker.",
      }),
      "admin",
    );
    expect(
      (await reviews.list("in_review")).items.map((c) => c.payment.id),
    ).toEqual([first.payment.id]);
    expect((await reviews.list("all", "unique review marker")).total).toBe(1);
    expect((await reviews.list()).counts).toEqual({
      needs_review: 1,
      in_review: 1,
      reviewed: 0,
    });
    expect((await reviews.list("all", "", 2)).items).toEqual([]);
    expect(second.payment.id).not.toBe(first.payment.id);
  });
  it("requires a separate admin credential even with a valid workspace token", async () => {
    const app = createApp(
      store,
      undefined,
      undefined,
      undefined,
      stripe.funding,
      stripe,
    );
    const path = "/api/admin/funding/disputes";
    expect((await request(app).get(path)).status).toBe(401);
    expect(
      (
        await request(app)
          .get(path)
          .set("Authorization", "Bearer workspace-fixture")
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .get(path)
          .set("Authorization", "Bearer admin-fixture")
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get("/api/account/funding")
          .set("Authorization", "Bearer admin-fixture")
      ).status,
    ).toBe(401);
    config.adminToken = config.token;
    expect(
      (
        await request(app)
          .get(path)
          .set("Authorization", "Bearer workspace-fixture")
      ).status,
    ).toBe(503);
    config.adminToken = "";
    expect((await request(app).get(path)).status).toBe(503);
  });
  it("enforces origin, payload and evidence checks and derives audit actor server-side", async () => {
    const c = await disputed();
    const app = createApp(
      store,
      undefined,
      undefined,
      undefined,
      stripe.funding,
      stripe,
    );
    const path = `/api/admin/funding/disputes/${c.payment.id}/review`;
    expect(
      (
        await request(app)
          .post(path)
          .set("Authorization", "Bearer admin-fixture")
          .set("Origin", "https://evil.example")
          .send(input(c))
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(path)
          .set("Authorization", "Bearer admin-fixture")
          .send(input(c, { actor: "spoof" }))
      ).status,
    ).toBe(400);
    const response = await request(app)
      .post(path)
      .set("Authorization", "Bearer admin-fixture")
      .send(input(c));
    expect(response.status).toBe(200);
    expect(response.body.history[0].actor).toMatch(
      /^admin credential [a-f0-9]{12}$/,
    );
    expect(JSON.stringify(response.body)).not.toContain("admin-fixture");
    expect(JSON.stringify(response.body)).not.toContain("sk_test_");
  });
});
