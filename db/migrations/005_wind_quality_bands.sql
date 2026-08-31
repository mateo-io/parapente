BEGIN;

-- Pilots reason about two bands, not one: the direction a site is best in, and
-- the wider range it still works in. A single "working" flag collapsed these and
-- made a forgiving site look as narrow as a fussy one.
ALTER TABLE site_wind_windows
  DROP CONSTRAINT IF EXISTS site_wind_windows_quality_check;

UPDATE site_wind_windows SET quality = 'preferred'  WHERE quality = 'working';
UPDATE site_wind_windows SET quality = 'acceptable' WHERE quality = 'marginal';

ALTER TABLE site_wind_windows
  ADD CONSTRAINT site_wind_windows_quality_check
  CHECK (quality IN ('preferred', 'acceptable'));

ALTER TABLE site_wind_windows ALTER COLUMN quality SET DEFAULT 'preferred';

DROP VIEW IF EXISTS site_wind_coverage;

-- Coverage is reported per band so a site that is flyable in everything but
-- best in one direction is ranked on the right number.
CREATE OR REPLACE VIEW site_wind_coverage AS
  SELECT site_id,
         SUM(to_deg - from_deg) FILTER (WHERE quality = 'preferred')  AS preferred_degrees,
         SUM(to_deg - from_deg) FILTER (WHERE quality = 'acceptable') AS acceptable_degrees,
         SUM(to_deg - from_deg) AS covered_degrees,
         COUNT(*) AS window_count
    FROM site_wind_windows
   GROUP BY site_id;

COMMIT;
