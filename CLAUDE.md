# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

T3 app: Next.js 15 App Router, tRPC v11 + TanStack Query, Drizzle ORM on PostgreSQL (`postgres` driver), Tailwind v4, shadcn/ui. Package manager is **pnpm**. Path alias `~/*` → `src/*`.

This is a non-mission-critical app, so keep things simple. It still needs a minimum maintainability baseline: typed boundaries, a normalized schema, a predictable folder layout, and `pnpm check` passing.

## Commands

```bash
pnpm dev            # dotenv -- next dev --turbo (honours PORT from .env)
pnpm check          # next lint + tsc --noEmit
pnpm lint:fix
pnpm format:write   # prettier (with tailwind class sorting)
pnpm build          # next build (output: "standalone")
pnpm test           # vitest run (src/**/*.test.ts)
./setup.sh          # Docker: validate .env, tear down, rebuild image, start, wait for healthy
./teardown.sh       # Docker: remove container + network (--purge also removes the image)
```

**Definition of done for a feature:** `pnpm check` **and** `pnpm build` must both pass before you call it finished. Always run the build: it catches errors `tsc` misses (prerendering, route/page collection, server/client boundary mistakes). If the build fails with `Cannot find module for page`, it's a stale `.next` from `next dev`; delete `.next` and rebuild.

Pure logic worth testing (date math, stats) gets a colocated `*.test.ts` run by Vitest.

Env vars are validated at build/dev time by `src/env.js` (`@t3-oss/env-nextjs`). A new variable has to be added in three places: the zod schema, `runtimeEnv` in `src/env.js`, and `.env.example`. Import `env` from `~/env` and never read `process.env` directly. Set `SKIP_ENV_VALIDATION=1` to bypass validation.

`PORT` (default 3000) is read from `.env`. Next.js ignores a `PORT` set in `.env` because the server binds before `.env` is loaded, so `dev` and `start` are wrapped with `dotenv-cli`.

## Docker

The app runs as a single container from `Dockerfile` (multi-stage: `deps` → `build` → `runner` with the standalone output) via `docker-compose.yml`. PostgreSQL is external and reached through `DATABASE_URL`. Secrets come from `.env` at runtime through compose `env_file` and are never baked into the image; the image build uses `SKIP_ENV_VALIDATION=1`. Keep `.dockerignore` in sync when adding top-level files that the build doesn't need. Migrations are not run by the container.

## Database rules

- **Never run `pnpm db:generate`, `db:migrate`, `db:push`, or `db:studio`.** The human runs all migration commands.
- **Whenever `src/server/db/schema.ts` changes, end your reply with a migration reminder.** It must:
  1. Tell the user to run `pnpm db:generate`, then `pnpm db:migrate`.
  2. Brief the change: list each table, column, index, constraint or relation that was added, changed or removed, with a short reason.
  3. Flag anything destructive: a dropped or renamed column or table, a type change, or a new NOT NULL column on a table that has rows. drizzle-kit asks interactively about renames, so say which answer to pick.
- Do not hand-edit anything in `drizzle/`. Those are generated SQL and snapshots, and committed migrations may already be applied.
- Schema lives in `src/server/db/schema.ts`. Every table **must** be created with `createTable(...)`, which adds the `capella_` prefix. `drizzle.config.ts` has `tablesFilter: ["capella_*"]`, so drizzle-kit silently ignores any table without the prefix.
- Keep the schema normalized (roughly 3NF):
  - Many-to-many relations go in junction tables, not arrays or JSON.
  - Don't store derived or duplicated data unless there is a stated reason.
  - Foreign keys need an explicit `onDelete` and an index. Postgres does not index FK columns automatically.
  - Use `timestamp({ withTimezone: true })`, with `createdAt` (not null, defaulted) and `updatedAt` (`$onUpdate`).
  - Define `relations()` for anything that will be read through `db.query.*`.
- Index and constraint names are schema-global in Postgres, so prefix them with the table name (e.g. `capella_note_owner_idx`).
- ESLint (`eslint-plugin-drizzle`) errors on `db.delete`/`db.update` without `.where()`.

