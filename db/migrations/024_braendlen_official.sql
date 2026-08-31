BEGIN;

-- "Informationen für Gleitschirmflieger" for the Wolfenschiessen area
-- (Brändlen / Haldigrat / Gummen), the rules sheet the site itself publishes.
-- This is an operator document, not a community write-up, so it settles both
-- the launch descriptions and which ground is an authorised landing.

INSERT INTO providers (code, name, homepage_url, redistribution, licence, notes)
VALUES ('fluggebiet-wolfenschiessen','Fluggebiet Wolfenschiessen-Brändlen',NULL,'restricted','Site terms',
        'Publishes the official pilot rules sheet for Brändlen, Haldigrat and Gummen.')
ON CONFLICT (code) DO NOTHING;

-- Brändlen launches, now with published bearings implied by the sheet: NW and S.
DELETE FROM site_wind_windows
 WHERE site_id IN (SELECT id FROM sites WHERE slug='brandlen-126134046-launch');

INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
SELECT id, v.f, v.t, v.q, 'fluggebiet-wolfenschiessen'
  FROM sites CROSS JOIN (VALUES
    (292.5, 337.5, 'preferred'),   -- Brändlen NW
    (157.5, 202.5, 'preferred'),   -- Brändlen S, October to March
    (270.0, 360.0, 'acceptable'),
    (135.0, 225.0, 'acceptable')
  ) AS v(f,t,q)
 WHERE slug = 'brandlen-126134046-launch'
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

DELETE FROM site_reports
 WHERE site_id IN (SELECT id FROM sites WHERE slug='brandlen-126134046-launch');

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, authority)
SELECT id,'fluggebiet-wolfenschiessen',v.kind,v.body,'en','Fluggebiet Wolfenschiessen-Brändlen, pilot information sheet',
 'https://s54574195ad4eeed4.jimcontent.com/download/version/1480787872/module/8964729085/name/Infos%20fuer%20Gleitschirmflieger%20Braendlen.pdf','operator'
  FROM sites CROSS JOIN (VALUES
   ('observation','Launch Brändlen NW: ten minutes north above the cable-car station, a small medium-steep to steep meadow. In strong valley wind it is often hit from the side.'),
   ('observation','Launch Brändlen S: ten minutes east above the cable-car station, a medium-steep meadow. Usable only from October to March, or whenever the windsock is mounted at the launch.'),
   ('conditions','The steeper north launch suits summer afternoons for good thermal flights. The south launch is the usual winter morning choice.'),
   ('etiquette','Ground-handling practice is prohibited all year.'),
   ('etiquette','Pack up at the Faltplatz uphill of the landing, across the bridge over the stream. Never fold the wing on the landing field itself.'),
   ('etiquette','Leave the landing only by the forest path to the lift. Walking directly towards the road or the flight shop is strictly forbidden.'),
   ('etiquette','No camping. Take litter and cigarette ends with you, dogs on a lead. The landowners are well disposed towards the sport; keep it that way.'),
   ('hazard','Only the cable-car line is close to the landing, but the Engelbergertal carries very many cables and temporary ones can be put up.'),
   ('hazard','Brändlen, Gummen and Haldigrat all lie OUTSIDE the CTR. As soon as you fly north across the line Buochserhorn to Stanserhorn you are inside CTR Buochs. Check the separate notice boards before a cross-country flight.'),
   ('access','A small but active acro scene uses Brändlen. The cable car runs year round from Wolfenschiessen to the Bio-Bergbauernhof Brändlen at 1200 m.')
  ) AS v(kind, body)
 WHERE slug = 'brandlen-126134046-launch'
ON CONFLICT DO NOTHING;

