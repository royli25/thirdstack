import { z } from "zod";
import type { ObservationStore } from "./observation-store.js";
export const clientIdentity = z
  .object({
    clientName: z.string().trim().min(1).max(160),
    clientVersion: z.string().trim().min(1).max(100),
    /** How the client reached Two Hands. Absent means the stdio bridge. */
    transport: z.enum(["stdio", "streamable-http"]).optional(),
  })
  .strict();
export type ClientIdentity = z.infer<typeof clientIdentity>;
export async function recordConnection(
  db: ObservationStore,
  input: ClientIdentity,
  sessionId?: string,
) {
  const { transport = "stdio", ...client } = clientIdentity.parse(input);
  const key = JSON.stringify([client.clientName, client.clientVersion]);
  const existing = await db.store.db
    .prepare("SELECT body FROM observation_clients WHERE id=?")
    .get(key);
  const at = new Date().toISOString();
  const connection = {
    ...client,
    firstSeenAt: existing
      ? JSON.parse(existing.body as string).firstSeenAt
      : at,
    lastSeenAt: at,
    transport,
    identity: "MCP client-reported",
  };
  await db.store.db
    .prepare(
      "INSERT INTO observation_clients VALUES (?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body",
    )
    .run(key, JSON.stringify(connection));
  if (
    sessionId &&
    (await db.get(sessionId)) &&
    !(await db.events(sessionId)).some(
      (e) =>
        e.type === "client_observed" &&
        e.data.clientName === client.clientName &&
        e.data.clientVersion === client.clientVersion,
    )
  )
    await db.event(sessionId, "client_observed", "observed", {
      ...client,
      transport,
      identity:
        "Client name and version are self-reported, not model attestation.",
    });
  return connection;
}
export async function connections(db: ObservationStore) {
  return (
    await db.store.db
      .prepare(
        "SELECT body FROM observation_clients ORDER BY json_extract(body,'$.lastSeenAt') DESC",
      )
      .all()
  ).map((r) => JSON.parse(r.body as string));
}
