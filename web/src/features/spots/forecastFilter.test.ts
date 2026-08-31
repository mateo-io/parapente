import { describe, expect, it } from "vitest"
import { filterByForecastMatch } from "./forecastFilter"
import type { FlyingSite } from "./types"
const site = { id: "a", slug: "a", kind: "launch", dataStatus: "reviewed", name: "A", summary: "", latitude: 0, longitude: 0, launchDirections: [], landingRole: "unknown", pairings: [], reports: [], windWindows: [{ fromDeg: 247.5, toDeg: 292.5, quality: "preferred" }], windCoverageDegrees: 0, windPreferredDegrees: 0, sourceCount: 1, sources: [], flightCoverage: "unknown", knownFor: [], cautions: [], sourceLabel: "", sourceUrl: "", sourceKind: "", reviewedAt: "2026-01-01", station: { code: "abc", latitude: 0, longitude: 0, elevationM: 0, distanceKm: 0, elevationDeltaM: 0 } } as FlyingSite
describe("filterByForecastMatch", () => it("keeps a site matching a selected horizon", () => {
  const forecasts = [{ code: "abc", horizons: { 0: { bearingDeg: 180, speedKmh: 1, gustKmh: null, forecastAt: "" }, 2: { bearingDeg: 270, speedKmh: 1, gustKmh: null, forecastAt: "" } } }]
  expect(filterByForecastMatch([site], forecasts, [0])).toEqual([])
  expect(filterByForecastMatch([site], forecasts, [2])).toEqual([site])
}))
