BEGIN;

INSERT INTO site_translations (site_id, locale, name, locality, summary, terrain, access_detail, known_for, cautions)
VALUES
 ('shv-pilatus-kulm','en','Pilatus Kulm','Kriens',
  'The summit launch on Pilatus, rated difficult by the federation.',
  'Terrain and buildings form rotors and the wind is often turbulent.',
  'Cable car from Kriens or cogwheel railway from Alpnachstad. 20 m west of the summit-station hall, down the steps, south side.',
  ARRAY['Summit launch','Cable-car served'],
  ARRAY['Rotors from terrain and buildings; often turbulent.',
        'Very good canopy control needed. If in doubt use an alternative launch.',
        'Check the wind indicators at Esel, Oberhaupt and the launch itself.',
        'Launches are demanding; no wind or very light wind is far easier.',
        'No Delta transport is possible on the Pilatus railway.']),
 ('shv-pilatus-kulm','de','Pilatus Kulm','Kriens',
  'Der Gipfelstartplatz am Pilatus, vom Verband als schwierig eingestuft.',
  'Durch Geländebeschaffenheit und Gebäude bilden sich Rotoren, oft turbulente Windverhältnisse.',
  'Mit der Luftseilbahn von Kriens oder der Zahnradbahn von Alpnachstad. 20 m westlich nach der Halle der Bergstation, Treppe runter, südseitig.',
  ARRAY['Gipfelstartplatz','Mit Bergbahn erreichbar'],
  ARRAY['Rotoren durch Gelände und Gebäude, oft turbulent.',
        'Sehr gute Schirmkontrolle nötig. Im Zweifelsfall von alternativen Startplätzen starten.',
        'Windfahnen Esel, Oberhaupt und Startplatz prüfen.',
        'Starts sind anspruchsvoll; ohne oder mit wenig Wind viel einfacher.',
        'Kein Deltatransport durch die Pilatusbahn möglich.']),
 ('shv-klimsen-west','en','Klimsen West','Kriens','A west-facing launch below the Pilatus summit.',NULL,
  'On foot from the Pilatus summit station, 15 minutes on the north side towards Klimsen.',
  ARRAY['Walk-in from the summit station'],
  ARRAY['The path is open only when free of snow.']),
 ('shv-klimsen-west','de','Klimsen West','Kriens','Westausgerichteter Startplatz unterhalb des Pilatus-Gipfels.',NULL,
  'Zu Fuss von der Bergstation Pilatus, 15 Min. nordseitig zur Klimsen.',
  ARRAY['Fussweg ab Bergstation'],
  ARRAY['Weg zum Startplatz nur offen, wenn kein Schnee liegt.']),
 ('shv-klimsen-ost','en','Klimsen Ost','Kriens','An east-facing cliff launch below the Pilatus summit.',
  'Cliff launch.','On foot from the Pilatus summit station, 15 minutes on the north side towards Klimsen.',
  ARRAY['Cliff launch'],
  ARRAY['Cliff launch.','The path is open only when free of snow.']),
 ('shv-klimsen-ost','de','Klimsen Ost','Kriens','Ostausgerichteter Klippenstartplatz unterhalb des Pilatus-Gipfels.',
  'Klippenstart.','Zu Fuss von der Bergstation Pilatus, 15 Min. nordseitig zur Klimsen.',
  ARRAY['Klippenstart'],
  ARRAY['Klippenstart.','Weg zum Startplatz nur offen, wenn kein Schnee liegt.']),
 ('shv-kriens-landing','en','Kriens','Kriens','Official Pilatus landing at Kriens. Easy, but difficult in thermal conditions.',
  NULL,'From the Pilatus railway car park.',ARRAY['Official landing'],
  ARRAY['Inside CTR 1 Emmen: when the CTR is active it may be used only for the landing approach, radio or not.',
        'Enter clearly below the height of the Sonnenberg.',
        'In thermal conditions the wind can turn 180 degrees within seconds.',
        'When the CTR is active, enter below 650 m only from the east.']),
 ('shv-kriens-landing','de','Kriens','Kriens','Offizieller Pilatus-Landeplatz in Kriens. Leicht, mit thermischen Ablösungen schwierig.',
  NULL,'Vom Parkplatz Pilatusbahnen her.',ARRAY['Offizieller Landeplatz'],
  ARRAY['Innerhalb CTR 1 Emmen: bei aktiver CTR nur für den Landeanflug, auch ohne Flugfunk.',
        'Erst deutlich unter Höhe Sonnenberg einfliegen.',
        'Bei thermischen Bedingungen kann der Wind innert Sekunden 180 Grad drehen.',
        'Bei aktiver CTR Einflug unter 650 m ü.M. nur von Osten her.']),
 ('shv-luzern-allmend-landing','en','Luzern Allmend','Luzern','Official Pilatus landing on the Allmend. Easy.',
  NULL,NULL,ARRAY['Official landing','Paraglider and hang glider'],
  ARRAY['Inside CTR 2 Emmen: usable only while that CTR is inactive.',
        'Floodlight masts at the edge of the football pitches to the south.',
        'No windsock on site.']),
 ('shv-luzern-allmend-landing','de','Luzern Allmend','Luzern','Offizieller Pilatus-Landeplatz auf der Allmend. Leicht.',
  NULL,NULL,ARRAY['Offizieller Landeplatz','Gleitschirm und Delta'],
  ARRAY['Innerhalb CTR 2 Emmen: nur bei deren Inaktivität benutzbar.',
        'Flutlichtmasten am Rande der Fussballfelder südlich des Landeplatzes.',
        'Kein Windsack vorhanden.']),
 ('shv-alpnachstad-landing','en','Alpnachstad','Alpnach','Official Pilatus landing at Alpnachstad.',
  NULL,NULL,ARRAY['Official landing'],
  ARRAY['Inside CTR Alpnach: observe the airspace regulation.',
        'Parking is prohibited.',
        'In pronounced valley wind or Bise the conditions can be strong and turbulent; consider an alternative landing or open ground.']),
 ('shv-alpnachstad-landing','de','Alpnachstad','Alpnach','Offizieller Pilatus-Landeplatz in Alpnachstad.',
  NULL,NULL,ARRAY['Offizieller Landeplatz'],
  ARRAY['Innerhalb CTR Alpnach: Luftraumregelung beachten.',
        'Parkieren verboten.',
        'Bei ausgeprägtem Talwind oder Bisenlage stark und turbulent; alternativen Landeplatz oder offenes Gelände wählen.'])
