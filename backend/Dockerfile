# Multi-Stage Production Dockerfile for Syntrix Backend

# ==========================================
# 1. Base Stage: Dependencies
# ==========================================
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./

# ==========================================
# 2. Build Stage: Prisma Generation & TS Compile
# ==========================================
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ==========================================
# 3. Production Stage: Lean Runtime
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Security: Create and use non-root system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 syntrix

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma

# Create uploads directory with appropriate permissions
RUN mkdir -p uploads && chown -R syntrix:nodejs /app

USER syntrix

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
