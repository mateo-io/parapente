import { describe, expect, it } from "vitest"

import { isInsideSwitzerland, wgs84ToLv95 } from "./swissCoords"

describe("wgs84ToLv95", () => {
  it("places Buochs on the LV95 grid", () => {
    // Verified against the swisstopo height service, which returned 437.6 m
    // for this LV95 pair; lake level at Buochs is about 434 m.
    const { easting, northing } = wgs84ToLv95(46.9747, 8.4147)
    expect(easting).toBeCloseTo(2674269.5, 0)
    expect(northing).toBeCloseTo(1203086.9, 0)
  })

  it("carries the CH1903 to WGS84 datum shift at the Bern reference point", () => {
    // The published approximation folds the datum shift into its constants, so
    // the old observatory lands 72 m east and 147 m north of the LV95 origin
    // rather than exactly on it. Asserting the offset keeps that intentional.
    const { easting, northing } = wgs84ToLv95(46.9524055556, 7.4395833333)
    expect(easting).toBeCloseTo(2600072.37, 1)
    expect(northing).toBeCloseTo(1200147.07, 1)
  })

  it("places the Pilatus ridge high on the grid", () => {
    // Verified against the swisstopo height service, which returned 2089 m.
    const { easting, northing } = wgs84ToLv95(46.979, 8.2525)
    expect(easting).toBeCloseTo(2661923, 0)
    expect(northing).toBeCloseTo(1203424, 0)
  })

  it("rejects points outside the Swiss grid", () => {
    expect(isInsideSwitzerland(wgs84ToLv95(46.9747, 8.4147))).toBe(true)
    expect(isInsideSwitzerland(wgs84ToLv95(48.8566, 2.3522))).toBe(false)
  })
})
