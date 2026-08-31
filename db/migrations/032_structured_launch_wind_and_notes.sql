BEGIN;

-- Published SHV/FSVL bearings and site instructions for launches that were
-- previously only mapped, or had a reviewed position but no usable wind model.
-- Each range is a source-published direction expressed as an explicit arc; no
-- direction is inferred from the hillside or the point name.
UPDATE sites SET
  data_status = 'reviewed', source_label = 'SHV/FSVL Infotafel Rigi',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rigi.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id IN ('osm-way-112452859-launch','osm-way-112452851-launch','osm-way-112452853-launch');

UPDATE sites SET
  data_status = 'reviewed', source_label = 'SHV/FSVL Infotafel Rotenflue',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rotenflue.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-way-435871477-launch';

UPDATE sites SET
  data_status = 'reviewed', source_label = 'SHV/FSVL Infotafel Hummel',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hummel.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-way-965686744-launch';

UPDATE sites SET
  data_status = 'reviewed', source_label = 'SHV/FSVL Infotafel Hoch-Ybrig',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hoch-Ybrig.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-node-1864293848-launch';

UPDATE sites SET
  data_status = 'reviewed', source_label = 'SHV/FSVL Infotafel Urmiberg',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Urmiberg.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id = 'osm-way-377499206-launch';

UPDATE sites SET
  data_status = 'reviewed', source_label = 'SHV/FSVL Infotafel Fronalpstock',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Fronalpstock.pdf',
  source_kind = 'governing_body', provider_code = 'shv-fsvl', reviewed_at = DATE '2026-08-30'
 WHERE id IN ('osm-node-3141398793-launch','osm-node-3141392799-launch');

UPDATE site_translations SET
  name = v.name, summary = v.summary, known_for = v.known_for, cautions = v.cautions,
  provider_code = 'shv-fsvl'
  FROM (VALUES
   ('osm-way-112452859-launch','Rigi Kulm','Medium-difficulty summit launch on the Rigi, working in south-east and south-west winds.',ARRAY['Summit launch'],ARRAY['Rotor at the north-east rock edge.','Do not top-land; respect grazing animals.']),
   ('osm-way-112452851-launch','Rigi Staffelhöhe','Medium-difficulty Rigi launch, working in north-west and south-west winds.',ARRAY['Railway access'],ARRAY['The south-west option may be used only when its prohibition sign is covered.','Observe the special airspace regulation.']),
   ('osm-way-112452853-launch','Rigi Scheidegg','Medium-difficulty north-east-facing Rigi launch.',ARRAY['Cable-car access'],ARRAY['Training area for paragliders.','The abort area is very steep.']),
   ('osm-way-435871477-launch','Rotenflue · Südwest','Easy south-west-facing Rotenflue training launch.',ARRAY['Training launch'],ARRAY['Unsuitable in Bise or Föhn.','Expect side rotors near the ground in west wind or strong thermals.']),
   ('osm-way-965686744-launch','Rotmoos','Medium-difficulty Hummel launch for Bise from north-east to east.',ARRAY['Bise launch'],ARRAY['Use only the precisely marked launch area.']),
   ('osm-node-1864293848-launch','Grosser Sternen','The main Hoch-Ybrig summer launch, working in north-west wind.',ARRAY['Main summer launch','Lift served'],ARRAY['The groomed winter launch lies about 50 m towards the cable car.']),
   ('osm-way-377499206-launch','Timpel / Urmiberg','A medium, steep south-facing Urmiberg launch, working from south-east to south-west.',ARRAY['Popular Bise launch'],ARRAY['Watch grazing fields and close fences after take-off.','Turbulence is possible in strong Bise.','The Urnersee is a known Föhn area; flying is discouraged in Föhn.']),
   ('osm-node-3141398793-launch','Bietstöckli','Medium-difficulty Fronalpstock launch, working in west to north winds.',ARRAY['Walk-in launch'],ARRAY['Reached from the mountain station by a six-minute downhill walk.','Not active in winter.']),
   ('osm-node-3141392799-launch','Gipfel Fronalpstock','Medium-difficulty Fronalpstock summit launch, working from north-east to east.',ARRAY['Summit launch'],ARRAY['A flat grassy slope steepens away below the launch.'])
  ) AS v(site_id,name,summary,known_for,cautions)
 WHERE site_translations.site_id = v.site_id AND site_translations.locale = 'en';

