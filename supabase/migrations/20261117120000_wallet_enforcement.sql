SET search_path TO octolab,pg_catalog;

-- Prepaid service-credit wallet (sandbox phase). Separate from the shadow wallet
-- tables, which keep recording simulated accounting independently.

-- Operator-managed verified rates. Recording a rate enrolls the account for
-- wallet enforcement. The runtime can read its own rate and cannot change it.
CREATE TABLE wallet_rates (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id),
  rate_version TEXT NOT NULL CHECK (length(rate_version) BETWEEN 1 AND 120),
  provider_account TEXT NOT NULL CHECK (length(provider_account) BETWEEN 1 AND 120),
  credential_digest TEXT NOT NULL CHECK (credential_digest ~ '^[a-f0-9]{64}$'),
  provider_cost_micros BIGINT NOT NULL CHECK (provider_cost_micros BETWEEN 0 AND 10000000),
  verified_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL CHECK (expires_at > verified_at)
);

-- Transactionally maintained projection of the journal and open holds.
-- Available credits are posted_micros - held_micros. Only the trigger
-- functions below write it; the runtime role can read its own row.
CREATE TABLE wallet_balances (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id),
  posted_micros BIGINT NOT NULL DEFAULT 0,
  held_micros BIGINT NOT NULL DEFAULT 0 CHECK (held_micros >= 0),
  charged_micros BIGINT NOT NULL DEFAULT 0 CHECK (charged_micros >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One hold per admitted call, written with the call receipt before provider I/O.
-- Call and key IDs are immutable attribution references that survive research retention.
CREATE TABLE wallet_holds (
  workspace_id TEXT NOT NULL DEFAULT current_setting('octolab.workspace_id') REFERENCES workspaces(id),
  call_id TEXT NOT NULL,
  key_id TEXT,
  tool TEXT NOT NULL CHECK (tool = 'tavily_search'),
  search_depth TEXT NOT NULL CHECK (search_depth = 'basic'),
  max_results INTEGER NOT NULL CHECK (max_results = 10),
  adapter_version TEXT NOT NULL CHECK (adapter_version = '1.0.0'),
  provider_account TEXT NOT NULL CHECK (length(provider_account) BETWEEN 1 AND 120),
  rate_version TEXT NOT NULL CHECK (length(rate_version) BETWEEN 1 AND 120),
  rate_verified_at TIMESTAMPTZ NOT NULL,
  rate_expires_at TIMESTAMPTZ NOT NULL CHECK (rate_expires_at > rate_verified_at),
  provider_cost_micros BIGINT NOT NULL CHECK (provider_cost_micros BETWEEN 0 AND 10000000),
  markup_bps INTEGER NOT NULL CHECK (markup_bps = 1000),
  markup_micros BIGINT NOT NULL CHECK (markup_micros = (provider_cost_micros * markup_bps + 5000) / 10000),
  total_micros BIGINT GENERATED ALWAYS AS (provider_cost_micros + markup_micros) STORED,
  maximum_micros BIGINT NOT NULL CHECK (maximum_micros = (provider_cost_micros * (10000 + markup_bps) + 9999) / 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, call_id),
  UNIQUE (workspace_id, call_id, total_micros),
  CHECK (created_at >= rate_verified_at AND created_at < rate_expires_at)
);

-- Explicit, once-only outcome of each hold.
CREATE TABLE wallet_hold_closures (
  workspace_id TEXT NOT NULL DEFAULT current_setting('octolab.workspace_id'),
  call_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('posted', 'failed', 'interrupted', 'cost_conflict')),
  provider_request_id TEXT CHECK (length(provider_request_id) BETWEEN 1 AND 200),
  reported_credits DOUBLE PRECISION CHECK (reported_credits >= 0 AND reported_credits < 'Infinity'::double precision),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, call_id),
  UNIQUE (workspace_id, call_id, outcome),
  FOREIGN KEY (workspace_id, call_id) REFERENCES wallet_holds(workspace_id, call_id)
);

-- Enrollment is saved with the checkout intent. Deposits created before an
-- account was enrolled are never backfilled into the wallet.
CREATE TABLE wallet_deposits (
  workspace_id TEXT NOT NULL DEFAULT current_setting('octolab.workspace_id'),
  deposit_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, deposit_id),
  FOREIGN KEY (workspace_id, deposit_id) REFERENCES stripe_deposits(workspace_id, id)
);

