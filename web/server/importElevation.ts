import { database } from "./database"
import { isInsideSwitzerland, wgs84ToLv95 } from "./swissCoords"

/**
 * Fills missing site elevations from the swisstopo height service, which reads
 * the swissALTI3D terrain model. Elevation is a prerequisite for glide
 * reachability, so a missing value has to be filled rather than guessed.
 *
 * The stored value is TERRAIN height at the mapped point. It is not a surveyed
 * launch altitude and is only as good as the point's position, so it is written
 * with its own provider rather than presented as an operator figure.
 */

const HEIGHT_ENDPOINT = "https://api3.geo.admin.ch/rest/services/height"

export async function fetchTerrainHeight(latitude: number, longitude: number) {
  const lv95 = wgs84ToLv95(latitude, longitude)
  if (!isInsideSwitzerland(lv95)) return null

  const url =
    `${HEIGHT_ENDPOINT}?easting=${lv95.easting.toFixed(2)}` +
    `&northing=${lv95.northing.toFixed(2)}&sr=2056`

  const response = await fetch(url)
  if (!response.ok) return null

  const payload = (await response.json()) as { height?: string }
  const height = Number(payload.height)

  return Number.isFinite(height) ? Math.round(height) : null
}

async function run() {
  const { rows } = await database.query<{
    id: string
    latitude: number
    longitude: number
  }>(
    `SELECT id, latitude, longitude FROM sites
      WHERE elevation_m IS NULL ORDER BY id`,
  )

  let filled = 0
  let skipped = 0

  for (const site of rows) {
    const height = await fetchTerrainHeight(site.latitude, site.longitude)

    if (height == null) {
      skipped += 1
      continue
    }

    await database.query(
      `UPDATE sites SET elevation_m = $2, updated_at = now() WHERE id = $1`,
      [site.id, height],
    )
    await database.query(
      `INSERT INTO site_sources (site_id, provider_code, confirms, label, url)
       VALUES ($1, 'swisstopo', 'location', 'swisstopo swissALTI3D', $2)
       ON CONFLICT (site_id, provider_code, confirms) DO NOTHING`,
      [site.id, "https://www.swisstopo.admin.ch/en/height-model-swissalti3d"],
    )
    filled += 1

    // Courtesy pacing; swisstopo throttles on excessive use.
    await new Promise((resolve) => setTimeout(resolve, 120))
  }

  console.log(
    `Elevation: filled ${filled}, skipped ${skipped} of ${rows.length} missing.`,
  )
  await database.end()
}

// Only run the backfill when invoked directly, not when imported for reuse.
if (process.argv[1]?.endsWith("importElevation.ts")) void run()
