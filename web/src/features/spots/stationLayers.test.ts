import { describe, expect, it } from "vitest"

import { stationGeoJson, visibleStations } from "./stationLayers"
import type { FlyingSite } from "./types"

const all = [
  { code: "ges", latitude: 46.996, longitude: 8.523 },
  { code: "eng", latitude: 46.821, longitude: 8.41 },
  { code: "luz", latitude: 47.036, longitude: 8.301 },
]

function siteWith(code?: string): FlyingSite {
  return {
    id: "i", slug: "s", kind: "launch", dataStatus: "mapped", name: "n",
    summary: "", latitude: 46.9, longitude: 8.4, launchDirections: [], landingRole: "unknown", pairings: [], reports: [],
    windWindows: [], windCoverageDegrees: 0, windPreferredDegrees: 0,
    sourceCount: 1, flightCoverage: "unknown" as const, sources: [], knownFor: [], cautions: [],
    sourceLabel: "", sourceUrl: "", sourceKind: "", reviewedAt: "2026-01-01",
    station: code
      ? { code, latitude: 46.996, longitude: 8.523, elevationM: 519,
          distanceKm: 5.57, elevationDeltaM: -1081 }
      : null,
  }
}

describe("visibleStations", () => {
  it("shows nothing when no site is selected and show-all is off", () => {
    expect(visibleStations(all, undefined, false).points).toEqual([])
  })

  it("shows only the selected site's station by default", () => {
    const { points, activeCode } = visibleStations(all, siteWith("ges"), false)
    expect(points.map((p) => p.code)).toEqual(["ges"])
    expect(activeCode).toBe("ges")
  })

  it("shows every station when asked, still marking the active one", () => {
    const { points, activeCode } = visibleStations(all, siteWith("eng"), true)
    expect(points).toHaveLength(3)
    expect(activeCode).toBe("eng")
  })

  it("shows all with no active station when nothing is selected", () => {
    const { points, activeCode } = visibleStations(all, undefined, true)
    expect(points).toHaveLength(3)
    expect(activeCode).toBeUndefined()
  })

  it("copes with a site whose station is not in the list", () => {
    expect(visibleStations(all, siteWith("zzz"), false).points).toEqual([])
  })
})

describe("stationGeoJson", () => {
  it("flags only the active station and upper-cases the label", () => {
    const fc = stationGeoJson(all, "eng")
    expect(fc.features.filter((f) => f.properties.active)).toHaveLength(1)
    expect(fc.features[1]!.properties.code).toBe("ENG")
  })

  it("puts coordinates in longitude, latitude order", () => {
    const [lon, lat] = stationGeoJson([all[0]!], "ges").features[0]!.geometry.coordinates
    expect(lon).toBe(8.523)
    expect(lat).toBe(46.996)
  })
})
