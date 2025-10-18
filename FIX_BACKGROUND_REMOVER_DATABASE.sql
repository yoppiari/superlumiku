-- ============================================================
-- Background Remover Pro - Database Fix
-- Execute this in Coolify Database Terminal
-- ============================================================
-- This creates the 4 missing tables that cause 500 errors
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================

-- Table 1: BackgroundRemovalJob
CREATE TABLE IF NOT EXISTS "background_removal_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT,
    "itemIndex" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "originalUrl" TEXT NOT NULL,
    "processedUrl" TEXT,
    "thumbnailUrl" TEXT,
    "originalSize" INTEGER,
    "processedSize" INTEGER,
    "tier" TEXT NOT NULL,
    "aiProvider" TEXT,
    "modelName" TEXT,
    "creditsUsed" INTEGER NOT NULL,
    "pricingType" TEXT NOT NULL DEFAULT 'credit',
    "processingTime" INTEGER,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "background_removal_jobs_pkey" PRIMARY KEY ("id")
);

-- Table 2: BackgroundRemovalBatch
CREATE TABLE IF NOT EXISTS "background_removal_batches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalImages" INTEGER NOT NULL,
    "processedImages" INTEGER NOT NULL DEFAULT 0,
    "failedImages" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL,
    "totalCredits" INTEGER NOT NULL,
    "discountPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "originalPrice" INTEGER NOT NULL,
    "finalPrice" INTEGER NOT NULL,
    "zipUrl" TEXT,
    "zipSize" INTEGER,
    "zipGenerated" BOOLEAN NOT NULL DEFAULT false,
    "progressPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedTimeMs" INTEGER,
    "processingTimeMs" INTEGER,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "background_removal_batches_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "background_removal_batches_batchId_key" UNIQUE ("batchId")
);

-- Table 3: BackgroundRemoverSubscription
CREATE TABLE IF NOT EXISTS "background_remover_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "monthlyPrice" INTEGER NOT NULL,
    "dailyQuota" INTEGER NOT NULL,
    "professionalDailyQuota" INTEGER NOT NULL,
    "allowedTiers" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "nextBillingDate" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "lastPaymentId" TEXT,
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_remover_subscriptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "background_remover_subscriptions_userId_key" UNIQUE ("userId")
);

-- Table 4: BackgroundRemoverSubscriptionUsage
CREATE TABLE IF NOT EXISTS "background_remover_subscription_usage" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "removalsCount" INTEGER NOT NULL DEFAULT 0,
    "totalCreditsEquivalent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_remover_subscription_usage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "background_remover_subscription_usage_subscriptionId_date_key" UNIQUE ("subscriptionId", "date", "tier")
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS "background_removal_jobs_userId_idx" ON "background_removal_jobs"("userId");
CREATE INDEX IF NOT EXISTS "background_removal_jobs_batchId_idx" ON "background_removal_jobs"("batchId");
CREATE INDEX IF NOT EXISTS "background_removal_jobs_status_idx" ON "background_removal_jobs"("status");
CREATE INDEX IF NOT EXISTS "background_removal_jobs_userId_createdAt_idx" ON "background_removal_jobs"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "background_removal_jobs_status_createdAt_idx" ON "background_removal_jobs"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "background_removal_jobs_batchId_itemIndex_idx" ON "background_removal_jobs"("batchId", "itemIndex");

CREATE INDEX IF NOT EXISTS "background_removal_batches_userId_idx" ON "background_removal_batches"("userId");
CREATE INDEX IF NOT EXISTS "background_removal_batches_status_idx" ON "background_removal_batches"("status");
CREATE INDEX IF NOT EXISTS "background_removal_batches_userId_createdAt_idx" ON "background_removal_batches"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "background_removal_batches_status_createdAt_idx" ON "background_removal_batches"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "background_remover_subscriptions_userId_idx" ON "background_remover_subscriptions"("userId");
CREATE INDEX IF NOT EXISTS "background_remover_subscriptions_status_idx" ON "background_remover_subscriptions"("status");
CREATE INDEX IF NOT EXISTS "background_remover_subscriptions_currentPeriodEnd_idx" ON "background_remover_subscriptions"("currentPeriodEnd");
CREATE INDEX IF NOT EXISTS "background_remover_subscriptions_status_currentPeriodEnd_idx" ON "background_remover_subscriptions"("status", "currentPeriodEnd");

CREATE INDEX IF NOT EXISTS "background_remover_subscription_usage_subscriptionId_idx" ON "background_remover_subscription_usage"("subscriptionId");
CREATE INDEX IF NOT EXISTS "background_remover_subscription_usage_userId_idx" ON "background_remover_subscription_usage"("userId");
CREATE INDEX IF NOT EXISTS "background_remover_subscription_usage_date_idx" ON "background_remover_subscription_usage"("date");
CREATE INDEX IF NOT EXISTS "background_remover_subscription_usage_subscriptionId_date_idx" ON "background_remover_subscription_usage"("subscriptionId", "date");
CREATE INDEX IF NOT EXISTS "background_remover_subscription_usage_userId_date_idx" ON "background_remover_subscription_usage"("userId", "date");

-- Add Foreign Keys (if not exists already handled by PostgreSQL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'background_removal_jobs_batchId_fkey'
    ) THEN
        ALTER TABLE "background_removal_jobs"
        ADD CONSTRAINT "background_removal_jobs_batchId_fkey"
        FOREIGN KEY ("batchId")
        REFERENCES "background_removal_batches"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'background_remover_subscription_usage_subscriptionId_fkey'
    ) THEN
        ALTER TABLE "background_remover_subscription_usage"
        ADD CONSTRAINT "background_remover_subscription_usage_subscriptionId_fkey"
        FOREIGN KEY ("subscriptionId")
        REFERENCES "background_remover_subscriptions"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Verify tables were created
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_name LIKE 'background_%'
ORDER BY table_name;

-- Expected output:
-- background_removal_batches        | 23
-- background_removal_jobs           | 22
-- background_remover_subscription_usage | 9
-- background_remover_subscriptions  | 17
