import { createHash } from "node:crypto";
import { z } from "zod";
import type { Store } from "./store.js";
import type { ToolName } from "./observation-types.js";
import { config } from "./config.js";
import { providerRegistry } from "./provider-adapters.js";
import { ObservationError } from "./observation.js";

const fingerprint = (tool: ToolName) =>
  createHash("sha256")
    .update(
      `octolab-provider-account-v1:${config.keys[providerRegistry.get(tool).provider]}`,
    )
    .digest("hex");
/** Private key binding is never exposed to the browser or billing exports. */
export async function providerAccountForCall(
  store: Store,
  tool: ToolName,
): Promise<string | undefined> {
  const configured = providerRegistry.accountReference(tool);
  if (configured) return configured;
  const row = await store.db
    .prepare("SELECT body FROM workspace_settings WHERE key=?")
    .get(`provider-account:${providerRegistry.get(tool).provider}`);
  if (!row) return undefined;
  const account = JSON.parse(row.body);
  return account.credentialFingerprint === fingerprint(tool)
    ? account.accountReference
    : undefined;
}
export async function assignProviderAccount(
  store: Store,
  tool: ToolName,
  raw: unknown,
) {
  const input = z
    .object({
      accountReference: z
        .string()
        .trim()
        .regex(/^[a-zA-Z0-9._:-]{1,120}$/),
      credentialRevision: z.string().length(16),
    })
    .strict()
    .parse(raw);
  return store.transaction(async () => {
    const status = providerRegistry.credentialStatus(tool);
    if (!status.configured || status.revision !== input.credentialRevision)
      throw new ObservationError(
        409,
        "The provider connection changed. Refresh before recording its billing account.",
      );
    if (providerRegistry.accountReference(tool))
      throw new ObservationError(
        409,
        "This billing account is managed by server configuration.",
      );
    const previous = await providerAccountForCall(store, tool);
    const account = {
      accountReference: input.accountReference,
      credentialFingerprint: fingerprint(tool),
      updatedAt: new Date().toISOString(),
    };
    await store.db
      .prepare(
        "INSERT INTO workspace_settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET body=excluded.body",
      )
      .run(
        `provider-account:${providerRegistry.get(tool).provider}`,
        JSON.stringify(account),
      );
    await store.db
      .prepare("INSERT INTO workspace_policy_events(body) VALUES (?)")
      .run(
        JSON.stringify({
          type: "provider_billing_account_recorded",
          tool,
          previous: previous ?? null,
          accountReference: account.accountReference,
          at: account.updatedAt,
          actor: "workspace_owner_access",
          meaning:
            "Operator-supplied reference for future receipts; not verified account ownership.",
        }),
      );
    return { accountReference: account.accountReference };
  });
}
