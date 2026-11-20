SET search_path TO octolab,pg_catalog;

-- Stripe live mode for the prepaid wallet. Every payment and every wallet row
-- records its Stripe mode, and each mode has its own balance. Rows written
-- before this migration are sandbox rows and are labelled 'test'.

-- A card deposit is created in exactly one Stripe mode and never changes it.
ALTER TABLE stripe_deposits
  ADD COLUMN mode TEXT NOT NULL DEFAULT 'test' CHECK (mode IN ('test', 'live'));
ALTER TABLE stripe_deposits
  ADD CONSTRAINT stripe_deposits_mode_session
    CHECK (session_id IS NULL OR starts_with(session_id, 'cs_' || mode || '_')),
  ADD CONSTRAINT stripe_deposits_mode_key UNIQUE (workspace_id, id, mode);
CREATE FUNCTION stripe_deposit_mode_is_fixed() RETURNS trigger
LANGUAGE plpgsql SET search_path = octolab, pg_catalog AS $$
BEGIN
  IF NEW.mode IS DISTINCT FROM OLD.mode THEN
    RAISE EXCEPTION 'the Stripe mode of deposit % cannot change', OLD.id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER stripe_deposit_mode_fixed BEFORE UPDATE ON stripe_deposits
  FOR EACH ROW EXECUTE FUNCTION stripe_deposit_mode_is_fixed();

-- The operator chooses which balance pays for an enrolled account's calls.
-- 'live' also makes the account eligible for live top-ups.
ALTER TABLE wallet_rates
  ADD COLUMN funding_mode TEXT NOT NULL DEFAULT 'test' CHECK (funding_mode IN ('test', 'live'));

-- A wallet deposit carries the mode of its Stripe deposit; the foreign key
-- refuses a row whose mode differs from the payment it points at.
ALTER TABLE wallet_deposits
  ADD COLUMN mode TEXT NOT NULL DEFAULT 'test' CHECK (mode IN ('test', 'live'));
ALTER TABLE wallet_deposits
  ADD CONSTRAINT wallet_deposits_mode_key UNIQUE (workspace_id, deposit_id, mode),
  ADD CONSTRAINT wallet_deposits_stripe_mode_fkey
    FOREIGN KEY (workspace_id, deposit_id, mode) REFERENCES stripe_deposits(workspace_id, id, mode);

ALTER TABLE wallet_holds
  ADD COLUMN mode TEXT NOT NULL DEFAULT 'test' CHECK (mode IN ('test', 'live'));
ALTER TABLE wallet_holds
  ADD CONSTRAINT wallet_holds_mode_key UNIQUE (workspace_id, call_id, mode);

-- A deposit, refund or dispute posting must be in its deposit's mode, and a
-- usage debit in its hold's mode. Neither side can post into the other balance.
ALTER TABLE wallet_journal
  ADD COLUMN mode TEXT NOT NULL DEFAULT 'test' CHECK (mode IN ('test', 'live'));
ALTER TABLE wallet_journal
  ADD CONSTRAINT wallet_journal_deposit_mode_fkey
    FOREIGN KEY (workspace_id, deposit_id, mode) REFERENCES wallet_deposits(workspace_id, deposit_id, mode),
  ADD CONSTRAINT wallet_journal_call_mode_fkey
    FOREIGN KEY (workspace_id, call_id, mode) REFERENCES wallet_holds(workspace_id, call_id, mode);
-- Every posting names its mode. Without a default, a hand-written adjustment
-- that forgets the mode is refused instead of landing in the sandbox balance
-- of a live account.
ALTER TABLE wallet_journal ALTER COLUMN mode DROP DEFAULT;
-- A payment can be disputed again after an earlier dispute was released. The
-- journal therefore allows one hold and one release per dispute cycle, and an
-- account is frozen while any payment has more holds than releases. The
-- application posts a hold only when the payment is not already held.
ALTER TABLE wallet_journal
  DROP CONSTRAINT wallet_journal_workspace_id_deposit_id_dispute_marker_key,
  DROP CONSTRAINT wallet_journal_workspace_id_deposit_id_release_marker_key;

