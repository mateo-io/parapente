BEGIN;

-- Site facts arrive from several places with different licences and different
-- levels of trust. Provenance is modelled as a first-class table so a record's
-- origin stays visible and a provider can be re-imported or removed on its own.
CREATE TABLE IF NOT EXISTS providers (
  code text PRIMARY KEY,
  name text NOT NULL,
  homepage_url text,
  -- 'open' data may be redistributed under its licence. 'restricted' means the
  -- provider's terms do not permit redistribution: keep it local, never ship it
  -- in a published build or a public API response.
  redistribution text NOT NULL DEFAULT 'restricted'
    CHECK (redistribution IN ('open', 'restricted')),
  licence text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO providers (code, name, homepage_url, redistribution, licence, notes)
VALUES
  (
    'osm',
    'OpenStreetMap',
    'https://www.openstreetmap.org/',
    'open',
    'ODbL 1.0',
    'Community mapped points. Positions are usable, descriptions are sparse.'
  ),
  (
    'curated',
    'Parapente reviewed record',
    NULL,
    'open',
    'Own work',
    'Hand-checked against an operator, club, school or federation source.'
  ),
  (
    'swisstopo',
    'Federal Office of Topography swisstopo',
    'https://www.swisstopo.admin.ch/',
    'open',
    'swisstopo OGD',
    'Open government geodata. Free for commercial use with attribution.'
  )
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      homepage_url = EXCLUDED.homepage_url,
      redistribution = EXCLUDED.redistribution,
      licence = EXCLUDED.licence,
      notes = EXCLUDED.notes;

ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS provider_code text REFERENCES providers(code);

-- Backfill from the source_kind already carried by imported rows.
UPDATE sites
   SET provider_code = CASE
     WHEN source_kind ILIKE '%openstreetmap%' OR source_kind ILIKE '%osm%' THEN 'osm'
     ELSE 'curated'
   END
 WHERE provider_code IS NULL;

ALTER TABLE sites
  ALTER COLUMN provider_code SET DEFAULT 'curated';

CREATE INDEX IF NOT EXISTS sites_provider_idx ON sites (provider_code);

-- Descriptive text is the part most likely to be provider-owned, so translations
-- record their own origin independently of the point they describe.
ALTER TABLE site_translations
  ADD COLUMN IF NOT EXISTS provider_code text REFERENCES providers(code);

UPDATE site_translations st
   SET provider_code = s.provider_code
  FROM sites s
 WHERE s.id = st.site_id
   AND st.provider_code IS NULL;

COMMIT;
