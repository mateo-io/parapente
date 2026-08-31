BEGIN;

-- Niederbauen is the worked example for the two-band wind model. OpenStreetMap
-- tagged it "NW", which is the summer thermal direction but badly understates a
-- launch that is sheltered enough to work in almost anything.
--
-- Sources:
--   Flugschule Emmetten (local school) — launch 1600 m, landing Berggrind 800 m,
--     transport cable at Alp Tritt, high-voltage lines across Choltal, CTR
--     Buochs immediately west with radio 119.62, avalanche risk at the north
--     launch after snowfall.
--   Paragliding365 — every wind direction possible thanks to the sheltered
--     position except in Föhn or Föhn tendency; light thermal NW is ideal in
--     summer; the SE and SW launches are the least problematic.
--
-- Föhn is a weather situation, not a compass sector, so it is recorded as a
-- caution rather than being carved out of the acceptable band.

DELETE FROM site_wind_windows
 WHERE site_id IN (SELECT id FROM sites WHERE slug LIKE 'niederbauen%');

INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
SELECT s.id, v.from_deg, v.to_deg, v.quality, 'curated'
  FROM sites s
 CROSS JOIN (VALUES
    -- Preferred: the summer thermal north-westerly.
    (292.5, 337.5, 'preferred'),
    -- Acceptable: the full compass, stored as one non-wrapping arc.
    (0.0,   360.0, 'acceptable')
 ) AS v(from_deg, to_deg, quality)
 WHERE s.slug LIKE 'niederbauen%'
   AND s.kind = 'launch'
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

UPDATE site_translations SET
  cautions = ARRAY[
    'Föhn or Föhn tendency: do not fly, the sheltering that makes other directions work does not apply.',
    'Transport cable at Alp Tritt and high-voltage lines across Choltal.',
    'CTR Buochs begins immediately west of the village; radio 119.62 required.',
    'North launch carries avalanche risk after snowfall and in wet snow.'
  ],
  terrain = 'Large, continuously steepening launch facing Lake Lucerne. Launch 1600 m, main landing Berggrind 800 m.'
 WHERE locale = 'en'
   AND site_id IN (SELECT id FROM sites WHERE slug LIKE 'niederbauen%' AND kind = 'launch');

UPDATE site_translations SET
  cautions = ARRAY[
    'Föhn oder Föhntendenz: nicht fliegen, die schützende Lage wirkt dann nicht.',
    'Transportseil bei Alp Tritt und Hochspannungsleitungen über das Choltal.',
    'CTR Buochs beginnt direkt westlich des Dorfes; Funk 119.62 erforderlich.',
    'Nordstartplatz: Lawinengefahr nach Schneefall und bei Nassschnee.'
  ],
  terrain = 'Grosser, stetig steiler werdender Startplatz zum Vierwaldstättersee. Start 1600 m, Hauptlandung Berggrind 800 m.'
 WHERE locale = 'de'
   AND site_id IN (SELECT id FROM sites WHERE slug LIKE 'niederbauen%' AND kind = 'launch');

UPDATE sites SET
  elevation_m = 1600,
  source_label = 'Flugschule Emmetten · Paragliding365',
  source_url = 'https://www.flugschule-emmetten.ch/diverses/fluggebiete-2/emmetten/',
  source_kind = 'flight_school',
  provider_code = 'curated',
  data_status = 'reviewed',
  reviewed_at = DATE '2026-08-29'
 WHERE slug LIKE 'niederbauen%' AND kind = 'launch';

COMMIT;
