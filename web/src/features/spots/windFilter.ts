import type { FlyingSite, WindWindow } from "./types"

/** Compass sectors offered in the filter, in the order they appear. */
export const COMPASS_SECTORS = [
  "N", "NE", "E", "SE", "S", "SW", "W", "NW",
] as const

export type CompassSector = (typeof COMPASS_SECTORS)[number]

const SECTOR_BEARINGS: Record<CompassSector, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
}

export function bearingForSector(sector: CompassSector) {
  return SECTOR_BEARINGS[sector]
}

export function supportsBearing(windows: WindWindow[], bearing: number) {
  const value = ((bearing % 360) + 360) % 360
  return windows.some(
    (window) => value >= window.fromDeg && value <= window.toDeg,
  )
}

/**
 * Three states, kept distinct on purpose. Sparse source data means most launches
 * have no published window, and showing those as "no" would imply 42 launches
 * are unflyable when the truth is that nothing is known about them.
 */
export type WindMatch = "works" | "does-not-work" | "unknown"

export function matchSiteToWind(
  site: FlyingSite,
  bearing: number | null,
): WindMatch {
  if (site.kind !== "launch") return "unknown"
  if (bearing == null) return "unknown"
  if (!site.windWindows.length) return "unknown"
  return supportsBearing(site.windWindows, bearing) ? "works" : "does-not-work"
}

/**
 * Filters to launches known to work in the given wind. Sites with no wind data
 * are excluded from a positive filter, because including them would assert
 * something the data does not support.
 */
export function filterByWind(sites: FlyingSite[], bearing: number | null) {
  if (bearing == null) return sites
  return sites.filter(
    (site) =>
      site.kind !== "launch" || matchSiteToWind(site, bearing) === "works",
  )
}

export function countWindMatches(sites: FlyingSite[], bearing: number | null) {
  const counts = { works: 0, "does-not-work": 0, unknown: 0 }
  for (const site of sites) {
    if (site.kind !== "launch") continue
    counts[matchSiteToWind(site, bearing)] += 1
  }
  return counts
}
