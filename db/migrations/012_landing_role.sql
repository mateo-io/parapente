BEGIN;

-- Not every landing is a place you may routinely land. Operators distinguish the
-- official field from alternates and from emergency-only ground that needs
-- permission, and collapsing that distinction is a safety problem, not a
-- presentation one. Unknown is the honest default for an unreviewed OSM point.
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS landing_role text NOT NULL DEFAULT 'unknown'
    CHECK (landing_role IN ('official', 'alternate', 'emergency', 'unknown'));

UPDATE sites SET landing_role = 'official'
 WHERE kind = 'landing' AND data_status = 'reviewed';

COMMIT;
