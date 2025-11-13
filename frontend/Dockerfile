# Etapa 1: build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos los manifests del proyecto
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Construimos la app (para Next: npm run build)
RUN npm run build

# Etapa 2: runtime (imagen más liviana)
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copiamos lo que construimos en la etapa anterior
COPY --from=builder /app ./

# Next/React suele escuchar en el 3000 dentro del contenedor
EXPOSE 3000

# Para Next.js, asegurate de tener en package.json:
# "scripts": { "start": "next start -H 0.0.0.0 -p 3000", ... }
CMD ["npm", "start"]
