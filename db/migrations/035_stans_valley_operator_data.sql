BEGIN;

-- Current local operators distinguish the Stans Valley sites more precisely
-- than the imported map points do.  This migration intentionally adds only
-- the fields those operators state; wind is never inferred from a slope.

INSERT INTO providers (code, name, homepage_url, redistribution, licence, notes)
VALUES
  ('brunni-bahnen','Brunni-Bahnen Engelberg','https://brunni.ch/en/detail/paragliding','restricted','Site terms',
   'Lift operator publishing current launch, landing and safety information for Brunni.'),
  ('engelberg-titlis-tourism','Engelberg-Titlis Tourism','https://www.engelberg.ch/ganzjaehrig/gleitschirm/','restricted','Site terms',
   'Destination operator publishing current launch information for the Engelberg valley.'),
  ('haldigrat','Haldigrat AG','https://www.haldigrat.ch/erlebnis-haldigrat/gleitsport','restricted','Site terms',
   'Lift operator publishing local flying-area access, wind and hazard guidance.')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, homepage_url = EXCLUDED.homepage_url, notes = EXCLUDED.notes;

-- Brunni's operator identifies three individually exposed launches.  The
-- existing OSM Brunnihütte and Schonegg records match the published names,
-- coordinates/elevation where provided, so they are upgraded rather than
-- duplicated.
UPDATE sites SET
  data_status = 'reviewed', elevation_m = 1800,
  launch_directions = ARRAY['S','SE'], difficulty = 'easy',
  wing_types = ARRAY['paraglider'], access_type = 'lift',
  provider_code = 'brunni-bahnen',
  source_label = 'Brunni-Bahnen Engelberg · paragliding information',
  source_url = 'https://brunni.ch/en/detail/paragliding', source_kind = 'operator',
  reviewed_at = DATE '2026-09-01'
WHERE id = 'curated-brunni-tuempfeli-launch';

UPDATE sites SET
  data_status = 'reviewed', latitude = 46.84250, longitude = 8.41040, elevation_m = 1870,
  launch_directions = ARRAY['W'], difficulty = 'easy', wing_types = ARRAY['paraglider'],
  access_type = 'lift', provider_code = 'brunni-bahnen',
  source_label = 'Brunni-Bahnen Engelberg · paragliding information',
  source_url = 'https://brunni.ch/en/detail/paragliding', source_kind = 'operator',
  reviewed_at = DATE '2026-09-01'
WHERE id = 'osm-way-1491922602-launch';

UPDATE sites SET
  data_status = 'reviewed', elevation_m = 2000,
  launch_directions = ARRAY['S'], difficulty = 'easy', wing_types = ARRAY['paraglider'],
  access_type = 'lift', provider_code = 'brunni-bahnen',
  source_label = 'Brunni-Bahnen Engelberg · paragliding information',
  source_url = 'https://brunni.ch/en/detail/paragliding', source_kind = 'operator',
  reviewed_at = DATE '2026-09-01'
WHERE id = 'osm-way-1491923373-launch';

INSERT INTO site_translations (site_id, locale, name, locality, summary, terrain, access_detail, known_for, cautions, provider_code)
VALUES
  ('curated-brunni-tuempfeli-launch','en','Brunni · Tümpfeli','Engelberg',
   'South to south-east Brunni launch at 1,800 m.', 'Gently sloping meadow; space for about ten gliders.',
   'Cable car and chairlift, then descend on foot for about ten minutes.', ARRAY['Training launch','South / south-east'],
   ARRAY['Do not use Brunni in Föhn or strong upper winds.', 'Valley wind may increase in the afternoon.'], 'brunni-bahnen'),
  ('osm-way-1491922602-launch','en','Brunni · Härzlisee','Engelberg',
   'West-facing Brunni launch at 1,870 m.', 'Gently sloping meadow; space for about three gliders.',
   'Cable car and chairlift, then walk about five minutes uphill.', ARRAY['Training launch','West'],
   ARRAY['Do not use Brunni in Föhn or strong upper winds.', 'Valley wind may increase in the afternoon.'], 'brunni-bahnen'),
  ('osm-way-1491923373-launch','en','Brunni · Schonegg','Engelberg',
   'South-facing Brunni launch at 2,000 m.', 'Gently sloping meadow; space for about ten gliders.',
   'Cable car and chairlift, then about 20 minutes on foot with 140 m ascent; in winter, the Schonegg T-bar may be available.', ARRAY['Training launch','South'],
   ARRAY['Do not use Brunni in Föhn or strong upper winds.', 'Valley wind may increase in the afternoon.'], 'brunni-bahnen')
