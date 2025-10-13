-- Fix for dev.lumiku.com: Create avatar_projects table if not exists
-- This will solve the "400 Bad Request" error when creating projects

-- Step 1: Create avatar_projects table
CREATE TABLE IF NOT EXISTS "avatar_projects" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS "avatar_projects_userId_idx" ON "avatar_projects"("userId");

-- Step 3: Add foreign key to avatars table if projectId column exists
DO $$ 
BEGIN
  -- Check if projectId column exists in Avatar table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'avatars' AND column_name = 'projectId'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'avatars_projectId_fkey' 
      AND table_name = 'avatars'
    ) THEN
      ALTER TABLE "avatars" 
      ADD CONSTRAINT "avatars_projectId_fkey" 
      FOREIGN KEY ("projectId") REFERENCES "avatar_projects"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- Verify tables
SELECT 
  'avatar_projects' as table_name, 
  COUNT(*) as row_count 
FROM avatar_projects
UNION ALL
SELECT 
  'avatars' as table_name, 
  COUNT(*) as row_count 
FROM avatars;
