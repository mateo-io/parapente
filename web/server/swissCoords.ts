/**
 * Approximate WGS84 to LV95 (EPSG:2056) conversion, using swisstopo's published
 * closed-form approximation. Accurate to roughly a metre inside Switzerland,
 * which is far below the terrain variation across a launch, and avoids pulling
 * in a projection library for one call.
 *
 * Needed because the swisstopo height service accepts only LV95 or LV03.
 */

export interface Lv95 {
  easting: number
  northing: number
}

export function wgs84ToLv95(latitude: number, longitude: number): Lv95 {
  // swisstopo's formula works in arc seconds relative to the Bern datum point.
  const phi = (latitude * 3600 - 169028.66) / 10000
  const lambda = (longitude * 3600 - 26782.5) / 10000

  const easting =
    2600072.37 +
    211455.93 * lambda -
    10938.51 * lambda * phi -
    0.36 * lambda * phi ** 2 -
    44.54 * lambda ** 3

  const northing =
    1200147.07 +
    308807.95 * phi +
    3745.25 * lambda ** 2 +
    76.63 * phi ** 2 -
    194.56 * lambda ** 2 * phi +
    119.79 * phi ** 3

  return { easting, northing }
}

/** Rough bounds of the LV95 grid, used to reject points outside Switzerland. */
export function isInsideSwitzerland({ easting, northing }: Lv95) {
  return (
    easting > 2485000 &&
    easting < 2834000 &&
    northing > 1075000 &&
    northing < 1296000
  )
}
