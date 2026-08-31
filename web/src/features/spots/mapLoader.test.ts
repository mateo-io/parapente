import { describe, expect, it } from "vitest"

import { loadMapSites } from "./mapLoader"
import type { FlyingSite } from "./types"

const site = { slug: "niederbauen" } as FlyingSite

describe("loadMapSites", () => {
  it("returns sites when the local API responds", async () => {
    await expect(loadMapSites(async () => [site])).resolves.toEqual({
      sites: [site],
      dataUnavailable: false,
    })
  })

  it("keeps the explorer route alive when the local API fails", async () => {
    await expect(loadMapSites(async () => {
      throw new Error("local_api_unavailable")
    })).resolves.toEqual({
      sites: [],
      dataUnavailable: true,
    })
  })
})
