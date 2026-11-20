SET search_path TO octolab, pg_catalog;
CREATE UNIQUE INDEX workspace_key_hash_global ON workspace_api_keys(secret_hash);
CREATE TABLE workspace_creation_requests(
  user_id UUID NOT NULL,
  request_key UUID NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  PRIMARY KEY(user_id,request_key)
);
ALTER TABLE workspace_creation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_creation_requests FORCE ROW LEVEL SECURITY;
CREATE TABLE account_audit_events(
  id UUID PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  actor_user_id UUID NOT NULL,
  type TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data JSONB NOT NULL
);
ALTER TABLE account_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_audit_events FORCE ROW LEVEL SECURITY;
CREATE INDEX account_audit_workspace ON account_audit_events(workspace_id,at);
