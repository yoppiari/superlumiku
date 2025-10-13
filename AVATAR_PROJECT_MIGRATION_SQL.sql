-- ============================================
-- Avatar Creator Project System Migration
-- ============================================
-- Run this SQL in your Coolify PostgreSQL database
-- Date: 2025-10-11
-- ============================================

-- STEP 1: Create avatar_projects table
-- ============================================
CREATE TABLE IF NOT EXISTS "avatar_projects" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS "idx_avatar_projects_user_id" ON "avatar_projects"("user_id");

-- ============================================
-- STEP 2: Add project_id column to avatars
-- ============================================
ALTER TABLE "avatars" ADD COLUMN IF NOT EXISTS "project_id" TEXT;

-- Create index for project_id
CREATE INDEX IF NOT EXISTS "idx_avatars_project_id" ON "avatars"("project_id");

-- ============================================
-- STEP 3: Migrate existing avatars to projects
-- ============================================
-- This creates a default "My Avatars" project for each user
-- and assigns all their avatars to that project

DO $$
DECLARE
  user_record RECORD;
  project_id TEXT;
  avatar_count INTEGER;
BEGIN
  -- Loop through each user that has avatars without projectId
  FOR user_record IN
    SELECT DISTINCT user_id
    FROM avatars
    WHERE project_id IS NULL
  LOOP
    -- Count avatars for this user
    SELECT COUNT(*) INTO avatar_count
    FROM avatars
    WHERE user_id = user_record.user_id AND project_id IS NULL;

    RAISE NOTICE 'Processing user: % (% avatars)', user_record.user_id, avatar_count;

    -- Generate a new project ID
    project_id := 'proj_' || substr(md5(random()::text || user_record.user_id), 1, 21);

    -- Create default project for this user
    INSERT INTO avatar_projects (id, user_id, name, description, created_at, updated_at)
    VALUES (
      project_id,
      user_record.user_id,
      'My Avatars',
      'Default project for existing avatars',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );

    RAISE NOTICE 'Created project: %', project_id;

    -- Update all avatars for this user
    UPDATE avatars
    SET project_id = project_id
    WHERE user_id = user_record.user_id AND project_id IS NULL;

    RAISE NOTICE 'Migrated % avatars to project', avatar_count;
  END LOOP;

  -- Summary
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Total projects created: %', (SELECT COUNT(*) FROM avatar_projects);
  RAISE NOTICE '  Total avatars with project: %', (SELECT COUNT(*) FROM avatars WHERE project_id IS NOT NULL);
  RAISE NOTICE '  Orphaned avatars (NULL projectId): %', (SELECT COUNT(*) FROM avatars WHERE project_id IS NULL);
  RAISE NOTICE '============================================================';
END $$;

-- ============================================
-- STEP 4: Verification
-- ============================================

-- Check if any avatars still have NULL project_id
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ All avatars have been migrated!'
    ELSE '⚠️  WARNING: ' || COUNT(*) || ' avatars still have NULL project_id'
  END AS migration_status
FROM avatars
WHERE project_id IS NULL;

-- Show summary
SELECT
  (SELECT COUNT(*) FROM avatar_projects) as total_projects,
  (SELECT COUNT(*) FROM avatars) as total_avatars,
  (SELECT COUNT(*) FROM avatars WHERE project_id IS NOT NULL) as avatars_with_project,
  (SELECT COUNT(*) FROM avatars WHERE project_id IS NULL) as avatars_without_project;

-- Show projects with avatar counts
SELECT
  ap.id,
  ap.name,
  ap.user_id,
  COUNT(a.id) as avatar_count,
  ap.created_at
FROM avatar_projects ap
LEFT JOIN avatars a ON a.project_id = ap.id
GROUP BY ap.id, ap.name, ap.user_id, ap.created_at
ORDER BY ap.created_at DESC
LIMIT 10;

-- ============================================
-- STEP 5: Make project_id required (ONLY RUN AFTER VERIFICATION!)
-- ============================================
-- IMPORTANT: Only uncomment and run these commands if Step 4 shows 0 orphaned avatars

-- ALTER TABLE "avatars" ALTER COLUMN "project_id" SET NOT NULL;

-- ALTER TABLE "avatars"
-- ADD CONSTRAINT "fk_avatars_project"
-- FOREIGN KEY ("project_id")
-- REFERENCES "avatar_projects"("id")
-- ON DELETE CASCADE;

-- ============================================
-- Success!
-- ============================================
-- If you reached here without errors:
-- 1. Check Step 4 verification output
-- 2. If all avatars have project_id, uncomment and run Step 5
-- 3. Test the API endpoints
-- 4. Test the frontend
-- ============================================
