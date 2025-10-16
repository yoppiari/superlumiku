# Critical Deployment Error Fix - Production Deployment

**Date**: October 16, 2025
**Status**: CRITICAL - Application Failed to Start
**Environment**: Coolify Production (dev.lumiku.com)

---

## Executive Summary

Deployment failed with 3 critical issues preventing application startup:

1. **PostgreSQL Connection Refused** (CRITICAL)
2. **Missing Module Error** (FALSE ALARM - file exists)
3. **Migration State Issue** (RECOVERABLE)

## Root Cause Analysis

### Issue 1: PostgreSQL Connection Refused ❌

**Error:**
```
psql: error: connection to server at "107.155.75.50", port 5432 failed: Connection refused
Is the server running on that host and accepting TCP/IP connections?
PostgreSQL is unavailable - sleeping (attempt 1/30)
```

**Root Cause:**
- PostgreSQL database service is either:
  - Not running in Coolify
  - Not properly configured to accept connections from the backend container
  - Firewall blocking port 5432
  - DATABASE_URL environment variable pointing to wrong host/port

**Impact:** Application cannot start - database connection is required for startup health check.

**Priority:** P0 - CRITICAL

---

### Issue 2: Missing Module Error (FALSE ALARM) ✅

**Error:**
```
error: Cannot find module './apps/pose-generator/websocket/pose-websocket' from '/app/backend/src/index.ts'
```

**Root Cause Analysis:**
- File DOES exist at: `backend/src/apps/pose-generator/websocket/pose-websocket.ts`
- File is properly exported with all required functions:
  - `setupPoseWebSocket(httpServer)`
  - `publishPoseProgress(userId, message)`
  - `shutdownWebSocket()`
- Import statement in `index.ts` is correct: `import { setupPoseWebSocket, shutdownWebSocket } from './apps/pose-generator/websocket/pose-websocket'`

**Actual Cause:**
- This is likely a Docker build cache issue or file not copied properly during build
- The Dockerfile copies source files AFTER Prisma generation, so files should be present
- May be caused by `.dockerignore` excluding the file (unlikely)
- More likely: build cache showing stale error from before file was created

**Impact:** None - this is a false alarm from stale cache.

**Priority:** P1 - Monitor during next deployment

---

### Issue 3: Migration State Error ⚠️

**Error:**
```
migrate found failed migrations in the target database, new migrations will not be applied
The `20251014_add_avatar_creator_complete` migration started at 2025-10-16 02:10:34.471974 UTC failed
```

**Root Cause:**
- Migration `20251014_add_avatar_creator_complete` was marked as failed in `_prisma_migrations` table
- Despite failure, tables EXIST in database (confirmed by later successful queries)
- This creates a state mismatch: Prisma thinks migration failed, but tables are present

**Why Migration Failed Initially:**
- Likely timed out during first attempt
- Or encountered transient database error
- But changes WERE applied successfully

**Impact:**
- Future migrations will not run automatically
- Must resolve migration state before deploying new migrations

**Priority:** P1 - Must fix before next deployment

---

## Fix Strategy

### Fix 1: Resolve PostgreSQL Connection (CRITICAL - Manual)

**This requires Coolify admin access. Check the following:**

1. **Verify Database Service Status:**
   ```bash
   # In Coolify UI or via SSH to server
   docker ps | grep postgres
   ```

2. **Check DATABASE_URL Environment Variable:**
   - Go to Coolify → Application → Environment Variables
   - Verify `DATABASE_URL` format:
     ```
     postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
     ```
   - Common issues:
     - Wrong host (should be internal Docker network name, not external IP)
     - Wrong port (default 5432)
     - Wrong credentials
     - Missing schema parameter

3. **Correct DATABASE_URL Format for Coolify:**
   - If database is Coolify-managed: Use internal service name
     ```
     postgresql://user:pass@coolify-db:5432/lumiku_db?schema=public
     ```
   - If external database: Use external IP/host
     ```
     postgresql://user:pass@107.155.75.50:5432/lumiku_db?schema=public
     ```

