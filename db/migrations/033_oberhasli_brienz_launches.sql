BEGIN;

-- Official FLOB/SHV sheet covering the Haslital and Brienz cluster. Its
-- tabular coordinates distinguish these sites from nearby community markers.
INSERT INTO info_sheets (code, provider_code, area_name, url, retrieved_at, notes)
VALUES ('shv-oberhasli-brienz','shv-fsvl','Fluggebiet Oberhasli-Brienz',
 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Oberhasli-Brienz.pdf',
 DATE '2026-08-30','FLOB and SHV/FSVL flying-area information sheet.')
ON CONFLICT (code) DO UPDATE SET url = EXCLUDED.url, retrieved_at = EXCLUDED.retrieved_at, notes = EXCLUDED.notes;

UPDATE sites SET
  latitude = 46.7364, longitude = 8.2546, elevation_m = 2229,
  data_status = 'reviewed', difficulty = 'easy', active_season = 'Year round',
  wing_types = ARRAY['paraglider','hangglider'], source_label = 'SHV/FSVL Infotafel Oberhasli-Brienz',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Oberhasli-Brienz.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-way-105407954-launch';

UPDATE sites SET
  latitude = 46.7796, longitude = 8.0712, elevation_m = 1590,
  data_status = 'reviewed', difficulty = 'easy', active_season = 'Summer and autumn',
  wing_types = ARRAY['paraglider'], source_label = 'SHV/FSVL Infotafel Oberhasli-Brienz',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Oberhasli-Brienz.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-node-9519211526-launch';

UPDATE sites SET
  latitude = 46.7218, longitude = 8.1995, elevation_m = 603,
  data_status = 'reviewed', landing_role = 'official', difficulty = 'easy',
  source_label = 'SHV/FSVL Infotafel Oberhasli-Brienz',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Oberhasli-Brienz.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-way-105407953-landing';

UPDATE sites SET
  latitude = 46.7408, longitude = 8.0501, elevation_m = 566,
  data_status = 'reviewed', landing_role = 'official', difficulty = 'easy',
  source_label = 'SHV/FSVL Infotafel Oberhasli-Brienz',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Oberhasli-Brienz.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-node-1873486247-landing';

INSERT INTO sites (id, slug, kind, data_status, region_code, canton,
  latitude, longitude, elevation_m, launch_directions, difficulty, active_season,
  wing_types, access_type, landing_role, source_label, source_url, source_kind,
  reviewed_at, provider_code)
