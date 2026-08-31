# Landing Data Enrichment

> **Created:** 2026-08-30
> **Status:** done
> **Summary:** Enrich landing records with explicitly sourced operational roles, descriptions, and hazards without using the DHV database, which disallows automated access.

## Scope and decisions

- Use permitted governing-body and operator sources, beginning with SHV/FSVL information sheets already established in the database.
- Keep each landing's use role on its launch-to-landing pairing as well as the landing-level summary role; do not infer permission from geometry or proximity.
- Preserve operational cautions and restrictions as structured records or attributed reports; never turn incomplete source material into a go/no-go recommendation.
- Do not fetch or import DHV content: its robots policy explicitly disallows this agent's access.

## Work

- [x] Audit existing landing facts and identify records covered by permitted authoritative sheets.
- [x] Add an idempotent migration with reviewed landing descriptions, hazards, roles, pairings, provenance, and any restrictions confirmed by those sources.
- [x] Run the database setup twice, confirm stable counts, and run the web check.

## Verification

- `npm run db:setup` completed twice. The second replay retained 68 OSM sites, 72 corroborated ParaglidingEarth records, and 1,049 mapped hazards.
- Local `/api/health` returned `ok: true`; the database now has 39 landings, 15 reviewed and official.
- `npm run check` passed: lint, 142 tests, typecheck, and production build.

**Shipped 2026-08-30:** Added reviewed, official landing data for Engelberg, Herrenrüti, Küssnacht, Goldau, Weggis, Brunnen and the new Stoos winter landing. The records retain SHV/FSVL sheet links, named sheet labels, explicit launch pairings, operational descriptions, and source-specific cautions. DHV remains excluded under its robots policy.
