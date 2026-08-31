BEGIN;

-- Second landing batch from permitted SHV/FSVL area sheets. These add a
-- landing only when the sheet identifies a field and its operation; ordinary
-- mapped points remain unknown rather than being promoted by proximity.
INSERT INTO info_sheets (code, provider_code, area_name, url, published_on, retrieved_at, notes)
VALUES
 ('shv-hoch-ybrig','shv-fsvl','Fluggebiet Hoch-Ybrig',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hoch-Ybrig.pdf',
  DATE '2021-01-01',DATE '2026-08-30','Sheet version 01-2021.'),
 ('shv-rotenflue','shv-fsvl','Fluggebiet Rotenflue',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rotenflue.pdf',
  NULL,DATE '2026-08-30','Published SHV/FSVL area sheet.'),
 ('shv-euthal','shv-fsvl','Fluggebiet Euthal',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Euthal.pdf',
  DATE '2024-02-01',DATE '2026-08-30','Sheet version 02-2024.'),
 ('shv-hummel','shv-fsvl','Fluggebiet Hummel',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hummel.pdf',
  NULL,DATE '2026-08-30','Published SHV/FSVL area sheet.')
ON CONFLICT (code) DO UPDATE SET url = EXCLUDED.url, published_on = EXCLUDED.published_on,
  retrieved_at = EXCLUDED.retrieved_at, notes = EXCLUDED.notes;

-- Sheet coordinates identify these existing OSM fields; upgrading them keeps
-- the community geometry traceable while the operating facts come from SHV.
UPDATE sites SET
  latitude = 47.0201, longitude = 8.8107, elevation_m = 1037,
  data_status = 'reviewed', landing_role = 'official', difficulty = 'easy',
  wing_types = ARRAY['paraglider'], source_label = 'SHV/FSVL Infotafel Hoch-Ybrig',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hoch-Ybrig.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-node-1864293852-landing';

UPDATE sites SET
  latitude = 47.0122, longitude = 8.6704, elevation_m = 590,
  data_status = 'reviewed', landing_role = 'official', difficulty = 'easy',
  wing_types = ARRAY['paraglider'], source_label = 'SHV/FSVL Infotafel Rotenflue',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rotenflue.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-way-435871478-landing';

INSERT INTO sites (id, slug, kind, data_status, region_code, canton,
  latitude, longitude, elevation_m, launch_directions, difficulty, active_season,
  wing_types, access_type, landing_role, source_label, source_url, source_kind,
  reviewed_at, provider_code)
