const { Client } = require('pg');

// DEV database connection - from COOLIFY_DEV_SETUP_GUIDE.md
// You need to get actual password from Coolify environment variables
const DATABASE_URL = process.env.DEV_DATABASE_URL || 'postgresql://lumiku_dev:YOUR_PASSWORD@postgres:5432/lumiku_development?schema=public';

console.log('🔧 Force Migration Script for dev.lumiku.com');
console.log('================================================\n');

if (DATABASE_URL.includes('YOUR_PASSWORD')) {
  console.log('❌ ERROR: Please set DEV_DATABASE_URL environment variable');
  console.log('   Get the DATABASE_URL from Coolify > dev-superlumiku > Environment Variables');
  console.log('   Then run: DEV_DATABASE_URL="your_db_url" node force-dev-migration.js\n');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to DEV database\n');

    // Check if avatar_projects table exists
    console.log('🔍 Checking if avatar_projects table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'avatar_projects'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ avatar_projects table already exists!\n');

      // Show structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'avatar_projects'
        ORDER BY ordinal_position;
      `);

      console.log('📋 Table structure:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'})`);
      });

      const count = await client.query('SELECT COUNT(*) FROM avatar_projects');
      console.log(`\n📊 Total projects: ${count.rows[0].count}`);

    } else {
      console.log('❌ avatar_projects table does NOT exist');
      console.log('🔨 Creating table now...\n');

      // Create avatar_projects table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "avatar_projects" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "avatar_projects_pkey" PRIMARY KEY ("id")
        );
      `);
      console.log('✅ Created avatar_projects table');

      // Create index
      await client.query(`
        CREATE INDEX IF NOT EXISTS "avatar_projects_userId_idx" ON "avatar_projects"("userId");
      `);
      console.log('✅ Created userId index');

      // Check if avatars table has projectId column
      const avatarProjectIdCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'avatars'
          AND column_name = 'projectId'
        );
      `);

      if (!avatarProjectIdCheck.rows[0].exists) {
        console.log('🔨 Adding projectId column to avatars table...');

        await client.query(`
          ALTER TABLE "avatars"
          ADD COLUMN IF NOT EXISTS "projectId" TEXT;
        `);
        console.log('✅ Added projectId column');

        await client.query(`
          CREATE INDEX IF NOT EXISTS "avatars_projectId_idx" ON "avatars"("projectId");
        `);
        console.log('✅ Created projectId index');

        // Add foreign key (if you want strict referential integrity)
        // await client.query(`
        //   ALTER TABLE "avatars"
        //   ADD CONSTRAINT "avatars_projectId_fkey"
        //   FOREIGN KEY ("projectId") REFERENCES "avatar_projects"("id")
        //   ON DELETE CASCADE ON UPDATE CASCADE;
        // `);
        // console.log('✅ Added foreign key constraint');
      } else {
        console.log('✅ avatars.projectId column already exists');
      }

      console.log('\n✅ Migration completed successfully!');
    }

    // Verify final state
    console.log('\n📊 Final verification:');
    const finalCheck = await client.query(`
      SELECT
        t.table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
      AND t.table_name IN ('avatar_projects', 'avatars')
      ORDER BY t.table_name;
    `);

    finalCheck.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}: ${row.column_count} columns`);
    });

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

runMigration();
