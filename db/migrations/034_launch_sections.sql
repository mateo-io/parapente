BEGIN;

-- A launch section is a named, direction-specific part of one launch area.
-- It is deliberately not another site: access, landings, airspace and general
-- cautions remain shared by the parent `sites` row.
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS launch_sections jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE sites
  DROP CONSTRAINT IF EXISTS sites_launch_sections_array;

ALTER TABLE sites
  ADD CONSTRAINT sites_launch_sections_array
  CHECK (jsonb_typeof(launch_sections) = 'array');

-- The operating sheet names three lower Niederbauen sections. Its wind labels
-- are kept as published compass names rather than invented degree ranges.
-- The current club list supports the North and South-West parts of the broad
-- station-side launch; it does not include South-East, which stays explicitly
-- historical until a current local source resolves that discrepancy.
UPDATE sites SET launch_sections = jsonb_build_array(
  jsonb_build_object(
    'id', 'north',
    'name', 'North',
    'evidenceStatus', 'current',
    'description', 'Large, straightforward section beside the mountain-station hotel.',
    'windDirections', jsonb_build_object('preferred', jsonb_build_array('N'), 'acceptable', '[]'::jsonb),
    'cautions', jsonb_build_array('After snowfall or in wet snow, avalanche risk is expected. If a northward launch is necessary, the school directs pilots to the flatter terrain to the east.'),
    'evidenceNote', 'Current local guidance still names the north launch and its winter avalanche exposure.',
    'source', jsonb_build_object(
      'label', 'Gleitschirm-Flugschule Emmetten · operating information',
      'url', 'https://www.flugschule-emmetten.ch/diverses/fluggebiete-2/emmetten/',
      'reviewedAt', '2026-08-30'
    )
  ),
  jsonb_build_object(
    'id', 'southwest',
    'name', 'South-West',
    'evidenceStatus', 'corroborated',
    'description', 'Flat setup area that steepens after the launch run; the operating sheet directs pilots to continue along the ridge after take-off.',
    'windDirections', jsonb_build_object('preferred', jsonb_build_array('SW'), 'acceptable', jsonb_build_array('S')),
    'cautions', jsonb_build_array('Follow the ridge flight path stated in the operating sheet after take-off.'),
    'evidenceNote', 'The current local club direction list includes S and SW for the shared lower launch area.',
    'source', jsonb_build_object(
      'label', 'Gleitschirm-Flugschule Emmetten · Infos für Gleitschirmflieger (2016)',
      'url', 'https://s54574195ad4eeed4.jimcontent.com/download/version/1480786647/module/8964727885/name/Infos%20fuer%20Gleitschirmflieger%20Emmetten%202016.pdf',
      'reviewedAt', '2026-08-30'
    )
  ),
  jsonb_build_object(
    'id', 'southeast',
    'name', 'South-East',
    'evidenceStatus', 'historical',
    'description', 'Easy named section; the operating sheet says to turn right immediately after take-off and then follow the South-West flight path.',
    'windDirections', jsonb_build_object('preferred', jsonb_build_array('SE'), 'acceptable', '[]'::jsonb),
    'cautions', jsonb_build_array('The 2016 operating sheet says this section is straightforward up to 20 km/h, with caution above that. The current club overview does not list SE among its lower-launch directions.'),
    'evidenceNote', 'Historical detailed guidance only. Confirm current availability and wind suitability with local pilots or the school before relying on it.',
    'source', jsonb_build_object(
      'label', 'Gleitschirm-Flugschule Emmetten · Infos für Gleitschirmflieger (2016)',
      'url', 'https://s54574195ad4eeed4.jimcontent.com/download/version/1480786647/module/8964727885/name/Infos%20fuer%20Gleitschirmflieger%20Emmetten%202016.pdf',
      'reviewedAt', '2026-08-30'
    )
  )
)
WHERE slug = 'niederbauen-emmetten' AND kind = 'launch';

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT id, 'flugschule-emmetten', confirms,
       'Gleitschirm-Flugschule Emmetten · operating information',
       'https://www.flugschule-emmetten.ch/diverses/fluggebiete-2/emmetten/',
       DATE '2026-08-30'
  FROM sites
 CROSS JOIN (VALUES ('description'), ('wind'), ('hazards')) AS source(confirms)
 WHERE slug = 'niederbauen-emmetten' AND kind = 'launch'
ON CONFLICT (site_id, provider_code, confirms) DO UPDATE
  SET label = EXCLUDED.label, url = EXCLUDED.url, retrieved_at = EXCLUDED.retrieved_at;

COMMIT;
