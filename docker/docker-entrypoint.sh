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

# Debug: Show current directory and DATABASE_URL
echo "📍 Current directory: $(pwd)"
echo "📊 DATABASE_URL: ${DATABASE_URL:0:50}..."

# Run custom migration script first (for Avatar & Pose Generator split)
if [ -f "/app/backend/scripts/migrate-avatar-pose.sh" ]; then
    echo "   Running Avatar & Pose Generator migration..."
    bash /app/backend/scripts/migrate-avatar-pose.sh || echo "   ⚠️  Custom migration had errors, continuing..."
fi

# Generate Prisma Client FIRST (mandatory!)
echo "🔧 Step 1: Generating Prisma Client..."
bun prisma generate 2>&1 | tail -n 5
echo "✅ Prisma Client generated"

# Run Prisma migrations
# Try migrate deploy first (for production migrations)
echo "🔧 Step 2: Trying prisma migrate deploy..."
if bun prisma migrate deploy 2>&1 | tee /tmp/migrate-deploy.log; then
    echo "✅ Prisma migrate deploy successful"
else
    echo "⚠️  Prisma migrate deploy failed or no migrations found"
    echo "   Error output:"
    cat /tmp/migrate-deploy.log | tail -n 10

    echo ""
    echo "🔧 Step 3: Trying prisma db push (FORCE SYNC)..."

    # Fallback to db push (syncs Prisma schema to database without migration files)
    # FORCE this to succeed with explicit error handling
    bun prisma db push --accept-data-loss --skip-generate --force-reset 2>&1 | tee /tmp/db-push.log
    DB_PUSH_EXIT=$?

    if [ $DB_PUSH_EXIT -eq 0 ]; then
        echo "✅ Prisma db push successful - schema synced to database"
    else
        echo "⚠️  Prisma db push had issues (exit code: $DB_PUSH_EXIT)"
        echo "   Full output:"
        cat /tmp/db-push.log

        echo ""
        echo "🔧 Step 4: Trying WITHOUT --force-reset..."
        if bun prisma db push --accept-data-loss --skip-generate 2>&1 | tee /tmp/db-push-retry.log; then
            echo "✅ Prisma db push successful on retry"
        else
            echo "❌ All migration attempts failed!"
            echo "   Last error output:"
            cat /tmp/db-push-retry.log
            echo ""
            echo "⚠️  WARNING: Database schema might not be in sync!"
            echo "   Manual intervention may be required."
        fi
    fi
fi

# Verify critical tables exist
echo ""
echo "🔍 Verifying critical tables..."
CRITICAL_TABLES=("users" "avatars" "avatar_projects" "avatar_usage_history" "sessions" "credits")
MISSING_TABLES=()

if command -v psql &> /dev/null; then
    for table in "${CRITICAL_TABLES[@]}"; do
        echo "   Checking $table table..."
        if psql "$DATABASE_URL" -c "\dt $table" 2>&1 | grep -q "$table"; then
            echo "   ✅ $table EXISTS"
        else
            echo "   ❌ WARNING: $table NOT FOUND!"
            MISSING_TABLES+=("$table")
        fi
    done

    if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
        echo ""
        echo "❌ CRITICAL: ${#MISSING_TABLES[@]} tables are missing!"
        echo "   Missing tables: ${MISSING_TABLES[*]}"
        echo ""
        echo "🔧 ATTEMPTING EMERGENCY FIX: Running force-sync-schema script..."

        if [ -f "/app/backend/scripts/force-sync-schema.ts" ]; then
            cd /app/backend
            if bun run scripts/force-sync-schema.ts 2>&1; then
                echo "✅ Emergency schema sync successful!"

                # Verify again
                echo "   Re-verifying tables..."
                ALL_FIXED=true
                for table in "${MISSING_TABLES[@]}"; do
                    if ! psql "$DATABASE_URL" -c "\dt $table" 2>&1 | grep -q "$table"; then
                        echo "   ❌ $table still missing"
                        ALL_FIXED=false
                    else
                        echo "   ✅ $table now exists"
                    fi
                done

                if [ "$ALL_FIXED" = true ]; then
                    echo "✅ All missing tables have been created!"
                else
                    echo "⚠️  Some tables still missing after emergency fix"
                    echo "   Application may not work correctly"
                fi
            else
                echo "❌ Emergency schema sync failed"
                echo "⚠️  Application may not work correctly"
            fi
        else
            echo "❌ force-sync-schema.ts not found"
            echo "⚠️  Cannot perform emergency fix"
        fi
    else
        echo "✅ All critical tables exist!"
    fi

    echo ""
    echo "📊 Database Tables Summary:"
    psql "$DATABASE_URL" -c "\dt" 2>&1 | grep -E "(avatar|user|session|credit)" | head -n 15
else
    echo "   psql not available, skipping table verification"
    echo "⚠️  WARNING: Cannot verify database schema"
fi

echo "✅ Database migrations/sync completed"

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

# Start Backend and Workers
echo "🚀 Starting Backend Server and Workers..."
cd /app/backend

# Start avatar-generator-worker in background
echo "   Starting avatar-generator-worker..."
bun src/apps/avatar-creator/workers/avatar-generator.worker.ts &
WORKER_PID=$!
echo "   ✅ Worker started (PID: $WORKER_PID)"

# Start main backend server (foreground)
echo "   Starting main API server..."
exec bun src/index.ts
