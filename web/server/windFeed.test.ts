import { describe, expect, it } from "vitest"

import { buildWindUrl, parseWindResponse } from "./windFeed"

describe("buildWindUrl", () => {
  it("requests the current wind fields in km/h and UTC", () => {
    const url = new URL(buildWindUrl(46.9747, 8.4147))
    expect(url.origin + url.pathname).toBe(
      "https://api.open-meteo.com/v1/forecast",
    )
    expect(url.searchParams.get("current")).toContain("wind_direction_10m")
    expect(url.searchParams.get("wind_speed_unit")).toBe("kmh")
    expect(url.searchParams.get("timezone")).toBe("UTC")
    expect(url.searchParams.get("latitude")).toBe("46.9747")
  })
})

describe("parseWindResponse", () => {
  it("reads a current observation", () => {
    const reading = parseWindResponse({
      current: {
        time: "2026-08-29T09:00",
        wind_speed_10m: 12.4,
        wind_direction_10m: 285,
        wind_gusts_10m: 21.1,
      },
    })
    expect(reading).toMatchObject({
      bearingDeg: 285,
      speedKmh: 12.4,
      gustKmh: 21.1,
      provider: "open-meteo",
    })
    expect(reading?.observedAt).toBe("2026-08-29T09:00Z")
  })

  it("normalises an out-of-range bearing", () => {
    expect(parseWindResponse({ current: { wind_direction_10m: 370, wind_speed_10m: 3 } })
      ?.bearingDeg).toBe(10)
  })

  it("returns null rather than inventing a reading", () => {
    expect(parseWindResponse({})).toBeNull()
    expect(parseWindResponse(null)).toBeNull()
    expect(parseWindResponse({ current: { wind_speed_10m: 5 } })).toBeNull()
    expect(
      parseWindResponse({ current: { wind_direction_10m: NaN, wind_speed_10m: 5 } }),
    ).toBeNull()
  })

  it("keeps a missing gust as null instead of zero", () => {
    expect(
      parseWindResponse({ current: { wind_direction_10m: 90, wind_speed_10m: 8 } })
        ?.gustKmh,
    ).toBeNull()
  })
})