ON CONFLICT (site_id, locale) DO UPDATE SET
  name = EXCLUDED.name, locality = EXCLUDED.locality, summary = EXCLUDED.summary,
  terrain = EXCLUDED.terrain, access_detail = EXCLUDED.access_detail, known_for = EXCLUDED.known_for,
  cautions = EXCLUDED.cautions, provider_code = EXCLUDED.provider_code;

DELETE FROM site_wind_windows
WHERE site_id IN ('curated-brunni-tuempfeli-launch','osm-way-1491922602-launch','osm-way-1491923373-launch');

INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code) VALUES
  ('curated-brunni-tuempfeli-launch',157.5,202.5,'preferred','brunni-bahnen'),
  ('osm-way-1491922602-launch',247.5,292.5,'preferred','brunni-bahnen'),
  ('osm-way-1491923373-launch',157.5,202.5,'preferred','brunni-bahnen')
ON CONFLICT (site_id, from_deg, to_deg, quality) DO UPDATE SET provider_code = EXCLUDED.provider_code;

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, observed_on, retrieved_at, authority)
SELECT s.id, 'brunni-bahnen', v.kind, v.body, 'en', 'Brunni-Bahnen Engelberg · paragliding information',
       'https://brunni.ch/en/detail/paragliding', DATE '2026-09-01', DATE '2026-09-01', 'operator'
FROM sites s CROSS JOIN (VALUES
  ('conditions','Do not fly the Brunni area in Föhn or strong upper winds; valley wind may increase in the afternoon.'),
  ('hazard','The Engelberg valley has many cables. Check the aviation-obstacle map before launch.'),
  ('hazard','Take account of Buochs and Alpnach airspace regulations and temporary DABS zones.'),
  ('etiquette','Take-off and landing in federal hunting areas are prohibited; maintain distance from wildlife in overflight.')
) AS v(kind, body)
WHERE s.id IN ('curated-brunni-tuempfeli-launch','osm-way-1491922602-launch','osm-way-1491923373-launch')
ON CONFLICT DO NOTHING;

-- The current Fürenalp operator page gives access and Föhn/thermal guidance,
-- but no directional rating.  Do not manufacture a filter window from its
-- aspect or from an older document.
UPDATE sites SET
  data_status = 'reviewed', elevation_m = 1923, wing_types = ARRAY['paraglider'], access_type = 'lift',
  provider_code = 'engelberg-titlis-tourism', source_label = 'Engelberg-Titlis Tourism · Fürenalp launch',
  source_url = 'https://www.engelberg.ch/ganzjaehrig/gleitschirm/startplaetze/fuerenalp/', source_kind = 'operator',
  reviewed_at = DATE '2026-09-01'
WHERE id = 'osm-way-1491927588-launch';

INSERT INTO site_translations (site_id, locale, name, locality, summary, terrain, access_detail, known_for, cautions, provider_code)
VALUES ('osm-way-1491927588-launch','en','Fürenalp','Engelberg',
  'Fürenalp launch at 1,923 m, in the upper Engelberg valley.', 'Meadow above the Fürenalp cable-car mountain station.',
  'Take the cable car, then walk roughly 15–20 minutes toward Wissberg.', ARRAY['Late-afternoon thermals','Training suitable'],
  ARRAY['The local operator says Fürenalp has no protection in Föhn and should be avoided in Föhn conditions.'], 'engelberg-titlis-tourism')
