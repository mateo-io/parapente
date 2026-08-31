BEGIN;

-- Correcting a correction. Niederbauen was first stored with a 360 degree
-- acceptable band, then rewritten as three launches facing N, SE and SW. Both
-- were wrong.
--
-- The SE/SW reading came from misreading the flight school's WINTER AVALANCHE
-- guidance as a launch inventory. The German is: "Falls nach Norden gestartet
-- werden muss, soll dies im flacheren Gelände (östlich) erfolgen! Die
-- Startplätze SE und SW sind in der Regel weniger problematisch." That is a
-- statement about which aspects carry less avalanche risk, not a list of the
-- launches at this site.
--
-- What the sources actually agree on:
--   Nordstartplatz - the steeper north launch, good for thermals on summer
--     afternoons, carrying avalanche risk after snowfall and in wet snow.
--   Südstartplatz  - the gentler south launch, often used on winter mornings.
--   Chulm          - a separate launch on the Niederbauen-Chulm summit with its
--                    own open/closed status board; starting is forbidden when
--                    the board reads closed.
-- ParaglidingEarth records a single large north launch a few steps from the
-- gondola, which matches the Nordstartplatz.

DELETE FROM site_wind_windows
 WHERE site_id IN (SELECT id FROM sites WHERE slug LIKE 'niederbauen%' AND kind='launch');

INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
SELECT s.id, v.f, v.t, v.q, 'flugschule-emmetten'
  FROM sites s CROSS JOIN (VALUES
    (337.5, 360.0, 'preferred'),   -- Nordstartplatz
    (0.0,    22.5, 'preferred'),
    (157.5, 202.5, 'preferred'),   -- Südstartplatz
    (292.5, 360.0, 'acceptable'),
    (0.0,    67.5, 'acceptable'),
    (135.0, 225.0, 'acceptable')
  ) AS v(f,t,q)
 WHERE s.slug LIKE 'niederbauen%' AND s.kind='launch'
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

UPDATE site_translations SET
  summary = 'A large, easy ridge site above Emmetten with a north and a south launch. The north launch is steeper and works for thermals on summer afternoons; the south launch is gentler and is the usual choice on winter mornings. The separate Chulm launch higher up has its own open or closed status board.',
  cautions = ARRAY[
    'Two launches with opposite aspects, plus the separate Chulm. Check which is open before going up.',
    'Chulm: starting is forbidden whenever the board at the launch reads closed. The school publishes the current status.',
    'North launch: avalanche risk after snowfall and in wet snow. If a northerly launch is necessary, use the flatter terrain to the east.',
    'Föhn or Föhn tendency: do not fly. The sheltering that makes other directions workable does not apply.',
    'Transport cable near Alp Tritt towards Chulm: fly well below the white cross that marks it.',
    'Triple high-voltage lines across the Choltal at roughly Niederbauen cable-car height.',
    'Lines along the Hammen ridge south of the village. Soaring that edge is discouraged.',
    'CTR Buochs begins immediately west of the village. Flights towards Beckenried need radio contact with TWR Buochs on 119.62 for the whole flight; a phone call beforehand is not sufficient. Normally active weekdays 07:15-12:05 and 13:15-17:05.',
    'Berggrind landing: left-hand circuit in westerly or calm wind, right-hand in easterly. Land above the wooden fence; the old Schlüssel area below is for emergencies only.',
    'Gruob landing: westerly wind only, right-hand circuit. Expect turbulence and sink in stronger valley wind and avoid the lee behind the barn.',
    'No vehicles on the landing fields. Collapse the wing immediately on landing. No camping or grilling, dogs on a lead.'
  ]
 WHERE locale='en' AND site_id IN (SELECT id FROM sites WHERE slug LIKE 'niederbauen%' AND kind='launch');

