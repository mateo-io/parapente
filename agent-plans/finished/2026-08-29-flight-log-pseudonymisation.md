# Pseudonymous flight-log import boundary

> **Created:** 2026-08-29
> **Status:** done
> **Summary:** Add a one-way, keyed pseudonymisation boundary for provider-approved or pilot-owned flight-log imports without retaining pilot names.

## Decisions

- Do not bulk-harvest authenticated XContest pages: an account session is not a provider data-use agreement.
- Raw pilot names must be transformed in memory before constructing a `RawFlight` or SQL parameter set.
- Use a keyed HMAC rather than a plain hash so common names cannot be reverse-looked-up. Store only the provider-scoped opaque reference.

## Work

- [x] Add and test keyed pilot pseudonym generation.
- [x] Document the import boundary and verification.

## Verification

- `npm run test -- --run server/flightLogs.test.ts` passed (12 tests).
- `npm run build` passed.

**Shipped 2026-08-29:** `pseudonymisePilot` uses a secret keyed HMAC to create
stable UUID-shaped references before any `RawFlight` or SQL input exists. The
secret is intentionally external to the repository and database.
