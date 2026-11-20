import { randomUUID } from "node:crypto";
import { z } from "zod";
import { FundingLedger } from "./funding-ledger.js";
import type { Store } from "./store.js";
import {
  BASE_SEPOLIA,
  type DepositIntent,
  type FundingSummary,
} from "./funding-types.js";
export const address = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Enter a valid EVM wallet address.")
  .refine(
    (s) => !/^0x0{40}$/i.test(s),
    "The zero address cannot receive deposits.",
  )
  .transform((s) => s.toLowerCase());
export const txHash = z
  .string()
  .regex(
    /^0x[0-9a-fA-F]{64}$/,
    "Enter a 0x transaction hash with 64 hexadecimal characters.",
  )
  .transform((s) => s.toLowerCase());
const quantity = z.string().regex(/^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/);
const word = z.string().regex(/^0x[0-9a-fA-F]{64}$/);
const TRANSFER =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
export const depositInput = z
  .object({
    requestKey: z.string().uuid(),
    amount: z
      .string()
      .regex(
        /^(?:0|[1-9]\d{0,3})(?:\.\d{1,6})?$/,
        "Use a decimal amount with up to six decimal places.",
      )
      .transform((s) => {
        const [whole, fraction = ""] = s.split(".");
        return Number(whole) * 1000000 + Number(fraction.padEnd(6, "0"));
      })
      .pipe(
        z
          .number()
          .int()
          .min(1000000, "Minimum deposit is 1 test USDC.")
          .max(1000000000, "Maximum deposit is 1,000 test USDC."),
      ),
    sender: address,
  })
  .strict();
