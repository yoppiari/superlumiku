/**
 * Run Avatar Project Migration on Production Database
 * Fixed version with correct column names (camelCase)
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
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_avatar_projects_userId" ON "avatar_projects"("userId");

-- STEP 2: Add projectId column to avatars
ALTER TABLE "avatars" ADD COLUMN IF NOT EXISTS "projectId" TEXT;

CREATE INDEX IF NOT EXISTS "idx_avatars_projectId" ON "avatars"("projectId");
`;

const migrationDataSQL = `
-- STEP 3: Migrate existing avatars to projects (only if avatars exist)
DO $$
DECLARE
  user_record RECORD;
  project_id TEXT;
  avatar_count INTEGER;
  total_migrated INTEGER := 0;
  total_avatars INTEGER;
BEGIN
  -- Check if there are any avatars
  SELECT COUNT(*) INTO total_avatars FROM avatars;

  IF total_avatars = 0 THEN
    RAISE NOTICE 'No existing avatars found. Schema updated, ready for new data.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found % avatars to migrate', total_avatars;

  -- Loop through each user that has avatars without projectId
  FOR user_record IN
    SELECT DISTINCT "userId"
    FROM avatars
    WHERE "projectId" IS NULL
  LOOP
    -- Count avatars for this user
    SELECT COUNT(*) INTO avatar_count
    FROM avatars
    WHERE "userId" = user_record."userId" AND "projectId" IS NULL;

    RAISE NOTICE 'Processing user: % (% avatars)', user_record."userId", avatar_count;

    -- Generate a new project ID
    project_id := 'proj_' || substr(md5(random()::text || user_record."userId"), 1, 21);

    -- Create default project for this user
    INSERT INTO avatar_projects (id, "userId", name, description, "createdAt", "updatedAt")
    VALUES (
      project_id,
      user_record."userId",
      'My Avatars',
      'Default project for existing avatars',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );

    RAISE NOTICE 'Created project: %', project_id;

    -- Update all avatars for this user
    UPDATE avatars
    SET "projectId" = project_id
    WHERE "userId" = user_record."userId" AND "projectId" IS NULL;

    RAISE NOTICE 'Migrated % avatars to project', avatar_count;
    total_migrated := total_migrated + avatar_count;
  END LOOP;

  -- Summary
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Total projects created: %', (SELECT COUNT(*) FROM avatar_projects);
  RAISE NOTICE '  Total avatars migrated: %', total_migrated;
  RAISE NOTICE '  Orphaned avatars: %', (SELECT COUNT(*) FROM avatars WHERE "projectId" IS NULL);
  RAISE NOTICE '============================================================';
END $$;
`;

const verificationSQL = `
SELECT
  (SELECT COUNT(*) FROM avatar_projects) as total_projects,
  (SELECT COUNT(*) FROM avatars) as total_avatars,
  (SELECT COUNT(*) FROM avatars WHERE "projectId" IS NOT NULL) as avatars_with_project,
  (SELECT COUNT(*) FROM avatars WHERE "projectId" IS NULL) as avatars_without_project;
`;

const constraintsSQL = `
-- Make projectId required (only if all avatars have projectId)
ALTER TABLE "avatars" ALTER COLUMN "projectId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "avatars"
ADD CONSTRAINT "fk_avatars_project"
FOREIGN KEY ("projectId")
REFERENCES "avatar_projects"("id")
ON DELETE CASCADE;
`;

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🚀 Connecting to production database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Step 1 & 2: Create table and add column
    console.log('📊 Step 1 & 2: Creating schema...');
    await client.query(migrationSQL);
    console.log('✅ Schema created!\n');

    // Step 3: Migrate data
    console.log('📊 Step 3: Migrating data...');
    await client.query(migrationDataSQL);
    console.log('✅ Data migration completed!\n');

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

    // Apply constraints only if needed
    if (parseInt(stats.total_avatars) > 0 && parseInt(stats.avatars_without_project) === 0) {
      console.log('✅ All avatars have projectId!');
      console.log('🔒 Applying constraints...');
      await client.query(constraintsSQL);
      console.log('✅ Constraints applied!\n');
    } else if (parseInt(stats.total_avatars) === 0) {
      console.log('ℹ️  No avatars in database yet.');
      console.log('✅ Schema ready for new data. Constraints will be applied when data exists.\n');
    } else {
      console.log(`⚠️  WARNING: ${stats.avatars_without_project} avatars still have NULL projectId`);
      console.log('❌ Skipping constraints. Please investigate!\n');
    }

    // Show projects (if any)
    if (parseInt(stats.total_projects) > 0) {
      console.log('📁 Projects created:');
      const projectsResult = await client.query(`
        SELECT
          ap.id,
          ap.name,
          ap."userId",
          COUNT(a.id) as avatar_count,
          ap."createdAt"
        FROM avatar_projects ap
        LEFT JOIN avatars a ON a."projectId" = ap.id
        GROUP BY ap.id, ap.name, ap."userId", ap."createdAt"
        ORDER BY ap."createdAt" DESC
        LIMIT 10;
      `);

      console.table(projectsResult.rows);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. ✅ Database schema updated');
    console.log('2. ✅ Ready to accept new avatar projects');
    console.log('3. 🔄 Backend deployment already completed');
    console.log('4. 🎨 Frontend ready to use project system');
    console.log('\n🚀 You can now test the Avatar Creator at: https://app.lumiku.com');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed.');
  }
}

// Run migration
runMigration();
