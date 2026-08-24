# Multi-Stage Production Dockerfile for Syntrix Frontend SPA

# ==========================================
# 1. Build Stage
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public

RUN npm run build

# ==========================================
# 2. Production Stage: NGINX Alpine Server
# ==========================================
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA production assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
