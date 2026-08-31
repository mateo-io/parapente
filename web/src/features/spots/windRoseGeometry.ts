/**
 * Geometry for the wind rose. Bearings are compass degrees (0 = north,
 * clockwise); SVG angles run counter-clockwise from the positive x axis, hence
 * the -90 offset. Kept apart from the component so both stay fast-refreshable
 * and the maths can be tested on its own.
 */

export const SIZE = 200
export const CENTRE = SIZE / 2
export const OUTER = 82
export const INNER = 44

export function polar(bearingDeg: number, radius: number) {
  const radians = ((bearingDeg - 90) * Math.PI) / 180
  return {
    x: CENTRE + radius * Math.cos(radians),
    y: CENTRE + radius * Math.sin(radians),
  }
}

/** Annular sector between two bearings. Full circles need two arc halves. */
export function bandPath(fromDeg: number, toDeg: number, outer: number, inner: number) {
  const sweep = toDeg - fromDeg

  if (sweep >= 359.999) {
    // A full ring cannot be drawn as one arc, so draw two half rings.
    return [
      `M ${CENTRE} ${CENTRE - outer}`,
      `A ${outer} ${outer} 0 1 1 ${CENTRE} ${CENTRE + outer}`,
      `A ${outer} ${outer} 0 1 1 ${CENTRE} ${CENTRE - outer}`,
      `M ${CENTRE} ${CENTRE - inner}`,
      `A ${inner} ${inner} 0 1 0 ${CENTRE} ${CENTRE + inner}`,
      `A ${inner} ${inner} 0 1 0 ${CENTRE} ${CENTRE - inner}`,
      "Z",
    ].join(" ")
  }

  const largeArc = sweep > 180 ? 1 : 0
  const o1 = polar(fromDeg, outer)
  const o2 = polar(toDeg, outer)
  const i2 = polar(toDeg, inner)
  const i1 = polar(fromDeg, inner)

  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
    `L ${i2.x} ${i2.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${i1.x} ${i1.y}`,
    "Z",
  ].join(" ")
}
