SET search_path TO octolab,pg_catalog;
CREATE TABLE workspace_allowances (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id),
  limit_micros BIGINT NOT NULL CHECK(limit_micros BETWEEN 0 AND 1000000000),
  spent_micros BIGINT NOT NULL DEFAULT 0 CHECK(spent_micros>=0),
  reserved_micros BIGINT NOT NULL DEFAULT 0 CHECK(reserved_micros>=0),
  paused BOOLEAN NOT NULL DEFAULT false,
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(spent_micros+reserved_micros<=limit_micros)
);
CREATE TABLE workspace_allowance_spend (
  workspace_id TEXT NOT NULL DEFAULT current_setting('octolab.workspace_id') REFERENCES workspace_allowances(workspace_id),
  call_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('observation','task','provider_lab')),
  amount_micros BIGINT NOT NULL CHECK(amount_micros BETWEEN 0 AND 1000000000),
  state TEXT NOT NULL CHECK(state IN ('reserved','settled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ,
  PRIMARY KEY(workspace_id,call_id)
);
CREATE INDEX workspace_allowance_reserved ON workspace_allowance_spend(workspace_id,call_id) WHERE state='reserved';
CREATE TABLE workspace_allowance_events (
  id UUID PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  actor_user_id UUID NOT NULL,
  request_key UUID NOT NULL,
  input_hash TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data JSONB NOT NULL,
  UNIQUE(workspace_id,actor_user_id,request_key)
);
ALTER TABLE workspace_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_allowances FORCE ROW LEVEL SECURITY;
ALTER TABLE workspace_allowance_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_allowance_spend FORCE ROW LEVEL SECURITY;
ALTER TABLE workspace_allowance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_allowance_events FORCE ROW LEVEL SECURITY;
CREATE POLICY workspace_allowance_scope ON workspace_allowances TO octolab_runtime
  USING(workspace_id=current_setting('octolab.workspace_id',true))
  WITH CHECK(workspace_id=current_setting('octolab.workspace_id',true));
CREATE POLICY workspace_allowance_spend_scope ON workspace_allowance_spend TO octolab_runtime
  USING(workspace_id=current_setting('octolab.workspace_id',true))
  WITH CHECK(workspace_id=current_setting('octolab.workspace_id',true));
REVOKE ALL ON workspace_allowances,workspace_allowance_spend,workspace_allowance_events FROM PUBLIC,octolab_runtime;
GRANT SELECT ON workspace_allowances TO octolab_runtime;
GRANT UPDATE(spent_micros,reserved_micros) ON workspace_allowances TO octolab_runtime;
GRANT SELECT,INSERT ON workspace_allowance_spend TO octolab_runtime;
GRANT UPDATE(state,settled_at) ON workspace_allowance_spend TO octolab_runtime;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON workspace_allowances,workspace_allowance_spend,workspace_allowance_events FROM anon;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON workspace_allowances,workspace_allowance_spend,workspace_allowance_events FROM authenticated;
  END IF;
END $$;
