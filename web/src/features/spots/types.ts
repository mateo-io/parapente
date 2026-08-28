export type MapLocale = "en" | "de"
export type PilotLevel = "student" | "independent" | "expert"
export type SiteKind = "launch" | "landing" | "weather_station"
export type SiteDataStatus = "mapped" | "reviewed" | "live"

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
