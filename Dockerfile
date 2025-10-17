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

# Force cache bust - timestamp: 2025-10-13-09:18
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
# Split into groups and add retry logic for network stability
RUN set -e; \
    # Function to retry apk commands with exponential backoff
    retry_apk() { \
        local max_attempts=5; \
        local timeout=1; \
        local attempt=1; \
        local exitCode=0; \
        \
        while [ $attempt -le $max_attempts ]; do \
            echo "Attempt $attempt of $max_attempts: $@"; \
            \
            if "$@"; then \
                echo "Success!"; \
                return 0; \
            else \
                exitCode=$?; \
                echo "Failed with exit code $exitCode"; \
                \
                if [ $attempt -lt $max_attempts ]; then \
                    echo "Cleaning cache and retrying in ${timeout}s..."; \
                    rm -rf /var/cache/apk/*; \
                    sleep $timeout; \
                    timeout=$((timeout * 2)); \
                    attempt=$((attempt + 1)); \
                else \
                    echo "All attempts failed!"; \
                    return $exitCode; \
                fi; \
            fi; \
        done; \
    }; \
    \
    # Update package index with retry
    retry_apk apk update && \
    \
    # Install packages in smaller groups to reduce network stress
    # Group 1: Core build tools (smaller packages)
    retry_apk apk add --no-cache python3 make && \
    \
    # Group 2: GCC (large package, most likely to fail)
    retry_apk apk add --no-cache g++ && \
    \
    # Group 3: Graphics libraries
    retry_apk apk add --no-cache \
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

# Update package repositories and install system dependencies
# (including canvas runtime dependencies and network tools)
# Use retry logic for network stability
RUN set -e; \
    # Function to retry apk commands with exponential backoff
    retry_apk() { \
        local max_attempts=5; \
        local timeout=1; \
        local attempt=1; \
        local exitCode=0; \
        \
        while [ $attempt -le $max_attempts ]; do \
            echo "Attempt $attempt of $max_attempts: $@"; \
            \
            if "$@"; then \
                echo "Success!"; \
                return 0; \
            else \
                exitCode=$?; \
                echo "Failed with exit code $exitCode"; \
                \
                if [ $attempt -lt $max_attempts ]; then \
                    echo "Cleaning cache and retrying in ${timeout}s..."; \
                    rm -rf /var/cache/apk/*; \
                    sleep $timeout; \
                    timeout=$((timeout * 2)); \
                    attempt=$((attempt + 1)); \
                else \
                    echo "All attempts failed!"; \
                    return $exitCode; \
                fi; \
            fi; \
        done; \
    }; \
    \
    # Update package index with retry
    retry_apk apk update && \
    \
    # Install packages in groups to reduce network stress
    # Group 1: Core utilities
    retry_apk apk add --no-cache curl bash postgresql-client && \
    \
    # Group 2: Web server
    retry_apk apk add --no-cache nginx && \
    \
    # Group 3: FFmpeg (large packages)
    retry_apk apk add --no-cache ffmpeg ffmpeg-libs && \
    \
    # Group 4: Graphics libraries
    retry_apk apk add --no-cache \
        cairo \
        jpeg \
        pango \
        giflib \
        pixman && \
    \
    # Group 5: Network tools
    retry_apk apk add --no-cache bind-tools iputils

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
