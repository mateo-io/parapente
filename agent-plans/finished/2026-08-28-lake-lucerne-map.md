# Lake Lucerne Map And Local Database

> **Created:** 2026-08-28
> **Status:** done
> **Summary:** Replace the abstract shortlist with a real Lake Lucerne map backed by an idempotently provisioned local PostgreSQL database and translated flying-site records.

> **Shipped 2026-08-28:** Replaced the shortlist with a full-viewport MapLibre Lake Lucerne explorer, created the local `parapente` PostgreSQL database and read-only API, added English/German UI and site translations, and populated 4 reviewed plus 82 mapped OpenStreetMap records.

## Outcome

The main product surface becomes a full-viewport geographic explorer centered on Lake Lucerne. Pilots can scan launches and landings, change language, filter site types, and open a compact research panel without leaving the map. A local API reads the markers from PostgreSQL so the schema can later migrate cleanly to Supabase.

## Decisions

- Use MapLibre GL JS with a token-free OpenStreetMap-based basemap rather than a hand-drawn orientation map.
- Keep site markers and translations in PostgreSQL. English and German are the initial product languages because the first region is in German-speaking Switzerland.
- Model launches and landings as the first site types. Weather stations remain a first-class future type, but they will not be presented as live until a timestamped authoritative feed is connected.
- Seed a reviewable Lake Lucerne dataset with provenance and last-reviewed fields. Do not scrape or claim complete proprietary coverage from the reference product.
- Put database creation, migrations, and seed application behind one idempotent setup script using the local PostgreSQL user.
- Keep the API read-only for this slice and keep the repository seam replaceable by Supabase.

## Work

- [x] Inspect the reference view, local Postgres availability, and neighboring project environment conventions without exposing secrets.
- [x] Add PostgreSQL migrations for sites, translations, provenance, and geospatial-friendly indexes.
- [x] Add an idempotent setup script that creates the `parapente` database and applies migrations/seeds.
- [x] Add a small local API with health, site-list, language, bounds, and type filters.
- [x] Replace the existing landing/list explorer with a full-viewport Lake Lucerne map and marker clustering.
- [x] Add English/German UI and translated site content.
- [x] Add selected-site details, safety framing, source freshness, filters, and responsive mobile behavior.
- [x] Run the setup script and verify the database, API, tests, typecheck, lint, and production build.
- [x] Record shipped outcomes, update durable agent guidance, and move this plan to `finished/`.

## Verification

- Ran `npm run db:setup` twice: the first run created `parapente`; the second confirmed database, schema, seed, and OSM import idempotency.
- `/api/health` reports 86 sites: 48 launches and 38 landings, reviewed through 2026-08-28.
- German `/api/sites` response returns translated reviewed and mapped records.
- `npm run check` passes ESLint, 10 focused tests, TypeScript, and the production Vite build.
- The combined local API/Vite development process is running without logged server errors.

## Implementation notes

**Revised 2026-08-28:** The reference product contains proprietary coverage and live weather layers. This implementation uses a declared OpenStreetMap snapshot plus separately reviewed records and keeps weather disabled until an authoritative timestamped feed is connected.

**Revised 2026-08-28:** PostgreSQL connection details use the confirmed local `pachosky` role with no copied password. The ignored root `.env` contains only the local connection URL and API port.

## Out of scope

- Authentication and user-owned data.
- A live meteorological, NOTAM/DABS, airspace, or lift-status feed.
- Copying proprietary marker data or design assets from the reference service.
- Production deployment or Supabase provisioning.
