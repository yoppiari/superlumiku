-- Migration: Remove 4 Applications
-- Removes: Avatar Creator, Smart Poster Editor, Pose Generator, AI Video Generator
-- Created: 2025-10-13

-- Drop tables in correct order (respecting foreign key constraints)

-- Avatar & Pose Generator System
DROP TABLE IF EXISTS "avatar_usage_history" CASCADE;
DROP TABLE IF EXISTS "generated_poses" CASCADE;
DROP TABLE IF EXISTS "pose_generations" CASCADE;
DROP TABLE IF EXISTS "pose_generation_projects" CASCADE;
DROP TABLE IF EXISTS "pose_templates" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "avatars" CASCADE;
DROP TABLE IF EXISTS "avatar_projects" CASCADE;
DROP TABLE IF EXISTS "brand_kits" CASCADE;
DROP TABLE IF EXISTS "avatar_generations" CASCADE;

-- Poster Editor System
DROP TABLE IF EXISTS "poster_exports" CASCADE;
DROP TABLE IF EXISTS "variation_projects" CASCADE;
DROP TABLE IF EXISTS "poster_edits" CASCADE;
DROP TABLE IF EXISTS "poster_editor_projects" CASCADE;

-- Video Generator System
DROP TABLE IF EXISTS "video_generations" CASCADE;
DROP TABLE IF EXISTS "video_generator_projects" CASCADE;

-- Design Metrics (related to removed apps)
DROP TABLE IF EXISTS "design_metrics" CASCADE;

-- Done
SELECT 'Migration completed: 4 applications removed successfully' as status;
