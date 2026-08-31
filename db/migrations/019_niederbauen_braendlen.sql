BEGIN;

-- Correcting a misleading wind model. Paragliding365 states that every wind
-- direction is possible at Niederbauen; that is a statement about the SITE,
-- which has separate north, south-east, south-west and Chulm launches. It was
-- stored as a single launch with a 360 degree acceptable band, which tells a
-- pilot that one launch works in any wind. It does not. The bands below are the
-- three documented launch orientations, and the multi-launch nature is stated
-- explicitly rather than being flattened into one arc.
--
-- Source: Gleitschirm-Flugschule Emmetten, the local school, which is
-- authoritative for its own site's operations.

DELETE FROM site_wind_windows
 WHERE site_id IN (SELECT id FROM sites WHERE slug LIKE 'niederbauen%' AND kind='launch');

INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
SELECT s.id, v.f, v.t, v.q, 'flugschule-emmetten'
  FROM sites s CROSS JOIN (VALUES
    -- South-east and south-west launches: least problematic year round.
    (112.5, 157.5, 'preferred'),
    (202.5, 247.5, 'preferred'),
    (112.5, 247.5, 'acceptable'),
    -- North launch: usable, but carries the winter avalanche caveat.
    (337.5, 360.0, 'acceptable'),
    (0.0,    22.5, 'acceptable')
  ) AS v(f,t,q)
 WHERE s.slug LIKE 'niederbauen%' AND s.kind='launch'
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

UPDATE sites SET
  elevation_m = 1600, difficulty = 'easy',
  wing_types = ARRAY['paraglider','hangglider'],
  source_label = 'Gleitschirm-Flugschule Emmetten',
  source_url = 'https://www.flugschule-emmetten.ch/diverses/fluggebiete-2/emmetten/',
  source_kind = 'flight_school', reviewed_at = DATE '2026-08-29'
 WHERE slug LIKE 'niederbauen%' AND kind='launch';

UPDATE site_translations SET
  summary = 'A large ridge site above Emmetten with separate north, south-east and south-west launches plus the higher Chulm. The south-east and south-west launches are the least problematic year round; the north face carries avalanche risk after snowfall.',
  terrain = 'Broad, continuously steepening meadow launches facing Lake Lucerne. Launch about 1600 m, main landing Berggrind about 800 m. Several orientations exist, so check the status board for which launch is open before going up.',
  access_detail = 'Cable car from Emmetten valley station. The Chulm launch has seasonal restrictions tied to alpine grazing.',
  known_for = ARRAY['Multiple launch orientations','Cable-car served','School and passenger flying'],
  cautions = ARRAY[
    'This is several launches, not one launch that works in every wind. Check which is open before going up.',
    'North face: avalanche risk after snowfall and in wet snow. If a northerly launch is necessary use the gentler eastern terrain.',
    'Transport cable near Alp Tritt towards Chulm: fly well below the white cross that marks it.',
    'Triple high-voltage lines across the Choltal at roughly Niederbauen cable-car height.',
    'Lines along the Hammen ridge south of the village. Soaring that edge is discouraged.',
    'CTR Buochs begins immediately west of the village. Flights towards Beckenried need radio contact with TWR Buochs on 119.62 for the whole flight; a phone call beforehand is not sufficient. The CTR is normally active weekdays 07:15-12:05 and 13:15-17:05.',
    'Berggrind landing: left-hand circuit in westerly or calm wind, right-hand in easterly. Land above the wooden fence; the old Schlüssel area below is for emergencies only.',
    'Gruob landing: westerly wind only, right-hand circuit. Expect turbulence and sink in stronger valley wind and avoid the lee behind the barn.',
    'No vehicles on the landing fields. Park at the cable-car lot, the main village lot or the garage.',
    'Collapse the wing immediately on landing. No camping or grilling, dogs on a lead.'
  ]
 WHERE locale='en' AND site_id IN (SELECT id FROM sites WHERE slug LIKE 'niederbauen%' AND kind='launch');

