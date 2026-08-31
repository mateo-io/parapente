# Station-based forecast matching

> **Created:** 2026-08-31
> **Status:** done
> **Summary:** Replace the global compass filter with station-coordinate forecast matching for now, +2 hours, and +4 hours, without presenting the result as a launch decision.

## Decision

Use the coordinates of each launch's already-linked MeteoSwiss station for Open-Meteo calls. Batch the distinct station coordinates in one or more multi-location requests, cache the result server-side, and share it among every launch using that station.

The filter is a forecast-direction match against a launch's sourced wind windows. It cannot establish that a launch is flyable: local wind, strength, gusts, thermal cycles, airspace, and site status remain unresolved. The UI therefore uses “potentially suitable” language and keeps all three horizons selected by default.

## Work

- [x] Add server-side batched Open-Meteo station forecast retrieval and tests.
- [x] Add a cached API endpoint returning now, +2 h, and +4 h forecasts by station code.
- [x] Replace compass-filter state and UI with horizon checkboxes and a safety-qualified match filter.
- [x] Preserve the selected launch's separately labelled point forecast; a compact per-horizon panel is deferred so the filter change remains legible.
- [x] Run web checks and verify API output.

**Shipped 2026-08-31:** `/api/flyability` returned 19 distinct station forecasts with all three horizons. `npm run check` passed: lint, 152 tests, and production build.
