# syntax=docker/dockerfile:1
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@11.20.0 --activate
WORKDIR /app

# Dependencies. `postinstall` runs `prisma generate`, so the schema comes first.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# One-off `prisma migrate deploy`; the runtime image does not ship the Prisma CLI.
FROM deps AS migrate
# Prisma's schema engine needs OpenSSL, which the slim base image lacks.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

FROM deps AS build
COPY . .
# deploy/public.env holds the public values next.config.ts reads at build time (e.g. R2_PUBLIC_URL).
# Secrets are not needed here: src/lib/env.ts skips its check during `next build`.
RUN set -a && . ./deploy/public.env && set +a && pnpm build

FROM node:22-slim AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
