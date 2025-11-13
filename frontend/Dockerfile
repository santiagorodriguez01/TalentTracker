# Etapa 1: dependencias
FROM node:20-alpine AS deps

WORKDIR /app

# Copiamos manifests
COPY package*.json ./

# Instalamos dependencias (ci para usar package-lock si existe)
RUN npm ci || npm install

# Etapa 2: build
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Construimos la app de producción
RUN npm run build

# Etapa 3: runtime
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiamos todo lo generado al contenedor final
COPY --from=builder /app ./

# Next escucha en 3000 dentro del contenedor
EXPOSE 3000

CMD ["npm", "start"]
