SET search_path TO octolab,pg_catalog;

-- Operator-managed pilot rates. The runtime can read a rate for its workspace,
-- but cannot enroll customers or change the verified cost or credential binding.
CREATE TABLE shadow_wallet_rates (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id),
  rate_version TEXT NOT NULL CHECK (length(rate_version) BETWEEN 1 AND 120),
  provider_account TEXT NOT NULL CHECK (length(provider_account) BETWEEN 1 AND 120),
  credential_digest TEXT NOT NULL CHECK (credential_digest ~ '^[a-f0-9]{64}$'),
  provider_cost_micros BIGINT NOT NULL CHECK (provider_cost_micros BETWEEN 0 AND 10000000),
  verified_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL CHECK (expires_at > verified_at)
);

-- A hold is independent of research retention. Call and key IDs are immutable
-- attribution references, without a cascading dependency on research records.
CREATE TABLE shadow_wallet_holds (
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
  admitted BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, call_id),
  UNIQUE (workspace_id, call_id, total_micros, admitted),
  CHECK (created_at >= rate_verified_at AND created_at < rate_expires_at)
);

CREATE TABLE shadow_wallet_closures (
  workspace_id TEXT NOT NULL DEFAULT current_setting('octolab.workspace_id'),
  call_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('posted', 'failed', 'interrupted', 'cost_conflict')),
  provider_request_id TEXT CHECK (length(provider_request_id) BETWEEN 1 AND 200),
  reported_credits DOUBLE PRECISION CHECK (reported_credits >= 0 AND reported_credits < 'Infinity'::double precision),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, call_id),
  UNIQUE (workspace_id, call_id, outcome),
  FOREIGN KEY (workspace_id, call_id) REFERENCES shadow_wallet_holds(workspace_id, call_id)
);

-- Each entry represents both equal-and-opposite sides of a journal posting.
-- Positive amounts credit the shadow wallet; negative amounts credit usage.
CREATE TABLE shadow_wallet_journal (
  workspace_id TEXT NOT NULL DEFAULT current_setting('octolab.workspace_id') REFERENCES workspaces(id),
  source_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('seed', 'usage')),
  wallet_micros BIGINT NOT NULL,
  clearing_micros BIGINT GENERATED ALWAYS AS (-wallet_micros) STORED,
  call_id TEXT GENERATED ALWAYS AS (CASE WHEN kind = 'usage' THEN source_id END) STORED,
  call_outcome TEXT GENERATED ALWAYS AS (CASE WHEN kind = 'usage' THEN 'posted'::TEXT END) STORED,
  call_admitted BOOLEAN GENERATED ALWAYS AS (CASE WHEN kind = 'usage' THEN true END) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, kind, source_id),
  FOREIGN KEY (workspace_id, call_id, call_outcome) REFERENCES shadow_wallet_closures(workspace_id, call_id, outcome),
  FOREIGN KEY (workspace_id, call_id, clearing_micros, call_admitted) REFERENCES shadow_wallet_holds(workspace_id, call_id, total_micros, admitted),
  CHECK ((kind = 'seed' AND wallet_micros BETWEEN 1 AND 1000000000)
      OR (kind = 'usage' AND wallet_micros BETWEEN -11000000 AND 0))
);

ALTER TABLE shadow_wallet_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_wallet_rates FORCE ROW LEVEL SECURITY;
ALTER TABLE shadow_wallet_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_wallet_holds FORCE ROW LEVEL SECURITY;
ALTER TABLE shadow_wallet_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_wallet_closures FORCE ROW LEVEL SECURITY;
ALTER TABLE shadow_wallet_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_wallet_journal FORCE ROW LEVEL SECURITY;

CREATE POLICY shadow_rate_read ON shadow_wallet_rates FOR SELECT TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true));
CREATE POLICY shadow_hold_scope ON shadow_wallet_holds TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true))
  WITH CHECK (workspace_id = current_setting('octolab.workspace_id', true));
CREATE POLICY shadow_closure_scope ON shadow_wallet_closures TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true))
  WITH CHECK (workspace_id = current_setting('octolab.workspace_id', true));
CREATE POLICY shadow_journal_read ON shadow_wallet_journal FOR SELECT TO octolab_runtime
  USING (workspace_id = current_setting('octolab.workspace_id', true));
CREATE POLICY shadow_journal_usage ON shadow_wallet_journal FOR INSERT TO octolab_runtime
  WITH CHECK (workspace_id = current_setting('octolab.workspace_id', true) AND kind = 'usage');

REVOKE ALL ON shadow_wallet_rates,shadow_wallet_holds,shadow_wallet_closures,shadow_wallet_journal FROM PUBLIC,octolab_runtime;
GRANT SELECT ON shadow_wallet_rates TO octolab_runtime;
GRANT SELECT,INSERT ON shadow_wallet_holds,shadow_wallet_closures,shadow_wallet_journal TO octolab_runtime;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON shadow_wallet_rates,shadow_wallet_holds,shadow_wallet_closures,shadow_wallet_journal FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON shadow_wallet_rates,shadow_wallet_holds,shadow_wallet_closures,shadow_wallet_journal FROM authenticated;
  END IF;
END $$;
