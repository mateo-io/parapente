# Swisstopo Terrain Basemap And Basemap Seam

> **Created:** 2026-08-28
> **Status:** in-progress
> **Summary:** Extract the basemap into its own module, add free swisstopo terrain overlays so the map carries the information a pilot actually reads, and use the slope layer to triage the 82 unreviewed OpenStreetMap points.

## Outcome

The explorer stops being a street map with pins on it. Pilots can switch on the Swiss national topographic map, hillshade, and the ≥30° slope classification, so launch orientation, steepness, and tree line are legible at a glance. The basemap becomes a replaceable seam rather than a URL literal inside a map component, and the slope layer becomes the review tool that lets `mapped` OpenStreetMap points be checked against terrain.

## Decisions

- Keep MapLibre GL JS. The basemap question is a style/source question, not a renderer question.
- Reject Google Maps and Apple MapKit JS. The decisive reason is fitness, not price: neither exposes Alpine terrain as controllable vector or raster layers, both restrict overlaying and caching, and Apple additionally requires a paid developer account. Cost is a secondary argument.
- Use swisstopo (`wmts.geo.admin.ch`) open government data for terrain. It is free, keyless, and is the cartography Swiss pilots already read on paper and in other flying tools.
- Keep OpenFreeMap Liberty as the default base style. Swisstopo layers are opt-in overlays, off by default, so the first paint stays fast and the map still works outside Switzerland.
- Treat terrain layers as orientation aids, not assessments. A slope shading is not a launch judgement, and the existing safety framing rules apply to it unchanged.
- Put basemap and overlay definitions behind `web/src/features/spots/basemap.ts`, mirroring the existing `SpotRepository` seam, so a global provider can replace swisstopo when coverage leaves Switzerland.

## Work

- [x] Verify the swisstopo terms of use and fair-use limits, and record the attribution string the licence requires.
- [x] Delete `web/src/lib/backend.ts` and the `VITE_SUPABASE_*` scaffolding that exists only to serve it.
- [x] Extract `web/src/features/spots/basemap.ts` holding the base style plus a typed overlay registry, and reduce `LakeLucerneMap.tsx` to consuming it.
- [x] Enable the MapLibre attribution control and carry `© swisstopo` alongside the existing OpenStreetMap credit.
- [x] Add swisstopo WMTS raster overlays: national map, hillshade, slope classification ≥30°, and SWISSIMAGE aerial.
- [x] Add a `providers` table so each record carries its origin and redistribution status.
- [x] Add an accessible overlay switcher in English and German.
- [ ] Persist the overlay choice across reloads.
- [x] Add focused tests for the overlay registry and attribution composition.
- [ ] Triage the 82 `mapped` OpenStreetMap points against the slope and hillshade layers, and record which are implausible rather than silently upgrading any status.
- [ ] Close the launch-coverage gap around Buochs from federation and club sources.
- [x] Run `npm run check` and confirm lint, tests, typecheck, and the production build pass.
- [ ] Confirm tile rendering in a real browser, which the agent browser pane cannot do.
- [ ] Record shipped outcomes, update `AGENTS.md`, and move this plan to `finished/`.

## Out of scope

- Live weather, DABS, NOTAM, or airspace feeds. Airspace layers are a candidate for a later slice and must not be presented as current until an authoritative timestamped source is connected.
- Upgrading any site from `mapped` to `reviewed`. Terrain corroboration narrows the candidates; it is not an operational source.
- Replacing OpenFreeMap or adding a non-Swiss terrain provider. The seam is built now, the second provider lands when coverage leaves Switzerland.
- 3D terrain and elevation extrusion.

## Implementation notes

**Dependency audit, 2026-08-28:** `web/package.json` was reviewed for bloat before this slice. Every runtime dependency is load-bearing: `maplibre-gl`, `react`, `react-dom`, `react-router-dom`, `lucide-react` (17 icons, tree-shaken), `express`, `pg`, and `dotenv` are each imported by shipped code, and `concurrently` backs the `dev` script. No dependency was removed. The only genuine dead code found in the whole client was `src/lib/backend.ts`, whose single export `backendConfig` has no consumer, so its removal is folded into this plan rather than left as a separate cleanup.


## Verified layer identifiers

Every identifier below was probed against `wmts.geo.admin.ch` and returned a tile.
The URL template is `https://wmts.geo.admin.ch/1.0.0/{layer}/default/current/3857/{z}/{x}/{y}.{format}`.

| Overlay | WMTS layer | Format |
| --- | --- | --- |
| Swiss topo map | `ch.swisstopo.pixelkarte-farbe` | jpeg |
| Aerial imagery | `ch.swisstopo.swissimage` | jpeg |
| Relief shading | `ch.swisstopo.swissalti3d-reliefschattierung` | png |
| Slope over 30° | `ch.swisstopo.hangneigung-ueber_30` | png |
| Wildlife rest zones | `ch.bafu.wrz-wildruhezonen_portal` | png |

`ch.swisstopo.relief-shading` and `ch.swisstopo.hangneigung-ueber_30_monodirektional` do not exist and return HTTP 400.

## Licence position

swisstopo geodata is open government data. Commercial use is explicitly permitted and no key or registration is required, provided the source is credited as `© swisstopo`. There is no published numeric rate limit; the terms reserve the right to restrict access on excessive use. Wildlife rest zones come from BAFU and are credited separately.

## Reference product

The reference product at `paraglidingmap.com` is not a data source for this project. Its `robots.txt` names `ClaudeBot` under `Disallow: /`, and disallows `/app/` for every user agent, which is where its site records live. Site descriptions must come from OpenStreetMap, the federation, clubs, schools, or operators instead. The `providers` table exists so that if third-party descriptions are ever added by hand, their origin and redistribution status travel with them.

## Coverage finding

Real driving times from Buochs (46.9740, 8.4206) were measured with a single OSRM table request. Within 30 minutes there are 25 sites: 21 landings but only 4 launches. Well-known launches near Buochs including Stanserhorn, Klewenalp, Musenalp and Buochserhorn are absent. OpenStreetMap maps landing fields far better than launches in this region, so launch coverage is the real data gap and needs a federation or club source rather than more OSM importing.
