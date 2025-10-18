# Background Remover 500 Error - Root Cause Analysis

**Date**: 2025-10-18
**Status**: CRITICAL - Frontend loads but all API endpoints return 500
**Impact**: Background Remover completely non-functional in production

---

## Executive Summary

**ROOT CAUSE IDENTIFIED**: Missing database migration for Background Remover models.

The Background Remover models were added to `schema.prisma` but **no migration was created**. This means:

- ✅ Prisma schema has the models (BackgroundRemovalJob, BackgroundRemovalBatch, BackgroundRemoverSubscription)
- ❌ Database tables **do not exist** in production
- ❌ API calls to `prisma.backgroundRemovalJob.findMany()` fail with SQL errors
- ❌ Results in 500 errors on all 3 endpoints

---

## Evidence

### 1. Schema Has the Models ✅

```bash
# schema.prisma contains (lines 1237-1405):
- model BackgroundRemovalJob
- model BackgroundRemovalBatch
- model BackgroundRemoverSubscription
- model BackgroundRemoverSubscriptionUsage
```

### 2. No Migration Exists ❌

```bash
# Latest migrations:
20251014_add_avatar_creator_complete/
20251015_add_recovery_indexes/
20251015_add_variation_key_to_generated_pose/
20251016_p2_performance_indexes/
20251018_add_user_settings/

# No migration for Background Remover!
$ find . -name "*background*" -type d
# (empty result)
```

### 3. Git History Shows When Models Were Added

```bash
cddc4f8 feat(background-remover): Implement complete frontend UI
e3f2786 refactor(background-remover): Migrate to HuggingFace-only
42aa958 fix(background-remover): Enable Background Remover Pro plugin
```

**Issue**: Models added in commits but `npx prisma migrate dev` was never run.

---

## Failing API Endpoints

### 1. GET /api/background-remover/subscription (Line 159 in routes.ts)

```typescript
const subscription = await subscriptionService.getUserSubscription(userId)
// Queries: prisma.backgroundRemoverSubscription.findUnique()
// ERROR: Table "background_remover_subscriptions" does not exist
```

### 2. GET /api/background-remover/jobs (Line 123 in routes.ts)

```typescript
const jobs = await backgroundRemoverService.getUserJobs(userId)
// Queries: prisma.backgroundRemovalJob.findMany()
// ERROR: Table "background_removal_jobs" does not exist
```

### 3. GET /api/background-remover/stats (Line 235 in routes.ts)

```typescript
await prisma.backgroundRemovalJob.count({ where: { userId, batchId: null } })
await prisma.backgroundRemovalBatch.count({ where: { userId } })
// ERROR: Tables do not exist
```

---

## Why This Happened

1. **Developer workflow skip**: After adding models to schema.prisma, forgot to run:
   ```bash
   npx prisma migrate dev --name add_background_remover
   ```

2. **No migration = No tables**: Prisma migrations are the ONLY way to create tables in production.

3. **Prisma Client generated**: Running `npx prisma generate` creates TypeScript types, but does NOT create database tables.

4. **TypeScript compiles successfully**: Code compiles fine because Prisma Client has the types, but runtime fails because tables don't exist.

---

## The Fix (3 Steps)

### Step 1: Create Migration Locally

```bash
cd backend

# Create migration for Background Remover models
npx prisma migrate dev --name add_background_remover_models

# This will:
# 1. Generate SQL to create 4 tables
# 2. Create migration file in prisma/migrations/
# 3. Apply to local database (if connected)
```

### Step 2: Commit Migration

```bash
git add backend/prisma/migrations/
git commit -m "feat(prisma): Add Background Remover database migration"
git push origin development
```

### Step 3: Deploy Migration to Production

**Option A: Automatic (via Coolify deployment)**

Migration runs automatically during Docker build:

```dockerfile
# In Dockerfile, during backend build:
RUN npx prisma migrate deploy
RUN npx prisma generate
```

