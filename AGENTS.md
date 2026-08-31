# Parapente agent guide

Parapente helps pilots answer a safety-critical question: “where can I paraglide?” The first product surface focuses on flying sites around Lucerne, Switzerland. This file is the repo-wide operating guide; add a nested `AGENTS.md` when a subsystem develops rules that do not apply everywhere.

## Working from plans

- Start material work with a dated markdown plan in `agent-plans/` and keep it current while implementing.
- Plans are decision history. Active plans live in `agent-plans/`, deferred plans in `agent-plans/pipeline/`, and completed or superseded plans in `agent-plans/finished/`.
- Record revisions and shipped outcomes in the plan instead of rewriting the original reasoning.
- Update this guide whenever implementation reveals a durable, repo-wide direction, constraint, or prevention rule. Keep one-off implementation detail in the plan or nearest subsystem guide.

## Product direction

- Build for independent pilots researching possible sites, while making it explicit that the product does not replace local briefings, official notices, airspace checks, or pilot judgement.
- Treat site status, weather, wind, airspace, transport, and access information as time-sensitive. Never present demo or stale data as live.
- Prefer progressive disclosure: make broad suitability scannable, then expose launch, landing, hazards, access, and source details.
- The initial geography is the Lucerne / Lake Lucerne region, but data models and navigation must not hard-code a single region.
- Use concrete, sourced site facts. Store source URLs and last-reviewed timestamps with durable site data once the backend exists.

## Architecture

- `web/` is the React 19 + TypeScript + Vite client.
- `web/server/` is the temporary local-only Node API. It reads PostgreSQL through a small, read-only HTTP surface so the browser never connects directly to the database.
- `db/` owns idempotent PostgreSQL migrations and the local setup script. Schema changes must be migration-driven and portable to a managed PostgreSQL host.
- The web client follows the idioms frontend convention: file-based pages under `web/src/pages/` are converted into lazy React Router routes by `web/src/router.tsx`. `[param].tsx`, `[...param].tsx`, and `index.tsx` follow Next-style path semantics.
- Persistence is local PostgreSQL behind a typed repository seam. A managed Postgres move must stay migration-driven; do not couple components to a database client.
- `db/setup.sh` must reproduce the whole database from nothing: migrations, then every importer in dependency order. Any new importer belongs in `db:import:all` or a fresh clone silently loses that feature.
- Migrations are replayed on every setup run, so every one must be idempotent. Data inserts need a natural key and `ON CONFLICT`.
- Keep design values in semantic CSS custom properties. Support keyboard use, touch targets, visible focus, reduced motion, and responsive layouts from the first implementation.
- Respect the operating system appearance by defining semantic CSS variables in light mode and overriding them with `prefers-color-scheme: dark`. Do not add light-only component colour literals or a separate dark-mode palette that changes the meaning of launch, landing, warning, or status colours. Map styles must follow the same system preference.
- The geographic client uses MapLibre GL JS. The base style is OpenFreeMap; terrain, airspace, wildlife and obstacle overlays come from swisstopo, BAZL and BAFU. Flying-site points come from the local API, not from basemap feature inspection.
- The interface is English only. Pilot accounts in `site_reports` are stored verbatim in the language they were written in, because a translation or parsing error would quietly change what a local source said. Research in any language; present in English.

## Safety and data integrity

- A “good match” is a discovery aid, not a launch recommendation. Avoid deterministic go/no-go language based on incomplete data.
- Weather or site-status UI must include its observation time and source. Missing or demo data must have a visibly different state from verified live data.
- Never silently infer pilot qualifications or site permissions. Airspace, wildlife, landowner, seasonal, and cable restrictions must be preserved as first-class data.
- Verify material site facts against an official operator, local club/school, or governing-body source before presenting them as factual.
- Preserve the distinction between `mapped`, `reviewed`, and `live`: an imported OpenStreetMap point is `mapped`, not reviewed. Only upgrade status with a concrete operational source and review date.
- Do not imply data completeness. “Everything around the lake” means everything in the current declared source snapshot and bounds, not every possible or legal site.
- Weather-station records and controls must remain non-live or disabled until a timestamped authoritative feed is connected.

## Verification

- Run `npm run check` from `web/` for normal web changes; it typechecks, lints, tests, and builds.
- Run `npm run db:setup` from `web/` after migration or importer changes, run it TWICE, and confirm row counts are unchanged the second time. Then check `/api/health`.
- Add focused tests for routing, data normalization, filtering, and safety-critical presentation logic.
- Do not treat a visually plausible map or forecast as proof that its underlying data is current.

## Sourcing site data

- Prefer sources that ENUMERATE launches with bearings over prose written for pilots who already know the hill. Turning narrative into structured data produced three successive wrong wind models for Niederbauen. A federation sheet, a club page listing launches, or a per-direction rating is structured; an avalanche paragraph is not.
- Authority order: governing body (SHV/FSVL), then flight school or lift operator, then club, then community databases. `site_reports.authority` carries this and the UI sorts by it.
- Check `robots.txt` before fetching, and treat a refusal as final. XContest, DHV-XC, Leonardo, thermal.kk7.ch and paraglidingmap all disallow the data we would want; ParaglidingEarth (CC BY-SA 3.0), ens.ch, SHV/FSVL and the federal geo services permit it.
- Never merge two records on horizontal distance alone. Elevation separated the two Titlis launches, an enumerating source separated Fronalpstock, and two agreeing sources merged Gummen.
- Record what a source confirms, not just that it exists: `site_sources.confirms` distinguishes a position from a description, and corroboration counts DISTINCT providers so several facts from one dataset stay one source.
- Absence of evidence is not evidence of absence. `region_coverage` decides whether a missing flight or a missing sheet means anything, and it is set for Switzerland only.
