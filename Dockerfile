# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript build)
RUN npm install

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Verify frontend build output exists
RUN ls -la dist/ && \
    test -f dist/index.html || (echo "ERROR: Frontend build failed - index.html not found!" && exit 1)

# ============================================
# Stage 2: Build Backend
# ============================================
FROM oven/bun:1-alpine AS backend-builder

WORKDIR /app/backend

# Install build dependencies for canvas (requires Python and build tools)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Copy backend package files
COPY backend/package.json backend/bun.lock* ./

# Install ALL dependencies (including devDependencies for Prisma)
RUN bun install --frozen-lockfile

# Copy backend source
COPY backend/ ./

# Generate Prisma Client
RUN bun run prisma:generate

# ============================================
# Stage 3: Production Image
# ============================================
FROM oven/bun:1-alpine

# Install system dependencies (including canvas runtime dependencies)
RUN apk add --no-cache \
    nginx \
    ffmpeg \
    ffmpeg-libs \
    postgresql-client \
    curl \
    bash \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman

WORKDIR /app

# Copy backend from builder
COPY --from=backend-builder /app/backend ./backend

# Copy frontend dist from builder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Verify frontend files were copied
RUN ls -la /app/frontend/dist/ && \
    test -f /app/frontend/dist/index.html || (echo "ERROR: Frontend dist not copied correctly!" && exit 1)

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

# Expose port (Nginx on 3000, Backend on 3001)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
