BEGIN;

-- Landings need the same operational evidence as launches. These facts are
-- transcribed from the SHV/FSVL information sheets, a permitted governing-body
-- source. DHV is deliberately not used: its robots policy disallows this
-- access, and an imported name is not worth compromising the source policy.

INSERT INTO info_sheets (code, provider_code, area_name, url, published_on, retrieved_at, notes)
VALUES
 ('shv-engelberg','shv-fsvl','Fluggebiet Engelberg',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Engelberg.pdf',
  DATE '2025-01-01', DATE '2026-08-30','Sheet version 01-2025.'),
 ('shv-rigi','shv-fsvl','Fluggebiet Rigi',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rigi.pdf',
  DATE '2022-04-01', DATE '2026-08-30','Sheet version 04-2022.'),
 ('shv-urmiberg','shv-fsvl','Fluggebiet Urmiberg',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Urmiberg.pdf',
  DATE '2025-11-01', DATE '2026-08-30','Sheet version 11-2025.'),
 ('shv-fronalpstock','shv-fsvl','Fluggebiet Fronalpstock / Stoos',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Fronalpstock.pdf',
  DATE '2022-04-01', DATE '2026-08-30','Sheet version 04-2022.')
ON CONFLICT (code) DO UPDATE SET
  url = EXCLUDED.url, published_on = EXCLUDED.published_on,
  retrieved_at = EXCLUDED.retrieved_at, notes = EXCLUDED.notes;

-- Existing mapped points are only upgraded where the sheet's name, elevation
-- and position identify the same field. The sheet is now the primary source
-- for the operational record; OSM continues to be represented in site_sources.
UPDATE sites SET
  latitude = 46.8170, longitude = 8.4078, elevation_m = 1015,
  data_status = 'reviewed', landing_role = 'official', difficulty = 'easy',
  wing_types = ARRAY['paraglider'],
  source_label = 'SHV/FSVL Infotafel Engelberg',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Engelberg.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'curated-engelberg-wyden-landing';

UPDATE sites SET
  latitude = 46.7993, longitude = 8.4547, elevation_m = 1095,
  data_status = 'reviewed', landing_role = 'official',
  source_label = 'SHV/FSVL Infotafel Engelberg',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Engelberg.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-node-9492601044-landing';

UPDATE sites SET
  latitude = 47.0675, longitude = 8.4355, elevation_m = 462,
  data_status = 'reviewed', landing_role = 'official', difficulty = 'easy',
  wing_types = ARRAY['paraglider','hangglider'],
  source_label = 'SHV/FSVL Infotafel Rigi',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rigi.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-way-112452850-landing';

UPDATE sites SET
  latitude = 47.0519, longitude = 8.5436, elevation_m = 477,
  data_status = 'reviewed', landing_role = 'official', difficulty = 'medium',
  wing_types = ARRAY['paraglider'],
  source_label = 'SHV/FSVL Infotafel Rigi',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rigi.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-way-112452861-landing';

UPDATE sites SET
  latitude = 47.0336, longitude = 8.4422, elevation_m = 488,
  data_status = 'reviewed', landing_role = 'official', difficulty = 'hard',
  wing_types = ARRAY['paraglider'],
  source_label = 'SHV/FSVL Infotafel Rigi',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rigi.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-node-9492632141-landing';

UPDATE sites SET
  latitude = 46.9979, longitude = 8.5957, elevation_m = 435,
  data_status = 'reviewed', landing_role = 'official', difficulty = 'easy',
  wing_types = ARRAY['paraglider','hangglider'],
  source_label = 'SHV/FSVL Infotafel Urmiberg',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Urmiberg.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-way-377515174-landing';

INSERT INTO sites (id, slug, kind, data_status, region_code, canton,
  latitude, longitude, elevation_m, launch_directions, difficulty, active_season,
  wing_types, access_type, landing_role, source_label, source_url, source_kind,
  reviewed_at, provider_code)
