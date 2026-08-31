/**
 * Live wind from Open-Meteo.
 *
 * Open-Meteo needs no API key and its free tier allows under 10'000 calls a
 * day, but it is licensed for NON-COMMERCIAL use only; commercial use requires
 * their paid plan. Data is CC-BY 4.0 and must be attributed.
 * https://open-meteo.com/en/terms
 *
 * Readings carry their own observation time so the UI can show how old they are
 * and never present a forecast as a current measurement.
 */

const ENDPOINT = "https://api.open-meteo.com/v1/forecast"

export const WIND_ATTRIBUTION = "Open-Meteo · CC-BY 4.0"

export interface WindReading {
  /** Direction the wind blows FROM, in degrees. */
  bearingDeg: number
  speedKmh: number
  gustKmh: number | null
  /** ISO-8601 timestamp of the observation, in UTC. */
  observedAt: string
  provider: "open-meteo"
}

interface OpenMeteoCurrent {
  time?: string
  wind_speed_10m?: number
  wind_direction_10m?: number
  wind_gusts_10m?: number
}

export function buildWindUrl(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    wind_speed_unit: "kmh",
    timezone: "UTC",
  })
  return `${ENDPOINT}?${params}`
}

export function parseWindResponse(payload: unknown): WindReading | null {
  const current = (payload as { current?: OpenMeteoCurrent } | null)?.current
  const bearing = current?.wind_direction_10m
  const speed = current?.wind_speed_10m

  if (typeof bearing !== "number" || typeof speed !== "number") return null
  if (!Number.isFinite(bearing) || !Number.isFinite(speed)) return null

  return {
    bearingDeg: ((bearing % 360) + 360) % 360,
    speedKmh: speed,
    gustKmh: typeof current?.wind_gusts_10m === "number"
      ? current.wind_gusts_10m
      : null,
    // Open-Meteo returns naive UTC timestamps; mark them as such.
    observedAt: current?.time ? `${current.time}Z`.replace("ZZ", "Z") : new Date().toISOString(),
    provider: "open-meteo",
  }
}

/** Cached briefly so panning the map does not spend the daily request budget. */
const cache = new Map<string, { reading: WindReading; expiresAt: number }>()
const CACHE_MS = 10 * 60 * 1000

export async function fetchWind(
  latitude: number,
  longitude: number,
): Promise<WindReading | null> {
  const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.reading

  const response = await fetch(buildWindUrl(latitude, longitude))
  if (!response.ok) return null

  const reading = parseWindResponse(await response.json())
  if (reading) cache.set(key, { reading, expiresAt: Date.now() + CACHE_MS })

  return reading
}
