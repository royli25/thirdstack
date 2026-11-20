SET search_path TO octolab,pg_catalog;
-- Bind the original grant generation to each managed Auth session. A failed
-- remote revocation must not let an old refresh token join a later re-approval.
CREATE TABLE mcp_grant_sessions (
  session_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  generation UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE mcp_grant_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_grant_sessions FORCE ROW LEVEL SECURITY;
REVOKE ALL ON mcp_grant_sessions FROM PUBLIC,octolab_runtime;
-- Keep the final hook in the backed-up application schema.
ALTER FUNCTION public.two_hands_mcp_token_hook(JSONB) SET SCHEMA octolab;
CREATE OR REPLACE FUNCTION octolab.two_hands_mcp_token_hook(event JSONB) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE claims JSONB := event->'claims'; resource TEXT; generation UUID; session_generation UUID; session UUID;
BEGIN
  IF NULLIF(claims->>'client_id','') IS NOT NULL THEN
    session := (claims->>'session_id')::UUID;
    IF session IS NULL THEN RAISE EXCEPTION 'Agent session is missing'; END IF;
    SELECT g.resource,g.generation INTO resource,generation FROM octolab.mcp_grants g
      WHERE g.user_id=(event->>'user_id')::UUID
      AND g.client_id=(claims->>'client_id')::UUID AND g.revoked_at IS NULL;
    IF resource IS NULL THEN
      RAISE EXCEPTION 'Agent access has not been authorized or was disconnected';
    END IF;
    SELECT s.generation INTO session_generation FROM octolab.mcp_grant_sessions s
      WHERE s.session_id=session AND s.user_id=(event->>'user_id')::UUID AND s.client_id=(claims->>'client_id')::UUID;
    IF session_generation IS NULL THEN
      IF event->>'authentication_method' IN ('token_refresh','refresh_token') THEN
        RAISE EXCEPTION 'Sign in again to authorize this agent session';
      END IF;
      INSERT INTO octolab.mcp_grant_sessions(session_id,user_id,client_id,generation)
        VALUES(session,(event->>'user_id')::UUID,(claims->>'client_id')::UUID,generation);
    ELSIF session_generation<>generation THEN
      RAISE EXCEPTION 'Agent session was disconnected; sign in again';
    END IF;
    claims := jsonb_set(claims,'{aud}',to_jsonb(resource));
    claims := jsonb_set(claims,'{two_hands_grant}',to_jsonb(generation::TEXT));
  END IF;
  RETURN jsonb_build_object('claims',claims);
END;
$$;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='supabase_auth_admin') THEN
    GRANT USAGE ON SCHEMA octolab TO supabase_auth_admin;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON octolab.mcp_grant_sessions FROM anon;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON octolab.mcp_grant_sessions FROM authenticated;
  END IF;
END $$;
