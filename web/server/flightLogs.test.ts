import { describe, expect, it } from "vitest"

import { achievedRatio, matchSite, normaliseFlight, pseudonymisePilot } from "./flightLogs"
import type { MatchableSite } from "./flightLogs"

const sites: MatchableSite[] = [
  { id: "klewenalp", kind: "launch", latitude: 46.94038, longitude: 8.47301, elevationM: 1591 },
  { id: "beckenried", kind: "landing", latitude: 46.9628, longitude: 8.476, elevationM: 442 },
  { id: "other-launch", kind: "launch", latitude: 46.8, longitude: 8.2, elevationM: 1200 },
]

describe("matchSite", () => {
  it("matches a reported point to the nearest site of the right kind", () => {
    const match = matchSite(46.9404, 8.4731, sites, "launch")
    expect(match?.siteId).toBe("klewenalp")
    expect(match?.metres).toBeLessThan(50)
  })

  it("never matches across kinds", () => {
    expect(matchSite(46.94038, 8.47301, sites, "landing")).toBeNull()
  })

  it("leaves a distant point unmatched rather than forcing it", () => {
    expect(matchSite(47.5, 9.5, sites, "launch")).toBeNull()
  })

  it("handles a flight with no reported coordinates", () => {
    expect(matchSite(null, null, sites, "launch")).toBeNull()
    expect(matchSite(46.9, undefined, sites, "launch")).toBeNull()
  })
})

describe("achievedRatio", () => {
  it("computes the straight-line ratio actually flown", () => {
    const ratio = achievedRatio(sites[0], sites[1])!
    expect(ratio).toBeGreaterThan(1)
    expect(ratio).toBeLessThan(4)
  })

  it("refuses to invent a number when the landing is not below", () => {
    expect(achievedRatio(sites[1] as never, sites[0] as never)).toBeNull()
  })

  it("refuses when an elevation is unknown", () => {
    expect(achievedRatio({ ...sites[0]!, elevationM: null }, sites[1])).toBeNull()
    expect(achievedRatio(undefined, sites[1])).toBeNull()
  })
})

describe("normaliseFlight", () => {
  it("resolves both ends and records how loose each match was", () => {
    const result = normaliseFlight(
      {
        providerFlightId: "x1",
        flownOn: "2026-08-01",
        launchLatitude: 46.9404, launchLongitude: 8.4731,
        landingLatitude: 46.9629, landingLongitude: 8.4761,
      },
      sites,
    )
    expect(result.launchSiteId).toBe("klewenalp")
    expect(result.landingSiteId).toBe("beckenried")
    expect(result.launchMatchM).toBeLessThan(50)
    expect(result.achievedRatio).toBeGreaterThan(0)
  })

  it("keeps an unmatched flight rather than discarding it", () => {
    const result = normaliseFlight(
      { providerFlightId: "x2", flownOn: "2026-08-01",
        launchLatitude: 48.0, launchLongitude: 2.0 },
      sites,
    )
    expect(result.launchSiteId).toBeNull()
    expect(result.landingSiteId).toBeNull()
    expect(result.achievedRatio).toBeNull()
    expect(result.providerFlightId).toBe("x2")
  })
})

describe("pseudonymisePilot", () => {
  it("creates a stable UUID-shaped identifier without returning the source identity", () => {
    const identity = "Pilot Name From Approved Export"
    const ref = pseudonymisePilot("xcontest", identity, "test-only-secret")

    expect(ref).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(ref).toBe(pseudonymisePilot("xcontest", identity, "test-only-secret"))
    expect(ref).not.toContain(identity)
  })

  it("separates providers and changes when the import secret changes", () => {
    const first = pseudonymisePilot("provider-a", "same-source-id", "secret-one")
    expect(first).not.toBe(pseudonymisePilot("provider-b", "same-source-id", "secret-one"))
    expect(first).not.toBe(pseudonymisePilot("provider-a", "same-source-id", "secret-two"))
  })

  it("rejects values that could accidentally create a shared anonymous identity", () => {
    expect(() => pseudonymisePilot("", "pilot", "secret")).toThrow()
    expect(() => pseudonymisePilot("provider", "", "secret")).toThrow()
    expect(() => pseudonymisePilot("provider", "pilot", "")).toThrow()
  })
})