VALUES
 ('shv-euthal-landing','euthal-landing','landing','reviewed','lake-lucerne','SZ',
  47.0924,8.8187,890,ARRAY[]::text[],'medium','Year round',ARRAY['paraglider'],
  'ski_lift_parking','official','SHV/FSVL Infotafel Euthal',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Euthal.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl'),
 ('shv-hummel-sportplatz-landing','hummel-sportplatz','landing','reviewed','lake-lucerne','SZ',
  47.10732,8.77901,890,ARRAY[]::text[],'medium','Year round',ARRAY['paraglider','hangglider'],
  'shooting_range_parking','official','SHV/FSVL Infotafel Hummel',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hummel.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl'),
 ('shv-euthal-waldrand-launch','euthal-waldrand','launch','reviewed','lake-lucerne','SZ',
  47.0936,8.8231,990,ARRAY['SW','W','NW'],'hard','Year round in valley wind',ARRAY['paraglider'],
  'walk','unknown','SHV/FSVL Infotafel Euthal',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Euthal.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl'),
 ('shv-chli-aubrig-launch','chli-aubrig','launch','reviewed','lake-lucerne','SZ',
  47.1070,8.8628,1620,ARRAY['S','SW','W'],'medium','October to May',ARRAY['paraglider'],
  'hike','unknown','SHV/FSVL Infotafel Euthal',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Euthal.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl'),
 ('shv-hummel-launch','hummel-launch','launch','reviewed','lake-lucerne','SZ',
  47.09851,8.77263,1317,ARRAY['NW','N','NE'],'easy','Year round',ARRAY['paraglider','hangglider'],
  'hike','unknown','SHV/FSVL Infotafel Hummel',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hummel.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl')
ON CONFLICT (id) DO UPDATE SET
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, elevation_m = EXCLUDED.elevation_m,
  data_status = EXCLUDED.data_status, launch_directions = EXCLUDED.launch_directions,
  landing_role = EXCLUDED.landing_role, difficulty = EXCLUDED.difficulty,
  active_season = EXCLUDED.active_season, source_label = EXCLUDED.source_label,
  source_url = EXCLUDED.source_url, source_kind = EXCLUDED.source_kind,
  provider_code = EXCLUDED.provider_code, reviewed_at = EXCLUDED.reviewed_at, updated_at = now();

INSERT INTO site_translations (site_id, locale, name, locality, summary, terrain, access_detail, known_for, cautions, provider_code)
VALUES
 ('osm-node-1864293852-landing','en','Weglosen','Unteriberg',
  'Official Hoch-Ybrig landing beside the Weglosen–Seebeli cable-car valley-station car park.',NULL,
  'Immediately beside the cable-car valley-station parking garage.',ARRAY['Official landing','Year-round'],
  ARRAY['Watch the cable-car support cable and the cable north of the field.', 'In strong valley wind, use a right-hand circuit to avoid garage turbulence.', 'In mountain wind, use a left-hand circuit.', 'Observe cable-car and chairlift operating hours.'], 'shv-fsvl'),
 ('osm-way-435871478-landing','en','Rickenbach','Rickenbach SZ',
  'Official Rotenflue landing for paragliders.',NULL,
  'Walk about ten minutes from the Rotenfluebahn valley-station parking.',ARRAY['Official landing'],
  ARRAY['No driving or parking on Perfidenstrasse.', 'Enter only via the packing area.', 'Do not enter adjacent fields.', 'Take all waste away.'], 'shv-fsvl'),
 ('shv-euthal-landing','en','Euthal','Euthal',
  'Official Euthal landing at 890 m.',NULL,'Use the ski-lift parking and leave the field immediately after landing.',ARRAY['Official landing'],
  ARRAY['Land only in the marked landing area.', 'A power line runs parallel to the road.', 'Valley wind can become very strong.', 'Pack only at the designated packing area; no ground handling on the landing field.', 'Do not fly in Bise: the hollow above the ski lift is very turbulent.'], 'shv-fsvl'),
 ('shv-hummel-sportplatz-landing','en','Hummel · Sportplatz','Einsiedeln',
  'Official Hummel landing meadow by the sports field.',NULL,'Use the shooting-range parking.',ARRAY['Official landing','Paraglider and hang glider'],
  ARRAY['Choose the circuit for the wind.', 'Watch the football-field fence.', 'Avoid outlandings and overfly housing with adequate height.', 'The football field may be used for ground handling only when it is otherwise unoccupied.'], 'shv-fsvl'),
 ('shv-euthal-waldrand-launch','en','Euthal · Waldrand','Euthal',
  'A demanding valley-wind launch above the Kreuz at Euthal.',NULL,'Ten minutes on foot from parking.',ARRAY['Valley-wind launch'],
  ARRAY['Strong valley wind can be turbulent.', 'Watch the ski lift and power line on low approaches.', 'Respect the Studen wildlife area from December to April.'], 'shv-fsvl'),
 ('shv-chli-aubrig-launch','en','Chli Aubrig','Euthal',
  'Hike-and-fly launch above Euthal, active from October to May.',NULL,'Hike and fly.',ARRAY['Seasonal hike-and-fly'],
  ARRAY['Respect the Studen wildlife area from December to April.'], 'shv-fsvl'),
 ('shv-hummel-launch','en','Hummel','Einsiedeln',
  'An easy year-round launch for paragliders and hang gliders.',NULL,
  'About one hour on foot from the shooting-range parking; no vehicle access.',ARRAY['Year-round launch'],
  ARRAY['Top landing is prohibited when the flag is red.'], 'shv-fsvl')
ON CONFLICT (site_id, locale) DO UPDATE SET
  name = EXCLUDED.name, locality = EXCLUDED.locality, summary = EXCLUDED.summary,
  terrain = EXCLUDED.terrain, access_detail = EXCLUDED.access_detail,
  known_for = EXCLUDED.known_for, cautions = EXCLUDED.cautions, provider_code = EXCLUDED.provider_code;

INSERT INTO launch_landings (launch_id, landing_id, role, provider_code, source_url, reviewed_at)
SELECT l.id, d.id, 'official','shv-fsvl',i.url,DATE '2026-08-30'
  FROM sites l JOIN sites d ON d.id = 'osm-node-1864293852-landing'
  JOIN info_sheets i ON i.code = 'shv-hoch-ybrig'
 WHERE l.id = 'osm-node-1864293848-launch'
ON CONFLICT (launch_id, landing_id) DO UPDATE SET role = EXCLUDED.role, provider_code = EXCLUDED.provider_code,
  source_url = EXCLUDED.source_url, reviewed_at = EXCLUDED.reviewed_at;

INSERT INTO launch_landings (launch_id, landing_id, role, provider_code, source_url, reviewed_at)
SELECT l.id, d.id, 'official','shv-fsvl',i.url,DATE '2026-08-30'
  FROM sites l JOIN sites d ON d.id = 'osm-way-435871478-landing'
  JOIN info_sheets i ON i.code = 'shv-rotenflue'
 WHERE l.id = 'osm-way-435871477-launch'
ON CONFLICT (launch_id, landing_id) DO UPDATE SET role = EXCLUDED.role, provider_code = EXCLUDED.provider_code,
  source_url = EXCLUDED.source_url, reviewed_at = EXCLUDED.reviewed_at;

INSERT INTO launch_landings (launch_id, landing_id, role, provider_code, source_url, reviewed_at)
SELECT l.id, d.id, 'official','shv-fsvl',i.url,DATE '2026-08-30'
  FROM sites l JOIN sites d ON d.id = 'shv-euthal-landing'
  JOIN info_sheets i ON i.code = 'shv-euthal'
 WHERE l.id IN ('shv-euthal-waldrand-launch','shv-chli-aubrig-launch')
ON CONFLICT (launch_id, landing_id) DO UPDATE SET role = EXCLUDED.role, provider_code = EXCLUDED.provider_code,
  source_url = EXCLUDED.source_url, reviewed_at = EXCLUDED.reviewed_at;

INSERT INTO launch_landings (launch_id, landing_id, role, provider_code, source_url, reviewed_at)
SELECT l.id, d.id, 'official','shv-fsvl',i.url,DATE '2026-08-30'
  FROM sites l JOIN sites d ON d.id = 'shv-hummel-sportplatz-landing'
  JOIN info_sheets i ON i.code = 'shv-hummel'
 WHERE l.id IN ('osm-way-965686744-launch','shv-hummel-launch')
ON CONFLICT (launch_id, landing_id) DO UPDATE SET role = EXCLUDED.role, provider_code = EXCLUDED.provider_code,
  source_url = EXCLUDED.source_url, reviewed_at = EXCLUDED.reviewed_at;

INSERT INTO site_restrictions (sheet_code, kind, description, season_note, authority, source_url)
VALUES
 ('shv-hoch-ybrig','wildlife','Maintain at least 300 m AGL when overflying the Filderen wildlife-rest area.',NULL,'Wildlife authority',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hoch-Ybrig.pdf'),
 ('shv-hoch-ybrig','airspace','Entering the LS-D12 military firing danger area below 3000 m while it is active in DABS is life-threatening.',NULL,'Swiss Armed Forces / DABS',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hoch-Ybrig.pdf'),
 ('shv-euthal','protected_area','Protected areas under AuLaV: take-off and landing are prohibited.',NULL,'Federal (AuLaV)',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Euthal.pdf')
ON CONFLICT DO NOTHING;

INSERT INTO info_sheet_sites (sheet_code, site_id, sheet_label) VALUES
 ('shv-hoch-ybrig','osm-node-1864293852-landing','A'),
 ('shv-rotenflue','osm-way-435871478-landing','A'),
 ('shv-euthal','shv-euthal-landing','A'),
 ('shv-euthal','shv-euthal-waldrand-launch','1'),
 ('shv-euthal','shv-chli-aubrig-launch','2'),
 ('shv-hummel','shv-hummel-sportplatz-landing','A'),
 ('shv-hummel','osm-way-965686744-launch','1'),
 ('shv-hummel','shv-hummel-launch','2')
ON CONFLICT DO NOTHING;

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT s.id,'shv-fsvl',c.confirms,'SHV/FSVL flying-area information sheet',i.url,DATE '2026-08-30'
  FROM sites s
 CROSS JOIN (VALUES ('location'),('description'),('hazards'),('access')) AS c(confirms)
  JOIN info_sheet_sites iss ON iss.site_id = s.id
  JOIN info_sheets i ON i.code = iss.sheet_code
 WHERE iss.sheet_code IN ('shv-hoch-ybrig','shv-rotenflue','shv-euthal','shv-hummel')
ON CONFLICT (site_id, provider_code, confirms) DO UPDATE SET label = EXCLUDED.label,
  url = EXCLUDED.url, retrieved_at = EXCLUDED.retrieved_at;

COMMIT;
