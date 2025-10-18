# URGENT: Fix Background Remover 500 Errors

**Issue**: All Background Remover API endpoints return 500 because database tables don't exist.

**Root Cause**: Migration was never created for Background Remover models.

**Time to Fix**: ~10 minutes

---

## COPY-PASTE FIX (3 Steps)

### Step 1: Commit the Migration (Local)

```bash
cd "C:\Users\yoppi\Downloads\Lumiku App"

# Migration already created in:
# backend/prisma/migrations/20251018_add_background_remover_models/migration.sql

# Commit it
git add backend/prisma/migrations/20251018_add_background_remover_models/
git commit -m "feat(prisma): Add Background Remover database migration - fixes 500 errors

- Add background_removal_jobs table
- Add background_removal_batches table
- Add background_remover_subscriptions table
- Add background_remover_subscription_usage table
- Fixes API 500 errors on /subscription, /jobs, /stats endpoints

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin development
```

### Step 2: Deploy Migration (Coolify)

**Option A: Wait for Auto-Deploy** (Recommended)

Coolify will auto-detect the push and deploy. The Dockerfile runs:
```bash
npx prisma migrate deploy
npx prisma generate
```

**Option B: Manual Deploy** (If auto-deploy is disabled)

1. Go to Coolify dashboard
2. Navigate to Lumiku App
3. Click "Redeploy" button
4. Wait for build to complete (~3 minutes)

### Step 3: Verify Fix (Production)

After deployment completes:

```bash
# Test API endpoints
curl https://dev.lumiku.com/api/background-remover/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK
# Response: { "subscription": null }

curl https://dev.lumiku.com/api/background-remover/jobs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK
# Response: { "jobs": [] }

curl https://dev.lumiku.com/api/background-remover/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK
# Response: { "stats": { "totalSingleRemovals": 0, ... } }
```

---

## If Auto-Deploy Doesn't Run Migrations

If Coolify builds but migrations don't run, manually deploy via Coolify terminal:

```bash
# In Coolify container terminal:
cd /app/backend

# Run migrations
npx prisma migrate deploy

# Expected output:
# ✅ Applying migration `20251018_add_background_remover_models`
# ✅ The following migrations have been applied:
#
# migrations/
#   └─ 20251018_add_background_remover_models/
#      └─ migration.sql
#
# ✅ All migrations have been successfully applied.

# Verify tables exist
npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'background_%';"

# Expected output:
# background_removal_jobs
# background_removal_batches
# background_remover_subscriptions
# background_remover_subscription_usage
```

---

## Verification Checklist

After fix is deployed:

- [ ] Git commit pushed successfully
- [ ] Coolify deployment completed (check logs)
- [ ] Migration applied (check for "✅ Applying migration" in logs)
- [ ] All 3 API endpoints return 200 OK
- [ ] Frontend loads without errors
- [ ] Can access Background Remover page at https://dev.lumiku.com/background-remover

---

## Troubleshooting

### If endpoints still return 500:

1. **Check Coolify logs**:
   - Look for "Applying migration" message
   - Look for Prisma errors

2. **Verify Prisma Client regenerated**:
   ```bash
   # In Coolify terminal:
   npx prisma generate

   # Restart application
   pm2 restart all
   ```

3. **Check database directly**:
   ```sql
   -- In Coolify SQL console:
   \dt background_*

   -- Should show 4 tables
   ```

### If migration fails with "already exists":

Tables might have been created manually. Skip to verification step.

### If migration fails with "does not exist":

Check Dockerfile ensures migrations run:
```dockerfile
RUN npx prisma migrate deploy
RUN npx prisma generate
```

---

## What This Migration Does

Creates 4 new tables:

1. **background_removal_jobs** - Tracks single image removals and batch items
2. **background_removal_batches** - Tracks batch processing jobs (up to 500 images)
3. **background_remover_subscriptions** - User subscription plans (Starter/Pro)
4. **background_remover_subscription_usage** - Daily quota tracking per tier

With proper indexes for:
- User queries (userId)
- Status filtering (status)
- Job processing (status + createdAt)
- Batch lookups (batchId + itemIndex)
- Subscription quota checks (userId + date + tier)

---

## Expected Timeline

| Action | Duration |
|--------|----------|
| Commit & push migration | 1 min |
| Coolify auto-deploy trigger | 1 min |
| Docker build + migration | 3-5 min |
| Verification | 2 min |
| **TOTAL** | **~10 min** |

---

## Post-Deployment Test

Open frontend and test full workflow:

1. Go to https://dev.lumiku.com/background-remover
2. Upload an image
3. Select "Basic" tier
4. Click "Remove Background"
5. Should process successfully (no 500 errors)
6. Check "History" tab - should show job
7. Check "Subscription" tab - should show pricing

All steps should work without 500 errors.

---

## Need Help?

If fix doesn't work after 10 minutes:

1. Check Coolify deployment logs
2. Check application logs: `pm2 logs backend`
3. Check database migration status: `npx prisma migrate status`
4. Share error messages for further debugging

**This is a P0 fix - Background Remover is completely blocked until this is resolved.**
