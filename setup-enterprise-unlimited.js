// Setup Enterprise Unlimited Access
// Give 4 users unlimited Video Mixer & Carousel Mix access
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:3qQOc2DzN8GpkTAKkTNvvoXKn4ZPbyxkX65zRMBL0IbI9XsVZd5zQkhAj5j793e6@kssgoso:5432/postgres';

const ENTERPRISE_EMAILS = [
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
];

async function setupEnterpriseUnlimited() {
  const client = new Client({
    connectionString: DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database\n');

    // Step 1: Add userTags column
    console.log('📋 Step 1: Adding userTags column to users table...\n');

    const addColumnQuery = `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS "userTags" TEXT;
    `;

    await client.query(addColumnQuery);
    console.log('✅ Column added successfully\n');

    // Step 2: Tag enterprise users
    console.log('📋 Step 2: Tagging enterprise users with unlimited access...\n');

    const tagUsersQuery = `
      UPDATE users
      SET "userTags" = '["enterprise_unlimited"]'
      WHERE email = ANY($1::text[])
      RETURNING email, name, "userTags";
    `;

    const result = await client.query(tagUsersQuery, [ENTERPRISE_EMAILS]);

    console.log(`✅ Tagged ${result.rowCount} users:\n`);
    result.rows.forEach(row => {
      console.log(`   - ${row.name} (${row.email})`);
      console.log(`     Tags: ${row.userTags}`);
    });
    console.log('');

    // Step 3: Verify setup
    console.log('📋 Step 3: Verifying enterprise setup...\n');

    const verifyQuery = `
      SELECT
        email,
        name,
        "accountType",
        "subscriptionTier",
        "userTags",
        (SELECT balance FROM credits WHERE "userId" = users.id ORDER BY "createdAt" DESC LIMIT 1) as credits
      FROM users
      WHERE email = ANY($1::text[])
      ORDER BY email;
    `;

    const verifyResult = await client.query(verifyQuery, [ENTERPRISE_EMAILS]);

    console.log('✅ Enterprise Users Status:\n');
    console.log('═'.repeat(80));
    verifyResult.rows.forEach(row => {
      console.log(`📧 ${row.email}`);
      console.log(`   Name: ${row.name}`);
      console.log(`   Account Type: ${row.accountType}`);
      console.log(`   Tier: ${row.subscriptionTier}`);
      console.log(`   Tags: ${row.userTags}`);
      console.log(`   Credits: ${row.credits}`);
      console.log(`   ⭐ Unlimited Access: Video Mixer & Carousel Mix`);
      console.log('');
    });
    console.log('═'.repeat(80));

    console.log('\n🎉 Enterprise unlimited access configured successfully!');
    console.log('\n📝 Summary:');
    console.log('   - 4 users tagged with "enterprise_unlimited"');
    console.log('   - Video Mixer: NO CREDIT CHARGE ✅');
    console.log('   - Carousel Mix: NO CREDIT CHARGE ✅');
    console.log('   - Other apps: Still use credits ⚠️');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

setupEnterpriseUnlimited().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});
