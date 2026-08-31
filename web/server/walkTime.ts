/**
 * Walking time from a lift station to a launch.
 *
 * Two grades of number, kept apart on purpose:
 *   `verified`  came from an operator, club or federation source and is shown
 *               as a plain figure.
 *   `estimated` was computed here from distance and ascent, and must be shown
 *               as an approximation so nobody plans a lift connection on it.
 *
 * The estimate uses Naismith's rule at an average walking pace: 12 minutes per
 * kilometre on the flat, plus 10 minutes per 100 m of ascent. Descent is not
 * credited as time saved, because a loaded pilot does not go faster downhill.
 */

export type WalkConfidence = "verified" | "estimated"

export interface WalkEstimate {
  minutes: number
  confidence: WalkConfidence
}

const MINUTES_PER_KM = 12
const MINUTES_PER_100M_ASCENT = 10

export function estimateWalkMinutes(
  horizontalM: number,
  ascentM: number,
): number {
  if (!Number.isFinite(horizontalM) || horizontalM < 0) return 0

  const flat = (horizontalM / 1000) * MINUTES_PER_KM
  const climb =
    ascentM > 0 ? (ascentM / 100) * MINUTES_PER_100M_ASCENT : 0

  // Round up to the minute: a walk is never usefully described as 2.3 minutes,
  // and rounding down would understate the connection.
  return Math.max(1, Math.ceil(flat + climb))
}

/**
 * Prefers a sourced figure and falls back to the computed one, reporting which
 * it used so the caller can mark an approximation.
 */
export function resolveWalk(
  verifiedMinutes: number | null | undefined,
  horizontalM: number,
  ascentM: number,
): WalkEstimate {
  if (verifiedMinutes != null && Number.isFinite(verifiedMinutes)) {
    return { minutes: Math.max(0, Math.round(verifiedMinutes)), confidence: "verified" }
  }
  return {
    minutes: estimateWalkMinutes(horizontalM, ascentM),
    confidence: "estimated",
  }
}
