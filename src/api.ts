import type { Task, TraceEvent } from "../server/types";
export type TaskDetail = Task & {
  events: TraceEvent[];
  organizations: {
    name: string;
    sources: { id: string; title: string; url: string }[];
    notes: string[];
    criteria: Record<string, string[]>;
  }[];
};
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
let accessToken = "";
let previewRole: "user" | "company" | null = null;
let previewTarget: string | null = null;
export function setPreviewRole(
  role: typeof previewRole,
  target: string | null = null,
) {
  previewRole = role;
  previewTarget = role === "company" ? target : null;
  contextEpoch++;
}
let accountId = "",
  contextEpoch = 0;
export function setAccountSession(token: string, userId: string) {
  if (accountId !== userId) contextEpoch++;
  accessToken = token;
  accountId = userId;
}
export function apiHeaders(): Record<string, string> {
  return {
    ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
    ...(previewRole ? { "X-Octolab-Preview": previewRole } : {}),
    ...(previewTarget ? { "X-Octolab-Preview-Target": previewTarget } : {}),
  };
}
export function setToken(value: string) {
  contextEpoch++;
  accessToken = value;
  accountId = "";
  previewRole = null;
  previewTarget = null;
}
const pendingReads = new Map<string, Promise<unknown>>();
// A read captured before navigation must not be reused when a view is reopened.
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => pendingReads.clear());
  window.addEventListener("popstate", () => pendingReads.clear());
}
export function api<T = any>(path: string, body?: unknown): Promise<T> {
  if (body !== undefined) {
    pendingReads.clear();
    return request<T>(path, body).finally(() => pendingReads.clear());
  }
  const key = JSON.stringify([contextEpoch, accessToken, path]);
  const existing = pendingReads.get(key);
  if (existing) return existing as Promise<T>;
  const work = request<T>(path).finally(() => {
    if (pendingReads.get(key) === work) pendingReads.delete(key);
  });
  pendingReads.set(key, work);
  return work;
}
async function request<T>(path: string, body?: unknown): Promise<T> {
  const epoch = contextEpoch,
    token = accessToken;
  const response = await fetch(`/api${path}`, {
    ...(body === undefined ? { signal: AbortSignal.timeout(30000) } : {}),
    headers: {
      ...apiHeaders(),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(/\/(run|fetch)$/.test(path) && body !== undefined
        ? { "Idempotency-Key": crypto.randomUUID() }
        : {}),
    },
    ...(body !== undefined
      ? { method: "POST", body: JSON.stringify(body) }
      : {}),
  });
  const data = await response.json();
  if (epoch !== contextEpoch)
    throw new ApiError(
      "Account changed. The earlier response was discarded.",
      409,
    );
  if (response.status === 401 && accountId && token === accessToken)
    window.dispatchEvent(new Event("octolab-session-invalid"));
  // Local mode: a request rejected for a missing or wrong server token lets
  // the app offer the access-token prompt on any page.
  else if (response.status === 401 && !accountId && token === accessToken)
    window.dispatchEvent(new Event("octolab-access-required"));
  if (!response.ok)
    throw new ApiError(
      data.error || `Request failed (${response.status})`,
      response.status,
    );
  return data;
}
export function money(micros: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 6,
  }).format(micros / 1e6);
}
export function shortDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
