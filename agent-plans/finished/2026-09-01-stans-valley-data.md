# Stans Valley flying-site data — 2026-09-01

## Goal

Expand reviewed, source-backed flying-site information for the Stans Valley corridor south of Buochs: Stanserhorn, Wolfenschiessen / Brändlen / Haldigrat / Büelen, and Engelberg where authoritative area sheets cover it.

## Guardrails

- Treat wind direction as a site-specific operational fact, never terrain inference or a go/no-go result.
- Prefer SHV/FSVL and current local operators; retain `mapped`, `reviewed`, and `live` distinctions.
- Add only source-confirmed launch, landing, access, hazard, airspace, and restriction facts, with URLs and review dates.
- Preserve existing records and natural keys; migration must be replay-safe.

## Plan

1. **Completed** — Inventoried existing sites and researched current operator sources, including Brunni, Fürenalp and Haldigrat. The locally linked Büelen sheet was checked directly and is dated 2016.
2. **Completed** — Added source-backed records through idempotent migration `035_stans_valley_operator_data.sql`.
3. **Completed** — Rebuilt the database twice and checked the local API.

## Decisions and revisions

- Scope includes Engelberg because it is part of the same south-of-Buochs valley route and is covered by the SHV/FSVL Engelberg area sheet.

## Outcome

- Brunni now has three reviewed, distinct launches: Tümpfeli (S–SE), Härzlisee (W), and Schonegg (S), with access, capacity and current operator safety guidance.
- Fürenalp is reviewed with current Föhn and access guidance; no new direction range was inferred because the current source does not publish one.
- Haldigrat retains its mapped coordinate, while its current operator conditions, wildlife restriction, cable/lee-thermal hazards and Schützenhaus landing pairing are recorded with provenance.
- Büelen holds two historical launch sections and cable hazards from the still-linked but 2016 school sheet; these are deliberately not used as current forecast-filter wind windows.
- `npm run db:setup` succeeded twice. `/api/health` returned healthy and the Brunni endpoint returned the reviewed wind window and sources.
