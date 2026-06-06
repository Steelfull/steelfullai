# syntax=docker/dockerfile:1

# ---- Stage 1: Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
# Build toolchain for native modules (better-sqlite3).
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: Build ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Stage 3: Runtime (schlank) ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Nicht-root-User für mehr Sicherheit
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone-Output von Next.js kopieren
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# public-Ordner (enthält jetzt das Foto und weitere Assets) ins Image kopieren
COPY --from=builder /app/public ./public

# Persistent data dir for the chat-insights SQLite DB (mounted as a volume).
# Owned by the runtime user so a fresh named volume inherits uid/gid 1001.
RUN mkdir -p /data && chown nextjs:nodejs /data
VOLUME ["/data"]

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
