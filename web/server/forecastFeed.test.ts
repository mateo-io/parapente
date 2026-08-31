import { describe, expect, it } from "vitest"
import { buildForecastUrl, parseForecasts } from "./forecastFeed"

const stations = [{ code: "abc", latitude: 46.9, longitude: 8.5 }]
const payload = { current: { time: "2026-08-31T10:00", wind_speed_10m: 12, wind_direction_10m: 270 }, hourly: { time: ["2026-08-31T10:00", "2026-08-31T12:00", "2026-08-31T14:00"], wind_speed_10m: [12, 18, 21], wind_direction_10m: [270, 180, 90], wind_gusts_10m: [null, 25, 30] } }

describe("station forecasts", () => {
  it("uses the station coordinates in the Open-Meteo request", () => {
    expect(buildForecastUrl(stations)).toContain("latitude=46.9000")
    expect(buildForecastUrl(stations)).toContain("longitude=8.5000")
  })
  it("returns current, +2h and +4h readings", () => {
    expect(parseForecasts(payload, stations, new Date("2026-08-31T10:00:00Z"))[0]?.horizons).toMatchObject({
      0: { bearingDeg: 270 }, 2: { bearingDeg: 180, speedKmh: 18 }, 4: { bearingDeg: 90, speedKmh: 21 },
    })
  })
})
