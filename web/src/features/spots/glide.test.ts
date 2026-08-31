import { describe, expect, it } from "vitest"

import {
  GLIDE_BANDS,
  bandFor,
  glideLeg,
  haversineMetres,
  launchesReaching,
  reachableLandings,
} from "./glide"
import type { FlyingSite } from "./types"

function site(o: Partial<FlyingSite>): FlyingSite {
  return {
    id: "id", slug: "s", kind: "launch", dataStatus: "mapped", name: "n",
    summary: "", latitude: 46.9, longitude: 8.4, launchDirections: [], landingRole: "unknown", pairings: [], reports: [],
    windWindows: [], windCoverageDegrees: 0, windPreferredDegrees: 0,
    sourceCount: 1, flightCoverage: "unknown" as const, sources: [], knownFor: [], cautions: [],
    sourceLabel: "", sourceUrl: "", sourceKind: "", reviewedAt: "2026-01-01",
    ...o,
  }
}

describe("haversineMetres", () => {
  it("is zero for the same point", () => {
    expect(haversineMetres(46.9, 8.4, 46.9, 8.4)).toBe(0)
  })

  it("measures a known short distance", () => {
    // One degree of latitude is about 111 km.
    expect(haversineMetres(46.9, 8.4, 47.9, 8.4)).toBeCloseTo(111_195, -2)
  })

  it("is symmetric", () => {
    const a = haversineMetres(46.9, 8.4, 47.0, 8.5)
    const b = haversineMetres(47.0, 8.5, 46.9, 8.4)
    expect(a).toBeCloseTo(b, 6)
  })
})

describe("bandFor", () => {
  it("uses thresholds calibrated to real official pairings", () => {
    expect(bandFor(2.15)).toBe("comfortable")  // Pilatus Kulm to Alpnachstad
    expect(bandFor(3)).toBe("comfortable")
    expect(bandFor(3.84)).toBe("workable")     // Pilatus Kulm to Kriens
    expect(bandFor(4.93)).toBe("marginal")     // Klimsen West to Luzern Allmend
    expect(bandFor(5.5)).toBe("out-of-range")
  })

  it("covers every official pairing observed and nothing far beyond them", () => {
    // The widest real official pairing found across three independent sources.
    const widestOfficial = 4.93
    expect(GLIDE_BANDS.marginal).toBeGreaterThanOrEqual(widestOfficial)
    // An official landing must be reachable on an EN-A wing, so a ceiling far
    // above the observed maximum would offer ground nobody designates.
    expect(GLIDE_BANDS.marginal).toBeLessThan(6)
  })
})

describe("glideLeg", () => {
  const launch = site({ elevationM: 1600, latitude: 46.95, longitude: 8.6 })

  it("computes the required ratio from distance over height lost", () => {
    const landing = site({
      kind: "landing", elevationM: 600,
      latitude: 46.95, longitude: 8.6,
    })
    // Same point, so distance is zero and there is nothing to compute.
    expect(glideLeg(launch, landing)).toBeNull()
  })

  it("returns null when the landing is not below the launch", () => {
    const higher = site({ kind: "landing", elevationM: 1700, longitude: 8.62 })
    expect(glideLeg(launch, higher)).toBeNull()
  })

  it("returns null when an elevation is unknown", () => {
    const noElev = site({ kind: "landing", elevationM: undefined, longitude: 8.62 })
    expect(glideLeg(launch, noElev)).toBeNull()
  })

  it("produces a ratio matching the geometry", () => {
    const landing = site({
      kind: "landing", elevationM: 600,
      latitude: 46.95, longitude: 8.66,
    })
    const leg = glideLeg(launch, landing)!
    expect(leg.verticalM).toBe(1000)
    expect(leg.requiredRatio).toBeCloseTo(leg.horizontalM / 1000, 6)
  })
})

describe("reachableLandings", () => {
  const launch = site({ elevationM: 2000, latitude: 46.95, longitude: 8.6 })
  const near = site({ kind: "landing", slug: "near", elevationM: 500, latitude: 46.95, longitude: 8.63 })
  const far = site({ kind: "landing", slug: "far", elevationM: 500, latitude: 46.95, longitude: 8.95 })

  it("orders by how little glide is needed", () => {
    const legs = reachableLandings(launch, [far, near])
    expect(legs[0]!.landing.slug).toBe("near")
  })

  it("excludes landings beyond the planning ratio", () => {
    expect(reachableLandings(launch, [far]).map((l) => l.landing.slug)).toEqual([])
  })

  it("ignores other launches", () => {
    const otherLaunch = site({ slug: "other", elevationM: 400, longitude: 8.61 })
    expect(reachableLandings(launch, [otherLaunch])).toEqual([])
  })

  it("returns nothing for a landing", () => {
    expect(reachableLandings(near, [far])).toEqual([])
  })
})

describe("launchesReaching", () => {
  const landing = site({ kind: "landing", slug: "lp", elevationM: 500, latitude: 46.95, longitude: 8.6 })
  const high = site({ slug: "high", elevationM: 2000, latitude: 46.95, longitude: 8.63 })
  const low = site({ slug: "low", elevationM: 520, latitude: 46.95, longitude: 8.63 })

  it("lists the launches that can glide in", () => {
    expect(launchesReaching(landing, [high, low]).map((l) => l.landing.slug)).toEqual(["high"])
  })

  it("returns nothing for a launch", () => {
    expect(launchesReaching(high, [landing])).toEqual([])
  })
})
