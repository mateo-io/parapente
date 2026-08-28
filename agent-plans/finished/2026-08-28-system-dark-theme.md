# System Dark Theme

> **Created:** 2026-08-28
> **Status:** done
> **Summary:** Make the map explorer respect the operating system colour preference through semantic CSS variables and a matching dark MapLibre base style.

## Outcome

The interface should feel intentionally native in either system appearance while preserving the visual meaning of launches, landings, warnings, and data-status signals.

## Decisions

- Follow the idioms pattern: define semantic tokens once in CSS and override their values with `prefers-color-scheme: dark`; do not add an in-app appearance switch for this first slice.
- Keep the existing launch, landing, weather, and signal hues semantic so dark mode changes contrast without changing what their colours mean.
- Switch the token-free OpenFreeMap base style to its dark variant when the system preference changes. Swiss terrain overlays and site data remain the same.

## Work

- [x] Add semantic surface, text, border, overlay, and signal tokens with a system-dark override.
- [x] Replace light-only component colour literals with the semantic tokens.
- [x] Give the MapLibre basemap a typed light/dark style selector and apply preference changes without losing site or terrain overlays.
- [x] Add a focused test for the theme/style selector.
- [x] Update the repo-wide guide with the durable appearance rule.
- [x] Run `npm run check` from `web/`.

## Out of scope

- A manual theme chooser or persistence setting.
- Reworking the product palette, map data, translations, or safety states.

**Shipped 2026-08-28:** The client now follows `prefers-color-scheme` using semantic CSS variables, and the MapLibre base style switches between OpenFreeMap Liberty and Dark while restoring the flying-site and terrain overlay layers. `npm run check` passed: lint, 18 tests, typecheck, and production build.
