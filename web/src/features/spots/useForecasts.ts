import { useEffect, useState } from "react"
import type { StationForecast } from "./forecastFilter"
export function useForecasts() {
  const [forecasts, setForecasts] = useState<StationForecast[]>([])
  useEffect(() => { fetch("/api/flyability").then((response) => response.ok ? response.json() : null).then((payload) => setForecasts(payload?.data ?? [])).catch(() => setForecasts([])) }, [])
  return forecasts
}
