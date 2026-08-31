import { database } from "./database"
import { distanceMetres } from "./dedupe"
import { fetchTerrainHeight } from "./importElevation"
import { listStations } from "./stationFeed"

/**
 * Imports SwissMetNet stations and links each site to the nearest ones.
 *
 * Nearest is only a starting point. A valley station can read calm while a ridge
 * is blown out, so the distance and height difference are stored with the link
 * and shown with every reading rather than being hidden behind a single number.
 */

/** Beyond this a station tells you very little about a specific launch. */
const MAX_LINK_KM = 25

async function run() {
  const stations = await listStations()
  if (!stations.length) {
    console.error("No stations returned; leaving existing data untouched.")
    await database.end()
    return
  }

  for (const station of stations) {
    const elevation = await fetchTerrainHeight(
      station.latitude,
      station.longitude,
    )
    await database.query(
      `INSERT INTO weather_stations (code, latitude, longitude, elevation_m)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE SET
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         elevation_m = COALESCE(EXCLUDED.elevation_m, weather_stations.elevation_m)`,
      [station.code, station.latitude, station.longitude, elevation],
    )
    await new Promise((resolve) => setTimeout(resolve, 60))
  }

  const { rows: sites } = await database.query<{
    id: string
    latitude: number
    longitude: number
    elevation_m: number | null
  }>(`SELECT id, latitude, longitude, elevation_m FROM sites`)

  const { rows: stored } = await database.query<{
    code: string
    latitude: number
    longitude: number
    elevation_m: number | null
  }>(`SELECT code, latitude, longitude, elevation_m FROM weather_stations`)

  await database.query(`DELETE FROM site_stations`)

  let linked = 0

  for (const site of sites) {
    const ranked = stored
      .map((station) => ({
        station,
        km:
          distanceMetres(
            site.latitude,
            site.longitude,
            station.latitude,
            station.longitude,
          ) / 1000,
      }))
      .filter((entry) => entry.km <= MAX_LINK_KM)
      .sort((a, b) => a.km - b.km)
      .slice(0, 3)

    for (const [index, entry] of ranked.entries()) {
      await database.query(
        `INSERT INTO site_stations
           (site_id, station_code, distance_km, elevation_delta_m, is_primary)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (site_id, station_code) DO UPDATE SET
           distance_km = EXCLUDED.distance_km,
           elevation_delta_m = EXCLUDED.elevation_delta_m,
           is_primary = EXCLUDED.is_primary`,
        [
          site.id,
          entry.station.code,
          entry.km.toFixed(2),
          site.elevation_m != null && entry.station.elevation_m != null
            ? entry.station.elevation_m - site.elevation_m
            : null,
          index === 0,
        ],
      )
      linked += 1
    }
  }

  console.log(
    `Stations: ${stations.length} imported, ${linked} site links within ${MAX_LINK_KM} km.`,
  )
  await database.end()
}

void run()