VALUES
 ('shv-sandhubei-reuti-launch','sandhubei-reuti','launch','reviewed','lake-lucerne','BE',
  46.7379,8.2057,1172,ARRAY['S','SW'],'easy','Year round',ARRAY['paraglider'],
  'walk','unknown','SHV/FSVL Infotafel Oberhasli-Brienz',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Oberhasli-Brienz.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl'),
 ('shv-axalp-schyberg-launch','axalp-schyberg','launch','reviewed','lake-lucerne','BE',
  46.7164,8.0348,1580,ARRAY['W','NW'],'medium','Year round',ARRAY['paraglider'],
  'walk','unknown','SHV/FSVL Infotafel Oberhasli-Brienz',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Oberhasli-Brienz.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl'),
 ('shv-bidmi-landing','bidmi-landing','landing','reviewed','lake-lucerne','BE',
  46.7453,8.2184,1427,ARRAY[]::text[],'medium','Year round',ARRAY['paraglider'],
  'walk','official','SHV/FSVL Infotafel Oberhasli-Brienz',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Oberhasli-Brienz.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl'),
 ('shv-innertkirchen-landing','innertkirchen-landing','landing','reviewed','lake-lucerne','BE',
  46.7050,8.2250,626,ARRAY[]::text[],'easy','Year round',ARRAY['paraglider'],
  'walk','official','SHV/FSVL Infotafel Oberhasli-Brienz',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Oberhasli-Brienz.pdf',
  'governing_body',DATE '2026-08-30','shv-fsvl')
ON CONFLICT (id) DO UPDATE SET
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, elevation_m = EXCLUDED.elevation_m,
  data_status = EXCLUDED.data_status, launch_directions = EXCLUDED.launch_directions,
  landing_role = EXCLUDED.landing_role, difficulty = EXCLUDED.difficulty, active_season = EXCLUDED.active_season,
  source_label = EXCLUDED.source_label, source_url = EXCLUDED.source_url, source_kind = EXCLUDED.source_kind,
  provider_code = EXCLUDED.provider_code, reviewed_at = EXCLUDED.reviewed_at, updated_at = now();

INSERT INTO site_translations (site_id, locale, name, locality, summary, terrain, access_detail, known_for, cautions, provider_code)
VALUES
 ('osm-way-105407954-launch','en','Planplatten','Meiringen',
  'Easy high launch above Meiringen for paragliders and hang gliders, active year round.',NULL,
  'Gondola from Meiringen or Hasliberg Reuti, then a short walk south over the ridge.',ARRAY['High launch','Paraglider and hang glider'],
  ARRAY['Check the Meiringen CTR/TMA procedure before every flight.'], 'shv-fsvl'),
 ('osm-node-9519211526-launch','en','Hofstetter Gummen','Brienz',
  'Easy hike-and-fly or shuttle-served launch near Brienz, active in summer and autumn.',NULL,
  'Hike and fly, or use the flight school shuttle.',ARRAY['Hike-and-fly'],
  ARRAY['Watch the transport cable.','Check the Meiringen CTR/TMA procedure before every flight.'], 'shv-fsvl'),
 ('shv-sandhubei-reuti-launch','en','Sandhubei Reuti','Hasliberg',
  'Easy south to south-west launch above Hasliberg Reuti, active year round.',NULL,
  'Walk about 20 minutes from Hasliberg Reuti station towards Goldern, then turn towards the retaining wall at the signed point.',ARRAY['Walk-in launch'],
  ARRAY['Use caution in strong Bise.','Check the Meiringen CTR/TMA procedure before every flight.'], 'shv-fsvl'),
 ('shv-axalp-schyberg-launch','en','Axalp Schyberg','Axalp',
  'Medium-difficulty west to north-west launch above Axalp, active year round.',NULL,
  'From Brienz station or Aaregg by post bus; use the Sportbahnen paid parking if driving, then walk 15 minutes on the mountain road.',ARRAY['Walk-in launch'],
  ARRAY['Not suitable in strong Bise.','Check the Meiringen CTR/TMA procedure before every flight.'], 'shv-fsvl'),
 ('osm-way-105407953-landing','en','Meiringen · Du Pont','Meiringen',
  'Official easy Meiringen landing at Du Pont.',NULL,'About 15 minutes on foot to Meiringen station and the gondola station.',ARRAY['Official landing'],
  ARRAY['Land in the mown part of the meadow.'], 'shv-fsvl'),
 ('osm-node-1873486247-landing','en','Aaregg Brienz','Brienz',
  'Official easy landing at Aaregg near Brienz.',NULL,'About 20 minutes on foot to Brienz station, or use the PostBus stop at Brunnen.',ARRAY['Official landing'],
  ARRAY['Watch the high-voltage line.'], 'shv-fsvl'),
 ('shv-bidmi-landing','en','Bidmi Hasliberg','Hasliberg',
  'Official medium-difficulty landing at the Bidmi middle station.',NULL,'One minute on foot to Bidmi middle station.',ARRAY['Official landing'],
  ARRAY['Watch the cable-car cable.','In winter land beside the ski piste.'], 'shv-fsvl'),
 ('shv-innertkirchen-landing','en','Innertkirchen','Innertkirchen',
  'Official easy Innertkirchen landing.',NULL,'Five minutes on foot to the Grimseltor stop.',ARRAY['Official landing'],
  ARRAY['Observe the TMA floor and heliport procedure.','Expect a valley-wind rotor behind the Aare gorge.'], 'shv-fsvl')
ON CONFLICT (site_id, locale) DO UPDATE SET
  name = EXCLUDED.name, locality = EXCLUDED.locality, summary = EXCLUDED.summary,
  terrain = EXCLUDED.terrain, access_detail = EXCLUDED.access_detail,
  known_for = EXCLUDED.known_for, cautions = EXCLUDED.cautions, provider_code = EXCLUDED.provider_code;

DELETE FROM site_wind_windows WHERE site_id IN (
 'shv-sandhubei-reuti-launch','osm-way-105407954-launch','osm-node-9519211526-launch','shv-axalp-schyberg-launch'
);
INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code) VALUES
 ('shv-sandhubei-reuti-launch',157.5,247.5,'preferred','shv-fsvl'),
 ('osm-way-105407954-launch',67.5,112.5,'preferred','shv-fsvl'),
 ('osm-way-105407954-launch',112.5,247.5,'preferred','shv-fsvl'),
 ('osm-way-105407954-launch',247.5,337.5,'preferred','shv-fsvl'),
 ('osm-node-9519211526-launch',157.5,202.5,'preferred','shv-fsvl'),
 ('shv-axalp-schyberg-launch',247.5,337.5,'preferred','shv-fsvl')
ON CONFLICT (site_id, from_deg, to_deg, quality) DO UPDATE SET provider_code = EXCLUDED.provider_code;

INSERT INTO launch_landings (launch_id, landing_id, role, provider_code, source_url, reviewed_at)
SELECT l.id,d.id,'official','shv-fsvl',i.url,DATE '2026-08-30'
  FROM sites l CROSS JOIN sites d JOIN info_sheets i ON i.code='shv-oberhasli-brienz'
 WHERE l.id IN ('shv-sandhubei-reuti-launch','osm-way-105407954-launch','osm-node-9519211526-launch','shv-axalp-schyberg-launch')
   AND d.id IN ('osm-way-105407953-landing','osm-node-1873486247-landing','shv-bidmi-landing','shv-innertkirchen-landing')
ON CONFLICT (launch_id, landing_id) DO UPDATE SET role = EXCLUDED.role, provider_code = EXCLUDED.provider_code,
  source_url = EXCLUDED.source_url, reviewed_at = EXCLUDED.reviewed_at;

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, authority)
SELECT s.id,'shv-fsvl',v.kind,v.body,'en','SHV/FSVL Infotafel Oberhasli-Brienz',
 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Oberhasli-Brienz.pdf','governing_body'
 FROM sites s JOIN (VALUES
  ('shv-sandhubei-reuti-launch','conditions','Sandhubei Reuti works in south to south-west wind; use caution in strong Bise.'),
  ('osm-way-105407954-launch','conditions','Planplatten works in east, south-east to south-west, west and north-west winds.'),
  ('osm-node-9519211526-launch','conditions','Hofstetter Gummen works in south wind and is active in summer and autumn.'),
  ('osm-node-9519211526-launch','hazard','Watch the transport cable at Hofstetter Gummen.'),
  ('shv-axalp-schyberg-launch','conditions','Axalp Schyberg works in west to north-west wind and is not suitable in strong Bise.')
 ) AS v(site_id,kind,body) ON s.id=v.site_id
ON CONFLICT DO NOTHING;

INSERT INTO site_restrictions (sheet_code, kind, description, season_note, contact, authority, source_url)
VALUES
 ('shv-oberhasli-brienz','airspace',
  'The Meiringen CTR/TMA can be active continuously. If its status cannot be checked, treat it as active; flying inside requires continuous radio contact.',
  NULL,'Infoband 0800 496 347; AM 130.150 MHz','Skyguide / Meiringen',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Oberhasli-Brienz.pdf'),
 ('shv-oberhasli-brienz','wildlife',
  'Under the Brienzergrat agreement, do not launch in the Augstmattthorn and Tannhorn federal game preserves; weekday flights there are prohibited.',
  'Early April–end of June, Monday–Friday',NULL,'Federal game preserve / local agreement',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Oberhasli-Brienz.pdf')
ON CONFLICT DO NOTHING;

INSERT INTO info_sheet_sites (sheet_code, site_id, sheet_label) VALUES
 ('shv-oberhasli-brienz','shv-sandhubei-reuti-launch','1'),
 ('shv-oberhasli-brienz','osm-way-105407954-launch','2'),
 ('shv-oberhasli-brienz','osm-node-9519211526-launch','3'),
 ('shv-oberhasli-brienz','shv-axalp-schyberg-launch','4'),
 ('shv-oberhasli-brienz','osm-way-105407953-landing','A'),
 ('shv-oberhasli-brienz','shv-bidmi-landing','B'),
 ('shv-oberhasli-brienz','shv-innertkirchen-landing','C'),
 ('shv-oberhasli-brienz','osm-node-1873486247-landing','D')
ON CONFLICT DO NOTHING;

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT s.id,'shv-fsvl',c.confirms,'SHV/FSVL flying-area information sheet',i.url,DATE '2026-08-30'
 FROM sites s CROSS JOIN (VALUES ('location'),('description'),('wind'),('hazards'),('access')) AS c(confirms)
 JOIN info_sheet_sites iss ON iss.site_id=s.id JOIN info_sheets i ON i.code=iss.sheet_code
 WHERE iss.sheet_code='shv-oberhasli-brienz'
ON CONFLICT (site_id, provider_code, confirms) DO UPDATE SET label=EXCLUDED.label,url=EXCLUDED.url,retrieved_at=EXCLUDED.retrieved_at;

COMMIT;
