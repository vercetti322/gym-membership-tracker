# Project Guidelines

## Architecture

- The React and Mantine client is in `src/react-app/`; the Hono API and D1 data access are in `src/worker/`.
- D1 schema changes belong in a new ordered SQL migration under `migrations/`. Do not edit an already-applied migration.
- Keep secrets out of source control. Use `.dev.vars` locally and Worker secrets for deployed environments.

## Code Style

- Use TypeScript and follow the existing patterns and formatting in nearby files.
- Keep changes focused; preserve the existing client/API boundary and use the shared member types where applicable.
- Update the README when setup, scripts, routes, or other user-facing project behavior changes.

## Build and Validation

- `npm run build` — type-check and build the client and Worker.
- `npm run lint` — run ESLint.
- `npm run check` — build and run a Wrangler deployment dry run.
- Run the narrowest relevant validation for each change; run build and lint for broader changes.

## Cloudflare

- For changes involving Workers, D1, Wrangler, or another Cloudflare product, consult the current official Cloudflare documentation before implementation; do not rely on remembered API behavior or limits.
- For limits and quotas, use that product's official limits page.
- After changing Cloudflare bindings in `wrangler.json`, run `npm run cf-typegen`.
- Treat remote database commands as operations against real data. In particular, `npm run db:seed:remote` deletes existing member and plan-history rows.
