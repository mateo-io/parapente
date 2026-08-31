BEGIN;

-- Wind and pilot knowledge for the Nidwalden valley launches, from sources that
-- ENUMERATE launches rather than describe a site in prose. That distinction is
-- the lesson from Niederbauen, which was got wrong three times by turning
-- narrative guidance into structured data.
--
-- ens.ch publishes per-launch wind bearings in degrees with GPS coordinates,
-- which is exactly the shape needed. Its robots.txt permits these pages.
-- Cross-checked against ParaglidingEarth's per-direction ratings where both
-- carry the same site.

INSERT INTO providers (code, name, homepage_url, redistribution, licence, notes)
VALUES ('ens-ch','ens.ch Gleitschirm GPS','https://ens.ch/ens/gleitschirm/gps/schweiz/','restricted','Site terms',
        'Long-running Swiss launch and landing database. Publishes per-launch wind bearings in degrees with GPS coordinates.')
ON CONFLICT (code) DO NOTHING;

-- Stanserhorn is two launches, confirmed independently: ens.ch gives bearings
-- 0 and 170 degrees, and the records already held sit at the matching points.
--   Südstartplatz - 3 minutes below the restaurant, very steep, with a cable.
--   Rinderalp     - about 20 minutes on foot, less steep but partly uneven.
INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
SELECT s.id, v.f, v.t, v.q, 'ens-ch'
  FROM sites s CROSS JOIN (VALUES (147.5, 192.5, 'preferred')) AS v(f,t,q)
 WHERE s.slug LIKE 'stanserhorn%' AND s.kind='launch'
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
SELECT s.id, v.f, v.t, v.q, 'ens-ch'
  FROM sites s CROSS JOIN (VALUES (337.5,360.0,'preferred'),(0.0,22.5,'preferred')) AS v(f,t,q)
 WHERE s.slug LIKE 'rinderalp%' AND s.kind='launch'
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

-- Wirzweli-Horn 345 degrees; Gummen 195; Musenalp 300.
INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
SELECT s.id, 322.5, 360.0, 'preferred', 'ens-ch' FROM sites s
 WHERE s.slug LIKE 'wirzweli-horn%' AND s.kind='launch'
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;
INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
SELECT s.id, 0.0, 7.5, 'preferred', 'ens-ch' FROM sites s
 WHERE s.slug LIKE 'wirzweli-horn%' AND s.kind='launch'
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
SELECT s.id, 172.5, 217.5, 'preferred', 'ens-ch' FROM sites s
 WHERE s.slug LIKE 'gummen%' AND s.kind='launch'
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
SELECT s.id, 277.5, 322.5, 'preferred', 'ens-ch' FROM sites s
 WHERE s.slug LIKE 'musenalp%' AND s.kind='launch'
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

-- Wirzweli main launch faces north, directly beside the mountain station.
INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
SELECT s.id, v.f, v.t, 'preferred','paraglidingearth'
  FROM sites s CROSS JOIN (VALUES (337.5,360.0),(0.0,22.5)) AS v(f,t)
 WHERE s.slug = 'wirzweli' AND s.kind='launch'
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, authority)
SELECT s.id,'ens-ch',v.kind,v.body,'en','ens.ch Gleitschirm GPS',
       'https://ens.ch/ens/gleitschirm/gps/schweiz/stanserhorn/index.html','community'
  FROM sites s CROSS JOIN (VALUES
   ('observation','South launch: three minutes below the restaurant. Very steep, with a cable.'),
   ('access','North launch at Rinderalp: about twenty minutes on foot. Less steep but partly uneven.')
  ) AS v(kind, body)
 WHERE s.slug LIKE 'stanserhorn%' AND s.kind='launch'
ON CONFLICT DO NOTHING;

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, authority)
SELECT s.id,'ens-ch','etiquette',
 'Land only on mown grass. There is a windsock for guidance.',
 'en','ens.ch Gleitschirm GPS','https://ens.ch/ens/gleitschirm/gps/schweiz/stanserhorn/index.html','community'
  FROM sites s WHERE s.kind='landing' AND s.latitude BETWEEN 46.955 AND 46.962
   AND s.longitude BETWEEN 8.350 AND 8.360
ON CONFLICT DO NOTHING;

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, authority)
SELECT s.id,'paragliding365','observation',
 'Wirzweli and Gummen together offer four launches for paragliders and hang gliders. The north-facing launch sits directly beside the Wirzweli mountain station, and a small cable car at the edge of Wirzweli leads up to Gummen. If the wind is already northerly you can save the remaining climb and soar up to Gummen.',
 'en','Paragliding365','https://www.paragliding365.com/index-p-flightarea_details_6172.html','community'
  FROM sites s WHERE s.slug IN ('wirzweli') AND s.kind='launch'
ON CONFLICT DO NOTHING;

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT s.id,'ens-ch','wind','ens.ch Gleitschirm GPS','https://ens.ch/ens/gleitschirm/gps/schweiz/', DATE '2026-08-29'
  FROM sites s
 WHERE s.kind='launch' AND (s.slug LIKE 'stanserhorn%' OR s.slug LIKE 'rinderalp%'
    OR s.slug LIKE 'wirzweli-horn%' OR s.slug LIKE 'gummen%' OR s.slug LIKE 'musenalp%')
ON CONFLICT (site_id, provider_code, confirms) DO NOTHING;

COMMIT;