## Architecture

**tRPC is the data layer.**

- **Defining procedures:** procedures live in `src/server/api/routers/<domain>.ts` and must be registered in `appRouter` in `src/server/api/root.ts`. Keep at least one router in `appRouter`. If it is empty, the `createHydrationHelpers` types in `src/trpc/server.ts` break. That is why `health.ping` exists.
- **Context and middleware:** `src/server/api/trpc.ts` defines the context (`{ db, headers }`) and `publicProcedure`. Its timing middleware **adds a 100–500 ms artificial delay in dev** to surface request waterfalls, so don't chase that latency.
- **Calling from Server Components:** use `import { api, HydrateClient } from "~/trpc/server"`. This calls procedures directly with no HTTP round trip. To prefetch, call `void api.x.y.prefetch()` and wrap the subtree in `<HydrateClient>`. The client component then reads the data with `api.x.y.useSuspenseQuery()`.
- **Calling from Client Components:** use `import { api } from "~/trpc/react"` (hooks). These go over HTTP to `src/app/api/trpc/[trpc]/route.ts`.
- **Serialization:** the transformer is superjson, so `Date`, `Map` and similar types survive the wire.
- **Types:** `RouterInputs`/`RouterOutputs` from `~/trpc/react` give inferred types. Don't redeclare API shapes by hand.

**Validation:** use zod (v3) for procedure inputs. Reuse those schemas on the client for forms instead of duplicating rules.

## Domain

Habit check-in tracker; see the decided rules in the design notes. Key invariants:

- Calendar dates are `YYYY-MM-DD` strings end to end (`date({ mode: "string" })`). Use `~/lib/dates`, never `new Date("YYYY-MM-DD")`.
- "Today" is computed in `Asia/Ho_Chi_Minh` via `todayInAppZone()`, never in server-local time or UTC.
- Progress, streaks and stats are derived in `~/lib/habit-stats.ts` (pure, tested). Don't persist derived numbers.
- No in-app auth: the app sits behind Authelia (reverse proxy), so procedures are `publicProcedure`.

## Folder conventions

- **Every page gets its own folder** under `src/app/`. That includes the root page, which lives in the route group `src/app/(home)/page.tsx`. Use route groups `(name)` when a folder shouldn't affect the URL.
- **Components are split by scope. Don't put everything in one folder.**
  - **Page-local** components, used only within one route subtree, go in `src/app/<route>/_components/`. The `_` prefix keeps Next from routing them.
  - **Global** components, reused across pages (navbar, footer, shared composites), go in `src/components/`, grouped by purpose (e.g. `src/components/layout/navbar.tsx`).
  - **shadcn primitives** go in `src/components/ui/`. These are generated by the shadcn CLI. Compose them rather than heavily editing them, because re-adding a component overwrites the file.
  - If a page-local component gets a second consumer in another route, promote it to `src/components/`.
- Shared non-component helpers go in `src/lib/`. Server-only code goes under `src/server/`.

## Dependencies & UI

- Prefer an established library over hand-rolled code (e.g. a shadcn component, a date library, a form library). Install with `pnpm add`.
- shadcn is configured in `components.json` with style **`base-nova`**. Its components are built on **Base UI (`@base-ui/react`), not Radix**, so follow Base UI APIs (e.g. `render` prop, not `asChild`). Add components with `pnpm dlx shadcn@latest add <name>`.
- `cn()` comes from the `cn` package, shadcn's drop-in for clsx + tailwind-merge, and is re-exported from `~/lib/utils`.
- Icons come from `lucide-react`.
- Theme tokens (oklch CSS variables, March 7th palette) live in `src/styles/globals.css`. Dark mode is `[data-theme="dark"]` on `<html>`, set by `next-themes`; the `dark:` variant targets it. Panels are `bg-card rounded-xl ring-1 ring-border shadow-surface`; keep saturated pink for primary actions and progress only. Fonts: Nunito (`font-sans`) for body, Quicksand (`font-heading`) for headings and big numbers. Use semantic classes (`bg-background`, `text-muted-foreground`, etc.) rather than raw colors.
