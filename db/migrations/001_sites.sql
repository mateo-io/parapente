BEGIN;

CREATE TABLE IF NOT EXISTS sites (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('launch', 'landing', 'weather_station')),
  data_status text NOT NULL DEFAULT 'mapped'
    CHECK (data_status IN ('mapped', 'reviewed', 'live')),
  region_code text NOT NULL DEFAULT 'lake-lucerne',
  canton text,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  elevation_m integer,
  launch_directions text[] NOT NULL DEFAULT '{}',
  pilot_level text CHECK (pilot_level IN ('student', 'independent', 'expert')),
  access_type text,
  source_label text NOT NULL,
  source_url text NOT NULL,
  source_kind text NOT NULL,
  source_record_id text,
  reviewed_at date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_translations (
  site_id text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('en', 'de')),
  name text NOT NULL,
  locality text,
  summary text NOT NULL,
  access_detail text,
  terrain text,
  research_note text,
  known_for text[] NOT NULL DEFAULT '{}',
  cautions text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (site_id, locale)
);

CREATE INDEX IF NOT EXISTS sites_region_kind_idx
  ON sites (region_code, kind);

CREATE INDEX IF NOT EXISTS sites_latitude_longitude_idx
  ON sites (latitude, longitude);

CREATE INDEX IF NOT EXISTS sites_source_record_idx
  ON sites (source_kind, source_record_id);

CREATE INDEX IF NOT EXISTS site_translations_locale_name_idx
  ON site_translations (locale, name);

COMMIT;
