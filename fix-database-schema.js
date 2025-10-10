// Fix database schema - add missing columns and update enterprise users
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://postgres:3qQOc2DzN8GpkTAKkTNvvoXKn4ZPbyxkX65zRMBL0IbI9XsVZd5zQkhAj5j793e6@kssgoso:5432/postgres';

const ENTERPRISE_EMAILS = [
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
];

const PASSWORD = 'Lumiku2025!';

async function fixDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database\n');

    // Step 1: Add missing columns
    console.log('📋 Step 1: Adding missing columns to users table...\n');

    const addColumnsQuery = `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS "accountType" TEXT DEFAULT 'payg',
      ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT DEFAULT 'free';
    `;

    await client.query(addColumnsQuery);
    console.log('✅ Columns added successfully\n');

    // Step 2: Verify columns exist
    console.log('📋 Step 2: Verifying columns...\n');

    const verifyQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('accountType', 'subscriptionTier');
    `;

    const verifyResult = await client.query(verifyQuery);
    console.log('Columns found:');
    verifyResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
    });
    console.log('');

    // Step 3: Generate correct password hash
    console.log('📋 Step 3: Generating password hash...\n');

    const correctHash = await bcrypt.hash(PASSWORD, 10);
    console.log(`✅ Password hash generated: ${correctHash.substring(0, 30)}...\n`);

    // Step 4: Update enterprise users with correct password and schema
    console.log('📋 Step 4: Creating/Updating enterprise users...\n');

    const updateQuery = `
      INSERT INTO users (id, email, password, name, role, "storageQuota", "storageUsed", "accountType", "subscriptionTier", "createdAt", "updatedAt")
      VALUES
        ('ent-user-001', 'ardianfaisal.id@gmail.com', $1, 'Ardian Faisal', 'user', 1073741824, 0, 'payg', 'free', NOW(), NOW()),
        ('ent-user-002', 'iqbal.elvo@gmail.com', $1, 'Iqbal Elvo', 'user', 1073741824, 0, 'payg', 'free', NOW(), NOW()),
        ('ent-user-003', 'galuh.inteko@gmail.com', $1, 'Galuh Inteko', 'user', 1073741824, 0, 'payg', 'free', NOW(), NOW()),
        ('ent-user-004', 'dilla.inteko@gmail.com', $1, 'Dilla Inteko', 'user', 1073741824, 0, 'payg', 'free', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        "accountType" = EXCLUDED."accountType",
        "subscriptionTier" = EXCLUDED."subscriptionTier",
        "updatedAt" = NOW()
      RETURNING email, name, "accountType", "subscriptionTier";
    `;

    const updateResult = await client.query(updateQuery, [correctHash]);

    console.log(`✅ Updated ${updateResult.rowCount} users:\n`);
    updateResult.rows.forEach(row => {
      console.log(`   - ${row.name} (${row.email})`);
      console.log(`     Account: ${row.accountType}, Tier: ${row.subscriptionTier}`);
    });
    console.log('');

    // Step 5: Ensure credits exist for all users
    console.log('📋 Step 5: Ensuring credits for all users...\n');

    const creditsQuery = `
      INSERT INTO credits (id, "userId", amount, balance, type, description, "createdAt")
      SELECT
        'credit-' || id,
        id,
        100000,
        100000,
        'bonus',
        'Enterprise unlimited credits',
        NOW()
      FROM users
      WHERE email = ANY($1::text[])
      ON CONFLICT DO NOTHING
      RETURNING "userId";
    `;

    const creditsResult = await client.query(creditsQuery, [ENTERPRISE_EMAILS]);
    console.log(`✅ Credits ensured for ${creditsResult.rowCount} users\n`);

    // Step 6: Verify final state
    console.log('📋 Step 6: Final verification...\n');

    const finalQuery = `
      SELECT
        u.email,
        u.name,
        u."accountType",
        u."subscriptionTier",
        COALESCE(SUM(c.balance), 0) as total_credits
      FROM users u
      LEFT JOIN credits c ON c."userId" = u.id
      WHERE u.email = ANY($1::text[])
      GROUP BY u.id, u.email, u.name, u."accountType", u."subscriptionTier"
      ORDER BY u.email;
    `;

    const finalResult = await client.query(finalQuery, [ENTERPRISE_EMAILS]);

    console.log('✅ Enterprise Users Status:\n');
    console.log('═'.repeat(80));
    finalResult.rows.forEach(row => {
      console.log(`📧 ${row.email}`);
      console.log(`   Name: ${row.name}`);
      console.log(`   Account Type: ${row.accountType}`);
      console.log(`   Tier: ${row.subscriptionTier}`);
      console.log(`   Credits: ${row.total_credits}`);
      console.log(`   Password: ${PASSWORD}`);
      console.log('');
    });
    console.log('═'.repeat(80));

    // Step 7: Test password verification
    console.log('\n📋 Step 7: Testing password verification...\n');

    for (const email of ENTERPRISE_EMAILS) {
      const userQuery = `SELECT email, password FROM users WHERE email = $1`;
      const userResult = await client.query(userQuery, [email]);

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const isValid = await bcrypt.compare(PASSWORD, user.password);
        console.log(`${isValid ? '✅' : '❌'} ${email}: Password ${isValid ? 'VALID' : 'INVALID'}`);
      }
    }

    console.log('\n\n🎉 Database schema fixed and enterprise users ready!');
    console.log('📧 All users can now login with password: ' + PASSWORD);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

fixDatabase().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});
