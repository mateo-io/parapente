import { useCallback, useEffect, useMemo, useRef } from "react"
import type { FeatureCollection, Point } from "geojson"
import * as maplibregl from "maplibre-gl"
import type { GeoJSONSource, Map, MapLayerMouseEvent } from "maplibre-gl"

import { useSystemTheme } from "../../hooks/useSystemTheme"
import { BASE_ATTRIBUTION, baseStyleFor, syncOverlays } from "./basemap"
import type { MapTheme, OverlayId } from "./basemap"
import {
  MARKER_ICON_EXPRESSION,
  registerMarkerImages,
} from "./siteMarkers"
import { activeGlideLaunch, addGlideLayers, setGlideData } from "./glideLayers"
import {
  addStationLayers,
  setStationData,
  visibleStations,
} from "./stationLayers"
import type { StationPoint } from "./stationLayers"
import type { FlyingSite } from "./types"

interface LakeLucerneMapProps {
  sites: FlyingSite[]
  selectedSlug?: string
  onSelect: (slug: string) => void
  overlays: OverlayId[]
  stations: StationPoint[]
  showAllStations: boolean
}

interface SiteFeatureProperties {
  slug: string
  name: string
  kind: FlyingSite["kind"]
  status: FlyingSite["dataStatus"]
}

function toGeoJson(
  sites: FlyingSite[],
): FeatureCollection<Point, SiteFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: sites.map((site) => ({
      type: "Feature",
      id: site.id,
      geometry: {
        type: "Point",
        coordinates: [site.longitude, site.latitude],
      },
      properties: {
        slug: site.slug,
        name: site.name,
        kind: site.kind,
        status: site.dataStatus,
      },
    })),
  }
}

function addSiteLayers(
  map: Map,
  data: FeatureCollection<Point, SiteFeatureProperties>,
  theme: MapTheme,
) {
  if (map.getSource("flying-sites")) return

  const isDark = theme === "dark"

  map.addSource("flying-sites", {
    type: "geojson",
    data,
    cluster: true,
    clusterMaxZoom: 11,
    // Only collapse a group once it is genuinely dense. A bubble reading "2"
    // hides more than it summarises, so small groups stay as individual points
    // and are allowed to overlap instead.
    clusterMinPoints: 6,
    clusterRadius: 26,
  })

  map.addLayer({
    id: "site-clusters",
    type: "circle",
    source: "flying-sites",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": isDark ? "#eef7ef" : "#183126",
      "circle-radius": ["step", ["get", "point_count"], 16, 10, 21, 30, 26],
      "circle-stroke-color": isDark ? "#132117" : "#f7f3e8",
      "circle-stroke-width": 3,
      "circle-opacity": 0.94,
    },
  })

  map.addLayer({
    id: "site-cluster-count",
    type: "symbol",
    source: "flying-sites",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 12,
    },
    paint: { "text-color": isDark ? "#132117" : "#ffffff" },
  })

  map.addLayer({
    id: "selected-site-halo",
    type: "circle",
    source: "flying-sites",
    filter: ["==", ["get", "slug"], "__none__"],
    paint: {
      "circle-color": "#dfff45",
      "circle-radius": 19,
      "circle-opacity": 0.58,
      "circle-blur": 0.15,
    },
  })

  map.addLayer({
    id: "site-points",
    type: "symbol",
    source: "flying-sites",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": MARKER_ICON_EXPRESSION as unknown as string,
      // Badges grow with zoom but stay legible when zoomed out.
      "icon-size": ["interpolate", ["linear"], ["zoom"], 8, 0.78, 12, 1.05],
      // Overlapping markers are preferred over a cluster bubble, so collision
      // detection is disabled and the stacking order is made explicit instead.
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      // Landings sit above launches because a launch is easy to infer from the
      // hillside it is on and a landing field is not. Reviewed sits above both.
      "symbol-sort-key": [
        "-",
        0,
        [
          "+",
          ["case", ["==", ["get", "status"], "reviewed"], 10, 0],
          ["case", ["==", ["get", "kind"], "landing"], 2, 1],
        ],
      ],
    },
  })

  map.addLayer({
    id: "site-labels",
    type: "symbol",
    source: "flying-sites",
    filter: ["!", ["has", "point_count"]],
    minzoom: 11.4,
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 11,
      "text-offset": [0, 1.35],
      "text-anchor": "top",
      "text-allow-overlap": false,
    },
    paint: {
      "text-color": isDark ? "#edf5ee" : "#172a21",
      "text-halo-color": isDark ? "#132117" : "#ffffff",
      "text-halo-width": 1.5,
    },
  })
}

