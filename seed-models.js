// Seed AI Models for Apps
// This makes apps visible on dashboard by adding free-tier models
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:3qQOc2DzN8GpkTAKkTNvvoXKn4ZPbyxkX65zRMBL0IbI9XsVZd5zQkhAj5j793e6@kssgoso:5432/postgres';

const MODELS = [
  // Video Mixer - No AI model needed, just a "default" entry
  {
    appId: 'video-mixer',
    modelId: 'default',
    modelKey: 'video-mixer:default',
    name: 'Video Mixer (Default)',
    provider: 'internal',
    tier: 'free',
    creditCost: 0,
    quotaCost: 0,
    enabled: true
  },
  // Carousel Mix - No AI model needed
  {
    appId: 'carousel-mix',
    modelId: 'default',
    modelKey: 'carousel-mix:default',
    name: 'Carousel Mix (Default)',
    provider: 'internal',
    tier: 'free',
    creditCost: 0,
    quotaCost: 0,
    enabled: true
  },
  // Looping Flow - No AI model needed
  {
    appId: 'looping-flow',
    modelId: 'default',
    modelKey: 'looping-flow:default',
    name: 'Looping Flow (Default)',
    provider: 'internal',
    tier: 'free',
    creditCost: 0,
    quotaCost: 0,
    enabled: true
  },
  // Video Generator - Has AI models
  {
    appId: 'video-generator',
    modelId: 'runway-gen3',
    modelKey: 'video-generator:runway-gen3',
    name: 'Runway Gen-3',
    provider: 'runway',
    tier: 'basic',
    creditCost: 10,
    quotaCost: 1,
    enabled: true,
    creditPerSecond: 1.0
  },
  // Poster Editor - Has AI inpainting
  {
    appId: 'poster-editor',
    modelId: 'flux-fill',
    modelKey: 'poster-editor:flux-fill',
    name: 'FLUX Fill Pro',
    provider: 'flux',
    tier: 'free',
    creditCost: 5,
    quotaCost: 1,
    enabled: true
  }
];

async function seedModels() {
  const client = new Client({
    connectionString: DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database\n');

    console.log('🌱 Seeding AI models...\n');

    for (const model of MODELS) {
      // Check if model already exists
      const existing = await client.query(
        'SELECT "modelKey" FROM ai_models WHERE "modelKey" = $1',
        [model.modelKey]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipped: ${model.name} (already exists)`);
        continue;
      }

      // Insert model
      await client.query(
        `INSERT INTO ai_models (
          "appId", "modelId", "modelKey", name, provider, tier,
          "creditCost", "quotaCost", "creditPerSecond", enabled,
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          model.appId,
          model.modelId,
          model.modelKey,
          model.name,
          model.provider,
          model.tier,
          model.creditCost,
          model.quotaCost,
          model.creditPerSecond || null,
          model.enabled
        ]
      );

      console.log(`✅ Seeded: ${model.name} (${model.tier} tier)`);
    }

    console.log('\n🔍 Verifying models in database...\n');

    const result = await client.query(
      `SELECT "appId", name, provider, tier, enabled
       FROM ai_models
       ORDER BY "appId", tier`
    );

    console.log('✅ AI Models in database:\n');
    console.log('═'.repeat(80));

    const groupedByApp = result.rows.reduce((acc, row) => {
      if (!acc[row.appId]) acc[row.appId] = [];
      acc[row.appId].push(row);
      return acc;
    }, {});

    let index = 1;
    for (const [appId, models] of Object.entries(groupedByApp)) {
      console.log(`\n${index}. App: ${appId}`);
      models.forEach(m => {
        console.log(`   - ${m.name} (${m.provider})`);
        console.log(`     Tier: ${m.tier}, Enabled: ${m.enabled ? '✅' : '❌'}`);
      });
      index++;
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n🎉 AI models seeded successfully!');
    console.log('📱 Now all apps will appear on dashboard\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    throw error;
  } finally {
    await client.end();
    console.log('✅ Database connection closed\n');
  }
}

seedModels().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});