VALUES ('shv-stoos-winter-landing','stoos-winter-landing','landing','reviewed','lake-lucerne','SZ',
  46.9793,8.6653,1300,ARRAY[]::text[],'easy','Only in winter with snow',
  ARRAY['paraglider'],'walk','official','SHV/FSVL Infotafel Fronalpstock',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Fronalpstock.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl')
ON CONFLICT (id) DO UPDATE SET
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, elevation_m = EXCLUDED.elevation_m,
  data_status = EXCLUDED.data_status, landing_role = EXCLUDED.landing_role,
  difficulty = EXCLUDED.difficulty, active_season = EXCLUDED.active_season,
  source_label = EXCLUDED.source_label, source_url = EXCLUDED.source_url,
  source_kind = EXCLUDED.source_kind, provider_code = EXCLUDED.provider_code,
  reviewed_at = EXCLUDED.reviewed_at, updated_at = now();

INSERT INTO site_translations (site_id, locale, name, locality, summary, terrain, access_detail, known_for, cautions, provider_code)
VALUES
 ('curated-engelberg-wyden-landing','en','Engelberg','Engelberg',
  'Established Engelberg landing at 1015 m, beside the Wyden sports area.',
  'Valley meadow by the Engelberger Aa.','Use the Brunni valley-station parking and the marked packing area.',
  ARRAY['Official landing','Marked packing area'],
  ARRAY['Leave the landing area immediately after touchdown.', 'The artificial-turf Wyden football field must not be entered or used for landing.', 'In winter, avoid snowmaking equipment and the cross-country ski trail.'], 'shv-fsvl'),
 ('osm-node-9492601044-landing','en','Engelberg · Herrenrüti','Engelberg',
  'Established Engelberg landing at Herrenrüti, at 1095 m.',NULL,NULL,
  ARRAY['Official landing'], ARRAY['Use the published circuit and inspect the field locally.'], 'shv-fsvl'),
 ('osm-way-112452850-landing','en','Küssnacht','Küssnacht',
  'Official Rigi landing for paragliders and hang gliders.',NULL,
  'Park at the cable-car valley station; walk about ten minutes.',ARRAY['Official landing','Paraglider and hang glider'],
  ARRAY['Circuits may be flown on either side.', 'Do not fly over the road.', 'Do not park directly at the landing field.'], 'shv-fsvl'),
 ('osm-way-112452861-landing','en','Goldau','Goldau',
  'Official Rigi landing for paragliders.',NULL,
  'Park at the Rigi railway station; walk about ten minutes.',ARRAY['Official landing'],
  ARRAY['Right-hand circuit.', 'Expect light lee rotors in strong wind.', 'Do not park directly at the landing field.'], 'shv-fsvl'),
 ('osm-node-9492632141-landing','en','Weggis','Weggis',
  'Official Rigi landing for paragliders; a demanding slope landing.',
  'Sloping landing terrain.', 'Cable-car parking nearby.', ARRAY['Official landing','Slope landing'],
  ARRAY['Left-hand circuit.', 'Never use in Bise.'], 'shv-fsvl'),
 ('osm-way-377515174-landing','en','Brunnen · Bristenstrasse','Brunnen',
  'Year-round landing for the Urmiberg and Fronalpstock flying areas.',NULL,
  'Five minutes on foot to the bus stop and Urmiberg valley station.',ARRAY['Official landing','Paraglider and hang glider'],
  ARRAY['Use a left-hand circuit in west or lake wind and a right-hand circuit in east wind.', 'Pack south of the red hydrant and keep the pavement clear.', 'No vehicles at the landing field.', 'The shaded side of the opposite houses is not a waiting area.'], 'shv-fsvl'),
 ('shv-stoos-winter-landing','en','Stoos · Winter landing','Stoos',
  'Winter-only snow landing for the Fronalpstock / Stoos flying area.',NULL,
  'Three minutes on foot from the valley station.', ARRAY['Official winter landing'],
  ARRAY['Usable only in winter when there is snow.', 'Watch skiers.', 'Pack at the edge of the meadow.'], 'shv-fsvl')
ON CONFLICT (site_id, locale) DO UPDATE SET
  name = EXCLUDED.name, locality = EXCLUDED.locality, summary = EXCLUDED.summary,
  terrain = EXCLUDED.terrain, access_detail = EXCLUDED.access_detail,
  known_for = EXCLUDED.known_for, cautions = EXCLUDED.cautions,
  provider_code = EXCLUDED.provider_code;

-- A pairing describes permission for a particular flight area, rather than
-- falsely suggesting that every close launch may use the field.
INSERT INTO launch_landings (launch_id, landing_id, role, provider_code, source_url, reviewed_at)
SELECT l.id, d.id, 'official', 'shv-fsvl', i.url, DATE '2026-08-30'
  FROM sites l
  JOIN sites d ON d.id IN ('curated-engelberg-wyden-landing','osm-node-9492601044-landing')
  JOIN info_sheets i ON i.code = 'shv-engelberg'
 WHERE l.id IN ('curated-brunni-tuempfeli-launch','osm-way-1491927588-launch')
ON CONFLICT (launch_id, landing_id) DO UPDATE SET role = EXCLUDED.role,
  provider_code = EXCLUDED.provider_code, source_url = EXCLUDED.source_url, reviewed_at = EXCLUDED.reviewed_at;

INSERT INTO launch_landings (launch_id, landing_id, role, provider_code, source_url, reviewed_at)
SELECT l.id, d.id, 'official', 'shv-fsvl', i.url, DATE '2026-08-30'
  FROM sites l
  JOIN sites d ON d.id IN ('osm-way-112452850-landing','osm-way-112452861-landing','osm-node-9492632141-landing')
  JOIN info_sheets i ON i.code = 'shv-rigi'
 WHERE l.id IN ('osm-way-112452859-launch','osm-way-112452853-launch')
ON CONFLICT (launch_id, landing_id) DO UPDATE SET role = EXCLUDED.role,
  provider_code = EXCLUDED.provider_code, source_url = EXCLUDED.source_url, reviewed_at = EXCLUDED.reviewed_at;

INSERT INTO launch_landings (launch_id, landing_id, role, provider_code, source_url, reviewed_at)
SELECT l.id, d.id, 'official', 'shv-fsvl', i.url, DATE '2026-08-30'
  FROM sites l JOIN sites d ON d.id = 'osm-way-377515174-landing'
  JOIN info_sheets i ON i.code = 'shv-urmiberg'
 WHERE l.id = 'osm-way-377499206-launch'
ON CONFLICT (launch_id, landing_id) DO UPDATE SET role = EXCLUDED.role,
  provider_code = EXCLUDED.provider_code, source_url = EXCLUDED.source_url, reviewed_at = EXCLUDED.reviewed_at;

INSERT INTO launch_landings (launch_id, landing_id, role, provider_code, source_url, reviewed_at)
SELECT l.id, d.id, 'official', 'shv-fsvl', i.url, DATE '2026-08-30'
  FROM sites l JOIN sites d ON d.id IN ('osm-way-377515174-landing','shv-stoos-winter-landing')
  JOIN info_sheets i ON i.code = 'shv-fronalpstock'
 WHERE l.id IN ('pge-fronalpstock-launch','osm-node-3141392799-launch')
ON CONFLICT (launch_id, landing_id) DO UPDATE SET role = EXCLUDED.role,
  provider_code = EXCLUDED.provider_code, source_url = EXCLUDED.source_url, reviewed_at = EXCLUDED.reviewed_at;

INSERT INTO site_restrictions (site_id, sheet_code, kind, description, authority, source_url)
VALUES ('osm-way-377515174-landing','shv-urmiberg','landing_prohibited',
  'Hopfräben nature reserve: landing is prohibited.', 'Nature conservation authority',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Urmiberg.pdf')
ON CONFLICT DO NOTHING;

INSERT INTO info_sheet_sites (sheet_code, site_id, sheet_label) VALUES
 ('shv-engelberg','curated-engelberg-wyden-landing','A'),
 ('shv-engelberg','osm-node-9492601044-landing','B'),
 ('shv-rigi','osm-way-112452850-landing','A'),
 ('shv-rigi','osm-way-112452861-landing','B'),
 ('shv-rigi','osm-node-9492632141-landing','C'),
 ('shv-urmiberg','osm-way-377515174-landing','A'),
 ('shv-fronalpstock','osm-way-377515174-landing','B'),
 ('shv-fronalpstock','shv-stoos-winter-landing','A')
ON CONFLICT DO NOTHING;

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT DISTINCT ON (s.id, c.confirms)
       s.id, 'shv-fsvl', c.confirms, 'SHV/FSVL flying-area information sheet', i.url, DATE '2026-08-30'
  FROM sites s
 CROSS JOIN (VALUES ('location'),('description'),('hazards'),('access')) AS c(confirms)
  JOIN info_sheet_sites iss ON iss.site_id = s.id
  JOIN info_sheets i ON i.code = iss.sheet_code
 WHERE iss.sheet_code IN ('shv-engelberg','shv-rigi','shv-urmiberg','shv-fronalpstock')
 ORDER BY s.id, c.confirms, iss.sheet_code
ON CONFLICT (site_id, provider_code, confirms) DO UPDATE SET label = EXCLUDED.label,
  url = EXCLUDED.url, retrieved_at = EXCLUDED.retrieved_at;

COMMIT;
