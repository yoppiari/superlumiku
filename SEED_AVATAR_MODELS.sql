-- ==========================================
-- SEED AVATAR GENERATOR MODELS
-- Run this on production database to register Avatar Generator models
-- ==========================================

-- Model 1: ControlNet SD (Free)
INSERT INTO ai_models (
  "appId", "modelId", "modelKey", "name", "description", "provider",
  "tier", "creditCost", "creditPerSecond", "quotaCost", "capabilities",
  "enabled", "beta", "createdAt", "updatedAt"
)
VALUES (
  'avatar-generator',
  'controlnet-sd',
  'avatar-generator:controlnet-sd',
  'ControlNet SD (Free)',
  'Standard definition avatar generation with pose control',
  'modelslab',
  'free',
  5,
  NULL,
  1,
  '{"quality":"sd","resolution":"512x512","poseControl":true,"processingTime":"~10s"}',
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

-- Model 2: ControlNet HD (Basic)
INSERT INTO ai_models (
  "appId", "modelId", "modelKey", "name", "description", "provider",
  "tier", "creditCost", "creditPerSecond", "quotaCost", "capabilities",
  "enabled", "beta", "createdAt", "updatedAt"
)
VALUES (
  'avatar-generator',
  'controlnet-hd',
  'avatar-generator:controlnet-hd',
  'ControlNet HD',
  'High definition avatar generation with enhanced quality',
  'modelslab',
  'basic',
  7,
  NULL,
  1,
  '{"quality":"hd","resolution":"1024x1024","poseControl":true,"processingTime":"~15s"}',
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

-- Model 3: ControlNet Ultra (Pro)
INSERT INTO ai_models (
  "appId", "modelId", "modelKey", "name", "description", "provider",
  "tier", "creditCost", "creditPerSecond", "quotaCost", "capabilities",
  "enabled", "beta", "createdAt", "updatedAt"
)
VALUES (
  'avatar-generator',
  'controlnet-ultra',
  'avatar-generator:controlnet-ultra',
  'ControlNet Ultra Pro',
  'Ultra high quality with priority processing',
  'modelslab',
  'pro',
  10,
  NULL,
  2,
  '{"quality":"ultra","resolution":"1024x1024","poseControl":true,"priorityQueue":true,"processingTime":"~8s"}',
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

-- Verify the models were created
SELECT "appId", "modelKey", "name", "tier", "creditCost", "enabled", "beta"
FROM ai_models
WHERE "appId" = 'avatar-generator'
ORDER BY "creditCost" ASC;
