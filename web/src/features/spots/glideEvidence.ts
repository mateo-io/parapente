import type { GlideLeg } from "./glide"

/**
 * Reconciles what the glide model predicts against what pilots have actually
 * flown.
 *
 * The glide calculation is straight-line: it knows nothing about the ridge in
 * between, which side of a hill can be launched from, or mountain airflow. It
 * will therefore offer connections nobody makes. Flight logs are the correction.
 *
 * What an ABSENCE means depends entirely on coverage. Where a flight database
 * records essentially every official launch, no flights on an easy line is a
 * strong signal. Where coverage is patchy it means nothing, and presenting it as
 * doubt would be inventing information. Coverage is therefore an input, not an
 * assumption, and it is a guide rather than an authority even at its strongest.
 */

/** How complete the flight record is for the region a site sits in. */
export type CoverageLevel = "near_complete" | "partial" | "unknown"

export interface FlightEvidence {
  flightCount: number
  providerCount: number
  firstSeen?: string | null
  lastSeen?: string | null
  avgAchievedRatio?: number | null
}

export type EvidenceLevel =
  /** Enough recorded flights to treat the connection as real. */
  | "confirmed"
  /** Flights exist but stopped. Access may have been withdrawn. */
  | "lapsed"
  /** A handful of flights: plausible, not established. */
  | "sparse"
  /** Geometry allows it but nothing is recorded. */
  | "unconfirmed"

/** Below this a pair is only sparsely evidenced. */
export const CONFIRMED_FLIGHTS = 5

/** Flights that stop for this long suggest the pairing changed, not the weather. */
export const LAPSED_AFTER_DAYS = 730

export function daysSince(iso: string | null | undefined, now: Date): number | null {
  if (!iso) return null
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return null
  return Math.floor((now.getTime() - then) / 86_400_000)
}

export function evidenceLevel(
  evidence: FlightEvidence | undefined,
  now: Date = new Date(),
): EvidenceLevel {
  if (!evidence || evidence.flightCount === 0) return "unconfirmed"

  // Flights that existed and then stopped are their own case. A site can be
  // closed, a landowner can withdraw permission, an airspace can change; none
  // of that shows up as a lower flight count, only as an older last flight.
  const age = daysSince(evidence.lastSeen, now)
  if (age != null && age > LAPSED_AFTER_DAYS) return "lapsed"

  return evidence.flightCount >= CONFIRMED_FLIGHTS ? "confirmed" : "sparse"
}

export interface AssessedLeg extends GlideLeg {
  evidence?: FlightEvidence
  evidenceLevel: EvidenceLevel
  /**
   * True only where coverage is good enough for an absence to mean something:
   * the model calls the glide easy, yet nothing is recorded. That combination
   * usually means terrain or launch orientation blocks the line.
   */
  suspect: boolean
}

/**
 * A comfortable glide with no recorded flights is the suspicious case. Set at
 * the workable band: official pairings run from 2.15:1 to 4.93:1, so anything
 * inside 4:1 is a line that ought to be flown if it is flyable at all.
 */
const SUSPECT_RATIO = 4

export function assessLeg(
  leg: GlideLeg,
  evidence: FlightEvidence | undefined,
  coverage: CoverageLevel = "unknown",
  now: Date = new Date(),
): AssessedLeg {
  const level = evidenceLevel(evidence, now)

  return {
    ...leg,
    evidence,
    evidenceLevel: level,
    // Absence is only informative where the record is near complete. Anywhere
    // else, "no flights" is a statement about the dataset, not the site.
    suspect:
      coverage === "near_complete" &&
      level === "unconfirmed" &&
      leg.requiredRatio <= SUSPECT_RATIO,
  }
}

/**
 * Orders legs so evidenced connections come first, then by how little glide is
 * needed. A pilot should see what people actually fly before what the geometry
 * merely permits. Lapsed pairs sort above unconfirmed ones because a connection
 * that used to exist is still worth investigating.
 */
export function assessLegs(
  legs: GlideLeg[],
  evidenceBySlug: Record<string, FlightEvidence>,
  coverage: CoverageLevel = "unknown",
  now: Date = new Date(),
): AssessedLeg[] {
  const rank: Record<EvidenceLevel, number> = {
    confirmed: 0,
    sparse: 1,
    lapsed: 2,
    unconfirmed: 3,
  }

  return legs
    .map((leg) => assessLeg(leg, evidenceBySlug[leg.landing.slug], coverage, now))
    .sort(
      (a, b) =>
        rank[a.evidenceLevel] - rank[b.evidenceLevel] ||
        a.requiredRatio - b.requiredRatio,
    )
}
