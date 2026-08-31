import { describe, expect, it } from "vitest"

import { assessLeg, assessLegs, daysSince, evidenceLevel } from "./glideEvidence"
import type { GlideLeg } from "./glide"
import type { FlyingSite } from "./types"

const NOW = new Date("2026-08-29T12:00:00Z")

function landing(slug: string): FlyingSite {
  return {
    id: slug, slug, kind: "landing", dataStatus: "mapped", name: slug,
    summary: "", latitude: 46.9, longitude: 8.4, launchDirections: [],
    landingRole: "unknown", pairings: [], reports: [], windWindows: [],
    windCoverageDegrees: 0, windPreferredDegrees: 0, sourceCount: 1, flightCoverage: "unknown" as const,
    sources: [], knownFor: [], cautions: [], sourceLabel: "",
    sourceUrl: "", sourceKind: "", reviewedAt: "2026-01-01",
  }
}

function leg(slug: string, ratio: number): GlideLeg {
  return {
    landing: landing(slug), horizontalM: ratio * 1000, verticalM: 1000,
    requiredRatio: ratio, band: "workable",
  }
}

const recent = { flightCount: 20, providerCount: 1, lastSeen: "2026-08-01" }
const old = { flightCount: 20, providerCount: 1, lastSeen: "2023-01-01" }

describe("daysSince", () => {
  it("measures age and tolerates missing or broken dates", () => {
    expect(daysSince("2026-08-19", NOW)).toBe(10)
    expect(daysSince(null, NOW)).toBeNull()
    expect(daysSince("not-a-date", NOW)).toBeNull()
  })
})

describe("evidenceLevel", () => {
  it("treats no record as unconfirmed, never as impossible", () => {
    expect(evidenceLevel(undefined, NOW)).toBe("unconfirmed")
    expect(evidenceLevel({ flightCount: 0, providerCount: 0 }, NOW)).toBe("unconfirmed")
  })

  it("separates a handful of flights from an established connection", () => {
    expect(evidenceLevel({ flightCount: 4, providerCount: 1, lastSeen: "2026-08-01" }, NOW)).toBe("sparse")
    expect(evidenceLevel(recent, NOW)).toBe("confirmed")
  })

  it("calls a connection that stopped lapsed, not confirmed", () => {
    // Many flights, but none for years. Access may have been withdrawn, which a
    // flight count alone would hide entirely.
    expect(evidenceLevel(old, NOW)).toBe("lapsed")
  })
})

describe("coverage gates what an absence means", () => {
  it("flags an easy unflown line only where the record is near complete", () => {
    expect(assessLeg(leg("a", 3), undefined, "near_complete", NOW).suspect).toBe(true)
  })

  it("stays silent where coverage is partial or unknown", () => {
    // Outside Switzerland an absence says nothing about the site, only about
    // the dataset, so presenting it as doubt would invent information.
    expect(assessLeg(leg("a", 3), undefined, "partial", NOW).suspect).toBe(false)
    expect(assessLeg(leg("a", 3), undefined, "unknown", NOW).suspect).toBe(false)
    expect(assessLeg(leg("a", 3), undefined, undefined, NOW).suspect).toBe(false)
  })

  it("does not flag a glide near the official ceiling with no flights", () => {
    expect(assessLeg(leg("b", 4.9), undefined, "near_complete", NOW).suspect).toBe(false)
  })

  it("does not flag a connection people actually fly", () => {
    expect(assessLeg(leg("c", 3), recent, "near_complete", NOW).suspect).toBe(false)
  })

  it("never marks an unconfirmed pair as unreachable", () => {
    const assessed = assessLeg(leg("a", 3), undefined, "near_complete", NOW)
    expect(assessed.evidenceLevel).toBe("unconfirmed")
    expect(assessed.requiredRatio).toBe(3)
    expect(assessed.band).toBe("workable")
  })
})

describe("assessLegs", () => {
  it("puts what people fly ahead of what geometry merely permits", () => {
    const ordered = assessLegs(
      [leg("easy-unflown", 2), leg("flown", 5)],
      { flown: recent },
      "near_complete",
      NOW,
    )
    expect(ordered.map((l) => l.landing.slug)).toEqual(["flown", "easy-unflown"])
  })

  it("ranks a lapsed connection above one never recorded", () => {
    const ordered = assessLegs(
      [leg("never", 2), leg("lapsed", 5)],
      { lapsed: old },
      "near_complete",
      NOW,
    )
    expect(ordered.map((l) => l.landing.slug)).toEqual(["lapsed", "never"])
  })

  it("breaks ties within a level by required glide", () => {
    const ordered = assessLegs([leg("far", 6), leg("near", 2)], {}, "unknown", NOW)
    expect(ordered.map((l) => l.landing.slug)).toEqual(["near", "far"])
  })
})
