# syntax=docker/dockerfile:1.7
FROM node:20.18-alpine3.20 AS base
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@latest

# Copy workspace root files (build context should be project root)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json

# Install dependencies (pnpm will handle workspace)
# Using --no-frozen-lockfile for now as lockfile may need updates
WORKDIR /app/frontend
RUN pnpm install --no-frozen-lockfile

FROM base AS build
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@latest

# Copy workspace root files
COPY package.json pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json

# Copy all frontend source files (exclusions handled by .dockerignore)
COPY frontend ./frontend

WORKDIR /app/frontend
RUN pnpm install --no-frozen-lockfile

ENV NEXT_TELEMETRY_DISABLED=1
# Set backend URL for build-time rewrites
# For Docker Compose: use http://backend:4000
# For Render: use the Render backend URL (set via environment variable)
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy root node_modules (pnpm hoists dependencies here in workspace)
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules

# Set working directory to frontend
WORKDIR /app/frontend

# Copy everything needed from build stage
COPY --from=build --chown=nextjs:nodejs /app/frontend/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/frontend/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/frontend/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node_modules/.bin/next", "start"]
