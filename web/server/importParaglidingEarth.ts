import { database } from "./database"
import { distanceMetres } from "./dedupe"

/**
 * ParaglidingEarth import.
 *
 * A community site database licensed CC BY-SA 3.0, so unlike the XC leagues it
 * may actually be redistributed, with attribution and share-alike. It carries
 * the launches missing from OpenStreetMap around Buochs: Buochserhorn,
 * Musenalp, Stanserhorn, Wirzweli and both Brändlen launches.
 *
 * It is community data, so records land as `mapped` with the provider recorded.
 * A federation or school source still outranks it, and existing reviewed records
 * are never overwritten; a nearby ParaglidingEarth entry becomes corroboration
 * instead.
 */

const API =
  "https://www.paraglidingearth.com/api/geojson/getAroundLatLngSites.php"

/** Per-direction ratings: 2 reads as good, 1 as merely possible. */
const DIRECTION_DEG: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
}

const HALF_WIDTH = 22.5

/**
 * A ParaglidingEarth point this close to an existing site is the same place.
 *
 * Calibrated against pairs whose status was established by hand:
 *   Gummen, 263 m, one launch recorded twice          -> must merge
 *   Titlis, 347 m but 538 m vertically, two launches  -> must not
 *   Gruob and the Emmetten main landing, 383 m        -> must not
 *   Fronalpstock, 397 m, one of four launches         -> must not
 * 300 m sits cleanly between the duplicate and the nearest true pair. At 250 m
 * the Gummen duplicate slipped through and was recreated on every import, which
 * a migration then had to delete.
 */
const SAME_SITE_M = 300

interface Feature {
  geometry: { coordinates: [number, number] }
  properties: Record<string, string | number | null>
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function arcsFor(props: Record<string, string | number | null>) {
  const arcs: { from: number; to: number; quality: string }[] = []

  for (const [token, bearing] of Object.entries(DIRECTION_DEG)) {
    const rating = Number(props[token] ?? 0)
    if (!rating) continue
    const quality = rating >= 2 ? "preferred" : "acceptable"

    const from = bearing - HALF_WIDTH
    const to = bearing + HALF_WIDTH
    // Split arcs crossing north so every stored arc ascends.
    if (from < 0) {
      arcs.push({ from: from + 360, to: 360, quality })
      arcs.push({ from: 0, to, quality })
    } else {
      arcs.push({ from, to, quality })
    }
  }

  return arcs
}

async function run() {
  const url = `${API}?lat=46.974&lng=8.4206&distance=25&limit=200&style=detailled`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`ParaglidingEarth ${response.status}`)

  const { features = [] } = (await response.json()) as { features?: Feature[] }

  const { rows: existing } = await database.query<{
    id: string
    kind: string
    latitude: number
    longitude: number
    data_status: string
  }>(`SELECT id, kind, latitude, longitude, data_status FROM sites`)

  let inserted = 0
  let corroborated = 0
  let skipped = 0

  for (const feature of features) {
    const props = feature.properties
    if (Number(props.paragliding ?? 0) !== 1) { skipped += 1; continue }

    const name = String(props.name ?? "").trim()
    const [longitude, latitude] = feature.geometry.coordinates
    if (!name || latitude == null || longitude == null) { skipped += 1; continue }

    const kind = String(props.place ?? "").includes("landing") ? "landing" : "launch"
    const elevation = Number(props.takeoff_altitude) || null
    const description = String(props.takeoff_description ?? "").trim()

    const near = existing.find(
      (site) =>
        site.kind === kind &&
        distanceMetres(latitude, longitude, site.latitude, site.longitude) <= SAME_SITE_M,
    )

    // Never overwrite a record already reviewed against a federation or school
    // source; record this as an independent confirmation instead.
    if (near) {
      await database.query(
        `INSERT INTO site_sources (site_id, provider_code, confirms, label, url)
         VALUES ($1,'paraglidingearth','location','ParaglidingEarth','https://www.paraglidingearth.com/')
         ON CONFLICT (site_id, provider_code, confirms) DO NOTHING`,
        [near.id],
      )
      corroborated += 1
      continue
    }

    const id = `pge-${slugify(name)}-${kind}`
    const slug = `${slugify(name)}-pge`

    await database.query(
      `INSERT INTO sites (id, slug, kind, data_status, region_code,
         latitude, longitude, elevation_m, wing_types,
         source_label, source_url, source_kind, reviewed_at, provider_code)
       VALUES ($1,$2,$3,'mapped','lake-lucerne',$4,$5,$6,ARRAY['paraglider'],
         'ParaglidingEarth','https://www.paraglidingearth.com/','community',
         CURRENT_DATE,'paraglidingearth')
       ON CONFLICT (id) DO UPDATE SET
         elevation_m = COALESCE(EXCLUDED.elevation_m, sites.elevation_m)`,
      [id, slug, kind, latitude, longitude, elevation],
    )

    for (const locale of ["en", "de"] as const) {
      await database.query(
        `INSERT INTO site_translations (site_id, locale, name, summary, terrain, known_for, cautions)
         VALUES ($1,$2,$3,$4,NULL,ARRAY[]::text[],ARRAY[]::text[])
         ON CONFLICT (site_id, locale) DO UPDATE SET
           name = EXCLUDED.name,
           summary = COALESCE(NULLIF(EXCLUDED.summary,''), site_translations.summary)`,
        [id, locale, name, description],
      )
    }

    await database.query(
      `DELETE FROM site_wind_windows WHERE site_id=$1 AND provider_code='paraglidingearth'`,
      [id],
    )
    if (kind === "launch") {
      for (const arc of arcsFor(props)) {
        await database.query(
          `INSERT INTO site_wind_windows (site_id, from_deg, to_deg, quality, provider_code)
           VALUES ($1,$2,$3,$4,'paraglidingearth')
           ON CONFLICT (site_id, from_deg, to_deg, quality) DO NOTHING`,
          [id, arc.from, arc.to, arc.quality],
        )
      }
    }

    await database.query(
      `INSERT INTO site_sources (site_id, provider_code, confirms, label, url)
       VALUES ($1,'paraglidingearth','location','ParaglidingEarth','https://www.paraglidingearth.com/'),
              ($1,'paraglidingearth','description','ParaglidingEarth','https://www.paraglidingearth.com/'),
              ($1,'paraglidingearth','wind','ParaglidingEarth','https://www.paraglidingearth.com/')
       ON CONFLICT (site_id, provider_code, confirms) DO NOTHING`,
      [id],
    )

    inserted += 1
  }

  console.log(
    `ParaglidingEarth: ${inserted} new, ${corroborated} corroborated existing, ${skipped} skipped of ${features.length}.`,
  )
  await database.end()
}

void run()
