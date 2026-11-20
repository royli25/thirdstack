import { providerIds } from "./provider-catalog.js";
import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { z } from "zod";
import { config, refreshRateCardVersion } from "./config.js";
import { PostgresDatabase } from "./database.js";
import { AccountError } from "./accounts.js";
import {
  settingsWrite,
  settingsSynchronized,
} from "./provider-settings-gate.js";
import type { ProviderId } from "./types.js";
import type {
  ToolSettingsValues,
  ToolSettingsView,
} from "./tool-settings-types.js";

export { providerIds };
const micro = z.number().int().min(0).max(10_000_000);
const provider = z
  .object({
    enabled: z.boolean(),
    requestsPerMinute: z.number().int().min(1).max(1000),
    estimateMicros: micro,
  })
  .strict();
const providerShape = Object.fromEntries(
  providerIds.map((p) => [p, provider]),
) as Record<ProviderId, typeof provider>;
export const settingsValues = z
  .object({
    providers: z.object(providerShape).strict(),
    timeoutMs: z.number().int().min(100).max(120000),
    sessionBudgetMicros: z.number().int().min(0).max(5_000_000),
    testBudgetMicros: z.number().int().min(0).max(5_000_000),
    testDailyBudgetMicros: z.number().int().min(0).max(50_000_000),
    exaAdditionalResultMicros: micro,
  })
  .strict();
const storedSettingsValues = settingsValues.extend({
  providers: z.object(providerShape).partial().strict(),
});
export const settingsInput = z
  .object({
    requestKey: z.uuid(),
    revision: z.number().int().nonnegative(),
    values: settingsValues,
    credential: z
      .object({
        provider: z.enum(providerIds),
        value: z
          .string()
          .min(16)
          .max(4096)
          .regex(/^[^\s]+$/),
      })
      .strict()
      .optional(),
  })
  .strict();
