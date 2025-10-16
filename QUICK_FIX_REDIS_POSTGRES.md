# Quick Fix: Redis & PostgreSQL Connection Issues

**Problem**: Deployment fails with `WRONGPASS` and `Connection refused` errors
**Time to Fix**: 5-10 minutes
**Status**: CRITICAL FIX NEEDED

---

## TL;DR - Copy & Paste Solutions

### Most Common Scenario (90% of cases)

**Redis and PostgreSQL are Docker containers on same host with NO passwords**

```bash
# SSH into Coolify server
ssh root@dev.lumiku.com

# Quick test
docker exec $(docker ps --filter "name=redis" --format "{{.Names}}" | head -n 1) redis-cli PING
docker exec $(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1) pg_isready

# If both return success, use these Coolify env vars:
```

**Coolify Environment Variables** (Go to your app → Environment Variables):

```bash
# Redis (NO PASSWORD)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=

# PostgreSQL (get password from container)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@postgres:5432/lumiku-dev
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_PASSWORD
POSTGRES_DB=lumiku-dev
```

**To get PostgreSQL password**:
```bash
ssh root@dev.lumiku.com
docker inspect $(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1) | grep POSTGRES_PASSWORD
```

---

## Step-by-Step Quick Fix

### Step 1: Run Diagnostic Script (2 minutes)

```bash
# SSH into your Coolify server
ssh root@dev.lumiku.com

# Download and run diagnostic
curl -o diagnose.sh https://raw.githubusercontent.com/YOUR_REPO/diagnose-infrastructure.sh
chmod +x diagnose.sh
./diagnose.sh
```

**Or manually copy the script from `diagnose-infrastructure.sh` in this repo.**

### Step 2: Copy Values to Coolify (2 minutes)

The diagnostic script will output sections like:

```
============================================================================
REDIS CONFIGURATION SUMMARY
============================================================================
📋 Copy these values to Coolify Environment Variables:

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=  (leave empty)
```

1. Go to Coolify dashboard
2. Navigate to your Lumiku app
3. Click **Environment Variables**
4. Update/add the variables shown in diagnostic output
5. Click **Save**

### Step 3: Redeploy (3-5 minutes)

1. In Coolify, click **Deploy** button
2. Watch logs for success indicators:
   - `✅ Redis connected`
   - `✅ PostgreSQL is ready`
   - `✅ Nginx started`

---

## Common Scenarios & Quick Fixes

### Scenario A: Redis - No Password (Most Common)

**Symptoms:**
- Redis container exists
- PING works without password
- Deployment shows `WRONGPASS` error

**Root Cause:**
Redis has no password, but app is trying to authenticate with wrong password.

**Fix:**
```bash
# In Coolify Environment Variables:
REDIS_HOST=redis
REDIS_PORT=6379
# Remove REDIS_PASSWORD or set to empty:
REDIS_PASSWORD=
```

**Verify on server:**
```bash
docker exec $(docker ps --filter "name=redis" --format "{{.Names}}" | head -n 1) redis-cli PING
# Should return: PONG
```

---

### Scenario B: Redis - Has Password

**Symptoms:**
- Redis PING fails without password
- `requirepass` is set

**Fix:**
```bash
# Get password from Redis config
ssh root@dev.lumiku.com
docker exec $(docker ps --filter "name=redis" --format "{{.Names}}" | head -n 1) redis-cli CONFIG GET requirepass

# In Coolify Environment Variables:
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=<password_from_above_command>
```

---

### Scenario C: PostgreSQL - Wrong Host

**Symptoms:**
- Connection refused to IP 107.155.75.50
- PostgreSQL container exists on Coolify server

**Root Cause:**
App is trying external IP instead of Docker network name.

**Fix:**
```bash
# In Coolify Environment Variables:
# Use Docker network name instead of IP:
DATABASE_URL=postgresql://postgres:PASSWORD@postgres:5432/lumiku-dev
POSTGRES_HOST=postgres  # NOT 107.155.75.50

# Keep these:
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<get_from_container>
POSTGRES_DB=lumiku-dev
```

**Verify on server:**
```bash
docker exec $(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1) pg_isready
# Should return: accepting connections
```

---

### Scenario D: PostgreSQL - Database Missing

**Symptoms:**
- Connection works but "database lumiku-dev does not exist"

**Fix:**
```bash
# SSH into Coolify server
ssh root@dev.lumiku.com

# Create database
PG_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)
docker exec $PG_CONTAINER psql -U postgres -c "CREATE DATABASE \"lumiku-dev\";"

# Verify
docker exec $PG_CONTAINER psql -U postgres -c "\l" | grep lumiku-dev
```

Then redeploy application.

---

