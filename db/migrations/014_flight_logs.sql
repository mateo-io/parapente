BEGIN;

-- Cached flight logs. Stored locally so the app never queries a provider per
-- page view, and so the evidence survives a provider going away or changing
-- terms. Every row records which provider it came from and when it was fetched.
--
-- Purpose: a straight-line glide calculation knows nothing about terrain in the
-- way, launch orientation, or mountain airflow, so it will offer landings that
-- nobody actually reaches. Observed flights are the correction.
CREATE TABLE IF NOT EXISTS flight_logs (
  id bigserial PRIMARY KEY,
  provider_code text NOT NULL REFERENCES providers(code),
  -- The provider's own identifier, so re-imports update rather than duplicate.
  provider_flight_id text NOT NULL,

  flown_on date NOT NULL,

  -- Raw coordinates as reported. Matching to a site is a separate, revisable
  -- step, so the original geometry is never lost to a bad match.
  launch_latitude double precision,
  launch_longitude double precision,
  landing_latitude double precision,
  landing_longitude double precision,

  -- Resolved sites. Null means unmatched, which is different from unreachable.
  launch_site_id text REFERENCES sites(id) ON DELETE SET NULL,
  landing_site_id text REFERENCES sites(id) ON DELETE SET NULL,
  -- Metres between the reported point and the matched site, so a loose match
  -- can be audited rather than trusted blindly.
  launch_match_m integer,
  landing_match_m integer,

  distance_km numeric(7,2),
  duration_min integer,
  max_altitude_m integer,
  -- Straight-line ratio the flight actually achieved between the two points.
  achieved_ratio numeric(6,2),

  track_url text,
  -- Provider-scoped pilot reference. No names: this is personal data and the
  -- product has no need for it.
  pilot_ref text,

  fetched_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT flight_logs_provider_unique UNIQUE (provider_code, provider_flight_id)
);

CREATE INDEX IF NOT EXISTS flight_logs_launch_idx ON flight_logs (launch_site_id);
CREATE INDEX IF NOT EXISTS flight_logs_landing_idx ON flight_logs (landing_site_id);
CREATE INDEX IF NOT EXISTS flight_logs_pair_idx
  ON flight_logs (launch_site_id, landing_site_id);
CREATE INDEX IF NOT EXISTS flight_logs_flown_idx ON flight_logs (flown_on DESC);

-- Observed evidence per launch/landing pair: how many flights actually made
-- this connection, over what period, and what glide they really needed.
CREATE OR REPLACE VIEW launch_landing_flights AS
  SELECT launch_site_id,
         landing_site_id,
         COUNT(*) AS flight_count,
         COUNT(DISTINCT provider_code) AS provider_count,
         MIN(flown_on) AS first_seen,
         MAX(flown_on) AS last_seen,
         ROUND(AVG(achieved_ratio), 2) AS avg_achieved_ratio,
         ROUND(MAX(achieved_ratio), 2) AS max_achieved_ratio
    FROM flight_logs
   WHERE launch_site_id IS NOT NULL
     AND landing_site_id IS NOT NULL
   GROUP BY launch_site_id, landing_site_id;

COMMIT;
