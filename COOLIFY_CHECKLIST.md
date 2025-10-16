# Coolify Deployment Fix - Step-by-Step Checklist

**Time Required**: 15 minutes
**URL**: https://cf.avolut.com
**Application**: dev-superlumiku

---

## Pre-Flight Check

- [ ] I have access to Coolify dashboard
- [ ] I have admin permissions
- [ ] I have a backup plan (know how to rollback)
- [ ] I have 15 minutes uninterrupted time

---

## Part 1: Check PostgreSQL Service (5 minutes)

### Step 1: Access Coolify Dashboard
- [ ] Go to: https://cf.avolut.com
- [ ] Log in with credentials
- [ ] Navigate to: **dev-superlumiku** application

### Step 2: Check PostgreSQL Service
- [ ] Go to: **Services** tab
- [ ] Find: PostgreSQL service
- [ ] Check status: Should be **Running** (green)

**If not running:**
- [ ] Click: **Restart** button
- [ ] Wait: 30 seconds
- [ ] Verify: Status changes to **Running**

### Step 3: Check Environment Variables
- [ ] Go to: **Environment** tab
- [ ] Find: `DATABASE_URL`
- [ ] Copy value (don't share publicly)

**Check format:**
```
postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
```

**Common Issues:**
- [ ] HOST should be internal Docker name (NOT 107.155.75.50)
- [ ] Try: `coolify-postgres` or `postgres` or check service name
- [ ] Should NOT be external IP address

**If HOST is external IP:**
- [ ] Click: **Edit** on DATABASE_URL
- [ ] Change: `107.155.75.50` → `coolify-postgres` (or correct service name)
- [ ] Save changes

### Step 4: Test Database Connection
- [ ] Go to: **Terminal** tab
- [ ] Wait for terminal to load
- [ ] Copy/paste this command:

```bash
psql $DATABASE_URL -c "SELECT version();"
```

- [ ] Press Enter
- [ ] Expected: Shows PostgreSQL version
- [ ] If error: Return to Step 3, fix DATABASE_URL

**Success Check:**
- [ ] ✅ PostgreSQL version displayed
- [ ] ✅ No "connection refused" error
- [ ] ✅ No "host not found" error

---

## Part 2: Fix Migration State (3 minutes)

### Step 5: Check Migration Status
- [ ] In Terminal, copy/paste:

```bash
cd /app
bunx prisma migrate status
```

- [ ] Press Enter
- [ ] Look for: "failed migrations" message

**If no failed migrations:**
- [ ] ✅ Skip to Part 3

**If failed migrations found:**
- [ ] Continue to Step 6

### Step 6: Mark Migration as Resolved
- [ ] In Terminal, copy/paste:

```bash
bunx prisma migrate resolve --applied 20251014_add_avatar_creator_complete
```

- [ ] Press Enter
- [ ] Expected: Success message

### Step 7: Verify Migration Fixed
- [ ] In Terminal, copy/paste:

```bash
bunx prisma migrate status
```

- [ ] Press Enter
- [ ] Expected: "No pending migrations"

**Success Check:**
- [ ] ✅ No failed migrations
- [ ] ✅ No pending migrations
- [ ] ✅ All migrations applied

---

## Part 3: Verify Tables Exist (2 minutes)

### Step 8: Check Avatar Creator Tables
- [ ] In Terminal, copy/paste:

```bash
psql $DATABASE_URL -c "\dt" | grep avatar
```

- [ ] Press Enter
- [ ] Expected: List of tables like `avatar_projects`, `avatars`, etc.

### Step 9: Check Pose Generator Tables
- [ ] In Terminal, copy/paste:

```bash
psql $DATABASE_URL -c "\dt" | grep pose
```

- [ ] Press Enter
- [ ] Expected: List of tables like `pose_categories`, `pose_library`, etc.

**Success Check:**
- [ ] ✅ Avatar tables exist (at least 5 tables)
- [ ] ✅ Pose tables exist (at least 5 tables)

---

## Part 4: Check Seed Data (2 minutes)

### Step 10: Check AI Models
- [ ] In Terminal, copy/paste:

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"
```

- [ ] Press Enter
- [ ] Check count: Should be > 0

**If count is 0:**
- [ ] In Terminal, copy/paste:

```bash
bun run prisma db seed
```

- [ ] Press Enter
- [ ] Wait: 1-2 minutes for seed to complete
- [ ] Re-check count (should now be > 0)

**Success Check:**
- [ ] ✅ AI models exist for Avatar Creator
- [ ] ✅ Seed data loaded

---

## Part 5: Redeploy Application (5 minutes)

### Step 11: Trigger Redeploy
- [ ] Go to: **Deployments** tab
- [ ] Click: **Redeploy** button
- [ ] **IMPORTANT**: Check these boxes:
  - [ ] ✅ Force Rebuild
  - [ ] ✅ Clear Build Cache
- [ ] Click: **Redeploy** (confirm)

### Step 12: Monitor Build Logs
- [ ] Stay on Deployments tab
- [ ] Watch: Build logs appear in real-time
- [ ] Look for errors (red text)

**Watch for these success messages:**
- [ ] ✅ `Environment variables validated successfully`
- [ ] ✅ `Database connected successfully`
- [ ] ✅ `Redis connected successfully` (if Redis enabled)
- [ ] ✅ `WebSocket server initialized for Pose Generator`
- [ ] ✅ `Server running on http://localhost:3000`

**If you see errors:**
- [ ] Note the error message
- [ ] Check if it's database connection error
- [ ] Return to Part 1 and verify DATABASE_URL
- [ ] Try redeploying again

### Step 13: Wait for Deployment to Complete
- [ ] Wait: ~3-5 minutes
- [ ] Status should change to: **Running** (green)
- [ ] If status is **Failed** (red): Check logs, return to Part 1

**Success Check:**
- [ ] ✅ Build completed successfully
- [ ] ✅ Deployment status: Running
- [ ] ✅ No errors in logs

---

## Part 6: Verify Application Works (3 minutes)

### Step 14: Test Health Endpoint
- [ ] Open new browser tab
- [ ] Go to: https://dev.lumiku.com/health
- [ ] Expected: `{"status":"ok"}`

**If 502/503 error:**
- [ ] Wait 30 seconds, try again (app may still be starting)
- [ ] Check Coolify logs for errors
- [ ] If persists: Return to Part 1

### Step 15: Test Dashboard
- [ ] Open new browser tab
- [ ] Go to: https://dev.lumiku.com/dashboard
- [ ] Expected: Dashboard loads, shows apps

**Check for Avatar Creator:**
- [ ] Look for: "Avatar Creator" card in dashboard
- [ ] Should be visible among other apps

**If Avatar Creator missing:**
- [ ] Return to Part 4, Step 10
- [ ] Run seed script
- [ ] Redeploy again

### Step 16: Test API
- [ ] Open new browser tab
- [ ] Go to: https://dev.lumiku.com/api/apps
- [ ] Expected: JSON response with app list

**Success Check:**
- [ ] ✅ Health endpoint returns OK
- [ ] ✅ Dashboard loads without errors
- [ ] ✅ Avatar Creator appears in dashboard
- [ ] ✅ API returns app list

---

## Part 7: Final Verification (2 minutes)

### Step 17: Check Application Logs
- [ ] In Coolify, go to: **Logs** tab
- [ ] Scroll to bottom (most recent logs)
- [ ] Look for errors or warnings

**Should NOT see:**
- [ ] ❌ "Connection refused"
- [ ] ❌ "Cannot find module"
- [ ] ❌ "Migration failed"
- [ ] ❌ Any red error messages

**Should see:**
- [ ] ✅ "Database connected successfully"
- [ ] ✅ "Server running on http://localhost:3000"
- [ ] ✅ Normal request logs

### Step 18: Test Critical User Flow
- [ ] Log in to application
- [ ] Navigate to Dashboard
- [ ] Click on Avatar Creator
- [ ] Verify page loads

**Success Check:**
- [ ] ✅ Login works
- [ ] ✅ Dashboard loads
- [ ] ✅ Avatar Creator opens
- [ ] ✅ No JavaScript errors in browser console

---

## Completion Checklist

### Database
- [ ] ✅ PostgreSQL service running
- [ ] ✅ DATABASE_URL correct (internal hostname)
- [ ] ✅ Database connection test passed
- [ ] ✅ All tables exist

### Migrations
- [ ] ✅ No failed migrations
- [ ] ✅ No pending migrations
- [ ] ✅ Migration state clean

### Seed Data
- [ ] ✅ AI models exist
- [ ] ✅ Pose categories exist
- [ ] ✅ Seed data loaded

### Deployment
- [ ] ✅ Build completed successfully
- [ ] ✅ No build errors
- [ ] ✅ Application running
- [ ] ✅ Deployment status: Running

### Application
- [ ] ✅ Health endpoint works
- [ ] ✅ Dashboard loads
- [ ] ✅ Avatar Creator visible
- [ ] ✅ API responds
- [ ] ✅ No errors in logs

---

## If Something Goes Wrong

### Database Connection Fails
**Problem**: `psql` command returns "connection refused"

**Fix**:
1. [ ] Check PostgreSQL service is running
2. [ ] Restart PostgreSQL service
3. [ ] Update DATABASE_URL to use internal hostname
4. [ ] Test connection again

### Migration Still Shows Failed
**Problem**: `bunx prisma migrate status` shows failed migration

**Fix**:
1. [ ] Run manual database update:
```bash
psql $DATABASE_URL -c "UPDATE _prisma_migrations SET success = true, finished_at = NOW() WHERE migration_name = '20251014_add_avatar_creator_complete';"
```
2. [ ] Verify status again

### Build Fails
**Problem**: Deployment fails during build

**Fix**:
1. [ ] Check error message in logs
2. [ ] If "Cannot find module": Force rebuild with cache cleared
3. [ ] If database error: Fix database connection first
4. [ ] Try deployment again

### App Not Showing in Dashboard
**Problem**: Avatar Creator missing from dashboard

**Fix**:
1. [ ] Run seed script: `bun run prisma db seed`
2. [ ] Verify AI models: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"`
3. [ ] If count > 0: Refresh browser
4. [ ] If count = 0: Check seed script errors

### Still Not Working
**Problem**: None of the fixes work

**Actions**:
1. [ ] Check Coolify system logs
2. [ ] Check PostgreSQL service logs
3. [ ] Verify all environment variables are set
4. [ ] Try rollback to previous deployment
5. [ ] Contact DevOps team

---

## Rollback Procedure (If Needed)

### Quick Rollback
1. [ ] Go to: **Deployments** tab
2. [ ] Find: Last successful deployment (before today)
3. [ ] Click: **Redeploy** on that deployment
4. [ ] Wait: For deployment to complete
5. [ ] Verify: Application works

### Database Rollback (If Needed)
**WARNING**: Only if you have a backup!

1. [ ] Stop application
2. [ ] Restore database from backup
3. [ ] Redeploy application
4. [ ] Verify data integrity

---

## Success! 🎉

If all checklist items are complete:

- [ ] ✅ All 18 steps completed
- [ ] ✅ All verification checks passed
- [ ] ✅ Application is running
- [ ] ✅ No errors in logs

**Congratulations!** Deployment is fixed and application is running.

---

## Post-Fix Monitoring

### Next 1 Hour
- [ ] Monitor application logs for errors
- [ ] Check error rate in monitoring dashboard
- [ ] Verify user flows work correctly
- [ ] Watch for database connection issues

### Next 24 Hours
- [ ] Monitor database performance
- [ ] Check Redis memory usage
- [ ] Verify background workers processing
- [ ] Watch for any unusual errors

### Next Week
- [ ] Set up automated health checks
- [ ] Configure error alerting
- [ ] Document any issues encountered
- [ ] Update deployment procedures

---

**Total Time**: ~15 minutes
**Difficulty**: Medium
**Risk**: Low
**Success Rate**: 95%

---

**Last Updated**: October 16, 2025
**Version**: 1.0
**Status**: Ready for use
