# Flight-log evidence for Stans Valley launches and landings

> **Created:** 2026-08-29
> **Status:** done
> **Summary:** Inspect authorised XContest search results for Stans Valley, Niederbauen, and Klewenalp, then add a provider-neutral, clearly labelled analysis store for observed-flight evidence.

## Scope and safeguards

- Use only the user-authenticated, visibly available XContest results; do not bypass access controls or download pilot track files.
- Keep observed-flight analysis separate from reviewed operational facts and keep provider provenance, retrieval time, and inference method.
- Do not surface inferred launch or landing suitability as a recommendation.

## Work

- [x] Inspect the authenticated search and establish what fields are visibly available.
- [x] Map results to the existing site and flight-log model for the three requested areas.
- [x] Add a per-site observed-flight analysis store (no provider import is enabled).
- [x] Verify focused tests and document the outcome.

## Findings

- The authenticated XContest search returned 3,964 flights for the supplied
  3 km start-area query. Result rows expose time, launch label, distance,
  points, glider and a detail link; the visible list also exposes pilot names.
  The product must not persist those names or download raw tracks by default.
- `flight_logs` already preserves provider-neutral endpoint matches. Migration
  019 adds `site_analysis_signals` for timestamped, provider-scoped analysis
  snapshots and a `current_site_analysis_signals` view for current evidence.
- Automated XContest ingestion remains intentionally disabled pending a
  provider agreement or a pilot-owned export, as documented by `flightLogs.ts`.

## Verification

- `npm run check` in `web/` passed: lint, 132 tests, TypeScript build, and Vite
  production build.
- `PARAPENTE_SKIP_OSM_IMPORT=1 npm run db:setup` could not be run to completion
  because PostgreSQL was not accepting connections on `127.0.0.1:5432`; no
  migration failure was observed.

**Shipped 2026-08-29:** Added the auditable, provider-scoped
`site_analysis_signals` store and current-signal view. No XContest flight data
was retained or imported.
