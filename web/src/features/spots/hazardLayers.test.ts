import { describe, expect, it } from "vitest"

import { formatVoltage, hazardLabel } from "./hazardLayers"

describe("formatVoltage", () => {
  it("reads high voltage in kV", () => {
    expect(formatVoltage(380000)).toBe("380 kV")
    expect(formatVoltage(50000)).toBe("50 kV")
  })

  it("keeps low voltage in volts", () => {
    expect(formatVoltage(400)).toBe("400 V")
  })

  it("returns null rather than inventing a figure", () => {
    // Most OSM cableways carry no voltage tag at all.
    expect(formatVoltage(null)).toBeNull()
    expect(formatVoltage(undefined)).toBeNull()
    expect(formatVoltage(0)).toBeNull()
    expect(formatVoltage(Number.NaN)).toBeNull()
  })
})

describe("hazardLabel", () => {
  it("names each kind", () => {
    expect(hazardLabel("power_line")).toBe("Power line")
  })

  it("falls back rather than showing a raw key", () => {
    expect(hazardLabel("other")).toBe("Obstacle")
  })
})