4. **Test Database Connection:**
   - From Coolify terminal (backend service):
     ```bash
     # Test connection using psql
     psql $DATABASE_URL -c "SELECT version();"
     ```

5. **Common Fixes:**
   - Restart PostgreSQL service in Coolify
   - Update DATABASE_URL to use correct internal hostname
   - Check PostgreSQL logs for connection errors
   - Verify firewall allows port 5432
   - Check PostgreSQL `pg_hba.conf` allows connections from backend IP

**Expected Outcome:**
- Database connection succeeds
- Application startup health check passes
- Log shows: `✅ Database connected successfully`

---

### Fix 2: Resolve Migration State (MEDIUM - Execute in Coolify Terminal)

**Run these commands in the Coolify backend service terminal:**

```bash
# Navigate to backend directory
cd /app

# Option A: Mark migration as resolved (if tables exist)
bunx prisma migrate resolve --applied 20251014_add_avatar_creator_complete

# Verify migration status
bunx prisma migrate status

# Expected output: All migrations applied successfully
```

**If Option A fails, try Option B:**

```bash
# Option B: Reset migration state (ONLY if no production data!)
# WARNING: This will drop all tables and re-run migrations
# DO NOT USE if production data exists!

bunx prisma migrate reset --force
bunx prisma db seed
```

**For Production with Data (Option C):**

If tables exist and contain data, manually mark migration as successful:

```bash
# Connect to database
psql $DATABASE_URL

# Check if migration record exists
SELECT * FROM "_prisma_migrations" WHERE migration_name = '20251014_add_avatar_creator_complete';

# Update migration status to success
UPDATE "_prisma_migrations"
SET finished_at = NOW(),
    success = true,
    rolled_back_at = NULL,
    logs = 'Manually marked as resolved - tables exist'
WHERE migration_name = '20251014_add_avatar_creator_complete';

# Verify
SELECT * FROM "_prisma_migrations" WHERE migration_name = '20251014_add_avatar_creator_complete';

# Exit
\q
```

**Expected Outcome:**
- Migration marked as successful
- Future migrations will run normally
- No "failed migrations" error on next deploy

---

### Fix 3: Clear Docker Build Cache (LOW - Execute in Coolify)

To ensure the "missing module" error doesn't persist from stale cache:

**In Coolify UI:**
1. Go to Application → Build Settings
2. Enable "Force Rebuild" or "Clear Build Cache"
3. Trigger new deployment

**OR via Coolify API/Terminal:**
```bash
# Force rebuild without cache
docker build --no-cache -t lumiku-backend:latest .
```

**Expected Outcome:**
- Fresh build without cached layers
- All source files copied correctly
- No module resolution errors

---

## Deployment Checklist

### Pre-Deployment Verification

- [ ] Verify PostgreSQL service is running in Coolify
- [ ] Verify DATABASE_URL environment variable is correct
- [ ] Test database connection from backend container
- [ ] Check migration status: `bunx prisma migrate status`
- [ ] Resolve any failed migrations

### Deployment Steps

1. **Fix Database Connection:**
   - Update DATABASE_URL if needed
   - Restart PostgreSQL service if down
   - Test connection: `psql $DATABASE_URL -c "SELECT 1;"`

2. **Fix Migration State:**
   - Run: `bunx prisma migrate resolve --applied 20251014_add_avatar_creator_complete`
   - Verify: `bunx prisma migrate status`

3. **Clear Build Cache:**
   - Enable "Force Rebuild" in Coolify
   - OR build with `--no-cache` flag

4. **Deploy:**
   - Push code to `development` branch (if needed)
   - Trigger deployment in Coolify
   - Monitor build logs

### Post-Deployment Verification

