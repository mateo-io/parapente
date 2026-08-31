# Selection contrast

> **Created:** 2026-08-30
> **Status:** done
> **Summary:** Make selected copy legible in both system color schemes.

## Plan

- [x] Add a semantic selection foreground token with sufficient contrast against the signal selection fill.
- [x] Apply the token to native text selection.
- [x] Run the web verification suite.

**Shipped 2026-08-30:** Native selection now uses a dark ink token in both themes, including dark mode where the signal fill remains lime. `npm run check` passed (lint, 142 tests, and production build).
