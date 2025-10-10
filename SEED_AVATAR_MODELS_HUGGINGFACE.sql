-- ==========================================
-- SEED AVATAR GENERATOR MODELS (HUGGING FACE ONLY)
-- Run this on production database to register Avatar Generator models
-- Updated to use Hugging Face Inference API instead of ModelsLab
-- ==========================================

-- Delete old ModelsLab models if they exist
DELETE FROM ai_models WHERE "appId" = 'avatar-generator' AND "provider" = 'modelslab';

-- Model 1: ControlNet OpenPose SD 1.5 (Free)
INSERT INTO ai_models (
  "appId", "modelId", "modelKey", "name", "description", "provider",
  "tier", "creditCost", "creditPerSecond", "quotaCost", "capabilities",
  "enabled", "beta", "createdAt", "updatedAt"
)
VALUES (
  'avatar-generator',
  'controlnet-openpose-sd15',
  'avatar-generator:controlnet-openpose-sd15',
  'ControlNet OpenPose SD 1.5 (Free)',
  'Pose-guided avatar generation using Stable Diffusion 1.5',
  'huggingface',
  'free',
  3,
  NULL,
  1,
  '{"model":"lllyasviel/control_v11p_sd15_openpose","baseModel":"runwayml/stable-diffusion-v1-5","quality":"sd","resolution":"512x512","poseControl":true,"processingTime":"~15-30s"}',
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("modelKey") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "provider" = EXCLUDED."provider",
  "tier" = EXCLUDED."tier",
  "creditCost" = EXCLUDED."creditCost",
  "quotaCost" = EXCLUDED."quotaCost",
  "capabilities" = EXCLUDED."capabilities",
  "enabled" = EXCLUDED."enabled",
  "beta" = EXCLUDED."beta",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Model 2: ControlNet OpenPose SDXL (Basic)
INSERT INTO ai_models (
  "appId", "modelId", "modelKey", "name", "description", "provider",
  "tier", "creditCost", "creditPerSecond", "quotaCost", "capabilities",
  "enabled", "beta", "createdAt", "updatedAt"
)
VALUES (
  'avatar-generator',
  'controlnet-openpose-sdxl',
  'avatar-generator:controlnet-openpose-sdxl',
  'ControlNet OpenPose SDXL',
  'High quality pose-guided generation using Stable Diffusion XL',
  'huggingface',
  'basic',
  5,
  NULL,
  1,
  '{"model":"thibaud/controlnet-openpose-sdxl-1.0","baseModel":"stabilityai/stable-diffusion-xl-base-1.0","quality":"hd","resolution":"1024x1024","poseControl":true,"processingTime":"~30-60s"}',
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("modelKey") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "provider" = EXCLUDED."provider",
  "tier" = EXCLUDED."tier",
  "creditCost" = EXCLUDED."creditCost",
  "quotaCost" = EXCLUDED."quotaCost",
  "capabilities" = EXCLUDED."capabilities",
  "enabled" = EXCLUDED."enabled",
  "beta" = EXCLUDED."beta",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Model 3: ControlNet OpenPose SDXL Ultra (Pro)
INSERT INTO ai_models (
  "appId", "modelId", "modelKey", "name", "description", "provider",
  "tier", "creditCost", "creditPerSecond", "quotaCost", "capabilities",
  "enabled", "beta", "createdAt", "updatedAt"
)
VALUES (
  'avatar-generator',
  'controlnet-openpose-sdxl-ultra',
  'avatar-generator:controlnet-openpose-sdxl-ultra',
  'ControlNet OpenPose SDXL Ultra',
  'Ultra high quality with xinsir SOTA model',
  'huggingface',
  'pro',
  8,
  NULL,
  2,
  '{"model":"xinsir/controlnet-openpose-sdxl-1.0","baseModel":"stabilityai/stable-diffusion-xl-base-1.0","quality":"ultra","resolution":"1024x1024","poseControl":true,"priorityQueue":true,"processingTime":"~30-60s","sota":true}',
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("modelKey") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "provider" = EXCLUDED."provider",
  "tier" = EXCLUDED."tier",
  "creditCost" = EXCLUDED."creditCost",
  "quotaCost" = EXCLUDED."quotaCost",
  "capabilities" = EXCLUDED."capabilities",
  "enabled" = EXCLUDED."enabled",
  "beta" = EXCLUDED."beta",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Verify the models were created/updated
SELECT "appId", "modelKey", "name", "provider", "tier", "creditCost", "enabled", "beta"
FROM ai_models
WHERE "appId" = 'avatar-generator'
ORDER BY "creditCost" ASC;

-- Summary
SELECT
  COUNT(*) as total_models,
  COUNT(CASE WHEN "enabled" = true THEN 1 END) as enabled_models,
  string_agg("tier", ', ' ORDER BY "creditCost") as tiers
FROM ai_models
WHERE "appId" = 'avatar-generator';
