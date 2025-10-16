#!/bin/bash
# Avatar Creator Database Migration Script
# Execute this script on the Coolify server (dev.lumiku.com)
#
# Usage: bash deploy-avatar-migration.sh

set -e  # Exit on error

echo "========================================="
echo "Avatar Creator Migration Deployment"
echo "========================================="
echo ""

# Configuration
CONTAINER_NAME="dev-superlumiku"
DATABASE_URL="${DATABASE_URL}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Find the running container
echo -e "${YELLOW}Step 1: Finding running container...${NC}"
CONTAINER_ID=$(docker ps --filter "name=${CONTAINER_NAME}" --format "{{.ID}}" | head -n1)

if [ -z "$CONTAINER_ID" ]; then
    echo -e "${RED}ERROR: Container ${CONTAINER_NAME} not found!${NC}"
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

echo -e "${GREEN}Found container: $CONTAINER_ID${NC}"
echo ""

# Step 2: Create migration SQL file
echo -e "${YELLOW}Step 2: Creating migration SQL file...${NC}"
cat > /tmp/avatar_migration.sql << 'EOF'
-- Migration: Add Avatar Creator and Pose Generator tables
-- Date: 2025-10-14
-- Purpose: Create all Avatar Creator tables with persona fields

-- ========================================
-- CREATE TABLE: avatar_projects
-- ========================================

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

-- ========================================
-- CREATE TABLE: avatars (with persona fields)
-- ========================================

CREATE TABLE IF NOT EXISTS "avatars" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseImageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,

    -- Persona fields (for prompt generation in other apps)
    "personaName" TEXT,
    "personaAge" INTEGER,
    "personaPersonality" TEXT,
    "personaBackground" TEXT,

    -- Visual Attributes
    "gender" TEXT,
    "ageRange" TEXT,
    "ethnicity" TEXT,
    "bodyType" TEXT,
    "hairStyle" TEXT,
    "hairColor" TEXT,
    "eyeColor" TEXT,
    "skinTone" TEXT,
    "style" TEXT,

    -- Generation Info
    "sourceType" TEXT NOT NULL,
    "generationPrompt" TEXT,
    "seedUsed" INTEGER,

    -- Tracking
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

-- Add Foreign Keys
ALTER TABLE "avatars" ADD CONSTRAINT "avatars_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "avatar_projects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- CREATE TABLE: avatar_presets
-- ========================================

CREATE TABLE IF NOT EXISTS "avatar_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "previewImageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "personaTemplate" TEXT NOT NULL,
    "visualAttributes" TEXT NOT NULL,
    "generationPrompt" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avatar_presets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "avatar_presets_category_idx" ON "avatar_presets"("category");
CREATE INDEX IF NOT EXISTS "avatar_presets_isPublic_idx" ON "avatar_presets"("isPublic");
CREATE INDEX IF NOT EXISTS "avatar_presets_category_isPublic_idx" ON "avatar_presets"("category", "isPublic");
CREATE INDEX IF NOT EXISTS "avatar_presets_usageCount_idx" ON "avatar_presets"("usageCount" DESC);

-- ========================================
-- CREATE TABLE: persona_examples
-- ========================================

CREATE TABLE IF NOT EXISTS "persona_examples" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "personaName" TEXT NOT NULL,
    "personaAge" INTEGER NOT NULL,
    "personaPersonality" TEXT NOT NULL,
    "personaBackground" TEXT NOT NULL,
    "suggestedAttributes" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persona_examples_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "persona_examples_category_idx" ON "persona_examples"("category");
CREATE INDEX IF NOT EXISTS "persona_examples_isActive_idx" ON "persona_examples"("isActive");
CREATE INDEX IF NOT EXISTS "persona_examples_category_isActive_displayOrder_idx" ON "persona_examples"("category", "isActive", "displayOrder");

-- ========================================
-- CREATE TABLE: avatar_usage_history
-- ========================================

