/**
 * OpenStreetMap sometimes carries the same flying site twice: two polygons over
 * one field, or a node inside a way. Showing a pilot one landing as two is
 * worse than merging two neighbouring ones, so near-coincident points of the
 * same kind are collapsed into a single record.
 *
 * The threshold is deliberately tight. Verified pairs in the Lake Lucerne data:
 *   Zug Oberwil / Oberwil        0 m apart, identical bounding box  -> duplicate
 *   Gruob / Emmetten main      383 m apart, own address, 24 m lower -> distinct
 *   Wasserfall / Engelberg Wyden 388 m apart, distinct names        -> distinct
 * 150 m sits well clear of both real pairs while catching the true duplicate.
 */

/** Below this, two points of one kind are the same place whatever they are called. */
export const COINCIDENT_RADIUS_M = 60

/** Up to this, they are only merged when they also carry the same name. */
export const DUPLICATE_RADIUS_M = 150

const EARTH_RADIUS_M = 6_371_000

export function distanceMetres(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLon = toRad(bLon - aLon)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/**
 * Finds the actual closest matching record inside a deliberately bounded
 * radius. Importers must not use the first record returned by PostgreSQL: two
 * distinct launches can both be within the broad corroboration radius.
 */
export function closestWithin<T extends { latitude: number; longitude: number }>(
  candidates: T[],
  latitude: number,
  longitude: number,
  radiusM: number,
) {
  let closest: T | undefined
  let closestDistance = radiusM

  for (const candidate of candidates) {
    const distance = distanceMetres(latitude, longitude, candidate.latitude, candidate.longitude)
    if (distance <= closestDistance) {
      closest = candidate
      closestDistance = distance
    }
  }

  return closest
}

export interface DedupeCandidate {
  key: string
  kind: string
  latitude: number
  longitude: number
  /** Cleaned display name, used to separate distinct sites on one hill. */
  name: string
  /** Higher wins when two candidates describe the same place. */
  richness: number
}

function sameName(a: string, b: string) {
  const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ")
  return norm(a) === norm(b) && norm(a).length > 0
}

/**
 * Distance alone is not enough. Brienzer Rothorn has a south-east and a
 * north-east launch 87 m apart: one hill, two genuinely different sites. So a
 * merge needs either near-coincidence, or proximity plus the same name.
 */
export function isSamePlace(
  a: DedupeCandidate,
  b: DedupeCandidate,
  radiusM: number,
) {
  if (a.kind !== b.kind) return false

  const metres = distanceMetres(a.latitude, a.longitude, b.latitude, b.longitude)
  if (metres <= COINCIDENT_RADIUS_M) return true
  return metres <= radiusM && sameName(a.name, b.name)
}

export interface DedupeResult<T extends DedupeCandidate> {
  kept: T
  /** Duplicates folded into `kept`, retained so provenance is not lost. */
  merged: T[]
}

/**
 * Groups candidates of the same kind that fall within the radius, keeping the
 * richest of each group. Comparison is transitive within a group: a chain of
 * near points collapses to one record.
 */
export function dedupeByProximity<T extends DedupeCandidate>(
  candidates: T[],
  radiusM: number = DUPLICATE_RADIUS_M,
): DedupeResult<T>[] {
  const groups: T[][] = []

  for (const candidate of candidates) {
    const group = groups.find((existing) =>
      existing.some((member) => isSamePlace(member, candidate, radiusM)),
    )

    if (group) group.push(candidate)
    else groups.push([candidate])
  }

  return groups.map((group) => {
    const sorted = [...group].sort(
      (a, b) => b.richness - a.richness || a.key.localeCompare(b.key),
    )
    return { kept: sorted[0]!, merged: sorted.slice(1) }
  })
}