-- The Wolfenschiessen landing, with the sheet's own colour scheme made explicit:
-- green is the authorised year-round field, white the winter-only extension,
-- red is an outright landing ban.
UPDATE sites SET
  landing_role = 'official', data_status = 'reviewed',
  source_label = 'Fluggebiet Wolfenschiessen-Brändlen, pilot information sheet',
  source_url = 'https://s54574195ad4eeed4.jimcontent.com/download/version/1480787872/module/8964729085/name/Infos%20fuer%20Gleitschirmflieger%20Braendlen.pdf',
  source_kind = 'operator', reviewed_at = DATE '2026-08-29'
 WHERE slug LIKE 'wolfenschiessen-grossitz%' OR slug LIKE 'wolfenschiessen-schutzenhaus%'
    OR slug LIKE 'wolfenschiessen-sch%';

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, authority)
SELECT id,'fluggebiet-wolfenschiessen',v.kind,v.body,'en','Fluggebiet Wolfenschiessen-Brändlen, pilot information sheet',
 'https://s54574195ad4eeed4.jimcontent.com/download/version/1480787872/module/8964729085/name/Infos%20fuer%20Gleitschirmflieger%20Braendlen.pdf','operator'
  FROM sites CROSS JOIN (VALUES
   ('access','An authorised landing, usable all year by licensed pilots. It is occasionally used for training.'),
   ('hazard','Land only between the two fences, in the quarter nearest the stream. Landing near the road or by the cable car is not permitted.'),
   ('conditions','Circuit: left-hand in north wind (valley wind) or calm, right-hand in south wind (mountain wind). The valley wind can become very strong in spring and summer.'),
   ('conditions','The winter landing area may be used only from 1 November to 28 February, regardless of snow cover.')
  ) AS v(kind, body)
 WHERE slug LIKE 'wolfenschiessen-grossitz%'
ON CONFLICT DO NOTHING;

-- The sheet also states the working direction of neighbouring areas.
INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, authority)
SELECT s.id,'fluggebiet-wolfenschiessen','conditions', v.body,'en',
 'Fluggebiet Wolfenschiessen-Brändlen, pilot information sheet',
 'https://s54574195ad4eeed4.jimcontent.com/download/version/1480787872/module/8964729085/name/Infos%20fuer%20Gleitschirmflieger%20Braendlen.pdf','operator'
  FROM sites s JOIN (VALUES
   ('stanserhorn','Stans-Stanserhorn works on north wind. Ideal in Bise and in the evening. Observe the CTR regulation.'),
   ('bielen','Wolfenschiessen-Büelen works on east wind. A good morning and thermal area, and the local examination site.')
  ) AS v(slug_like, body) ON s.slug LIKE v.slug_like || '%'
 WHERE s.kind='launch'
ON CONFLICT DO NOTHING;

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT s.id,'fluggebiet-wolfenschiessen',c.confirms,'Fluggebiet Wolfenschiessen pilot information sheet',
 'https://s54574195ad4eeed4.jimcontent.com/download/version/1480787872/module/8964729085/name/Infos%20fuer%20Gleitschirmflieger%20Braendlen.pdf', DATE '2026-08-29'
  FROM sites s CROSS JOIN (VALUES ('description'),('wind'),('hazards'),('access')) AS c(confirms)
 WHERE s.slug = 'brandlen-126134046-launch' OR s.slug LIKE 'wolfenschiessen-grossitz%'
ON CONFLICT (site_id, provider_code, confirms) DO NOTHING;

-- Airspace fact worth holding structurally, not only in prose.
INSERT INTO site_restrictions (site_id, kind, description, contact, authority, source_url)
SELECT id,'airspace',
 'Brändlen, Gummen and Haldigrat lie outside CTR Buochs. Crossing north over the line Buochserhorn to Stanserhorn puts you inside it.',
 '119.62','Skyguide / Buochs',
 'https://s54574195ad4eeed4.jimcontent.com/download/version/1480787872/module/8964729085/name/Infos%20fuer%20Gleitschirmflieger%20Braendlen.pdf'
  FROM sites WHERE slug = 'brandlen-126134046-launch'
ON CONFLICT DO NOTHING;

COMMIT;
