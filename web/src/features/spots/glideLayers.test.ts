import { describe, expect, it } from "vitest"

import { activeGlideLaunch, glideGeoJson } from "./glideLayers"
import type { FlyingSite } from "./types"

function site(o: Partial<FlyingSite>): FlyingSite {
  return {
    id: "id", slug: "s", kind: "launch", dataStatus: "mapped", name: "n",
    summary: "", latitude: 46.95, longitude: 8.6, launchDirections: [], landingRole: "unknown", pairings: [], reports: [],
    windWindows: [], windCoverageDegrees: 0, windPreferredDegrees: 0,
    sourceCount: 1, flightCoverage: "unknown" as const, sources: [], knownFor: [], cautions: [],
    sourceLabel: "", sourceUrl: "", sourceKind: "", reviewedAt: "2026-01-01",
    ...o,
  }
}

const launch = site({ elevationM: 1600, name: "Launch" })
const near = site({
  kind: "landing", slug: "near", name: "Near",
  elevationM: 600, latitude: 46.95, longitude: 8.63,
})
const tooFar = site({
  kind: "landing", slug: "far", name: "Far",
  elevationM: 600, latitude: 46.95, longitude: 9.2,
})

describe("glideGeoJson", () => {
  it("draws one line per reachable landing, from launch to landing", () => {
    const fc = glideGeoJson(launch, [near, tooFar])
    expect(fc.features).toHaveLength(1)
    const [from, to] = fc.features[0]!.geometry.coordinates
    expect(from).toEqual([launch.longitude, launch.latitude])
    expect(to).toEqual([near.longitude, near.latitude])
  })

  it("labels each leg with the ratio that leg needs", () => {
    const props = glideGeoJson(launch, [near]).features[0]!.properties
    expect(props.ratioLabel).toMatch(/^\d+\.\d:1$/)
    expect(props.ratioLabel).toBe(`${props.ratio.toFixed(1)}:1`)
    expect(props.landingName).toBe("Near")
  })

  it("is empty with no launch hovered", () => {
    expect(glideGeoJson(undefined, [near]).features).toEqual([])
  })

  it("is empty when a landing is hovered", () => {
    expect(glideGeoJson(near, [tooFar]).features).toEqual([])
  })
})

describe("activeGlideLaunch", () => {
  it("keeps a selected launch active when nothing is hovered", () => {
    expect(activeGlideLaunch([launch, near], launch.slug)).toBe(launch)
  })

  it("uses a hovered launch as the temporary preview", () => {
    const other = site({ slug: "other", name: "Other" })
    expect(activeGlideLaunch([launch, other, near], launch.slug, other.slug)).toBe(other)
  })

  it("does not draw lines for a selected landing", () => {
    expect(activeGlideLaunch([launch, near], near.slug)).toBeUndefined()
  })
})
