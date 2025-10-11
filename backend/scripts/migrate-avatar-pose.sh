#!/bin/bash
# Migration script for Avatar & Pose Generator split
# This will be run automatically during deployment

echo "🔄 Running Avatar & Pose Generator migration..."

cd /app/backend

# Run SQL migration directly
PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" << 'EOF'
-- Migration: Split Avatar Generator into Avatar Creator + Pose Generator

-- ALTER TABLE: avatars
ALTER TABLE "avatars" ALTER COLUMN "brandKitId" DROP NOT NULL;
ALTER TABLE "avatars" ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "avatars" DROP CONSTRAINT IF EXISTS "avatars_brandKitId_fkey";
ALTER TABLE "avatars" ADD CONSTRAINT "avatars_brandKitId_fkey"
  FOREIGN KEY ("brandKitId") REFERENCES "brand_kits"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ALTER TABLE: pose_templates
ALTER TABLE "pose_templates" ADD COLUMN IF NOT EXISTS "fashionCategory" TEXT;
ALTER TABLE "pose_templates" ADD COLUMN IF NOT EXISTS "sceneType" TEXT;
ALTER TABLE "pose_templates" ADD COLUMN IF NOT EXISTS "professionTheme" TEXT;
CREATE INDEX IF NOT EXISTS "pose_templates_fashionCategory_idx" ON "pose_templates"("fashionCategory");
CREATE INDEX IF NOT EXISTS "pose_templates_sceneType_idx" ON "pose_templates"("sceneType");

-- ALTER TABLE: pose_generation_projects
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pose_generation_projects' AND column_name = 'brandKitId') THEN
    ALTER TABLE "pose_generation_projects" DROP COLUMN "brandKitId";
  END IF;
END $$;

-- ALTER TABLE: pose_generations
ALTER TABLE "pose_generations" ALTER COLUMN "projectId" DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pose_generations' AND column_name = 'brandKitId') THEN
    ALTER TABLE "pose_generations" DROP COLUMN "brandKitId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pose_generations' AND column_name = 'poseDistribution') THEN
    ALTER TABLE "pose_generations" DROP COLUMN "poseDistribution";
  END IF;
END $$;

ALTER TABLE "pose_generations" ADD COLUMN IF NOT EXISTS "selectedPoseIds" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "pose_generations" ADD COLUMN IF NOT EXISTS "batchSize" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "pose_generations" ADD COLUMN IF NOT EXISTS "quality" TEXT NOT NULL DEFAULT 'sd';
ALTER TABLE "pose_generations" ADD COLUMN IF NOT EXISTS "fashionSettings" TEXT;
ALTER TABLE "pose_generations" ADD COLUMN IF NOT EXISTS "backgroundSettings" TEXT;
ALTER TABLE "pose_generations" ADD COLUMN IF NOT EXISTS "professionTheme" TEXT;

ALTER TABLE "pose_generations" DROP CONSTRAINT IF EXISTS "pose_generations_projectId_fkey";
ALTER TABLE "pose_generations" ADD CONSTRAINT "pose_generations_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "pose_generation_projects"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ALTER TABLE: generated_poses
ALTER TABLE "generated_poses" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "generated_poses" ALTER COLUMN "generationTime" SET DEFAULT 0;

ALTER TABLE "generated_poses" DROP CONSTRAINT IF EXISTS "generated_poses_productId_fkey";
ALTER TABLE "generated_poses" ADD CONSTRAINT "generated_poses_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

EOF

if [ $? -eq 0 ]; then
    echo "✅ Avatar & Pose Generator migration completed successfully"
else
    echo "⚠️  Migration had some errors, but continuing..."
fi