ON CONFLICT (site_id, locale) DO UPDATE SET
  name = EXCLUDED.name, locality = EXCLUDED.locality, summary = EXCLUDED.summary, terrain = EXCLUDED.terrain,
  access_detail = EXCLUDED.access_detail, known_for = EXCLUDED.known_for, cautions = EXCLUDED.cautions,
  provider_code = EXCLUDED.provider_code;

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, retrieved_at, authority)
VALUES
  ('osm-way-1491927588-launch','engelberg-titlis-tourism','conditions','Fürenalp has no protection in Föhn and should be avoided in Föhn conditions; good thermal conditions can persist into late afternoon and often late autumn.','en','Engelberg-Titlis Tourism · Fürenalp launch','https://www.engelberg.ch/ganzjaehrig/gleitschirm/startplaetze/fuerenalp/',DATE '2026-09-01','operator'),
  ('osm-way-1491927588-launch','engelberg-titlis-tourism','access','The launch meadow is reached from the Fürenalp cable-car mountain station after roughly a 15–20 minute walk toward Wissberg.','en','Engelberg-Titlis Tourism · Fürenalp launch','https://www.engelberg.ch/ganzjaehrig/gleitschirm/startplaetze/fuerenalp/',DATE '2026-09-01','operator')
ON CONFLICT DO NOTHING;

-- Haldigrat's current operator page confirms area-level conditions and the
-- Schützenhaus landing, but does not publish a precise PG-launch coordinate;
-- the mapped launch therefore remains mapped.
INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, observed_on, retrieved_at, authority)
SELECT s.id, 'haldigrat', v.kind, v.body, 'en', 'Haldigrat AG · Gleitsport',
       'https://www.haldigrat.ch/erlebnis-haldigrat/gleitsport', DATE '2026-09-01', DATE '2026-09-01', 'operator'
FROM sites s CROSS JOIN (VALUES
  ('conditions','For the Haldigrat flying area, the operator describes south to south-west as ideal. Strong thermal cycles can briefly create tailwind at launch.'),
  ('conditions','In Bise, paraglider pilots use the north-facing launch options to work thermal releases toward Brändlen. Strong Bise can bring turbulence and sink on the south side.'),
  ('hazard','The Engelberg valley has many transport and forestry cables up to about 1,300 m. The operator specifically advises against landing around Oberrickenbach.'),
  ('hazard','April to June spring thermals require particular caution in Bise because of lee thermals.'),
  ('restriction','')
) AS v(kind, body)
WHERE s.id = 'pge-dalenwil-haldigrat-launch' AND v.kind <> 'restriction'
ON CONFLICT DO NOTHING;

INSERT INTO site_restrictions (site_id, kind, description, season_note, authority, source_url)
VALUES ('pge-dalenwil-haldigrat-launch','wildlife',
  'From the Haldigrat launch eastward toward Brisen, overflight is prohibited before 11:00 to protect wildlife.',
  'Before 11:00', 'Haldigrat AG', 'https://www.haldigrat.ch/erlebnis-haldigrat/gleitsport')
ON CONFLICT DO NOTHING;

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, retrieved_at, authority)
VALUES
  ('osm-way-1491928450-landing','haldigrat','conditions','The Haldigrat operator identifies Wolfenschiessen Schützenhaus as the current paraglider landing. Keep to the stated part of the field; when shooting is active, use the delta landing instead.','en','Haldigrat AG · Gleitsport','https://www.haldigrat.ch/erlebnis-haldigrat/gleitsport',DATE '2026-09-01','operator'),
  ('osm-way-1491928450-landing','haldigrat','hazard','At strong valley-wind strength the alternative delta landing near the Schützenhaus can be turbulent.','en','Haldigrat AG · Gleitsport','https://www.haldigrat.ch/erlebnis-haldigrat/gleitsport',DATE '2026-09-01','operator')
