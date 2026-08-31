BEGIN;

-- Third and, with a local-club source, final correction to Niederbauen.
--
-- Alpingliders Emmetten, the club whose home site this is, describes ONE launch
-- "direkt neben der Bergstation" at 1570 m: a "sehr einfaches Fluggebiet" with
-- a large, progressively steepening slope, working in S, SW, NW, N and NO, with
-- a light thermal north-westerly in summer giving ideal launch conditions.
--
-- That reconciles every earlier reading. Paragliding365's "every wind direction
-- is possible" is a loose gloss on a launch that genuinely takes five of the
-- eight compass points; the flight school's "Nordstartplatz" and
-- "Südstartplatz" name ends of that same broad slope rather than separate
-- sites; and the SE/SW sentence was avalanche guidance all along.
--
-- The launch does NOT work in E or SE. The earlier 360 degree band asserted
-- exactly the sector this one omits.
--
-- Chulm remains a genuinely separate launch, governed by its own status board.

UPDATE sites SET
  elevation_m = 1570,
  launch_directions = ARRAY['NW','N','NE','S','SW'],
  difficulty = 'easy',
  source_label = 'Alpingliders Emmetten · Gleitschirm-Flugschule Emmetten',
  source_url = 'https://www.alpingliders-emmetten.ch/fluggebiet/',
  source_kind = 'club', reviewed_at = DATE '2026-08-29'
 WHERE slug LIKE 'niederbauen%' AND kind = 'launch';

DELETE FROM site_wind_windows
 WHERE site_id IN (SELECT id FROM sites WHERE slug LIKE 'niederbauen%' AND kind='launch');

INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
SELECT s.id, v.f, v.t, v.q, 'alpingliders'
  FROM sites s CROSS JOIN (VALUES
    -- Light thermal north-westerly in summer: the ideal launch condition.
    (292.5, 337.5, 'preferred'),
    -- The five directions the club lists: NW, N, NE, S, SW. East and south-east
    -- are deliberately absent; the slope does not face that way.
    (292.5, 360.0, 'acceptable'),
    (0.0,    67.5, 'acceptable'),
    (157.5, 247.5, 'acceptable')
  ) AS v(f,t,q)
 WHERE s.slug LIKE 'niederbauen%' AND s.kind='launch'
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

UPDATE site_translations SET
  summary = 'One large, easy launch directly beside the Niederbauen mountain station at about 1570 m, on a broad slope that steepens continuously. It works in south, south-west, north-west, north and north-east winds, and a light thermal north-westerly in summer gives the ideal conditions. The Chulm higher up is a separate launch with its own status board.',
  terrain = 'A single very large launch slope beside the mountain station, steepening progressively towards Lake Lucerne. The north end is the steeper part and suits summer afternoon thermals; the south end is gentler and is the usual winter morning choice.',
  known_for = ARRAY['Very easy site','Large launch beside the station','Cable-car served','Works in five wind directions']
 WHERE locale='en' AND site_id IN (SELECT id FROM sites WHERE slug LIKE 'niederbauen%' AND kind='launch');

UPDATE site_translations SET
  summary = 'Ein grosser, einfacher Startplatz direkt neben der Bergstation Niederbauen auf rund 1570 m, auf einem breiten, stetig steiler werdenden Hang. Er funktioniert bei Süd-, Südwest-, Nordwest-, Nord- und Nordostwind; im Sommer sorgt ein leichter thermischer Nordwestwind für ideale Startbedingungen. Der Chulm weiter oben ist ein eigener Startplatz mit eigener Statustafel.',
  terrain = 'Ein einziger, sehr grosser Startplatz neben der Bergstation, stetig steiler werdend Richtung Vierwaldstättersee. Der nördliche Teil ist steiler und passt zur Sommerthermik am Nachmittag, der südliche Teil ist flacher und die übliche Wahl an Wintervormittagen.',
  known_for = ARRAY['Sehr einfaches Fluggebiet','Grosser Startplatz neben der Bergstation','Mit Luftseilbahn erreichbar','Fünf Windrichtungen']
 WHERE locale='de' AND site_id IN (SELECT id FROM sites WHERE slug LIKE 'niederbauen%' AND kind='launch');

-- Replace the caution that asserted separate launches.
UPDATE site_translations SET
  cautions = ARRAY[
    'One large launch with a steeper north end and a gentler south end. The Chulm above is separate: if its board reads "geschlossen", launching there is forbidden.',
    'Does not work in easterly or south-easterly wind. The slope does not face that way.',
    'Föhn or Föhn tendency: do not fly. The sheltering that makes the other directions workable does not apply.',
    'North end: avalanche risk after snowfall and in wet snow. If launching northwards is necessary, use the flatter ground to the east.',
    'Transport cable near Alp Tritt towards Chulm: fly well below the white cross that marks it.',
    'Triple high-voltage lines across the Choltal at roughly Niederbauen cable-car height.',
    'Lines along the Hammen ridge south of the village. Soaring that edge is discouraged.',
    'CTR Buochs begins immediately west of the village. Flights towards Beckenried need radio contact with TWR Buochs on 119.62 for the whole flight; a phone call beforehand is not sufficient. Normally active weekdays 07:15-12:05 and 13:15-17:05.',
    'Berggrind landing: left-hand circuit in westerly or calm wind, right-hand in easterly. Land above the wooden fence.',
    'The old landing at Restaurant Schlüssel is no longer authorised. The current Emmetten landing has been in use since 2016.',
    'Gruob landing: westerly wind only, right-hand circuit. Turbulence and sink in stronger valley wind; avoid the lee behind the barn.',
    'No vehicles on the landing fields. Collapse the wing immediately on landing. No camping or grilling, dogs on a lead.'
  ]
 WHERE locale='en' AND site_id IN (SELECT id FROM sites WHERE slug LIKE 'niederbauen%' AND kind='launch');

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, authority, observed_on)
SELECT s.id, 'alpingliders', v.kind, v.body, 'en', 'Alpingliders Emmetten',
       'https://www.alpingliders-emmetten.ch/fluggebiet/', 'club', v.obs::date
  FROM sites s CROSS JOIN (VALUES
   ('observation','A very easy flying area. The launch sits directly beside the mountain station on a large, progressively steepening slope, and works in S, SW, NW, N and NO.', NULL),
   ('conditions','In summer there is typically a light thermal north-westerly, which gives ideal launch conditions. The sheltered position means moderate to strong winds are workable year round, apart from Föhn or Föhn tendency.', NULL),
   ('access','The landing area in use today was established in 2016. The former landing at Restaurant Schlüssel is no longer authorised.', '2016-01-01'),
   ('etiquette','The landing sits next to the Emmetten school sports ground. The seasonal Gadenbeiz beside it is open April to September.', NULL)
  ) AS v(kind, body, obs)
 WHERE s.slug LIKE 'niederbauen%' AND s.kind='launch'
ON CONFLICT DO NOTHING;

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT s.id,'alpingliders',c.confirms,'Alpingliders Emmetten',
       'https://www.alpingliders-emmetten.ch/fluggebiet/', DATE '2026-08-29'
  FROM sites s CROSS JOIN (VALUES ('description'),('wind'),('access')) AS c(confirms)
 WHERE s.slug LIKE 'niederbauen%' AND s.kind='launch'
ON CONFLICT (site_id, provider_code, confirms) DO NOTHING;

COMMIT;