ON CONFLICT (site_id, locale) DO UPDATE SET
  name = EXCLUDED.name, summary = EXCLUDED.summary, terrain = EXCLUDED.terrain,
  access_detail = EXCLUDED.access_detail, known_for = EXCLUDED.known_for,
  cautions = EXCLUDED.cautions;

-- Wind windows straight from the sheet's Windrichtung column.
INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code) VALUES
 ('shv-pilatus-kulm',157.5,292.5,'preferred','shv-fsvl'),
 ('shv-klimsen-west',247.5,337.5,'preferred','shv-fsvl'),
 ('shv-klimsen-ost',67.5,112.5,'preferred','shv-fsvl')
ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING;

-- Official pairings: all three Pilatus landings serve all three launches.
INSERT INTO launch_landings (launch_id, landing_id, role, provider_code, source_url, reviewed_at)
SELECT l.id, d.id, 'official','shv-fsvl',
       'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Pilatus.pdf',
       DATE '2026-08-29'
  FROM sites l CROSS JOIN sites d
 WHERE l.id IN ('shv-pilatus-kulm','shv-klimsen-west','shv-klimsen-ost')
   AND d.id IN ('shv-kriens-landing','shv-luzern-allmend-landing','shv-alpnachstad-landing')
ON CONFLICT DO NOTHING;

