import type { GeoJSONSource, Map } from "maplibre-gl"

/**
 * Cables and power lines drawn as inspectable lines.
 *
 * The federal obstacle register is authoritative but WMS-only, so it can be
 * shown and not queried. These vectors let a pilot click a wire and see what it
 * is. Neither source includes temporary cables put up for forestry or
 * construction, which is precisely what local sheets warn about, so the layer
 * says so rather than implying completeness.
 */

export const HAZARD_SOURCE = "hazards"
export const HAZARD_LAYER = "hazards-line"
export const HAZARD_CASING_LAYER = "hazards-casing"

export type HazardKind =
  | "power_line"
  | "minor_power_line"
  | "cableway"
  | "material_ropeway"
  | "other"

/** Transmission lines read hottest; material ropeways are the thin surprise. */
const KIND_COLOUR = [
  "match",
  ["get", "kind"],
  "power_line", "#ed4b3a",
  "minor_power_line", "#f2a24b",
  "cableway", "#c46bd8",
  "material_ropeway", "#f2c84b",
  "#8a949a",
] as const

export function hazardLabel(kind: HazardKind): string {
  const names: Record<HazardKind, string> = {
    power_line: "Power line",
    minor_power_line: "Minor power line",
    cableway: "Cableway",
    material_ropeway: "Material ropeway",
    other: "Obstacle",
  }
  return names[kind] ?? names.other
}

/** Volts to a readable label; 380000 reads as 380 kV. */
export function formatVoltage(voltage: number | null | undefined) {
  if (!voltage || !Number.isFinite(voltage)) return null
  return voltage >= 1000
    ? `${Math.round(voltage / 1000)} kV`
    : `${voltage} V`
}

export function addHazardLayers(map: Map, beforeId?: string) {
  if (map.getSource(HAZARD_SOURCE)) return

  map.addSource(HAZARD_SOURCE, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  })

  // A wide transparent casing gives the thin lines a usable click target.
  map.addLayer(
    {
      id: HAZARD_CASING_LAYER,
      type: "line",
      source: HAZARD_SOURCE,
      paint: { "line-color": "#000000", "line-opacity": 0, "line-width": 14 },
    },
    beforeId,
  )

  map.addLayer(
    {
      id: HAZARD_LAYER,
      type: "line",
      source: HAZARD_SOURCE,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": KIND_COLOUR as unknown as string,
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["case", ["==", ["get", "kind"], "power_line"], 1.8, 1],
          14, ["case", ["==", ["get", "kind"], "power_line"], 4, 2.4],
        ],
        "line-opacity": 0.9,
      },
    },
    beforeId,
  )
}

export function setHazardData(map: Map, data: GeoJSON.FeatureCollection) {
  const source = map.getSource(HAZARD_SOURCE) as GeoJSONSource | undefined
  source?.setData(data)
}
