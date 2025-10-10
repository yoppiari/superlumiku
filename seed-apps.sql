-- Seed Apps for Dashboard
-- Insert all 5 apps into database

INSERT INTO apps (
  id, "appId", name, description, icon, enabled, beta, "comingSoon",
  "creditCostBase", "requiresSubscription", "minSubscriptionTier",
  version, "totalUsage", "activeUsers", "dashboardOrder", "dashboardColor",
  "createdAt", "updatedAt"
)
VALUES
  -- Video Mixer
  (
    'app-video-mixer',
    'video-mixer',
    'Video Mixer',
    'Mix and combine multiple videos with advanced anti-fingerprinting features',
    'video',
    true,
    false,
    false,
    2,
    false,
    NULL,
    '1.0.0',
    0,
    0,
    1,
    'blue',
    NOW(),
    NOW()
  ),

  -- Carousel Mix
  (
    'app-carousel-mix',
    'carousel-mix',
    'Carousel Mix',
    'Create Instagram carousels with text variations and smart distribution',
    'layers',
    true,
    false,
    false,
    2,
    false,
    NULL,
    '1.0.0',
    0,
    0,
    2,
    'purple',
    NOW(),
    NOW()
  ),

  -- Looping Flow
  (
    'app-looping-flow',
    'looping-flow',
    'Looping Flow',
    'Create perfect seamless looping videos with multi-layer audio',
    'film',
    true,
    false,
    false,
    3,
    false,
    NULL,
    '1.0.0',
    0,
    0,
    3,
    'green',
    NOW(),
    NOW()
  ),

  -- Video Generator
  (
    'app-video-generator',
    'video-generator',
    'Video Generator',
    'Generate AI videos from text prompts using latest AI models',
    'video',
    true,
    true,
    false,
    10,
    false,
    'basic',
    '1.0.0',
    0,
    0,
    4,
    'orange',
    NOW(),
    NOW()
  ),

  -- Poster Editor
  (
    'app-poster-editor',
    'poster-editor',
    'Poster Editor',
    'Edit posters with AI-powered text detection and inpainting',
    'file-text',
    true,
    true,
    false,
    5,
    false,
    NULL,
    '1.0.0',
    0,
    0,
    5,
    'red',
    NOW(),
    NOW()
  )
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
  "updatedAt" = NOW();

-- Verify apps created
SELECT "appId", name, icon, enabled, beta, "comingSoon", "dashboardOrder", "dashboardColor"
FROM apps
ORDER BY "dashboardOrder";
