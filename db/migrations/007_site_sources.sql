BEGIN;

-- A site confirmed by several independent sources is more trustworthy than one
-- that appears in a single dataset. Sources are modelled one-to-many so that
-- corroboration is a count rather than a guess, and so the UI can warn when a
-- record rests on one source alone and link to it.
CREATE TABLE IF NOT EXISTS site_sources (
  id bigserial PRIMARY KEY,
  site_id text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  provider_code text NOT NULL REFERENCES providers(code),
  -- What this source actually confirms. A source that only confirms a position
  -- does not corroborate a description.
  confirms text NOT NULL DEFAULT 'location'
    CHECK (confirms IN ('location', 'description', 'wind', 'hazards', 'access')),
  label text NOT NULL,
  url text,
  retrieved_at date NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT site_sources_unique UNIQUE (site_id, provider_code, confirms)
);

CREATE INDEX IF NOT EXISTS site_sources_site_idx ON site_sources (site_id);

-- Backfill the source each record already carried, so nothing loses provenance.
INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT s.id,
       COALESCE(s.provider_code, 'curated'),
       'location',
       s.source_label,
       NULLIF(s.source_url, ''),
       s.reviewed_at
  FROM sites s
ON CONFLICT (site_id, provider_code, confirms) DO NOTHING;

-- Corroboration is counted by DISTINCT provider: two facts from one dataset are
-- still one source, and must not read as independent confirmation.
CREATE OR REPLACE VIEW site_corroboration AS
  SELECT site_id,
         COUNT(DISTINCT provider_code) AS source_count,
         BOOL_OR(url IS NOT NULL) AS has_link
    FROM site_sources
   GROUP BY site_id;

COMMIT;
