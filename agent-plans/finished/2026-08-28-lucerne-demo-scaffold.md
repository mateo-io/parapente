# Lucerne Demo Scaffold

> **Created:** 2026-08-28
> **Status:** done
> **Summary:** Establish the Parapente web architecture and a polished, clearly labelled Lucerne-region spot-finder demo.

> **Shipped 2026-08-28:** Added the complete `web/` scaffold, lazy file-based routes, four sourced demo area briefs, filtering and map selection, responsive detail and safety views, tests, and repo guidance. The local preview opens successfully and the full web check passes.

## Outcome

Create a working `web/` app that demonstrates the product’s central loop: set a few broad preferences, scan plausible flying areas near Lucerne, and open enough site context to decide what to research next. Supabase remains a typed integration seam until the backend and auth details are supplied.

## Decisions

- Follow the proven idioms frontend architecture: React 19, Vite, TypeScript, React Router, lazy file-based routes, page/feature/component separation, semantic theme tokens, and a single broad verification command.
- Use Next-style filenames through a small local route adapter rather than adopting the Next.js runtime.
- Keep the first experience map-led on larger screens and list-led on mobile.
- Ship realistic demo records for Brunni, Niederbauen, Pilatus, and Rigi, each marked as demo/research data with an official source link where available.
- Do not model Supabase tables or implement authentication before the product contract is provided.

## Work

- [x] Add the Vite/React/TypeScript project and package scripts.
- [x] Add lazy file-based routing for `/` and `/spots/:slug`.
- [x] Add typed spot data and a replaceable repository boundary.
- [x] Build the responsive Lucerne discovery page with search, pilot-level filters, map selection, and useful empty states.
- [x] Build a spot details page with explicit safety/demo framing and official source links.
- [x] Add baseline routing and filtering tests.
- [x] Install dependencies and pass the full web check.
- [x] Update repo guidance and this plan with durable learnings and shipped status.

## Verification

- `npm run check` — ESLint clean, 8 tests passing, TypeScript clean, production Vite build successful.
- Local preview opened at `http://127.0.0.1:5173/` with the expected site title.

## Implementation note

**Revised 2026-08-28:** The scaffold reserves Supabase environment names and a typed repository seam but deliberately does not install or instantiate the Supabase client. That prevents an invented schema/auth contract from leaking into the first demo.

## Out of scope

- Supabase schema, migrations, project credentials, row-level security, and auth UI.
- Live weather, NOTAM/DABS, airspace, lift status, or site-status integrations.
- A production cartographic provider and precise geospatial interaction.
- Deployment.
