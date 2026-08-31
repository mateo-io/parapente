# Wind suitability diagnosis — 2026-08-31

## Goal

Explain why a launch remains visible with the **Now** forecast filter when its displayed live-wind needle appears outside its wind-sector graph, then restore the independent compass-direction filter and make the right-side controls scroll safely.

## Steps

- [x] Locate the forecast filter and wind-rose implementations.
- [x] Compare the readings and direction semantics used by each surface.
- [x] Report the evidence and any user-visible limitation; do not change behaviour unless requested.
- [x] Restore the independent launch-direction control while retaining station-model horizon matching.
- [x] Constrain the right-hand layer panel and verify the web app.

## Findings

- The orange needle is supplied by `useLiveWind` from `/api/wind` at the selected site's own latitude/longitude. It is labelled as an observed Open-Meteo current reading.
- The "Potentially suitable" check uses `/api/flyability`, which obtains an Open-Meteo model reading at the linked station's latitude/longitude. For horizon `0`, this is the API's `current` model field; it is not the needle reading.
- The selected site in the supplied screenshot uses ENG, 10.8 km away and 170 m lower. A station-coordinate model direction can validly fall inside the site's sector while the point-level current reading (45° in the screenshot) falls outside.
- Both feeds use a *wind-from* bearing, so this is not a reversed-direction convention. The issue is a UI/semantic mismatch: calling the station-model result "Now" beside a separate observed needle makes the result look contradictory.

## Revision — implementation requested

- Keep both filters active together: selected launches must match the chosen compass direction and at least one chosen station-model horizon.
- Make the layer control independently scroll within the viewport, preventing its terrain layers from overflowing below the map.

**Shipped 2026-08-31:** Restored N/NE/E/SE/S/SW/W/NW filtering using published launch wind windows. It composes with—not replaces—the station-model horizon filter. The right-side layer control now stays below the expanded filter and scrolls within the viewport. `npm run check` passed (152 tests, lint, and production build); browser verification confirmed no panel overlap and working internal scrolling at a 1280 × 720 viewport.
