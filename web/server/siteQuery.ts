export type SiteLocale = "en" | "de"
export type SiteKind = "launch" | "landing" | "weather_station"

const defaultBounds = [7.95, 46.72, 8.9, 47.28] as const
const supportedKinds = new Set<SiteKind>([
  "launch",
  "landing",
  "weather_station",
])

export interface ParsedSiteQuery {
  locale: SiteLocale
  kinds: SiteKind[]
  bounds: [number, number, number, number]
  search?: string
}

type QueryValue = string | string[] | undefined

function first(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value
}

export function parseSiteQuery(
  query: Record<string, QueryValue>,
): ParsedSiteQuery {
  const locale: SiteLocale = first(query.lang) === "de" ? "de" : "en"
  const requestedKinds = (first(query.types) ?? "launch,landing")
    .split(",")
    .filter((kind): kind is SiteKind => supportedKinds.has(kind as SiteKind))
  const kinds = requestedKinds.length
    ? [...new Set(requestedKinds)]
    : (["launch", "landing"] satisfies SiteKind[])

  const parsedBounds = (first(query.bbox) ?? "")
    .split(",")
    .map(Number)
  const bounds: [number, number, number, number] =
    parsedBounds.length === 4 && parsedBounds.every(Number.isFinite)
      ? [parsedBounds[0]!, parsedBounds[1]!, parsedBounds[2]!, parsedBounds[3]!]
      : [...defaultBounds]

  const rawSearch = first(query.search)?.trim()
  const search = rawSearch ? rawSearch.slice(0, 80) : undefined

  return { locale, kinds, bounds, search }
}
