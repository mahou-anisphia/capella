# Capella

Next.js (App Router) + tRPC + Drizzle (PostgreSQL) + Tailwind v4 + shadcn/ui, bootstrapped with [create-t3-app](https://create.t3.gg/).

## Setup

```bash
pnpm install
cp .env.example .env        # then fill in DATABASE_URL
./start-database.sh         # optional: local Postgres in Docker/Podman, derived from DATABASE_URL
pnpm db:migrate             # apply committed migrations
pnpm dev
```

## Docker

```bash
cp .env.example .env        # DATABASE_URL (external Postgres) and PORT
./setup.sh                  # tear down, rebuild, start, wait until healthy
./teardown.sh               # stop and remove (add --purge to also drop the image)
```

Requires Docker with Compose v2. Run migrations from the host (`pnpm db:migrate`); the container doesn't run them.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm check` | Lint + typecheck |
| `pnpm format:write` | Prettier |
| `pnpm build` | Production build |
| `pnpm db:generate` | Generate a migration from `src/server/db/schema.ts` into `drizzle/` |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:studio` | Drizzle Studio |
