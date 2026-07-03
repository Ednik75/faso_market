# ─────────────────────────────────────────────────────────────
# Market BF — image de production "tout-en-un"
# Étape 1 : build du frontend React → Étape 2 : API Express qui
# sert aussi le frontend depuis backend/public (une seule URL).
# ─────────────────────────────────────────────────────────────

# ── Étape 1 : build du frontend ──
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Étape 2 : backend + frontend buildé ──
FROM node:20-alpine
WORKDIR /app

# Dépendances natives pour better-sqlite3
RUN apk add --no-cache python3 make g++ wget

COPY backend/package*.json ./
RUN npm ci --omit=dev && apk del python3 make g++

COPY backend/ ./
COPY --from=frontend-builder /app/dist ./public

RUN mkdir -p database uploads

ENV NODE_ENV=production
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
