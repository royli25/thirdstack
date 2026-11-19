import { config } from "./config.js";
import { Store } from "./store.js";
type StorageSettings = Pick<
  typeof config,
  "storageBackend" | "databaseUrl" | "dbPath" | "legacyWorkspaceId"
>;
/** The API and maintenance commands share backend selection; a URL alone never switches it. */
export function openConfiguredStore(
  settings: StorageSettings = config,
  workspaceId = settings.legacyWorkspaceId,
) {
  if (!["sqlite", "postgres"].includes(settings.storageBackend))
    throw new Error("STORAGE_BACKEND must be sqlite or postgres.");
  if (settings.storageBackend === "postgres" && !settings.databaseUrl)
    throw new Error("Set DATABASE_URL before choosing Postgres.");
  return new Store(
    settings.dbPath,
    settings.storageBackend === "postgres" ? settings.databaseUrl : undefined,
    workspaceId,
  );
}
