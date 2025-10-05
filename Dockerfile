# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies (use npm install since package-lock.json might not exist)
RUN npm install --omit=dev

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# ============================================
# Stage 2: Build Backend
# ============================================
FROM oven/bun:1-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package.json backend/bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy backend source
COPY backend/ ./

# Generate Prisma Client
RUN bun prisma generate

# ============================================
# Stage 3: Production Image
# ============================================
FROM oven/bun:1-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    ffmpeg \
    ffmpeg-libs \
    postgresql-client \
    curl \
    bash

WORKDIR /app

# Copy backend from builder
COPY --from=backend-builder /app/backend ./backend

# Copy frontend dist from builder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy root package.json if needed
COPY package.json ./

# Copy Nginx configuration
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Copy scripts
COPY docker/docker-entrypoint.sh /usr/local/bin/
COPY docker/healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh /usr/local/bin/healthcheck.sh

# Create necessary directories
RUN mkdir -p /app/backend/uploads /app/backend/outputs /var/log/nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
