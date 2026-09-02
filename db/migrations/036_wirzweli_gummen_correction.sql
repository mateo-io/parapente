BEGIN;

-- The earlier Gummen merge treated two ParaglidingEarth points 263 m apart as
-- a duplicate. The provider's own area page identifies them as two separate
-- launches: Gummen Bergstation and Vorderer Gummen. Keep those records apart;
-- they have different locations, access and directional evidence.

DELETE FROM site_reports
 WHERE site_id = 'osm-way-126134047-launch'
   AND body LIKE 'Known as "Gummen (beim Kreuz)"%';

-- The lower Wirzweli map point corresponds to the separate 1,220 m community
-- record, not to the Horn or either Gummen launch. Its source direction is N.
UPDATE sites SET launch_directions = ARRAY['N']
 WHERE id = 'osm-node-9492505978-launch';

UPDATE sites SET launch_directions = ARRAY['S','SW']
 WHERE id = 'osm-way-126134047-launch';

-- Create the distinct station-side launch before attaching its translation and
-- reports below. It remains mapped because the evidence is community data.
INSERT INTO sites (id, slug, kind, data_status, region_code, canton,
  latitude, longitude, elevation_m, launch_directions, wing_types, access_type,
  source_label, source_url, source_kind, reviewed_at, provider_code)
VALUES ('pge-gummen-bergstation-launch','gummen-bergstation-pge','launch','mapped','lake-lucerne','NW',
  46.90190,8.36259,1580,ARRAY[]::text[],ARRAY['paraglider'],'lift',
  'ParaglidingEarth','https://www.paraglidingearth.com/','community',DATE '2026-09-01','paraglidingearth')
ON CONFLICT (id) DO UPDATE SET
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, elevation_m = EXCLUDED.elevation_m,
  launch_directions = EXCLUDED.launch_directions, wing_types = EXCLUDED.wing_types,
  access_type = EXCLUDED.access_type, source_label = EXCLUDED.source_label,
  source_url = EXCLUDED.source_url, source_kind = EXCLUDED.source_kind,
  provider_code = EXCLUDED.provider_code, reviewed_at = EXCLUDED.reviewed_at, updated_at = now();

INSERT INTO site_translations (site_id, locale, name, locality, summary, terrain, access_detail, known_for, cautions, provider_code)
VALUES
 ('osm-node-9492505978-launch','en','Wirzweli · Lower launch','Dallenwil',
  'Mapped lower Wirzweli launch at about 1,220 m; community data rates north as the working direction.', NULL,
  'Reach Wirzweli by the Dallenwil–Wirzweli cable car; confirm access and the exact usable setup locally.',
  ARRAY['Lower launch','North'],
  ARRAY['Mapped community record: confirm current launch permission, boundary, wind and obstacles locally.'], 'paraglidingearth'),
 ('pge-wirzweli-horn-launch','en','Wirzweli · Horn','Dallenwil',
  'Mapped Horn launch at 1,470 m, distinct from the lower Wirzweli launch and both Gummen launches.',
  'Medium-steep, uneven meadow according to the community guide.',
  'From Wirzweli, walk uphill on the mountain path; the community guide lists about 40 minutes.',
  ARRAY['Horn launch','North'],
  ARRAY['Mapped community record: confirm current launch permission, boundary, wind and obstacles locally.'], 'paraglidingearth'),
 ('osm-way-126134047-launch','en','Gummen · Vorderer Gummen','Dallenwil',
  'Mapped Vorderer Gummen launch near the summit cross, distinct from Gummen Bergstation.', NULL,
  'From Gummen station, the community guide describes a roughly five-minute walk to the summit-cross launch.',
  ARRAY['Summit-cross launch','South / south-west evidence'],
  ARRAY['Mapped community record: confirm current launch permission, boundary, wind and obstacles locally.'], 'ens-ch'),
 ('pge-gummen-bergstation-launch','en','Gummen · Bergstation','Dallenwil',
  'Mapped Gummen station-side launch at about 1,580 m, separate from Vorderer Gummen.', NULL,
  'Immediately beside the Gummen cable-car station.', ARRAY['Station-side launch'],
  ARRAY['The historical community page and API disagree on its direction. No wind filter range is shown until a current local source resolves it.', 'Confirm the current launch setup, wind and cable hazards locally.'], 'paraglidingearth')
ON CONFLICT (site_id, locale) DO UPDATE SET
  name = EXCLUDED.name, locality = EXCLUDED.locality, summary = EXCLUDED.summary,
  terrain = EXCLUDED.terrain, access_detail = EXCLUDED.access_detail,
  known_for = EXCLUDED.known_for, cautions = EXCLUDED.cautions, provider_code = EXCLUDED.provider_code;

-- Preserve the lower-launch north evidence with the record the prior migration
-- accidentally missed because it addressed a non-existent slug.
DELETE FROM site_wind_windows
 WHERE site_id = 'osm-node-9492505978-launch' AND provider_code = 'paraglidingearth';

INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
VALUES
 ('osm-node-9492505978-launch',337.5,360.0,'preferred','paraglidingearth'),
 ('osm-node-9492505978-launch',0.0,22.5,'preferred','paraglidingearth')
ON CONFLICT (site_id, from_deg, to_deg, quality) DO UPDATE SET provider_code = EXCLUDED.provider_code;