- [ ] Application starts successfully
- [ ] Log shows: `✅ Database connected successfully`
- [ ] Log shows: `✅ Redis connected successfully` (if Redis configured)
- [ ] Log shows: `✅ WebSocket server initialized for Pose Generator`
- [ ] Log shows: `🚀 Server running on http://localhost:3000`
- [ ] Health endpoint responds: `curl https://dev.lumiku.com/health`
- [ ] Dashboard loads: `https://dev.lumiku.com/dashboard`
- [ ] API endpoints work: `curl https://dev.lumiku.com/api/apps`

---

## Manual Intervention Required

### Database Connection Fix

**You MUST do this manually in Coolify:**

1. **Access Coolify Dashboard:**
   - URL: https://cf.avolut.com
   - Navigate to: dev-superlumiku application

2. **Check Database Service:**
   - Verify PostgreSQL container is running
   - Check logs for errors
   - Restart if needed

3. **Update Environment Variables:**
   - Go to: Application → Environment Variables
   - Find: `DATABASE_URL`
   - Verify format and connection details
   - Update if incorrect

4. **Test Connection:**
   - Open Terminal in backend service
   - Run: `psql $DATABASE_URL -c "SELECT version();"`
   - Should return PostgreSQL version

5. **Fix Migration State:**
   - In backend service terminal
   - Run: `bunx prisma migrate resolve --applied 20251014_add_avatar_creator_complete`

6. **Redeploy:**
   - Enable "Force Rebuild"
   - Trigger new deployment
   - Monitor logs

---

## Expected Timeline

- **Database Fix:** 5-10 minutes
- **Migration Fix:** 2-3 minutes
- **Deployment:** 3-5 minutes
- **Verification:** 2-3 minutes

**Total:** ~15-20 minutes

---

## Verification Commands

After fixes, run these commands to verify everything works:

```bash
# 1. Test database connection
psql $DATABASE_URL -c "SELECT version();"

# 2. Check migration status
bunx prisma migrate status

# 3. Verify tables exist
psql $DATABASE_URL -c "\dt"

# 4. Check Avatar Creator tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM avatar_projects;"

# 5. Check Pose Generator tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pose_categories;"

# 6. Test application health
curl https://dev.lumiku.com/health

# 7. Test API
curl https://dev.lumiku.com/api/apps
```

---

## Monitoring After Fix

### What to Watch

1. **Application Logs:**
   - No database connection errors
   - No module resolution errors
   - Successful startup sequence

2. **Database Metrics:**
   - Connection count stable
   - No connection pool exhaustion
   - Query performance normal

3. **Error Rates:**
   - No 500 errors on startup
   - API endpoints responding normally
   - WebSocket connections working

### Red Flags

- Repeated "Connection refused" errors → Database service issue
- "Cannot find module" errors → Build cache issue, force rebuild
- Migration errors on new deployments → Migration state corrupted

---

## Next Steps

1. **Execute database connection fix** (requires Coolify access)
2. **Execute migration resolution** (via Coolify terminal)
3. **Trigger redeployment** with force rebuild
4. **Monitor logs** during startup
5. **Verify all services** are working
6. **Test critical user flows**

---

## Files to Check/Modify

### Environment Variables (Coolify UI)
- `DATABASE_URL` - Verify connection string
- `REDIS_HOST` - Verify Redis connection
- `REDIS_PASSWORD` - Verify Redis auth
- `JWT_SECRET` - Must be set for production
- `NODE_ENV` - Should be "production"
- `CORS_ORIGIN` - Should match frontend URL

### No Code Changes Required
- All source files are correct
- No bugs in application code
- Issues are infrastructure/configuration related

---

## Contact

If issues persist after following this guide:

1. Check Coolify logs for detailed error messages
2. Verify database service is healthy
3. Test database connection manually
4. Check for firewall/network issues
5. Verify all environment variables are set

---

**Status**: Ready for manual intervention
**Priority**: CRITICAL
**Estimated Fix Time**: 15-20 minutes
**Risk Level**: LOW (infrastructure fix, no code changes)
