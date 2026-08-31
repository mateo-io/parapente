BEGIN;

-- Wind suitability as arcs of compass bearing in degrees, describing the
-- direction the wind blows FROM. Arcs make "which launches work in a 015 degree
-- wind" a range containment test instead of matching label strings, so the
-- question stays sortable and indexable as live wind data is added later.
--
-- Bearings are circular. An arc crossing north is stored as two rows
-- (337.5-360 and 0-22.5) so every row satisfies from_deg <= to_deg.
CREATE TABLE IF NOT EXISTS site_wind_windows (
  id bigserial PRIMARY KEY,
  site_id text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  from_deg numeric(5,2) NOT NULL CHECK (from_deg >= 0 AND from_deg <= 360),
  to_deg numeric(5,2) NOT NULL CHECK (to_deg >= 0 AND to_deg <= 360),
  -- 'working' is a usable window. 'marginal' is flyable but not preferred.
  quality text NOT NULL DEFAULT 'working'
    CHECK (quality IN ('working', 'marginal')),
  provider_code text REFERENCES providers(code),
  CONSTRAINT site_wind_windows_ascending CHECK (from_deg <= to_deg),
  CONSTRAINT site_wind_windows_unique UNIQUE (site_id, from_deg, to_deg, quality)
);

CREATE INDEX IF NOT EXISTS site_wind_windows_site_idx
  ON site_wind_windows (site_id);

-- Serves the live-wind question: every window containing a measured bearing.
CREATE INDEX IF NOT EXISTS site_wind_windows_range_idx
  ON site_wind_windows (from_deg, to_deg);

-- How forgiving a launch is, for ranking. Summed per site because a site may
-- hold several arcs, including the two halves of a window crossing north.
-- Migration 005 later widens this view with per-band columns. CREATE OR REPLACE
-- cannot drop a view's columns, so replaying this file after 005 fails unless
-- the view is dropped first. setup.sh reapplies every migration on every run.
DROP VIEW IF EXISTS site_wind_coverage;
CREATE VIEW site_wind_coverage AS
  SELECT site_id,
         SUM(to_deg - from_deg) AS covered_degrees,
         COUNT(*) AS window_count
    FROM site_wind_windows
   WHERE quality = 'working'
   GROUP BY site_id;

COMMIT;
