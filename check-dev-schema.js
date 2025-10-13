const { Client } = require('pg');

const connectionString = 'postgresql://superlumiku_owner:uWx4nQdCr8aU@ep-plain-math-a1t37o7i.ap-southeast-1.aws.neon.tech/superlumiku?sslmode=require';

async function checkSchema() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to DEV database\n');

    // Check avatar_projects table
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'avatar_projects'
      );
    `);
    
    console.log('📋 avatar_projects table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Check columns
      const columnsCheck = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'avatar_projects'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📊 Columns in avatar_projects:');
      columnsCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Count projects
      const count = await client.query('SELECT COUNT(*) FROM avatar_projects');
      console.log(`\n📈 Total projects: ${count.rows[0].count}`);
    } else {
      console.log('\n❌ Table avatar_projects does NOT exist!');
      console.log('   Migration needs to be run on DEV database.');
    }
    
    // Check avatars projectId column
    const avatarProjectIdCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'avatars'
        AND column_name = 'projectId'
      );
    `);
    
    console.log('\n📋 avatars.projectId column exists:', avatarProjectIdCheck.rows[0].exists);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
