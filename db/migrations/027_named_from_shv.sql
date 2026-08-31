BEGIN;

-- Two more cross-provider near pairs were examined and NOT merged. Distance
-- alone would have collapsed both, and both would have been wrong.
--
--   Titlis: the OpenStreetMap point sits at 3081 m and the ParaglidingEarth one
--   at 2543 m, 347 m apart horizontally but 538 m vertically. Those are two
--   different launches on the same mountain, near the summit and near Stand.
--
--   Fronalpstock: the SHV sheet enumerates four launches on that ridge, so a
--   397 m gap between two records is expected rather than suspicious.
--
-- The Fronalpstock case does yield an improvement short of merging. The
-- unnamed OpenStreetMap record sits 100 m from, and 11 m below, the SHV sheet's
-- "Gipfel Fronalpstock" at 1900 m, and no other SHV launch is within 460 m. It
-- is that launch, so it gets the federation's name and bearing instead of an
-- id-derived placeholder.

UPDATE site_translations SET name = 'Gipfel Fronalpstock'
 WHERE site_id = 'osm-node-3141392799-launch' OR site_id IN (
   SELECT id FROM sites WHERE slug LIKE '%3141392799%');

UPDATE sites SET
  source_label = 'SHV/FSVL Infotafel Fronalpstock · OpenStreetMap',
  source_url = 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Fronalpstock.pdf',
  difficulty = 'medium'
 WHERE slug LIKE '%3141392799%';

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT id,'shv-fsvl',c.confirms,'SHV/FSVL Infotafel Fronalpstock',
 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Fronalpstock.pdf', CURRENT_DATE
  FROM sites CROSS JOIN (VALUES ('location'),('description')) AS c(confirms)
 WHERE slug LIKE '%3141392799%'
ON CONFLICT (site_id, provider_code, confirms) DO NOTHING;

COMMIT;
