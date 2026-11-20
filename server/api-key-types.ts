export const API_KEY_SCOPES = [
  "tools:discover",
  "research:read",
  "research:write",
  "tools:execute",
  "usage:read",
] as const;
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];
export { toolIdentifiers as API_KEY_TOOLS } from "./provider-identifiers.js";
import { toolIdentifiers as API_KEY_TOOLS } from "./provider-identifiers.js";
export interface ScopedApiKey {
  id: string;
  workspaceId: string;
  name: string;
  prefix: string;
  scopes: ApiKeyScope[];
  allowedTools: (typeof API_KEY_TOOLS)[number][];
  limitMicros: number;
  spentMicros: number;
  reservedMicros: number;
  remainingMicros: number;
  revision: number;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  status: "active" | "expired" | "revoked" | "at_limit";
}
export interface ApiKeyEvent {
  id: string;
  keyId: string;
  type: "created" | "updated" | "revoked";
  at: string;
  actor: "workspace_owner_credential" | "authenticated_account";
  actorId?: string;
  previous: ScopedApiKey | null;
  current: ScopedApiKey;
}
