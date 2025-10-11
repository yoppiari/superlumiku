-- Migration SQL: Enhance Avatar & Pose System
-- Run this when PostgreSQL is ready

-- Step 1: Enhance PoseTemplate with new fields
ALTER TABLE "pose_templates"
ADD COLUMN IF NOT EXISTS "fashionCategory" TEXT,
ADD COLUMN IF NOT EXISTS "sceneType" TEXT,
ADD COLUMN IF NOT EXISTS "professionTheme" TEXT;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS "pose_templates_fashionCategory_idx" ON "pose_templates"("fashionCategory");
CREATE INDEX IF NOT EXISTS "pose_templates_sceneType_idx" ON "pose_templates"("sceneType");

-- Step 2: Modify Avatar table (brandKitId optional, add usageCount)
ALTER TABLE "avatars"
ALTER COLUMN "brandKitId" DROP NOT NULL,
ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0;

-- Step 3: Modify PoseGenerationProject (remove brandKitId)
ALTER TABLE "pose_generation_projects"
DROP COLUMN IF EXISTS "brandKitId";

-- Step 4: Update PoseGeneration table structure
ALTER TABLE "pose_generations"
ALTER COLUMN "projectId" DROP NOT NULL,
DROP COLUMN IF EXISTS "productId",
DROP COLUMN IF EXISTS "poseDistribution",
ADD COLUMN IF NOT EXISTS "selectedPoseIds" TEXT,
ADD COLUMN IF NOT EXISTS "batchSize" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS "quality" TEXT NOT NULL DEFAULT 'sd',
ADD COLUMN IF NOT EXISTS "fashionSettings" TEXT,
ADD COLUMN IF NOT EXISTS "backgroundSettings" TEXT,
ADD COLUMN IF NOT EXISTS "professionTheme" TEXT,
ALTER COLUMN "provider" SET DEFAULT 'modelslab',
ALTER COLUMN "modelId" SET DEFAULT 'controlnet-sd15';

-- Step 5: Update GeneratedPose table
ALTER TABLE "generated_poses"
ALTER COLUMN "productId" DROP NOT NULL,
ALTER COLUMN "generationTime" SET DEFAULT 0;

-- Migration complete!
-- Next: Run `bun prisma generate` to update Prisma Client
