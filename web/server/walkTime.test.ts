import { describe, expect, it } from "vitest"

import { estimateWalkMinutes, resolveWalk } from "./walkTime"

describe("estimateWalkMinutes", () => {
  it("charges about 12 minutes per flat kilometre", () => {
    expect(estimateWalkMinutes(1000, 0)).toBe(12)
  })

  it("adds 10 minutes per 100 m of climb", () => {
    expect(estimateWalkMinutes(1000, 100)).toBe(22)
  })

  it("does not credit descent as time saved", () => {
    expect(estimateWalkMinutes(1000, -200)).toBe(12)
  })

  it("never reports less than a minute for a real walk", () => {
    // The Klewenalp launch is about 200 m from the mountain station.
    expect(estimateWalkMinutes(200, 0)).toBe(3)
    expect(estimateWalkMinutes(1, 0)).toBe(1)
  })

  it("rejects nonsense rather than propagating it", () => {
    expect(estimateWalkMinutes(Number.NaN, 0)).toBe(0)
    expect(estimateWalkMinutes(-5, 0)).toBe(0)
  })
})

describe("resolveWalk", () => {
  it("prefers a sourced figure and marks it verified", () => {
    expect(resolveWalk(8, 2000, 300)).toEqual({ minutes: 8, confidence: "verified" })
  })

  it("falls back to the estimate and says so", () => {
    expect(resolveWalk(null, 1000, 0)).toEqual({ minutes: 12, confidence: "estimated" })
    expect(resolveWalk(undefined, 200, 0).confidence).toBe("estimated")
  })

  it("treats zero as a real sourced value, not a missing one", () => {
    expect(resolveWalk(0, 5000, 900)).toEqual({ minutes: 0, confidence: "verified" })
  })
})
