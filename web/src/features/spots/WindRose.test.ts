import { describe, expect, it } from "vitest"

import { SIZE, bandPath, polar } from "./windRoseGeometry"

const CENTRE = SIZE / 2

describe("polar", () => {
  it("puts north at the top and east at the right", () => {
    const north = polar(0, 80)
    expect(north.x).toBeCloseTo(CENTRE, 5)
    expect(north.y).toBeCloseTo(CENTRE - 80, 5)

    const east = polar(90, 80)
    expect(east.x).toBeCloseTo(CENTRE + 80, 5)
    expect(east.y).toBeCloseTo(CENTRE, 5)
  })

  it("runs clockwise, so south is below and west is left", () => {
    expect(polar(180, 50).y).toBeCloseTo(CENTRE + 50, 5)
    expect(polar(270, 50).x).toBeCloseTo(CENTRE - 50, 5)
  })
})

describe("bandPath", () => {
  it("draws a full ring as two arc pairs, not one degenerate arc", () => {
    const d = bandPath(0, 360, 82, 44)
    // A single 360 degree arc collapses to nothing, so a full ring needs two
    // half arcs per edge: four A commands in total.
    expect((d.match(/A /g) ?? []).length).toBe(4)
    expect(d.trim().endsWith("Z")).toBe(true)
  })

  it("sets the large-arc flag only past a half turn", () => {
    expect(bandPath(0, 90, 82, 44)).toContain("A 82 82 0 0 1")
    expect(bandPath(0, 270, 82, 44)).toContain("A 82 82 0 1 1")
  })

  it("closes a normal sector between both radii", () => {
    const d = bandPath(292.5, 337.5, 82, 44)
    expect(d.startsWith("M ")).toBe(true)
    expect(d).toContain("L ")
    expect(d.trim().endsWith("Z")).toBe(true)
    expect((d.match(/A /g) ?? []).length).toBe(2)
  })

  it("starts a north-west band above and left of centre", () => {
    const start = polar(292.5, 82)
    expect(start.x).toBeLessThan(CENTRE)
    expect(start.y).toBeLessThan(CENTRE)
  })
})
