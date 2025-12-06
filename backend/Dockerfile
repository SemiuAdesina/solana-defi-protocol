# syntax=docker/dockerfile:1.7
FROM node:20.18-alpine3.20 AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@latest
COPY package.json ./
RUN pnpm install --frozen-lockfile || npm install

FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm build || npm run build

FROM base AS runner
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
# Create storage directory and initialize CI status file
RUN mkdir -p /app/storage && \
    echo '{"statuses":[]}' > /app/storage/ci-status.json && \
    chown -R nodejs:nodejs /app/storage
USER nodejs
EXPOSE 4000
ENV PORT=4000
CMD ["node", "dist/index.js"]
