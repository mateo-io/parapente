import { describe, expect, it } from "vitest"

import { cleanSiteName, resolveSiteName } from "./siteNaming"

describe("cleanSiteName", () => {
  it("drops the category prefix and keeps the place", () => {
    expect(cleanSiteName("Gleitschirm Landeplatz Rübi")).toBe("Rübi")
    expect(cleanSiteName("Gleitschirm Startplatz Wirzweli")).toBe("Wirzweli")
    expect(cleanSiteName("Landeplatz Goldau")).toBe("Goldau")
    expect(cleanSiteName("Aussenlandeplatz Altendorf")).toBe("Altendorf")
  })

  it("drops the category when it trails the place", () => {
    expect(cleanSiteName("Axalp Landeplatz Forsthaus")).toBe("Axalp Forsthaus")
    expect(cleanSiteName("Flüelen Landing")).toBe("Flüelen")
    expect(cleanSiteName("Gschwänd (Gleitschirm)")).toBe("Gschwänd")
  })

  it("keeps the wing type, which tells two launches on one hill apart", () => {
    expect(cleanSiteName("Gschwänd (Delta)")).toBe("Gschwänd (Delta)")
    expect(cleanSiteName("Hängegleiter Startplatz Fronalpstock")).toBe(
      "Hängegleiter Fronalpstock",
    )
  })

  it("drops a trailing compass bearing, which belongs in the wind model", () => {
    expect(cleanSiteName("Brienzer Rothorn Startplatz SO-SW")).toBe(
      "Brienzer Rothorn",
    )
    expect(cleanSiteName("Hofstetter Gummen Startplatz S")).toBe(
      "Hofstetter Gummen",
    )
  })

  it("keeps multi-word place names intact", () => {
    expect(cleanSiteName("Gleitschirm Landeplatz Allmend Luzern")).toBe(
      "Allmend Luzern",
    )
    expect(cleanSiteName("Gleitschirm Landeplatz Rest.Edelweiss")).toBe(
      "Rest.Edelweiss",
    )
  })

  it("leaves an already clean name alone", () => {
    expect(cleanSiteName("Niederbauen")).toBe("Niederbauen")
    expect(cleanSiteName("Emmetten · Hauptlandeplatz")).toBe("Emmetten")
    expect(cleanSiteName("Brunni · Tümpfeli")).toBe("Brunni · Tümpfeli")
  })

  it("returns undefined when nothing identifying is left", () => {
    expect(cleanSiteName("Gleitschirm Landeplatz")).toBeUndefined()
    expect(cleanSiteName("Startplatz")).toBeUndefined()
    expect(cleanSiteName("   ")).toBeUndefined()
  })
})

describe("resolveSiteName", () => {
  it("falls back to the locality when the name held no place", () => {
    expect(resolveSiteName("Gleitschirm Landeplatz", "Stans", "Site")).toBe(
      "Stans",
    )
  })

  it("falls back to the supplied label when there is no locality", () => {
    expect(resolveSiteName("Landeplatz", null, "Landing area")).toBe(
      "Landing area",
    )
  })

  it("prefers the cleaned name over the locality", () => {
    expect(resolveSiteName("Landeplatz Goldau", "Arth", "Site")).toBe("Goldau")
  })
})
