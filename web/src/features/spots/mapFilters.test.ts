import { describe, expect, it } from "vitest"

import { countSitesByKind, filterMapSites } from "./mapFilters"
import type { FlyingSite } from "./types"

const sites: FlyingSite[] = [
  {
    id: "launch",
    slug: "rigi",
    kind: "launch",
    dataStatus: "reviewed",
    name: "Rigi Kulm",
    locality: "Goldau",
    summary: "Launch",
    latitude: 47,
    longitude: 8.4,
    launchDirections: ["SE"],
    landingRole: "unknown" as const, pairings: [], reports: [],
    windWindows: [],
    windCoverageDegrees: 0, windPreferredDegrees: 0, sourceCount: 1, flightCoverage: "unknown" as const, sources: [],
    knownFor: [],
    cautions: [],
    sourceLabel: "Test",
    sourceUrl: "https://example.com",
    sourceKind: "test",
    reviewedAt: "2026-08-28",
  },
  {
    id: "landing",
    slug: "engelberg",
    kind: "landing",
    dataStatus: "mapped",
    name: "Wyden",
    locality: "Engelberg",
    summary: "Landing",
    latitude: 46.8,
    longitude: 8.4,
    launchDirections: [],
    landingRole: "unknown" as const, pairings: [], reports: [],
    windWindows: [],
    windCoverageDegrees: 0, windPreferredDegrees: 0, sourceCount: 1, flightCoverage: "unknown" as const, sources: [],
    knownFor: [],
    cautions: [],
    sourceLabel: "Test",
    sourceUrl: "https://example.com",
    sourceKind: "test",
    reviewedAt: "2026-08-28",
  },
]

describe("map filters", () => {
  it("filters by type and translated name/location text", () => {
    expect(
      filterMapSites(sites, { query: "ENGEL", kinds: ["landing"] }).map(
        (site) => site.slug,
      ),
    ).toEqual(["engelberg"])
  })

  it("counts every supported marker type", () => {
    expect(countSitesByKind(sites)).toEqual({
      launch: 1,
      landing: 1,
      weather_station: 0,
    })
  })
})
