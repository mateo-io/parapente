BEGIN;

-- Klewenalp is absent from OpenStreetMap entirely: an Overpass query over the
-- whole massif returns no free_flying feature. It is one of the best known
-- launches above Lake Lucerne, which is why OSM-only coverage is not enough.
--
-- Sources:
--   klewenalp.ch (lift operator) — launch 200 m beside the mountain station,
--     north facing; official landing Beckenried Schützenhaus; the village-hall
--     site by the lake is emergency only and needs written municipal consent;
--     summer season only; contact Buochs airfield 119.625 on weekdays.
--   SHV/FSVL site information sheet for Klewenalp-Beckenried.
--   Paragliding365 — 1593 m.
-- swisstopo swissALTI3D gives 1591 m at the mountain station.
--
-- The stored launch point is the mountain station. The real launch is about
-- 200 m from it, which is well inside the error of any glide estimate over
-- kilometres, and pinning an invented coordinate would imply precision the
-- sources do not give.

INSERT INTO providers (code, name, homepage_url, redistribution, licence, notes)
VALUES
  ('klewenalp','Klewenalp-Stockhütte','https://www.klewenalp.ch/','restricted','Site terms','Lift operator. Authoritative for its own launch rules and tariffs.'),
  ('shv-fsvl','SHV/FSVL','https://www.shv-fsvl.ch/','restricted','Site terms','Swiss Hang Gliding Association. Governing body site information sheets.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO sites (
  id, slug, kind, data_status, region_code, canton,
  latitude, longitude, elevation_m, launch_directions, pilot_level,
  access_type, source_label, source_url, source_kind, reviewed_at, provider_code
) VALUES (
  'curated-klewenalp-launch','klewenalp','launch','reviewed','lake-lucerne','NW',
  46.94038, 8.47301, 1591, ARRAY['N'], 'independent',
  'cable_car','Klewenalp-Stockhütte · SHV/FSVL',
  'https://www.klewenalp.ch/poi/gleitschirmfliegen-klewenalp','lift_operator',
  DATE '2026-08-29','curated'
),
(
  'curated-beckenried-schuetzenhaus-landing','beckenried-schuetzenhaus','landing','reviewed','lake-lucerne','NW',
  46.96280, 8.47600, 442, ARRAY[]::text[], NULL,
  'public_road','Klewenalp-Stockhütte',
  'https://www.klewenalp.ch/poi/gleitschirmfliegen-klewenalp','lift_operator',
  DATE '2026-08-29','curated'
)
ON CONFLICT (id) DO UPDATE SET
  elevation_m = EXCLUDED.elevation_m,
  data_status = EXCLUDED.data_status,
  reviewed_at = EXCLUDED.reviewed_at;

INSERT INTO site_translations (site_id, locale, name, locality, summary, terrain, access_detail, known_for, cautions)
VALUES
 ('curated-klewenalp-launch','en','Klewenalp','Beckenried',
  'A north-facing launch about 200 m from the Klewenalp mountain station, reached by cable car from Beckenried.',
  'Launch beside the mountain station at roughly 1590 m. Official landing at the Beckenried shooting range.',
  'Cable car from Beckenried valley station, about 10 minutes. Paraglider tariff published by the operator.',
  ARRAY['Cable-car served','North facing'],
  ARRAY['Summer season only.',
        'Official landing is the Beckenried Schützenhaus. The village-hall site by the lake is for emergencies and needs written municipal permission.',
        'Weekdays during office hours contact Buochs airfield on 119.625.']),
 ('curated-klewenalp-launch','de','Klewenalp','Beckenried',
  'Nordausgerichteter Startplatz rund 200 m neben der Bergstation Klewenalp, erreichbar mit der Luftseilbahn ab Beckenried.',
  'Startplatz neben der Bergstation auf etwa 1590 m. Offizieller Landeplatz beim Schützenhaus Beckenried.',
  'Luftseilbahn ab Talstation Beckenried, rund 10 Minuten. Gleitschirm-Tarif gemäss Bahnbetreiber.',
  ARRAY['Mit Luftseilbahn erreichbar','Nordausrichtung'],
  ARRAY['Nur während der Sommersaison.',
        'Offizieller Landeplatz ist das Schützenhaus Beckenried. Der Platz beim Gemeindehaus am See ist Notlandeplatz und benötigt eine schriftliche Bewilligung der Gemeinde.',
        'Werktags während der Bürozeiten Flugplatz Buochs auf 119.625 kontaktieren.']),
 ('curated-beckenried-schuetzenhaus-landing','en','Beckenried · Schützenhaus','Beckenried',
  'The official landing for Klewenalp, by the shooting range in Beckenried.',
  NULL,'Reachable by road; close to the Klewenalp valley station.',
  ARRAY['Official landing'],
  ARRAY['The village-hall site by the lake is an emergency landing only and needs written municipal permission.']),
 ('curated-beckenried-schuetzenhaus-landing','de','Beckenried · Schützenhaus','Beckenried',
  'Offizieller Landeplatz für die Klewenalp beim Schützenhaus in Beckenried.',
  NULL,'Mit dem Auto erreichbar, nahe der Talstation Klewenalp.',
  ARRAY['Offizieller Landeplatz'],
  ARRAY['Der Platz beim Gemeindehaus am See ist Notlandeplatz und benötigt eine schriftliche Bewilligung der Gemeinde.'])
