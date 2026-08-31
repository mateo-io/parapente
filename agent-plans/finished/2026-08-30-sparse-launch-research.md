# Sparse Launch Research

> **Created:** 2026-08-30
> **Status:** done
> **Summary:** Improve launches lacking published wind directions and attributed local knowledge using permitted, traceable sources.

## Decisions

- Prioritise launches with both no wind window and no site report, then use structured federation sheets before narrative sources.
- Wind directions require an explicit published bearing or direction; never derive them from a map marker, name, or terrain aspect.
- Pilot accounts remain verbatim and attributed. Operator, club, and federation rules are stored as their own source-backed reports, not presented as pilot testimony.

## Work

- [x] Audit sparse launches and select the next source-covered areas.
- [x] Add idempotent wind windows, reports, and provenance for confirmed facts.
- [x] Replay the database twice and run the web check.

## Verification

- `npm run db:setup` completed twice. The second replay held at 57 OSM records, 72 ParaglidingEarth corroborations, and 1,049 mapped hazards, with no stale duplicates.
- Launches with published wind arcs rose to 73 of 107; launches with attributed notes rose to 22. Nine exact sheet matches were upgraded from mapped to reviewed.
- `npm run check` passed: lint, 145 tests, typecheck, and production build.

**Shipped 2026-08-30:** Added SHV/FSVL wind windows, operational notes, descriptions, cautions, and provenance for Rigi Kulm, Staffelhöhe, Rigi Scheidegg, Rotenflue Südwest, Rotmoos, Grosser Sternen, Timpel/Urmiberg, Bietstöckli, Gipfel Fronalpstock, and the recently reviewed Euthal, Hummel, Marbach and Brunni launches. The new notes are explicitly marked governing-body operational information, not pilot testimony; no fresh permitted verbatim pilot account was located in this batch.
