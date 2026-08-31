# Persistent Glide Overlay

> **Created:** 2026-08-30
> **Status:** done
> **Summary:** Keep launch-to-landing planning lines visible for a selected launch, while allowing a hovered launch to preview its own lines temporarily.

## Decisions

- Hover takes precedence over selection so map exploration remains immediate; leaving a marker restores the selected launch overlay.
- Selecting a landing or clearing selection removes the lines unless another launch is actively hovered.
- The overlay remains a planning aid, not an assertion of a flyable route.

## Work

- [x] Centralise active-launch selection for the glide overlay.
- [x] Sync map hover, selection, and style restoration to that state.
- [x] Add focused tests and run the web check.

## Verification

- `npm run check` passed: lint, 145 tests, typecheck, and production build.

**Shipped 2026-08-30:** A selected launch now keeps its glide overlay visible. Hovering another launch previews that launch, and leaving the marker restores the selected launch; selecting a landing clears the overlay.
