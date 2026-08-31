# Sparse Launch Research, Round Two

> **Created:** 2026-08-30
> **Status:** complete
> **Summary:** Continue source-backed enrichment for mapped launches that lack published wind directions and local operating context.

## Decisions

- Work in clusters covered by one SHV/FSVL sheet so all facts retain a consistent authority and revision.
- Match source names by coordinates and operational identity, never distance alone.
- Keep any launch without an explicit published direction in the unknown-wind state.

## Work

- [x] Locate the next eligible sheet and match its launches.
- [x] Add idempotent wind windows, notes, restrictions, and provenance.
- [x] Replay the database twice and run the web check.

## Verification

- Added migration `033_oberhasli_brienz_launches.sql` from the SHV/FSVL
  Oberhasli--Brienz sheet: detailed wind windows and operating reports for
  Sandhubei Reuti, Planplatten, Hofstetter Gummen and Axalp Schyberg;
  new Bidmi and Innertkirchen landings; and reviewed updates to Meiringen Du
  Pont and Aaregg Brienz. The sheet's 16 launch--landing pairings, Meiringen
  airspace and Brienzergrat wildlife cautions are retained with source links.
- The migration reapplied successfully in a second `db:setup` pass. Its
  final external hazard-import stage received an Overpass HTTP 429, so that
  refresh could not complete; it does not alter the newly migrated site data.
- `npm run check` passed: lint, 145 tests, TypeScript, and production build.
- `/api/health` returned 155 sites (109 launches, 46 landings), reviewed
  through 2026-08-30.
