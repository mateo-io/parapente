# Parapente web

React 19 + TypeScript + Vite map for researching paragliding launches and landings around Lake Lucerne. Routes are generated lazily from `src/pages/` using Next-style filenames. A local Node API reads PostgreSQL until the Supabase backend is ready.

## Local development

```bash
npm install
npm run db:setup
npm run dev
```

`db:setup` creates the local `parapente` database with the current macOS user, applies idempotent migrations, adds the reviewed seed records, and refreshes the wider Lake Lucerne OpenStreetMap snapshot. `dev` starts the local API and Vite together.

Run the complete code gate with `npm run check`. The local API is available at `http://127.0.0.1:8787/api/health` while development is running.

## Routes

| File | Route |
| --- | --- |
| `src/pages/index.tsx` | `/` |
| `src/pages/spots/[slug].tsx` | `/spots/:slug` |
| `src/pages/[...404].tsx` | catch-all |

## Local data boundary

`../db/migrations/` is the schema source of truth. `server/index.ts` exposes read-only health and site endpoints, while `src/features/spots/repository.ts` keeps the map independent of that implementation.

The map displays two provenance levels:

- `reviewed`: curated against an operator, local school, or association source.
- `mapped`: imported from OpenStreetMap and explicitly not operationally reviewed.

English and German site text live in `site_translations`. OpenStreetMap refreshes create cautious generic translations; reviewed records receive specific human-authored translations.

Supabase and authentication are intentionally not connected yet. `web/.env.example` reserves only the browser-safe project URL and publishable key; add the Supabase client, generated database types, and auth state after the backend contract is agreed.

Never put a service-role key in this app or in a `VITE_*` variable.
