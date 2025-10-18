# Create Background Remover Migration - URGENT FIX

## Problem
Background Remover API returns 500 errors because the 4 database tables don't exist in production.

## Root Cause
Models were added to `schema.prisma` but migration was NEVER created or deployed.

## Fix - Create and Deploy Migration

### Step 1: Create Migration Locally

```bash
cd backend
npx prisma migrate dev --name add_background_remover_models
```

This will:
1. Generate SQL migration file in `prisma/migrations/`
2. Apply migration to local database
3. Regenerate Prisma Client with new models

### Step 2: Verify Migration File

Check `prisma/migrations/YYYYMMDD_add_background_remover_models/migration.sql` contains:

```sql
-- CreateTable: BackgroundRemovalJob
CREATE TABLE "BackgroundRemovalJob" (...)

-- CreateTable: BackgroundRemovalBatch
CREATE TABLE "BackgroundRemovalBatch" (...)

-- CreateTable: BackgroundRemoverSubscription
CREATE TABLE "BackgroundRemoverSubscription" (...)

-- CreateTable: BackgroundRemoverSubscriptionUsage
CREATE TABLE "BackgroundRemoverSubscriptionUsage" (...)

-- CreateIndex statements
-- AddForeignKey statements
```

### Step 3: Deploy to Production

**Option A: Using Coolify Terminal**

```bash
# SSH into Coolify container
cd /app

# Deploy migration (will create tables)
npx prisma migrate deploy

# Verify tables exist
npx prisma db execute --stdin <<SQL
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%background%';
SQL
```

**Option B: Manual SQL (if npx not working)**

Copy the generated migration SQL and run in database:

```sql
-- From migration file
CREATE TABLE "BackgroundRemovalJob" (...);
CREATE TABLE "BackgroundRemovalBatch" (...);
CREATE TABLE "BackgroundRemoverSubscription" (...);
CREATE TABLE "BackgroundRemoverSubscriptionUsage" (...);
```

### Step 4: Rebuild and Redeploy Backend

```bash
# In Coolify, rebuild backend container
# This ensures Prisma Client includes new models
```

### Step 5: Verify Fix

Test the 3 failing endpoints:

```bash
# 1. Subscription endpoint
curl https://api.lumiku.com/api/background-remover/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: 200 OK with { subscription: null } (no subscription yet)

# 2. Jobs endpoint
curl https://api.lumiku.com/api/background-remover/jobs \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: 200 OK with { jobs: [] } (no jobs yet)

# 3. Stats endpoint
curl https://api.lumiku.com/api/background-remover/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: 200 OK with stats object
```

---

## Why This Happened

1. ✅ Models were added to `schema.prisma`
2. ✅ Backend code was written and deployed
3. ✅ Frontend was deployed
4. ❌ **Migration was NEVER created** (`prisma migrate dev` was skipped)
5. ❌ **Tables don't exist in production database**
6. ❌ API calls fail with 500 errors

## Expected Migration File Content

```sql
-- CreateTable
CREATE TABLE "BackgroundRemovalJob" (
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

-- CreateTable
CREATE TABLE "BackgroundRemovalBatch" (
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

-- CreateTable
CREATE TABLE "BackgroundRemoverSubscription" (
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

-- CreateTable
CREATE TABLE "BackgroundRemoverSubscriptionUsage" (
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

-- CreateIndex
CREATE INDEX "BackgroundRemovalJob_userId_idx" ON "BackgroundRemovalJob"("userId");
CREATE INDEX "BackgroundRemovalJob_status_idx" ON "BackgroundRemovalJob"("status");
CREATE INDEX "BackgroundRemovalJob_batchId_idx" ON "BackgroundRemovalJob"("batchId");
CREATE INDEX "BackgroundRemovalJob_createdAt_idx" ON "BackgroundRemovalJob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundRemovalBatch_batchId_key" ON "BackgroundRemovalBatch"("batchId");
CREATE INDEX "BackgroundRemovalBatch_userId_idx" ON "BackgroundRemovalBatch"("userId");
CREATE INDEX "BackgroundRemovalBatch_status_idx" ON "BackgroundRemovalBatch"("status");
CREATE INDEX "BackgroundRemovalBatch_createdAt_idx" ON "BackgroundRemovalBatch"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundRemoverSubscription_userId_key" ON "BackgroundRemoverSubscription"("userId");
CREATE INDEX "BackgroundRemoverSubscription_status_idx" ON "BackgroundRemoverSubscription"("status");
CREATE INDEX "BackgroundRemoverSubscription_currentPeriodEnd_idx" ON "BackgroundRemoverSubscription"("currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundRemoverSubscriptionUsage_subscriptionId_date_tier_key" ON "BackgroundRemoverSubscriptionUsage"("subscriptionId", "date", "tier");
CREATE INDEX "BackgroundRemoverSubscriptionUsage_subscriptionId_idx" ON "BackgroundRemoverSubscriptionUsage"("subscriptionId");
CREATE INDEX "BackgroundRemoverSubscriptionUsage_userId_idx" ON "BackgroundRemoverSubscriptionUsage"("userId");
CREATE INDEX "BackgroundRemoverSubscriptionUsage_date_idx" ON "BackgroundRemoverSubscriptionUsage"("date");
CREATE INDEX "BackgroundRemoverSubscriptionUsage_subscriptionId_date_idx" ON "BackgroundRemoverSubscriptionUsage"("subscriptionId", "date");

-- AddForeignKey
ALTER TABLE "BackgroundRemovalJob" ADD CONSTRAINT "BackgroundRemovalJob_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "BackgroundRemovalBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundRemoverSubscriptionUsage" ADD CONSTRAINT "BackgroundRemoverSubscriptionUsage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "BackgroundRemoverSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Verification Commands

```bash
# 1. Check if migration was created
ls -la backend/prisma/migrations/ | grep background

# 2. Check if tables exist in local DB
cd backend
npx prisma db execute --stdin <<SQL
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'Background%';
SQL

# 3. Check Prisma Client includes models
cd backend
grep -r "backgroundRemovalJob" node_modules/.prisma/client/index.d.ts
```

---

## Timeline

1. **NOW**: Create migration locally
2. **5 minutes**: Deploy migration to production
3. **2 minutes**: Rebuild backend container (generates Prisma Client)
4. **1 minute**: Test endpoints
5. **FIXED**: Background Remover API working

---

## Prevent Future Issues

**Before deploying new app features**:
1. ✅ Add models to `schema.prisma`
2. ✅ Run `npx prisma migrate dev --name <feature>`
3. ✅ Verify migration file created
4. ✅ Commit migration file to git
5. ✅ Deploy migration to production
6. ✅ Rebuild backend to regenerate Prisma Client
7. ✅ Test all endpoints
