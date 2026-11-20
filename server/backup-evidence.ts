import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { digest } from "./observation-store.js";

export interface DatabaseSnapshot {
  tables: { schema: string; table: string; rows: number; sha256: string }[];
  sequences: Record<string, unknown>[];
  security: Record<string, unknown>[];
  columnSecurity: Record<string, unknown>[];
  policies: Record<string, unknown>[];
  ledger: Record<string, unknown>[];
  audit: { events: number; chains: number; valid: boolean };
  keyLedgerValid: boolean;
  allowanceLedgerValid: boolean | null;
  shadowWalletValid?: boolean;
  walletValid?: boolean;
}
export const sqlIdentifier = (value: string) =>
  `"${value.replaceAll('"', '""')}"`;
export async function beginBackupSnapshot(client: PoolClient) {
  await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  await client.query("SET LOCAL TIME ZONE 'UTC'");
}
/** Stream rows in a fixed byte order; only digests/counts are retained in the manifest. */
export async function databaseSnapshot(
  client: PoolClient,
): Promise<DatabaseSnapshot> {
  const tables = (
    await client.query(
      "SELECT n.nspname AS schema,c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('octolab','octolab_migrations') AND c.relkind='r' ORDER BY 1,2",
    )
  ).rows as { schema: string; name: string }[];
  if (
    !tables.some((t) => t.schema === "octolab" && t.name === "workspaces") ||
    !tables.some(
      (t) => t.schema === "octolab_migrations" && t.name === "versions",
    )
  )
    throw new Error("Source is not a migrated octolab application.");
  const results: DatabaseSnapshot["tables"] = [];
  for (const table of tables) {
    const qualified = `${sqlIdentifier(table.schema)}.${sqlIdentifier(table.name)}`;
    await client.query(
      `DECLARE octolab_backup_rows NO SCROLL CURSOR FOR SELECT to_jsonb(t)::text AS body FROM ${qualified} t ORDER BY to_jsonb(t)::text COLLATE "C"`,
    );
    const hash = createHash("sha256");
    let rows = 0;
    try {
      while (true) {
        const batch = await client.query(
          "FETCH FORWARD 1000 FROM octolab_backup_rows",
        );
        if (!batch.rowCount) break;
        for (const row of batch.rows) {
          hash.update(String(Buffer.byteLength(row.body)));
          hash.update(":");
          hash.update(row.body);
          rows++;
        }
      }
    } finally {
      await client.query("CLOSE octolab_backup_rows");
    }
    results.push({
      schema: table.schema,
      table: table.name,
      rows,
      sha256: hash.digest("hex"),
    });
  }
  const sequences: DatabaseSnapshot["sequences"] = [];
  for (const row of (
    await client.query(
      "SELECT n.nspname AS schema,c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('octolab','octolab_migrations') AND c.relkind='S' ORDER BY 1,2",
    )
  ).rows) {
    const value = (
      await client.query(
        `SELECT last_value::text,is_called FROM ${sqlIdentifier(row.schema)}.${sqlIdentifier(row.name)}`,
      )
    ).rows[0];
    sequences.push({ schema: row.schema, name: row.name, ...value });
  }
  const security = (
    await client.query(
      "SELECT c.relname AS name,c.relrowsecurity AS rls,c.relforcerowsecurity AS forced,has_table_privilege('octolab_runtime',c.oid,'SELECT') AS runtime_read,has_table_privilege('octolab_runtime',c.oid,'INSERT') AS runtime_insert,has_table_privilege('octolab_runtime',c.oid,'UPDATE') AS runtime_update,has_table_privilege('octolab_runtime',c.oid,'DELETE') AS runtime_delete FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='octolab' AND c.relkind='r' ORDER BY c.relname",
    )
  ).rows;
  const columnSecurity = (
    await client.query(
      "SELECT c.relname AS table,a.attname AS column,has_column_privilege('octolab_runtime',c.oid,a.attnum,'SELECT') AS runtime_read,has_column_privilege('octolab_runtime',c.oid,a.attnum,'INSERT') AS runtime_insert,has_column_privilege('octolab_runtime',c.oid,a.attnum,'UPDATE') AS runtime_update FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped WHERE n.nspname='octolab' AND c.relkind='r' ORDER BY c.relname,a.attnum",
    )
  ).rows;
  const policies = (
    await client.query(
      "SELECT tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='octolab' ORDER BY tablename,policyname",
    )
  ).rows;
  const allowanceLedgerValid = tables.some(
    (t) => t.schema === "octolab" && t.name === "workspace_allowances",
  )
    ? (
        await client.query(
          "SELECT 1 FROM octolab.workspace_allowances a WHERE a.spent_micros+a.reserved_micros>a.limit_micros OR a.spent_micros <> COALESCE((SELECT SUM(s.amount_micros) FROM octolab.workspace_allowance_spend s WHERE s.workspace_id=a.workspace_id AND s.state='settled'),0) OR a.reserved_micros <> COALESCE((SELECT SUM(s.amount_micros) FROM octolab.workspace_allowance_spend s WHERE s.workspace_id=a.workspace_id AND s.state='reserved'),0) LIMIT 1",
        )
      ).rowCount === 0
    : null;
  const hasShadowSandbox = tables.some(
    (t) => t.schema === "octolab" && t.name === "shadow_wallet_sandbox_entries",
  );
  const shadowWalletValid = tables.some(
    (t) => t.schema === "octolab" && t.name === "shadow_wallet_holds",
  )
    ? (
        await client.query(`
          SELECT 1 FROM octolab.shadow_wallet_closures c
          LEFT JOIN octolab.shadow_wallet_journal j
            ON j.workspace_id=c.workspace_id AND j.call_id=c.call_id
          WHERE c.outcome='posted' AND j.source_id IS NULL
          UNION ALL
          SELECT 1 FROM octolab.shadow_wallet_holds h
          LEFT JOIN octolab.shadow_wallet_closures c
            ON c.workspace_id=h.workspace_id AND c.call_id=h.call_id
          LEFT JOIN octolab.observation_calls a
            ON a.workspace_id=h.workspace_id AND a.id=h.call_id
          WHERE h.admitted AND c.call_id IS NULL
            AND (a.id IS NULL OR a.body::jsonb->>'status' <> 'running')
          ${
            hasShadowSandbox
              ? `
            UNION ALL
            SELECT 1 FROM octolab.shadow_wallet_sandbox_deposits e
            JOIN octolab.stripe_deposits d
              ON d.workspace_id=e.workspace_id AND d.id=e.deposit_id
            LEFT JOIN octolab.shadow_wallet_sandbox_entries j
              ON j.workspace_id=e.workspace_id AND j.deposit_id=e.deposit_id
            GROUP BY e.workspace_id,e.deposit_id,d.body,d.payment_intent_id
            HAVING COALESCE(sum(j.wallet_micros),0)<>(d.body::jsonb->>'netCreditUnits')::bigint
              OR bool_or(j.payment_intent_id IS DISTINCT FROM d.payment_intent_id) FILTER (WHERE j.revision IS NOT NULL)
            UNION ALL
            SELECT 1 FROM (
              SELECT target_micros, sum(wallet_micros) OVER w AS cumulative,
                     revision, row_number() OVER w AS expected_revision
              FROM octolab.shadow_wallet_sandbox_entries
              WINDOW w AS (PARTITION BY workspace_id,deposit_id ORDER BY revision)
            ) entries WHERE target_micros<>cumulative OR revision<>expected_revision
          `
              : `
            UNION ALL
            SELECT 1 FROM (
              SELECT workspace_id, wallet_micros AS amount FROM octolab.shadow_wallet_journal
              UNION ALL
              SELECT h.workspace_id, -h.maximum_micros AS amount
              FROM octolab.shadow_wallet_holds h
              WHERE h.admitted AND NOT EXISTS (
                SELECT 1 FROM octolab.shadow_wallet_closures c
                WHERE c.workspace_id=h.workspace_id AND c.call_id=h.call_id
              )
            ) amounts GROUP BY workspace_id HAVING sum(amount)<0
          `
          }
          LIMIT 1
        `)
      ).rowCount === 0
    : undefined;
  // Posted closures carry exactly one debit, closed calls keep no open hold,
  // enrolled deposits match their verified net, and the projection equals a
  // rebuild from the journal and open holds.
  // Before the live-mode migration every wallet row is a sandbox row.
  const walletMode = (
    await client.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema='octolab' AND table_name='wallet_balances' AND column_name='mode'",
    )
  ).rowCount
    ? "mode"
    : "'test'::text";
  const walletValid = tables.some(
    (t) => t.schema === "octolab" && t.name === "wallet_journal",
  )
    ? (
        await client.query(`
          SELECT 1 FROM octolab.wallet_hold_closures c
          LEFT JOIN octolab.wallet_journal j
            ON j.workspace_id=c.workspace_id AND j.call_id=c.call_id
          WHERE c.outcome='posted' AND j.source_id IS NULL
          UNION ALL
          SELECT 1 FROM octolab.wallet_holds h
          LEFT JOIN octolab.wallet_hold_closures c
            ON c.workspace_id=h.workspace_id AND c.call_id=h.call_id
          LEFT JOIN octolab.observation_calls a
            ON a.workspace_id=h.workspace_id AND a.id=h.call_id
          WHERE c.call_id IS NULL
            AND (a.id IS NULL OR a.body::jsonb->>'status' <> 'running')
          UNION ALL
          SELECT 1 FROM octolab.wallet_deposits e
          JOIN octolab.stripe_deposits d
            ON d.workspace_id=e.workspace_id AND d.id=e.deposit_id
          LEFT JOIN octolab.wallet_journal j
            ON j.workspace_id=e.workspace_id AND j.deposit_id=e.deposit_id
          GROUP BY e.workspace_id,e.deposit_id,d.body
          -- A payment released by the operator action carries its restored
          -- credits in its net amount. A hold released by hand before that
          -- action existed keeps a net of zero beside its release posting.
          HAVING COALESCE(sum(j.wallet_micros) FILTER (
                   WHERE j.kind<>'dispute_release'
                      OR d.body::jsonb ?| array['disputeResolution','disputeCycle']),0)
                 <>(d.body::jsonb->>'netCreditUnits')::bigint
          UNION ALL
          SELECT 1 FROM (
            SELECT workspace_id, ${walletMode} AS mode, sum(posted) AS posted,
                   sum(held) AS held, sum(charged) AS charged FROM (
              SELECT workspace_id, ${walletMode} AS mode, wallet_micros AS posted, 0::bigint AS held,
                     CASE WHEN kind='usage' THEN -wallet_micros ELSE 0 END AS charged
              FROM octolab.wallet_journal
              UNION ALL
              SELECT h.workspace_id, ${walletMode}, 0, h.maximum_micros, 0 FROM octolab.wallet_holds h
              WHERE NOT EXISTS (
                SELECT 1 FROM octolab.wallet_hold_closures c
                WHERE c.workspace_id=h.workspace_id AND c.call_id=h.call_id
              )
            ) amounts GROUP BY 1, 2
          ) rebuilt
          FULL JOIN (
            SELECT *, ${walletMode} AS balance_mode FROM octolab.wallet_balances
          ) b ON b.workspace_id=rebuilt.workspace_id AND b.balance_mode=rebuilt.mode
          WHERE COALESCE(rebuilt.posted,0)<>COALESCE(b.posted_micros,0)
             OR COALESCE(rebuilt.held,0)<>COALESCE(b.held_micros,0)
             OR COALESCE(rebuilt.charged,0)<>COALESCE(b.charged_micros,0)
          LIMIT 1
        `)
      ).rowCount === 0
    : undefined;
  const ledger = (
    await client.query(
      "SELECT workspace_id,source,COUNT(*)::integer AS entries,SUM(delta_units)::text AS balance_units FROM octolab.funding_ledger GROUP BY workspace_id,source ORDER BY workspace_id,source",
    )
  ).rows;
  const heads = new Map<string, string>();
  let valid = true,
    events = 0;
  await client.query(
    "DECLARE octolab_backup_audit NO SCROLL CURSOR FOR SELECT workspace_id,session_id,body FROM octolab.observation_events ORDER BY workspace_id,session_id,id",
  );
  try {
    while (true) {
      const batch = await client.query(
        "FETCH FORWARD 1000 FROM octolab_backup_audit",
      );
      if (!batch.rowCount) break;
      for (const event of batch.rows) {
        const key = JSON.stringify([event.workspace_id, event.session_id]),
          { hash, ...payload } = JSON.parse(event.body);
        if (
          payload.previousHash !== (heads.get(key) ?? "genesis") ||
          digest(payload) !== hash
        )
          valid = false;
        heads.set(key, hash);
        events++;
      }
    }
  } finally {
    await client.query("CLOSE octolab_backup_audit");
  }
  const inconsistent = await client.query(
    "SELECT 1 FROM octolab.workspace_api_keys k WHERE k.spent_micros <> COALESCE((SELECT SUM(s.amount_micros) FROM octolab.api_key_spend s WHERE s.workspace_id=k.workspace_id AND s.key_id=k.id AND s.state='settled'),0) OR k.reserved_micros <> COALESCE((SELECT SUM(s.amount_micros) FROM octolab.api_key_spend s WHERE s.workspace_id=k.workspace_id AND s.key_id=k.id AND s.state='reserved'),0) LIMIT 1",
  );
  return {
    tables: results,
    sequences,
    security,
    columnSecurity,
    policies,
    allowanceLedgerValid,
    ...(shadowWalletValid === undefined ? {} : { shadowWalletValid }),
    ...(walletValid === undefined ? {} : { walletValid }),
    ledger,
    audit: { events, chains: heads.size, valid },
    keyLedgerValid: inconsistent.rowCount === 0,
  };
}
