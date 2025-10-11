-- Seed AI Models for Production Database
-- Execute this SQL in your PostgreSQL database

-- Video Generator Models
INSERT INTO ai_models ("appId", "modelId", "modelKey", name, description, provider, tier, "creditCost", "quotaCost", "creditPerSecond", capabilities, enabled, beta, "createdAt", "updatedAt")
VALUES
  ('video-generator', 'wan2.2', 'video-generator:wan2.2', 'Wan 2.2 T2V (Free)', 'Text-to-Video Ultra - Fast and efficient', 'modelslab', 'free', 5, 1, 1.0, '{"maxDuration":6,"resolutions":["720p"],"aspectRatios":["16:9","9:16"]}', true, false, NOW(), NOW()),
  ('video-generator', 'veo2', 'video-generator:veo2', 'Google Veo 2', 'Advanced video generation with Veo 2', 'edenai', 'basic', 10, 1, 2.0, '{"maxDuration":10,"resolutions":["720p","1080p"],"aspectRatios":["16:9","9:16","1:1"]}', true, false, NOW(), NOW()),
  ('video-generator', 'kling-2.5', 'video-generator:kling-2.5', 'Kling 2.5 Pro', 'Professional video generation with Kling AI', 'edenai', 'pro', 20, 2, 3.0, '{"maxDuration":10,"resolutions":["720p","1080p","4k"],"aspectRatios":["16:9","9:16","1:1","4:5"]}', true, false, NOW(), NOW())
ON CONFLICT ("modelKey") DO NOTHING;

-- Poster Editor Models
INSERT INTO ai_models ("appId", "modelId", "modelKey", name, description, provider, tier, "creditCost", "quotaCost", "creditPerPixel", capabilities, enabled, beta, "createdAt", "updatedAt")
VALUES
  ('poster-editor', 'inpaint-standard', 'poster-editor:inpaint-standard', 'Inpaint Standard', 'Standard quality inpainting', 'segmind', 'free', 3, 1, 0.000001, '{"maxResolution":"2048x2048"}', true, false, NOW(), NOW()),
  ('poster-editor', 'inpaint-pro', 'poster-editor:inpaint-pro', 'Inpaint Pro', 'High quality inpainting with better results', 'segmind', 'pro', 10, 2, 0.000003, '{"maxResolution":"4096x4096"}', true, false, NOW(), NOW())
ON CONFLICT ("modelKey") DO NOTHING;

-- Video Mixer
INSERT INTO ai_models ("appId", "modelId", "modelKey", name, description, provider, tier, "creditCost", "quotaCost", capabilities, enabled, beta, "createdAt", "updatedAt")
VALUES
  ('video-mixer', 'ffmpeg-standard', 'video-mixer:ffmpeg-standard', 'FFmpeg Standard', 'Standard video mixing with FFmpeg', 'local', 'free', 2, 1, '{"maxVideos":100,"formats":["mp4","webm"]}', true, false, NOW(), NOW())
ON CONFLICT ("modelKey") DO NOTHING;

-- Carousel Mix
INSERT INTO ai_models ("appId", "modelId", "modelKey", name, description, provider, tier, "creditCost", "quotaCost", capabilities, enabled, beta, "createdAt", "updatedAt")
VALUES
  ('carousel-mix', 'canvas-standard', 'carousel-mix:canvas-standard', 'Canvas Standard', 'Standard carousel generation', 'local', 'free', 1, 1, '{"maxSlides":8,"formats":["png","jpg"]}', true, false, NOW(), NOW())
ON CONFLICT ("modelKey") DO NOTHING;

-- Looping Flow
INSERT INTO ai_models ("appId", "modelId", "modelKey", name, description, provider, tier, "creditCost", "quotaCost", capabilities, enabled, beta, "createdAt", "updatedAt")
VALUES
  ('looping-flow', 'ffmpeg-loop', 'looping-flow:ffmpeg-loop', 'FFmpeg Loop', 'Video looping with FFmpeg', 'local', 'free', 2, 1, '{"maxDuration":300,"crossfade":true}', true, false, NOW(), NOW())
ON CONFLICT ("modelKey") DO NOTHING;

-- Avatar Generator Models
INSERT INTO ai_models ("appId", "modelId", "modelKey", name, description, provider, tier, "creditCost", "quotaCost", capabilities, enabled, beta, "createdAt", "updatedAt")
VALUES
  ('avatar-generator', 'controlnet-openpose-sd15', 'avatar-generator:controlnet-openpose-sd15', 'ControlNet OpenPose SD 1.5 (Free)', 'Pose-guided avatar generation using Stable Diffusion 1.5', 'huggingface', 'free', 3, 1, '{"model":"lllyasviel/control_v11p_sd15_openpose","baseModel":"runwayml/stable-diffusion-v1-5","quality":"sd","resolution":"512x512","poseControl":true}', true, true, NOW(), NOW()),
  ('avatar-generator', 'controlnet-openpose-sdxl', 'avatar-generator:controlnet-openpose-sdxl', 'ControlNet OpenPose SDXL', 'High quality pose-guided generation using Stable Diffusion XL', 'huggingface', 'basic', 5, 1, '{"model":"thibaud/controlnet-openpose-sdxl-1.0","baseModel":"stabilityai/stable-diffusion-xl-base-1.0","quality":"hd","resolution":"1024x1024","poseControl":true}', true, true, NOW(), NOW()),
  ('avatar-generator', 'controlnet-openpose-sdxl-ultra', 'avatar-generator:controlnet-openpose-sdxl-ultra', 'ControlNet OpenPose SDXL Ultra', 'Ultra high quality with xinsir SOTA model', 'huggingface', 'pro', 8, 2, '{"model":"xinsir/controlnet-openpose-sdxl-1.0","baseModel":"stabilityai/stable-diffusion-xl-base-1.0","quality":"ultra","resolution":"1024x1024","poseControl":true,"priorityQueue":true,"sota":true}', true, true, NOW(), NOW())
ON CONFLICT ("modelKey") DO NOTHING;

-- Verify
SELECT COUNT(*) as total_models FROM ai_models;
SELECT "appId", COUNT(*) as model_count FROM ai_models GROUP BY "appId" ORDER BY "appId";
