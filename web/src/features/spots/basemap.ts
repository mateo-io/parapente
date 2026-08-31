import type { Map, RasterLayerSpecification, RasterSourceSpecification } from "maplibre-gl"


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

/**
 * Airspace is published by the Federal Office of Civil Aviation. A map layer is
 * an orientation aid and never a clearance: zones activate and deactivate, and
 * the Daily Airspace Bulletin Switzerland is the source that must be consulted
 * before a flight.
 */
const BAZL_ATTRIBUTION =
  '&copy; <a href="https://www.bazl.admin.ch/" target="_blank" rel="noreferrer">BAZL</a>'

const BAFU_ATTRIBUTION =
  '&copy; <a href="https://www.bafu.admin.ch/" target="_blank" rel="noreferrer">BAFU</a>'

export type OverlayId =
  | "topo"
  | "hillshade"
  | "slope30"
  | "aerial"
  | "wildlife"
  | "airspaceCtr"
  | "airspaceTma"
  | "obstacles"

export interface OverlayDefinition {
  id: OverlayId
  /**
   * Federal layers are published on two different services. Most are WMTS
   * tiles; the air-navigation obstacles are WMS only, which is why a WMTS
   * request for them returns HTTP 400.
   */
  service?: "wmts" | "wms"
  /** Layer identifier on the federal geo service. */
  wmtsLayer: string
  format: "jpeg" | "png"
  opacity: number
  attribution: string
  label: string
  /** Shown next to the toggle so the layer is not mistaken for a judgement. */
  caption: string
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
    label: "Swiss topo map",
    caption: "National topographic map with contours and paths.",
  },
  {
    id: "aerial",
    wmtsLayer: "ch.swisstopo.swissimage",
    format: "jpeg",
    opacity: 1,
    attribution: SWISSTOPO_ATTRIBUTION,
    label: "Aerial imagery",
    caption: "SWISSIMAGE orthophoto. Vegetation and surfaces.",
  },
  {
    id: "hillshade",
    wmtsLayer: "ch.swisstopo.swissalti3d-reliefschattierung",
    format: "png",
    opacity: 0.65,
    attribution: SWISSTOPO_ATTRIBUTION,
    label: "Relief shading",
    caption: "Terrain shape from the swissALTI3D elevation model.",
  },
  {
    id: "slope30",
    wmtsLayer: "ch.swisstopo.hangneigung-ueber_30",
    format: "png",
    opacity: 0.55,
    attribution: SWISSTOPO_ATTRIBUTION,
    label: "Slope over 30°",
    caption: "Orientation aid for terrain steepness. Not a launch assessment.",
  },
  {
    id: "airspaceCtr",
    wmtsLayer: "ch.bazl.luftraeume-kontrollzonen",
    format: "png",
    opacity: 0.6,
    attribution: BAZL_ATTRIBUTION,
    label: "Airspace · CTR",
    caption: "Control zones. Buochs, Emmen and Alpnach reach the lake. Not a clearance: check DABS.",
  },
  {
    id: "airspaceTma",
    wmtsLayer: "ch.bazl.luftraeume-nahkontrollbezirke",
    format: "png",
    opacity: 0.5,
    attribution: BAZL_ATTRIBUTION,
    label: "Airspace · TMA",
    caption: "Terminal control areas above the CTRs. Not a clearance: check DABS.",
  },
  {
    id: "obstacles",
    service: "wms",
    wmtsLayer: "ch.bazl.luftfahrthindernis",
    format: "png",
    opacity: 0.85,
    attribution: BAZL_ATTRIBUTION,
    label: "Cables and obstacles",
    caption: "Registered air-navigation obstacles: cableways, power lines, masts. Temporary cables are not in the register.",
  },
  {
    id: "wildlife",
    wmtsLayer: "ch.bafu.wrz-wildruhezonen_portal",
    format: "png",
    opacity: 0.7,
    attribution: BAFU_ATTRIBUTION,
    label: "Wildlife rest zones",
    caption: "Seasonal restrictions apply. Check the official rules and dates.",
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
  if (overlay.service === "wms") {
    // MapLibre substitutes {bbox-epsg-3857} per tile request.
    const params = new URLSearchParams({
      SERVICE: "WMS",
      VERSION: "1.3.0",
      REQUEST: "GetMap",
      LAYERS: overlay.wmtsLayer,
      STYLES: "",
      CRS: "EPSG:3857",
      WIDTH: "256",
      HEIGHT: "256",
      FORMAT: `image/${overlay.format}`,
      TRANSPARENT: "true",
    })
    return `https://wms.geo.admin.ch/?${params}&BBOX={bbox-epsg-3857}`
  }

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
