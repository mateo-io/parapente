import { useEffect, useState } from "react"

import type { MapTheme } from "../features/spots/basemap"

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)"

function themeFromSystemPreference(): MapTheme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? "dark" : "light"
}

/** Keeps JavaScript-only surfaces, such as the map style, in step with CSS. */
export function useSystemTheme() {
  const [theme, setTheme] = useState<MapTheme>(themeFromSystemPreference)

  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_SCHEME_QUERY)
    const updateTheme = () => setTheme(themeFromSystemPreference())

    updateTheme()
    mediaQuery.addEventListener("change", updateTheme)
    return () => mediaQuery.removeEventListener("change", updateTheme)
  }, [])

  return theme
}
