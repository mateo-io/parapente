import { createHmac } from "node:crypto"

import { distanceMetres } from "./dedupe"

/**
 * Provider-neutral flight-log ingestion.
 *
 * No provider is wired up: XContest disallows its flight search in robots.txt
 * and DHV-XC disallows everything outside /info/, so neither may be harvested.
 * Legitimate routes are an API agreement with the provider, or the pilot's own
 * exported flights. This module is the shape those feeds map onto, so adding one
 * is a parser plus a provider row, not a redesign. Derived observations belong
 * in `site_analysis_signals`, never in the reviewed operational site record.
 */

export interface RawFlight {
  providerFlightId: string
  flownOn: string
  launchLatitude?: number | null
  launchLongitude?: number | null
  landingLatitude?: number | null
  landingLongitude?: number | null
  distanceKm?: number | null
  durationMin?: number | null
  maxAltitudeM?: number | null
  trackUrl?: string | null
  /** Provider-scoped pseudonym. Never a pilot name: that is personal data. */
  pilotRef?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Produces a stable, UUID-shaped local reference without retaining a provider's
 * pilot identifier. Call this while parsing an authorised export, before a
 * RawFlight or SQL parameter object is created. The key must be secret and
 * must not be committed, logged, or stored in the database.
 */
export function pseudonymisePilot(
  providerCode: string,
  providerPilotIdentity: string,
  secret: string,
): string {
  if (!providerCode.trim() || !providerPilotIdentity.trim() || !secret) {
    throw new Error("Pilot pseudonymisation requires a provider, identity, and secret.")
  }

  const digest = createHmac("sha256", secret)
    .update(`${providerCode.trim()}\u0000${providerPilotIdentity.trim()}`)
    .digest("hex")

  // Preserve UUID syntax for callers while setting RFC 4122 variant/version
  // bits. The remaining bits are keyed HMAC output, not an unhashed name.
  const variant = "89ab"[Number.parseInt(digest[16]!, 16) & 0b11]!
  return [
    digest.slice(0, 8),
    digest.slice(8, 12),
    `4${digest.slice(13, 16)}`,
    `${variant}${digest.slice(17, 20)}`,
    digest.slice(20, 32),
  ].join("-")
}

export interface MatchableSite {
  id: string
  kind: "launch" | "landing" | "weather_station"
  latitude: number
  longitude: number
  elevationM?: number | null
}

/**
 * A reported launch point can be a few hundred metres off the mapped site, but
 * beyond this it is a different place and must stay unmatched.
 */
export const MATCH_RADIUS_M = 500

export interface SiteMatch {
  siteId: string
  metres: number
}

export function matchSite(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  sites: MatchableSite[],
  kind: "launch" | "landing",
  radiusM: number = MATCH_RADIUS_M,
): SiteMatch | null {
  if (latitude == null || longitude == null) return null

  let best: SiteMatch | null = null

  for (const site of sites) {
    if (site.kind !== kind) continue
    const metres = distanceMetres(latitude, longitude, site.latitude, site.longitude)
    if (metres > radiusM) continue
    if (!best || metres < best.metres) best = { siteId: site.id, metres }
  }

  return best
}

/**
 * Straight-line ratio the flight achieved between its two endpoints. Returns
 * null when the landing is not below the launch or an elevation is unknown,
 * matching the glide model's own refusal to invent a number.
 */
export function achievedRatio(
  launch: MatchableSite | undefined,
  landing: MatchableSite | undefined,
): number | null {
  if (!launch?.elevationM || !landing?.elevationM) return null

  const vertical = launch.elevationM - landing.elevationM
  if (vertical <= 0) return null

  const horizontal = distanceMetres(
    launch.latitude,
    launch.longitude,
    landing.latitude,
    landing.longitude,
  )
  if (horizontal <= 0) return null

  return Number((horizontal / vertical).toFixed(2))
}

export interface NormalisedFlight extends RawFlight {
  launchSiteId: string | null
  landingSiteId: string | null
  launchMatchM: number | null
  landingMatchM: number | null
  achievedRatio: number | null
}

export function normaliseFlight(
  flight: RawFlight,
  sites: MatchableSite[],
): NormalisedFlight {
  const launch = matchSite(
    flight.launchLatitude,
    flight.launchLongitude,
    sites,
    "launch",
  )
  const landing = matchSite(
    flight.landingLatitude,
    flight.landingLongitude,
    sites,
    "landing",
  )

  return {
    ...flight,
    launchSiteId: launch?.siteId ?? null,
    landingSiteId: landing?.siteId ?? null,
    launchMatchM: launch ? Math.round(launch.metres) : null,
    landingMatchM: landing ? Math.round(landing.metres) : null,
    achievedRatio: achievedRatio(
      sites.find((site) => site.id === launch?.siteId),
      sites.find((site) => site.id === landing?.siteId),
    ),
  }
}
