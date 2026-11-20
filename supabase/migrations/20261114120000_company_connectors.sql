SET search_path TO octolab,pg_catalog;
-- Company-supplied MCP connectors are part of the shared catalog, not a customer
-- workspace. Only the service connection reads or writes them. Connector tokens
-- are stored AES-256-GCM encrypted inside body by the application.
CREATE TABLE connectors (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE CHECK(slug ~ '^[a-z][a-z0-9]{1,23}$'),
  request_key TEXT NOT NULL UNIQUE CHECK(length(request_key) BETWEEN 1 AND 64),
  body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE connector_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  connector_id UUID NOT NULL REFERENCES connectors(id),
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  body JSONB NOT NULL
);
CREATE INDEX connector_events_connector ON connector_events(connector_id,id DESC);
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors FORCE ROW LEVEL SECURITY;
ALTER TABLE connector_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON connectors,connector_events FROM PUBLIC,octolab_runtime;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON connectors,connector_events FROM anon;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON connectors,connector_events FROM authenticated;
  END IF;
END $$;
-- A company can now be approved to supply its own MCP connectors without owning
-- a built-in provider. Aggregate insights still require a provider binding,
-- which the application enforces.
DO $$
DECLARE c TEXT;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'octolab.tool_companies'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%provider_id IS NOT NULL%'
  LOOP
    EXECUTE format('ALTER TABLE octolab.tool_companies DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
ALTER TABLE tool_companies
  ADD CONSTRAINT tool_companies_insights_need_provider
  CHECK (NOT insights_enabled OR provider_id IS NOT NULL);
