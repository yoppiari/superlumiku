const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running Avatar Usage Tracking Migration...\n');

// Read the migration SQL
const migrationPath = path.join(__dirname, 'avatar-usage-tracking-migration.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Get DATABASE_URL from .env.development
const envPath = path.join(__dirname, '.env.development');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);

if (!dbUrlMatch) {
  console.error('❌ DATABASE_URL not found in .env.development');
  process.exit(1);
}

const databaseUrl = dbUrlMatch[1];
console.log('📦 Database URL:', databaseUrl.replace(/:[^:@]+@/, ':***@'));

// Parse connection string
const dbUrl = new URL(databaseUrl);
const host = dbUrl.hostname;
const port = dbUrl.port || '5432';
const database = dbUrl.pathname.slice(1).split('?')[0];
const username = dbUrl.username;
const password = dbUrl.password;

console.log('\n📝 Migration SQL Preview:');
console.log('─'.repeat(50));
console.log(migrationSQL.substring(0, 200) + '...');
console.log('─'.repeat(50));

// Check if we're in docker environment
const isDocker = host === 'postgres' || host === 'localhost';

if (isDocker) {
  console.log('\n🐳 Docker environment detected');
  console.log('⚠️  Please run migration manually inside docker container:');
  console.log('\nCommands to run:');
  console.log('─'.repeat(50));
  console.log('1. Copy migration file to container:');
  console.log(`   docker cp avatar-usage-tracking-migration.sql lumiku-postgres:/tmp/`);
  console.log('');
  console.log('2. Execute migration:');
  console.log(`   docker exec -i lumiku-postgres psql -U ${username} -d ${database} -f /tmp/avatar-usage-tracking-migration.sql`);
  console.log('');
  console.log('Or in one line:');
  console.log(`   cat avatar-usage-tracking-migration.sql | docker exec -i lumiku-postgres psql -U ${username} -d ${database}`);
  console.log('─'.repeat(50));

  // Try to run automatically
  console.log('\n🔄 Attempting to run migration automatically...');
  try {
    const result = execSync(
      `type avatar-usage-tracking-migration.sql | docker exec -i lumiku-postgres psql -U ${username} -d ${database}`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
        shell: 'cmd.exe'
      }
    );
    console.log('\n✅ Migration executed successfully!');
    console.log(result);
  } catch (error) {
    console.log('\n⚠️  Automatic migration failed. Please run manually.');
    console.log('Error:', error.message);

    // Save SQL to temp file for easy execution
    const tempSqlPath = path.join(__dirname, 'temp-migration.sql');
    fs.writeFileSync(tempSqlPath, migrationSQL);
    console.log(`\n💾 Migration SQL saved to: ${tempSqlPath}`);
  }
} else {
  console.log('\n🔧 Direct database connection');
  console.log('⚠️  Please run migration using psql or database tool');
}

console.log('\n✨ Done!');
