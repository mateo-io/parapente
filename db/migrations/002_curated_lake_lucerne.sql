BEGIN;

INSERT INTO sites (
  id, slug, kind, data_status, canton, latitude, longitude, elevation_m,
  launch_directions, pilot_level, access_type, source_label, source_url,
  source_kind, source_record_id, reviewed_at
) VALUES
  (
    'curated-brunni-tuempfeli-launch', 'brunni-tuempfeli', 'launch', 'reviewed',
    'Obwalden', 46.838000, 8.412000, 1800, ARRAY['S', 'SE'], 'student',
    'Cable car + chairlift', 'Brunni-Bahnen Engelberg',
    'https://brunni.ch/en/detail/paragliding', 'official_operator',
    'brunni-tuempfeli', DATE '2026-08-28'
  ),
  (
    'curated-engelberg-wyden-landing', 'engelberg-wyden-landing', 'landing', 'reviewed',
    'Obwalden', 46.817197, 8.409131, 1008, ARRAY[]::text[], 'student',
    'Walk from Brunni valley station', 'Brunni-Bahnen Engelberg',
    'https://brunni.ch/en/detail/paragliding', 'official_operator',
    'engelberg-wyden', DATE '2026-08-28'
  ),
  (
    'curated-niederbauen-launch', 'niederbauen-emmetten', 'launch', 'reviewed',
    'Nidwalden', 46.946778, 8.536444, 1590, ARRAY['NW'], 'independent',
    'Cable car', 'Flugschule Emmetten',
    'https://www.flugschule-emmetten.ch/diverses/fluggebiete-2/emmetten/',
    'local_school', 'niederbauen', DATE '2026-08-28'
  ),
  (
    'curated-emmetten-landing', 'emmetten-main-landing', 'landing', 'reviewed',
    'Nidwalden', 46.957850, 8.516670, 788, ARRAY[]::text[], 'independent',
    'Road access below the valley station', 'DHV Gelände-Datenbank',
    'https://service.dhv.de/db2/details.php?item=1284&popup=1&qi=glp_details',
    'association_database', 'dhv-1284-landing-1', DATE '2026-08-28'
  )
ON CONFLICT (id) DO UPDATE SET
  data_status = EXCLUDED.data_status,
  source_label = EXCLUDED.source_label,
  source_url = EXCLUDED.source_url,
  reviewed_at = EXCLUDED.reviewed_at,
  updated_at = now();

