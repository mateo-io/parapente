# Collapsible Map Sidebar

> **Created:** 2026-08-30
> **Status:** done
> **Summary:** Remove map footer/snapshot chrome and let pilots collapse and restore the map-layer sidebar.

## Decisions

- The right-side layer control is the collapsible sidebar; its controls keep their state while hidden.
- The collapsed control remains in the same upper-right map context, exposes its expanded state to assistive technology, and has a text label plus arrow icon.
- Remove both the map footer and the non-live research-snapshot badge rather than merely hiding them.

## Work

- [x] Add sidebar open/closed state and controls.
- [x] Remove map footer and snapshot markup plus obsolete styles/copy.
- [x] Verify responsive behaviour and run the web check.

## Verification

- `npm run check` passed: lint, 145 tests, typecheck, and production build.

**Shipped 2026-08-30:** The map footer and map research-snapshot badge are gone. The right map-layer sidebar closes with an arrow and is restored through a compact labelled badge in the same map context; its layer state remains intact while closed.
