const { Client } = require('pg');

const DATABASE_URL = 'postgres://postgres:6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES@107.155.75.50:5986/lumiku-dev';

async function checkSchema() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🚀 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Check if avatars table exists
    console.log('📊 Checking avatars table...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'avatars'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ avatars table does not exist!');
      return;
    }

    // Get avatars table columns
    console.log('✅ avatars table exists\n');
    console.log('📋 Columns in avatars table:');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'avatars'
      ORDER BY ordinal_position;
    `);

    console.table(columnsResult.rows);

    // Check avatar_projects table
    console.log('\n📊 Checking avatar_projects table...');
    const projectTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'avatar_projects'
      );
    `);

    if (projectTableCheck.rows[0].exists) {
      console.log('✅ avatar_projects table already exists\n');
      console.log('📋 Columns in avatar_projects table:');
      const projectColumnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'avatar_projects'
        ORDER BY ordinal_position;
      `);
      console.table(projectColumnsResult.rows);
    } else {
      console.log('❌ avatar_projects table does not exist yet');
    }

    // Count avatars
    console.log('\n📊 Avatar statistics:');
    const stats = await client.query(`
      SELECT COUNT(*) as total_avatars FROM avatars;
    `);
    console.log(`Total avatars: ${stats.rows[0].total_avatars}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