## One-Liner Fixes

### Fix Redis Password Issue
```bash
# If Redis should have NO password:
ssh root@dev.lumiku.com "docker exec \$(docker ps --filter 'name=redis' --format '{{.Names}}' | head -n 1) redis-cli CONFIG SET requirepass ''"
```

### Create Missing Database
```bash
# Create lumiku-dev database:
ssh root@dev.lumiku.com "docker exec \$(docker ps --filter 'name=postgres' --format '{{.Names}}' | head -n 1) psql -U postgres -c 'CREATE DATABASE \"lumiku-dev\";'"
```

### Get PostgreSQL Password
```bash
ssh root@dev.lumiku.com "docker inspect \$(docker ps --filter 'name=postgres' --format '{{.Names}}' | head -n 1) | grep POSTGRES_PASSWORD"
```

---

## Verification Checklist

Before redeploying, verify:

- [ ] Redis container is running: `docker ps | grep redis`
- [ ] Redis PING works: `docker exec REDIS_CONTAINER redis-cli PING`
- [ ] PostgreSQL container is running: `docker ps | grep postgres`
- [ ] PostgreSQL accepts connections: `docker exec PG_CONTAINER pg_isready`
- [ ] Database exists: `docker exec PG_CONTAINER psql -U postgres -c "\l" | grep lumiku-dev`
- [ ] Coolify env vars updated and saved
- [ ] All required env vars present (see minimal list below)

### Minimal Required Env Vars

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:PASSWORD@postgres:5432/lumiku-dev
POSTGRES_HOST=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<actual_password>
POSTGRES_DB=lumiku-dev
JWT_SECRET=<64+ chars>
CORS_ORIGIN=https://dev.lumiku.com
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## Troubleshooting Failed Deployment

### Check Deployment Logs

In Coolify dashboard → Logs, look for:

**Success indicators:**
```
✅ Redis connected
✅ Redis ready
✅ PostgreSQL is ready
✅ Prisma Client generated
✅ Nginx started
🚀 Starting Backend Server...
```

**Failure indicators:**
```
❌ Worker error: WRONGPASS                    → Redis password wrong
❌ connection refused                          → PostgreSQL host/port wrong
❌ database "lumiku-dev" does not exist       → Database not created
❌ password authentication failed             → PostgreSQL password wrong
❌ FATAL: Redis connection failed             → Redis not reachable
```

### Still Failing?

1. **Check env vars saved properly:**
   - Go to Coolify → Your app → Environment Variables
   - Scroll through ALL variables
   - Verify REDIS_HOST, POSTGRES_HOST, DATABASE_URL are correct
   - Click Save again

2. **Restart application:**
   - Coolify dashboard → Click "Restart Application"
   - Or trigger new deployment

3. **Check container logs:**
   ```bash
   ssh root@dev.lumiku.com
   docker logs REDIS_CONTAINER --tail 50
   docker logs POSTGRES_CONTAINER --tail 50
   ```

4. **Verify network connectivity:**
   ```bash
   # Check if containers are on same network
   docker network inspect $(docker network ls --filter "name=coolify" --format "{{.Name}}") | grep -E "redis|postgres"
   ```

---

## Emergency Rollback

If deployment keeps failing and old version needs to be restored:

1. Go to Coolify dashboard
2. Click **Deployments** tab
3. Find last successful deployment (before b6b1563)
4. Click **Redeploy** on that version

This will roll back to working version while you fix env vars.

---

## Get Help

### Generate Diagnostic Report

```bash
# SSH into Coolify server
ssh root@dev.lumiku.com

# Run comprehensive diagnostic
./diagnose-infrastructure.sh > diagnostic-report.txt

# View report
cat diagnostic-report.txt

# Copy report and send for help
```

### Essential Info to Provide

When asking for help, provide:
1. Diagnostic script output
2. Deployment logs from Coolify (last 100 lines)
3. Output of: `docker ps`
4. Output of: `docker network ls`

---

## Success Indicators

After fix is applied and deployment succeeds:

✅ Deployment completes without rollback
✅ Healthcheck passes (no "rolling back" message)
✅ Website accessible at https://dev.lumiku.com
✅ Login works
✅ Dashboard shows apps
✅ No Redis/PostgreSQL errors in logs

---

## Next Steps After Successful Deployment

1. **Monitor logs** for 10 minutes to ensure stability
2. **Test all features**: login, dashboard, app creation
3. **Run database seeds** if apps don't show in dashboard
4. **Set up monitoring** to catch future issues
5. **Document** the correct env vars for your setup

---

**Last Updated**: 2025-10-14
**Status**: Ready to use

For detailed explanations, see: `INFRASTRUCTURE_FIX_GUIDE.md`
