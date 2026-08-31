import type { FlyingSite } from "./types"

export type MapSiteLoad =
  | { sites: FlyingSite[]; dataUnavailable: false }
  | { sites: FlyingSite[]; dataUnavailable: true }

/**
 * The explorer remains useful as a shell when its temporary local API is down.
 * A missing API or unapplied local migration must not become a route failure.
 */
export async function loadMapSites(
  listSites: () => Promise<FlyingSite[]>,
): Promise<MapSiteLoad> {
  try {
    return { sites: await listSites(), dataUnavailable: false }
  } catch {
    return { sites: [], dataUnavailable: true }
  }
}