ON CONFLICT DO NOTHING;

INSERT INTO launch_landings (launch_id, landing_id, role, condition_note, provider_code, source_url, reviewed_at)
VALUES ('pge-dalenwil-haldigrat-launch','osm-way-1491928450-landing','official',
  'Use the stated part of the field. When shooting is active, the operator directs pilots to the delta landing.',
  'haldigrat','https://www.haldigrat.ch/erlebnis-haldigrat/gleitsport',DATE '2026-09-01')
ON CONFLICT (launch_id, landing_id) DO UPDATE SET role = EXCLUDED.role, condition_note = EXCLUDED.condition_note,
  provider_code = EXCLUDED.provider_code, source_url = EXCLUDED.source_url, reviewed_at = EXCLUDED.reviewed_at;

-- Büelen’s detailed school sheet remains linked by the school, but its PDF was
-- last modified in 2016. Keep its two launch sections visibly historical and
-- do not turn its wind labels into current forecast-filter evidence.
UPDATE sites SET launch_sections = jsonb_build_array(
  jsonb_build_object('id','main','name','Büelen','evidenceStatus','historical',
    'description','Small, medium-steep meadow directly beside the cable-car station.',
    'windDirections',jsonb_build_object('preferred',jsonb_build_array('E'),'acceptable','[]'::jsonb),
    'cautions',jsonb_build_array('Detailed guidance is from a 2016 school document. Confirm current operation locally.'),
    'evidenceNote','The school still links this document, but its file was last modified in 2016.',
    'source',jsonb_build_object('label','Flugschule Emmetten · Infos für Gleitschirmflieger Büelen (2016)','url','https://s54574195ad4eeed4.jimcontent.com/download/version/1480789575/module/8964746285/name/Infos%20fuer%20Gleitschirmflieger%20Bueelen.pdf','reviewedAt','2026-09-01')),
  jsonb_build_object('id','upper-slope','name','Büelenhang','evidenceStatus','historical',
    'description','Steep meadow about ten minutes uphill from the main launch.',
    'windDirections',jsonb_build_object('preferred',jsonb_build_array('E'),'acceptable','[]'::jsonb),
    'cautions',jsonb_build_array('The sheet warns of a cable to the small wooden hut.'),
    'evidenceNote','The school still links this document, but its file was last modified in 2016.',
    'source',jsonb_build_object('label','Flugschule Emmetten · Infos für Gleitschirmflieger Büelen (2016)','url','https://s54574195ad4eeed4.jimcontent.com/download/version/1480789575/module/8964746285/name/Infos%20fuer%20Gleitschirmflieger%20Bueelen.pdf','reviewedAt','2026-09-01'))
)
WHERE id = 'osm-way-1291264105-launch';

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, observed_on, retrieved_at, authority)
VALUES
  ('osm-way-1291264105-launch','flugschule-emmetten','conditions','Büelen is described as an east-wind morning and thermal flying area and as an examination area. This statement is from the linked 2016 sheet; confirm current conditions and operation locally.','en','Flugschule Emmetten · Infos für Gleitschirmflieger Büelen (2016)','https://s54574195ad4eeed4.jimcontent.com/download/version/1480789575/module/8964746285/name/Infos%20fuer%20Gleitschirmflieger%20Bueelen.pdf',DATE '2016-12-03',DATE '2026-09-01','school'),
  ('osm-way-1291264105-launch','flugschule-emmetten','hazard','The 2016 sheet identifies a cable to the small hut near the launch and says temporary cables may be installed without notice.','en','Flugschule Emmetten · Infos für Gleitschirmflieger Büelen (2016)','https://s54574195ad4eeed4.jimcontent.com/download/version/1480789575/module/8964746285/name/Infos%20fuer%20Gleitschirmflieger%20Bueelen.pdf',DATE '2016-12-03',DATE '2026-09-01','school')