ON CONFLICT (site_id, locale) DO UPDATE SET
  name = EXCLUDED.name, summary = EXCLUDED.summary,
  terrain = EXCLUDED.terrain, access_detail = EXCLUDED.access_detail,
  known_for = EXCLUDED.known_for, cautions = EXCLUDED.cautions;

-- North facing: preferred N, acceptable across the northern quadrant.
INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
VALUES
 ('curated-klewenalp-launch',   0.0,  22.5,'preferred','curated'),
 ('curated-klewenalp-launch', 337.5, 360.0,'preferred','curated'),
 ('curated-klewenalp-launch',   0.0,  67.5,'acceptable','curated'),
 ('curated-klewenalp-launch', 292.5, 360.0,'acceptable','curated')
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
VALUES
 ('curated-klewenalp-launch','klewenalp','description','Klewenalp-Stockhütte','https://www.klewenalp.ch/poi/gleitschirmfliegen-klewenalp',DATE '2026-08-29'),
 ('curated-klewenalp-launch','klewenalp','wind','Klewenalp-Stockhütte','https://www.klewenalp.ch/poi/gleitschirmfliegen-klewenalp',DATE '2026-08-29'),
 ('curated-klewenalp-launch','klewenalp','access','Klewenalp-Stockhütte','https://www.klewenalp.ch/poi/gleitschirmfliegen-klewenalp',DATE '2026-08-29'),
 ('curated-klewenalp-launch','shv-fsvl','hazards','SHV/FSVL site information sheet','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Klewenalp.pdf',DATE '2026-08-29'),
 ('curated-klewenalp-launch','swisstopo','location','swisstopo swissALTI3D','https://www.swisstopo.admin.ch/en/height-model-swissalti3d',DATE '2026-08-29'),
 ('curated-beckenried-schuetzenhaus-landing','klewenalp','location','Klewenalp-Stockhütte','https://www.klewenalp.ch/poi/gleitschirmfliegen-klewenalp',DATE '2026-08-29')
ON CONFLICT (site_id, provider_code, confirms) DO NOTHING;

-- Lifts. Station coordinates come from OpenStreetMap, elevations from swisstopo.
INSERT INTO lifts (code, name, kind, operator, url,
  base_latitude, base_longitude, base_elevation_m,
  top_latitude, top_longitude, top_elevation_m, ride_minutes, seasonal_note, provider_code)
VALUES
 ('klewenalpbahn','Luftseilbahn Beckenried-Klewenalp','cable_car','Klewenalp-Stockhütte',
  'https://www.klewenalp.ch/poi/luftseilbahn-beckenried-klewenalp',
  46.96622, 8.47321, 451, 46.94038, 8.47301, 1591, 10,
  'Paragliding from Klewenalp is summer season only.','klewenalp'),
 ('niederbauenbahn','Luftseilbahn Emmetten-Niederbauen','cable_car',NULL,NULL,
  46.95587, 8.51895, 771, 46.94632, 8.53482, 1569, NULL, NULL,'osm')
ON CONFLICT (code) DO UPDATE SET
  base_elevation_m = EXCLUDED.base_elevation_m,
  top_elevation_m = EXCLUDED.top_elevation_m;

-- Paraglider tariff as published by the operator, with the date observed.
INSERT INTO lift_prices (lift_code, ticket_type, audience, amount, currency, as_of, source_url, note)
VALUES
 ('klewenalpbahn','single_ascent','paraglider', 5.00,'CHF',DATE '2026-08-29',
  'https://www.klewenalp.ch/poi/gleitschirmfliegen-klewenalp',
  'Operator''s published paraglider tariff. Confirm at the valley station; this may be a paraglider supplement rather than the full public fare.'),
 ('klewenalpbahn','day_pass','paraglider',14.00,'CHF',DATE '2026-08-29',
  'https://www.klewenalp.ch/poi/gleitschirmfliegen-klewenalp',NULL),
 ('klewenalpbahn','season_pass','paraglider',70.00,'CHF',DATE '2026-08-29',
  'https://www.klewenalp.ch/poi/gleitschirmfliegen-klewenalp','Summer subscription.')
ON CONFLICT (lift_code, ticket_type, audience, as_of) DO NOTHING;

INSERT INTO site_lifts (site_id, lift_code) VALUES
 ('curated-klewenalp-launch','klewenalpbahn')
ON CONFLICT DO NOTHING;

INSERT INTO site_lifts (site_id, lift_code)
SELECT id,'niederbauenbahn' FROM sites WHERE slug LIKE 'niederbauen%' AND kind='launch'
ON CONFLICT DO NOTHING;

COMMIT;
