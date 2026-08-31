BEGIN;

-- Official flying-area information sheets published by the governing body.
-- These are a distinct class of source: one document describes a whole area,
-- carries its own creation date, and is authoritative in a way a community map
-- is not. Kept as first-class records so a site's facts can be traced to the
-- sheet and version they came from, and so a reissued sheet can be diffed.
CREATE TABLE IF NOT EXISTS info_sheets (
  code text PRIMARY KEY,
  provider_code text NOT NULL REFERENCES providers(code),
  area_name text NOT NULL,
  url text NOT NULL,
  -- The date printed on the sheet, not the date we fetched it.
  published_on date,
  retrieved_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text
);

CREATE TABLE IF NOT EXISTS info_sheet_sites (
  sheet_code text NOT NULL REFERENCES info_sheets(code) ON DELETE CASCADE,
  site_id text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  -- The label the sheet itself uses, such as "1" for a launch or "A" for a
  -- landing, so a printed sheet and the app can be read side by side.
  sheet_label text,
  PRIMARY KEY (sheet_code, site_id)
);

-- Restrictions are safety-critical and must never be flattened into prose.
-- A wildlife zone with a winter date range, an airspace needing a radio call,
-- and an outright landing ban are different obligations with different seasons
-- and different authorities.
CREATE TABLE IF NOT EXISTS site_restrictions (
  id bigserial PRIMARY KEY,
  site_id text REFERENCES sites(id) ON DELETE CASCADE,
  sheet_code text REFERENCES info_sheets(code) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN (
    'airspace',            -- CTR, TMA, restricted area
    'wildlife',            -- Wildruhezone, game reserve
    'protected_area',      -- Flachmoor and other AuLaV protected ground
    'landing_prohibited',  -- Landung untersagt
    'takeoff_prohibited',
    'acro_box',            -- Acro/SiKu box: do not fly in
    'seasonal',            -- lift or site only active part of the year
    'permission_required'
  )),
  description text NOT NULL,
  -- Applicable window as day-of-year text, e.g. '15.12.-30.4.'. Free text
  -- because the sheets express these inconsistently and mangling them would
  -- lose the obligation.
  season_note text,
  -- Radio frequency or contact where the restriction requires one.
  contact text,
  authority text,
  source_url text,
  CONSTRAINT site_restrictions_scope CHECK (site_id IS NOT NULL OR sheet_code IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS site_restrictions_site_idx ON site_restrictions (site_id);
CREATE INDEX IF NOT EXISTS site_restrictions_sheet_idx ON site_restrictions (sheet_code);

-- Facts the sheets provide that the schema had no home for.
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS difficulty text
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  -- Free text such as 'Mai-Okt'; seasons are stated inconsistently and a
  -- normalised range would invent precision.
  ADD COLUMN IF NOT EXISTS active_season text,
  -- 'paraglider', 'hangglider', or both. A Delta-only launch is not a
  -- paragliding site and must not be offered as one.
  ADD COLUMN IF NOT EXISTS wing_types text[] NOT NULL DEFAULT '{}';

INSERT INTO providers (code, name, homepage_url, redistribution, licence, notes)
VALUES ('shv-fsvl','SHV/FSVL','https://www.shv-fsvl.ch/','restricted','Site terms',
        'Swiss Hang Gliding Association. Governing body. Publishes official area information sheets.')
ON CONFLICT (code) DO UPDATE SET notes = EXCLUDED.notes;

COMMIT;
