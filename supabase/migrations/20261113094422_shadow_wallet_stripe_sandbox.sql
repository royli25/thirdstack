SET search_path TO octolab,pg_catalog;

-- Enrollment is saved with the checkout intent. Historical sandbox funding is
-- never backfilled into the shadow wallet when an account is enrolled later.
CREATE TABLE shadow_wallet_sandbox_deposits (
  workspace_id TEXT NOT NULL DEFAULT current_setting('octolab.workspace_id'),
  deposit_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, deposit_id),
  FOREIGN KEY (workspace_id, deposit_id) REFERENCES stripe_deposits(workspace_id, id)
);
CREATE TABLE shadow_wallet_sandbox_entries (
  workspace_id TEXT NOT NULL DEFAULT current_setting('octolab.workspace_id'),
  deposit_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision > 0),
  payment_intent_id TEXT NOT NULL CHECK (left(payment_intent_id, 3) = 'pi_'),
  kind TEXT NOT NULL CHECK (kind IN ('deposit', 'refund', 'dispute_hold')),
  target_micros BIGINT NOT NULL CHECK (target_micros BETWEEN 0 AND 1000000000),
  wallet_micros BIGINT NOT NULL CHECK (wallet_micros BETWEEN -1000000000 AND 1000000000 AND (wallet_micros <> 0 OR kind = 'dispute_hold')),
  dispute_marker BOOLEAN GENERATED ALWAYS AS (CASE WHEN kind = 'dispute_hold' THEN true END) STORED,
  clearing_micros BIGINT GENERATED ALWAYS AS (-wallet_micros) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, deposit_id, revision),
  UNIQUE (workspace_id, deposit_id, dispute_marker),
  FOREIGN KEY (workspace_id, deposit_id) REFERENCES shadow_wallet_sandbox_deposits(workspace_id, deposit_id)
);

ALTER TABLE shadow_wallet_sandbox_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_wallet_sandbox_deposits FORCE ROW LEVEL SECURITY;
ALTER TABLE shadow_wallet_sandbox_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_wallet_sandbox_entries FORCE ROW LEVEL SECURITY;
CREATE POLICY shadow_sandbox_deposit_scope ON shadow_wallet_sandbox_deposits TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true))
  WITH CHECK (workspace_id = current_setting('octolab.workspace_id', true));
CREATE POLICY shadow_sandbox_entry_scope ON shadow_wallet_sandbox_entries TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true))
  WITH CHECK (workspace_id = current_setting('octolab.workspace_id', true));
REVOKE ALL ON shadow_wallet_sandbox_deposits,shadow_wallet_sandbox_entries FROM PUBLIC,octolab_runtime;
GRANT SELECT,INSERT ON shadow_wallet_sandbox_deposits,shadow_wallet_sandbox_entries TO octolab_runtime;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON shadow_wallet_sandbox_deposits,shadow_wallet_sandbox_entries FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON shadow_wallet_sandbox_deposits,shadow_wallet_sandbox_entries FROM authenticated;
  END IF;
END $$;
