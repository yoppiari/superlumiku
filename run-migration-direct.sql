-- Direct SQL Migration for avatar_projects table
-- Database: lumiku-dev at 107.155.75.50:5986
-- Run this SQL to fix the 400 error

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
CREATE INDEX IF NOT EXISTS "avatar_projects_userId_idx"
ON "avatar_projects"("userId");

-- Step 3: Add foreign key constraint if avatars table has projectId column
DO $$
BEGIN
  -- Check if projectId column exists in avatars table
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

-- Step 4: Verify table was created
SELECT
  'avatar_projects table created successfully!' as message,
  COUNT(*) as row_count
FROM avatar_projects;

-- Step 5: Show table structure
\d avatar_projects
