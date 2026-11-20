# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
ARG SOURCE_REVISION=unreported
ENV SOURCE_REVISION=$SOURCE_REVISION
WORKDIR /app
COPY package*.json ./
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --strict-ssl=true
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001 DB_PATH=/app/data/apilayer.sqlite
WORKDIR /app
COPY --chown=node:node package*.json ./
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --omit=dev --strict-ssl=true && npm cache clean --force
COPY --chown=node:node --from=build /app/build ./build
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/supabase/migrations ./supabase/migrations
COPY --chown=node:node --from=build /app/release-manifest.json ./release-manifest.json
COPY --chown=node:node --from=build /app/scripts/verify-release-artifact.mjs ./scripts/verify-release-artifact.mjs
COPY --chown=node:node --from=build /app/scripts/migrate-production.mjs ./scripts/migrate-production.mjs
COPY --chown=node:node --from=build /app/scripts/environment-projects.mjs ./scripts/environment-projects.mjs
RUN node scripts/verify-release-artifact.mjs
RUN mkdir -p /app/data && chown node:node /app/data && chmod 700 /app/data
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "--use-env-proxy", "build/index.js"]

# Separate operator image: database tools are not added to the application image.
FROM postgres:18-bookworm AS recovery
RUN apt-get update && apt-get install -y --no-install-recommends libstdc++6 libatomic1 && rm -rf /var/lib/apt/lists/*
COPY --from=node:24-bookworm-slim /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY --chown=postgres:postgres --from=runtime /app /app
USER postgres
RUN node --version && pg_dump --version && pg_restore --version
ENTRYPOINT ["node", "build/backup-cli.js"]
CMD ["help"]

FROM runtime AS release
