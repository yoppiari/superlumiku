#!/bin/bash
# ============================================
# Coolify Production Deployment Fix Script
# ============================================
#
# Purpose: Fix critical deployment errors preventing application startup
# Environment: Coolify Production (dev.lumiku.com)
# Date: October 16, 2025
#
# IMPORTANT: Run this script in the Coolify backend service terminal
#
# Usage:
#   1. Open Coolify → dev-superlumiku → Terminal
#   2. Copy and paste this entire script
#   3. Press Enter to execute
#
# ============================================

set -e  # Exit on error

echo "============================================"
echo "Lumiku Production Deployment Fix"
echo "============================================"
echo ""

# ============================================
# Step 1: Verify Database Connection
# ============================================

echo "Step 1: Testing Database Connection..."
echo "--------------------------------------"

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    echo ""
    echo "Action required:"
    echo "1. Go to Coolify UI → Application → Environment Variables"
    echo "2. Add DATABASE_URL with correct connection string"
    echo "3. Format: postgresql://user:pass@host:5432/database?schema=public"
    echo ""
    exit 1
fi

echo "DATABASE_URL is set (not showing for security)"
echo ""

# Test database connection
echo "Testing database connectivity..."
if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
    echo ""
else
    echo "❌ Database connection failed!"
    echo ""
    echo "Common issues:"
    echo "1. PostgreSQL service is not running"
    echo "2. DATABASE_URL has wrong host/port/credentials"
    echo "3. Firewall blocking connection"
    echo "4. Wrong internal hostname (use Docker service name, not external IP)"
    echo ""
    echo "Action required:"
    echo "1. Check PostgreSQL service status: docker ps | grep postgres"
    echo "2. Verify DATABASE_URL uses internal Docker hostname"
    echo "3. Restart PostgreSQL service if needed"
    echo ""
    exit 1
fi

# ============================================
# Step 2: Check Migration Status
# ============================================

echo "Step 2: Checking Migration Status..."
echo "--------------------------------------"

cd /app

# Check current migration status
echo "Current migration status:"
bunx prisma migrate status || true
echo ""

# ============================================
# Step 3: Resolve Failed Migration
# ============================================

echo "Step 3: Resolving Failed Migration..."
echo "--------------------------------------"

# Check if the problematic migration exists
MIGRATION_NAME="20251014_add_avatar_creator_complete"

if bunx prisma migrate status 2>&1 | grep -q "failed"; then
    echo "⚠️  Found failed migration(s). Attempting to resolve..."
    echo ""

    # Check if tables exist
    echo "Verifying if tables exist in database..."

    if psql "$DATABASE_URL" -c "\dt" 2>&1 | grep -q "avatar_projects"; then
        echo "✅ Tables exist - migration actually succeeded!"
        echo ""
        echo "Marking migration as resolved..."

        # Mark migration as applied
        bunx prisma migrate resolve --applied "$MIGRATION_NAME" || {
            echo "❌ Failed to mark migration as resolved"
            echo ""
            echo "Manual fix required:"
            echo "psql \$DATABASE_URL"
            echo "UPDATE \"_prisma_migrations\" SET finished_at = NOW(), success = true WHERE migration_name = '$MIGRATION_NAME';"
            echo "\q"
            exit 1
        }

        echo "✅ Migration marked as resolved!"
        echo ""
    else
        echo "⚠️  Tables do NOT exist - migration truly failed"
        echo ""
        echo "Attempting to deploy migration..."
        bunx prisma migrate deploy || {
            echo "❌ Migration deployment failed"
            echo ""
            echo "Action required:"
            echo "1. Check database logs for errors"
            echo "2. Verify database has CREATE TABLE permissions"
            echo "3. Manually inspect migration file"
            exit 1
        }

        echo "✅ Migration deployed successfully!"
        echo ""
    fi
else
    echo "✅ No failed migrations found!"
    echo ""
fi

# ============================================
# Step 4: Verify Migration Status
# ============================================

echo "Step 4: Verifying Final Migration Status..."
echo "--------------------------------------"

bunx prisma migrate status

if bunx prisma migrate status 2>&1 | grep -q "No pending migrations"; then
    echo ""
    echo "✅ All migrations are up to date!"
else
    echo ""
    echo "⚠️  There may be pending migrations"
    echo "Run: bunx prisma migrate deploy"
