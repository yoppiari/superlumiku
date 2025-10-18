-- ============================================
-- URGENT FIX: Background Remover 500 Errors
-- ============================================
-- Run this SQL in production database to fix
-- /api/background-remover/subscription - 500
-- /api/background-remover/jobs - 500
-- /api/background-remover/stats - 500
-- ============================================

-- CreateTable: BackgroundRemovalJob
CREATE TABLE IF NOT EXISTS "BackgroundRemovalJob" (
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BackgroundRemovalJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BackgroundRemovalBatch
CREATE TABLE IF NOT EXISTS "BackgroundRemovalBatch" (
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
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackgroundRemovalBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BackgroundRemoverSubscription
CREATE TABLE IF NOT EXISTS "BackgroundRemoverSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "monthlyPrice" INTEGER NOT NULL,
    "dailyQuota" INTEGER NOT NULL,
    "professionalDailyQuota" INTEGER NOT NULL,
    "allowedTiers" TEXT[],
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

    CONSTRAINT "BackgroundRemoverSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BackgroundRemoverSubscriptionUsage
CREATE TABLE IF NOT EXISTS "BackgroundRemoverSubscriptionUsage" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "removalsCount" INTEGER NOT NULL DEFAULT 0,
    "totalCreditsEquivalent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackgroundRemoverSubscriptionUsage_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- CREATE INDEXES
-- ============================================

-- BackgroundRemovalJob indexes
CREATE INDEX IF NOT EXISTS "BackgroundRemovalJob_userId_idx" ON "BackgroundRemovalJob"("userId");
CREATE INDEX IF NOT EXISTS "BackgroundRemovalJob_status_idx" ON "BackgroundRemovalJob"("status");
CREATE INDEX IF NOT EXISTS "BackgroundRemovalJob_batchId_idx" ON "BackgroundRemovalJob"("batchId");
CREATE INDEX IF NOT EXISTS "BackgroundRemovalJob_createdAt_idx" ON "BackgroundRemovalJob"("createdAt");

-- BackgroundRemovalBatch indexes
CREATE UNIQUE INDEX IF NOT EXISTS "BackgroundRemovalBatch_batchId_key" ON "BackgroundRemovalBatch"("batchId");
CREATE INDEX IF NOT EXISTS "BackgroundRemovalBatch_userId_idx" ON "BackgroundRemovalBatch"("userId");
CREATE INDEX IF NOT EXISTS "BackgroundRemovalBatch_status_idx" ON "BackgroundRemovalBatch"("status");
CREATE INDEX IF NOT EXISTS "BackgroundRemovalBatch_createdAt_idx" ON "BackgroundRemovalBatch"("createdAt");

-- BackgroundRemoverSubscription indexes
CREATE UNIQUE INDEX IF NOT EXISTS "BackgroundRemoverSubscription_userId_key" ON "BackgroundRemoverSubscription"("userId");
CREATE INDEX IF NOT EXISTS "BackgroundRemoverSubscription_status_idx" ON "BackgroundRemoverSubscription"("status");
CREATE INDEX IF NOT EXISTS "BackgroundRemoverSubscription_currentPeriodEnd_idx" ON "BackgroundRemoverSubscription"("currentPeriodEnd");

-- BackgroundRemoverSubscriptionUsage indexes
CREATE UNIQUE INDEX IF NOT EXISTS "BackgroundRemoverSubscriptionUsage_subscriptionId_date_tier_key" ON "BackgroundRemoverSubscriptionUsage"("subscriptionId", "date", "tier");
CREATE INDEX IF NOT EXISTS "BackgroundRemoverSubscriptionUsage_subscriptionId_idx" ON "BackgroundRemoverSubscriptionUsage"("subscriptionId");
CREATE INDEX IF NOT EXISTS "BackgroundRemoverSubscriptionUsage_userId_idx" ON "BackgroundRemoverSubscriptionUsage"("userId");
CREATE INDEX IF NOT EXISTS "BackgroundRemoverSubscriptionUsage_date_idx" ON "BackgroundRemoverSubscriptionUsage"("date");
CREATE INDEX IF NOT EXISTS "BackgroundRemoverSubscriptionUsage_subscriptionId_date_idx" ON "BackgroundRemoverSubscriptionUsage"("subscriptionId", "date");

-- ============================================
-- ADD FOREIGN KEYS
-- ============================================

-- BackgroundRemovalJob -> BackgroundRemovalBatch
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'BackgroundRemovalJob_batchId_fkey'
    ) THEN
        ALTER TABLE "BackgroundRemovalJob"
        ADD CONSTRAINT "BackgroundRemovalJob_batchId_fkey"
        FOREIGN KEY ("batchId")
        REFERENCES "BackgroundRemovalBatch"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

-- BackgroundRemoverSubscriptionUsage -> BackgroundRemoverSubscription
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'BackgroundRemoverSubscriptionUsage_subscriptionId_fkey'
    ) THEN
        ALTER TABLE "BackgroundRemoverSubscriptionUsage"
        ADD CONSTRAINT "BackgroundRemoverSubscriptionUsage_subscriptionId_fkey"
        FOREIGN KEY ("subscriptionId")
        REFERENCES "BackgroundRemoverSubscription"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if tables were created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE 'Background%'
ORDER BY table_name;

-- Expected output:
-- BackgroundRemovalBatch (18 columns)
-- BackgroundRemovalJob (19 columns)
-- BackgroundRemoverSubscription (17 columns)
-- BackgroundRemoverSubscriptionUsage (9 columns)
