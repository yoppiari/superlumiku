# QUICK FIX - Copy/Paste These Commands Into Coolify

**Time to Fix**: 5 minutes
**Where**: Coolify backend service terminal

---

## Step 1: Open Coolify Terminal

1. Go to: https://cf.avolut.com
2. Navigate to: **dev-superlumiku** application
3. Click: **Terminal** tab
4. Wait for terminal to load

---

## Step 2: Test Database Connection

**Copy and paste this:**

```bash
psql $DATABASE_URL -c "SELECT version();"
```

**Expected Result:**
- Should show PostgreSQL version
- If this fails → Database is the problem (see Fix A below)
- If this works → Database is fine, continue to Step 3

### Fix A: Database Connection Failed

**Check DATABASE_URL environment variable:**

```bash
echo $DATABASE_URL
```

**If empty or wrong:**
1. Go to: Coolify → Application → **Environment Variables**
2. Find: `DATABASE_URL`
3. Should be: `postgresql://user:password@host:5432/database?schema=public`
4. Common issue: Using external IP instead of internal Docker hostname
5. Try: `postgresql://user:pass@coolify-postgres:5432/lumiku_db?schema=public`

**Restart PostgreSQL:**
- Go to: Coolify → Services → PostgreSQL
- Click: **Restart**
- Wait 30 seconds
- Re-test connection

---

## Step 3: Fix Migration State

**Copy and paste this:**

```bash
cd /app
bunx prisma migrate resolve --applied 20251014_add_avatar_creator_complete
bunx prisma migrate status
```

**Expected Result:**
- Should show: "No pending migrations"
- If still shows failed → Use Fix B below

### Fix B: Manual Migration Fix

**Copy and paste this:**

```bash
psql $DATABASE_URL <<EOF
UPDATE "_prisma_migrations"
SET finished_at = NOW(),
    success = true,
    rolled_back_at = NULL,
    logs = 'Manually resolved - tables exist'
WHERE migration_name = '20251014_add_avatar_creator_complete';
EOF
```

**Verify:**

```bash
bunx prisma migrate status
```

---

## Step 4: Verify Tables Exist

**Copy and paste this:**

```bash
psql $DATABASE_URL -c "\dt" | grep avatar
psql $DATABASE_URL -c "\dt" | grep pose
```

**Expected Result:**
- Should show multiple tables with names like:
  - `avatar_projects`
  - `avatars`
  - `pose_categories`
  - `pose_library`
  - etc.

**If no tables shown:**

```bash
bunx prisma migrate deploy
```

---

## Step 5: Check AI Models (Why app not showing in dashboard)

**Copy and paste this:**

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"
```

**Expected Result:**
- Should show a number > 0

**If shows 0:**

```bash
cd /app
bun run prisma db seed
```

This will populate AI models and other seed data.

---

## Step 6: Regenerate Prisma Client

**Copy and paste this:**

```bash
cd /app
bunx prisma generate
```

---

## Step 7: Redeploy Application

**In Coolify UI:**

1. Go to: **Deployments** tab
2. Click: **Redeploy** button
3. **IMPORTANT**: Check **"Force Rebuild"** option
4. Click: **Redeploy**
5. Monitor: **Build Logs** for errors

**Watch for these success messages:**
- `✅ Environment variables validated successfully`
- `✅ Database connected successfully`
- `✅ Redis connected successfully` (if Redis configured)
- `✅ WebSocket server initialized for Pose Generator`
- `🚀 Server running on http://localhost:3000`

---

## Step 8: Verify Application Works

**Copy and paste this in your browser:**

```
https://dev.lumiku.com/health
```

**Expected Result:**
- Should return: `{"status":"ok"}`

**Test Dashboard:**
```
https://dev.lumiku.com/dashboard
```

**Test API:**
```
https://dev.lumiku.com/api/apps
```

---

## Common Issues & Quick Fixes

### Issue: "Connection refused" persists

**Fix:**

1. Check PostgreSQL service status:
   ```bash
   docker ps | grep postgres
   ```

2. If not running:
   - Go to Coolify → Services → PostgreSQL → Restart

3. Update DATABASE_URL to use internal hostname:
   - Instead of: `107.155.75.50`
   - Use: `coolify-postgres` or internal Docker service name

### Issue: "Cannot find module" error

**Fix:**

1. Force rebuild without cache:
   - Coolify → Deployments → Redeploy
   - Check: **"Force Rebuild"**
   - Check: **"Clear Build Cache"**

### Issue: "Migration failed" still showing

**Fix:**

```bash
psql $DATABASE_URL -c "DELETE FROM _prisma_migrations WHERE migration_name = '20251014_add_avatar_creator_complete';"
bunx prisma migrate deploy
```

### Issue: App not showing in dashboard after fix

**Fix:**

```bash
# Seed AI models
bun run prisma db seed

# Verify
psql $DATABASE_URL -c "SELECT * FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"
```

---

## Success Checklist

After all fixes, verify:

- [ ] Database connection works: `psql $DATABASE_URL -c "SELECT 1;"`
- [ ] Migration status clean: `bunx prisma migrate status` shows "No pending migrations"
- [ ] Tables exist: `psql $DATABASE_URL -c "\dt"` shows avatar and pose tables
- [ ] AI models exist: Check count > 0
- [ ] Application starts: Logs show success messages
- [ ] Health check works: `https://dev.lumiku.com/health` returns OK
- [ ] Dashboard loads: `https://dev.lumiku.com/dashboard` shows apps
- [ ] Avatar Creator appears in dashboard

---

## If All Else Fails

**Nuclear Option (ONLY if no production data):**

```bash
# WARNING: This deletes ALL data!
bunx prisma migrate reset --force
bun run prisma db seed
```

Then redeploy application.

---

## Timeline

- **Database Fix**: 2 minutes
- **Migration Fix**: 1 minute
- **Rebuild & Deploy**: 3-5 minutes
- **Verification**: 1 minute

**Total**: ~10 minutes

---

## Contact

If issues persist after following this guide:

1. Check full error logs in Coolify
2. Verify all environment variables are set
3. Test database connection manually
4. Check PostgreSQL service is running
5. Review recent code changes

---

**Last Updated**: October 16, 2025
**Status**: Ready for execution
**Priority**: CRITICAL
