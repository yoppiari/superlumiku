#!/bin/bash
# Avatar Creator Migration Script for Coolify
# Run this script in Coolify terminal: bash RUN_MIGRATION_IN_COOLIFY.sh

echo "🚀 Avatar Creator Migration Script"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/prisma/schema.prisma" ]; then
    echo "❌ Error: Not in the correct directory"
    echo "Please cd to /app first"
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo ""

# Read migration SQL file
MIGRATION_SQL=$(cat << 'EOF'
-- Migration: Add Avatar Creator and Pose Generator tables
-- Date: 2025-10-14

BEGIN;

-- Avatar Creator Tables
CREATE TABLE IF NOT EXISTS "avatar_projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "avatar_projects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "avatar_projects_userId_idx" ON "avatar_projects"("userId");
CREATE INDEX IF NOT EXISTS "avatar_projects_userId_createdAt_idx" ON "avatar_projects"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "avatar_projects_userId_updatedAt_idx" ON "avatar_projects"("userId", "updatedAt" DESC);

CREATE TABLE IF NOT EXISTS "avatars" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseImageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "personaName" TEXT,
    "personaAge" INTEGER,
    "personaPersonality" TEXT,
    "personaBackground" TEXT,
    "gender" TEXT,
    "ageRange" TEXT,
    "ethnicity" TEXT,
    "bodyType" TEXT,
    "hairStyle" TEXT,
    "hairColor" TEXT,
    "eyeColor" TEXT,
    "skinTone" TEXT,
    "style" TEXT,
    "sourceType" TEXT NOT NULL,
    "generationPrompt" TEXT,
    "seedUsed" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "avatars_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "avatars_userId_idx" ON "avatars"("userId");
CREATE INDEX IF NOT EXISTS "avatars_projectId_idx" ON "avatars"("projectId");
CREATE INDEX IF NOT EXISTS "avatars_sourceType_idx" ON "avatars"("sourceType");
CREATE INDEX IF NOT EXISTS "avatars_userId_usageCount_idx" ON "avatars"("userId", "usageCount" DESC);
CREATE INDEX IF NOT EXISTS "avatars_userId_lastUsedAt_idx" ON "avatars"("userId", "lastUsedAt" DESC);
CREATE INDEX IF NOT EXISTS "avatars_userId_createdAt_idx" ON "avatars"("userId", "createdAt" DESC);

ALTER TABLE "avatars" ADD CONSTRAINT "avatars_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "avatar_projects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Record migration
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    gen_random_uuid()::text,
    '20251014_add_avatar_creator_complete_manual',
    NOW(),
    '20251014_add_avatar_creator_complete',
    NULL,
    NULL,
    NOW(),
    1
) ON CONFLICT DO NOTHING;

COMMIT;

EOF
)

echo "📝 Running migration SQL..."
echo ""

# Run migration
echo "$MIGRATION_SQL" | psql "$DATABASE_URL"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🔍 Verifying tables..."
    psql "$DATABASE_URL" -c "\dt avatar*" -c "\dt pose*"
    echo ""
    echo "🔍 Verifying persona columns in avatars table..."
    psql "$DATABASE_URL" -c "\d avatars" | grep persona
    echo ""
    echo "✅ All done! You can now test the endpoints."
else
    echo ""
    echo "❌ Migration failed!"
    echo "Check the error messages above."
    exit 1
fi
