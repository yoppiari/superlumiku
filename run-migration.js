/**
 * Run Avatar Project Migration on Production Database
 * This script connects to production database and executes the migration
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgres://postgres:6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES@107.155.75.50:5986/lumiku-dev';

const migrationSQL = `
-- ============================================
-- Avatar Creator Project System Migration
-- ============================================

-- STEP 1: Create avatar_projects table
CREATE TABLE IF NOT EXISTS "avatar_projects" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_avatar_projects_user_id" ON "avatar_projects"("user_id");

-- STEP 2: Add project_id column to avatars
ALTER TABLE "avatars" ADD COLUMN IF NOT EXISTS "project_id" TEXT;

CREATE INDEX IF NOT EXISTS "idx_avatars_project_id" ON "avatars"("project_id");

-- STEP 3: Migrate existing avatars to projects
DO $$
DECLARE
  user_record RECORD;
  project_id TEXT;
  avatar_count INTEGER;
  total_migrated INTEGER := 0;
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
    total_migrated := total_migrated + avatar_count;
  END LOOP;

  -- Summary
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Total projects created: %', (SELECT COUNT(*) FROM avatar_projects);
  RAISE NOTICE '  Total avatars migrated: %', total_migrated;
  RAISE NOTICE '  Orphaned avatars: %', (SELECT COUNT(*) FROM avatars WHERE project_id IS NULL);
  RAISE NOTICE '============================================================';
END $$;
`;

const verificationSQL = `
SELECT
  (SELECT COUNT(*) FROM avatar_projects) as total_projects,
  (SELECT COUNT(*) FROM avatars) as total_avatars,
  (SELECT COUNT(*) FROM avatars WHERE project_id IS NOT NULL) as avatars_with_project,
  (SELECT COUNT(*) FROM avatars WHERE project_id IS NULL) as avatars_without_project;
`;

const constraintsSQL = `
-- Make project_id required
ALTER TABLE "avatars" ALTER COLUMN "project_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "avatars"
ADD CONSTRAINT "fk_avatars_project"
FOREIGN KEY ("project_id")
REFERENCES "avatar_projects"("id")
ON DELETE CASCADE;
`;

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🚀 Connecting to production database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Run migration
    console.log('📊 Running migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed!\n');

    // Verify
    console.log('🔍 Verifying results...');
    const result = await client.query(verificationSQL);
    const stats = result.rows[0];

    console.log('============================================================');
    console.log('📋 Migration Summary:');
    console.log('============================================================');
    console.log(`Total Projects: ${stats.total_projects}`);
    console.log(`Total Avatars: ${stats.total_avatars}`);
    console.log(`Avatars with Project: ${stats.avatars_with_project}`);
    console.log(`Avatars without Project: ${stats.avatars_without_project}`);
    console.log('============================================================\n');

    // Apply constraints if no orphans
    if (parseInt(stats.avatars_without_project) === 0) {
      console.log('✅ All avatars have project_id!');
      console.log('🔒 Applying constraints...');
      await client.query(constraintsSQL);
      console.log('✅ Constraints applied!\n');
    } else {
      console.log(`⚠️  WARNING: ${stats.avatars_without_project} avatars still have NULL project_id`);
      console.log('❌ Skipping constraints. Please investigate!\n');
    }

    // Show projects
    console.log('📁 Projects created:');
    const projectsResult = await client.query(`
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
    `);

    console.table(projectsResult.rows);

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed.');
  }
}

// Run migration
runMigration();
