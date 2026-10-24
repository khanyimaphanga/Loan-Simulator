# Build: compile the design tokens, the API and the React app.
FROM node:22-alpine AS build
WORKDIR /app

# Install from the lockfile first so this layer is cached until dependencies change.
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

COPY . .
RUN npm run build

# Run: production dependencies and built output only. The API serves the React app too, so it's one port.
FROM node:22-alpine
ENV NODE_ENV=production PORT=4000
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev --workspace server && npm cache clean --force

COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist

USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://localhost:' + process.env.PORT + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server/dist/index.js"]