-- Restrictions, kept structured rather than buried in prose.
INSERT INTO site_restrictions (site_id, sheet_code, kind, description, season_note, contact, authority, source_url)
VALUES
 (NULL,'shv-pilatus','airspace',
  'The Pilatus area and its landings are surrounded by the Emmen, Alpnach, Kägiswil and Buochs airfields. Areas inside the CTR and TMA, and the 5 km radius around Kägiswil, may be flown only under the special regulation, with radio clearance, or when the zones are inactive.',
  NULL,'Infoband 041 620 91 06, radio 134.130','Skyguide / Swiss Armed Forces',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Pilatus.pdf'),
 (NULL,'shv-pilatus','airspace',
  'Consult the Daily Airspace Bulletin Switzerland (DABS) before every flight for temporary airspace restrictions.',
  NULL,NULL,'Skyguide',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Pilatus.pdf'),
 (NULL,'shv-pilatus','wildlife','Wildruhezone: marked paths must be used.','15.12.-15.6.',NULL,'Canton',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Pilatus.pdf'),
 (NULL,'shv-pilatus','protected_area','Schutzgebiet AuLaV: take-off and landing are prohibited.',NULL,NULL,'Federal (AuLaV)',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Pilatus.pdf'),
 (NULL,'shv-klewenalp','airspace',
  'CTR Buochs special regulation. Outside the tower hours of Mon-Fri 07.30-12.05 and 13.15-17.05 the zone may be entered without restriction and without radio. Exceptions are posted at the cable-car valley and mountain stations.',
  NULL,'119.625','Skyguide / Buochs',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Klewenalp.pdf'),
 (NULL,'shv-klewenalp','wildlife','Wildruhezone: marked paths must be used.','15.12.-30.4.',NULL,'Canton',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Klewenalp.pdf'),
 (NULL,'shv-klewenalp','protected_area','Flachmoor, protected under AuLaV: take-off and landing prohibited.',NULL,NULL,'Federal (AuLaV)',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Klewenalp.pdf'),
 (NULL,'shv-klewenalp','acro_box','Acro and SiKu box: do not fly into it. The B landing at 770 m is for acro and SiKu pilots only.',NULL,NULL,'SHV/FSVL',
  'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Klewenalp.pdf')
ON CONFLICT DO NOTHING;

INSERT INTO info_sheet_sites (sheet_code, site_id, sheet_label) VALUES
 ('shv-pilatus','shv-pilatus-kulm','1'),
 ('shv-pilatus','shv-klimsen-west','2'),
 ('shv-pilatus','shv-klimsen-ost','3'),
 ('shv-pilatus','shv-kriens-landing','A'),
 ('shv-pilatus','shv-luzern-allmend-landing','B'),
 ('shv-pilatus','shv-alpnachstad-landing','C')
ON CONFLICT DO NOTHING;

INSERT INTO info_sheet_sites (sheet_code, site_id, sheet_label)
SELECT 'shv-klewenalp', id, CASE WHEN slug='klewenalp' THEN '1' ELSE 'A' END
  FROM sites WHERE slug IN ('klewenalp','beckenried-schuetzenhaus')
ON CONFLICT DO NOTHING;

INSERT INTO site_sources (site_id, provider_code, confirms, label, url, retrieved_at)
SELECT s.id,'shv-fsvl',c.confirms,'SHV/FSVL Infotafel',
       CASE WHEN s.slug IN ('klewenalp','beckenried-schuetzenhaus')
            THEN 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Klewenalp.pdf'
            ELSE 'https://www.shv-fsvl.ch/fileadmin/files/redakteure/Allgemein/Sicherheit/SHVInfotafeln/Pilatus.pdf' END,
       DATE '2026-08-29'
  FROM sites s
 CROSS JOIN (VALUES ('location'),('description'),('wind'),('hazards'),('access')) AS c(confirms)
 WHERE s.id IN ('shv-pilatus-kulm','shv-klimsen-west','shv-klimsen-ost',
                'shv-kriens-landing','shv-luzern-allmend-landing','shv-alpnachstad-landing')
    OR s.slug IN ('klewenalp','beckenried-schuetzenhaus')
ON CONFLICT (site_id, provider_code, confirms) DO NOTHING;

COMMIT;