UPDATE site_translations SET
  summary = 'Grosses, einfaches Fluggebiet über Emmetten mit einem Nord- und einem Südstartplatz. Der Nordstartplatz ist steiler und funktioniert bei Sommerthermik am Nachmittag; der Südstartplatz ist flacher und die übliche Wahl an Wintervormittagen. Der separate Chulm weiter oben hat eine eigene Statustafel.',
  cautions = ARRAY[
    'Zwei Startplätze mit gegensätzlicher Ausrichtung, dazu der separate Chulm. Vor der Auffahrt prüfen, welcher offen ist.',
    'Chulm: Steht auf der Tafel "geschlossen", ist ein Start verboten. Die Flugschule publiziert den aktuellen Status.',
    'Nordstartplatz: Lawinengefahr nach Schneefall und bei Nassschnee. Wenn nordseitig gestartet werden muss, das flachere Gelände östlich benutzen.',
    'Föhn oder Föhntendenz: nicht fliegen. Die schützende Lage wirkt dann nicht.',
    'Transportseil bei Alp Tritt Richtung Chulm: deutlich unter dem weissen Kreuz durchfliegen.',
    'Dreifache Hochspannungsleitung über das Choltal auf etwa Höhe der Niederbauen-Bahn.',
    'Leitungen entlang dem Hammen südlich des Dorfes. Soaring an dieser Kante wird nicht empfohlen.',
    'Die CTR Buochs beginnt direkt westlich des Dorfes. Für Flüge Richtung Beckenried ist während des ganzen Fluges Funkkontakt mit TWR Buochs auf 119.62 nötig. Werktags normalerweise 07:15-12:05 und 13:15-17:05 aktiv.',
    'Landeplatz Berggrind: bei Westwind oder Windstille Linksvolte, bei Ostwind Rechtsvolte. Oberhalb des Holzzauns landen; der alte Schlüssel darunter nur im Notfall.',
    'Landeplatz Gruob: nur bei Westwind, Rechtsvolte. Bei stärkerem Talwind Turbulenz und Sinken, Lee hinter dem Stall meiden.',
    'Keine Fahrzeuge auf den Landeplätzen. Schirm sofort zusammenlegen. Kein Campieren oder Grillieren, Hunde an die Leine.'
  ]
 WHERE locale='de' AND site_id IN (SELECT id FROM sites WHERE slug LIKE 'niederbauen%' AND kind='launch');

-- Pilot knowledge, kept as written by its source.
INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, authority)
SELECT s.id, v.provider, v.kind, v.body, 'en', v.attrib, v.url, v.auth
  FROM sites s CROSS JOIN (VALUES
   ('flugschule-emmetten','conditions',
    'The ideal southern launch is often used on winter mornings, while the steeper northern launch suits good thermals on summer afternoons.',
    'Gleitschirm-Flugschule Emmetten','https://www.flugschule-emmetten.ch/diverses/fluggebiete-2/emmetten/','school'),
   ('paraglidingearth','observation',
    'Huge take-off; just a few steps from the gondola and restaurant.',
    'ParaglidingEarth contributors','https://www.paraglidingearth.com/','community'),
   ('paragliding365','conditions',
    'A very easy flying area with a very large, continuously steepening launch. Apart from Föhn or Föhn tendency, every wind direction is possible even in moderate to strong winds thanks to the sheltered position.',
    'Paragliding365','https://www.paragliding365.com/index-p-flightarea_details_87.html','community'),
   ('flugschule-emmetten','hazard',
    'In winter the north launch must account for avalanches after snowfall and in wet snow.',
    'Gleitschirm-Flugschule Emmetten','https://www.flugschule-emmetten.ch/diverses/fluggebiete-2/emmetten/','school'),
   ('flugschule-emmetten','etiquette',
    'If the board reads "geschlossen" on the way up, launching from the Chulm is forbidden.',
    'Gleitschirm-Flugschule Emmetten','https://www.flugschule-emmetten.ch/diverses/fluggebiete-2/emmetten/','school')
  ) AS v(provider, kind, body, attrib, url, auth)
 WHERE s.slug LIKE 'niederbauen%' AND s.kind='launch'
ON CONFLICT DO NOTHING;

INSERT INTO site_reports (site_id, provider_code, kind, body, locale, attribution, source_url, authority)
SELECT s.id,'paraglidingearth','observation',
 'Easy large sloping grassy takeoff right next to the large white cross on the summit. Can handle S to W winds.',
 'en','ParaglidingEarth contributors','https://www.paraglidingearth.com/','community'
  FROM sites s WHERE s.slug LIKE 'buochserhorn%'
ON CONFLICT DO NOTHING;

COMMIT;
