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

  it("builds tile urls with the maplibre placeholders intact, per service", () => {
    for (const overlay of OVERLAYS) {
      const url = tileUrlFor(overlay)

      if (overlay.service === "wms") {
        // Air-navigation obstacles are WMS only; a WMTS request 400s.
        expect(url.startsWith("https://wms.geo.admin.ch/")).toBe(true)
        expect(url).toContain("{bbox-epsg-3857}")
        expect(url).toContain(`LAYERS=${overlay.wmtsLayer}`)
        continue
      }

      expect(url).toContain(`/${overlay.wmtsLayer}/`)
      expect(url).toContain("{z}/{x}/{y}")
      expect(url.endsWith(`.${overlay.format}`)).toBe(true)
      expect(url.startsWith("https://wmts.geo.admin.ch/")).toBe(true)
    }
  })

  it("credits the data owner on every overlay source", () => {
    for (const overlay of OVERLAYS) {
      expect(rasterSourceFor(overlay).attribution).toBe(overlay.attribution)
      expect(overlay.attribution).toMatch(/swisstopo|BAFU|BAZL/)
    }
  })

  it("keeps the OpenStreetMap credit on the base style", () => {
    expect(BASE_ATTRIBUTION).toContain("OpenStreetMap")
  })
  it("labels and captions every overlay", () => {
    for (const overlay of OVERLAYS) {
      expect(overlay.label.length).toBeGreaterThan(0)
      expect(overlay.caption.length).toBeGreaterThan(0)
    }
  })

  it("keeps raster opacity within range so overlays stay stackable", () => {
    for (const overlay of OVERLAYS) {
      expect(overlay.opacity).toBeGreaterThan(0)
      expect(overlay.opacity).toBeLessThanOrEqual(1)
    }
  })

  it("warns on every airspace layer that it is not a clearance", () => {
    // Airspace zones activate and deactivate. A raster tile cannot express that,
    // so the caption must send the pilot to DABS rather than imply currency.
    for (const overlay of OVERLAYS) {
      if (!overlay.id.startsWith("airspace")) continue
      expect(overlay.caption).toMatch(/DABS/)
    }
  })

  it("resolves overlays by id", () => {
    expect(findOverlay("slope30")?.wmtsLayer).toBe(
      "ch.swisstopo.hangneigung-ueber_30",
    )
  })
})
