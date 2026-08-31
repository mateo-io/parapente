import type { Map } from "maplibre-gl"

import type { MapTheme } from "./basemap"
import type { SiteKind } from "./types"

/**
 * Flying-site markers are drawn as icon badges rather than plain circles so a
 * launch and a landing stay distinguishable when they overlap. Glyph geometry
 * is taken from the same lucide set the sidebar uses, so the map legend and the
 * filter buttons read as one system.
 */

/** lucide `mountain`, on the 24x24 lucide viewBox. */
const LAUNCH_GLYPH = "m8 3 4 8 5-5 5 15H2L8 3z"

/** lucide `flag`, pole drawn separately so the fill stays open. */
const LANDING_GLYPH =
  "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
const LANDING_POLE = "M4 22V15"

/** lucide `cloud-sun`, reserved for the weather-station kind. */
const WEATHER_GLYPH = "M12 2v2M4.9 4.9l1.4 1.4M2 12h2M20 12h2M17.7 6.3l1.4-1.4"

export interface MarkerStyle {
  fill: string
  glyph: string
}

export const MARKER_STYLES: Record<SiteKind, MarkerStyle> = {
  launch: { fill: "#ed6748", glyph: LAUNCH_GLYPH },
  landing: { fill: "#4d9fe8", glyph: LANDING_GLYPH },
  weather_station: { fill: "#f2c84b", glyph: WEATHER_GLYPH },
}

/** Rendered size in CSS pixels before the pixel-ratio multiplier. */
const BADGE_SIZE = 30

export function markerImageId(kind: SiteKind, reviewed: boolean) {
  return `site-marker-${kind}-${reviewed ? "reviewed" : "mapped"}`
}

function badgeSvg(
  kind: SiteKind,
  reviewed: boolean,
  theme: MapTheme,
  size: number,
) {
  const style = MARKER_STYLES[kind]
  const ring = theme === "dark" ? "#132117" : "#ffffff"
  // A reviewed record earns a heavier ring, matching the existing convention.
  const ringWidth = reviewed ? 3 : 2
  const r = 12 - ringWidth / 2
  const isFlag = kind === "landing"

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="${r}" fill="${style.fill}" stroke="${ring}" stroke-width="${ringWidth}"/>
  <g transform="translate(12 12) scale(0.52) translate(-12 -12)"
     fill="none" stroke="${ring}" stroke-width="2.6"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="${style.glyph}"${kind === "launch" ? ` fill="${ring}"` : ""}/>
    ${isFlag ? `<path d="${LANDING_POLE}"/>` : ""}
  </g>
</svg>`
}

function loadImage(svg: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("marker image failed to decode"))
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

/**
 * Registers one image per kind and review state. Images are re-registered when
 * the theme changes so the ring keeps contrasting with the basemap.
 */
export async function registerMarkerImages(map: Map, theme: MapTheme) {
  const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3)
  const size = Math.round(BADGE_SIZE * ratio)

  for (const kind of Object.keys(MARKER_STYLES) as SiteKind[]) {
    for (const reviewed of [true, false]) {
      const id = markerImageId(kind, reviewed)
      const image = await loadImage(badgeSvg(kind, reviewed, theme, size))

      if (map.hasImage(id)) map.updateImage(id, image)
      else map.addImage(id, image, { pixelRatio: ratio })
    }
  }
}

/** Expression selecting the badge for a feature's kind and review state. */
export const MARKER_ICON_EXPRESSION = [
  "concat",
  "site-marker-",
  ["get", "kind"],
  "-",
  ["case", ["==", ["get", "status"], "reviewed"], "reviewed", "mapped"],
] as const