-- One balance projection per account and mode.
ALTER TABLE wallet_balances
  ADD COLUMN mode TEXT NOT NULL DEFAULT 'test' CHECK (mode IN ('test', 'live'));
ALTER TABLE wallet_balances DROP CONSTRAINT wallet_balances_pkey;
ALTER TABLE wallet_balances ADD PRIMARY KEY (workspace_id, mode);

CREATE OR REPLACE FUNCTION wallet_apply_journal() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = octolab, pg_catalog AS $$
BEGIN
  INSERT INTO wallet_balances AS b (workspace_id, mode, posted_micros, charged_micros)
  VALUES (NEW.workspace_id, NEW.mode, NEW.wallet_micros,
          CASE WHEN NEW.kind = 'usage' THEN -NEW.wallet_micros ELSE 0 END)
  ON CONFLICT (workspace_id, mode) DO UPDATE
    SET posted_micros = b.posted_micros + EXCLUDED.posted_micros,
        charged_micros = b.charged_micros + EXCLUDED.charged_micros,
        updated_at = now();
  RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION wallet_apply_hold() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = octolab, pg_catalog AS $$
BEGIN
  INSERT INTO wallet_balances AS b (workspace_id, mode, held_micros)
  VALUES (NEW.workspace_id, NEW.mode, NEW.maximum_micros)
  ON CONFLICT (workspace_id, mode) DO UPDATE
    SET held_micros = b.held_micros + EXCLUDED.held_micros, updated_at = now();
  RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION wallet_apply_closure() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = octolab, pg_catalog AS $$
BEGIN
  UPDATE wallet_balances b
  SET held_micros = b.held_micros - h.maximum_micros, updated_at = now()
  FROM wallet_holds h
  WHERE h.workspace_id = NEW.workspace_id AND h.call_id = NEW.call_id
    AND b.workspace_id = NEW.workspace_id AND b.mode = h.mode;
  -- Fail the closure rather than let the projection drift from its hold.
  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet hold % has no balance projection', NEW.call_id;
  END IF;
  RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION wallet_rebuild_balances() RETURNS void
LANGUAGE sql SET search_path = octolab, pg_catalog AS $$
  INSERT INTO wallet_balances AS b (workspace_id, mode, posted_micros, held_micros, charged_micros)
  SELECT workspace_id, mode, sum(posted), sum(held), sum(charged) FROM (
    SELECT workspace_id, mode, wallet_micros AS posted, 0::bigint AS held,
           CASE WHEN kind = 'usage' THEN -wallet_micros ELSE 0 END AS charged
    FROM wallet_journal
    UNION ALL
    SELECT h.workspace_id, h.mode, 0, h.maximum_micros, 0 FROM wallet_holds h
    WHERE NOT EXISTS (
      SELECT 1 FROM wallet_hold_closures c
      WHERE c.workspace_id = h.workspace_id AND c.call_id = h.call_id
    )
    UNION ALL
    SELECT workspace_id, mode, 0, 0, 0 FROM wallet_balances
  ) amounts GROUP BY workspace_id, mode
  ON CONFLICT (workspace_id, mode) DO UPDATE
    SET posted_micros = EXCLUDED.posted_micros, held_micros = EXCLUDED.held_micros,
        charged_micros = EXCLUDED.charged_micros, updated_at = now()
    WHERE b.posted_micros <> EXCLUDED.posted_micros OR b.held_micros <> EXCLUDED.held_micros
       OR b.charged_micros <> EXCLUDED.charged_micros;
$$;
REVOKE ALL ON FUNCTION stripe_deposit_mode_is_fixed() FROM PUBLIC;