-- All of these exact arcs are read from the governing-body sheets. Split arcs
-- at north rather than treating 360 degrees as a special case in the client.
DELETE FROM site_wind_windows
 WHERE site_id IN (
  'curated-brunni-tuempfeli-launch','shv-euthal-waldrand-launch','shv-chli-aubrig-launch','shv-hummel-launch',
  'shv-marbach-nord-launch','shv-marbach-sued-launch','osm-way-112452859-launch','osm-way-112452851-launch',
  'osm-way-112452853-launch','osm-way-435871477-launch','osm-way-965686744-launch','osm-node-1864293848-launch',
  'osm-way-377499206-launch','osm-node-3141398793-launch','osm-node-3141392799-launch'
 );

INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code) VALUES
 ('shv-euthal-waldrand-launch',202.5,337.5,'preferred','shv-fsvl'),
 ('shv-chli-aubrig-launch',157.5,292.5,'preferred','shv-fsvl'),
 ('shv-hummel-launch',292.5,360,'preferred','shv-fsvl'),
 ('shv-hummel-launch',0,67.5,'preferred','shv-fsvl'),
 ('shv-marbach-nord-launch',247.5,360,'preferred','shv-fsvl'),
 ('shv-marbach-nord-launch',0,22.5,'preferred','shv-fsvl'),
 ('shv-marbach-sued-launch',157.5,247.5,'preferred','shv-fsvl'),
 ('osm-way-112452859-launch',112.5,157.5,'preferred','shv-fsvl'),
 ('osm-way-112452859-launch',202.5,247.5,'preferred','shv-fsvl'),
 ('osm-way-112452851-launch',292.5,337.5,'preferred','shv-fsvl'),
 ('osm-way-112452851-launch',202.5,247.5,'preferred','shv-fsvl'),
 ('osm-way-112452853-launch',22.5,67.5,'preferred','shv-fsvl'),
 ('osm-way-435871477-launch',157.5,247.5,'preferred','shv-fsvl'),
 ('osm-way-965686744-launch',22.5,112.5,'preferred','shv-fsvl'),
 ('osm-node-1864293848-launch',292.5,337.5,'preferred','shv-fsvl'),
 ('osm-way-377499206-launch',112.5,247.5,'preferred','shv-fsvl'),
 ('osm-node-3141398793-launch',247.5,360,'preferred','shv-fsvl'),
 ('osm-node-3141398793-launch',0,22.5,'preferred','shv-fsvl'),
 ('osm-node-3141392799-launch',22.5,112.5,'preferred','shv-fsvl')
ON CONFLICT (site_id, from_deg, to_deg, quality) DO UPDATE SET provider_code = EXCLUDED.provider_code;

