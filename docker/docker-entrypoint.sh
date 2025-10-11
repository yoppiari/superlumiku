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
echo "   Connection details: $POSTGRES_USER@$POSTGRES_HOST:5432/$POSTGRES_DB"

# Try to connect with timeout (max 60 seconds)
RETRY_COUNT=0
MAX_RETRIES=30

until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ ERROR: Could not connect to PostgreSQL after $MAX_RETRIES attempts"
        echo "   Host: $POSTGRES_HOST"
        echo "   User: $POSTGRES_USER"
        echo "   Database: $POSTGRES_DB"
        echo "   Trying to resolve hostname..."
        nslookup "$POSTGRES_HOST" || echo "   DNS lookup failed"
        ping -c 1 "$POSTGRES_HOST" || echo "   Ping failed"
        echo "⚠️  WARNING: Skipping PostgreSQL check and trying to continue..."
        break
    fi
    echo "   PostgreSQL is unavailable - sleeping (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "✅ PostgreSQL is ready"
fi

# Wait for Redis
echo "⏳ Waiting for Redis..."
echo "   Connection details: $REDIS_HOST:${REDIS_PORT:-6379}"

REDIS_PORT=${REDIS_PORT:-6379}
RETRY_COUNT=0
MAX_RETRIES=30

until timeout 1 bash -c "cat < /dev/null > /dev/tcp/${REDIS_HOST}/${REDIS_PORT}" 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ ERROR: Could not connect to Redis after $MAX_RETRIES attempts"
        echo "   Host: $REDIS_HOST"
        echo "   Port: $REDIS_PORT"
        echo "   Trying to resolve hostname..."
        nslookup "$REDIS_HOST" || echo "   DNS lookup failed"
        ping -c 1 "$REDIS_HOST" || echo "   Ping failed"
        echo "⚠️  WARNING: Skipping Redis check and trying to continue..."
        break
    fi
    echo "   Redis is unavailable - sleeping (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "✅ Redis is ready"
fi

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

# Run custom migration script first (for Avatar & Pose Generator split)
if [ -f "/app/backend/scripts/migrate-avatar-pose.sh" ]; then
    echo "   Running Avatar & Pose Generator migration..."
    bash /app/backend/scripts/migrate-avatar-pose.sh || echo "   ⚠️  Custom migration had errors, continuing..."
fi

# Run Prisma migrations
bun prisma migrate deploy || {
    echo "⚠️  Prisma migration failed, trying to generate Prisma client..."
    bun prisma generate
    bun prisma migrate deploy || echo "   ⚠️  Prisma migration still failed, continuing..."
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
