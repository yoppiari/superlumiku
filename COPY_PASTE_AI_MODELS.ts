/**
 * COPY-PASTE THIS INTO: backend/prisma/seeds/ai-models.seed.ts
 *
 * LOCATION: After the last avatar-creator model (around line 336)
 *
 * FIND THIS:
 *     {
 *       appId: 'avatar-creator',
 *       modelId: 'flux-schnell-fast',
 *       ...
 *       beta: false
 *     }  // ← Add comma here if missing
 *   ]     // ← This is the closing bracket - ADD BEFORE THIS
 *
 * PASTE THE CODE BELOW BEFORE THE CLOSING BRACKET ]
 */

,  // ← Add comma after previous model if missing

// ==========================================
// POSE GENERATOR MODELS (FLUX.1-dev + ControlNet)
// ==========================================
{
  appId: 'pose-generator',
  modelId: 'flux-controlnet-standard',
  modelKey: 'pose-generator:flux-controlnet-standard',
  name: 'FLUX.1-dev + ControlNet Standard',
  description: 'Generate professional avatar poses with FLUX.1-dev and OpenPose ControlNet guidance',
  provider: 'huggingface',
  tier: 'basic',
  creditCost: 30,
  creditPerPixel: null,
  quotaCost: 3,
  capabilities: JSON.stringify({
    modelId: 'black-forest-labs/FLUX.1-dev',
    controlnetType: 'openpose',
    controlnetModel: 'lllyasviel/control_v11p_sd15_openpose',
    width: 768,
    height: 768,
    numInferenceSteps: 30,
    guidanceScale: 7.5,
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 'standard',
    processingTime: '45-60s',
    features: ['pose-control', 'openpose', 'flux-generation', 'professional-quality']
  }),
  enabled: true,
  beta: false
},
{
  appId: 'pose-generator',
  modelId: 'flux-controlnet-pro',
  modelKey: 'pose-generator:flux-controlnet-pro',
  name: 'FLUX.1-dev + ControlNet Pro (HD)',
  description: 'Premium HD pose generation with FLUX.1-dev, OpenPose ControlNet, and enhanced detail',
  provider: 'huggingface',
  tier: 'pro',
  creditCost: 40,
  creditPerPixel: null,
  quotaCost: 4,
  capabilities: JSON.stringify({
    modelId: 'black-forest-labs/FLUX.1-dev',
    controlnetType: 'openpose',
    controlnetModel: 'lllyasviel/control_v11p_sd15_openpose',
    width: 1024,
    height: 1024,
    numInferenceSteps: 40,
    guidanceScale: 7.5,
    maxWidth: 1536,
    maxHeight: 1536,
    quality: 'high',
    processingTime: '60-90s',
    highResolution: true,
    features: ['pose-control', 'openpose', 'flux-generation', 'ultra-hd', 'professional-grade']
  }),
  enabled: true,
  beta: false
},
{
  appId: 'pose-generator',
  modelId: 'background-changer-sam',
  modelKey: 'pose-generator:background-changer-sam',
  name: 'SAM Background Changer',
  description: 'Segment Anything Model (SAM) for precise background replacement',
  provider: 'huggingface',
  tier: 'basic',
  creditCost: 10,
  creditPerPixel: null,
  quotaCost: 1,
  capabilities: JSON.stringify({
    modelId: 'facebook/sam-vit-huge',
    segmentationType: 'automatic',
    backgroundModes: ['ai_generate', 'solid_color', 'upload'],
    maxResolution: '1024x1024',
    processingTime: '10-20s',
    features: ['precise-segmentation', 'background-removal', 'compositing']
  }),
  enabled: true,
  beta: false
}

// ← DO NOT FORGET TO KEEP THE CLOSING BRACKET ] AFTER THIS

/**
 * AFTER PASTING, VERIFY:
 *
 * 1. Comma after last avatar-creator model:
 *    },  // ← Should have comma
 *
 * 2. Three pose-generator models added
 *
 * 3. Closing bracket ] still present after all models
 *
 * 4. Test locally:
 *    cd backend
 *    bun prisma/seed.ts
 *
 * Expected output:
 *    ✅ Seeded 24 AI models (was 21, now 24)
 */
