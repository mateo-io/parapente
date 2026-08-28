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
- `db/` owns idempotent PostgreSQL migrations and the local setup script. Schema changes must be migration-driven and remain compatible with a later Supabase PostgreSQL move.
- The web client follows the idioms frontend convention: file-based pages under `web/src/pages/` are converted into lazy React Router routes by `web/src/router.tsx`. `[param].tsx`, `[...param].tsx`, and `index.tsx` follow Next-style path semantics.
- Supabase will own persistence and authentication. Until its contract is defined, keep demo records behind typed repository/query boundaries and do not invent production schemas or auth behavior.
- Keep browser-facing Supabase values limited to the project URL and publishable/anon key. Service-role credentials must never enter `web/` or any `VITE_*` variable.
- Keep design values in semantic CSS custom properties. Support keyboard use, touch targets, visible focus, reduced motion, and responsive layouts from the first implementation.
- Respect the operating system appearance by defining semantic CSS variables in light mode and overriding them with `prefers-color-scheme: dark`. Do not add light-only component colour literals or a separate dark-mode palette that changes the meaning of launch, landing, warning, or status colours. Map styles must follow the same system preference.
- The geographic client uses MapLibre GL JS with OpenFreeMap tiles. Flying-site points come from the local API, not from basemap feature inspection.
- English and German are the initial product locales. Add or change user-facing map copy and persisted site translations together.

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
- Run `npm run db:setup` from `web/` after database migrations or import changes and verify `/api/health` plus English and German site responses.
- Add focused tests for routing, data normalization, filtering, and safety-critical presentation logic.
- Do not treat a visually plausible map or forecast as proof that its underlying data is current.