export type FundingConfig = {
  enabled: boolean;
  recipient: string;
  rpcUrl: string;
};
export function fundingConfig(): FundingConfig {
  return {
    enabled: process.env.DEPOSITS_TESTNET_ENABLED === "true",
    recipient: process.env.BASE_SEPOLIA_DEPOSIT_ADDRESS ?? "",
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
  };
}
export class FundingError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type Rpc = (method: string, params: unknown[]) => Promise<unknown>;
export function rpcClient(url: string): Rpc {
  return async (method, params) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") throw new Error("HTTPS required");
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(10000),
        redirect: "error",
      });
      if (!response.ok) throw new Error("RPC unavailable");
      const body = await response.text();
      if (body.length > 2000000) throw new Error("Oversized RPC response");
      const data = JSON.parse(body);
      if (
        data.error ||
        data.jsonrpc !== "2.0" ||
        data.id !== 1 ||
        !("result" in data)
      )
        throw new Error("Invalid RPC response");
      return data.result;
    } catch {
      throw new FundingError(
        502,
        "Could not verify the transaction with the network. No credit was added. Try again later.",
      );
    }
  };
}
const blockSchema = z.object({
  number: quantity,
  hash: word,
  timestamp: quantity,
});
const receiptSchema = z.object({
  transactionHash: word,
  status: quantity,
  blockNumber: quantity,
  blockHash: word,
  logs: z
    .array(
      z.object({
        address: z.string(),
        topics: z.array(word),
        data: z.string().regex(/^0x(?:[a-fA-F0-9]{2})*$/),
        logIndex: quantity,
        transactionHash: word,
        blockHash: word,
        removed: z.boolean().optional(),
      }),
    )
    .max(5000),
});
export class FundingService {
  readonly active = new Set<string>();
  readonly ledger: FundingLedger;
  constructor(
    public store: Store,
    public settings = fundingConfig(),
    private rpc: Rpc = rpcClient(settings.rpcUrl),
    private now = () => Date.now(),
  ) {
    this.ledger = new FundingLedger(store);
  }
  async summary(includeHistory = true): Promise<FundingSummary> {
    return this.store.db.read(async () => {
      const recipient = address.safeParse(this.settings.recipient);
      const enabled = this.settings.enabled && recipient.success;
      const balance = (await this.store.db
        .prepare(
          "SELECT COALESCE(SUM(amount_units),0) AS balance, COUNT(*) AS count FROM funding_credits",
        )
        .get())!;
      return {
        enabled,
        unavailableReason: !this.settings.enabled
          ? "Testnet deposits are not enabled on this server."
          : !recipient.success
            ? "Configure a Base Sepolia receiving address on the server."
            : null,
        network: BASE_SEPOLIA,
        recipient: recipient.success ? recipient.data : null,
        balanceUnits: await this.ledger.balance(),
        onchainBalanceUnits: Number(balance.balance),
        onchainDeposits: Number(balance.count),
        totalDeposits: Number(balance.count),
        intents: includeHistory
          ? (
              await this.store.db
                .prepare(
                  "SELECT body FROM funding_intents ORDER BY rowid DESC LIMIT 100",
                )
                .all()
            ).map((r) => JSON.parse(r.body as string))
          : [],
        testnet: true,
        spendableForProviders: false,
      };
    });
  }
  async get(id: string): Promise<DepositIntent> {
    const row = await this.store.db
      .prepare("SELECT body FROM funding_intents WHERE id=?")
      .get(id);
    if (!row) throw new FundingError(404, "Deposit request not found.");
    return JSON.parse(row.body as string);
  }
  private async save(intent: DepositIntent, event: string) {
    await this.store.db
      .prepare("UPDATE funding_intents SET body=? WHERE id=?")
      .run(JSON.stringify(intent), intent.id);
    await this.store.db
      .prepare("INSERT INTO funding_events(intent_id,body) VALUES (?,?)")
      .run(
        intent.id,
        JSON.stringify({
          event,
          at: new Date(this.now()).toISOString(),
          status: intent.status,
          transactionHash: intent.transactionHash,
          message: intent.message,
          amountUnits: intent.amountUnits,
          recipient: intent.recipient,
          sender: intent.sender,
          tokenAddress: intent.tokenAddress,
          verificationProof: intent.verificationProof ?? null,
        }),
      );
    return intent;
  }
  async create(raw: unknown) {
    const input = depositInput.parse(raw);
    const existing = await this.store.db
      .prepare("SELECT body FROM funding_intents WHERE request_key=?")
      .get(input.requestKey);
    if (existing) {
      const intent: DepositIntent = JSON.parse(existing.body as string);
      if (intent.amountUnits !== input.amount || intent.sender !== input.sender)
        throw new FundingError(
          409,
          "This request key was already used with different deposit details.",
        );
      return intent;
    }
    const summary = await this.summary();
    if (!summary.enabled || !summary.recipient)
      throw new FundingError(409, summary.unavailableReason!);
    if (input.sender === summary.recipient)
      throw new FundingError(
        400,
        "Use a sending wallet different from the receiving address.",
      );
    return await this.store.transaction(async () => {
      const replay = await this.store.db
        .prepare("SELECT body FROM funding_intents WHERE request_key=?")
        .get(input.requestKey);
      if (replay) {
        const previous = JSON.parse(replay.body as string) as DepositIntent;
        if (
          previous.amountUnits !== input.amount ||
          previous.sender !== input.sender
        )
          throw new FundingError(
            409,
            "This request key was already used with different deposit details.",
          );
        return previous;
      }

      const count = (await this.store.db
        .prepare("SELECT COUNT(*) AS n FROM funding_intents")
        .get())!;
      if (Number(count.n) >= 1000)
        throw new FundingError(
          409,
          "Your account has reached its deposit request limit.",
        );
      const at = new Date(this.now()).toISOString();
      const intent: DepositIntent = {
        id: randomUUID(),
        requestKey: input.requestKey,
        amountUnits: input.amount,
        sender: input.sender,
        recipient: summary.recipient!,
        chainId: BASE_SEPOLIA.chainId,
        tokenAddress: BASE_SEPOLIA.tokenAddress,
        status: "awaiting_transfer",
        createdAt: at,
        expiresAt: new Date(this.now() + 30 * 60000).toISOString(),
        transactionHash: null,
        blockNumber: null,
        lastCheckedAt: null,
        creditedAt: null,
        message:
          "Send the exact test USDC amount on Base Sepolia, then submit its transaction hash.",
      };
      await this.store.db
        .prepare("INSERT INTO funding_intents VALUES (?,?,?)")
        .run(intent.id, input.requestKey, JSON.stringify(intent));
      return await this.save(intent, "deposit_created");
    });
  }
  async verify(id: string, raw: unknown): Promise<DepositIntent> {
    const operation = `${this.store.workspaceId}:${id}`;
    if (this.active.has(operation))
      throw new FundingError(409, "This deposit is already being checked.");
    this.active.add(operation);
    try {
      return await this.verifyPayment(id, raw);
    } finally {
      this.active.delete(operation);
    }
  }
  private async verifyPayment(
    id: string,
    raw: unknown,
  ): Promise<DepositIntent> {
    const { transactionHash } = z
      .object({ transactionHash: txHash })
      .strict()
      .parse(raw);
    const original = await this.get(id);
    if (original.status === "credited") {
      if (original.transactionHash !== transactionHash)
        throw new FundingError(
          409,
          "This deposit request is already credited with another transaction.",
        );
      return original;
    }
    if (!(await this.summary()).enabled)
      throw new FundingError(
        409,
        "Testnet deposit verification is not enabled on this server.",
      );
    if (
      original.lastCheckedAt &&
      this.now() - Date.parse(original.lastCheckedAt) < 10000
    )
      throw new FundingError(
        429,
        "Wait ten seconds before checking this deposit again.",
      );
    if (
      await this.store.db
        .prepare(
          "SELECT id FROM funding_credits WHERE chain_id=? AND transaction_hash=?",
        )
        .get(BASE_SEPOLIA.chainId, transactionHash)
    )
      throw new FundingError(
        409,
        "This transaction has already been credited.",
      );
    try {
      original.transactionHash = transactionHash;
      original.lastCheckedAt = new Date(this.now()).toISOString();
      original.status = "pending";
      original.message = "Checking the network.";
      await this.store.transaction(
        async () => await this.save(original, "verification_started"),
      );
      const chain = quantity.parse(await this.rpc("eth_chainId", []));
      if (BigInt(chain) !== BigInt(BASE_SEPOLIA.chainId))
        throw new FundingError(
          502,
          "The configured RPC is not Base Sepolia. No credit was added.",
        );
      const rawReceipt = await this.rpc("eth_getTransactionReceipt", [
        transactionHash,
      ]);
      if (!rawReceipt) {
        original.status =
          this.now() > Date.parse(original.expiresAt) ? "expired" : "pending";
        original.message =
          original.status === "expired"
            ? "The transfer window expired. A transfer mined within the original window can still be verified."
            : "Transaction not found yet. Check the hash and network, then try again.";
        return await this.store.transaction(
          async () => await this.save(original, "receipt_not_found"),
        );
      }
      const receipt = receiptSchema.parse(rawReceipt);
      const reject = async (message: string) => {
        original.status = "rejected";
        original.message = message;
        return await this.store.transaction(
          async () => await this.save(original, "verification_rejected"),
        );
      };
      if (receipt.transactionHash.toLowerCase() !== transactionHash)
        throw new FundingError(
          502,
          "The RPC returned an inconsistent transaction receipt. No credit was added.",
        );
      if (BigInt(receipt.status) !== 1n)
        return await reject(
          "This transaction reverted. No deposit was credited.",
        );
      const block = blockSchema.parse(
        await this.rpc("eth_getBlockByNumber", [receipt.blockNumber, false]),
      );
      if (
        block.hash.toLowerCase() !== receipt.blockHash.toLowerCase() ||
        BigInt(block.number) !== BigInt(receipt.blockNumber)
      )
        throw new FundingError(
          502,
          "The receipt is not in the current canonical block. No credit was added.",
        );
      const timestamp = BigInt(block.timestamp);
      if (
        timestamp < BigInt(Math.floor(Date.parse(original.createdAt) / 1000)) ||
        timestamp > BigInt(Math.floor(Date.parse(original.expiresAt) / 1000))
      )
        return await reject(
          "This transfer was mined outside the deposit request's 30-minute window.",
        );
      const recipientTopic = `0x${original.recipient.slice(2).padStart(64, "0")}`;
      const senderTopic = `0x${original.sender.slice(2).padStart(64, "0")}`;
      const matching = receipt.logs.filter(
        (log) =>
          !log.removed &&
          log.address.toLowerCase() === original.tokenAddress.toLowerCase() &&
          log.transactionHash.toLowerCase() === transactionHash &&
          log.blockHash.toLowerCase() === receipt.blockHash.toLowerCase() &&
          log.topics.length === 3 &&
          log.topics[0].toLowerCase() === TRANSFER &&
          log.topics[1].toLowerCase() === senderTopic &&
          log.topics[2].toLowerCase() === recipientTopic &&
          word.safeParse(log.data).success &&
          BigInt(log.data) === BigInt(original.amountUnits),
      );
      if (matching.length !== 1)
        return await reject(
          "No single matching USDC transfer was found. Check the token, sending wallet, receiving address, and exact amount.",
        );
      original.blockNumber = BigInt(receipt.blockNumber).toString();
      const finalized = blockSchema.parse(
        await this.rpc("eth_getBlockByNumber", ["finalized", false]),
      );
      if (BigInt(finalized.number) < BigInt(receipt.blockNumber)) {
        original.status = "awaiting_finality";
        original.message =
          "Transfer matched. Waiting for the network's finalized block before adding test credits.";
        return await this.store.transaction(
          async () => await this.save(original, "awaiting_finality"),
        );
      }
      const canonical = blockSchema.parse(
        await this.rpc("eth_getBlockByNumber", [receipt.blockNumber, false]),
      );
      if (canonical.hash.toLowerCase() !== receipt.blockHash.toLowerCase())
        throw new FundingError(
          502,
          "The canonical block changed during verification. No credit was added.",
        );
      original.verificationProof = {
        blockHash: receipt.blockHash,
        logIndex: matching[0].logIndex,
        finalizedBlockNumber: BigInt(finalized.number).toString(),
        finalizedBlockHash: finalized.hash,
      };
      return await this.store.transaction(async () => {
        const latest = await this.get(id);
        if (latest.status === "credited") return latest;
        if (
          await this.store.db
            .prepare(
              "SELECT id FROM funding_credits WHERE chain_id=? AND transaction_hash=?",
            )
            .get(BASE_SEPOLIA.chainId, transactionHash)
        )
          throw new FundingError(
            409,
            "This transaction has already been credited.",
          );
        original.status = "credited";
        original.creditedAt = new Date(this.now()).toISOString();
        original.message =
          "Verified on Base Sepolia and added to your test balance.";
        await this.store.db
          .prepare("INSERT INTO funding_credits VALUES (?,?,?,?,?,?,?)")
          .run(
            randomUUID(),
            id,
            BASE_SEPOLIA.chainId,
            transactionHash,
            matching[0].logIndex,
            original.amountUnits,
            original.creditedAt,
          );
        await this.ledger.settle(
          "onchain",
          id,
          original.amountUnits,
          transactionHash,
          "deposit",
          original.creditedAt,
        );
        return await this.save(original, "deposit_credited");
      });
    } catch (error) {
      const failure =
        error instanceof z.ZodError
          ? new FundingError(
              502,
              "The network returned malformed data. No credit was added.",
            )
          : error;
      original.status = "pending";
      original.creditedAt = null;
      delete original.verificationProof;
      original.message =
        failure instanceof FundingError
          ? failure.message
          : "Verification failed. No credit was added.";
      await this.store.transaction(
        async () => await this.save(original, "verification_failed"),
      );
      throw failure;
    }
  }
}
