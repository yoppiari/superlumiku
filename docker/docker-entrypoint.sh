#!/bin/bash
set -e

echo "🚀 Starting Lumiku Application..."

# Environment validation
echo "📋 Validating environment variables..."
REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "REDIS_HOST"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ ERROR: Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>/dev/null; do
    echo "   PostgreSQL is unavailable - sleeping"
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Wait for Redis
echo "⏳ Waiting for Redis..."
until timeout 1 bash -c "cat < /dev/null > /dev/tcp/${REDIS_HOST}/${REDIS_PORT}" 2>/dev/null; do
    echo "   Redis is unavailable - sleeping"
    sleep 2
done
echo "✅ Redis is ready"

# Check FFmpeg
echo "🎬 Checking FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ERROR: FFmpeg is not installed"
    exit 1
fi
echo "✅ FFmpeg version: $(ffmpeg -version | head -n1)"

# Run database migrations
echo "🗄️  Running database migrations..."
cd /app/backend
bun prisma migrate deploy || {
    echo "⚠️  Migration failed, trying to generate Prisma client..."
    bun prisma generate
    bun prisma migrate deploy
}
echo "✅ Database migrations completed"

# Create directories
echo "📁 Creating storage directories..."
mkdir -p /app/backend/uploads /app/backend/outputs
chmod -R 755 /app/backend/uploads /app/backend/outputs
echo "✅ Storage directories ready"

# Verify frontend files
echo "🔍 Verifying frontend files..."
if [ ! -f "/app/frontend/dist/index.html" ]; then
    echo "❌ ERROR: Frontend index.html not found at /app/frontend/dist/index.html"
    echo "   Contents of /app/frontend:"
    ls -la /app/frontend/ || echo "   Directory not found"
    echo "   Contents of /app/frontend/dist:"
    ls -la /app/frontend/dist/ || echo "   Directory not found"
    exit 1
fi
echo "✅ Frontend files verified"
echo "   Files in /app/frontend/dist:"
ls -lh /app/frontend/dist/ | head -n 10

# Start Nginx in background
echo "🌐 Starting Nginx..."
nginx -t || {
    echo "❌ Nginx configuration test failed"
    exit 1
}
nginx
echo "✅ Nginx started"

# Start Backend
echo "🚀 Starting Backend Server..."
cd /app/backend
exec bun src/index.ts
