SET search_path TO octolab,pg_catalog;
CREATE TABLE mcp_grants (
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  client_name TEXT NOT NULL CHECK(length(client_name) BETWEEN 1 AND 200),
  resource TEXT NOT NULL,
  generation UUID NOT NULL DEFAULT gen_random_uuid(),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  PRIMARY KEY(user_id,client_id)
);
CREATE TABLE mcp_grant_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('authorized','revoked')),
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE mcp_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_grants FORCE ROW LEVEL SECURITY;
ALTER TABLE mcp_grant_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_grant_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON mcp_grants,mcp_grant_events FROM PUBLIC,octolab_runtime;
-- The managed Auth service owns PKCE, codes, refresh rotation and client registration.
-- Its token hook binds agent tokens to the specific resource explicitly approved
-- in the Two Hands consent UI. Ordinary browser sign-in tokens are unchanged.
CREATE FUNCTION public.two_hands_mcp_token_hook(event JSONB) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE claims JSONB := event->'claims'; resource TEXT; generation UUID;
BEGIN
  IF NULLIF(claims->>'client_id','') IS NOT NULL THEN
    SELECT g.resource,g.generation INTO resource,generation FROM octolab.mcp_grants g
      WHERE g.user_id=(event->>'user_id')::UUID
      AND g.client_id=(claims->>'client_id')::UUID AND g.revoked_at IS NULL;
    IF resource IS NULL THEN
      RAISE EXCEPTION 'Agent access has not been authorized or was disconnected';
    END IF;
    claims := jsonb_set(claims,'{aud}',to_jsonb(resource));
    claims := jsonb_set(claims,'{two_hands_grant}',to_jsonb(generation::TEXT));
  END IF;
  RETURN jsonb_build_object('claims',claims);
END;
$$;
REVOKE ALL ON FUNCTION public.two_hands_mcp_token_hook(JSONB) FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='supabase_auth_admin') THEN
    GRANT EXECUTE ON FUNCTION public.two_hands_mcp_token_hook(JSONB) TO supabase_auth_admin;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON octolab.mcp_grants,octolab.mcp_grant_events FROM anon;
    REVOKE ALL ON FUNCTION public.two_hands_mcp_token_hook(JSONB) FROM anon;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON octolab.mcp_grants,octolab.mcp_grant_events FROM authenticated;
    REVOKE ALL ON FUNCTION public.two_hands_mcp_token_hook(JSONB) FROM authenticated;
  END IF;
END $$;
