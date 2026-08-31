import { describe, expect, it } from "vitest"

import { parseStationCsv, parseSwissTimestamp } from "./stationFeed"

const HEADER =
  "station_abbr;reference_timestamp;tre200s0;fkl010z1;fkl010z0;dkl010z0"

describe("parseSwissTimestamp", () => {
  it("reads the MeteoSwiss format as UTC", () => {
    expect(parseSwissTimestamp("28.08.2026 00:10")).toBe(
      "2026-08-28T00:10:00Z",
    )
  })

  it("falls back rather than throwing on an unexpected format", () => {
    expect(parseSwissTimestamp("nonsense")).toMatch(/^\d{4}-/)
    expect(parseSwissTimestamp(undefined)).toMatch(/^\d{4}-/)
  })
})

describe("parseStationCsv", () => {
  it("takes the most recent row", () => {
    const csv = [
      HEADER,
      "GES;28.08.2026 00:00;29.8;11.5;4;115",
      "GES;28.08.2026 00:10;29.4;13.9;3.8;69",
    ].join("\n")

    expect(parseStationCsv("ges", csv)).toEqual({
      code: "ges",
      bearingDeg: 69,
      speedKmh: 3.8,
      gustKmh: 13.9,
      observedAt: "2026-08-28T00:10:00Z",
      provider: "meteoswiss",
    })
  })

  it("walks back past rows with no direction rather than reporting nothing", () => {
    const csv = [
      HEADER,
      "GES;28.08.2026 00:00;29.8;11.5;4;115",
      "GES;28.08.2026 00:10;29.4;;;",
    ].join("\n")
    const reading = parseStationCsv("ges", csv)!
    expect(reading.bearingDeg).toBe(115)
    expect(reading.observedAt).toBe("2026-08-28T00:00:00Z")
  })

  it("keeps a missing speed as null instead of zero", () => {
    const csv = [HEADER, "GES;28.08.2026 00:10;29.4;;;200"].join("\n")
    expect(parseStationCsv("ges", csv)?.speedKmh).toBeNull()
  })

  it("returns null when there is no usable row", () => {
    expect(parseStationCsv("ges", HEADER)).toBeNull()
    expect(parseStationCsv("ges", "")).toBeNull()
    expect(parseStationCsv("ges", [HEADER, "GES;28.08.2026 00:10;29;;;"].join("\n"))).toBeNull()
  })

  it("normalises an out-of-range bearing", () => {
    const csv = [HEADER, "GES;28.08.2026 00:10;29;1;2;370"].join("\n")
    expect(parseStationCsv("ges", csv)?.bearingDeg).toBe(10)
  })
})
