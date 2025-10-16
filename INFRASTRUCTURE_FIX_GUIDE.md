# Infrastructure Fix Guide - dev.lumiku.com Deployment

**Status**: CRITICAL - Deployment failed due to Redis and PostgreSQL connection issues
**Date**: 2025-10-14
**Deployment Commit**: b6b1563

---

## Critical Issues Summary

### Issue #1: Redis Authentication Failure ❌
```
WRONGPASS invalid username-password pair or user is disabled.
command: {
  name: "auth",
  args: [ "default", "43bgTxX07rGOxcDeD2Z67qc57qSAH39KEUJXCHap7W613KVNZPnLaOBdBG2Z0YqB" ]
}
```

### Issue #2: PostgreSQL Connection Refused ❌
```
psql: error: connection to server at "107.155.75.50", port 5432 failed: Connection refused
Is the server running on that host and accepting TCP/IP connections?
```

---

## STEP 1: Verify Redis Setup

### 1.1 Check Redis Server Configuration

**SSH into your Coolify server** and run these commands:

```bash
# SSH into Coolify server
ssh root@dev.lumiku.com

# Check if Redis container is running
docker ps | grep redis

# Get Redis container name/ID
REDIS_CONTAINER=$(docker ps --filter "name=redis" --format "{{.Names}}" | head -n 1)
echo "Redis container: $REDIS_CONTAINER"

# Check if Redis has a password configured
docker exec $REDIS_CONTAINER redis-cli CONFIG GET requirepass
```

**Expected outputs:**
- If Redis has no password: `1) "requirepass" 2) ""`
- If Redis has a password: `1) "requirepass" 2) "your-password-here"`

### 1.2 Test Redis Connection

```bash
# Test WITHOUT password (if requirepass is empty)
docker exec $REDIS_CONTAINER redis-cli PING

# Test WITH password (if requirepass is set)
docker exec $REDIS_CONTAINER redis-cli -a "YOUR_PASSWORD_HERE" PING

# Check Redis authentication mode
docker exec $REDIS_CONTAINER redis-cli ACL LIST
```

### 1.3 Determine Correct Redis Configuration

**Scenario A: Redis has NO password** (most common for internal Docker network)
```bash
# In Coolify Environment Variables, set:
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=

# Or completely remove REDIS_PASSWORD variable
```

**Scenario B: Redis has a password**
```bash
# Get the actual Redis password
docker exec $REDIS_CONTAINER redis-cli CONFIG GET requirepass

# In Coolify Environment Variables, set:
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=<actual_password_from_above_command>
```

---

## STEP 2: Verify PostgreSQL Setup

### 2.1 Check PostgreSQL Server

**On Coolify server**, check if PostgreSQL is running:

```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Get PostgreSQL container name
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)
echo "PostgreSQL container: $POSTGRES_CONTAINER"

# Check PostgreSQL is listening
docker exec $POSTGRES_CONTAINER pg_isready

# Check PostgreSQL configuration
docker exec $POSTGRES_CONTAINER psql -U postgres -c "SHOW listen_addresses;"
```

### 2.2 Test PostgreSQL Connection

```bash
# Test connection from Coolify host
docker exec $POSTGRES_CONTAINER psql -U postgres -d lumiku-dev -c "SELECT version();"

# Check if database exists
docker exec $POSTGRES_CONTAINER psql -U postgres -c "\l" | grep lumiku-dev

# Check PostgreSQL authentication
docker inspect $POSTGRES_CONTAINER | grep -A 10 "Env"
```

### 2.3 Get Correct PostgreSQL Connection Details

**Option A: PostgreSQL is a Docker container on same host** (recommended)
```bash
# Use Docker network name instead of IP
# In Coolify Environment Variables:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@postgres:5432/lumiku-dev
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_PASSWORD
POSTGRES_DB=lumiku-dev
```

**Option B: PostgreSQL is external server**
```bash
# Verify the external IP is correct
ping 107.155.75.50

# Test connection from Coolify server
telnet 107.155.75.50 5432

# Or use nc (netcat)
nc -zv 107.155.75.50 5432

# If connection fails, PostgreSQL might be on different IP/port
# Check with your hosting provider
```

---

## STEP 3: Update Coolify Environment Variables

### 3.1 Access Coolify Dashboard

1. Go to Coolify dashboard: https://dev.lumiku.com:8000 (or your Coolify port)
2. Navigate to your Lumiku application
3. Go to **Environment Variables** section

### 3.2 Update Redis Variables

**If Redis has NO password** (most common):
```bash
REDIS_HOST=redis
REDIS_PORT=6379
# Remove or leave empty:
REDIS_USERNAME=
REDIS_PASSWORD=
```

