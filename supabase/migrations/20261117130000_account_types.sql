-- Account types: every signed-in account is either a "business" (a tool company / seller)
-- or a "user" (someone whose agents use tools through Two Hands).
--
-- How it fits with the rest of the schema:
--   * user_id is the Supabase Auth user id (auth.users.id), the same id used by
--     octolab.workspace_memberships and octolab.company_memberships.
--   * A user's payment data (stripe_deposits, funding_ledger, ...) belongs to their
--     personal workspace, which is found through workspace_memberships. Nothing here
--     changes that link.
--   * The type is chosen once, right after the first sign-in, and is then locked.
--     The trigger below rejects every UPDATE and DELETE, so neither the app nor the
--     account holder can change it. An operator who must correct a mistake has to
--     run SQL by hand (see docs/AUTH.md, "Account types").
SET search_path TO octolab, pg_catalog;

CREATE TABLE account_types (
  user_id UUID PRIMARY KEY,
  account_type TEXT NOT NULL CHECK (account_type IN ('business', 'user')),
  -- 'chosen' when the person picked it; 'backfill' when this migration assigned it.
  source TEXT NOT NULL CHECK (source IN ('chosen', 'backfill')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lock the type: any attempt to change or remove a row fails.
CREATE FUNCTION account_types_locked() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  RAISE EXCEPTION 'Account types are permanent and cannot be changed or deleted.'
    USING ERRCODE = 'insufficient_privilege';
END $$;
CREATE TRIGGER account_types_no_update_or_delete
  BEFORE UPDATE OR DELETE ON account_types
  FOR EACH ROW EXECUTE FUNCTION account_types_locked();
CREATE TRIGGER account_types_no_truncate
  BEFORE TRUNCATE ON account_types
  FOR EACH STATEMENT EXECUTE FUNCTION account_types_locked();

-- Row-level security, matching the other private account tables: RLS is on and forced,
-- there are no policies, and no browser or runtime role has any grant. Only the
-- server's own database connection reads or inserts rows, after verifying the
-- signed-in Supabase session.
ALTER TABLE account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_types FORCE ROW LEVEL SECURITY;
REVOKE ALL ON account_types FROM PUBLIC, octolab_runtime;
REVOKE ALL ON FUNCTION account_types_locked() FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON octolab.account_types FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON octolab.account_types FROM authenticated;
  END IF;
END $$;

-- Backfill existing accounts (agreed rule):
--   1. Anyone who belongs to a tool company (owner or analyst) becomes 'business'.
--   2. Everyone else who has a personal workspace becomes 'user'.
-- Accounts that have neither get no row and choose a type at their next sign-in.
INSERT INTO account_types (user_id, account_type, source)
SELECT DISTINCT user_id, 'business', 'backfill' FROM company_memberships
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO account_types (user_id, account_type, source)
SELECT DISTINCT user_id, 'user', 'backfill' FROM workspace_memberships
ON CONFLICT (user_id) DO NOTHING;
