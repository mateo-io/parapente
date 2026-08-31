BEGIN;

-- The SHV/FSVL Marbach sheet enumerates three paragliding launches and three
-- paragliding landings with distinct circuits. Delta-only facilities are not
-- represented as paragliding sites.
INSERT INTO info_sheets (code, provider_code, area_name, url, published_on, retrieved_at, notes)
VALUES ('shv-marbach','shv-fsvl','Fluggebiet Marbach',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Marbach.pdf',
  DATE '2022-02-01',DATE '2026-08-30','Sheet version 02-2022.')
ON CONFLICT (code) DO UPDATE SET url = EXCLUDED.url, published_on = EXCLUDED.published_on,
  retrieved_at = EXCLUDED.retrieved_at, notes = EXCLUDED.notes;

INSERT INTO sites (id, slug, kind, data_status, region_code, canton,
  latitude, longitude, elevation_m, launch_directions, difficulty, active_season,
  wing_types, access_type, landing_role, source_label, source_url, source_kind,
  reviewed_at, provider_code)
VALUES
 ('shv-marbach-nord-launch','marbach-nord','launch','reviewed','lake-lucerne','LU',
  46.8348,7.9045,1474,ARRAY['W','NW','N'],'medium','Year round',ARRAY['paraglider'],
  'cable_car','unknown','SHV/FSVL Infotafel Marbach',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Marbach.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl'),
 ('shv-marbach-sued-launch','marbach-sued','launch','reviewed','lake-lucerne','LU',
  46.8324,7.9021,1450,ARRAY['S','SW'],'easy','Winter months',ARRAY['paraglider'],
  'cable_car','unknown','SHV/FSVL Infotafel Marbach',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Marbach.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl'),
 ('shv-marbach-kirche-landing','marbach-kirche','landing','reviewed','lake-lucerne','LU',
  46.8516,7.8998,871,ARRAY[]::text[],'easy','Year round',ARRAY['paraglider'],
  'walk','official','SHV/FSVL Infotafel Marbach',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Marbach.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl'),
 ('shv-marbach-bahn-landing','marbach-bahn','landing','reviewed','lake-lucerne','LU',
  46.8491,7.8945,886,ARRAY[]::text[],'medium','Year round',ARRAY['paraglider'],
  'road','official','SHV/FSVL Infotafel Marbach',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Marbach.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl'),
 ('shv-marbach-laui-landing','marbach-laui','landing','reviewed','lake-lucerne','LU',
  46.8417,7.8855,930,ARRAY[]::text[],'easy','Year round',ARRAY['paraglider'],
  'walk','official','SHV/FSVL Infotafel Marbach',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Marbach.pdf',
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
 ('shv-marbach-nord-launch','en','Marbach · Nord','Marbach',
  'A medium-difficulty north-sector launch at Marbach, served by cable car.',NULL,NULL,ARRAY['Year-round launch'],
  ARRAY['Watch for hang gliders taking off.'], 'shv-fsvl'),
 ('shv-marbach-sued-launch','en','Marbach · Süd','Marbach',
  'An easy south-west-facing Marbach launch, active during the winter months.',NULL,NULL,ARRAY['Winter launch'],
  ARRAY['Watch for paragliders on launch.'], 'shv-fsvl'),
 ('shv-marbach-kirche-landing','en','Marbach · Kirche','Marbach',
  'Official, easy Marbach landing near the church.',NULL,'Walk access.',ARRAY['Official landing'],
  ARRAY['Use a left-hand circuit in valley wind and a right-hand circuit in mountain wind.', 'In strong valley wind, expect lee turbulence from the church.'], 'shv-fsvl'),
 ('shv-marbach-bahn-landing','en','Marbach · Bahn','Marbach',
  'Official Marbach landing by the cable-car area, rated medium difficulty.',NULL,'Road access.',ARRAY['Official landing'],
  ARRAY['For experienced pilots.', 'Use a right-hand circuit in valley wind and a left-hand circuit in mountain wind.'], 'shv-fsvl'),
 ('shv-marbach-laui-landing','en','Marbach · Laui','Marbach',
  'Official, easy Marbach landing field suitable for stronger winds.',NULL,'Walk access.',ARRAY['Official landing','Strong-wind field'],
  ARRAY['Use a left-hand circuit.'], 'shv-fsvl')
ON CONFLICT (site_id, locale) DO UPDATE SET
  name = EXCLUDED.name, locality = EXCLUDED.locality, summary = EXCLUDED.summary,
  terrain = EXCLUDED.terrain, access_detail = EXCLUDED.access_detail,
  known_for = EXCLUDED.known_for, cautions = EXCLUDED.cautions, provider_code = EXCLUDED.provider_code;

INSERT INTO launch_landings (launch_id, landing_id, role, provider_code, source_url, reviewed_at)
SELECT l.id,d.id,'official','shv-fsvl',i.url,DATE '2026-08-30'
  FROM sites l CROSS JOIN sites d JOIN info_sheets i ON i.code = 'shv-marbach'
 WHERE l.id IN ('shv-marbach-nord-launch','shv-marbach-sued-launch')
   AND d.id IN ('shv-marbach-kirche-landing','shv-marbach-bahn-landing','shv-marbach-laui-landing')
ON CONFLICT (launch_id, landing_id) DO UPDATE SET role = EXCLUDED.role, provider_code = EXCLUDED.provider_code,
  source_url = EXCLUDED.source_url, reviewed_at = EXCLUDED.reviewed_at;

INSERT INTO site_restrictions (sheet_code, kind, description, season_note, authority, source_url)
VALUES ('shv-marbach','wildlife',
  'Under the Brienzergrat agreement, do not overfly the designated area on weekdays.',
  '1 April–30 June, Monday–Friday','Local wildlife agreement',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Marbach.pdf')
ON CONFLICT DO NOTHING;

INSERT INTO info_sheet_sites (sheet_code, site_id, sheet_label) VALUES
 ('shv-marbach','shv-marbach-nord-launch','1'),
 ('shv-marbach','shv-marbach-sued-launch','2'),
 ('shv-marbach','shv-marbach-kirche-landing','A'),
 ('shv-marbach','shv-marbach-bahn-landing','B'),
 ('shv-marbach','shv-marbach-laui-landing','C')
ON CONFLICT DO NOTHING;

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT s.id,'shv-fsvl',c.confirms,'SHV/FSVL flying-area information sheet',i.url,DATE '2026-08-30'
  FROM sites s
 CROSS JOIN (VALUES ('location'),('description'),('hazards'),('access')) AS c(confirms)
  JOIN info_sheet_sites iss ON iss.site_id = s.id
  JOIN info_sheets i ON i.code = iss.sheet_code
 WHERE iss.sheet_code = 'shv-marbach'
ON CONFLICT (site_id, provider_code, confirms) DO UPDATE SET label = EXCLUDED.label,
  url = EXCLUDED.url, retrieved_at = EXCLUDED.retrieved_at;

-- The named groundhandling meadow is next to the reviewed Schützenhaus
-- landing. This source confirms groundhandling conditions only, not a broader
-- landing permission, so it is stored as a clearly scoped report.
INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, authority)
SELECT id,'shv-fsvl','etiquette',
  'The nearby Schützenhaus groundhandling meadow may be used only when its roadside sign shows OPEN. A red cross on the access path means the adjacent shooting range is active: landing and groundhandling are prohibited. Access is on foot from the Schützenhaus parking via the field path.',
  'en','SHV/FSVL Groundhandling Wolfenschiessen Schützenhaus',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Wolfenschiessen_Groundhandling.pdf','governing_body'
  FROM sites WHERE id = 'osm-way-1491928450-landing'
ON CONFLICT DO NOTHING;

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
VALUES ('osm-way-1491928450-landing','shv-fsvl','access',
  'SHV/FSVL Groundhandling Wolfenschiessen Schützenhaus',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Wolfenschiessen_Groundhandling.pdf',DATE '2026-08-30')
ON CONFLICT (site_id, provider_code, confirms) DO UPDATE SET label = EXCLUDED.label,
  url = EXCLUDED.url, retrieved_at = EXCLUDED.retrieved_at;

COMMIT;
