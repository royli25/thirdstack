import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store";
import {
  FundingService,
  FundingError,
  depositInput,
  type Rpc,
} from "../server/funding";
import { BASE_SEPOLIA } from "../server/funding-types";
import { createApp } from "../server/app";
import { config } from "../server/config";
const sender = `0x${"11".repeat(20)}`;
const recipient = `0x${"22".repeat(20)}`;
const hash = `0x${"33".repeat(32)}`;
const blockHash = `0x${"44".repeat(32)}`;
const topic = (a: string) => `0x${a.slice(2).padStart(64, "0")}`;
let store: Store;
let now: number;
let finalized: string;
let receipt: any;
let canonicalHash: string;
let chain: string;
let service: FundingService;
let rpc: ReturnType<typeof vi.fn<Rpc>>;
const input = (amount = "10") => ({ requestKey: randomUUID(), amount, sender });
beforeEach(() => {
  store = new Store(":memory:");
  now = Date.parse("2026-11-08T21:00:00Z");
  finalized = "0x20";
  canonicalHash = blockHash;
  chain = "0x14a34";
  receipt = {
    transactionHash: hash,
    blockHash,
    blockNumber: "0x10",
    status: "0x1",
    logs: [
      {
        address: BASE_SEPOLIA.tokenAddress,
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          topic(sender),
          topic(recipient),
        ],
        data: `0x${(10000000).toString(16).padStart(64, "0")}`,
        logIndex: "0x0",
        blockHash,
        transactionHash: hash,
        removed: false,
      },
    ],
  };
  rpc = vi.fn<Rpc>(async (method, params) => {
    if (method === "eth_chainId") return chain;
    if (method === "eth_getTransactionReceipt") return receipt;
    if (method === "eth_getBlockByNumber")
      return {
        number: params[0] === "finalized" ? finalized : "0x10",
        hash: canonicalHash,
        timestamp: `0x${Math.floor(Date.parse("2026-11-08T21:00:00Z") / 1000).toString(16)}`,
      };
    throw new Error("Unexpected RPC method");
  });
  service = new FundingService(
    store,
    { enabled: true, recipient, rpcUrl: "https://fixture.invalid" },
    rpc,
    () => now,
  );
});
afterEach(async () => await store.close());
describe("test USDC deposit integrity", () => {
  it("parses exact six-decimal amounts and rejects invalid quantities", () => {
    expect(depositInput.parse(input("1.000001")).amount).toBe(1000001);
    for (const amount of [
      "0",
      "0.999999",
      "1.0000001",
      "1e3",
      "01",
      "1000.000001",
      "-5",
      "NaN",
    ])
      expect(() => depositInput.parse(input(amount))).toThrow();
  });
  it("creates immutable requests idempotently and rejects changed retry details", async () => {
    const data = input();
    const first = await service.create(data);
    expect(await service.create(data)).toEqual(first);
    await expect(
      (async () => await service.create({ ...data, amount: "11" }))(),
    ).rejects.toThrow(/different/);
    expect((await service.summary()).balanceUnits).toBe(0);
    service.settings.enabled = false;
    await expect((async () => await service.create(input()))()).rejects.toThrow(
      /not enabled/,
    );
    expect((await service.create(data)).id).toBe(first.id);
  });
  it("credits a finalized exact transfer once and replays without RPC", async () => {
    const intent = await service.create(input());
    const result = await service.verify(intent.id, { transactionHash: hash });
    expect(result.status).toBe("credited");
    expect((await service.summary()).balanceUnits).toBe(10000000);
    expect((await service.summary()).spendableForProviders).toBe(false);
    const count = rpc.mock.calls.length;
    expect(await service.verify(intent.id, { transactionHash: hash })).toEqual(
      result,
    );
    expect(rpc).toHaveBeenCalledTimes(count);
    expect(
      (await new FundingService(store, service.settings, rpc).summary())
        .balanceUnits,
    ).toBe(10000000);
    expect(
      (
        await store.db
          .prepare("SELECT COUNT(*) AS n FROM funding_credits")
          .get()
      )?.n,
    ).toBe(1);
  });
  it("waits for finality and allows later verification after the transfer window", async () => {
    const intent = await service.create(input());
    finalized = "0xf";
    expect(
      (await service.verify(intent.id, { transactionHash: hash })).status,
    ).toBe("awaiting_finality");
    expect((await service.summary()).balanceUnits).toBe(0);
    now += 40 * 60000;
    finalized = "0x20";
    expect(
      (await service.verify(intent.id, { transactionHash: hash })).status,
    ).toBe("credited");
  });
  it("records missing receipts without credit and rate limits repeated checks", async () => {
    const intent = await service.create(input());
    receipt = null;
    expect(
      (await service.verify(intent.id, { transactionHash: hash })).status,
    ).toBe("pending");
    await expect(
      service.verify(intent.id, { transactionHash: hash }),
    ).rejects.toMatchObject({ status: 429 });
    expect((await service.summary()).balanceUnits).toBe(0);
  });
  it.each([
    "token",
    "sender",
    "recipient",
    "amount",
    "removed",
    "reverted",
    "ambiguous",
    "old",
  ])("rejects a %s mismatch without credit", async (kind) => {
    if (kind === "token") receipt.logs[0].address = sender;
    if (kind === "sender") receipt.logs[0].topics[1] = topic(recipient);
    if (kind === "recipient") receipt.logs[0].topics[2] = topic(sender);
    if (kind === "amount")
      receipt.logs[0].data = `0x${(9999999).toString(16).padStart(64, "0")}`;
    if (kind === "removed") receipt.logs[0].removed = true;
    if (kind === "reverted") receipt.status = "0x0";
    if (kind === "ambiguous")
      receipt.logs.push({ ...receipt.logs[0], logIndex: "0x1" });
    if (kind === "old") now += 60000;
    const intent = await service.create(input());
    expect(
      (await service.verify(intent.id, { transactionHash: hash })).status,
    ).toBe("rejected");
    expect((await service.summary()).balanceUnits).toBe(0);
  });
  it.each(["chain", "canonical", "receipt", "malformed", "rpc"])(
    "fails closed for %s failure",
    async (kind) => {
      const intent = await service.create(input());
      if (kind === "chain") chain = "0x2105";
      if (kind === "canonical") canonicalHash = `0x${"ff".repeat(32)}`;
      if (kind === "receipt") receipt.transactionHash = `0x${"aa".repeat(32)}`;
      if (kind === "malformed") receipt.blockNumber = "invalid";
      if (kind === "rpc")
        rpc.mockRejectedValueOnce(new FundingError(502, "Network unavailable"));
      await expect(
        service.verify(intent.id, { transactionHash: hash }),
      ).rejects.toMatchObject({ status: 502 });
      expect((await service.summary()).balanceUnits).toBe(0);
      expect((await service.get(intent.id)).message).not.toBe(
        "Checking the network.",
      );
    },
  );
  it("prevents two intents from claiming the same transaction concurrently", async () => {
    const first = await service.create(input());
    const second = await service.create(input());
    const results = await Promise.allSettled([
      service.verify(first.id, { transactionHash: hash }),
      service.verify(second.id, { transactionHash: hash }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await service.summary()).balanceUnits).toBe(10000000);
    expect((await service.summary()).totalDeposits).toBe(1);
  });
  it("releases in-progress guard after RPC failure and preserves the ledger", async () => {
    const intent = await service.create(input());
    rpc.mockRejectedValueOnce(new FundingError(502, "Network unavailable"));
    await expect(
      service.verify(intent.id, { transactionHash: hash }),
    ).rejects.toThrow(/Network/);
    now += 10001;
    expect(
      (await service.verify(intent.id, { transactionHash: hash })).status,
    ).toBe("credited");
  });
});
describe("funding HTTP boundary", () => {
  it("keeps mainnet disabled, rejects malformed inputs, and inherits token checks", async () => {
    const token = config.token;
    config.token = "test-funding-token";
    try {
      const app = createApp(store, undefined, undefined, undefined, service);
      expect((await request(app).get("/api/account/funding")).status).toBe(401);
      const summary = await request(app)
        .get("/api/account/funding")
        .set("Authorization", "Bearer test-funding-token");
      expect(summary.body.network.chainId).toBe(84532);
      expect(summary.body.testnet).toBe(true);
      expect(summary.body).not.toHaveProperty("rpcUrl");
      expect(
        (
          await request(app)
            .post("/api/account/funding/deposits")
            .set("Authorization", "Bearer test-funding-token")
            .send({ ...input(), chainId: 8453 })
        ).status,
      ).toBe(400);
      expect(
        (
          await request(app)
            .post("/api/account/funding/deposits")
            .set("Authorization", "Bearer test-funding-token")
            .send(input())
        ).status,
      ).toBe(201);
      expect(
        (
          await request(app)
            .post("/api/account/funding/deposits")
            .set("Authorization", "Bearer test-funding-token")
            .set("Origin", "https://evil.example")
            .send(input())
        ).status,
      ).toBe(403);
    } finally {
      config.token = token;
    }
  });
});