UPDATE site_translations SET
  summary = 'Grosses Fluggebiet über Emmetten mit getrennten Nord-, Südost- und Südwest-Startplätzen sowie dem höheren Chulm. Südost und Südwest sind ganzjährig am problemlosesten; die Nordseite hat nach Schneefall Lawinengefahr.',
  terrain = 'Breite, stetig steiler werdende Wiesenstartplätze zum Vierwaldstättersee. Start rund 1600 m, Hauptlandeplatz Berggrind rund 800 m. Mehrere Ausrichtungen: vor der Auffahrt die Statustafel prüfen.',
  access_detail = 'Luftseilbahn ab Talstation Emmetten. Der Chulm-Startplatz ist wegen der Alpbewirtschaftung saisonal eingeschränkt.',
  known_for = ARRAY['Mehrere Startrichtungen','Mit Luftseilbahn erreichbar','Schul- und Passagierflüge'],
  cautions = ARRAY[
    'Es sind mehrere Startplätze, nicht ein Startplatz für jeden Wind. Vor der Auffahrt prüfen, welcher offen ist.',
    'Nordseite: Lawinengefahr nach Schneefall und bei Nassschnee. Wenn nordseitig gestartet werden muss, das flachere Gelände östlich benutzen.',
    'Transportseil bei Alp Tritt Richtung Chulm: deutlich unter dem weissen Kreuz durchfliegen.',
    'Dreifache Hochspannungsleitung über das Choltal auf etwa Höhe der Niederbauen-Bahn.',
    'Leitungen entlang dem Hammen südlich des Dorfes. Soaring an dieser Kante wird nicht empfohlen.',
    'Die CTR Buochs beginnt direkt westlich des Dorfes. Für Flüge Richtung Beckenried ist während des ganzen Fluges Funkkontakt mit TWR Buochs auf 119.62 nötig; ein Telefonanruf vorher genügt nicht. Die CTR ist werktags normalerweise 07:15-12:05 und 13:15-17:05 aktiv.',
    'Landeplatz Berggrind: bei Westwind oder Windstille Linksvolte, bei Ostwind Rechtsvolte. Oberhalb des Holzzauns landen; der alte Schlüssel darunter nur im Notfall.',
    'Landeplatz Gruob: nur bei Westwind, Rechtsvolte. Bei stärkerem Talwind Turbulenz und Sinken, Lee hinter dem Stall meiden.',
    'Keine Fahrzeuge auf den Landeplätzen. Parkieren bei der Bahn, auf dem Dorfparkplatz oder im Parkhaus.',
    'Schirm sofort nach der Landung zusammenlegen. Kein Campieren oder Grillieren, Hunde an die Leine.'
  ]
 WHERE locale='de' AND site_id IN (SELECT id FROM sites WHERE slug LIKE 'niederbauen%' AND kind='launch');

-- Brändlen: two launches with different seasons, and a winter-only landing zone.
UPDATE sites SET elevation_m = 1300, difficulty = 'medium',
  wing_types = ARRAY['paraglider'],
  source_label = 'Gleitschirm-Flugschule Emmetten',
  source_url = 'https://www.flugschule-emmetten.ch/diverses/fluggebiete-2/br%C3%A4ndlen/',
  source_kind = 'flight_school', data_status = 'reviewed', reviewed_at = DATE '2026-08-29'
 WHERE slug LIKE 'brandlen%' OR slug LIKE 'braendlen%';

UPDATE site_translations SET
  summary = 'A quieter alternative to Niederbauen above Wolfenschiessen, with separate north and south launches about ten minutes from the cable-car station.',
  terrain = 'North launch: a small, medium-steep to steep meadow ten minutes north above the station, often affected by valley wind. South launch: a medium-steep meadow ten minutes east above the station, open October to March only.',
  access_detail = 'Cable car from Wolfenschiessen, then about ten minutes on foot. Walking back down must follow the forest trail towards the cable-car station.',
  known_for = ARRAY['Quiet alternative','Two launch orientations','Cable-car served'],
  cautions = ARRAY[
    'The south launch is open only from October to March.',
    'The north launch is often affected by valley wind.',
    'Cable-car lines are the main hazard, and the valley carries many power lines with temporary installations possible. Check the Swiss obstacles map.',
    'Landing lies in Wolfenschiessen between two fences near a stream. Valley or north wind and calm: left-hand circuit. Mountain or south wind: right-hand circuit.',
    'The winter landing zone marked in white may be used only from 1 November to 28 February, regardless of snow cover.',
    'No groundhandling or setup practice. No campfires or camping, dogs on a lead.'
  ]
 WHERE locale='en' AND site_id IN (SELECT id FROM sites WHERE slug LIKE 'brandlen%' OR slug LIKE 'braendlen%');

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT s.id,'flugschule-emmetten',c.confirms,'Gleitschirm-Flugschule Emmetten',
       CASE WHEN s.slug LIKE 'niederbauen%'
            THEN 'https://www.flugschule-emmetten.ch/diverses/fluggebiete-2/emmetten/'
            ELSE 'https://www.flugschule-emmetten.ch/diverses/fluggebiete-2/br%C3%A4ndlen/' END,
       DATE '2026-08-29'
  FROM sites s CROSS JOIN (VALUES ('description'),('wind'),('hazards'),('access')) AS c(confirms)
 WHERE s.slug LIKE 'niederbauen%' OR s.slug LIKE 'brandlen%' OR s.slug LIKE 'braendlen%'
ON CONFLICT (site_id, provider_code, confirms) DO NOTHING;

COMMIT;