**Option B: Manual (via Coolify Terminal)**

If automatic deployment doesn't run migrations:

```bash
# SSH into Coolify container
cd /app/backend

# Run migrations
npx prisma migrate deploy

# Verify tables exist
psql $DATABASE_URL -c "\dt background_*"

# Should show:
# - background_removal_jobs
# - background_removal_batches
# - background_remover_subscriptions
# - background_remover_subscription_usage
```

---

## Verification Commands

### 1. Check Migration Status (Local)

```bash
cd backend
npx prisma migrate status

# Should show:
# ✅ 20251018_add_background_remover_models - Applied
```

### 2. Check Migration Status (Production)

```bash
# In Coolify terminal:
npx prisma migrate status

# Before fix:
# ❌ Your database schema is not in sync with your migration history.

# After fix:
# ✅ Database schema is up to date!
```

### 3. Verify Tables Exist (Production)

```sql
-- In production database:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'background_%';

-- Expected output:
-- background_removal_jobs
-- background_removal_batches
-- background_remover_subscriptions
-- background_remover_subscription_usage
```

### 4. Test API Endpoints

```bash
# After migration deployed:
curl https://dev.lumiku.com/api/background-remover/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK
# Response: { "subscription": null } (for new user)

# Before fix: 500 Internal Server Error
```

---

## Prevention Checklist

For future app development, ALWAYS:

### When Adding New Models to schema.prisma:

1. ✅ Add models to `schema.prisma`
2. ✅ Run `npx prisma migrate dev --name descriptive_name`
3. ✅ Test locally to ensure migration works
4. ✅ Commit migration files: `git add prisma/migrations/`
5. ✅ Verify migration runs in Dockerfile/CI

### Pre-Deployment Checklist:

- [ ] Schema changes have migrations
- [ ] Migrations tested locally
- [ ] Migrations committed to git
- [ ] `npx prisma migrate status` shows "up to date"
- [ ] Test API endpoints locally before deploying

---

## Timeline to Resolution

| Step | Action | Time | Status |
|------|--------|------|--------|
| 1 | Create migration locally | 2 min | Pending |
| 2 | Commit and push | 1 min | Pending |
| 3 | Deploy to production | 3-5 min | Pending |
| 4 | Verify API endpoints | 2 min | Pending |
| **TOTAL** | | **~10 minutes** | |

---

## Related Files

- `backend/prisma/schema.prisma` (lines 1237-1405)
- `backend/src/apps/background-remover/routes.ts`
- `backend/src/apps/background-remover/services/subscription.service.ts`
- `backend/src/apps/background-remover/services/background-remover.service.ts`

---

## Post-Fix Validation

After deploying the fix:

```bash
# 1. Check logs for migration success
# In Coolify:
# "✅ Migrations applied successfully"

# 2. Test all 3 endpoints
curl https://dev.lumiku.com/api/background-remover/subscription -H "Authorization: Bearer TOKEN"
curl https://dev.lumiku.com/api/background-remover/jobs -H "Authorization: Bearer TOKEN"
curl https://dev.lumiku.com/api/background-remover/stats -H "Authorization: Bearer TOKEN"

# All should return 200 OK

# 3. Verify in database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM background_removal_jobs;"
# Should work (returns 0 for empty table)
```

---

## Next Steps (Copy-Paste Ready)

Execute these commands NOW to fix the issue:

```bash
# Step 1: Create migration
cd "C:\Users\yoppi\Downloads\Lumiku App\backend"
npx prisma migrate dev --name add_background_remover_models

# Step 2: Commit
cd ..
git add backend/prisma/migrations/
git commit -m "feat(prisma): Add Background Remover database migration - fixes 500 errors"
git push origin development

# Step 3: Wait for Coolify deployment (auto-runs migrations)
# OR manually run in Coolify terminal:
# npx prisma migrate deploy
```

**CRITICAL**: This blocks ALL Background Remover testing. Fix ASAP.
