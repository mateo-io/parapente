# Sparse Site and Flight-Evidence Enrichment

> **Created:** 2026-08-30
> **Status:** done
> **Summary:** Enrich the least-described launches and landings from permitted primary sources, and establish whether any lawful flight-log source can provide observed evidence.

## Decisions

- Prioritise reviewed sites with empty summaries or no operational provenance, using SHV/FSVL sheets and official operators or clubs.
- Preserve source-specific hazards, airspace, access, and seasonal rules; do not infer them from terrain or nearby sites.
- Flight logs may only be imported from a source with explicit API/export permission. A target of ten flights per launch is a coverage goal, not a reason to scrape or invent records.

## Work

- [x] Identify sparse reviewed and mapped sites that have a permitted authoritative source.
- [x] Add idempotent site details and provenance for the selected areas.
- [x] Audit lawful flight-log sources; no importer was added because no source met the access and redistribution requirements.
- [x] Replay the database twice and run the web check.

## Verification

- `npm run db:setup` completed twice. The second replay held at 66 OSM records, 72 ParaglidingEarth corroborations, and 1,049 mapped hazards, with no stale duplicates.
- The local `/api/health` endpoint returned `ok: true`: 151 total sites, 107 launches and 44 landings; 34 sites are reviewed.
- `npm run check` passed: lint, 142 tests, typecheck, and production build.

## Flight-log audit

- ParaglidingEarth's documented CC BY-SA API provides site records, not observed flight logs.
- WeGlide's track downloads require an authenticated account token; this is not an API or redistribution agreement and must not be used for bulk collection.
- Skylogs and comparable logbooks use owner-controlled public sharing. They do not offer a permitted regional bulk feed.
- `flight_logs` remains correctly empty. The lawful path to the ten-flights-per-launch goal is a provider agreement or pilot-authorised IGC/GPX exports; the existing provider-neutral normaliser is ready for those files.

**Shipped 2026-08-30:** Added detailed SHV/FSVL Marbach coverage (two paragliding launches, three official landings, six explicit pairings, circuits and wildlife agreement) and the scoped Wolfenschiessen groundhandling closure evidence.
