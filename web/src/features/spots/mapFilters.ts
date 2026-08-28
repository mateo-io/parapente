import type { FlyingSite, MapFilters } from "./types"

export function filterMapSites(sites: FlyingSite[], filters: MapFilters) {
  const query = filters.query.trim().toLocaleLowerCase()

  return sites.filter((site) => {
    if (!filters.kinds.includes(site.kind)) return false
    if (!query) return true

    return [site.name, site.locality, site.canton]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase()
      .includes(query)
  })
}

export function countSitesByKind(sites: FlyingSite[]) {
  return sites.reduce(
    (counts, site) => {
      counts[site.kind] += 1
      return counts
    },
    { launch: 0, landing: 0, weather_station: 0 },
  )
}
