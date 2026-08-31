BEGIN;

-- MeteoSwiss SwissMetNet automatic stations. Open government data, free, no key.
-- A station is not the site: it can be kilometres away and hundreds of metres
-- lower, so the offsets are stored and must be shown alongside any reading.
CREATE TABLE IF NOT EXISTS weather_stations (
  code text PRIMARY KEY,
  name text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  elevation_m integer,
  provider_code text NOT NULL DEFAULT 'meteoswiss' REFERENCES providers(code),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO providers (code, name, homepage_url, redistribution, licence, notes)
VALUES (
  'meteoswiss',
  'MeteoSwiss',
  'https://www.meteoswiss.admin.ch/',
  'open',
  'Open government data',
  'SwissMetNet automatic stations. Ten-minute measured values, free with attribution.'
)
ON CONFLICT (code) DO NOTHING;

-- The station a site's readings come from. Nearest is a starting point, not a
-- claim of representativeness, so the distance and height gap are kept with it.
CREATE TABLE IF NOT EXISTS site_stations (
  site_id text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  station_code text NOT NULL REFERENCES weather_stations(code) ON DELETE CASCADE,
  distance_km numeric(6,2) NOT NULL,
  elevation_delta_m integer,
  is_primary boolean NOT NULL DEFAULT false,
  PRIMARY KEY (site_id, station_code)
);

CREATE INDEX IF NOT EXISTS site_stations_primary_idx
  ON site_stations (site_id) WHERE is_primary;

COMMIT;
