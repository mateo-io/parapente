/**
 * MeteoSwiss SwissMetNet automatic stations, published as open government data.
 * Free, no key, attribution to MeteoSwiss. Values are ten-minute means updated
 * every ten minutes, which is a real measurement rather than a model forecast.
 *
 * A station is not the site. It can be kilometres away and hundreds of metres
 * lower, so its distance and height difference travel with every reading and
 * must be shown; a valley station reading calm says nothing about a ridge.
 */

const STAC_ITEMS =
  "https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-smn/items"

const DATA_BASE = "https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn"

export const STATION_ATTRIBUTION = "MeteoSwiss SwissMetNet"

/** MeteoSwiss parameter codes for the ten-minute wind fields. */
const FIELD = {
  timestamp: "reference_timestamp",
  directionDeg: "dkl010z0",
  speedKmh: "fkl010z0",
  gustKmh: "fkl010z1",
} as const

export interface StationMeta {
  code: string
  latitude: number
  longitude: number
}

export interface StationReading {
  code: string
  bearingDeg: number | null
  speedKmh: number | null
  gustKmh: number | null
  observedAt: string
  provider: "meteoswiss"
}

export async function listStations(): Promise<StationMeta[]> {
  const response = await fetch(`${STAC_ITEMS}?limit=200`)
  if (!response.ok) return []

  const payload = (await response.json()) as {
    features?: { id: string; geometry?: { type: string; coordinates: number[] } }[]
  }

  return (payload.features ?? [])
    .filter((feature) => feature.geometry?.type === "Point")
    .map((feature) => ({
      code: feature.id,
      longitude: feature.geometry!.coordinates[0]!,
      latitude: feature.geometry!.coordinates[1]!,
    }))
}

/** Parses the semicolon CSV, taking the most recent row that has a direction. */
export function parseStationCsv(
  code: string,
  csv: string,
): StationReading | null {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return null

  const header = lines[0]!.split(";")
  const index = (name: string) => header.indexOf(name)

  const iTime = index(FIELD.timestamp)
  const iDir = index(FIELD.directionDeg)
  const iSpeed = index(FIELD.speedKmh)
  const iGust = index(FIELD.gustKmh)
  if (iTime < 0 || iDir < 0) return null

  const num = (value: string | undefined) => {
    if (value == null || value.trim() === "") return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  // Rows run oldest to newest; walk back to the last one carrying a direction.
  for (let row = lines.length - 1; row >= 1; row -= 1) {
    const cells = lines[row]!.split(";")
    const bearing = num(cells[iDir])
    if (bearing == null) continue

    return {
      code,
      bearingDeg: ((bearing % 360) + 360) % 360,
      speedKmh: num(cells[iSpeed]),
      gustKmh: num(cells[iGust]),
      observedAt: parseSwissTimestamp(cells[iTime]),
      provider: "meteoswiss",
    }
  }

  return null
}

/** MeteoSwiss writes `DD.MM.YYYY HH:MM` in UTC. */
export function parseSwissTimestamp(value: string | undefined): string {
  const match = value?.match(
    /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/,
  )
  if (!match) return new Date().toISOString()

  const [, day, month, year, hour, minute] = match
  return `${year}-${month}-${day}T${hour}:${minute}:00Z`
}

const cache = new Map<string, { reading: StationReading; expiresAt: number }>()
const CACHE_MS = 5 * 60 * 1000

export async function fetchStationReading(code: string) {
  const hit = cache.get(code)
  if (hit && hit.expiresAt > Date.now()) return hit.reading

  const response = await fetch(
    `${DATA_BASE}/${code}/ogd-smn_${code}_t_now.csv`,
  )
  if (!response.ok) return null

  const reading = parseStationCsv(code, await response.text())
  if (reading) cache.set(code, { reading, expiresAt: Date.now() + CACHE_MS })

  return reading
}
