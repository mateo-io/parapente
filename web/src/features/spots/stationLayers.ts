import type { FeatureCollection, Point } from "geojson"
import type { GeoJSONSource, Map } from "maplibre-gl"

import type { FlyingSite } from "./types"

/**
 * Weather stations on the map. By default only the station backing the selected
 * site is drawn, because showing all 100 buries the flying sites. The "show all"
 * option exists for orientation, not for routine use.
 */

export const STATION_SOURCE = "weather-stations"
export const STATION_LAYER = "weather-stations-point"
export const STATION_LABEL_LAYER = "weather-stations-label"

export interface StationPoint {
  code: string
  latitude: number
  longitude: number
}

interface StationProperties {
  code: string
  active: boolean
}

export function stationGeoJson(
  stations: StationPoint[],
  activeCode?: string,
): FeatureCollection<Point, StationProperties> {
  return {
    type: "FeatureCollection",
    features: stations.map((station) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [station.longitude, station.latitude],
      },
      properties: {
        code: station.code.toUpperCase(),
        active: station.code === activeCode,
      },
    })),
  }
}

/**
 * Chooses what to draw: the selected site's station alone, or every station
 * when the user has asked for them.
 */
export function visibleStations(
  all: StationPoint[],
  selected: FlyingSite | undefined,
  showAll: boolean,
): { points: StationPoint[]; activeCode?: string } {
  const activeCode = selected?.station?.code

  if (showAll) return { points: all, activeCode }
  if (!activeCode) return { points: [], activeCode: undefined }

  const active = all.find((station) => station.code === activeCode)
  return { points: active ? [active] : [], activeCode }
}

export function addStationLayers(map: Map, beforeId?: string) {
  if (map.getSource(STATION_SOURCE)) return

  map.addSource(STATION_SOURCE, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  })

  map.addLayer(
    {
      id: STATION_LAYER,
      type: "circle",
      source: STATION_SOURCE,
      paint: {
        "circle-color": ["case", ["get", "active"], "#f2c84b", "#8a949a"],
        "circle-radius": ["case", ["get", "active"], 8, 5],
        "circle-stroke-color": "#12201a",
        "circle-stroke-width": 2,
        "circle-opacity": ["case", ["get", "active"], 1, 0.75],
      },
    },
    beforeId,
  )

  map.addLayer(
    {
      id: STATION_LABEL_LAYER,
      type: "symbol",
      source: STATION_SOURCE,
      // Only the active station is labelled; 100 labels would be unreadable.
      filter: ["get", "active"],
      layout: {
        "text-field": ["get", "code"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
        "text-offset": [0, 1.4],
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

export function setStationData(
  map: Map,
  stations: StationPoint[],
  activeCode?: string,
) {
  const source = map.getSource(STATION_SOURCE) as GeoJSONSource | undefined
  source?.setData(stationGeoJson(stations, activeCode))
}
