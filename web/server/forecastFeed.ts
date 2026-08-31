const ENDPOINT = "https://api.open-meteo.com/v1/forecast"

export const FORECAST_ATTRIBUTION = "Open-Meteo forecast · CC-BY 4.0"
export const FORECAST_HORIZONS = [0, 2, 4] as const
export type ForecastHorizon = (typeof FORECAST_HORIZONS)[number]

export interface ForecastStation { code: string; latitude: number; longitude: number }
export interface StationForecast {
  code: string
  horizons: Partial<Record<ForecastHorizon, { bearingDeg: number; speedKmh: number; gustKmh: number | null; forecastAt: string }>>
}

type MeteoPayload = {
  current?: { time?: string; wind_speed_10m?: number; wind_direction_10m?: number; wind_gusts_10m?: number }
  hourly?: { time?: string[]; wind_speed_10m?: number[]; wind_direction_10m?: number[]; wind_gusts_10m?: number[] }
}

function iso(value: string | undefined) { return value ? `${value}Z`.replace("ZZ", "Z") : undefined }
function reading(payload: MeteoPayload, index?: number) {
  const bearing = index == null ? payload.current?.wind_direction_10m : payload.hourly?.wind_direction_10m?.[index]
  const speed = index == null ? payload.current?.wind_speed_10m : payload.hourly?.wind_speed_10m?.[index]
  const gust = index == null ? payload.current?.wind_gusts_10m : payload.hourly?.wind_gusts_10m?.[index]
  const at = index == null ? iso(payload.current?.time) : iso(payload.hourly?.time?.[index])
  if (!Number.isFinite(bearing) || !Number.isFinite(speed) || !at) return undefined
  return { bearingDeg: ((bearing! % 360) + 360) % 360, speedKmh: speed!, gustKmh: Number.isFinite(gust) ? gust! : null, forecastAt: at }
}

export function buildForecastUrl(stations: ForecastStation[]) {
  const params = new URLSearchParams({
    latitude: stations.map((station) => station.latitude.toFixed(4)).join(","),
    longitude: stations.map((station) => station.longitude.toFixed(4)).join(","),
    current: "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    hourly: "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    forecast_hours: "6", wind_speed_unit: "kmh", timezone: "UTC",
  })
  return `${ENDPOINT}?${params}`
}

export function parseForecasts(payload: unknown, stations: ForecastStation[], now = new Date()): StationForecast[] {
  const rows = Array.isArray(payload) ? payload : [payload]
  return stations.flatMap((station, stationIndex) => {
    const row = rows[stationIndex] as MeteoPayload | undefined
    if (!row) return []
    const horizons: StationForecast["horizons"] = {}
    for (const horizon of FORECAST_HORIZONS) {
      if (horizon === 0) { const value = reading(row); if (value) horizons[0] = value; continue }
      const times = row.hourly?.time ?? []
      const target = now.getTime() + horizon * 3_600_000
      const index = times.reduce((best, time, index) => Math.abs(new Date(`${time}Z`).getTime() - target) < Math.abs(new Date(`${times[best]}Z`).getTime() - target) ? index : best, 0)
      const value = reading(row, index); if (value) horizons[horizon] = value
    }
    return [{ code: station.code, horizons }]
  })
}

const cache = new Map<string, { value: StationForecast[]; expiresAt: number }>()
export async function fetchStationForecasts(stations: ForecastStation[]) {
  const key = stations.map((station) => station.code).join(",")
  const hit = cache.get(key); if (hit && hit.expiresAt > Date.now()) return hit.value
  const chunks = Array.from({ length: Math.ceil(stations.length / 50) }, (_, index) => stations.slice(index * 50, index * 50 + 50))
  const result = (await Promise.all(chunks.map(async (chunk) => {
    const response = await fetch(buildForecastUrl(chunk)); if (!response.ok) return []
    return parseForecasts(await response.json(), chunk)
  }))).flat()
  cache.set(key, { value: result, expiresAt: Date.now() + 10 * 60 * 1000 })
  return result
}
