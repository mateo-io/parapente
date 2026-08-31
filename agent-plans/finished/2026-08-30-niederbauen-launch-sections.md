# Niederbauen launch sections

> **Created:** 2026-08-30
> **Status:** done
> **Summary:** Model the named launch zones within the single lower Niederbauen site, ingest its source-backed section data, and present it as progressive-disclosure detail without changing the site's shared facts.

## Decision

Keep Niederbauen as one lower launch site. Its North, South-West, and South-East names are launch sections rather than separate sites. Store the sections as a schema-constrained JSONB column on `sites`, so they remain tied to the shared access, landing, source, and safety context.

Each section will have a stable key, display name, description, preferred and acceptable non-wrapping wind arcs, specific hazards/cautions, and source metadata. The UI will only render the section disclosure when populated.

Chulm is intentionally out of scope: it is a separate launch area and requires a separate, current-source reconciliation before ingestion.

## Work

- [x] Inspect the existing API/repository and detail-page patterns, including the current dirty worktree, before editing.
- [x] Add an idempotent migration with a JSONB schema check and source-backed Niederbauen sections.
- [x] Thread validated section data through the local API and client types.
- [x] Add accessible collapsible section cards to the site detail page, leaving the shared site information unchanged.
- [x] Add focused tests for data normalization and conditional presentation.
- [ ] Run the database setup twice and check `/api/health` once local PostgreSQL is available.

## Sources

- Alpingliders Emmetten, current lower-site overview: one broad launch at the mountain station; S, SW, NW, N, NE.
- Flugschule Emmetten, linked 2016 operational sheet: named North, South-West, and South-East sections with their launch-specific handling notes.
- Flugschule Emmetten, current operating page: continuing references to the North, SE, and SW launches; North avalanche warning.

## Verification

- `npm run check` in `web/` passed on 2026-08-30: lint, 147 tests, and production build.
- `npm run db:setup` could not start because local PostgreSQL was not accepting connections on `127.0.0.1:5432`; therefore the required two setup replays and `/api/health` check could not be performed in this workspace.

**Revised 2026-08-30:** The web implementation and its checks are complete. Database replay remains pending because PostgreSQL is unavailable in this workspace; no separate sites were created.

**Revised 2026-08-31:** Put the compact, source-linked launch-section disclosures in the map drawer as well as the research page. This is the decision point pilots encounter first; the full page remains the place for the longer explanation.

## Follow-up work — 2026-08-31

- [x] Add compact, progressively disclosed section cards to the selected-site map drawer.
- [x] Make the historical status of the South-East section clear before it is expanded.
- [x] Re-run web checks; database verification remains contingent on local PostgreSQL.

**Verification 2026-08-31:** `npm run check` passed: lint, 147 tests, and the production build. Database replay and API health verification were temporarily pending while the sandbox could not reach the host PostgreSQL service.

**Revised 2026-08-31:** The explorer route was allowed to throw when the temporary local API was unavailable, resulting in the route-interrupted screen. Added a non-throwing map loader and focused tests for both API success and failure.

**Verification 2026-08-31 (follow-up):** `npm run check` passed: lint, 149 tests, and production build. A standard-sandbox dev-server check could not open `tsx`'s temporary IPC pipe; an approved server start confirmed both processes can start outside that sandbox.

**Shipped 2026-08-31:** Replayed `npm run db:setup` twice through the host PostgreSQL service. Both runs produced 155 total sites (109 launches, 46 landings); `/api/health` returned `ok: true`; and the Niederbauen API payload returned North (current), South-West (corroborated), and South-East (historical) sections.
