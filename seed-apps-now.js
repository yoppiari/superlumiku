// Seed apps to production database
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:3qQOc2DzN8GpkTAKkTNvvoXKn4ZPbyxkX65zRMBL0IbI9XsVZd5zQkhAj5j793e6@kssgoso:5432/postgres';

async function seedApps() {
  const client = new Client({
    connectionString: DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database\n');

    console.log('🌱 Seeding apps...\n');

    const seedQuery = `
      INSERT INTO apps (
        id, "appId", name, description, icon, enabled, beta, "comingSoon",
        "creditCostBase", "requiresSubscription", "minSubscriptionTier",
        version, "totalUsage", "activeUsers", "dashboardOrder", "dashboardColor",
        "createdAt", "updatedAt"
      )
      VALUES
        ('app-video-mixer', 'video-mixer', 'Video Mixer', 'Mix and combine multiple videos with advanced anti-fingerprinting features', 'video', true, false, false, 2, false, NULL, '1.0.0', 0, 0, 1, 'blue', NOW(), NOW()),
        ('app-carousel-mix', 'carousel-mix', 'Carousel Mix', 'Create Instagram carousels with text variations and smart distribution', 'layers', true, false, false, 2, false, NULL, '1.0.0', 0, 0, 2, 'purple', NOW(), NOW()),
        ('app-looping-flow', 'looping-flow', 'Looping Flow', 'Create perfect seamless looping videos with multi-layer audio', 'film', true, false, false, 3, false, NULL, '1.0.0', 0, 0, 3, 'green', NOW(), NOW()),
        ('app-video-generator', 'video-generator', 'Video Generator', 'Generate AI videos from text prompts using latest AI models', 'video', true, true, false, 10, false, 'basic', '1.0.0', 0, 0, 4, 'orange', NOW(), NOW()),
        ('app-poster-editor', 'poster-editor', 'Poster Editor', 'Edit posters with AI-powered text detection and inpainting', 'file-text', true, true, false, 5, false, NULL, '1.0.0', 0, 0, 5, 'red', NOW(), NOW())
      ON CONFLICT ("appId") DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        enabled = EXCLUDED.enabled,
        beta = EXCLUDED.beta,
        "comingSoon" = EXCLUDED."comingSoon",
        "creditCostBase" = EXCLUDED."creditCostBase",
        "requiresSubscription" = EXCLUDED."requiresSubscription",
        "minSubscriptionTier" = EXCLUDED."minSubscriptionTier",
        "dashboardOrder" = EXCLUDED."dashboardOrder",
        "dashboardColor" = EXCLUDED."dashboardColor",
        "updatedAt" = NOW()
      RETURNING "appId", name;
    `;

    const result = await client.query(seedQuery);

    console.log(`✅ Seeded ${result.rowCount} apps:\n`);
    result.rows.forEach(row => {
      console.log(`   - ${row.name} (${row.appId})`);
    });

    // Verify apps
    console.log('\n🔍 Verifying apps in database...\n');

    const verifyQuery = `
      SELECT "appId", name, icon, enabled, beta, "comingSoon", "dashboardOrder", "dashboardColor"
      FROM apps
      ORDER BY "dashboardOrder";
    `;

    const verifyResult = await client.query(verifyQuery);

    console.log('✅ Apps in database:\n');
    console.log('═'.repeat(80));
    verifyResult.rows.forEach(app => {
      const betaTag = app.beta ? '[BETA]' : '';
      const comingSoonTag = app.comingSoon ? '[COMING SOON]' : '';
      console.log(`${app.dashboardOrder}. ${app.name} ${betaTag}${comingSoonTag}`);
      console.log(`   App ID: ${app.appId}`);
      console.log(`   Icon: ${app.icon}`);
      console.log(`   Color: ${app.dashboardColor}`);
      console.log(`   Enabled: ${app.enabled ? '✅' : '❌'}`);
      console.log('');
    });
    console.log('═'.repeat(80));

    console.log('\n🎉 Apps seeded successfully!');
    console.log('📱 Refresh dashboard to see all apps');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

seedApps().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});
