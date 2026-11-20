SET search_path TO octolab,pg_catalog;
-- Seller state is keyed by provider and shared across customer workspaces.
-- Only the service connection reads or writes it; no workspace role has access.
CREATE TABLE seller_settings (
  key TEXT PRIMARY KEY CHECK(length(key) BETWEEN 1 AND 120),
  body JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE seller_listings (
  provider TEXT NOT NULL CHECK(length(provider) BETWEEN 1 AND 60),
  version INTEGER NOT NULL CHECK(version>0),
  body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(provider,version)
);
CREATE TABLE seller_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider TEXT NOT NULL CHECK(length(provider) BETWEEN 1 AND 60),
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  body JSONB NOT NULL
);
CREATE INDEX seller_events_provider ON seller_events(provider,id DESC);
ALTER TABLE seller_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE seller_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_listings FORCE ROW LEVEL SECURITY;
ALTER TABLE seller_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON seller_settings,seller_listings,seller_events FROM PUBLIC,octolab_runtime;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON seller_settings,seller_listings,seller_events FROM anon;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON seller_settings,seller_listings,seller_events FROM authenticated;
  END IF;
END $$;