-- The Engelberg sheet names Tümpfeli but does not publish a launch bearing.
-- Its operational cautions remain useful, while wind stays deliberately unknown.
INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, authority)
SELECT s.id,'shv-fsvl',v.kind,v.body,'en',v.attribution,v.url,'governing_body'
 FROM sites s CROSS JOIN (VALUES
  ('curated-brunni-tuempfeli-launch','conditions','Do not fly the Brunni area in Föhn or strong upper winds; valley wind may increase during the afternoon.','SHV/FSVL Infotafel Engelberg','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Engelberg.pdf'),
  ('curated-brunni-tuempfeli-launch','hazard','The Engelberg valley has many cables. Take-off and landing in federal game preserves are prohibited.','SHV/FSVL Infotafel Engelberg','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Engelberg.pdf'),
  ('shv-euthal-waldrand-launch','conditions','The Waldrand launch works in valley wind from south-west to north-west; strong valley wind can be turbulent.','SHV/FSVL Infotafel Euthal','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Euthal.pdf'),
  ('shv-chli-aubrig-launch','conditions','Chli Aubrig works in south to west wind and is active from October to May.','SHV/FSVL Infotafel Euthal','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Euthal.pdf'),
  ('shv-hummel-launch','conditions','Hummel works in north-west to north-east wind and is active year round.','SHV/FSVL Infotafel Hummel','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hummel.pdf'),
  ('shv-marbach-nord-launch','conditions','Marbach Nord works in west to north winds and is active year round.','SHV/FSVL Infotafel Marbach','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Marbach.pdf'),
  ('shv-marbach-sued-launch','conditions','Marbach Süd works in south to south-west winds and is active in the winter months.','SHV/FSVL Infotafel Marbach','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Marbach.pdf'),
  ('osm-way-112452859-launch','conditions','Rigi Kulm works in south-east and south-west winds.','SHV/FSVL Infotafel Rigi','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rigi.pdf'),
  ('osm-way-112452851-launch','conditions','Rigi Staffelhöhe works in north-west and south-west winds.','SHV/FSVL Infotafel Rigi','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rigi.pdf'),
  ('osm-way-112452853-launch','conditions','Rigi Scheidegg works in north-east wind.','SHV/FSVL Infotafel Rigi','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rigi.pdf'),
  ('osm-way-435871477-launch','conditions','The Rotenflue Südwest launch works in south-east to south-west winds and is used for training.','SHV/FSVL Infotafel Rotenflue','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rotenflue.pdf'),
  ('osm-way-965686744-launch','conditions','Rotmoos works in Bise from north-east to east.','SHV/FSVL Infotafel Hummel','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hummel.pdf'),
  ('osm-node-1864293848-launch','conditions','Grosser Sternen is the main Hoch-Ybrig summer launch and works in north-west wind.','SHV/FSVL Infotafel Hoch-Ybrig','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hoch-Ybrig.pdf'),
  ('osm-way-377499206-launch','conditions','Timpel / Urmiberg works in south-east to south-west winds and is a popular Bise launch.','SHV/FSVL Infotafel Urmiberg','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Urmiberg.pdf'),
  ('osm-node-3141398793-launch','conditions','Bietstöckli works in west to north winds and is not active in winter.','SHV/FSVL Infotafel Fronalpstock','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Fronalpstock.pdf'),
  ('osm-node-3141392799-launch','conditions','Gipfel Fronalpstock works in north-east to east winds and is active year round.','SHV/FSVL Infotafel Fronalpstock','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Fronalpstock.pdf')
 ) AS v(site_id,kind,body,attribution,url)
 WHERE s.id = v.site_id
ON CONFLICT DO NOTHING;

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT s.id,'shv-fsvl',c.confirms,'SHV/FSVL flying-area information sheet',v.url,DATE '2026-08-30'
 FROM sites s
 CROSS JOIN (VALUES ('description'),('wind'),('hazards'),('access')) AS c(confirms)
 JOIN (VALUES
  ('curated-brunni-tuempfeli-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Engelberg.pdf'),
  ('shv-euthal-waldrand-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Euthal.pdf'),
  ('shv-chli-aubrig-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Euthal.pdf'),
  ('shv-hummel-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hummel.pdf'),
  ('shv-marbach-nord-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Marbach.pdf'),
  ('shv-marbach-sued-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Marbach.pdf'),
  ('osm-way-112452859-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rigi.pdf'),
  ('osm-way-112452851-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rigi.pdf'),
  ('osm-way-112452853-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rigi.pdf'),
  ('osm-way-435871477-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Rotenflue.pdf'),
  ('osm-way-965686744-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hummel.pdf'),
  ('osm-node-1864293848-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Hoch-Ybrig.pdf'),
  ('osm-way-377499206-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Urmiberg.pdf'),
  ('osm-node-3141398793-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Fronalpstock.pdf'),
  ('osm-node-3141392799-launch','https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Fronalpstock.pdf')
 ) AS v(site_id,url) ON s.id = v.site_id
ON CONFLICT (site_id, provider_code, confirms) DO UPDATE SET label = EXCLUDED.label,
  url = EXCLUDED.url, retrieved_at = EXCLUDED.retrieved_at;

COMMIT;
