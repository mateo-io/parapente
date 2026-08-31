import { database } from "./database"
import { distanceMetres } from "./dedupe"
import { fetchTerrainHeight } from "./importElevation"
import { resolveWalk } from "./walkTime"

/**
 * Valley lifts of Nidwalden and Engelberg, and their links to launches.
 *
 * Station coordinates come from OpenStreetMap; elevations are filled from
 * swisstopo. Walking time from the top station to the launch is computed unless
 * a source gives it, and is stored with its confidence so the UI can mark an
 * approximation rather than presenting a guess as fact.
 */

interface LiftSeed {
  code: string
  name: string
  kind: "cable_car" | "gondola" | "chairlift" | "funicular"
  base: [number, number]
  top: [number, number]
  operator?: string
  url?: string
  /** Launch slugs this lift serves, when they already exist. */
  serves?: string[]
}

const LIFTS: LiftSeed[] = [
  {
    code: "dallenwil-wirzweli",
    name: "Luftseilbahn Dallenwil-Wirzweli",
    kind: "cable_car",
    base: [46.92514, 8.38697],
    top: [46.91398, 8.36721],
  },
  {
    code: "eggwald-gummenalp",
    name: "Luftseilbahn Eggwald-Gummenalp",
    kind: "cable_car",
    base: [46.91086, 8.35857],
    top: [46.9015, 8.36126],
  },
  {
    code: "wolfenschiessen-braendlen",
    name: "Luftseilbahn Wolfenschiessen-Brändlen",
    kind: "cable_car",
    base: [46.90935, 8.40095],
    top: [46.90355, 8.40764],
  },
  {
    code: "dallenwil-niederrickenbach",
    name: "Luftseilbahn Dallenwil-Niederrickenbach",
    kind: "cable_car",
    base: [46.92779, 8.39728],
    top: [46.92969, 8.42697],
  },
  {
    code: "niederrickenbach-musenalp",
    name: "Luftseilbahn Niederrickenbach-Musenalp",
    kind: "cable_car",
    base: [46.92987, 8.42709],
    top: [46.92889, 8.44317],
  },
  {
    code: "stans-stanserhorn",
    name: "Stanserhorn-Bahn (Standseilbahn und CabriO)",
    kind: "cable_car",
    operator: "Stanserhorn-Bahn",
    url: "https://www.stanserhorn.ch/",
    base: [46.94759, 8.35133],
    top: [46.93044, 8.34232],
  },
  {
    code: "wolfenschiessen-wissiflue",
    name: "Luftseilbahn Wolfenschiessen-Wissiflue",
    kind: "cable_car",
    base: [46.91059, 8.39449],
    top: [46.91178, 8.3848],
  },
  {
    code: "alpboden-haldigrat",
    name: "Sessellift Alpboden-Haldigrat",
    kind: "chairlift",
    base: [46.91793, 8.43983],
    top: [46.90275, 8.44006],
  },
  {
    code: "engelberg-ristis",
    name: "Luftseilbahn Engelberg-Ristis",
    kind: "cable_car",
    operator: "Brunni-Bahnen",
    url: "https://www.brunni.ch/",
    base: [46.8194, 8.4033],
    top: [46.83216, 8.40732],
  },
  {
    code: "ristis-brunnihuette",
    name: "Sessellift Ristis-Brunnihütte",
    kind: "chairlift",
    operator: "Brunni-Bahnen",
    url: "https://www.brunni.ch/",
    base: [46.834, 8.40754],
    top: [46.84094, 8.41047],
  },
]

/** A lift can only plausibly serve a launch within this radius of its top. */
const MAX_SERVE_M = 2500

async function run() {
  for (const lift of LIFTS) {
    const [baseLat, baseLon] = lift.base
    const [topLat, topLon] = lift.top
    const baseEl = await fetchTerrainHeight(baseLat, baseLon)
    const topEl = await fetchTerrainHeight(topLat, topLon)

    await database.query(
      `INSERT INTO lifts (code, name, kind, operator, url,
         base_latitude, base_longitude, base_elevation_m,
         top_latitude, top_longitude, top_elevation_m, provider_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'osm')
       ON CONFLICT (code) DO UPDATE SET
         base_elevation_m = COALESCE(EXCLUDED.base_elevation_m, lifts.base_elevation_m),
         top_elevation_m = COALESCE(EXCLUDED.top_elevation_m, lifts.top_elevation_m)`,
      [lift.code, lift.name, lift.kind, lift.operator ?? null, lift.url ?? null,
       baseLat, baseLon, baseEl, topLat, topLon, topEl],
    )
    await new Promise((r) => setTimeout(r, 80))
  }

  // Link each lift to the launches near its top station.
  const { rows: launches } = await database.query<{
    id: string
    latitude: number
    longitude: number
    elevation_m: number | null
  }>(`SELECT id, latitude, longitude, elevation_m FROM sites WHERE kind = 'launch'`)

  let links = 0

  for (const lift of LIFTS) {
    const [topLat, topLon] = lift.top
    const { rows: stored } = await database.query<{ top_elevation_m: number | null }>(
      `SELECT top_elevation_m FROM lifts WHERE code = $1`,
      [lift.code],
    )
    const topEl = stored[0]?.top_elevation_m ?? null

    const near = launches
      .map((launch) => ({
        launch,
        metres: distanceMetres(topLat, topLon, launch.latitude, launch.longitude),
      }))
      .filter((entry) => entry.metres <= MAX_SERVE_M)
      .sort((a, b) => a.metres - b.metres)

    for (const entry of near) {
      const ascent =
        entry.launch.elevation_m != null && topEl != null
          ? entry.launch.elevation_m - topEl
          : 0
      const walk = resolveWalk(null, entry.metres, ascent)

      await database.query(
        `INSERT INTO site_lifts
           (site_id, lift_code, is_primary, walk_minutes, walk_confidence,
            walk_horizontal_m, walk_ascent_m)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (site_id, lift_code) DO UPDATE SET
           walk_minutes = EXCLUDED.walk_minutes,
           walk_confidence = EXCLUDED.walk_confidence,
           walk_horizontal_m = EXCLUDED.walk_horizontal_m,
           walk_ascent_m = EXCLUDED.walk_ascent_m`,
        [entry.launch.id, lift.code, false, walk.minutes,
         walk.confidence, Math.round(entry.metres), Math.round(ascent)],
      )
      links += 1
    }
  }

  // The primary lift is a property of the SITE: the one with the shortest walk
  // to that launch. Choosing it per lift let whichever lift was processed last
  // claim the flag, which made Wirzweli's primary a 36 minute walk instead of
  // the cable car that lands one minute away.
  await database.query(`UPDATE site_lifts SET is_primary = false`)
  await database.query(`
    UPDATE site_lifts sl SET is_primary = true
     WHERE sl.lift_code = (
       SELECT inner_sl.lift_code
         FROM site_lifts inner_sl
        WHERE inner_sl.site_id = sl.site_id
        ORDER BY inner_sl.walk_minutes NULLS LAST, inner_sl.walk_horizontal_m NULLS LAST
        LIMIT 1
     )`)

  console.log(`Lifts: ${LIFTS.length} upserted, ${links} launch links.`)
  await database.end()
}

void run()