-- Append-only journal. Each entry represents both equal-and-opposite sides of
-- a posting: wallet_micros to the account wallet, clearing_micros to the
-- counter-account (payments clearing, usage revenue, or operator adjustments).
CREATE TABLE wallet_journal (
  workspace_id TEXT NOT NULL DEFAULT current_setting('octolab.workspace_id') REFERENCES workspaces(id),
  source_id TEXT NOT NULL CHECK (length(source_id) BETWEEN 1 AND 120),
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  kind TEXT NOT NULL CHECK (kind IN ('deposit', 'refund', 'dispute_hold', 'dispute_release', 'usage', 'adjustment')),
  reference TEXT CHECK (length(reference) BETWEEN 1 AND 200),
  target_micros BIGINT CHECK (target_micros BETWEEN 0 AND 1000000000),
  wallet_micros BIGINT NOT NULL CHECK (wallet_micros BETWEEN -1000000000 AND 1000000000),
  clearing_micros BIGINT GENERATED ALWAYS AS (-wallet_micros) STORED,
  call_id TEXT GENERATED ALWAYS AS (CASE WHEN kind = 'usage' THEN source_id END) STORED,
  call_outcome TEXT GENERATED ALWAYS AS (CASE WHEN kind = 'usage' THEN 'posted'::TEXT END) STORED,
  deposit_id TEXT GENERATED ALWAYS AS (CASE WHEN kind IN ('deposit', 'refund', 'dispute_hold', 'dispute_release') THEN source_id END) STORED,
  dispute_marker BOOLEAN GENERATED ALWAYS AS (CASE WHEN kind = 'dispute_hold' THEN true END) STORED,
  release_marker BOOLEAN GENERATED ALWAYS AS (CASE WHEN kind = 'dispute_release' THEN true END) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, source_id, revision),
  UNIQUE (workspace_id, deposit_id, dispute_marker),
  UNIQUE (workspace_id, deposit_id, release_marker),
  FOREIGN KEY (workspace_id, call_id, call_outcome) REFERENCES wallet_hold_closures(workspace_id, call_id, outcome),
  FOREIGN KEY (workspace_id, call_id, clearing_micros) REFERENCES wallet_holds(workspace_id, call_id, total_micros),
  FOREIGN KEY (workspace_id, deposit_id) REFERENCES wallet_deposits(workspace_id, deposit_id),
  CHECK ((kind = 'usage' AND revision = 0 AND wallet_micros BETWEEN -11000000 AND 0)
      OR (kind = 'deposit' AND revision > 0 AND wallet_micros > 0 AND target_micros IS NOT NULL)
      OR (kind = 'refund' AND revision > 0 AND wallet_micros < 0 AND target_micros IS NOT NULL)
      OR (kind = 'dispute_hold' AND revision > 0 AND wallet_micros <= 0 AND target_micros = 0)
      OR (kind = 'dispute_release' AND revision > 0 AND wallet_micros >= 0)
      OR (kind = 'adjustment' AND wallet_micros <> 0 AND reference IS NOT NULL))
);

CREATE INDEX wallet_journal_disputes ON wallet_journal (workspace_id, deposit_id)
  WHERE kind IN ('dispute_hold', 'dispute_release');

-- The projection follows every journal, hold and closure insert in the same
-- transaction, whichever role writes it. The functions run as their owner so
-- the runtime role needs no write access to the projection. Row-level security
-- on the journal, holds and closures already confines the inserting role to
-- its own workspace.
CREATE FUNCTION wallet_apply_journal() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = octolab, pg_catalog AS $$
BEGIN
  INSERT INTO wallet_balances AS b (workspace_id, posted_micros, charged_micros)
  VALUES (NEW.workspace_id, NEW.wallet_micros,
          CASE WHEN NEW.kind = 'usage' THEN -NEW.wallet_micros ELSE 0 END)
  ON CONFLICT (workspace_id) DO UPDATE
    SET posted_micros = b.posted_micros + EXCLUDED.posted_micros,
        charged_micros = b.charged_micros + EXCLUDED.charged_micros,
        updated_at = now();
  RETURN NULL;
END $$;
CREATE FUNCTION wallet_apply_hold() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = octolab, pg_catalog AS $$
BEGIN
  INSERT INTO wallet_balances AS b (workspace_id, held_micros)
  VALUES (NEW.workspace_id, NEW.maximum_micros)
  ON CONFLICT (workspace_id) DO UPDATE
    SET held_micros = b.held_micros + EXCLUDED.held_micros, updated_at = now();
  RETURN NULL;
END $$;
CREATE FUNCTION wallet_apply_closure() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = octolab, pg_catalog AS $$
BEGIN
  UPDATE wallet_balances b
  SET held_micros = b.held_micros - h.maximum_micros, updated_at = now()
  FROM wallet_holds h
  WHERE h.workspace_id = NEW.workspace_id AND h.call_id = NEW.call_id
    AND b.workspace_id = NEW.workspace_id;
  -- Fail the closure rather than let the projection drift from its hold.
  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet hold % has no balance projection', NEW.call_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER wallet_journal_projection AFTER INSERT ON wallet_journal
  FOR EACH ROW EXECUTE FUNCTION wallet_apply_journal();
