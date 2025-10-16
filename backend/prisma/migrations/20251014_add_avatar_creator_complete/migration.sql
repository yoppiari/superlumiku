-- Migration: Add Avatar Creator and Pose Generator tables
-- Date: 2025-10-14
-- Purpose: Create all Avatar Creator tables with persona fields
--
-- CRITICAL FIX: Wrapped in transaction to ensure atomicity
-- If any statement fails, entire migration rolls back

BEGIN;

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

-- ========================================
-- ALTER TABLE: users (Pose Generator Integration)
-- ========================================
-- CRITICAL: These columns are required for Pose Generator unlimited tier
-- Without these, login will fail with "column does not exist" error

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "unlimitedPoseActive" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "unlimitedPoseDailyQuota" INTEGER DEFAULT 100;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "unlimitedPoseQuotaUsed" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "unlimitedPoseQuotaResetAt" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "unlimitedPoseExpiresAt" TIMESTAMP;

-- ========================================
-- COMMIT TRANSACTION
-- ========================================
-- If we reached here, all statements succeeded
-- Commit the transaction to make changes permanent

COMMIT;
