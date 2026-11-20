SET search_path TO octolab, pg_catalog;
CREATE TABLE tool_companies (
  id UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  request_key UUID NOT NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 80),
  website TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  provider_id TEXT CHECK (provider_id IN ('exa','tavily','firecrawl')),
  insights_enabled BOOLEAN NOT NULL DEFAULT false,
  feedback TEXT NOT NULL DEFAULT '',
  revision INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_user_id,request_key),
  CHECK (status <> 'approved' OR provider_id IS NOT NULL),
  CHECK (NOT insights_enabled OR status = 'approved')
);
CREATE UNIQUE INDEX approved_company_provider ON tool_companies(provider_id) WHERE status = 'approved';
CREATE INDEX tool_company_owner ON tool_companies(owner_user_id,created_at);
CREATE TABLE company_review_events (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES tool_companies(id),
  actor_user_id UUID NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revision INTEGER NOT NULL,
  data JSONB NOT NULL,
  UNIQUE(company_id,revision)
);
CREATE INDEX company_review_history ON company_review_events(company_id,at);
ALTER TABLE tool_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_companies FORCE ROW LEVEL SECURITY;
ALTER TABLE company_review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_review_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON tool_companies,company_review_events FROM PUBLIC,octolab_runtime;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON octolab.tool_companies,octolab.company_review_events FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON octolab.tool_companies,octolab.company_review_events FROM authenticated;
  END IF;
END $$;
