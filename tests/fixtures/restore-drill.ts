/** Disposable, local-only recovery fixture. Never imported by the production runtime. */
import { randomBytes, randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { ProviderBilling } from "../../server/provider-billing.js";
import { assignProviderAccount } from "../../server/provider-accounts.js";
import { providerRegistry } from "../../server/provider-adapters.js";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import pg from "pg";
import { Store } from "../../server/store.js";
import { PostgresDatabase } from "../../server/database.js";
import { applyMigrations, claimRuntime } from "../../server/migration.js";
import { Observatory, callInput } from "../../server/observation.js";
import { FundingService } from "../../server/funding.js";
import { StripeFundingService } from "../../server/stripe-funding.js";
import { shadowWalletCredentialDigest } from "../../server/shadow-wallet.js";
import { backupDatabase, restoreDatabase } from "../../server/backup.js";
import { digest } from "../../server/observation-store.js";
import { grantFixtureAllowance } from "./allowance.js";
import { config } from "../../server/config.js";
import { FixtureStripeGateway, fixtureStripeSettings } from "./stripe.js";

export async function runRestoreDrill(
  maintenanceUrl: string,
  outputDirectory?: string,
) {
  const parsed = new URL(maintenanceUrl);
  if (
    !["postgres:", "postgresql:"].includes(parsed.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname)
  )
    throw new Error(
      "The restore drill accepts an explicit loopback PostgreSQL maintenance connection only.",
    );
  const root =
    outputDirectory ??
    (await mkdtemp(join(tmpdir(), "octolab-restore-drill-")));
  const suffix = randomUUID().replaceAll("-", ""),
    sourceName = `octolab_drill_source_${suffix}`,
    targetName = `octolab_restore_${suffix}`;
  const sourceUrl = new URL(maintenanceUrl),
    targetUrl = new URL(maintenanceUrl);
  sourceUrl.pathname = `/${sourceName}`;
  targetUrl.pathname = `/${targetName}`;
  const admin = new pg.Pool({ connectionString: maintenanceUrl, max: 2 });
  const workspaces = [randomUUID(), randomUUID()],
    owner = randomUUID();
  const original = {
    keys: { ...config.keys },
    token: config.token,
    rpm: config.rpm,
    fetch: globalThis.fetch,
    shadowWallet: process.env.TWO_HANDS_SHADOW_WALLET,
    shadowStripe: process.env.TWO_HANDS_SHADOW_STRIPE_SANDBOX,
    tavilyAccount: process.env.TAVILY_ACCOUNT_REFERENCE,
  };
  const created: string[] = [];
  let source: Store | undefined, restored: Store | undefined;
  const archive = join(root, "application-backup.enc"),
    tampered = join(root, "tampered-backup.enc"),
    passphrase = randomBytes(32).toString("base64url");
  const evidence = {
    version: "octolab-restore-drill-v1",
    source: "disposable fixtures only",
    completedAt: "",
    backupEncrypted: false,
    authenticatedBeforeRestore: false,
    wrongPassphraseRejected: false,
    corruptionRejected: false,
    populatedDestinationRejected: false,
    activeRuntimeRejected: false,
    rowDigestsMatch: false,
    auditChainsValid: false,
    financialBalancesMatch: false,
    shadowWalletRestored: false,
    billingAmountsMatch: false,
    workspaceIsolationPassed: false,
    allowancesPreserved: false,
    allowancePermissionsPreserved: false,
    allowanceAuditPreserved: false,
    interruptedReservationsSettledOnce: false,
    receiptReplaysNotCharged: false,
    sourceDatabaseDropped: false,
    restoredDatabaseDropped: false,
  };
  try {
    globalThis.fetch = async () => {
      throw new Error("External HTTP is disabled in the restore drill.");
    };
    config.keys.exa = "FIXTURE_ONLY";
    config.keys.tavily = "TAVILY_RESTORE_FIXTURE_ONLY";
    process.env.TAVILY_ACCOUNT_REFERENCE = "restore-fixture-tavily";
    process.env.TWO_HANDS_SHADOW_WALLET = "true";
    process.env.TWO_HANDS_SHADOW_STRIPE_SANDBOX = "true";
    config.token = "fixture-owner-token-for-isolated-restore";
    config.rpm = 1000;
    for (const name of [sourceName, targetName]) {
      await admin.query(`CREATE DATABASE "${name}" TEMPLATE template0`);
      created.push(name);
    }
    source = new Store(":unused:", sourceUrl.toString(), workspaces[0]);
    const database = source.db as PostgresDatabase;
    await applyMigrations(database);
    await database.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Restore fixture A'),($2,'Restore fixture B')",
      workspaces,
    );
    await database.pool.query(
      `INSERT INTO octolab.shadow_wallet_rates
       (workspace_id,rate_version,provider_account,credential_digest,provider_cost_micros,verified_at,expires_at)
       VALUES ($1,'restore-v1',$2,$3,7000,now()-interval '1 hour',now()+interval '1 hour')`,
      [
        workspaces[0],
        process.env.TAVILY_ACCOUNT_REFERENCE,
        shadowWalletCredentialDigest(config.keys.tavily),
      ],
    );
    const obs = new Observatory(source, {
      search: async (provider, _query, _domains, callId) => ({
        httpStatus: 200,
        requestId: `restore-request-${callId}`,
        sources: [
          {
            id: randomUUID(),
            title: "RESTORE_FIXTURE_RAW",
            url: "https://example.com/fixture",
            snippet: "Synthetic private evidence",
            provider,
            callId,
          },
        ],
      }),
      scrape: async () => ({ text: "fixture", httpStatus: 200 }),
    });
    await obs.ready;
    const balances: number[] = [];
    let shadowCallId = "";
    const allowances: Awaited<ReturnType<Store["allowance"]["status"]>>[] = [];
    const fixtures: {
      sessionId: string;
      keyId: string;
      pendingId?: string;
      pendingInput?: {
        tool: "exa_search";
        query: string;
        statedReason: string;
        requestKey: string;
      };
    }[] = [];
    for (const [index, workspaceId] of workspaces.entries()) {
      await source.scope.run(workspaceId, () =>
        source!.actorScope.run({ kind: "account", id: owner }, async () => {
          await database.pool.query(
            "INSERT INTO octolab.workspace_memberships(workspace_id,user_id,role) VALUES($1,$2,'owner')",
            [workspaceId, owner],
          );
          await grantFixtureAllowance(source!);
          const { key } = await obs.db.apiKeys.create({
            requestKey: randomUUID(),
            name: "Restore fixture agent",
            scopes: ["research:write", "tools:execute"],
            allowedTools: ["exa_search"],
            limitUsd: "0.1",
          });
          await assignProviderAccount(source!, "exa_search", {
            accountReference: `restore-account-${index}`,
            credentialRevision:
              providerRegistry.credentialStatus("exa_search").revision,
          });
          const session = await obs.createAgentSession(
            {
              title: `Restore fixture ${index}`,
              objective: "RESTORE_FIXTURE_RAW evidence",
              criteria: [{ text: "Fixture evidence", weight: 1 }],
              constraints: "",
              model: "fixture",
              host: "restore-drill",
            },
            key.id,
          );
          const receipt = await obs.execute(
            session.id,
            {
              tool: "exa_search",
              query: "RESTORE_FIXTURE_RAW query",
              statedReason: "Synthetic recovery fixture",
              requestKey: "fixture-call",
            },
            key.id,
          );
          const fixture: (typeof fixtures)[number] = {
            sessionId: session.id,
            keyId: key.id,
          };
          if (index === 0) {
            // Preserve an admitted call interrupted before its result was recorded.
            const pendingId = randomUUID(),
              pendingInput = {
                tool: "exa_search" as const,
                query: "RESTORE_FIXTURE_RAW pending query",
                statedReason: "Synthetic interrupted recovery fixture",
                requestKey: "fixture-interrupted-call",
              };
            await source!.db.transaction(async () => {
              await source!.allowance.reserve(
                pendingId,
                "observation",
                receipt.estimateMicros,
              );
              await obs.db.apiKeys.reserve(
                key.id,
                pendingId,
                "exa_search",
                receipt.estimateMicros,
              );
              const current = await obs.require(session.id);
              current.reservedMicros += receipt.estimateMicros;
              await obs.db.save(current);
              await obs.db.saveCall(
                {
                  id: pendingId,
                  sessionId: session.id,
                  apiKeyId: key.id,
                  requestKey: pendingInput.requestKey,
                  tool: "exa_search",
                  provider: "exa",
                  arguments: { query: pendingInput.query },
                  statedReason: pendingInput.statedReason,
                  status: "running",
                  startedAt: new Date().toISOString(),
                  estimateMicros: receipt.estimateMicros,
                },
                digest(callInput.parse(pendingInput)),
              );
            });
            const current = await source!.allowance.status();
            await source!.allowance.change(workspaceId, owner, {
              requestKey: randomUUID(),
              revision: current.revision,
              limitMicros: current.limitMicros,
              paused: true,
              reason: "Paused synthetic recovery fixture",
            });
            Object.assign(fixture, { pendingId, pendingInput });
          }
          fixtures.push(fixture);
          allowances.push(await source!.allowance.status());
          const billing = new ProviderBilling(obs),
            start = new Date();
          start.setUTCHours(0, 0, 0, 0);
          const batch = await billing.import({
            requestKey: randomUUID(),
            provider: "exa",
            accountReference: `restore-account-${index}`,
            sourceKind: "invoice",
            sourceReference: `restore-invoice-${index}`,
            windowStart: start.toISOString(),
            windowEnd: new Date(start.getTime() + 86400000).toISOString(),
            records: [
              {
                recordId: "fixture-invoice-line",
                requestId: receipt.result?.requestId,
                amountMicros: 10000 + index,
              },
            ],
          });
          await billing.review(
            batch.id,
            {
              requestKey: randomUUID(),
              decision: "approved",
              note: "Synthetic recovery fixture",
            },
            owner,
          );
          const funding = new FundingService(source!, {
            enabled: false,
            recipient: "",
            rpcUrl: "https://fixture.invalid",
          });
          const gateway = new FixtureStripeGateway(),
            stripe = new StripeFundingService(
              funding,
              { ...fixtureStripeSettings },
              gateway,
            );
          const deposit = await stripe.create({
            requestKey: randomUUID(),
            amount: index ? "20" : "10",
          });
          gateway.pay(deposit.checkoutSessionId!, index ? 0 : 250);
          await stripe.reconcile(deposit.id);
          balances.push(await funding.ledger.balance());
          if (index === 0) {
            const shadowKey = (
              await obs.db.apiKeys.create({
                requestKey: randomUUID(),
                name: "Restore shadow fixture agent",
                scopes: ["research:write", "tools:execute"],
                allowedTools: ["tavily_search"],
                limitUsd: "0.1",
              })
            ).key;
            // Seed a retained shadow posting separately from the research data.
            const shadowCall = {
              ...receipt,
              id: randomUUID(),
              result: undefined,
              apiKeyId: shadowKey.id,
              tool: "tavily_search" as const,
              provider: "tavily" as const,
              arguments: { query: "isolated restore wallet fixture" },
              adapter: providerRegistry.snapshot("tavily_search"),
              providerAccountReference: process.env.TAVILY_ACCOUNT_REFERENCE,
            };
            shadowCallId = shadowCall.id;
            await source!.actorScope.run(
              { kind: "api_key", id: shadowKey.id },
              () =>
                source!.transaction(async () => {
                  assert.equal(
                    await obs.db.shadowWallet.recordAdmission(
                      shadowCall,
                      config.keys.tavily,
                    ),
                    true,
                  );
                  await obs.db.shadowWallet.close(shadowCall);
                }),
            );
          }
        }),
      );
    }
    const release = await claimRuntime(database);
    try {
      await assert.rejects(
        backupDatabase(
          sourceUrl.toString(),
          join(root, "must-not-exist.enc"),
          passphrase,
        ),
        /source runtime or maintenance/,
      );
      evidence.activeRuntimeRejected = true;
    } finally {
      await release();
    }
    await source.close();
    source = undefined;
    const backup = await backupDatabase(
      sourceUrl.toString(),
      archive,
      passphrase,
    );
    const bytes = await readFile(archive);
    evidence.backupEncrypted =
      bytes.subarray(0, 12).toString().startsWith("OCTOLAB-BK1") &&
      !bytes.includes(Buffer.from("RESTORE_FIXTURE_RAW")) &&
      ((await stat(archive)).mode & 0o777) === 0o600;
    const untouched = new pg.Pool({ connectionString: targetUrl.toString() });
    try {
      await assert.rejects(
        restoreDatabase(
          targetUrl.toString(),
          archive,
          `${passphrase}-wrong`,
          targetName,
        ),
        /authentication failed/,
      );
      evidence.wrongPassphraseRejected = true;
      const changed = Buffer.from(bytes);
      changed[Math.floor(changed.length / 2)] ^= 1;
      await writeFile(tampered, changed, { mode: 0o600 });
      await assert.rejects(
        restoreDatabase(targetUrl.toString(), tampered, passphrase, targetName),
        /authentication failed/,
      );
      evidence.corruptionRejected = true;
      evidence.authenticatedBeforeRestore =
        (
          await untouched.query(
            "SELECT 1 FROM pg_namespace WHERE nspname='octolab'",
          )
        ).rowCount === 0;
    } finally {
      await untouched.end();
    }
    const recovery = await restoreDatabase(
      targetUrl.toString(),
      archive,
      passphrase,
      targetName,
    );
    evidence.rowDigestsMatch = recovery.verified;
    evidence.auditChainsValid =
      recovery.audit.valid &&
      recovery.audit.events > 0 &&
      recovery.audit.chains === 2 &&
      recovery.keyLedgerValid;
    await assert.rejects(
      restoreDatabase(targetUrl.toString(), archive, passphrase, targetName),
      /already contains octolab data/,
    );
    evidence.populatedDestinationRejected = true;
    restored = new Store(":unused:", targetUrl.toString(), workspaces[0]);
    let unexpectedTransports = 0;
    const restoredObs = new Observatory(restored, {
      search: async () => {
        unexpectedTransports++;
        throw new Error("Restored fixture must not repeat provider work");
      },
      scrape: async () => {
        unexpectedTransports++;
        throw new Error("Restored fixture must not repeat provider work");
      },
    });
    await restoredObs.ready;
    let isolated = true,
      billingMatch = true,
      shadowWalletRestored = recovery.shadowWalletValid === true;
    const restoredBalances: number[] = [];
    let allowancesMatch = true,
      permissionsMatch = true,
      auditsMatch = true,
      settledOnce = true,
      replaysFree = true;
    for (const [index, workspaceId] of workspaces.entries())
      await restored.scope.run(workspaceId, async () => {
        const fixture = fixtures[index];
        const shadowUsage = await restored!.db
          .prepare(
            "SELECT source_id,wallet_micros FROM shadow_wallet_journal WHERE kind='usage'",
          )
          .all();
        const shadowFunding = await restored!.db
          .prepare(
            "SELECT COALESCE(sum(wallet_micros),0) AS net FROM shadow_wallet_sandbox_entries",
          )
          .get();
        shadowWalletRestored &&=
          index === 0
            ? shadowUsage.length === 1 &&
              shadowUsage[0].source_id === shadowCallId &&
              Number(shadowUsage[0].wallet_micros) === -7700 &&
              Number(shadowFunding?.net) === 7500000
            : shadowUsage.length === 0 && Number(shadowFunding?.net) === 0;

        const before = await restored!.allowance.status();
        if (JSON.stringify(before) !== JSON.stringify(allowances[index]))
          allowancesMatch = false;
        const grants = await (restored!.db as PostgresDatabase).pool.query(
          "SELECT count(*)::int AS n FROM octolab.workspace_allowance_events WHERE workspace_id=$1",
          [workspaceId],
        );
        if (grants.rows[0].n !== (index === 0 ? 2 : 1)) auditsMatch = false;
        await assert.rejects(
          restored!.db
            .prepare(
              "UPDATE workspace_allowances SET limit_micros=? WHERE workspace_id=?",
            )
            .run(1e9, workspaceId),
          /permission denied/,
        );
        await assert.rejects(
          restored!.db
            .prepare("SELECT * FROM workspace_allowance_events")
            .all(),
          /permission denied/,
        );
        const visible = await restored!.db
          .prepare("SELECT workspace_id FROM workspace_allowances")
          .all();
        permissionsMatch &&=
          visible.length === 1 && visible[0].workspace_id === workspaceId;
        await restored!.recover();
        await restoredObs.db.recover();
        await restored!.allowance.recover();
        const once = await restored!.allowance.status();
        await restoredObs.db.recover();
        await restored!.allowance.recover();
        settledOnce &&=
          JSON.stringify(once) ===
          JSON.stringify(await restored!.allowance.status());
        settledOnce &&=
          once.spentMicros === before.spentMicros + before.reservedMicros &&
          once.reservedMicros === 0 &&
          once.revision === before.revision &&
          once.state === before.state;
        if (fixture.pendingInput) {
          const replay = await restoredObs.execute(
            fixture.sessionId,
            fixture.pendingInput,
            fixture.keyId,
          );
          replaysFree &&=
            "replayed" in replay &&
            replay.replayed === true &&
            replay.status === "interrupted";
          const key = await restoredObs.db.apiKeys.get(fixture.keyId);
          const session = await restoredObs.require(fixture.sessionId);
          settledOnce &&=
            key?.spentMicros === once.spentMicros &&
            key.reservedMicros === 0 &&
            session.spentMicros === once.spentMicros &&
            session.reservedMicros === 0;
        }
        const replay = await restoredObs.execute(
          fixture.sessionId,
          {
            tool: "exa_search",
            query: "RESTORE_FIXTURE_RAW query",
            statedReason: "Synthetic recovery fixture",
            requestKey: "fixture-call",
          },
          fixture.keyId,
        );
        const entries = await restored!.db
          .prepare("SELECT call_id,state FROM workspace_allowance_spend")
          .all();
        replaysFree &&=
          "replayed" in replay &&
          replay.replayed === true &&
          JSON.stringify(once) ===
            JSON.stringify(await restored!.allowance.status()) &&
          entries.length === (index === 0 ? 2 : 1) &&
          entries.every((e) => e.state === "settled") &&
          new Set(entries.map((e) => e.call_id)).size === entries.length;
        if (
          (
            await (restored!.db as PostgresDatabase).pool.query(
              "SELECT count(*)::int AS n FROM octolab.workspace_allowance_events WHERE workspace_id=$1",
              [workspaceId],
            )
          ).rows[0].n !== grants.rows[0].n
        )
          auditsMatch = false;
        const sessions = await restoredObs.db.list();
        if (
          sessions.length !== 1 ||
          sessions[0].title !== `Restore fixture ${index}`
        )
          isolated = false;
        if (!(await restoredObs.db.detail(sessions[0].id))?.integrity)
          isolated = false;
        if (
          (await new ProviderBilling(restoredObs).overview())
            .reconciledMicros !==
          10000 + index
        )
          billingMatch = false;
        restoredBalances.push(
          await new FundingService(restored!, {
            enabled: false,
            recipient: "",
            rpcUrl: "https://fixture.invalid",
          }).ledger.balance(),
        );
      });
    evidence.workspaceIsolationPassed = isolated;
    evidence.allowancesPreserved =
      allowancesMatch && recovery.allowanceLedgerValid === true;
    evidence.allowancePermissionsPreserved = permissionsMatch;
    evidence.allowanceAuditPreserved = auditsMatch;
    evidence.interruptedReservationsSettledOnce = settledOnce;
    evidence.receiptReplaysNotCharged =
      replaysFree && unexpectedTransports === 0;
    evidence.billingAmountsMatch = billingMatch;
    evidence.shadowWalletRestored = shadowWalletRestored;
    evidence.financialBalancesMatch =
      JSON.stringify(balances) === JSON.stringify(restoredBalances) &&
      balances[0] === 7500000 &&
      balances[1] === 20000000;
    evidence.completedAt = new Date().toISOString();
    if (
      [
        evidence.backupEncrypted,
        evidence.authenticatedBeforeRestore,
        evidence.wrongPassphraseRejected,
        evidence.corruptionRejected,
        evidence.populatedDestinationRejected,
        evidence.activeRuntimeRejected,
        evidence.rowDigestsMatch,
        evidence.auditChainsValid,
        evidence.financialBalancesMatch,
        evidence.shadowWalletRestored,
        evidence.billingAmountsMatch,
        evidence.workspaceIsolationPassed,
        evidence.allowancesPreserved,
        evidence.allowancePermissionsPreserved,
        evidence.allowanceAuditPreserved,
        evidence.interruptedReservationsSettledOnce,
        evidence.receiptReplaysNotCharged,
      ].some((value) => !value)
    )
      throw new Error("Recovery drill checks failed.");
    return {
      ...evidence,
      backupSha256: backup.encryptedSha256,
      tablesVerified: recovery.tables.length,
      ledgerGroupsVerified: recovery.ledgerGroupsVerified,
      sourceDatabaseDropped: true,
      restoredDatabaseDropped: true,
    };
  } finally {
    await source?.close();
    await restored?.close();
    for (const name of created.reverse())
      await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
    await admin.end();
    Object.assign(config.keys, original.keys);
    config.token = original.token;
    config.rpm = original.rpm;
    globalThis.fetch = original.fetch;
    for (const [name, value] of Object.entries({
      TWO_HANDS_SHADOW_WALLET: original.shadowWallet,
      TWO_HANDS_SHADOW_STRIPE_SANDBOX: original.shadowStripe,
      TAVILY_ACCOUNT_REFERENCE: original.tavilyAccount,
    })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}
