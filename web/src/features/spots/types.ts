/**
 * The interface is English only. Pilot reviews are stored in the language they
 * were written in, which is a separate concern: see `SiteReport`.
 */
export type MapLocale = "en"
export type PilotLevel = "student" | "independent" | "expert"
export type SiteKind = "launch" | "landing" | "weather_station"
export type SiteDataStatus = "mapped" | "reviewed" | "live"

/**
 * An arc of compass bearing, in degrees, that the wind may blow FROM for this
 * launch to work. Arcs never wrap: a window crossing north is two arcs, so
 * `fromDeg <= toDeg` always holds and containment is a plain comparison.
 */
export interface WindWindow {
  fromDeg: number
  toDeg: number
  /**
   * `preferred` is the direction a site is best in, `acceptable` the wider
   * range it still works in. Kept separate because a sheltered launch that
   * works in almost anything is a different proposition from a fussy one.
   */
  quality: "preferred" | "acceptable"
}

export interface LaunchSectionSource {
  label: string
  url?: string
  reviewedAt?: string
}

/** A named part of a launch area, not a separately managed flying site. */
export interface LaunchSection {
  id: string
  name: string
  /** Whether a current source supports the named section and its direction. */
  evidenceStatus?: "current" | "corroborated" | "historical"
  description: string
  windDirections: {
    preferred: string[]
    acceptable: string[]
  }
  cautions: string[]
  /** Makes uncertainty from an older or conflicting source visible. */
  evidenceNote?: string
  source: LaunchSectionSource
}

export interface SiteSource {
  label: string
  url?: string | null
  /** What this source confirms; a position is not a description. */
  confirms: "location" | "description" | "wind" | "hazards" | "access"
  providerCode: string
}

export interface SiteReport {
  kind: "observation" | "conditions" | "hazard" | "access" | "etiquette"
  /** Kept verbatim. Paraphrasing pilot experience loses what makes it useful. */
  body: string
  attribution?: string | null
  sourceUrl?: string | null
  /** A federation or school account outranks a community one. */
  authority: "governing_body" | "school" | "club" | "operator" | "community"
  observedOn?: string | null
}

export interface SitePairing {
  otherSlug: string
  otherName: string
  /** The role of the LANDING in this pair, whichever side you are viewing. */
  role: "official" | "alternate" | "emergency" | "prohibited"
  conditionNote?: string | null
  sourceUrl?: string | null
  /** Recorded flights making this connection. Zero means unconfirmed. */
  flightCount: number
}

export interface LiftPrice {
  ticketType: "single_ascent" | "day_pass" | "season_pass" | "return"
  audience: "paraglider" | "general"
  amount: number
  currency: string
  /** Prices go stale silently, so nothing is shown without this date. */
  asOf: string
  sourceUrl?: string | null
  note?: string | null
}

export interface SiteLift {
  code: string
  name: string
  kind: "cable_car" | "gondola" | "chairlift" | "funicular" | "bus" | "train"
  url?: string | null
  rideMinutes: number | null
  /** Walk from the top station to the launch. */
  walkMinutes: number | null
  /**
   * `verified` came from a source and is shown plainly. `estimated` was
   * computed here and must be rendered as an approximation.
   */
  walkConfidence: "verified" | "estimated"
  walkHorizontalM: number | null
  walkAscentM: number | null
  seasonalNote?: string | null
  /** The valley station. This, not the launch, is what you drive to. */
  baseLatitude: number
  baseLongitude: number
  baseElevationM: number | null
  topElevationM: number | null
  prices: LiftPrice[]
}

export interface SiteStation {
  code: string
  latitude: number
  longitude: number
  elevationM: number | null
  distanceKm: number
  /**
   * Station height minus site height. A large negative value means the station
   * sits far below the site and its reading may say little about conditions
   * there, so this must be shown with any measurement.
   */
  elevationDeltaM: number | null
}

export interface FlyingSite {
  id: string
  slug: string
  kind: SiteKind
  dataStatus: SiteDataStatus
  name: string
  locality?: string
  canton?: string
  summary: string
  latitude: number
  longitude: number
  elevationM?: number
  launchDirections: string[]
  /** Named direction-specific zones within this one launch area. */
  launchSections?: LaunchSection[]
  /** Landings only. `unknown` means nobody has reviewed what this field is. */
  landingRole: "official" | "alternate" | "emergency" | "unknown"
  /** Official/alternate/emergency pairings with the opposite kind of site. */
  pairings: SitePairing[]
  /** What pilots and local sources say about flying here. */
  reports: SiteReport[]
  /** Empty for landings and for launches with no published direction data. */
  windWindows: WindWindow[]
  /** Total degrees of usable wind, for sorting by how forgiving a site is. */
  windCoverageDegrees: number
  /** Degrees in the preferred band only. */
  windPreferredDegrees: number
  /**
   * Number of DISTINCT providers backing this record. One means the record
   * rests on a single dataset and should be shown with a caveat.
   */
  sourceCount: number
  sources: SiteSource[]
  /**
   * How complete the flight record is for this site's region. Decides whether an
   * absence of recorded flights carries any meaning at all.
   */
  flightCoverage: "near_complete" | "partial" | "unknown"
  /** Nearest MeteoSwiss station, or null when none is within range. */
  station?: SiteStation | null
  /** Lift serving this site, when one does. */
  lift?: SiteLift | null
  pilotLevel?: PilotLevel
  accessType?: string
  accessDetail?: string
  terrain?: string
  knownFor: string[]
  cautions: string[]
  researchNote?: string
  sourceLabel: string
  sourceUrl: string
  sourceKind: string
  reviewedAt: string
}

export interface MapFilters {
  query: string
  kinds: SiteKind[]
}

export interface SiteListResponse {
  data: FlyingSite[]
  meta: {
    locale: MapLocale
    count: number
    bounds: [number, number, number, number]
    kinds: SiteKind[]
    freshness: "research_snapshot"
  }
}
