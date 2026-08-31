import { describe, expect, it } from "vitest"

import {
  arcCoverageDegrees,
  bearingForPoint,
  mergeArcs,
  normaliseBearing,
  parseWindSpec,
  supportsBearing,
} from "./windDirections"

describe("compass parsing", () => {
  it("reads English and German compass points", () => {
    expect(bearingForPoint("N")).toBe(0)
    expect(bearingForPoint("SE")).toBe(135)
    expect(bearingForPoint("SO")).toBe(135) // Südost
    expect(bearingForPoint("O")).toBe(90) // Ost
    expect(bearingForPoint("NO")).toBe(45)
  })

  it("normalises bearings onto 0-360", () => {
    expect(normaliseBearing(-22.5)).toBe(337.5)
    expect(normaliseBearing(380)).toBe(20)
    expect(normaliseBearing(360)).toBe(0)
  })
})

describe("parseWindSpec", () => {
  it("expands a single point to a 45 degree arc", () => {
    expect(parseWindSpec("W")).toEqual([{ fromDeg: 247.5, toDeg: 292.5 }])
  })

  it("expands a range across its outer edges", () => {
    expect(parseWindSpec("SO-SW")).toEqual([{ fromDeg: 112.5, toDeg: 247.5 }])
  })

  it("merges a comma separated list into one contiguous arc", () => {
    expect(parseWindSpec("S,SE")).toEqual([{ fromDeg: 112.5, toDeg: 202.5 }])
  })

  it("splits an arc that crosses north so every arc ascends", () => {
    const arcs = parseWindSpec("N")
    expect(arcs).toEqual([
      { fromDeg: 0, toDeg: 22.5 },
      { fromDeg: 337.5, toDeg: 360 },
    ])
    for (const arc of arcs) expect(arc.fromDeg).toBeLessThanOrEqual(arc.toDeg)
  })

  it("ignores tokens it cannot read", () => {
    expect(parseWindSpec("banana")).toEqual([])
    expect(parseWindSpec("")).toEqual([])
    expect(parseWindSpec("NW, banana")).toEqual([
      { fromDeg: 292.5, toDeg: 337.5 },
    ])
  })
})

describe("supportsBearing", () => {
  it("matches a wind inside the arc", () => {
    const west = parseWindSpec("W")
    expect(supportsBearing(west, 270)).toBe(true)
    expect(supportsBearing(west, 250)).toBe(true)
    expect(supportsBearing(west, 200)).toBe(false)
  })

  it("matches across the north wrap", () => {
    const north = parseWindSpec("N")
    expect(supportsBearing(north, 350)).toBe(true)
    expect(supportsBearing(north, 10)).toBe(true)
    expect(supportsBearing(north, 180)).toBe(false)
  })
})

describe("ranking helpers", () => {
  it("measures how forgiving a launch is", () => {
    expect(arcCoverageDegrees(parseWindSpec("W"))).toBe(45)
    expect(arcCoverageDegrees(parseWindSpec("SO-SW"))).toBe(135)
    expect(arcCoverageDegrees(parseWindSpec("N"))).toBe(45)
  })

  it("collapses overlapping arcs", () => {
    expect(
      mergeArcs([
        { fromDeg: 0, toDeg: 90 },
        { fromDeg: 45, toDeg: 180 },
      ]),
    ).toEqual([{ fromDeg: 0, toDeg: 180 }])
  })
})
