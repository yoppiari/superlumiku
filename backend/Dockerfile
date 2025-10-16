# ========================================
# Lumiku Backend - Docker Image
# ========================================
#
# Multi-stage build for:
# - Development: Hot-reload enabled
# - Production: Optimized for deployment
#
# Build:
#   docker build -t lumiku-backend:latest .
#   docker build --target development -t lumiku-backend:dev .
#
# Run:
#   docker run -p 3000:3000 --env-file .env lumiku-backend:latest
#

# ========================================
# Base Stage - Common dependencies
# ========================================
FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN bunx prisma generate

# ========================================
# Development Stage
# ========================================
FROM base AS development

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs uploads

# Expose port
EXPOSE 3000

# Development command with hot-reload
CMD ["bun", "--watch", "src/index.ts"]

# ========================================
# Build Stage - Compile TypeScript
# ========================================
FROM base AS builder

# Copy source code
COPY . .

# Type check (optional - can skip if TypeScript is too strict)
# RUN bun run type-check

# Build application
RUN bun build src/index.ts --outdir dist --target bun

# ========================================
# Production Stage - Optimized runtime
# ========================================
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN bunx prisma generate

# Copy source code (Bun runs TS directly in production)
COPY src ./src

# Copy built artifacts (if needed)
# COPY --from=builder /app/dist ./dist

# Create directories
RUN mkdir -p logs uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Production command
CMD ["bun", "src/index.ts"]
