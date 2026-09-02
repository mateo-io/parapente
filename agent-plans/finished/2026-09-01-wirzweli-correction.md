# Wirzweli data correction — 2026-09-01

## Goal

Correct the Wirzweli flying-site record and distinguish it from Gummen using current, launch-specific evidence.

## Guardrails

- Never transfer Gummen facts to Wirzweli simply because the launches share an area.
- Correct the existing natural-key record rather than introduce a duplicate.
- Do not use a source’s broad area narrative as a precise wind window unless it identifies the launch and direction.

## Plan

1. **Completed** — Found a non-matching slug in the previous migration and established that Gummen Bergstation and Vorderer Gummen are distinct points.
2. **Completed** — Added an idempotent correction and made the importer choose the closest matching source point instead of the first point within its broad merge radius.
3. **Completed** — Rebuilt twice, checked the API, and ran the full web check.

## Outcome

- Wirzweli now distinguishes the lower launch (N), Horn (N), Gummen Bergstation (no shown wind range because its historical sources conflict), and Vorderer Gummen (S/SSW evidence).
- The incorrectly merged Gummen Bergstation point is restored as a separate mapped launch. Its caution explains why it is excluded from forecast-direction matching until a current local source resolves the conflict.
- The OSM/PGE ingestion path now chooses the closest candidate within its corroboration radius and preserves source-backed directions and translated labels during OSM refreshes. A focused regression test covers the nearest-point choice.
- `npm run db:setup` succeeded twice; `/api/health` returned 156 total sites (110 launches); `npm run check` passed with 153 tests.
