import type { Map, RasterLayerSpecification, RasterSourceSpecification } from "maplibre-gl"

import type { MapLocale } from "./types"

/**
 * The base style is a token-free OpenStreetMap vector style. Terrain comes from
 * swisstopo as opt-in raster overlays, so the map still renders outside
 * Switzerland and the first paint stays cheap. OpenFreeMap publishes matching
 * light and dark styles; choosing between them keeps the map aligned with the
 * browser's operating-system appearance.
 */
export type MapTheme = "light" | "dark"

const BASE_STYLE_URLS: Record<MapTheme, string> = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://tiles.openfreemap.org/styles/dark",
}

export function baseStyleFor(theme: MapTheme) {
  return BASE_STYLE_URLS[theme]
}

export const BASE_ATTRIBUTION =
  '<a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'

/**
 * swisstopo publishes these as open government data. Use is free, commercial
 * use is permitted, and no key is required, provided the source is credited.
 * Excessive request volume may be throttled by swisstopo.
 * https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices
 */
const SWISSTOPO_ATTRIBUTION =
  '&copy; <a href="https://www.swisstopo.admin.ch/" target="_blank" rel="noreferrer">swisstopo</a>'

const BAFU_ATTRIBUTION =
  '&copy; <a href="https://www.bafu.admin.ch/" target="_blank" rel="noreferrer">BAFU</a>'

export type OverlayId =
  | "topo"
  | "hillshade"
  | "slope30"
  | "aerial"
  | "wildlife"

export interface OverlayDefinition {
  id: OverlayId
  /** WMTS layer identifier on wmts.geo.admin.ch. */
  wmtsLayer: string
  format: "jpeg" | "png"
  opacity: number
  attribution: string
  label: Record<MapLocale, string>
  /** Shown next to the toggle so the layer is not mistaken for a judgement. */
  caption: Record<MapLocale, string>
}

/**
 * Ordered bottom to top. Opaque basemap-style layers come first so the
 * translucent analysis layers read on top of them.
 */
export const OVERLAYS: OverlayDefinition[] = [
  {
    id: "topo",
    wmtsLayer: "ch.swisstopo.pixelkarte-farbe",
    format: "jpeg",
    opacity: 1,
    attribution: SWISSTOPO_ATTRIBUTION,
    label: { en: "Swiss topo map", de: "Landeskarte" },
    caption: {
      en: "National topographic map with contours and paths.",
      de: "Landeskarte mit Höhenkurven und Wegen.",
    },
  },
  {
    id: "aerial",
    wmtsLayer: "ch.swisstopo.swissimage",
    format: "jpeg",
    opacity: 1,
    attribution: SWISSTOPO_ATTRIBUTION,
    label: { en: "Aerial imagery", de: "Luftbild" },
    caption: {
      en: "SWISSIMAGE orthophoto. Vegetation and surfaces.",
      de: "SWISSIMAGE-Orthofoto. Vegetation und Oberflächen.",
    },
  },
  {
    id: "hillshade",
    wmtsLayer: "ch.swisstopo.swissalti3d-reliefschattierung",
    format: "png",
    opacity: 0.65,
    attribution: SWISSTOPO_ATTRIBUTION,
    label: { en: "Relief shading", de: "Reliefschattierung" },
    caption: {
      en: "Terrain shape from the swissALTI3D elevation model.",
      de: "Geländeform aus dem Höhenmodell swissALTI3D.",
    },
  },
  {
    id: "slope30",
    wmtsLayer: "ch.swisstopo.hangneigung-ueber_30",
    format: "png",
    opacity: 0.55,
    attribution: SWISSTOPO_ATTRIBUTION,
    label: { en: "Slope over 30°", de: "Hangneigung über 30°" },
    caption: {
      en: "Orientation aid for terrain steepness. Not a launch assessment.",
      de: "Orientierungshilfe zur Steilheit. Keine Startplatzbewertung.",
    },
  },
  {
    id: "wildlife",
    wmtsLayer: "ch.bafu.wrz-wildruhezonen_portal",
    format: "png",
    opacity: 0.7,
    attribution: BAFU_ATTRIBUTION,
    label: { en: "Wildlife rest zones", de: "Wildruhezonen" },
    caption: {
      en: "Seasonal restrictions apply. Check the official rules and dates.",
      de: "Saisonale Einschränkungen. Offizielle Regeln und Daten prüfen.",
    },
  },
]

export const OVERLAY_IDS = OVERLAYS.map((overlay) => overlay.id)

export function findOverlay(id: OverlayId) {
  return OVERLAYS.find((overlay) => overlay.id === id)
}

export function sourceIdFor(id: OverlayId) {
  return `overlay-${id}`
}

export function layerIdFor(id: OverlayId) {
  return `overlay-${id}-raster`
}

export function tileUrlFor(overlay: OverlayDefinition) {
  return (
    `https://wmts.geo.admin.ch/1.0.0/${overlay.wmtsLayer}` +
    `/default/current/3857/{z}/{x}/{y}.${overlay.format}`
  )
}

export function rasterSourceFor(
  overlay: OverlayDefinition,
): RasterSourceSpecification {
  return {
    type: "raster",
    tiles: [tileUrlFor(overlay)],
    tileSize: 256,
    minzoom: 7,
    maxzoom: 17,
    attribution: overlay.attribution,
  }
}

export function rasterLayerFor(
  overlay: OverlayDefinition,
): RasterLayerSpecification {
  return {
    id: layerIdFor(overlay.id),
    type: "raster",
    source: sourceIdFor(overlay.id),
    paint: { "raster-opacity": overlay.opacity },
  }
}

/**
 * Overlays are inserted beneath this layer so flying-site markers are never
 * covered by terrain rasters.
 */
const FIRST_SITE_LAYER_ID = "site-clusters"

export function syncOverlays(map: Map, active: OverlayId[]) {
  const beforeId = map.getLayer(FIRST_SITE_LAYER_ID)
    ? FIRST_SITE_LAYER_ID
    : undefined

  // Layers are torn down and rebuilt in registry order on every sync so the
  // stacking is deterministic. Adding only the newly toggled layer would stack
  // it by toggle order instead, letting an opaque basemap hide the analysis
  // layers beneath it.
  for (const overlay of OVERLAYS) {
    const layerId = layerIdFor(overlay.id)
    if (map.getLayer(layerId)) map.removeLayer(layerId)
  }

  for (const overlay of OVERLAYS) {
    const sourceId = sourceIdFor(overlay.id)
    if (active.includes(overlay.id)) continue
    if (map.getSource(sourceId)) map.removeSource(sourceId)
  }

  for (const overlay of OVERLAYS) {
    if (!active.includes(overlay.id)) continue
    const sourceId = sourceIdFor(overlay.id)
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, rasterSourceFor(overlay))
    }
    map.addLayer(rasterLayerFor(overlay), beforeId)
  }
}
