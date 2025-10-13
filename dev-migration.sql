
-- Migration for Avatar Creator Project System
-- Run this in Coolify Terminal: psql $DATABASE_URL

-- Create avatar_projects table
CREATE TABLE IF NOT EXISTS "avatar_projects" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "avatar_projects_pkey" PRIMARY KEY ("id")
);

-- Create index on userId
CREATE INDEX IF NOT EXISTS "avatar_projects_userId_idx" ON "avatar_projects"("userId");

-- Add projectId column to avatars table
ALTER TABLE "avatars"
ADD COLUMN IF NOT EXISTS "projectId" TEXT;

-- Create index on projectId
CREATE INDEX IF NOT EXISTS "avatars_projectId_idx" ON "avatars"("projectId");

-- Verify tables
SELECT 'avatar_projects' as table_name, COUNT(*) as row_count FROM avatar_projects
UNION ALL
SELECT 'avatars' as table_name, COUNT(*) as row_count FROM avatars;
