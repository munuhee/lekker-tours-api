# Backend image. Used by docker-compose.yml for local testing, and suitable as
# the basis for a deployed image.
#
# Multi-stage so the runtime layer does not carry the Prisma CLI (~50MB) or the
# build toolchain, only the generated client, which lives in node_modules.

FROM node:22-alpine AS deps
WORKDIR /app

# The Prisma schema must be present before `npm ci`, because the postinstall
# hook runs `prisma generate` and fails without it.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# dumb-init gives PID 1 proper signal handling, so SIGTERM reaches Node and the
# graceful shutdown in src/server.js actually runs.
RUN apk add --no-cache dumb-init

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY package.json ./
COPY src ./src

# Uploads are written at runtime. This is a container-local directory: see the
# deployment note in the README, on an ephemeral filesystem it is wiped on
# every deploy, so mount a volume or move to object storage.
RUN mkdir -p uploads && chown -R node:node /app

USER node
EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
