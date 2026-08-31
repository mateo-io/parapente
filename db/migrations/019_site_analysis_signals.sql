BEGIN;

-- Provider observations are useful research evidence, but they are neither an
-- operational permission nor a recommendation. Keep them outside `sites` so
-- the reviewed description, hazards, access and landing roles cannot be
-- overwritten by a computed signal.
--
-- The JSON payload is deliberately extensible: a future analyser may retain
-- directional distributions, seasonal buckets, or landing-pair counts without
-- a schema redesign. `sample_count`, the window, source, and calculation time
-- remain first-class so any resulting UI can state its provenance.
CREATE TABLE IF NOT EXISTS site_analysis_signals (
  id bigserial PRIMARY KEY,
  site_id text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  signal_code text NOT NULL,
  evidence_class text NOT NULL DEFAULT 'observed'
    CHECK (evidence_class IN ('observed', 'inferred')),
  provider_code text REFERENCES providers(code),
  source_url text,
  observation_start date,
  observation_end date,
  sample_count integer NOT NULL CHECK (sample_count >= 0),
  calculated_at timestamptz NOT NULL DEFAULT now(),
  analysis jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(analysis) = 'object'),
  -- A reproducible payload revision is an evidence record, not a mutable
  -- cache. Later runs can coexist and remain auditable.
  UNIQUE (site_id, signal_code, provider_code, calculated_at)
);

CREATE INDEX IF NOT EXISTS site_analysis_signals_site_code_idx
  ON site_analysis_signals (site_id, signal_code, calculated_at DESC);

-- Consumer queries should only consider the latest run for a provider/site
-- signal, while retaining the historical observations above for audit.
CREATE OR REPLACE VIEW current_site_analysis_signals AS
  SELECT DISTINCT ON (site_id, signal_code, provider_code)
         id, site_id, signal_code, evidence_class, provider_code, source_url,
         observation_start, observation_end, sample_count, calculated_at, analysis
    FROM site_analysis_signals
   ORDER BY site_id, signal_code, provider_code, calculated_at DESC;

COMMENT ON TABLE site_analysis_signals IS
  'Timestamped, provider-scoped observational or inferred signals. Never authoritative site-operation data.';
COMMENT ON COLUMN site_analysis_signals.analysis IS
  'Versioned analyser payload, for example matched launch/landing counts and distributions; excludes pilot identities and raw tracks.';

COMMIT;
