BEGIN;

-- A landing is not official in the abstract: it is official FOR a launch.
-- Beckenried Schützenhaus is the official landing for Klewenalp, while the
-- lakeside village-hall site is emergency-only for that same launch. One launch
-- has several official landings and one landing serves several launches, so the
-- relation is many-to-many and the role belongs on the edge, not on the landing.
CREATE TABLE IF NOT EXISTS launch_landings (
  launch_id text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  landing_id text NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'alternate'
    CHECK (role IN ('official', 'alternate', 'emergency', 'prohibited')),
  -- Free text for the condition attached to this pairing, such as the written
  -- municipal permission the Beckenried emergency field requires.
  condition_note text,
  provider_code text REFERENCES providers(code),
  source_url text,
  reviewed_at date,
  PRIMARY KEY (launch_id, landing_id)
);

CREATE INDEX IF NOT EXISTS launch_landings_landing_idx
  ON launch_landings (landing_id);

-- Seed the pairings already established from sourced records.
INSERT INTO launch_landings (launch_id, landing_id, role, condition_note, provider_code, source_url, reviewed_at)
SELECT k.id, b.id, 'official', NULL, 'klewenalp',
       'https://www.klewenalp.ch/poi/gleitschirmfliegen-klewenalp', DATE '2026-08-29'
  FROM sites k, sites b
 WHERE k.slug = 'klewenalp' AND b.slug = 'beckenried-schuetzenhaus'
ON CONFLICT DO NOTHING;

INSERT INTO launch_landings (launch_id, landing_id, role, condition_note, provider_code, source_url, reviewed_at)
SELECT k.id, e.id, 'official',
       'Berggrind, west of the school sports field. Used year round for training and passenger flights.',
       'klewenalp','https://www.klewenalp.ch/poi/gleitschirmfliegen-klewenalp', DATE '2026-08-29'
  FROM sites k, sites e
 WHERE k.slug = 'klewenalp' AND e.slug LIKE 'emmetten%' AND e.kind = 'landing'
ON CONFLICT DO NOTHING;

INSERT INTO launch_landings (launch_id, landing_id, role, condition_note, provider_code, source_url, reviewed_at)
SELECT n.id, e.id, 'official', NULL, 'flugschule-emmetten',
       'https://www.flugschule-emmetten.ch/diverses/fluggebiete-2/emmetten/', DATE '2026-08-29'
  FROM sites n, sites e
 WHERE n.slug LIKE 'niederbauen%' AND n.kind = 'launch'
   AND e.slug LIKE 'emmetten%' AND e.kind = 'landing'
ON CONFLICT DO NOTHING;

COMMIT;
