BEGIN;

-- How complete a data source is for a region, which decides what an ABSENCE
-- means. Where a flight database records essentially every official launch,
-- a pair with no flights is a real negative signal. Where coverage is patchy,
-- the same absence means nothing at all and must not be surfaced as doubt.
--
-- This is a guide, never an authority. Even at near-complete coverage a missing
-- connection can mean the pairing lapsed, the site closed, or simply that
-- nobody logged it.
CREATE TABLE IF NOT EXISTS region_coverage (
  region_code text NOT NULL,
  provider_code text NOT NULL REFERENCES providers(code),
  -- near_complete: absence is informative. partial: weak. unknown: meaningless.
  completeness text NOT NULL DEFAULT 'unknown'
    CHECK (completeness IN ('near_complete', 'partial', 'unknown')),
  rationale text,
  reviewed_at date NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (region_code, provider_code)
);

-- Switzerland only, and deliberately so. Swiss pilots log to the national XC
-- leagues in large numbers and the official launch list is small and stable, so
-- a well-known launch with no recorded flights is worth questioning. No such
-- claim is made for any other region.
INSERT INTO region_coverage (region_code, provider_code, completeness, rationale, reviewed_at)
VALUES (
  'lake-lucerne',
  'curated',
  'near_complete',
  'Swiss official launches are a small, stable, well-documented set and Swiss pilots log heavily to the national leagues. An absence here is worth questioning; it is still only a guide.',
  DATE '2026-08-29'
)
ON CONFLICT (region_code, provider_code) DO UPDATE
  SET completeness = EXCLUDED.completeness,
      rationale = EXCLUDED.rationale,
      reviewed_at = EXCLUDED.reviewed_at;

COMMIT;
