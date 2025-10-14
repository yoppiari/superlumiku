-- Fix Avatar Creator Dashboard Error
-- Issue: Avatar Creator not showing in dashboard because no AI models in production
-- Solution: Seed the 3 Avatar Creator AI models

-- Delete existing Avatar Creator models (if any)
DELETE FROM "AIModel" WHERE "appId" = 'avatar-creator';

-- Insert Avatar Creator AI Models
INSERT INTO "AIModel" (
  "appId",
  "modelId",
  "modelKey",
  "name",
  "description",
  "provider",
  "tier",
  "creditCost",
  "creditPerPixel",
  "quotaCost",
  "capabilities",
  "enabled",
  "beta"
) VALUES
  -- 1. FLUX.1-dev Standard (Default, Free Tier)
  (
    'avatar-creator',
    'flux-dev-standard',
    'avatar-creator:flux-dev-standard',
    'FLUX.1-dev Standard',
    'Text-to-image avatar generation with FLUX.1-dev + Realism LoRA',
    'huggingface',
    'free',
    10,
    NULL,
    1,
    '{"model":"black-forest-labs/FLUX.1-dev","lora":"realism","quality":"standard","resolution":"512x512","guidanceScale":7.5,"processingTime":"~30-60s","photoRealistic":true}',
    true,
    false
  ),

  -- 2. FLUX.1-dev HD (High Quality, Basic Tier)
  (
    'avatar-creator',
    'flux-dev-hd',
    'avatar-creator:flux-dev-hd',
    'FLUX.1-dev HD',
    'High resolution avatar generation (1024x1024) with enhanced details',
    'huggingface',
    'basic',
    15,
    NULL,
    2,
    '{"model":"black-forest-labs/FLUX.1-dev","lora":"realism","quality":"hd","resolution":"1024x1024","guidanceScale":7.5,"processingTime":"~45-90s","photoRealistic":true,"enhancedDetails":true}',
    true,
    false
  ),

  -- 3. FLUX.1-schnell Fast (Rapid Generation, Pro Tier)
  (
    'avatar-creator',
    'flux-schnell-fast',
    'avatar-creator:flux-schnell-fast',
    'FLUX.1-schnell Fast',
    'Rapid avatar generation with FLUX.1-schnell (5-10 seconds)',
    'huggingface',
    'pro',
    8,
    NULL,
    1,
    '{"model":"black-forest-labs/FLUX.1-schnell","lora":"realism","quality":"fast","resolution":"512x512","guidanceScale":0,"processingTime":"~5-10s","photoRealistic":true,"fastMode":true}',
    true,
    false
  );

-- Verify the models were inserted
SELECT
  "appId",
  "modelId",
  "name",
  "tier",
  "creditCost",
  "enabled"
FROM "AIModel"
WHERE "appId" = 'avatar-creator'
ORDER BY "tier", "creditCost";