CREATE TABLE IF NOT EXISTS "avatar_usage_history" (
    "id" TEXT NOT NULL,
    "avatarId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avatar_usage_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "avatar_usage_history_avatarId_idx" ON "avatar_usage_history"("avatarId");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_userId_idx" ON "avatar_usage_history"("userId");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_appId_idx" ON "avatar_usage_history"("appId");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_avatarId_createdAt_idx" ON "avatar_usage_history"("avatarId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "avatar_usage_history_userId_createdAt_idx" ON "avatar_usage_history"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "avatar_usage_history_appId_createdAt_idx" ON "avatar_usage_history"("appId", "createdAt");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_referenceId_referenceType_idx" ON "avatar_usage_history"("referenceId", "referenceType");

ALTER TABLE "avatar_usage_history" ADD CONSTRAINT "avatar_usage_history_avatarId_fkey"
    FOREIGN KEY ("avatarId") REFERENCES "avatars"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- CREATE TABLE: avatar_generations
-- ========================================

CREATE TABLE IF NOT EXISTS "avatar_generations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avatarId" TEXT,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "prompt" TEXT NOT NULL,
    "options" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "avatar_generations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "avatar_generations_userId_idx" ON "avatar_generations"("userId");
CREATE INDEX IF NOT EXISTS "avatar_generations_status_idx" ON "avatar_generations"("status");
CREATE INDEX IF NOT EXISTS "avatar_generations_projectId_idx" ON "avatar_generations"("projectId");
CREATE INDEX IF NOT EXISTS "avatar_generations_avatarId_idx" ON "avatar_generations"("avatarId");
CREATE INDEX IF NOT EXISTS "avatar_generations_userId_status_idx" ON "avatar_generations"("userId", "status");
CREATE INDEX IF NOT EXISTS "avatar_generations_userId_createdAt_idx" ON "avatar_generations"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "avatar_generations_status_createdAt_idx" ON "avatar_generations"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "avatar_generations_projectId_createdAt_idx" ON "avatar_generations"("projectId", "createdAt" DESC);

-- ========================================
-- CREATE TABLE: pose_categories
-- ========================================

CREATE TABLE IF NOT EXISTS "pose_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'folder',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "poseCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pose_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pose_categories_slug_key" ON "pose_categories"("slug");
CREATE INDEX IF NOT EXISTS "pose_categories_parentId_idx" ON "pose_categories"("parentId");
CREATE INDEX IF NOT EXISTS "pose_categories_isActive_displayOrder_idx" ON "pose_categories"("isActive", "displayOrder");
CREATE INDEX IF NOT EXISTS "pose_categories_slug_idx" ON "pose_categories"("slug");

ALTER TABLE "pose_categories" ADD CONSTRAINT "pose_categories_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "pose_categories"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- CREATE TABLE: pose_library
-- ========================================

CREATE TABLE IF NOT EXISTS "pose_library" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "previewImageUrl" TEXT NOT NULL,
    "referenceImageUrl" TEXT NOT NULL,
    "controlnetImageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "genderSuitability" TEXT NOT NULL DEFAULT 'unisex',
    "tags" TEXT[],
    "sourceType" TEXT NOT NULL DEFAULT 'curated',
    "sourceCredit" TEXT,
    "licenseType" TEXT NOT NULL DEFAULT 'platform',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "popularityScore" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pose_library_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pose_library_categoryId_idx" ON "pose_library"("categoryId");
CREATE INDEX IF NOT EXISTS "pose_library_difficulty_idx" ON "pose_library"("difficulty");
CREATE INDEX IF NOT EXISTS "pose_library_isPublic_popularityScore_idx" ON "pose_library"("isPublic", "popularityScore");
CREATE INDEX IF NOT EXISTS "pose_library_isFeatured_usageCount_idx" ON "pose_library"("isFeatured", "usageCount" DESC);
CREATE INDEX IF NOT EXISTS "pose_library_tags_idx" ON "pose_library" USING GIN ("tags");

ALTER TABLE "pose_library" ADD CONSTRAINT "pose_library_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "pose_categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ========================================
-- CREATE TABLE: pose_generator_projects
-- ========================================

CREATE TABLE IF NOT EXISTS "pose_generator_projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "description" TEXT,
    "avatarImageUrl" TEXT,
    "avatarSource" TEXT NOT NULL DEFAULT 'upload',
    "avatarId" TEXT,
    "totalGenerations" INTEGER NOT NULL DEFAULT 0,
    "totalPosesGenerated" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pose_generator_projects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pose_generator_projects_userId_idx" ON "pose_generator_projects"("userId");
CREATE INDEX IF NOT EXISTS "pose_generator_projects_userId_updatedAt_idx" ON "pose_generator_projects"("userId", "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "pose_generator_projects_avatarId_idx" ON "pose_generator_projects"("avatarId");
CREATE INDEX IF NOT EXISTS "pose_generator_projects_status_idx" ON "pose_generator_projects"("status");

ALTER TABLE "pose_generator_projects" ADD CONSTRAINT "pose_generator_projects_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pose_generator_projects" ADD CONSTRAINT "pose_generator_projects_avatarId_fkey"
    FOREIGN KEY ("avatarId") REFERENCES "avatars"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ========================================
-- CREATE TABLE: pose_generations
-- ========================================

CREATE TABLE IF NOT EXISTS "pose_generations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "generationType" TEXT NOT NULL,
    "textPrompt" TEXT,
    "generatedPoseStructure" TEXT,
    "avatarId" TEXT,
    "avatarAttributes" TEXT,
    "batchSize" INTEGER NOT NULL,
    "totalExpectedPoses" INTEGER NOT NULL,
    "useBackgroundChanger" BOOLEAN NOT NULL DEFAULT false,
    "backgroundPrompt" TEXT,
    "backgroundMode" TEXT,
    "exportFormats" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "posesCompleted" INTEGER NOT NULL DEFAULT 0,
    "posesFailed" INTEGER NOT NULL DEFAULT 0,
    "creditCharged" INTEGER NOT NULL,
    "creditRefunded" INTEGER NOT NULL DEFAULT 0,
    "queueJobId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "avgGenerationTime" DOUBLE PRECISION,
    "totalProcessingTime" DOUBLE PRECISION,

    CONSTRAINT "pose_generations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pose_generations_projectId_idx" ON "pose_generations"("projectId");
CREATE INDEX IF NOT EXISTS "pose_generations_userId_idx" ON "pose_generations"("userId");
CREATE INDEX IF NOT EXISTS "pose_generations_userId_createdAt_idx" ON "pose_generations"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "pose_generations_status_createdAt_idx" ON "pose_generations"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "pose_generations_status_createdAt_queueJobId_idx" ON "pose_generations"("status", "createdAt", "queueJobId");
CREATE INDEX IF NOT EXISTS "pose_generations_queueJobId_idx" ON "pose_generations"("queueJobId");

ALTER TABLE "pose_generations" ADD CONSTRAINT "pose_generations_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "pose_generator_projects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pose_generations" ADD CONSTRAINT "pose_generations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pose_generations" ADD CONSTRAINT "pose_generations_avatarId_fkey"
    FOREIGN KEY ("avatarId") REFERENCES "avatars"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ========================================
-- CREATE TABLE: generated_poses
-- ========================================

CREATE TABLE IF NOT EXISTS "generated_poses" (
    "id" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "poseLibraryId" TEXT,
    "outputImageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "originalImageUrl" TEXT,
    "exportFormats" JSONB NOT NULL,
    "backgroundChanged" BOOLEAN NOT NULL DEFAULT false,
    "backgroundPrompt" TEXT,
    "promptUsed" TEXT NOT NULL,
    "seedUsed" INTEGER,
    "controlnetWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "generationTime" DOUBLE PRECISION,
    "aiConfidenceScore" DOUBLE PRECISION,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_poses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "generated_poses_generationId_idx" ON "generated_poses"("generationId");
CREATE INDEX IF NOT EXISTS "generated_poses_poseLibraryId_idx" ON "generated_poses"("poseLibraryId");
CREATE INDEX IF NOT EXISTS "generated_poses_status_idx" ON "generated_poses"("status");
CREATE INDEX IF NOT EXISTS "generated_poses_isFavorite_idx" ON "generated_poses"("isFavorite");

ALTER TABLE "generated_poses" ADD CONSTRAINT "generated_poses_generationId_fkey"
    FOREIGN KEY ("generationId") REFERENCES "pose_generations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "generated_poses" ADD CONSTRAINT "generated_poses_poseLibraryId_fkey"
    FOREIGN KEY ("poseLibraryId") REFERENCES "pose_library"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ========================================
-- CREATE TABLE: pose_selections
-- ========================================

CREATE TABLE IF NOT EXISTS "pose_selections" (
    "id" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "poseLibraryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pose_selections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pose_selections_generationId_poseLibraryId_key" ON "pose_selections"("generationId", "poseLibraryId");
CREATE INDEX IF NOT EXISTS "pose_selections_generationId_idx" ON "pose_selections"("generationId");
CREATE INDEX IF NOT EXISTS "pose_selections_poseLibraryId_idx" ON "pose_selections"("poseLibraryId");

ALTER TABLE "pose_selections" ADD CONSTRAINT "pose_selections_generationId_fkey"
    FOREIGN KEY ("generationId") REFERENCES "pose_generations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pose_selections" ADD CONSTRAINT "pose_selections_poseLibraryId_fkey"
    FOREIGN KEY ("poseLibraryId") REFERENCES "pose_library"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- CREATE TABLE: pose_requests
-- ========================================

CREATE TABLE IF NOT EXISTS "pose_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poseName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "referenceImageUrl" TEXT,
    "categoryId" TEXT,
    "useCase" TEXT,
    "votesCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "completedPoseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pose_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pose_requests_userId_idx" ON "pose_requests"("userId");
CREATE INDEX IF NOT EXISTS "pose_requests_status_idx" ON "pose_requests"("status");
CREATE INDEX IF NOT EXISTS "pose_requests_votesCount_idx" ON "pose_requests"("votesCount" DESC);
CREATE INDEX IF NOT EXISTS "pose_requests_status_votesCount_idx" ON "pose_requests"("status", "votesCount" DESC);

ALTER TABLE "pose_requests" ADD CONSTRAINT "pose_requests_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pose_requests" ADD CONSTRAINT "pose_requests_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "pose_categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EOF

echo -e "${GREEN}Migration SQL file created: /tmp/avatar_migration.sql${NC}"
echo ""

# Step 3: Copy migration file into container
echo -e "${YELLOW}Step 3: Copying migration file into container...${NC}"
docker cp /tmp/avatar_migration.sql ${CONTAINER_ID}:/tmp/avatar_migration.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Migration file copied successfully${NC}"
else
    echo -e "${RED}ERROR: Failed to copy migration file${NC}"
    exit 1
fi
echo ""

# Step 4: Execute migration in container
echo -e "${YELLOW}Step 4: Executing migration in database...${NC}"
echo "This will create all Avatar Creator and Pose Generator tables."
echo ""

# Execute migration using psql
docker exec -i ${CONTAINER_ID} bash -c "psql \"\${DATABASE_URL}\" -f /tmp/avatar_migration.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Migration executed successfully!${NC}"
else
    echo ""
    echo -e "${RED}ERROR: Migration failed${NC}"
    exit 1
fi
echo ""

# Step 5: Verify tables were created
echo -e "${YELLOW}Step 5: Verifying tables creation...${NC}"
docker exec -i ${CONTAINER_ID} bash -c "psql \"\${DATABASE_URL}\" -c \"\\dt\" | grep -E 'avatar_projects|avatars|avatar_presets|persona_examples|avatar_usage_history|avatar_generations|pose_'"

echo ""

# Step 6: Count tables created
echo -e "${YELLOW}Step 6: Checking table count...${NC}"
TABLE_COUNT=$(docker exec -i ${CONTAINER_ID} bash -c "psql \"\${DATABASE_URL}\" -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'avatar%' OR table_name LIKE 'pose%' OR table_name LIKE 'persona%' OR table_name LIKE 'generated%';\"")

echo "Avatar Creator & Pose Generator tables found: $TABLE_COUNT"
echo ""

# Step 7: Restart application
echo -e "${YELLOW}Step 7: Restarting application...${NC}"
docker restart ${CONTAINER_ID}

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Migration Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Wait for container to restart (30 seconds)"
echo "2. Test endpoint: curl -X POST https://dev.lumiku.com/api/apps/avatar-creator/projects -H 'Authorization: Bearer YOUR_TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"Test Project\"}'"
echo "3. Check application logs: docker logs ${CONTAINER_ID} --tail 100"
echo ""
echo "Tables created:"
echo "  - avatar_projects"
echo "  - avatars (with persona fields)"
echo "  - avatar_presets"
echo "  - persona_examples"
echo "  - avatar_usage_history"
echo "  - avatar_generations"
echo "  - pose_categories"
echo "  - pose_library"
echo "  - pose_generator_projects"
echo "  - pose_generations"
echo "  - generated_poses"
echo "  - pose_selections"
echo "  - pose_requests"
echo ""
