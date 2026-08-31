import type { FlyingSite } from "./types"

/**
 * Glide reachability between a launch and a landing.
 *
 * The required glide ratio is horizontal distance divided by height lost. A
 * wing's advertised best L/D is achieved in still air, at one speed, with no
 * sink — none of which holds on a real flight. So reachability is judged
 * against deliberately pessimistic ratios, and the required ratio is always
 * shown so the pilot applies their own judgement rather than trusting a badge.
 *
 * This is a planning aid for research on the ground. It is not a flight plan,
 * it knows nothing about terrain in between, airspace, or the day's conditions.
 */

const EARTH_RADIUS_M = 6_371_000

/** Great-circle distance in metres. */
export function haversineMetres(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLon = toRad(bLon - aLon)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/**
 * Ratio bands, calibrated against the official launch-to-landing pairings the
 * sources actually publish rather than against a wing's advertised best glide.
 *
 * All twelve official pairings held here, from three independent sources (the
 * SHV Pilatus sheet, the Klewenalp operator and the Emmetten school), require
 * between 2.15:1 and 4.93:1, median 4.24:1. That is the real shape of the
 * problem: an official landing has to be reachable on an EN-A wing by a pilot
 * who has just left a launch, so nobody designates one that needs a long glide.
 *
 * A ceiling of 8:1 offered landings roughly sixty percent further than any real
 * pairing, which is worse than useless: it presents ground nobody treats as a
 * landing option as though it were one.
 */
export const GLIDE_BANDS = {
  comfortable: 3,
  workable: 4,
  marginal: 5,
} as const

export type GlideBand = keyof typeof GLIDE_BANDS | "out-of-range"

/** The ratio beyond which a landing is not offered at all. */
export const MAX_PLANNING_RATIO = GLIDE_BANDS.marginal

export interface GlideLeg {
  landing: FlyingSite
  horizontalM: number
  verticalM: number
  requiredRatio: number
  band: GlideBand
}

export function bandFor(requiredRatio: number): GlideBand {
  if (requiredRatio <= GLIDE_BANDS.comfortable) return "comfortable"
  if (requiredRatio <= GLIDE_BANDS.workable) return "workable"
  if (requiredRatio <= GLIDE_BANDS.marginal) return "marginal"
  return "out-of-range"
}

/**
 * Computes the leg from a launch to one landing. Returns null when either
 * elevation is unknown or the landing is not below the launch, because a glide
 * that has to climb is not a glide.
 */
export function glideLeg(
  launch: FlyingSite,
  landing: FlyingSite,
): GlideLeg | null {
  if (launch.elevationM == null || landing.elevationM == null) return null

  const verticalM = launch.elevationM - landing.elevationM
  if (verticalM <= 0) return null

  const horizontalM = haversineMetres(
    launch.latitude,
    launch.longitude,
    landing.latitude,
    landing.longitude,
  )
  if (horizontalM <= 0) return null

  const requiredRatio = horizontalM / verticalM

  return {
    landing,
    horizontalM,
    verticalM,
    requiredRatio,
    band: bandFor(requiredRatio),
  }
}

/**
 * All landings reachable from a launch within the planning ratio, nearest
 * requirement first. Landings needing more than `maxRatio` are excluded.
 */
export function reachableLandings(
  launch: FlyingSite,
  sites: FlyingSite[],
  maxRatio: number = MAX_PLANNING_RATIO,
): GlideLeg[] {
  if (launch.kind !== "launch") return []

  return sites
    .filter((site) => site.kind === "landing")
    .map((landing) => glideLeg(launch, landing))
    .filter((leg): leg is GlideLeg => leg != null && leg.requiredRatio <= maxRatio)
    .sort((a, b) => a.requiredRatio - b.requiredRatio)
}

/**
 * The inverse view: which launches can reach this landing. A landing's most
 * useful fact is what flies into it, and that relation is already computed.
 */
export function launchesReaching(
  landing: FlyingSite,
  sites: FlyingSite[],
  maxRatio: number = MAX_PLANNING_RATIO,
): GlideLeg[] {
  if (landing.kind !== "landing") return []

  return sites
    .filter((site) => site.kind === "launch")
    .map((launch) => {
      const leg = glideLeg(launch, landing)
      return leg ? { ...leg, landing: launch } : null
    })
    .filter((leg): leg is GlideLeg => leg != null && leg.requiredRatio <= maxRatio)
    .sort((a, b) => a.requiredRatio - b.requiredRatio)
}
