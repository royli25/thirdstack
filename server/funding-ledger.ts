import type { Store } from "./store.js";
import type { FundingEntry } from "./funding-types.js";
/** Internal test-credit units. No live currency balance or provider-spend authorization. */
export class FundingLedger {
  constructor(public store: Store) {}
  async importHistorical() {
    await this.store.db
      .prepare(
        `INSERT OR IGNORE INTO funding_ledger(source,source_id,revision,delta_units,kind,reference,created_at)
      SELECT 'onchain',intent_id,0,amount_units,'deposit',transaction_hash,created_at FROM funding_credits`,
      )
      .run();
  }
  async balance() {
    return Number(
      (await this.store.db
        .prepare(
          `SELECT COALESCE((SELECT SUM(delta_units) FROM funding_ledger),0) +
          COALESCE((SELECT SUM(amount_units) FROM funding_credits c WHERE NOT EXISTS
            (SELECT 1 FROM funding_ledger l WHERE l.source='onchain' AND l.source_id=c.intent_id)),0) AS n`,
        )
        .get())!.n,
    );
  }
  async net(source: "onchain" | "stripe", id: string) {
    return Number(
      (await this.store.db
        .prepare(
          "SELECT COALESCE(SUM(delta_units),0) AS n FROM funding_ledger WHERE source=? AND source_id=?",
        )
        .get(source, id))!.n,
    );
  }
  /** Caller owns the enclosing transaction, including the payment receipt state. */
  async settle(
    source: "onchain" | "stripe",
    id: string,
    targetUnits: number,
    reference: string,
    kind: string,
    at: string,
  ) {
    if (
      !Number.isSafeInteger(targetUnits) ||
      targetUnits < 0 ||
      targetUnits > 1000000000
    )
      throw new Error("Invalid funding ledger target");
    const delta = targetUnits - (await this.net(source, id));
    if (!delta) return;
    const revision = Number(
      (await this.store.db
        .prepare(
          "SELECT COALESCE(MAX(revision),-1)+1 AS n FROM funding_ledger WHERE source=? AND source_id=?",
        )
        .get(source, id))!.n,
    );
    await this.store.db
      .prepare(
        "INSERT INTO funding_ledger(source,source_id,revision,delta_units,kind,reference,created_at) VALUES (?,?,?,?,?,?,?)",
      )
      .run(source, id, revision, delta, kind, reference, at);
  }
  async entries(): Promise<FundingEntry[]> {
    return (await this.store.db
      .prepare(
        'SELECT id,source,source_id AS "sourceId",delta_units AS "deltaUnits",kind,reference,created_at AS "createdAt" FROM funding_ledger ORDER BY id DESC LIMIT 100',
      )
      .all()) as unknown as FundingEntry[];
  }
}
