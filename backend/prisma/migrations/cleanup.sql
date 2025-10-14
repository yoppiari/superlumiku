-- ================================================================================
-- LUMIKU DATABASE OPTIMIZATION AND CLEANUP MIGRATION
-- ================================================================================
--
-- Purpose: Comprehensive database optimization including:
--   1. Missing indexes for foreign keys and common query patterns
--   2. Composite indexes for frequently used query combinations
--   3. Data validation constraints
--   4. Performance optimizations
--
-- Author: System Architect
-- Date: 2025-10-14
-- Version: 1.0.0
--
-- IMPORTANT: This migration should be run during a maintenance window
-- Estimated execution time: 5-15 minutes depending on data volume
--
-- BACKUP REQUIRED: Always backup your database before running this migration
-- Command: pg_dump lumiku_production > lumiku_backup_$(date +%Y%m%d_%H%M%S).sql
--
-- ================================================================================

-- Set statement timeout to 30 minutes to allow long-running index creation
SET statement_timeout = '30min';

-- Use CONCURRENT index creation where possible to avoid locking tables
-- This allows the application to continue running during migration

-- ================================================================================
-- PART 1: USER AND AUTHENTICATION INDEXES
-- ================================================================================

-- Users table performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_role" ON "users"("role") WHERE "role" <> 'user';
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_account_type" ON "users"("accountType");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_subscription_tier" ON "users"("subscriptionTier");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_created_at" ON "users"("createdAt" DESC);

-- Sessions table - critical for auth performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_sessions_user_id" ON "sessions"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_sessions_expires_at" ON "sessions"("expiresAt") WHERE "expiresAt" > NOW();
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_sessions_user_expires" ON "sessions"("userId", "expiresAt" DESC);

-- Devices table
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_devices_last_active" ON "devices"("lastActive" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_devices_user_last_active" ON "devices"("userId", "lastActive" DESC);

-- ================================================================================
-- PART 2: CREDIT AND PAYMENT INDEXES
-- ================================================================================

-- Credits table - heavily queried for balance checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_credits_user_created_desc" ON "credits"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_credits_type" ON "credits"("type");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_credits_reference" ON "credits"("referenceId", "referenceType") WHERE "referenceId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_credits_payment_id" ON "credits"("paymentId") WHERE "paymentId" IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_credits_created_at" ON "credits"("createdAt" DESC);