**If Redis has a password**:
```bash
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=<actual_password>
```

### 3.3 Update PostgreSQL Variables

**For internal PostgreSQL container**:
```bash
DATABASE_URL=postgresql://postgres:YOUR_PG_PASSWORD@postgres:5432/lumiku-dev
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_PG_PASSWORD
POSTGRES_DB=lumiku-dev
```

**For external PostgreSQL server**:
```bash
DATABASE_URL=postgresql://postgres:YOUR_PG_PASSWORD@CORRECT_IP:5432/lumiku-dev
POSTGRES_HOST=CORRECT_IP
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_PG_PASSWORD
POSTGRES_DB=lumiku-dev
```

### 3.4 Other Required Variables

Make sure these are also set correctly:
```bash
# Application
NODE_ENV=production
PORT=3001

# JWT (generate new if needed)
JWT_SECRET=<64+ character random string>
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://dev.lumiku.com

# File Storage
UPLOAD_PATH=/app/backend/uploads
OUTPUT_PATH=/app/backend/outputs
MAX_FILE_SIZE=524288000

# Duitku Payment (use your actual credentials)
DUITKU_MERCHANT_CODE=your-merchant-code
DUITKU_API_KEY=your-api-key
DUITKU_CALLBACK_URL=https://dev.lumiku.com/api/payments/callback
DUITKU_RETURN_URL=https://dev.lumiku.com/payments/status
DUITKU_BASE_URL=https://passport.duitku.com
DUITKU_ENV=sandbox
```

---

## STEP 4: Test Connections Before Deployment

### 4.1 Create Test Script

**On Coolify server**, create a test script:

```bash
cat > test-connections.sh << 'EOF'
#!/bin/bash

echo "================================================"
echo "Testing Infrastructure Connections"
echo "================================================"

# Get container names
REDIS_CONTAINER=$(docker ps --filter "name=redis" --format "{{.Names}}" | head -n 1)
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)

echo ""
echo "1. Testing Redis..."
if [ -z "$REDIS_CONTAINER" ]; then
    echo "❌ Redis container not found!"
else
    echo "✅ Redis container: $REDIS_CONTAINER"

    # Test ping without password
    if docker exec $REDIS_CONTAINER redis-cli PING 2>&1 | grep -q "PONG"; then
        echo "✅ Redis connection successful (NO PASSWORD)"
        echo "   => Set REDIS_PASSWORD to empty in Coolify"
    else
        echo "⚠️  Redis requires password"
        echo "   Run: docker exec $REDIS_CONTAINER redis-cli CONFIG GET requirepass"
    fi
fi

echo ""
echo "2. Testing PostgreSQL..."
if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ PostgreSQL container not found!"
else
    echo "✅ PostgreSQL container: $POSTGRES_CONTAINER"

    # Test connection
    if docker exec $POSTGRES_CONTAINER pg_isready 2>&1 | grep -q "accepting connections"; then
        echo "✅ PostgreSQL is accepting connections"

        # Get environment variables
        echo "   PostgreSQL configuration:"
        docker inspect $POSTGRES_CONTAINER | grep -E "POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB" | head -n 3

    else
        echo "❌ PostgreSQL is not ready"
    fi
fi

echo ""
echo "================================================"
echo "Copy the correct values to Coolify Environment Variables"
echo "================================================"
EOF

chmod +x test-connections.sh
./test-connections.sh
```

### 4.2 Run Test Script

```bash
# SSH into Coolify server
ssh root@dev.lumiku.com

# Run test script
./test-connections.sh
```

**Save the output** - you'll use these values in Coolify environment variables.

---

## STEP 5: Quick Fix Commands

### If Redis Needs Password Reset

```bash
# SSH into Coolify server
REDIS_CONTAINER=$(docker ps --filter "name=redis" --format "{{.Names}}" | head -n 1)

# Option A: Remove password (for internal network)
docker exec $REDIS_CONTAINER redis-cli CONFIG SET requirepass ""

# Option B: Set specific password
docker exec $REDIS_CONTAINER redis-cli CONFIG SET requirepass "your-new-password"

# Make permanent (edit redis.conf in container or restart with correct config)
```

### If PostgreSQL Connection Issues

```bash
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)

# Check PostgreSQL logs
docker logs $POSTGRES_CONTAINER --tail 50

# Check if database exists
docker exec $POSTGRES_CONTAINER psql -U postgres -c "\l"

# Create database if missing
docker exec $POSTGRES_CONTAINER psql -U postgres -c "CREATE DATABASE \"lumiku-dev\";"

# Check PostgreSQL is listening on all interfaces
docker exec $POSTGRES_CONTAINER psql -U postgres -c "SHOW listen_addresses;"
```

