# syntax=docker/dockerfile:1.7

# Multi-stage build for the Next.js standalone output. Layers are ordered from least to most
# frequently changed, so editing source code only invalidates the `build` stage onward:
#   base -> deps (manifest + lockfile only) -> build (+ source) -> runner (standalone output only)

ARG NODE_VERSION=24

# ---------------------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# libc6-compat: some prebuilt Node binaries (e.g. Next's SWC) expect glibc symbols on Alpine.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---------------------------------------------------------------------------------------------
# Dependencies: only re-runs when package.json, the lockfile or .npmrc change.
FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc ./
# Corepack installs the exact pnpm version pinned in `packageManager`.
RUN corepack enable && corepack install
# The pnpm store lives in a BuildKit cache mount, so a lockfile change only downloads what's new.
RUN --mount=type=cache,id=capella-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store

# ---------------------------------------------------------------------------------------------
# Build: env validation is skipped because secrets are only provided at runtime (via .env).
FROM deps AS build
COPY . .
ENV SKIP_ENV_VALIDATION=1 \
    NODE_ENV=production
# Next's incremental build cache persists across builds in a cache mount.
RUN --mount=type=cache,id=capella-next-cache,target=/app/.next/cache \
    pnpm build

# ---------------------------------------------------------------------------------------------
# Runtime: no pnpm, no source, no dev dependencies — just the standalone server.
FROM node:${NODE_VERSION}-alpine AS runner
LABEL org.opencontainers.image.title="capella"
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/trpc/health.ping').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"

CMD ["node", "server.js"]