fi

echo ""

# ============================================
# Step 5: Verify Tables Exist
# ============================================

echo "Step 5: Verifying Database Tables..."
echo "--------------------------------------"

echo "Checking Avatar Creator tables..."

TABLES=(
    "avatar_projects"
    "avatars"
    "avatar_presets"
    "persona_examples"
    "avatar_usage_history"
    "avatar_generations"
)

ALL_TABLES_EXIST=true

for table in "${TABLES[@]}"; do
    if psql "$DATABASE_URL" -c "\dt" 2>&1 | grep -q "$table"; then
        echo "✅ Table exists: $table"
    else
        echo "❌ Table missing: $table"
        ALL_TABLES_EXIST=false
    fi
done

echo ""

echo "Checking Pose Generator tables..."

POSE_TABLES=(
    "pose_categories"
    "pose_library"
    "pose_generator_projects"
    "pose_generations"
    "generated_poses"
    "pose_selections"
    "pose_requests"
)

for table in "${POSE_TABLES[@]}"; do
    if psql "$DATABASE_URL" -c "\dt" 2>&1 | grep -q "$table"; then
        echo "✅ Table exists: $table"
    else
        echo "❌ Table missing: $table"
        ALL_TABLES_EXIST=false
    fi
done

echo ""

if [ "$ALL_TABLES_EXIST" = true ]; then
    echo "✅ All required tables exist!"
else
    echo "⚠️  Some tables are missing - migration may not have run completely"
    echo "Action required: Run 'bunx prisma migrate deploy'"
fi

echo ""

# ============================================
# Step 6: Check Seed Data
# ============================================

echo "Step 6: Checking Seed Data..."
echo "--------------------------------------"

# Check if AI models exist for Avatar Creator
AVATAR_MODEL_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';" 2>/dev/null || echo "0")

echo "Avatar Creator AI models: $AVATAR_MODEL_COUNT"

if [ "$AVATAR_MODEL_COUNT" -eq 0 ]; then
    echo "⚠️  No AI models found for Avatar Creator"
    echo "This may cause app to not appear in dashboard"
    echo ""
    echo "Action required: Run seed script"
    echo "bun run prisma db seed"
else
    echo "✅ Avatar Creator has AI models configured"
fi

echo ""

# Check pose categories
POSE_CATEGORY_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pose_categories;" 2>/dev/null || echo "0")

echo "Pose categories: $POSE_CATEGORY_COUNT"

if [ "$POSE_CATEGORY_COUNT" -eq 0 ]; then
    echo "⚠️  No pose categories found"
    echo "Action required: Run seed script"
    echo "bun run prisma db seed"
else
    echo "✅ Pose categories are seeded"
fi

echo ""

# ============================================
# Step 7: Generate Prisma Client
# ============================================

echo "Step 7: Regenerating Prisma Client..."
echo "--------------------------------------"

bunx prisma generate

echo "✅ Prisma client regenerated!"
echo ""

# ============================================
# Summary
# ============================================

echo "============================================"
echo "Fix Summary"
echo "============================================"
echo ""

# Check database connection
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database: Connected"
else
    echo "❌ Database: Connection failed"
fi

# Check migrations
if bunx prisma migrate status 2>&1 | grep -q "No pending migrations"; then
    echo "✅ Migrations: All applied"
else
    echo "⚠️  Migrations: Some pending or failed"
fi

# Check tables
if [ "$ALL_TABLES_EXIST" = true ]; then
    echo "✅ Tables: All exist"
else
    echo "⚠️  Tables: Some missing"
fi

# Check seed data
if [ "$AVATAR_MODEL_COUNT" -gt 0 ] && [ "$POSE_CATEGORY_COUNT" -gt 0 ]; then
    echo "✅ Seed Data: Present"
else
    echo "⚠️  Seed Data: Incomplete"
fi

echo ""
echo "============================================"
echo "Next Steps"
echo "============================================"
echo ""

echo "1. If all checks passed: Trigger redeploy in Coolify"
echo "2. If seed data missing: Run 'bun run prisma db seed'"
echo "3. If tables missing: Run 'bunx prisma migrate deploy'"
echo "4. Monitor application logs during startup"
echo "5. Verify application is accessible at https://dev.lumiku.com"
echo ""

echo "============================================"
echo "Fix script completed!"
echo "============================================"
