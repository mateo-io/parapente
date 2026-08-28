import { describe, expect, it } from "vitest"

import { parseSiteQuery } from "./siteQuery"

describe("parseSiteQuery", () => {
  it("uses safe Lake Lucerne defaults", () => {
    expect(parseSiteQuery({})).toEqual({
      locale: "en",
      kinds: ["launch", "landing"],
      bounds: [7.95, 46.72, 8.9, 47.28],
      search: undefined,
    })
  })

  it("accepts German, supported kinds, a bbox, and search", () => {
    expect(
      parseSiteQuery({
        lang: "de",
        types: "landing,weather_station,unknown",
        bbox: "8.1,46.8,8.7,47.2",
        search: "  Rigi  ",
      }),
    ).toEqual({
      locale: "de",
      kinds: ["landing", "weather_station"],
      bounds: [8.1, 46.8, 8.7, 47.2],
      search: "Rigi",
    })
  })

  it("falls back when bbox values are invalid", () => {
    expect(parseSiteQuery({ bbox: "8.1,nope,8.7,47.2" }).bounds).toEqual([
      7.95, 46.72, 8.9, 47.28,
    ])
  })
})
