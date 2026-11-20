SET search_path TO octolab,pg_catalog;
CREATE TABLE platform_tool_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK(id),
  revision INTEGER NOT NULL CHECK(revision>0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  values JSONB NOT NULL,
  secret_refs JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE platform_tool_setting_events (
  id UUID PRIMARY KEY,
  actor_user_id UUID NOT NULL,
  request_key UUID NOT NULL,
  input_hash TEXT NOT NULL,
  revision INTEGER NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data JSONB NOT NULL,
  UNIQUE(actor_user_id,request_key)
);
ALTER TABLE platform_tool_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_tool_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE platform_tool_setting_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_tool_setting_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON platform_tool_settings,platform_tool_setting_events FROM PUBLIC,octolab_runtime;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON platform_tool_settings,platform_tool_setting_events FROM anon;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON platform_tool_settings,platform_tool_setting_events FROM authenticated;
  END IF;
END $$;