-- Recreate the wrongly merged station-side Gummen launch. The current API
-- returns SE, while the historical area page presents a different direction
-- combination. This is intentionally a mapped record with *no* wind windows:
-- a forecast match must not choose between conflicting historical sources.
INSERT INTO sites (id, slug, kind, data_status, region_code, canton,
  latitude, longitude, elevation_m, launch_directions, wing_types, access_type,
  source_label, source_url, source_kind, reviewed_at, provider_code)
VALUES ('pge-gummen-bergstation-launch','gummen-bergstation-pge','launch','mapped','lake-lucerne','NW',
  46.90190,8.36259,1580,ARRAY[]::text[],ARRAY['paraglider'],'lift',
  'ParaglidingEarth','https://www.paraglidingearth.com/','community',DATE '2026-09-01','paraglidingearth')
ON CONFLICT (id) DO UPDATE SET
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, elevation_m = EXCLUDED.elevation_m,
  launch_directions = EXCLUDED.launch_directions, wing_types = EXCLUDED.wing_types,
  access_type = EXCLUDED.access_type, source_label = EXCLUDED.source_label,
  source_url = EXCLUDED.source_url, source_kind = EXCLUDED.source_kind,
  provider_code = EXCLUDED.provider_code, reviewed_at = EXCLUDED.reviewed_at, updated_at = now();

DELETE FROM site_wind_windows WHERE site_id = 'pge-gummen-bergstation-launch';

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, observed_on, retrieved_at, authority)
VALUES
 ('osm-node-9492505978-launch','paraglidingearth','conditions',
  'ParaglidingEarth lists this lower Wirzweli launch at 1,220 m and rates north as good. This is community data; verify the actual setup and local valley effects at launch.',
  'en','ParaglidingEarth', 'https://www.paraglidingearth.com/', DATE '2012-10-26', DATE '2026-09-01','community'),
 ('pge-wirzweli-horn-launch','paraglidingearth','observation',
  'The community guide lists the Horn launch at 1,470 m, reached on foot from Wirzweli, and rates north as good. It is distinct from the lower station-side launch.',
  'en','ParaglidingEarth · Wirzweli–Gummen area page','https://www.paragliding365.com/index-p-flightarea_details_6172.html',DATE '2012-10-26',DATE '2026-09-01','community'),
 ('osm-way-126134047-launch','ens-ch','observation',
  'ENS identifies this mapped point as Gummen (by the summit cross), with a 195° reference bearing. It is separate from Gummen Bergstation.',
  'en','ens.ch Gleitschirm GPS','https://ens.ch/ens/gleitschirm/gps/schweiz/index.html',NULL,DATE '2026-09-01','community'),
 ('pge-gummen-bergstation-launch','paraglidingearth','observation',
  'The historical community guide identifies a small launch immediately beside Gummen station, separate from Vorderer Gummen.',
  'en','ParaglidingEarth · Wirzweli–Gummen area page','https://www.paragliding365.com/index-p-flightarea_details_6172.html',DATE '2012-10-26',DATE '2026-09-01','community'),
 ('pge-gummen-bergstation-launch','paraglidingearth','hazard',
  'The historical ParaglidingEarth web page and its current API disagree about the station-side launch direction. No directional suitability is derived from either record.',
  'en','ParaglidingEarth (historical page and current API)','https://www.paraglidingearth.com/',DATE '2026-09-01',DATE '2026-09-01','community')
ON CONFLICT DO NOTHING;

-- Remove the false claim that the station-side PGE point corroborates Vorderer
-- Gummen. The PGE area page can still confirm the latter's description, but
-- not its location or wind range.
DELETE FROM site_sources
 WHERE site_id = 'osm-way-126134047-launch'
   AND provider_code = 'paraglidingearth'
   AND confirms IN ('location','wind');

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
VALUES
 ('osm-node-9492505978-launch','paraglidingearth','description','ParaglidingEarth · Wirzweli–Gummen area page','https://www.paragliding365.com/index-p-flightarea_details_6172.html',DATE '2026-09-01'),
 ('osm-node-9492505978-launch','paraglidingearth','wind','ParaglidingEarth API','https://www.paraglidingearth.com/',DATE '2026-09-01'),
 ('pge-wirzweli-horn-launch','paraglidingearth','description','ParaglidingEarth · Wirzweli–Gummen area page','https://www.paragliding365.com/index-p-flightarea_details_6172.html',DATE '2026-09-01'),
 ('pge-gummen-bergstation-launch','paraglidingearth','location','ParaglidingEarth API','https://www.paraglidingearth.com/',DATE '2026-09-01'),
 ('pge-gummen-bergstation-launch','paraglidingearth','description','ParaglidingEarth · Wirzweli–Gummen area page','https://www.paragliding365.com/index-p-flightarea_details_6172.html',DATE '2026-09-01'),
 ('osm-way-126134047-launch','paraglidingearth','description','ParaglidingEarth · Wirzweli–Gummen area page','https://www.paragliding365.com/index-p-flightarea_details_6172.html',DATE '2026-09-01')
ON CONFLICT (site_id, provider_code, confirms) DO UPDATE SET
  label = EXCLUDED.label, url = EXCLUDED.url, retrieved_at = EXCLUDED.retrieved_at;

COMMIT;
