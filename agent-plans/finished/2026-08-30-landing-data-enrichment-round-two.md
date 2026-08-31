# Landing Data Enrichment, Round Two

> **Created:** 2026-08-30
> **Status:** done
> **Summary:** Extend reviewed landing coverage with the next permitted SHV/FSVL area sheets, retaining source-specific landing procedures and restrictions.

## Decisions

- Continue from governing-body sheets with named landing fields, coordinates, and operational notes.
- Upgrade a mapped field only when its identity is corroborated by the sheet's name, position, and elevation; otherwise add a distinct reviewed record.
- Keep seasonal, circuit, obstacle, and permission facts explicit and source-linked. Unknown landings remain unknown.

## Work

- [x] Identify available SHV/FSVL sheets and match their named landings to current records.
- [x] Add idempotent reviewed records, pairings, descriptions, and restrictions.
- [x] Replay the database twice and run the web check.

## Verification

- `npm run db:setup` completed twice. The second replay imported 66 OSM records, skipped 17 near reviewed records, and created no stale duplicates; ParaglidingEarth remained at 72 corroborations and hazards at 1,049.
- The local `/api/health` endpoint returned `ok: true` with 146 total records: 41 landings, 19 reviewed and official.
- `npm run check` passed: lint, 142 tests, typecheck, and production build.

**Shipped 2026-08-30:** Added SHV/FSVL-reviewed landing records for Euthal and Hummel Sportplatz; upgraded Weglosen and Rickenbach; added the directly paired Euthal and Hummel launches; and captured landing circuits, cable/power-line hazards, valley-wind and Bise cautions, ground-use rules, and three area-level restrictions.
