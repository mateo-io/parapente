import type {
  FlyingSite,
  SiteKind,
  SiteListResponse,
} from "./types"
import { normalizeLaunchSections } from "./launchSections"

function normalizeSite(site: FlyingSite): FlyingSite {
  return { ...site, launchSections: normalizeLaunchSections(site.launchSections) }
}

export interface SpotRepository {
  list(options?: {
    kinds?: SiteKind[]
    search?: string
  }): Promise<FlyingSite[]>
  findBySlug(slug: string): Promise<FlyingSite | undefined>
}

class ApiSpotRepository implements SpotRepository {
  async list(options: {
    kinds?: SiteKind[]
    search?: string
  } = {}) {
    const params = new URLSearchParams({
      types: (options.kinds ?? ["launch", "landing"]).join(","),
    })

    if (options.search) params.set("search", options.search)

    const response = await fetch(`/api/sites?${params}`)
    if (!response.ok) throw new Error("Unable to load local flying sites")

    const payload = (await response.json()) as SiteListResponse
    return payload.data.map(normalizeSite)
  }

  async findBySlug(slug: string) {
    const response = await fetch(
      `/api/sites/${encodeURIComponent(slug)}`,
    )

    if (response.status === 404) return undefined
    if (!response.ok) throw new Error("Unable to load local flying site")

    const payload = (await response.json()) as { data: FlyingSite }
    return normalizeSite(payload.data)
  }
}

// This HTTP boundary can later be replaced by a Supabase implementation
// without coupling map components to a database client.
export const spotRepository: SpotRepository = new ApiSpotRepository()
