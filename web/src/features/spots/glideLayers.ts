import type { FeatureCollection, LineString } from "geojson"
import type { GeoJSONSource, Map } from "maplibre-gl"

import { reachableLandings } from "./glide"
import type { GlideBand } from "./glide"
import type { FlyingSite } from "./types"

/**
 * Draws the glides available from the active launch: one line per reachable
 * landing, labelled with the glide ratio that leg actually requires. Hovering
 * temporarily takes precedence over the selected launch. Colour is a shorthand
 * for the band, but the number is always drawn, because the number is the
 * thing a pilot can check their own wing against.
 */

export const GLIDE_SOURCE = "glide-legs"
export const GLIDE_LINE_LAYER = "glide-legs-line"
export const GLIDE_LABEL_LAYER = "glide-legs-label"

interface GlideFeatureProperties {
  ratio: number
  ratioLabel: string
  band: GlideBand
  landingName: string
}

/**
 * A hover is a short-lived preview; a selected launch is the durable map
 * context. Keeping this decision outside the MapLibre event handlers means a
 * mouseleave can restore the selected launch instead of blanking the overlay.
 */
export function activeGlideLaunch(
  sites: FlyingSite[],
  selectedSlug?: string,
  hoveredLaunchSlug?: string,
): FlyingSite | undefined {
  const hovered = sites.find((site) => site.slug === hoveredLaunchSlug)
  if (hovered?.kind === "launch") return hovered

  const selected = sites.find((site) => site.slug === selectedSlug)
  return selected?.kind === "launch" ? selected : undefined
}

export function glideGeoJson(
  launch: FlyingSite | undefined,
  sites: FlyingSite[],
): FeatureCollection<LineString, GlideFeatureProperties> {
  if (!launch || launch.kind !== "launch") {
    return { type: "FeatureCollection", features: [] }
  }

  return {
    type: "FeatureCollection",
    features: reachableLandings(launch, sites).map((leg) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [launch.longitude, launch.latitude],
          [leg.landing.longitude, leg.landing.latitude],
        ],
      },
      properties: {
        ratio: leg.requiredRatio,
        ratioLabel: `${leg.requiredRatio.toFixed(1)}:1`,
        band: leg.band,
        landingName: leg.landing.name,
      },
    })),
  }
}

const BAND_COLOUR = [
  "match",
  ["get", "band"],
  "comfortable", "#5fd68a",
  "workable", "#dfff45",
  "marginal", "#f2a24b",
  "#6f7a73",
] as const

export function addGlideLayers(map: Map, beforeId?: string) {
  if (map.getSource(GLIDE_SOURCE)) return

  map.addSource(GLIDE_SOURCE, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  })

  map.addLayer(
    {
      id: GLIDE_LINE_LAYER,
      type: "line",
      source: GLIDE_SOURCE,
      layout: { "line-cap": "round" },
      paint: {
        "line-color": BAND_COLOUR as unknown as string,
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.6, 14, 3.4],
        "line-opacity": 0.9,
        // Dashes read as "planning aid", not as a surveyed route.
        "line-dasharray": [2, 1.4],
      },
    },
    beforeId,
  )

  map.addLayer(
    {
      id: GLIDE_LABEL_LAYER,
      type: "symbol",
      source: GLIDE_SOURCE,
      layout: {
        "symbol-placement": "line-center",
        "text-field": ["get", "ratioLabel"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 12,
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#12201a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.6,
      },
    },
    beforeId,
  )
}

export function setGlideData(
  map: Map,
  launch: FlyingSite | undefined,
  sites: FlyingSite[],
) {
  const source = map.getSource(GLIDE_SOURCE) as GeoJSONSource | undefined
  source?.setData(glideGeoJson(launch, sites))
}
