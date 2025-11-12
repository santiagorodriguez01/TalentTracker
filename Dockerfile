# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# ---- Deps (mejor cache) ----
FROM base AS deps
# Copiamos solo manifest para cache de instalación
COPY backend/package*.json ./
RUN npm ci --omit=dev

# ---- App ----
FROM base AS app
# Copiamos node_modules ya resueltos
COPY --from=deps /app/node_modules /app/node_modules
# Copiamos el backend completo
COPY backend/ ./

# (Opcional) si tenés build step, descomentá:
# RUN npm run build

# Salud de la API (si tenés /health)
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
    CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1

EXPOSE 3000
# Ajustá si tu start difiere (package.json scripts)
CMD ["node", "src/server/index.js"]
