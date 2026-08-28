import { describe, expect, it } from "vitest"

import { routePathFromFilePath } from "./routes"

describe("routePathFromFilePath", () => {
  it.each([
    ["/src/pages/index.tsx", "/"],
    ["/src/pages/about.tsx", "/about"],
    ["/src/pages/spots/[slug].tsx", "/spots/:slug"],
    ["/src/pages/articles/[...path].tsx", "/articles/*"],
    ["/src/pages/[...404].tsx", "*"],
  ])("maps %s to %s", (filePath, expected) => {
    expect(routePathFromFilePath(filePath)).toBe(expected)
  })
})