INSERT INTO site_translations (
  site_id, locale, name, locality, summary, access_detail, terrain,
  research_note, known_for, cautions
) VALUES
  (
    'curated-brunni-tuempfeli-launch', 'en', 'Brunni · Tümpfeli', 'Engelberg',
    'A cable-car-served south-facing launch in an established Engelberg flying area.',
    'Cable car and chairlift, followed by roughly ten minutes downhill on foot.',
    'Lightly sloping alpine meadow with space for several wings.',
    'The operator lists three Brunni launches and identifies Tümpfeli as suitable for training flights. Use the signed landing and packing areas.',
    ARRAY['Three official launches', 'Easy lift access', 'Engelberg valley'],
    ARRAY['Do not fly in föhn or strong upper winds.', 'The valley contains many cables.', 'Check Buochs and Alpnach airspace plus current DABS notices.']
  ),
  (
    'curated-brunni-tuempfeli-launch', 'de', 'Brunni · Tümpfeli', 'Engelberg',
    'Ein südlich ausgerichteter Startplatz mit Bahnanschluss im etablierten Fluggebiet Engelberg.',
    'Mit Luftseilbahn und Sessellift, danach etwa zehn Minuten zu Fuss bergab.',
    'Leicht geneigte Alpweide mit Platz für mehrere Schirme.',
    'Die Betreiberin weist drei Brunni-Startplätze aus und beschreibt Tümpfeli als schulungsgeeignet. Markierte Lande- und Packflächen benutzen.',
    ARRAY['Drei offizielle Startplätze', 'Einfache Bahnerschliessung', 'Engelbergertal'],
    ARRAY['Bei Föhn oder starkem Höhenwind nicht fliegen.', 'Im Tal befinden sich viele Seile.', 'Lufträume Buochs und Alpnach sowie aktuelle DABS prüfen.']
  ),
  (
    'curated-engelberg-wyden-landing', 'en', 'Engelberg · Wyden', 'Engelberg',
    'The official Engelberg landing meadow between the Wyden sports field and Sportingpark.',
    'Use public parking and toilets at the Brunni valley station; pack only in the signed folding area.',
    'Valley meadow beside the Engelberger Aa.',
    'The artificial football pitch is not part of the landing area and must not be entered.',
    ARRAY['Official landing', 'Near public transport'],
    ARRAY['Keep the landing area clear after touchdown.', 'Watch snowmaking equipment and the cross-country trail in winter.']
  ),
  (
    'curated-engelberg-wyden-landing', 'de', 'Engelberg · Wyden', 'Engelberg',
    'Die offizielle Engelberger Landewiese zwischen Sportplatz Wyden und Sportingpark.',
    'Öffentliche Parkplätze und Toiletten bei der Brunni-Talstation benutzen; nur auf der markierten Fläche packen.',
    'Talwiese an der Engelberger Aa.',
    'Der Kunstrasen-Fussballplatz gehört nicht zum Landeplatz und darf nicht betreten werden.',
    ARRAY['Offizieller Landeplatz', 'Nahe beim ÖV'],
    ARRAY['Landefläche nach der Landung sofort freigeben.', 'Im Winter Beschneiungsanlagen und Loipe beachten.']
  ),
  (
    'curated-niederbauen-launch', 'en', 'Niederbauen', 'Emmetten',
    'A broad lake-facing meadow launch reached directly by cable car from Emmetten.',
    'The launch is beside the upper cable-car station and mountain inn.',
    'Large meadow that steepens quickly toward Lake Lucerne.',
    'The area sits outside CTR Buochs, but the boundary begins immediately west of the village. Confirm the current local airspace procedure.',
    ARRAY['Lake-facing launch', 'Late-day soaring', 'Direct cable-car access'],
    ARRAY['Inspect the sloping landing meadow before launch.', 'CTR Buochs is very close.', 'A transport cable near Alp Tritt is a documented obstacle.']
  ),
  (
    'curated-niederbauen-launch', 'de', 'Niederbauen', 'Emmetten',
    'Eine breite, zum See ausgerichtete Startwiese direkt bei der Bergstation ab Emmetten.',
    'Der Startplatz liegt neben der Bergstation und dem Berggasthaus.',
    'Grosse Wiese, die in Richtung Vierwaldstättersee rasch steiler wird.',
    'Das Gebiet liegt ausserhalb der CTR Buochs, deren Grenze jedoch unmittelbar westlich des Dorfs beginnt. Aktuelles lokales Luftraumverfahren prüfen.',
    ARRAY['Start Richtung See', 'Spätes Soaring', 'Direkter Bahnanschluss'],
    ARRAY['Die geneigte Landewiese vor dem Start besichtigen.', 'Die CTR Buochs liegt sehr nahe.', 'Bei Alp Tritt befindet sich ein dokumentiertes Transportseil.']
  ),
  (
    'curated-emmetten-landing', 'en', 'Emmetten · Main landing', 'Emmetten',
    'The principal sloping landing meadow below the Niederbauen valley station.',
    'Road access is available below the cable-car station; leave by the paths and pack below the landing area.',
    'Long but distinctly sloping meadow.',
    'The association database describes the approach as manageable in the prevailing valley wind, but the slope should be inspected in person.',
    ARRAY['Main Niederbauen landing', 'Packing area below'],
    ARRAY['The meadow is sloping.', 'Use the paths when leaving.', 'Confirm crops, access, and current local instructions.']
  ),
  (
    'curated-emmetten-landing', 'de', 'Emmetten · Hauptlandeplatz', 'Emmetten',
    'Die geneigte Hauptlandewiese unterhalb der Niederbauen-Talstation.',
    'Zufahrt unterhalb der Talstation; über die Wege verlassen und unterhalb des Landeplatzes zusammenlegen.',
    'Lange, aber deutlich geneigte Wiese.',
    'Die Geländedatenbank beschreibt den Anflug bei üblichem Talwind als gut machbar. Die Neigung vor Ort besichtigen.',
    ARRAY['Hauptlandeplatz Niederbauen', 'Packplatz unterhalb'],
    ARRAY['Die Wiese ist geneigt.', 'Zum Verlassen die Wege benutzen.', 'Bewuchs, Zugang und aktuelle lokale Hinweise prüfen.']
  )
ON CONFLICT (site_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  locality = EXCLUDED.locality,
  summary = EXCLUDED.summary,
  access_detail = EXCLUDED.access_detail,
  terrain = EXCLUDED.terrain,
  research_note = EXCLUDED.research_note,
  known_for = EXCLUDED.known_for,
  cautions = EXCLUDED.cautions;

COMMIT;
