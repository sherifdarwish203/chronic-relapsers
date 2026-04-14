# ── Stage 1: Build client + server ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests first (layer cache)
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm ci

COPY client/ ./client/
COPY server/ ./server/

RUN npm run build:client && npm run build:server

# ── Stage 2: Install server production deps (needs build tools for bcrypt) ───
FROM node:20-alpine AS prod-deps
WORKDIR /app/server

RUN apk add --no-cache python3 make g++

COPY server/package*.json ./
RUN npm install --omit=dev

# ── Stage 3: Final production image ──────────────────────────────────────────
FROM node:20-alpine AS production

# Chromium + fonts for Puppeteer PDF generation (Arabic script support)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    font-noto-arabic

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

WORKDIR /app

# Compiled server JS
COPY --from=builder /app/server/dist ./dist

# Production node_modules
COPY --from=prod-deps /app/server/node_modules ./node_modules

# Built React app (served as static files by Express)
COPY --from=builder /app/client/dist ./public

# DB schema file needed by the migration script at runtime
COPY server/src/db/schema.sql ./dist/db/schema.sql

COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
