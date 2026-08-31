/**
 * Wind suitability is stored as arcs of compass bearing, in degrees, describing
 * the direction the wind blows FROM. Arcs are the sortable, indexable form:
 * "does this launch work in a 015° wind" becomes a range containment test
 * rather than string matching against labels like "N" or "NNO".
 *
 * Bearings are circular, so an arc that crosses north is split into two rows
 * (e.g. 337.5-360 and 0-22.5). Every stored arc therefore satisfies
 * fromDeg <= toDeg, which keeps SQL containment simple and index friendly.
 */

export interface WindArc {
  fromDeg: number
  toDeg: number
}

/** Half-width applied to a single compass point, so "NW" spans 292.5-337.5. */
const POINT_HALF_WIDTH = 22.5

/**
 * 16-point compass in English plus the German forms used on Swiss sources,
 * where O is Ost (east) and the compounds run NO, SO, SW, NW.
 */
const COMPASS_POINTS: Record<string, number> = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
  E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
  W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
  // German
  O: 90, NNO: 22.5, NO: 45, ONO: 67.5,
  OSO: 112.5, SO: 135, SSO: 157.5,
}

export function normaliseBearing(degrees: number) {
  return ((degrees % 360) + 360) % 360
}

export function bearingForPoint(token: string): number | undefined {
  return COMPASS_POINTS[token.trim().toUpperCase().replace(/[^A-Z]/g, "")]
}

/** Splits an arc that crosses north into ascending, non-wrapping pieces. */
function splitAtNorth(fromDeg: number, toDeg: number): WindArc[] {
  const from = normaliseBearing(fromDeg)
  const to = normaliseBearing(toDeg)

  if (from <= to) return [{ fromDeg: from, toDeg: to }]
  return [
    { fromDeg: from, toDeg: 360 },
    { fromDeg: 0, toDeg: to },
  ]
}

/** Merges arcs that touch or overlap, so storage holds no redundant rows. */
export function mergeArcs(arcs: WindArc[]): WindArc[] {
  const sorted = [...arcs].sort(
    (a, b) => a.fromDeg - b.fromDeg || a.toDeg - b.toDeg,
  )
  const merged: WindArc[] = []

  for (const arc of sorted) {
    const last = merged[merged.length - 1]
    if (last && arc.fromDeg <= last.toDeg) {
      last.toDeg = Math.max(last.toDeg, arc.toDeg)
    } else {
      merged.push({ ...arc })
    }
  }

  return merged
}

/**
 * Parses a free-text direction spec into stored arcs.
 * Accepts single points ("NW"), ranges ("SO-SW", "W-NW"), and lists
 * ("S,SE" or "N;NE"), in English or German notation.
 */
export function parseWindSpec(spec: string): WindArc[] {
  if (!spec?.trim()) return []

  const arcs: WindArc[] = []

  for (const part of spec.split(/[;,/]/)) {
    const token = part.trim()
    if (!token) continue

    const range = token.split(/\s*[-–]\s*/).filter(Boolean)

    if (range.length === 2) {
      const from = bearingForPoint(range[0]!)
      const to = bearingForPoint(range[1]!)
      if (from === undefined || to === undefined) continue
      // A range names its outer edges, so widen by half a point on each side.
      arcs.push(
        ...splitAtNorth(from - POINT_HALF_WIDTH, to + POINT_HALF_WIDTH),
      )
      continue
    }

    const bearing = bearingForPoint(token)
    if (bearing === undefined) continue
    arcs.push(
      ...splitAtNorth(bearing - POINT_HALF_WIDTH, bearing + POINT_HALF_WIDTH),
    )
  }

  return mergeArcs(arcs)
}

/** True when a measured wind bearing falls inside any stored arc. */
export function supportsBearing(arcs: WindArc[], bearing: number) {
  const value = normaliseBearing(bearing)
  return arcs.some((arc) => value >= arc.fromDeg && value <= arc.toDeg)
}

/** Total degrees covered, useful for ranking how forgiving a launch is. */
export function arcCoverageDegrees(arcs: WindArc[]) {
  return mergeArcs(arcs).reduce(
    (total, arc) => total + (arc.toDeg - arc.fromDeg),
    0,
  )
}
