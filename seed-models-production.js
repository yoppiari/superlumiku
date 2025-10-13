// Seed AI Models for Production (Coolify)
// Run: node seed-models-production.js
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:3qQOc2DzN8GpkTAKkTNvvoXKn4ZPbyxkX65zRMBL0IbI9XsVZd5zQkhAj5j793e6@kssgoso:5432/postgres';

const MODELS = [
  // ==========================================
  // VIDEO GENERATOR MODELS
  // ==========================================
  {
    appId: 'video-generator',
    modelId: 'wan2.2',
    modelKey: 'video-generator:wan2.2',
    name: 'Wan 2.2 T2V (Free)',
    description: 'Text-to-Video Ultra - Fast and efficient',
    provider: 'modelslab',
    tier: 'free',
    creditCost: 5,
    creditPerSecond: 1.0,
    quotaCost: 1,
    capabilities: JSON.stringify({
      maxDuration: 6,
      resolutions: ['720p'],
      aspectRatios: ['16:9', '9:16']
    }),
    enabled: true,
    beta: false
  },
  {
    appId: 'video-generator',
    modelId: 'veo2',
    modelKey: 'video-generator:veo2',
    name: 'Google Veo 2',
    description: 'Advanced video generation with Veo 2',
    provider: 'edenai',
    tier: 'basic',
    creditCost: 10,
    creditPerSecond: 2.0,
    quotaCost: 1,
    capabilities: JSON.stringify({
      maxDuration: 10,
      resolutions: ['720p', '1080p'],
      aspectRatios: ['16:9', '9:16', '1:1']
    }),
    enabled: true,
    beta: false
  },
  {
    appId: 'video-generator',
    modelId: 'kling-2.5',
    modelKey: 'video-generator:kling-2.5',
    name: 'Kling 2.5 Pro',
    description: 'Professional video generation with Kling AI',
    provider: 'edenai',
    tier: 'pro',
    creditCost: 20,
    creditPerSecond: 3.0,
    quotaCost: 2,
    capabilities: JSON.stringify({
      maxDuration: 10,
      resolutions: ['720p', '1080p', '4k'],
      aspectRatios: ['16:9', '9:16', '1:1', '4:5']
    }),
    enabled: true,
    beta: false
  },

  // ==========================================
  // POSTER EDITOR MODELS
  // ==========================================
  {
    appId: 'poster-editor',
    modelId: 'inpaint-standard',
    modelKey: 'poster-editor:inpaint-standard',
    name: 'Inpaint Standard',
    description: 'Standard quality inpainting',
    provider: 'segmind',
    tier: 'free',
    creditCost: 3,
    creditPerPixel: 0.000001,
    quotaCost: 1,
    capabilities: JSON.stringify({
      maxResolution: '2048x2048'
    }),
    enabled: true,
    beta: false
  },
  {
    appId: 'poster-editor',
    modelId: 'inpaint-pro',
    modelKey: 'poster-editor:inpaint-pro',
    name: 'Inpaint Pro',
    description: 'High quality inpainting with better results',
    provider: 'segmind',
    tier: 'pro',
    creditCost: 10,
    creditPerPixel: 0.000003,
    quotaCost: 2,
    capabilities: JSON.stringify({
      maxResolution: '4096x4096'
    }),
    enabled: true,
    beta: false
  },

  // ==========================================
  // VIDEO MIXER (FFmpeg-based)
  // ==========================================
  {
    appId: 'video-mixer',
    modelId: 'ffmpeg-standard',
    modelKey: 'video-mixer:ffmpeg-standard',
    name: 'FFmpeg Standard',
    description: 'Standard video mixing with FFmpeg',
    provider: 'local',
    tier: 'free',
    creditCost: 2,
    creditPerSecond: null,
    quotaCost: 1,
    capabilities: JSON.stringify({
      maxVideos: 100,
      formats: ['mp4', 'webm']
    }),
    enabled: true,
    beta: false
  },

  // ==========================================
  // CAROUSEL MIX
  // ==========================================
  {
    appId: 'carousel-mix',
    modelId: 'canvas-standard',
    modelKey: 'carousel-mix:canvas-standard',
    name: 'Canvas Standard',
    description: 'Standard carousel generation',
    provider: 'local',
    tier: 'free',
    creditCost: 1,
    creditPerSecond: null,
    quotaCost: 1,
    capabilities: JSON.stringify({
      maxSlides: 8,
      formats: ['png', 'jpg']
    }),
    enabled: true,
    beta: false
  },

  // ==========================================
  // LOOPING FLOW
  // ==========================================
  {
    appId: 'looping-flow',
    modelId: 'ffmpeg-loop',
    modelKey: 'looping-flow:ffmpeg-loop',
    name: 'FFmpeg Loop',
    description: 'Video looping with FFmpeg',
    provider: 'local',
    tier: 'free',
    creditCost: 2,
    creditPerSecond: null,
    quotaCost: 1,
    capabilities: JSON.stringify({
      maxDuration: 300,
      crossfade: true
    }),
    enabled: true,
    beta: false
  },

  // ==========================================
  // AVATAR GENERATOR (Hugging Face)
  // ==========================================
  {
    appId: 'avatar-generator',
    modelId: 'controlnet-openpose-sd15',
    modelKey: 'avatar-generator:controlnet-openpose-sd15',
    name: 'ControlNet OpenPose SD 1.5 (Free)',
    description: 'Pose-guided avatar generation using Stable Diffusion 1.5',
    provider: 'huggingface',
    tier: 'free',
    creditCost: 3,
    creditPerSecond: null,
    quotaCost: 1,
    capabilities: JSON.stringify({
      model: 'lllyasviel/control_v11p_sd15_openpose',
      baseModel: 'runwayml/stable-diffusion-v1-5',
      quality: 'sd',
      resolution: '512x512',
      poseControl: true,
      processingTime: '~15-30s'
    }),
    enabled: true,
    beta: true
  },
  {
    appId: 'avatar-generator',
    modelId: 'controlnet-openpose-sdxl',
    modelKey: 'avatar-generator:controlnet-openpose-sdxl',
    name: 'ControlNet OpenPose SDXL',
    description: 'High quality pose-guided generation using Stable Diffusion XL',
    provider: 'huggingface',
    tier: 'basic',
    creditCost: 5,
    creditPerSecond: null,
    quotaCost: 1,
    capabilities: JSON.stringify({
      model: 'thibaud/controlnet-openpose-sdxl-1.0',
      baseModel: 'stabilityai/stable-diffusion-xl-base-1.0',
      quality: 'hd',
      resolution: '1024x1024',
      poseControl: true,
      processingTime: '~30-60s'
    }),
    enabled: true,
    beta: true
  },
  {
    appId: 'avatar-generator',
    modelId: 'controlnet-openpose-sdxl-ultra',
    modelKey: 'avatar-generator:controlnet-openpose-sdxl-ultra',
    name: 'ControlNet OpenPose SDXL Ultra',
    description: 'Ultra high quality with xinsir SOTA model',
    provider: 'huggingface',
    tier: 'pro',
    creditCost: 8,
    creditPerSecond: null,
    quotaCost: 2,
    capabilities: JSON.stringify({
      model: 'xinsir/controlnet-openpose-sdxl-1.0',
      baseModel: 'stabilityai/stable-diffusion-xl-base-1.0',
      quality: 'ultra',
      resolution: '1024x1024',
      poseControl: true,
      priorityQueue: true,
      processingTime: '~30-60s',
      sota: true
    }),
    enabled: true,
    beta: true
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
          "appId", "modelId", "modelKey", name, description, provider, tier,
          "creditCost", "quotaCost", "creditPerSecond", "creditPerPixel",
          capabilities, enabled, beta, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
        [
          model.appId,
          model.modelId,
          model.modelKey,
          model.name,
          model.description || null,
          model.provider,
          model.tier,
          model.creditCost,
          model.quotaCost,
          model.creditPerSecond || null,
          model.creditPerPixel || null,
          model.capabilities || null,
          model.enabled,
          model.beta || false
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
    console.log(`\n🎉 AI models seeded successfully! (${MODELS.length} models)`);
    console.log('📱 Now 6 apps will appear on dashboard:');
    console.log('   ✅ Video Generator');
    console.log('   ✅ Poster Editor');
    console.log('   ✅ Video Mixer');
    console.log('   ✅ Carousel Mix');
    console.log('   ✅ Looping Flow');
    console.log('   ✅ Avatar Generator');
    console.log('\n💡 Refresh your browser to see the apps!\n');

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