export function LakeLucerneMap({
  sites,
  selectedSlug,
  onSelect,
  overlays,
  stations,
  showAllStations,
}: LakeLucerneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const onSelectRef = useRef(onSelect)
  const overlaysRef = useRef(overlays)
  const sitesRef = useRef(sites)
  const selectedSlugRef = useRef(selectedSlug)
  const hoveredLaunchSlugRef = useRef<string | undefined>(undefined)
  const theme = useSystemTheme()
  const themeRef = useRef(theme)
  const data = useMemo(() => toGeoJson(sites), [sites])
  const dataRef = useRef(data)

  onSelectRef.current = onSelect
  overlaysRef.current = overlays
  sitesRef.current = sites
  selectedSlugRef.current = selectedSlug
  dataRef.current = data

  const restoreMapLayers = useCallback((map: Map) => {
    // Marker badges must exist before the symbol layer references them.
    // Registration is async, so the layers are added once the images resolve.
    void registerMarkerImages(map, themeRef.current)
      .catch(() => undefined)
      .finally(() => {
        if (!map.getStyle()) return
        addSiteLayers(map, dataRef.current, themeRef.current)
        // Glide lines sit beneath the markers so pins stay clickable.
        addGlideLayers(map, "site-clusters")
        setGlideData(
          map,
          activeGlideLaunch(
            sitesRef.current,
            selectedSlugRef.current,
            hoveredLaunchSlugRef.current,
          ),
          sitesRef.current,
        )
        addStationLayers(map, "site-clusters")
        syncOverlays(map, overlaysRef.current)

        if (map.getLayer("selected-site-halo")) {
          map.setFilter("selected-site-halo", [
            "==",
            ["get", "slug"],
            selectedSlugRef.current ?? "__none__",
          ])
        }
      })
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyleFor(themeRef.current),
      center: [8.43, 46.98],
      zoom: 9.25,
      minZoom: 7.5,
      maxZoom: 16,
      attributionControl: false,
    })

    mapRef.current = map
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "bottom-right",
    )
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: BASE_ATTRIBUTION,
      }),
      "bottom-right",
    )

    map.on("load", () => {
      restoreMapLayers(map)

      map.on("click", "site-clusters", async (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0]
        const clusterId = Number(feature?.properties?.cluster_id)
        if (!feature || !Number.isFinite(clusterId)) return

        const source = map.getSource("flying-sites") as GeoJSONSource
        const zoom = await source.getClusterExpansionZoom(clusterId)
        const coordinates = (feature.geometry as Point).coordinates
        map.easeTo({
          center: [coordinates[0]!, coordinates[1]!],
          zoom,
          duration: 480,
        })
      })

      map.on("mousemove", "site-points", (event: MapLayerMouseEvent) => {
        const slug = event.features?.[0]?.properties?.slug as string | undefined
        const kind = event.features?.[0]?.properties?.kind as string | undefined
        hoveredLaunchSlugRef.current = slug && kind === "launch" ? slug : undefined
        setGlideData(
          map,
          activeGlideLaunch(
            sitesRef.current,
            selectedSlugRef.current,
            hoveredLaunchSlugRef.current,
          ),
          sitesRef.current,
        )
      })

      map.on("mouseleave", "site-points", () => {
        hoveredLaunchSlugRef.current = undefined
        setGlideData(
          map,
          activeGlideLaunch(sitesRef.current, selectedSlugRef.current),
          sitesRef.current,
        )
      })

      map.on("click", "site-points", (event: MapLayerMouseEvent) => {
        const slug = event.features?.[0]?.properties?.slug as string | undefined
        if (slug) onSelectRef.current(slug)
      })

      for (const layer of ["site-clusters", "site-points"]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer"
        })
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = ""
        })
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [restoreMapLayers])

  useEffect(() => {
    const map = mapRef.current
    if (!map || theme === themeRef.current) return

    themeRef.current = theme
    map.once("style.load", () => {
      if (mapRef.current === map) restoreMapLayers(map)
    })
    map.setStyle(baseStyleFor(theme))
  }, [restoreMapLayers, theme])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    const source = map.getSource("flying-sites") as GeoJSONSource | undefined
    source?.setData(data)
  }, [data])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    syncOverlays(map, overlays)
  }, [overlays])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    const selected = sites.find((site) => site.slug === selectedSlug)
    const { points, activeCode } = visibleStations(
      stations,
      selected,
      showAllStations,
    )
    setStationData(map, points, activeCode)
  }, [stations, showAllStations, selectedSlug, sites])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded() || !map.getLayer("selected-site-halo")) return
    map.setFilter("selected-site-halo", [
      "==",
      ["get", "slug"],
      selectedSlug ?? "__none__",
    ])

    const selected = sites.find((site) => site.slug === selectedSlug)
    if (!hoveredLaunchSlugRef.current) {
      setGlideData(map, activeGlideLaunch(sites, selectedSlug), sites)
    }
    if (selected) {
      map.easeTo({
        center: [selected.longitude, selected.latitude],
        zoom: Math.max(map.getZoom(), 11.2),
        padding: { right: window.innerWidth > 760 ? 390 : 0 },
        duration: 520,
      })
    }
  }, [selectedSlug, sites])

  return <div className="lake-map" ref={containerRef} aria-label="Lake Lucerne flying-site map" />
}
