BEGIN;

-- Transcribed from the SHV/FSVL official area information sheets by reading the
-- published PDFs. A heuristic text parser was written first and rejected: it
-- mislabelled landings as launches and attached one site's coordinates to
-- another, which for safety-critical data is worse than no import at all.

INSERT INTO info_sheets (code, provider_code, area_name, url, published_on, retrieved_at, notes)
VALUES
 ('shv-pilatus','shv-fsvl','Fluggebiet Pilatus',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Pilatus.pdf',
  DATE '2024-07-01', DATE '2026-08-29','Sheet revision 7-2024. Produced with GCM/GCL clubs.'),
 ('shv-klewenalp','shv-fsvl','Fluggebiet Klewenalp-Beckenried',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Klewenalp.pdf',
  DATE '2023-02-28', DATE '2026-08-29','Created 2023-02-28 by IMPULS AG Thun.')
ON CONFLICT (code) DO UPDATE SET published_on = EXCLUDED.published_on;

-- Klewenalp: the governing body places the launch 1599 m at 46.9403, 8.4760,
-- roughly 230 m east of the mountain station we had been using as an anchor,
-- and the Schützenhaus landing at 485 m rather than the 442 m terrain reading
-- taken at an approximate position.
UPDATE sites SET
  latitude = 46.9403, longitude = 8.4760, elevation_m = 1599,
  difficulty = 'medium', active_season = 'Mai-Okt',
  wing_types = ARRAY['paraglider','hangglider'],
  source_label = 'SHV/FSVL Infotafel Klewenalp-Beckenried',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Klewenalp.pdf',
  source_kind = 'governing_body', reviewed_at = DATE '2026-08-29'
 WHERE slug = 'klewenalp';

UPDATE sites SET
  latitude = 46.9661, longitude = 8.4667, elevation_m = 485,
  wing_types = ARRAY['paraglider','hangglider'],
  landing_role = 'official',
  source_label = 'SHV/FSVL Infotafel Klewenalp-Beckenried',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Klewenalp.pdf',
  source_kind = 'governing_body', reviewed_at = DATE '2026-08-29'
 WHERE slug = 'beckenried-schuetzenhaus';

-- Pilatus. Three launches and three landings, none of which existed before.
INSERT INTO sites (id, slug, kind, data_status, region_code, canton,
  latitude, longitude, elevation_m, launch_directions, difficulty, active_season,
  wing_types, access_type, landing_role, source_label, source_url, source_kind,
  reviewed_at, provider_code)
VALUES
 ('shv-pilatus-kulm','pilatus-kulm','launch','reviewed','lake-lucerne','OW',
  46.9793, 8.2552, 2059, ARRAY['S','SW','W'],'hard','Ganzjährig',
  ARRAY['paraglider'],'cable_car','unknown','SHV/FSVL Infotafel Pilatus',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Pilatus.pdf',
  'governing_body', DATE '2026-08-29','curated'),
 ('shv-klimsen-west','klimsen-west','launch','reviewed','lake-lucerne','OW',
  46.9816, 8.2505, 1868, ARRAY['W','NW'],'medium','Weg offen wenn schneefrei',
  ARRAY['paraglider'],'hike','unknown','SHV/FSVL Infotafel Pilatus',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Pilatus.pdf',
  'governing_body', DATE '2026-08-29','curated'),
 ('shv-klimsen-ost','klimsen-ost','launch','reviewed','lake-lucerne','OW',
  46.9823, 8.2507, 1866, ARRAY['E'],'medium','Weg offen wenn schneefrei',
  ARRAY['paraglider'],'hike','unknown','SHV/FSVL Infotafel Pilatus',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Pilatus.pdf',
  'governing_body', DATE '2026-08-29','curated'),
 ('shv-kriens-landing','kriens','landing','reviewed','lake-lucerne','LU',
  47.0307, 8.2785, 502, ARRAY[]::text[],'easy','Ganzjährig',
  ARRAY['paraglider'],'public_road','official','SHV/FSVL Infotafel Pilatus',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Pilatus.pdf',
  'governing_body', DATE '2026-08-29','curated'),
 ('shv-luzern-allmend-landing','luzern-allmend-shv','landing','reviewed','lake-lucerne','LU',
  47.0339, 8.3011, 455, ARRAY[]::text[],'easy','Ganzjährig',
  ARRAY['paraglider','hangglider'],'public_road','official','SHV/FSVL Infotafel Pilatus',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Pilatus.pdf',
  'governing_body', DATE '2026-08-29','curated'),
 ('shv-alpnachstad-landing','alpnachstad','landing','reviewed','lake-lucerne','OW',
  46.9511, 8.2749, 441, ARRAY[]::text[],'medium','Ganzjährig',
  ARRAY['paraglider'],'public_road','official','SHV/FSVL Infotafel Pilatus',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Pilatus.pdf',
  'governing_body', DATE '2026-08-29','curated')
ON CONFLICT (id) DO UPDATE SET
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  elevation_m = EXCLUDED.elevation_m, launch_directions = EXCLUDED.launch_directions,
  difficulty = EXCLUDED.difficulty, reviewed_at = EXCLUDED.reviewed_at;

COMMIT;
