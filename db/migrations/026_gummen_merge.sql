BEGIN;

-- The two Gummen records are one launch.
--
-- Evidence for a single point:
--   OpenStreetMap way 126134047  46.90265, 8.36590, tagged orientation S
--   ens.ch "Gummen (beim Kreuz)" 46.9027,  8.3658,  bearing 195 degrees
--   ParaglidingEarth             46.90190, 8.36259, rated SE
-- The first two agree to within about 15 m and independently give a southerly
-- orientation. ParaglidingEarth sits 263 m away, carries no description, and is
-- its own only Gummen entry. No source anywhere describes two Gummen launches.
--
-- So this is one launch recorded imprecisely by a community contributor, not
-- two sites. The corroborated OpenStreetMap point is kept as canonical and the
-- ParaglidingEarth record is folded in as a third source rather than deleted
-- outright, so its contribution stays visible.

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT k.id, 'paraglidingearth', c.confirms, 'ParaglidingEarth (merged duplicate record)',
       'https://www.paraglidingearth.com/', CURRENT_DATE
  FROM sites k CROSS JOIN (VALUES ('location'),('wind')) AS c(confirms)
 WHERE k.slug = 'gummen-126134047-launch'
ON CONFLICT (site_id, provider_code, confirms) DO NOTHING;

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, authority)
SELECT id,'ens-ch','observation',
 'Known as "Gummen (beim Kreuz)". Reached by the small cable car from the edge of Wirzweli. In a northerly you can skip the remaining climb and soar up from Wirzweli instead.',
 'en','ens.ch Gleitschirm GPS and Paragliding365','https://ens.ch/ens/gleitschirm/gps/schweiz/','community'
  FROM sites WHERE slug = 'gummen-126134047-launch'
ON CONFLICT DO NOTHING;

-- Sources give S, SSW and SE. Keep the corroborated S/SSW as preferred and let
-- the acceptable band span the spread rather than picking one contributor.
DELETE FROM site_wind_windows
 WHERE site_id IN (SELECT id FROM sites WHERE slug IN ('gummen-126134047-launch','gummen-pge'));

INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
SELECT id, v.f, v.t, v.q, 'ens-ch'
  FROM sites CROSS JOIN (VALUES
    (172.5, 202.5, 'preferred'),
    (135.0, 225.0, 'acceptable')
  ) AS v(f,t,q)
 WHERE slug = 'gummen-126134047-launch'
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

DELETE FROM sites WHERE slug = 'gummen-pge';

COMMIT;
