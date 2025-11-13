# ===== Etapa de deps/build =====
FROM node:22-alpine3.20 AS build
WORKDIR /app

# Copiá sólo manifiestos primero para cachear el layer de deps
COPY package*.json ./

# Instala deps de manera reproducible (usa package-lock.json)
# En prod omití dev deps
RUN npm ci --omit=dev

# Copiá el resto del código
COPY . .

# Si tenés build (TS/Next/etc.), descomentá:
# RUN npm run build

# ===== Etapa de runtime mínima =====
FROM node:22-alpine3.20 AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copiá lo estrictamente necesario
COPY --from=build /app /app
COPY src/server/ai_integration/websocket/performanceSocket.js /app/src/server/ai_integration/websocket/performanceSocket.js

# Seguridad: usuario no-root
RUN addgroup -S nodegrp && adduser -S nodeusr -G nodegrp
USER nodeusr

# Puerto real de tu app (ajustá si no es 3000)
EXPOSE 3000

# Healthcheck opcional (ajustá la ruta si tenés /health)
# HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
#   CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node","src/server/index.js"]