-- Operator refund of unused credit, back to the card that paid for it. The
-- operator path reserves the amount in the journal in the same transaction as
-- this row, before Stripe is called. While a request is reserved or submitted,
-- payment reconciliation keeps the amount out of the balance even though
-- Stripe has not reported the refund yet. The runtime can read its own rows so
-- that reconciliation sees the reservation; it cannot create or change them.
CREATE TABLE wallet_refund_requests (
  id UUID PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  deposit_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('test', 'live')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  -- Stripe's cumulative refunded total for the payment once this refund lands.
  expected_refunded_cents INTEGER NOT NULL CHECK (expected_refunded_cents >= amount_cents),
  status TEXT NOT NULL CHECK (status IN ('reserved', 'submitted', 'completed', 'failed')),
  stripe_refund_id TEXT UNIQUE CHECK (stripe_refund_id ~ '^re_'),
  policy_version TEXT NOT NULL CHECK (length(policy_version) BETWEEN 1 AND 120),
  actor TEXT NOT NULL CHECK (length(actor) BETWEEN 1 AND 200),
  note TEXT NOT NULL CHECK (length(note) BETWEEN 10 AND 4000),
  request_key UUID NOT NULL UNIQUE,
  input_hash TEXT NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (workspace_id, deposit_id, mode) REFERENCES wallet_deposits(workspace_id, deposit_id, mode)
);
-- One refund in flight per payment keeps the expected Stripe total unambiguous.
CREATE UNIQUE INDEX wallet_refund_requests_active ON wallet_refund_requests (workspace_id, deposit_id)
  WHERE status IN ('reserved', 'submitted');

-- Immutable record of operator money actions and who took them.
CREATE TABLE wallet_operator_actions (
  id UUID PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  deposit_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('test', 'live')),
  kind TEXT NOT NULL CHECK (kind IN ('dispute_release', 'refund_request', 'refund_resolution')),
  actor TEXT NOT NULL CHECK (length(actor) BETWEEN 1 AND 200),
  request_key UUID NOT NULL UNIQUE,
  input_hash TEXT NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (workspace_id, deposit_id, mode) REFERENCES wallet_deposits(workspace_id, deposit_id, mode)
);
CREATE INDEX wallet_operator_actions_deposit ON wallet_operator_actions (workspace_id, deposit_id, created_at);

-- Durable operator-visible record of a payment condition the server could not
-- settle by itself, such as a live event that matched no account or a refund
-- total it could not verify. One open alert per kind and reference. The
-- runtime can raise an alert for its own account; only the owner connection
-- (the admin API) reads and resolves them.
CREATE TABLE wallet_operator_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT DEFAULT current_setting('octolab.workspace_id', true) REFERENCES workspaces(id),
  mode TEXT NOT NULL CHECK (mode IN ('test', 'live')),
  kind TEXT NOT NULL CHECK (length(kind) BETWEEN 1 AND 80),
  reference TEXT NOT NULL CHECK (length(reference) BETWEEN 1 AND 200),
  detail JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT CHECK (length(resolved_by) BETWEEN 1 AND 200),
  resolution_note TEXT CHECK (length(resolution_note) BETWEEN 10 AND 4000),
  CHECK ((resolved_at IS NULL) = (resolved_by IS NULL) AND (resolved_at IS NULL) = (resolution_note IS NULL))
);
CREATE UNIQUE INDEX wallet_operator_alerts_open ON wallet_operator_alerts (kind, reference)
  WHERE resolved_at IS NULL;

ALTER TABLE wallet_refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_refund_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE wallet_operator_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_operator_actions FORCE ROW LEVEL SECURITY;
ALTER TABLE wallet_operator_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_operator_alerts FORCE ROW LEVEL SECURITY;
CREATE POLICY wallet_operator_alert_raise ON wallet_operator_alerts FOR INSERT TO octolab_runtime
  WITH CHECK (workspace_id = current_setting('octolab.workspace_id', true)
    AND resolved_at IS NULL);
CREATE POLICY wallet_refund_request_read ON wallet_refund_requests FOR SELECT TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true));

REVOKE ALL ON wallet_refund_requests,wallet_operator_actions,wallet_operator_alerts FROM PUBLIC,octolab_runtime;
GRANT SELECT ON wallet_refund_requests TO octolab_runtime;
GRANT INSERT ON wallet_operator_alerts TO octolab_runtime;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON wallet_refund_requests,wallet_operator_actions,wallet_operator_alerts FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON wallet_refund_requests,wallet_operator_actions,wallet_operator_alerts FROM authenticated;
  END IF;
END $$;