ON CONFLICT DO NOTHING;

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT s.id, v.provider_code, v.confirms, v.label, v.url, DATE '2026-09-01'
FROM sites s CROSS JOIN (VALUES
  ('curated-brunni-tuempfeli-launch','brunni-bahnen','location','Brunni-Bahnen Engelberg · paragliding information','https://brunni.ch/en/detail/paragliding'),
  ('curated-brunni-tuempfeli-launch','brunni-bahnen','description','Brunni-Bahnen Engelberg · paragliding information','https://brunni.ch/en/detail/paragliding'),
  ('curated-brunni-tuempfeli-launch','brunni-bahnen','wind','Brunni-Bahnen Engelberg · paragliding information','https://brunni.ch/en/detail/paragliding'),
  ('osm-way-1491922602-launch','brunni-bahnen','location','Brunni-Bahnen Engelberg · paragliding information','https://brunni.ch/en/detail/paragliding'),
  ('osm-way-1491922602-launch','brunni-bahnen','description','Brunni-Bahnen Engelberg · paragliding information','https://brunni.ch/en/detail/paragliding'),
  ('osm-way-1491922602-launch','brunni-bahnen','wind','Brunni-Bahnen Engelberg · paragliding information','https://brunni.ch/en/detail/paragliding'),
  ('osm-way-1491923373-launch','brunni-bahnen','description','Brunni-Bahnen Engelberg · paragliding information','https://brunni.ch/en/detail/paragliding'),
  ('osm-way-1491923373-launch','brunni-bahnen','wind','Brunni-Bahnen Engelberg · paragliding information','https://brunni.ch/en/detail/paragliding'),
  ('osm-way-1491927588-launch','engelberg-titlis-tourism','description','Engelberg-Titlis Tourism · Fürenalp launch','https://www.engelberg.ch/ganzjaehrig/gleitschirm/startplaetze/fuerenalp/'),
  ('osm-way-1491927588-launch','engelberg-titlis-tourism','access','Engelberg-Titlis Tourism · Fürenalp launch','https://www.engelberg.ch/ganzjaehrig/gleitschirm/startplaetze/fuerenalp/'),
  ('pge-dalenwil-haldigrat-launch','haldigrat','description','Haldigrat AG · Gleitsport','https://www.haldigrat.ch/erlebnis-haldigrat/gleitsport'),
  ('pge-dalenwil-haldigrat-launch','haldigrat','wind','Haldigrat AG · Gleitsport','https://www.haldigrat.ch/erlebnis-haldigrat/gleitsport'),
  ('pge-dalenwil-haldigrat-launch','haldigrat','hazards','Haldigrat AG · Gleitsport','https://www.haldigrat.ch/erlebnis-haldigrat/gleitsport'),
  ('osm-way-1491928450-landing','haldigrat','description','Haldigrat AG · Gleitsport','https://www.haldigrat.ch/erlebnis-haldigrat/gleitsport'),
  ('osm-way-1291264105-launch','flugschule-emmetten','description','Flugschule Emmetten · Infos für Gleitschirmflieger Büelen (2016)','https://s54574195ad4eeed4.jimcontent.com/download/version/1480789575/module/8964746285/name/Infos%20fuer%20Gleitschirmflieger%20Bueelen.pdf'),
  ('osm-way-1291264105-launch','flugschule-emmetten','hazards','Flugschule Emmetten · Infos für Gleitschirmflieger Büelen (2016)','https://s54574195ad4eeed4.jimcontent.com/download/version/1480789575/module/8964746285/name/Infos%20fuer%20Gleitschirmflieger%20Bueelen.pdf')
) AS v(site_id,provider_code,confirms,label,url)
WHERE s.id = v.site_id
ON CONFLICT (site_id, provider_code, confirms) DO UPDATE SET
  label = EXCLUDED.label, url = EXCLUDED.url, retrieved_at = EXCLUDED.retrieved_at;

COMMIT;
