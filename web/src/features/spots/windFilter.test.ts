import { describe, expect, it } from "vitest"

import {
  bearingForSector,
  countWindMatches,
  filterByWind,
  matchSiteToWind,
} from "./windFilter"
import type { FlyingSite } from "./types"

function site(overrides: Partial<FlyingSite>): FlyingSite {
  return {
    id: "id", slug: "slug", kind: "launch", dataStatus: "mapped",
    name: "Test", summary: "", latitude: 47, longitude: 8,
    launchDirections: [], landingRole: "unknown", pairings: [], reports: [], windWindows: [], windCoverageDegrees: 0, windPreferredDegrees: 0, sourceCount: 1, flightCoverage: "unknown" as const, sources: [],
    knownFor: [], cautions: [], sourceLabel: "", sourceUrl: "",
    sourceKind: "", reviewedAt: "2026-01-01",
    ...overrides,
  }
}

const west = site({
  slug: "west",
  windWindows: [{ fromDeg: 247.5, toDeg: 292.5, quality: "preferred" }],
})
const north = site({
  slug: "north",
  windWindows: [
    { fromDeg: 0, toDeg: 22.5, quality: "preferred" },
    { fromDeg: 337.5, toDeg: 360, quality: "preferred" },
  ],
})
const unknown = site({ slug: "unknown" })
const landing = site({ slug: "landing", kind: "landing" })

describe("matchSiteToWind", () => {
  it("matches a launch inside its window", () => {
    expect(matchSiteToWind(west, 270)).toBe("works")
    expect(matchSiteToWind(west, 180)).toBe("does-not-work")
  })

  it("matches across the north wrap", () => {
    expect(matchSiteToWind(north, 350)).toBe("works")
    expect(matchSiteToWind(north, 10)).toBe("works")
    expect(matchSiteToWind(north, 180)).toBe("does-not-work")
  })

  it("reports unknown rather than no when there is no wind data", () => {
    expect(matchSiteToWind(unknown, 270)).toBe("unknown")
  })

  it("reports unknown when there is no wind reading yet", () => {
    expect(matchSiteToWind(west, null)).toBe("unknown")
  })
})

describe("filterByWind", () => {
  it("keeps landings regardless of wind", () => {
    expect(filterByWind([landing], 270).map((s) => s.slug)).toEqual(["landing"])
  })

  it("keeps only launches known to work", () => {
    expect(filterByWind([west, north, unknown], 270).map((s) => s.slug)).toEqual(
      ["west"],
    )
  })

  it("returns everything when no wind is selected", () => {
    expect(filterByWind([west, north, unknown], null)).toHaveLength(3)
  })
})

describe("countWindMatches", () => {
  it("keeps the three states separate and ignores landings", () => {
    expect(countWindMatches([west, north, unknown, landing], 270)).toEqual({
      works: 1, "does-not-work": 1, unknown: 1,
    })
  })
})

describe("bearingForSector", () => {
  it("maps sectors to bearings", () => {
    expect(bearingForSector("N")).toBe(0)
    expect(bearingForSector("SW")).toBe(225)
  })
})