CREATE TRIGGER wallet_hold_projection AFTER INSERT ON wallet_holds
  FOR EACH ROW EXECUTE FUNCTION wallet_apply_hold();
CREATE TRIGGER wallet_closure_projection AFTER INSERT ON wallet_hold_closures
  FOR EACH ROW EXECUTE FUNCTION wallet_apply_closure();

-- Rebuilds every projection row from the journal and open holds. Operators
-- run this after a restore; it changes nothing when the projection is correct.
CREATE FUNCTION wallet_rebuild_balances() RETURNS void
LANGUAGE sql SET search_path = octolab, pg_catalog AS $$
  INSERT INTO wallet_balances AS b (workspace_id, posted_micros, held_micros, charged_micros)
  SELECT workspace_id, sum(posted), sum(held), sum(charged) FROM (
    SELECT workspace_id, wallet_micros AS posted, 0::bigint AS held,
           CASE WHEN kind = 'usage' THEN -wallet_micros ELSE 0 END AS charged
    FROM wallet_journal
    UNION ALL
    SELECT h.workspace_id, 0, h.maximum_micros, 0 FROM wallet_holds h
    WHERE NOT EXISTS (
      SELECT 1 FROM wallet_hold_closures c
      WHERE c.workspace_id = h.workspace_id AND c.call_id = h.call_id
    )
    UNION ALL
    SELECT workspace_id, 0, 0, 0 FROM wallet_balances
  ) amounts GROUP BY workspace_id
  ON CONFLICT (workspace_id) DO UPDATE
    SET posted_micros = EXCLUDED.posted_micros, held_micros = EXCLUDED.held_micros,
        charged_micros = EXCLUDED.charged_micros, updated_at = now()
    WHERE b.posted_micros <> EXCLUDED.posted_micros OR b.held_micros <> EXCLUDED.held_micros
       OR b.charged_micros <> EXCLUDED.charged_micros;
$$;
REVOKE ALL ON FUNCTION wallet_apply_journal(), wallet_apply_hold(), wallet_apply_closure(), wallet_rebuild_balances() FROM PUBLIC;

ALTER TABLE wallet_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_rates FORCE ROW LEVEL SECURITY;
-- Not forced: the owner-run trigger functions are the projection's only writers.
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_holds FORCE ROW LEVEL SECURITY;
ALTER TABLE wallet_hold_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_hold_closures FORCE ROW LEVEL SECURITY;
ALTER TABLE wallet_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_deposits FORCE ROW LEVEL SECURITY;
ALTER TABLE wallet_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_journal FORCE ROW LEVEL SECURITY;

CREATE POLICY wallet_rate_read ON wallet_rates FOR SELECT TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true));
CREATE POLICY wallet_balance_read ON wallet_balances FOR SELECT TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true));
CREATE POLICY wallet_hold_scope ON wallet_holds TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true))
  WITH CHECK (workspace_id = current_setting('octolab.workspace_id', true));
CREATE POLICY wallet_closure_scope ON wallet_hold_closures TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true))
  WITH CHECK (workspace_id = current_setting('octolab.workspace_id', true));
CREATE POLICY wallet_deposit_scope ON wallet_deposits TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true))
  WITH CHECK (workspace_id = current_setting('octolab.workspace_id', true));
CREATE POLICY wallet_journal_read ON wallet_journal FOR SELECT TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true));
-- Dispute releases and manual adjustments are operator postings.
CREATE POLICY wallet_journal_post ON wallet_journal FOR INSERT TO octolab_runtime
  WITH CHECK (workspace_id = current_setting('octolab.workspace_id', true)
    AND kind IN ('deposit', 'refund', 'dispute_hold', 'usage'));

REVOKE ALL ON wallet_rates,wallet_balances,wallet_holds,wallet_hold_closures,wallet_deposits,wallet_journal FROM PUBLIC,octolab_runtime;
GRANT SELECT ON wallet_rates,wallet_balances TO octolab_runtime;
GRANT SELECT,INSERT ON wallet_holds,wallet_hold_closures,wallet_deposits,wallet_journal TO octolab_runtime;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON wallet_rates,wallet_balances,wallet_holds,wallet_hold_closures,wallet_deposits,wallet_journal FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON wallet_rates,wallet_balances,wallet_holds,wallet_hold_closures,wallet_deposits,wallet_journal FROM authenticated;
  END IF;
END $$;
