import type { FlyingSite } from "./types"
import { supportsBearing } from "./windFilter"
export type ForecastHorizon = 0 | 2 | 4
export interface StationForecast { code: string; horizons: Partial<Record<ForecastHorizon, { bearingDeg: number; speedKmh: number; gustKmh: number | null; forecastAt: string }>> }
export function filterByForecastMatch(sites: FlyingSite[], forecasts: StationForecast[], selected: ForecastHorizon[]) {
  if (!selected.length || !forecasts.length) return sites
  const byCode = new Map(forecasts.map((forecast) => [forecast.code, forecast]))
  return sites.filter((site) => site.kind !== "launch" || selected.some((horizon) => {
    const reading = site.station && byCode.get(site.station.code)?.horizons[horizon]
    return Boolean(reading && site.windWindows.length && supportsBearing(site.windWindows, reading.bearingDeg))
  }))
}