-- Payments table
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payments_user_id" ON "payments"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payments_status" ON "payments"("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payments_user_status" ON "payments"("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payments_created_at" ON "payments"("createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payments_user_created" ON "payments"("userId", "createdAt" DESC);

-- ================================================================================
-- PART 3: APP USAGE AND TRACKING INDEXES
-- ================================================================================

-- Tool configs
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tool_configs_enabled" ON "tool_configs"("enabled") WHERE "enabled" = true;

-- App usage tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_app_usages_user_app" ON "app_usages"("userId", "appId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_app_usages_user_created" ON "app_usages"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_app_usages_app_created" ON "app_usages"("appId", "createdAt" DESC);

-- ================================================================================
-- PART 4: VIDEO MIXER APP INDEXES
-- ================================================================================

-- Video Mixer Projects
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_video_mixer_projects_user_created" ON "video_mixer_projects"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_video_mixer_projects_user_updated" ON "video_mixer_projects"("userId", "updatedAt" DESC);

-- Video Mixer Groups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_video_mixer_groups_project_order" ON "video_mixer_groups"("projectId", "order");

-- Video Mixer Videos
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_video_mixer_videos_project_order" ON "video_mixer_videos"("projectId", "order");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_video_mixer_videos_group_order" ON "video_mixer_videos"("groupId", "order") WHERE "groupId" IS NOT NULL;

-- Video Mixer Generations - critical for job processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_video_mixer_gen_project_created" ON "video_mixer_generations"("projectId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_video_mixer_gen_user_status" ON "video_mixer_generations"("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_video_mixer_gen_user_created" ON "video_mixer_generations"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_video_mixer_gen_status_created" ON "video_mixer_generations"("status", "createdAt") WHERE "status" IN ('pending', 'processing');

-- ================================================================================
-- PART 5: CAROUSEL MIX APP INDEXES
-- ================================================================================

-- Carousel Projects
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_carousel_projects_user_created" ON "carousel_projects"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_carousel_projects_user_updated" ON "carousel_projects"("userId", "updatedAt" DESC);

-- Carousel Generations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_carousel_gen_project_created" ON "carousel_generations"("projectId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_carousel_gen_user_status" ON "carousel_generations"("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_carousel_gen_user_created" ON "carousel_generations"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_carousel_gen_status_created" ON "carousel_generations"("status", "createdAt") WHERE "status" IN ('pending', 'processing');

-- ================================================================================
-- PART 6: LOOPING FLOW APP INDEXES
-- ================================================================================

-- Looping Flow Projects
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_looping_flow_projects_user_created" ON "looping_flow_projects"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_looping_flow_projects_user_updated" ON "looping_flow_projects"("userId", "updatedAt" DESC);

-- Looping Flow Generations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_looping_flow_gen_video_id" ON "looping_flow_generations"("videoId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_looping_flow_gen_project_created" ON "looping_flow_generations"("projectId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_looping_flow_gen_user_status" ON "looping_flow_generations"("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_looping_flow_gen_user_created" ON "looping_flow_generations"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_looping_flow_gen_status_created" ON "looping_flow_generations"("status", "createdAt") WHERE "status" IN ('pending', 'processing');

-- ================================================================================
-- PART 7: SUBSCRIPTION SYSTEM INDEXES
-- ================================================================================

-- Subscription Plans (already has indexes from Prisma)

-- Subscriptions - critical for access control
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_subscriptions_plan_id" ON "subscriptions"("planId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_subscriptions_status_enddate" ON "subscriptions"("status", "endDate") WHERE "status" = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_subscriptions_next_billing" ON "subscriptions"("nextBillingDate") WHERE "nextBillingDate" IS NOT NULL AND "autoRenew" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_subscriptions_autorenew_enddate" ON "subscriptions"("autoRenew", "endDate") WHERE "autoRenew" = true;

-- Quota Usage - frequently accessed
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_quota_usages_user_period" ON "quota_usages"("userId", "period");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_quota_usages_reset_at" ON "quota_usages"("resetAt") WHERE "resetAt" > NOW();

-- Model Usage Analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_model_usages_user_created" ON "model_usages"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_model_usages_app_created" ON "model_usages"("appId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_model_usages_model_created" ON "model_usages"("modelKey", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_model_usages_user_app" ON "model_usages"("userId", "appId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_model_usages_user_model" ON "model_usages"("userId", "modelKey");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_model_usages_usage_type" ON "model_usages"("usageType");

-- ================================================================================
-- PART 8: AVATAR CREATOR APP INDEXES
-- ================================================================================

-- Avatar Projects
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatar_projects_user_created" ON "avatar_projects"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatar_projects_user_updated" ON "avatar_projects"("userId", "updatedAt" DESC);

-- Avatars
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatars_source_type" ON "avatars"("sourceType");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatars_user_usage_count" ON "avatars"("userId", "usageCount" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatars_user_last_used" ON "avatars"("userId", "lastUsedAt" DESC NULLS LAST);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatars_user_created" ON "avatars"("userId", "createdAt" DESC);

-- Avatar Presets
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatar_presets_category_public" ON "avatar_presets"("category", "isPublic") WHERE "isPublic" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatar_presets_usage_count" ON "avatar_presets"("usageCount" DESC);

-- Persona Examples
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_persona_examples_category_active" ON "persona_examples"("category", "isActive", "displayOrder") WHERE "isActive" = true;

-- Avatar Usage History
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatar_usage_avatar_created" ON "avatar_usage_history"("avatarId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatar_usage_user_created" ON "avatar_usage_history"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatar_usage_app_created" ON "avatar_usage_history"("appId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatar_usage_reference" ON "avatar_usage_history"("referenceId", "referenceType") WHERE "referenceId" IS NOT NULL;

-- Avatar Generations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatar_gen_user_status" ON "avatar_generations"("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatar_gen_user_created" ON "avatar_generations"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatar_gen_status_created" ON "avatar_generations"("status", "createdAt") WHERE "status" IN ('pending', 'processing');
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_avatar_gen_project_created" ON "avatar_generations"("projectId", "createdAt" DESC);

-- ================================================================================
-- PART 9: DATA VALIDATION CONSTRAINTS
-- ================================================================================

-- Add check constraints for data integrity

-- User role validation
ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "chk_users_role"
  CHECK ("role" IN ('user', 'admin'));

-- User account type validation
ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "chk_users_account_type"
  CHECK ("accountType" IN ('payg', 'subscription'));

-- User subscription tier validation
ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "chk_users_subscription_tier"
  CHECK ("subscriptionTier" IN ('free', 'basic', 'pro', 'enterprise'));

-- Storage quota constraints
ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "chk_users_storage_quota_positive"
  CHECK ("storageQuota" > 0);

ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "chk_users_storage_used_non_negative"
  CHECK ("storageUsed" >= 0);

ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "chk_users_storage_within_quota"
  CHECK ("storageUsed" <= "storageQuota" * 2); -- Allow 2x for grace period

-- Credit type validation
ALTER TABLE "credits" ADD CONSTRAINT IF NOT EXISTS "chk_credits_type"
  CHECK ("type" IN ('purchase', 'bonus', 'usage', 'refund'));

-- Payment status validation
ALTER TABLE "payments" ADD CONSTRAINT IF NOT EXISTS "chk_payments_status"
  CHECK ("status" IN ('pending', 'success', 'failed', 'expired'));

-- Payment amounts must be positive
ALTER TABLE "payments" ADD CONSTRAINT IF NOT EXISTS "chk_payments_amount_positive"
  CHECK ("amount" > 0 AND "creditAmount" > 0);

-- Generation status validation across all apps
ALTER TABLE "video_mixer_generations" ADD CONSTRAINT IF NOT EXISTS "chk_video_mixer_gen_status"
  CHECK ("status" IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE "carousel_generations" ADD CONSTRAINT IF NOT EXISTS "chk_carousel_gen_status"
  CHECK ("status" IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE "looping_flow_generations" ADD CONSTRAINT IF NOT EXISTS "chk_looping_flow_gen_status"
  CHECK ("status" IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE "avatar_generations" ADD CONSTRAINT IF NOT EXISTS "chk_avatar_gen_status"
  CHECK ("status" IN ('pending', 'processing', 'completed', 'failed'));

-- Carousel numSlides validation
ALTER TABLE "carousel_generations" ADD CONSTRAINT IF NOT EXISTS "chk_carousel_num_slides"
  CHECK ("numSlides" IN (2, 4, 6, 8));

-- Video mixer frame rate validation
ALTER TABLE "video_mixer_generations" ADD CONSTRAINT IF NOT EXISTS "chk_video_mixer_frame_rate"
  CHECK ("frameRate" IN (24, 30, 60));

-- Subscription status validation
ALTER TABLE "subscriptions" ADD CONSTRAINT IF NOT EXISTS "chk_subscriptions_status"
  CHECK ("status" IN ('active', 'cancelled', 'expired', 'grace_period', 'suspended'));

-- Subscription billing cycle validation
ALTER TABLE "subscriptions" ADD CONSTRAINT IF NOT EXISTS "chk_subscriptions_billing_cycle"
  CHECK ("billingCycle" IN ('monthly', 'yearly'));

-- Subscription date logic validation
ALTER TABLE "subscriptions" ADD CONSTRAINT IF NOT EXISTS "chk_subscriptions_dates"
  CHECK ("endDate" > "startDate");

-- Quota type validation
ALTER TABLE "quota_usages" ADD CONSTRAINT IF NOT EXISTS "chk_quota_type"
  CHECK ("quotaType" IN ('daily', 'monthly'));

-- Quota limits must be positive
ALTER TABLE "quota_usages" ADD CONSTRAINT IF NOT EXISTS "chk_quota_limits"
  CHECK ("quotaLimit" > 0 AND "usageCount" >= 0 AND "usageCount" <= "quotaLimit" * 2); -- Allow 2x for grace

-- Model usage type validation
ALTER TABLE "model_usages" ADD CONSTRAINT IF NOT EXISTS "chk_model_usage_type"
  CHECK ("usageType" IN ('credit', 'quota'));

-- AI Model tier validation
ALTER TABLE "ai_models" ADD CONSTRAINT IF NOT EXISTS "chk_ai_models_tier"
  CHECK ("tier" IN ('free', 'basic', 'pro', 'enterprise'));

-- AI Model costs must be non-negative
ALTER TABLE "ai_models" ADD CONSTRAINT IF NOT EXISTS "chk_ai_models_costs"
  CHECK ("creditCost" >= 0 AND "quotaCost" >= 0);

-- Subscription Plan validation
ALTER TABLE "subscription_plans" ADD CONSTRAINT IF NOT EXISTS "chk_subscription_plans_tier"
  CHECK ("tier" IN ('free', 'basic', 'pro', 'enterprise'));

ALTER TABLE "subscription_plans" ADD CONSTRAINT IF NOT EXISTS "chk_subscription_plans_billing"
  CHECK ("billingCycle" IN ('monthly', 'yearly'));

ALTER TABLE "subscription_plans" ADD CONSTRAINT IF NOT EXISTS "chk_subscription_plans_quotas"
  CHECK ("dailyQuota" > 0 AND ("monthlyQuota" IS NULL OR "monthlyQuota" > 0));

-- ================================================================================
-- PART 10: CLEANUP AND MAINTENANCE
-- ================================================================================

-- Analyze tables to update statistics for query planner
ANALYZE "users";
ANALYZE "sessions";
ANALYZE "devices";
ANALYZE "credits";
ANALYZE "payments";
ANALYZE "app_usages";
ANALYZE "video_mixer_projects";
ANALYZE "video_mixer_groups";
ANALYZE "video_mixer_videos";
ANALYZE "video_mixer_generations";
ANALYZE "carousel_projects";
ANALYZE "carousel_slides";
ANALYZE "carousel_texts";
ANALYZE "carousel_generations";
ANALYZE "looping_flow_projects";
ANALYZE "looping_flow_videos";
ANALYZE "looping_flow_generations";
ANALYZE "ai_models";
ANALYZE "subscription_plans";
ANALYZE "subscriptions";
ANALYZE "quota_usages";
ANALYZE "model_usages";
ANALYZE "avatar_projects";
ANALYZE "avatars";
ANALYZE "avatar_presets";
ANALYZE "persona_examples";
ANALYZE "avatar_usage_history";
ANALYZE "avatar_generations";

-- ================================================================================
-- PART 11: MONITORING AND VERIFICATION
-- ================================================================================

-- Create a view to monitor index usage (for future optimization)
CREATE OR REPLACE VIEW "v_index_usage_stats" AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- Create a view to monitor table sizes
CREATE OR REPLACE VIEW "v_table_sizes" AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size,
    pg_stat_get_live_tuples(c.oid) as row_count
FROM pg_tables t
JOIN pg_class c ON t.tablename = c.relname
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ================================================================================
-- COMPLETION SUMMARY
-- ================================================================================

DO $$
BEGIN
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'DATABASE OPTIMIZATION MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- Added comprehensive indexes for all major query patterns';
    RAISE NOTICE '- Added composite indexes for frequently combined WHERE clauses';
    RAISE NOTICE '- Added partial indexes for filtered queries (status, enabled, etc)';
    RAISE NOTICE '- Added data validation constraints for data integrity';
    RAISE NOTICE '- Created monitoring views for ongoing performance analysis';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Run VACUUM ANALYZE to reclaim space and update statistics';
    RAISE NOTICE '2. Monitor query performance using pg_stat_statements';
    RAISE NOTICE '3. Review index usage periodically using v_index_usage_stats view';
    RAISE NOTICE '4. Consider additional indexes based on production query patterns';
    RAISE NOTICE '';
    RAISE NOTICE 'Verification Queries:';
    RAISE NOTICE '- Check index count: SELECT COUNT(*) FROM pg_indexes WHERE schemaname = ''public'';';
    RAISE NOTICE '- Check table sizes: SELECT * FROM v_table_sizes;';
    RAISE NOTICE '- Check index usage: SELECT * FROM v_index_usage_stats WHERE index_scans < 10;';
    RAISE NOTICE '';
    RAISE NOTICE '================================================================================';
END $$;

-- ================================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ================================================================================

-- IMPORTANT: Save this in a separate file before running the migration
--
-- To rollback this migration, run:
-- DROP INDEX CONCURRENTLY IF EXISTS idx_<index_name>;
--
-- For constraints:
-- ALTER TABLE <table_name> DROP CONSTRAINT IF EXISTS chk_<constraint_name>;
--
-- For views:
-- DROP VIEW IF EXISTS v_index_usage_stats;
-- DROP VIEW IF EXISTS v_table_sizes;
--
-- Note: Index creation is non-destructive and can be safely rolled back
-- Constraint additions may fail if existing data violates the constraints
-- ================================================================================