---

## STEP 6: Redeploy Application

### 6.1 Verify Environment Variables

In Coolify dashboard:
1. Go to your Lumiku application
2. Click **Environment Variables**
3. Verify ALL required variables are set correctly
4. Click **Save**

### 6.2 Trigger Deployment

In Coolify dashboard:
1. Go to **Deployments** tab
2. Click **Deploy** button
3. Monitor deployment logs in real-time

### 6.3 Watch for Success Indicators

Monitor logs for these messages:

**Redis Connection Success:**
```
✅ Redis connected
✅ Redis ready
🔧 Carousel Mix Worker ready and listening for jobs
🔧 Looping Flow Worker ready and listening for jobs
```

**PostgreSQL Connection Success:**
```
✅ PostgreSQL is ready
🔧 Step 1: Generating Prisma Client...
✅ Prisma Client generated
✅ Prisma migrate deploy successful
```

**Application Startup Success:**
```
✅ Nginx started
🚀 Starting Backend Server...
✅ Server is ready at http://0.0.0.0:3001
```

---

## STEP 7: Post-Deployment Verification

### 7.1 Check Healthcheck

```bash
# From any machine
curl https://dev.lumiku.com/health

# Expected response:
# {"status":"ok"}
```

### 7.2 Check Application Logs

In Coolify dashboard:
1. Go to **Logs** tab
2. Verify no Redis/PostgreSQL errors
3. Check workers are running

### 7.3 Test Application

1. Visit https://dev.lumiku.com
2. Try to login
3. Check dashboard loads
4. Verify apps are visible

---

## Common Issues & Solutions

### Issue: Redis still showing WRONGPASS

**Cause**: Coolify environment variables not updated or app not restarted

**Solution**:
```bash
# In Coolify, after updating env vars:
1. Click "Restart Application" button
2. Or trigger new deployment
3. Verify env vars are saved (check again after restart)
```

### Issue: PostgreSQL connection still refused

**Cause**: Wrong host/IP, firewall, or PostgreSQL not listening on network

**Solution**:
```bash
# Check if PostgreSQL is on same Docker network
docker network ls
docker network inspect <network_name> | grep -A 20 postgres

# If PostgreSQL is external, check firewall
# Contact hosting provider to:
# 1. Verify PostgreSQL server IP
# 2. Open port 5432 in firewall
# 3. Configure PostgreSQL to accept remote connections
```

### Issue: Healthcheck still failing after fixes

**Cause**: Application crash due to other issues

**Solution**:
```bash
# Check application logs in Coolify
# Look for errors after Redis/PostgreSQL connection success
# Common issues:
# - Missing environment variables (JWT_SECRET, etc.)
# - Database migration failures
# - Port conflicts
```

---

## Quick Reference: Minimal Required Env Vars

```bash
# Essential for deployment to work
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=lumiku-dev
JWT_SECRET=<64+ chars>
CORS_ORIGIN=https://dev.lumiku.com
REDIS_HOST=redis
REDIS_PORT=6379
# REDIS_PASSWORD= (leave empty if Redis has no password)
```

---

## Need Help?

### Get Actual Values from Server

Run this on Coolify server:

```bash
# Create diagnostic script
cat > get-credentials.sh << 'EOF'
#!/bin/bash
echo "=== Redis Configuration ==="
REDIS=$(docker ps --filter "name=redis" --format "{{.Names}}" | head -n 1)
echo "Container: $REDIS"
docker exec $REDIS redis-cli CONFIG GET requirepass 2>/dev/null || echo "Cannot get password"
echo ""
echo "=== PostgreSQL Configuration ==="
PG=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)
echo "Container: $PG"
docker inspect $PG | grep -E "POSTGRES_|5432" | head -n 10
echo ""
echo "=== Network Info ==="
docker network ls
EOF

chmod +x get-credentials.sh
./get-credentials.sh
```

**Send me the output** and I'll help you configure Coolify correctly.

---

## Security Notes

⚠️ **IMPORTANT**:
- Never commit passwords to git
- Use strong passwords in production
- Rotate secrets regularly
- Use Redis password in production (even on internal network)
- Use PostgreSQL password (never use default 'postgres')
- Enable SSL for PostgreSQL in production

---

## Next Steps After Fix

1. ✅ Deploy successfully
2. ✅ Run database seeds (if needed)
3. ✅ Test all features
4. ✅ Monitor logs for 24 hours
5. ✅ Set up proper backups
6. ✅ Configure monitoring/alerts

---

**Last Updated**: 2025-10-14
**Status**: Ready to implement
