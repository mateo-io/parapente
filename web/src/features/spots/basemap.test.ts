import { describe, expect, it } from "vitest"

import {
  BASE_ATTRIBUTION,
  OVERLAYS,
  baseStyleFor,
  findOverlay,
  layerIdFor,
  rasterSourceFor,
  sourceIdFor,
  tileUrlFor,
} from "./basemap"

describe("basemap overlay registry", () => {
  it("selects the matching OpenFreeMap style for either system appearance", () => {
    expect(baseStyleFor("light")).toBe(
      "https://tiles.openfreemap.org/styles/liberty",
    )
    expect(baseStyleFor("dark")).toBe(
      "https://tiles.openfreemap.org/styles/dark",
    )
  })

  it("gives every overlay a unique id, source id and layer id", () => {
    const ids = OVERLAYS.map((overlay) => overlay.id)
    const sourceIds = OVERLAYS.map((overlay) => sourceIdFor(overlay.id))
    const layerIds = OVERLAYS.map((overlay) => layerIdFor(overlay.id))

    expect(new Set(ids).size).toBe(OVERLAYS.length)
    expect(new Set(sourceIds).size).toBe(OVERLAYS.length)
    expect(new Set(layerIds).size).toBe(OVERLAYS.length)
    expect(new Set([...sourceIds, ...layerIds]).size).toBe(OVERLAYS.length * 2)
  })

  it("builds WMTS urls with the maplibre tile placeholders intact", () => {
    for (const overlay of OVERLAYS) {
      const url = tileUrlFor(overlay)
      expect(url).toContain(`/${overlay.wmtsLayer}/`)
      expect(url).toContain("{z}/{x}/{y}")
      expect(url.endsWith(`.${overlay.format}`)).toBe(true)
      expect(url.startsWith("https://wmts.geo.admin.ch/")).toBe(true)
    }
  })

  it("credits the data owner on every overlay source", () => {
    for (const overlay of OVERLAYS) {
      expect(rasterSourceFor(overlay).attribution).toBe(overlay.attribution)
      expect(overlay.attribution).toMatch(/swisstopo|BAFU/)
    }
  })

  it("keeps the OpenStreetMap credit on the base style", () => {
    expect(BASE_ATTRIBUTION).toContain("OpenStreetMap")
  })

  it("labels and captions every overlay in both locales", () => {
    for (const overlay of OVERLAYS) {
      for (const locale of ["en", "de"] as const) {
        expect(overlay.label[locale].length).toBeGreaterThan(0)
        expect(overlay.caption[locale].length).toBeGreaterThan(0)
      }
    }
  })

  it("keeps raster opacity within range so overlays stay stackable", () => {
    for (const overlay of OVERLAYS) {
      expect(overlay.opacity).toBeGreaterThan(0)
      expect(overlay.opacity).toBeLessThanOrEqual(1)
    }
  })

  it("resolves overlays by id", () => {
    expect(findOverlay("slope30")?.wmtsLayer).toBe(
      "ch.swisstopo.hangneigung-ueber_30",
    )
  })
})