type SecretRefs = Partial<Record<ProviderId, string>>;
export interface ManagedSecretStore {
  available(client: PoolClient): Promise<boolean>;
  replace(
    client: PoolClient,
    provider: ProviderId,
    value: string,
    previous?: string,
  ): Promise<string>;
  resolve(client: PoolClient, id: string): Promise<string>;
}
/** Supabase manages encryption keys; no credential is stored in application settings/audit. */
export class SupabaseVault implements ManagedSecretStore {
  async available(client: PoolClient) {
    const relation = (
      await client.query(
        "SELECT to_regclass('vault.decrypted_secrets') AS relation",
      )
    ).rows[0].relation;
    if (!relation) return false;
    const create = (
      await client.query(
        "SELECT to_regprocedure('vault.create_secret(text,text,text)') AS create_fn,to_regprocedure('vault.update_secret(uuid,text,text,text)') AS update_fn",
      )
    ).rows[0];
    if (!create.create_fn || !create.update_fn) return false;
    const access = (
      await client.query(
        `SELECT has_schema_privilege(current_user,'vault','USAGE') AND has_table_privilege(current_user,$1,'SELECT')
      AND has_function_privilege(current_user,$2,'EXECUTE') AND has_function_privilege(current_user,$3,'EXECUTE') AND NOT EXISTS (
      SELECT 1 FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','octolab_runtime') AND has_schema_privilege(r.oid,'vault','USAGE') AND has_any_column_privilege(r.oid,$1,'SELECT')
    ) AS available`,
        [relation, create.create_fn, create.update_fn],
      )
    ).rows[0].available;
    return !!access;
  }
  async replace(
    client: PoolClient,
    provider: ProviderId,
    value: string,
    previous?: string,
  ) {
    if (previous) {
      await client.query("SELECT vault.update_secret($1::uuid,$2::text)", [
        previous,
        value,
      ]);
      return previous;
    }
    return String(
      (
        await client.query(
          "SELECT vault.create_secret($1::text,$2::text,$3::text) AS id",
          [
            value,
            `octolab-provider-${provider}-${randomUUID()}`,
            "octolab managed provider credential",
          ],
        )
      ).rows[0].id,
    );
  }
  async resolve(client: PoolClient, id: string) {
    const row = (
      await client.query(
        "SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id=$1::uuid",
        [id],
      )
    ).rows[0];
    if (
      !row ||
      typeof row.decrypted_secret !== "string" ||
      !/^[^\s]{16,4096}$/.test(row.decrypted_secret)
    )
      throw new Error("Managed provider credential is unavailable.");
    return row.decrypted_secret;
  }
}
export class ToolSettings {
  readonly ready: Promise<void>;
  private revision = 0;
  private updatedAt: string | null = null;
  private refs: SecretRefs = {};
  private unresolved = new Set<ProviderId>();
  private uncertain = false;
  private values: ToolSettingsValues;
  constructor(
    readonly database?: PostgresDatabase,
    private secrets: ManagedSecretStore = new SupabaseVault(),
  ) {
    this.values = {
      providers: Object.fromEntries(
        providerIds.map((p) => [
          p,
          {
            enabled: !config.disabledProviders.includes(p),
            requestsPerMinute: config.providerRpms[p] ?? config.rpm,
            estimateMicros: config.prices[p],
          },
        ]),
      ) as ToolSettingsValues["providers"],
      timeoutMs: config.timeoutMs,
      sessionBudgetMicros: config.agentSessionBudgetMicros,
      testBudgetMicros: config.providerTestBudgetMicros,
      testDailyBudgetMicros: config.providerTestDailyBudgetMicros,
      exaAdditionalResultMicros: config.exaAdditionalResultMicros,
    };
    this.ready = database ? this.load() : Promise.resolve();
  }
  private requireDatabase() {
    if (!this.database)
      throw new AccountError(
        503,
        "Platform settings require hosted account storage.",
      );
    return this.database;
  }
  private apply(
    values: ToolSettingsValues,
    keys: Partial<Record<ProviderId, string>>,
  ) {
    this.values = values;
    config.disabledProviders = providerIds.filter(
      (p) => !values.providers[p].enabled,
    );
    config.providerRpms = Object.fromEntries(
      providerIds.map((p) => [p, values.providers[p].requestsPerMinute]),
    );
    config.prices = Object.fromEntries(
      providerIds.map((p) => [p, values.providers[p].estimateMicros]),
    ) as Record<ProviderId, number>;
    config.timeoutMs = values.timeoutMs;
    config.agentSessionBudgetMicros = values.sessionBudgetMicros;
    config.providerTestBudgetMicros = values.testBudgetMicros;
    config.providerTestDailyBudgetMicros = values.testDailyBudgetMicros;
    config.exaAdditionalResultMicros = values.exaAdditionalResultMicros;
    Object.assign(config.keys, keys);
    refreshRateCardVersion();
  }
  private async load() {
    const client = await this.requireDatabase().pool.connect();
    try {
      const row = (
        await client.query(
          "SELECT * FROM octolab.platform_tool_settings WHERE id=true",
        )
      ).rows[0];
      if (!row) return;
      // Settings saved before a provider was added lack its entry; keep its defaults.
      const stored = storedSettingsValues.parse(row.values);
      const values: ToolSettingsValues = {
        ...stored,
        providers: { ...this.values.providers, ...stored.providers },
      };
      const refs = z
        .object(
          Object.fromEntries(providerIds.map((p) => [p, z.uuid().optional()])),
        )
        .strict()
        .parse(row.secret_refs) as SecretRefs;
      const keys: Partial<Record<ProviderId, string>> = {};
      this.unresolved.clear();
      for (const p of providerIds)
        if (refs[p]) {
          try {
            keys[p] = await this.secrets.resolve(client, refs[p]);
          } catch {
            keys[p] = "";
            this.unresolved.add(p);
          }
        }
      // Restoring app records does not restore a managed Vault. Keep admin repair usable,
      // but never fall back to environment credentials or a keyless tier for these providers.
      config.unavailableManagedCredentials = [...this.unresolved];
      this.apply(values, keys);
      this.refs = refs;
      this.revision = row.revision;
      this.updatedAt = new Date(row.updated_at).toISOString();
    } finally {
      client.release();
    }
  }
  async view(): Promise<ToolSettingsView> {
    await this.ready;
    if (this.uncertain)
      await settingsWrite(async () => {
        await this.load();
        this.uncertain = false;
        settingsSynchronized(true);
      });
    const client = await this.requireDatabase().pool.connect();
    try {
      return {
        revision: this.revision,
        updatedAt: this.updatedAt,
        values: structuredClone(this.values),
        rateCardVersion: config.rateCardVersion,
        credentials: Object.fromEntries(
          providerIds.map((p) => [
            p,
            {
              configured: !!config.keys[p] && !this.unresolved.has(p),
              source: this.refs[p]
                ? "vault"
                : config.keys[p]
                  ? "environment"
                  : "missing",
              needsReplacement: this.unresolved.has(p),
            },
          ]),
        ) as ToolSettingsView["credentials"],
        secretStore: {
          available: await this.secrets.available(client),
          name: "Supabase Vault",
        },
        effective:
          "New calls immediately after save; current calls must finish first",
      };
    } finally {
      client.release();
    }
  }
  async history() {
    await this.ready;
    return (
      await this.requireDatabase().pool
        .query(`SELECT e.actor_user_id AS "actorId",CASE WHEN u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL THEN u.email END AS "actorEmail",e.at,e.revision,e.data
      FROM octolab.platform_tool_setting_events e LEFT JOIN auth.users u ON u.id=e.actor_user_id ORDER BY e.at DESC,e.id DESC LIMIT 100`)
    ).rows;
  }
  async change(actor: string, raw: unknown) {
    const input = settingsInput.parse(raw);
    await this.ready;
    // Key values are never retained in audit payloads or returned. A digest binds idempotent retries.
    const hash = createHash("sha256")
      .update(JSON.stringify(input))
      .digest("hex");
    return settingsWrite(async () => {
      if (this.uncertain) {
        await this.load();
        this.uncertain = false;
        settingsSynchronized(true);
      }
      const client = await this.requireDatabase().pool.connect();
      let replayed = false;
      let committing = false;
      let failure: unknown;
      try {
        await client.query("BEGIN");
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtextextended('octolab-platform-settings-v1',0))",
        );
        const previousEvent = (
          await client.query(
            "SELECT input_hash FROM octolab.platform_tool_setting_events WHERE actor_user_id=$1 AND request_key=$2",
            [actor, input.requestKey],
          )
        ).rows[0];
        if (previousEvent) {
          if (previousEvent.input_hash !== hash)
            throw new AccountError(
              409,
              "This request key was already used for different settings.",
            );
          replayed = true;
          await client.query("COMMIT");
        } else {
          const row = (
            await client.query(
              "SELECT revision,values,secret_refs FROM octolab.platform_tool_settings WHERE id=true FOR UPDATE",
            )
          ).rows[0];
          const revision = row?.revision ?? 0;
          if (revision !== input.revision)
            throw new AccountError(
              409,
              "Settings changed elsewhere. Reload before saving.",
            );
          const refs: SecretRefs = { ...(row?.secret_refs ?? {}) };
          const keys: Partial<Record<ProviderId, string>> = {};
          if (input.credential) {
            if (!(await this.secrets.available(client)))
              throw new AccountError(
                503,
                "Supabase Vault is not provisioned. Configure the managed secret store before replacing credentials.",
              );
            const { provider, value } = input.credential;
            refs[provider] = await this.secrets.replace(
              client,
              provider,
              value,
              this.unresolved.has(provider) ? undefined : refs[provider],
            );
            keys[provider] = value;
          }
          const result = await client.query(
            "INSERT INTO octolab.platform_tool_settings(id,revision,values,secret_refs) VALUES(true,$1,$2,$3) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,values=excluded.values,secret_refs=excluded.secret_refs,updated_at=now() RETURNING updated_at",
            [revision + 1, JSON.stringify(input.values), JSON.stringify(refs)],
          );
          await client.query(
            "INSERT INTO octolab.platform_tool_setting_events(id,actor_user_id,request_key,input_hash,revision,data) VALUES($1,$2,$3,$4,$5,$6)",
            [
              randomUUID(),
              actor,
              input.requestKey,
              hash,
              revision + 1,
              JSON.stringify({
                before: row?.values ?? this.values,
                after: input.values,
                ...(input.credential
                  ? { credentialReplaced: input.credential.provider }
                  : {}),
              }),
            ],
          );
          committing = true;
          await client.query("COMMIT");
          committing = false;
          if (input.credential)
            this.unresolved.delete(input.credential.provider);
          config.unavailableManagedCredentials = [...this.unresolved];
          this.apply(input.values, keys);
          this.refs = refs;
          this.revision = revision + 1;
          this.updatedAt = new Date(result.rows[0].updated_at).toISOString();
        }
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        failure = error;
      } finally {
        client.release();
      }
      if (committing || replayed) {
        try {
          await this.load();
          this.uncertain = false;
          settingsSynchronized(true);
        } catch {
          this.uncertain = true;
          settingsSynchronized(false);
          throw new AccountError(
            503,
            "Settings synchronization is unavailable. Provider work is paused until settings can be reloaded.",
          );
        }
      }
      if (failure) throw failure;
      return {
        ...(await this.view()),
        ...(replayed ? { replayed: true } : {}),
      };
    });
  }
}
