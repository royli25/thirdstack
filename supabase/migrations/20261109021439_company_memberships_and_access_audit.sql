SET search_path TO octolab,pg_catalog;
CREATE TABLE company_memberships (
  company_id UUID NOT NULL REFERENCES tool_companies(id),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','analyst')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(company_id,user_id)
);
INSERT INTO company_memberships(company_id,user_id,role) SELECT id,owner_user_id,'owner' FROM tool_companies;
CREATE INDEX company_membership_user ON company_memberships(user_id,company_id);
CREATE TABLE company_access_events (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES tool_companies(id),
  actor_user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('member_granted','member_revoked','report_accessed')),
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data JSONB NOT NULL
);
CREATE INDEX company_access_history ON company_access_events(company_id,at,id);
CREATE TABLE company_team_requests (
  company_id UUID NOT NULL REFERENCES tool_companies(id),
  actor_user_id UUID NOT NULL,
  request_key UUID NOT NULL,
  input_hash TEXT NOT NULL,
  PRIMARY KEY(company_id,actor_user_id,request_key)
);
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE company_access_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_access_events FORCE ROW LEVEL SECURITY;
ALTER TABLE company_team_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_team_requests FORCE ROW LEVEL SECURITY;
REVOKE ALL ON company_memberships,company_access_events,company_team_requests FROM PUBLIC,octolab_runtime;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON octolab.company_memberships,octolab.company_access_events,octolab.company_team_requests FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON octolab.company_memberships,octolab.company_access_events,octolab.company_team_requests FROM authenticated;
  END IF;
END $$;
