-- ========================================
-- CRITICAL FIX: Add Missing User Columns
-- ========================================
-- Purpose: Add Pose Generator columns to users table
-- Cause: Migration 20251014_add_avatar_creator_complete was missing ALTER TABLE for users
-- Impact: Login fails with "column does not exist" error
-- Run this in Coolify PostgreSQL terminal IMMEDIATELY

-- Add Pose Generator Unlimited Tier columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseActive" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseDailyQuota" INTEGER DEFAULT 100;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseQuotaUsed" INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseQuotaResetAt" TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseExpiresAt" TIMESTAMP;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name LIKE 'unlimited%'
ORDER BY column_name;
