SET search_path TO octolab,pg_catalog;

-- Customer-facing payment surface (phase 4). Adds two things and changes no
-- existing row: a log of paid calls the wallet refused, and an audit record
-- for operator balance adjustments.

-- A refused call rolls back before any receipt is written, so nothing else
-- records it. The account owner needs to see that a paid call was refused and
-- why. One row per account, balance, tool, reason and minute: a retrying agent
-- raises a counter instead of adding rows. No request content, key or prompt
-- is stored, and no row here moves money.
CREATE TABLE wallet_refusals (
  workspace_id TEXT NOT NULL DEFAULT current_setting('octolab.workspace_id') REFERENCES workspaces(id),
  mode TEXT NOT NULL CHECK (mode IN ('test', 'live')),
  tool TEXT NOT NULL CHECK (length(tool) BETWEEN 1 AND 200),
  reason TEXT NOT NULL CHECK (reason IN ('insufficient_balance', 'dispute_hold', 'rate_unverified')),
  minute TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', now()),
  refusals INTEGER NOT NULL DEFAULT 1 CHECK (refusals > 0),
  required_micros BIGINT NOT NULL CHECK (required_micros >= 0),
  available_micros BIGINT NOT NULL CHECK (available_micros >= 0),
  last_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, mode, tool, reason, minute)
);
CREATE INDEX wallet_refusals_recent ON wallet_refusals (workspace_id, mode, last_at DESC);

ALTER TABLE wallet_refusals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_refusals FORCE ROW LEVEL SECURITY;
CREATE POLICY wallet_refusal_scope ON wallet_refusals TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true))
  WITH CHECK (workspace_id = current_setting('octolab.workspace_id', true));
REVOKE ALL ON wallet_refusals FROM PUBLIC,octolab_runtime;
GRANT SELECT,INSERT ON wallet_refusals TO octolab_runtime;
-- The counter of the current minute is the only thing the runtime may change.
GRANT UPDATE (refusals, required_micros, available_micros, last_at) ON wallet_refusals TO octolab_runtime;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON wallet_refusals FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON wallet_refusals FROM authenticated;
  END IF;
END $$;

-- An operator adjustment is recorded like the other operator money actions.
-- It belongs to an account and a mode, not to a payment, so the payment
-- reference is empty for this kind only. The runtime role keeps no access to
-- this table and still cannot post an adjustment to the journal.
ALTER TABLE wallet_operator_actions DROP CONSTRAINT wallet_operator_actions_kind_check;
ALTER TABLE wallet_operator_actions ADD CONSTRAINT wallet_operator_actions_kind_check
  CHECK (kind IN ('dispute_release', 'refund_request', 'refund_resolution', 'adjustment'));
ALTER TABLE wallet_operator_actions ALTER COLUMN deposit_id DROP NOT NULL;
ALTER TABLE wallet_operator_actions ADD CONSTRAINT wallet_operator_actions_subject
  CHECK ((kind = 'adjustment') = (deposit_id IS NULL));
CREATE INDEX wallet_operator_actions_account ON wallet_operator_actions (workspace_id, created_at DESC)
  WHERE kind = 'adjustment';
