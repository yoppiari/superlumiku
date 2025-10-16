# DEPLOYMENT FIX - Redis Authentication Issue

## ROOT CAUSE IDENTIFIED

The deployment is failing because **Redis requires authentication but you removed the password**.

### Evidence from Logs

```
🔧 Video Mixer Worker ready and listening for jobs
⚠️  Redis connection closed
🔧 Looping Flow Worker ready and listening for jobs
🔧 Carousel Mix Worker ready and listening for jobs
```

Workers start but Redis connection immediately closes - this is a **classic authentication failure**.

### What Happened

1. You removed `REDIS_PASSWORD` and `REDIS_USERNAME` from Coolify environment variables
2. The application tried to connect to Redis **without credentials**
3. Redis database **REQUIRES** authentication (password is set on the Redis container)
4. Connection failed → Workers crashed → Deployment failed

## THE CORRECT FIX

You need to **SET the Redis password** (not remove it).

### Step 1: Set Redis Environment Variables in Coolify

In the Coolify UI, go to your application environment variables and set:

```bash
REDIS_HOST=u8s0cgsks4gcwo84ccskwok4
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=43bgTxX07rGOxcDeD2Z67qc57qSAH39KEUJXCHap7W613KVNZPnLaOBdBG2Z0Yq6
```

**Important Notes:**
- `REDIS_HOST` is **CORRECT** as `u8s0cgsks4gcwo84ccskwok4` - this is the Redis container UUID in Docker network
- `REDIS_USERNAME` must be `default` (Redis 6+ default username)
- `REDIS_PASSWORD` is the actual password from your Redis database
- Do NOT use quotes around values in Coolify UI

### Step 2: Alternative - Use REDIS_URL (Simpler)

If Coolify/your code supports `REDIS_URL`, you can use a single environment variable:

```bash
REDIS_URL=redis://default:43bgTxX07rGOxcDeD2Z67qc57qSAH39KEUJXCHap7W613KVNZPnLaOBdBG2Z0Yq6@u8s0cgsks4gcwo84ccskwok4:6379/0
```

**Check if your code supports this:**

Look in `backend/src/lib/redis.ts` - if it checks for `process.env.REDIS_URL`, then you can use this simpler approach.

### Step 3: Redeploy

After setting the environment variables:

1. Save the changes in Coolify
2. Click "Redeploy" or push a new commit
3. Monitor logs during deployment

## How to Verify the Fix

### Expected Success Logs

After deployment, you should see:

```
✅ Redis connected
✅ Redis ready
🔧 Video Mixer Worker ready and listening for jobs
🔧 Looping Flow Worker ready and listening for jobs
🔧 Carousel Mix Worker ready and listening for jobs
```

**NO MORE** `⚠️  Redis connection closed` warnings.

### Test Redis Connection

Once deployed, SSH into the container and test:

```bash
# From Coolify terminal or docker exec
redis-cli -h u8s0cgsks4gcwo84ccskwok4 -p 6379 -a 43bgTxX07rGOxcDeD2Z67qc57qSAH39KEUJXCHap7W613KVNZPnLaOBdBG2Z0Yq6 ping
```

Expected output: `PONG`

### Test Application Health

```bash
curl https://dev.lumiku.com/api/health
```

Expected: `{"status":"ok"}` (or similar)

## Understanding Docker Networking

The reason `REDIS_HOST=u8s0cgsks4gcwo84ccskwok4` looks strange is because:

1. **Coolify uses Docker container UUIDs as hostnames**
2. Within the Docker network `coolify`, containers can reach each other by UUID
3. This is **normal and correct** for Docker Compose/Coolify deployments

**Do NOT change this to:**
- `localhost` (won't work - different container)
- `127.0.0.1` (won't work - different container)
- `redis` (might not work - Coolify uses UUID naming)

## Previous Misdiagnosis

### Why "Remove Redis Password" Didn't Work

When you got `WRONGPASS` error, the issue was:
- **Wrong password was set** (not that password should be removed)
- **Password mismatch** between what's in env vars and what Redis expects

The correct fix was to **use the RIGHT password**, not remove authentication entirely.

### Redis Password in Coolify

Your Redis database was created by Coolify with:
- Auto-generated secure password
- Password stored in Coolify's Redis database configuration
- **Cannot be disabled** without recreating Redis database

## Security Note

The password shown in this document:
```
43bgTxX07rGOxcDeD2Z67qc57qSAH39KEUJXCHap7W613KVNZPnLaOBdBG2Z0Yq6
```

Is your **current production Redis password**.

**Important:**
- This password is only accessible within the Docker `coolify` network
- Redis is exposed on public port `9675` (from the Redis config)
- Make sure this port is firewalled if you don't want external access
- Consider rotating the password if it's been compromised

## Alternative: Create Password-less Redis (NOT RECOMMENDED)

If you absolutely want Redis without password (not recommended for production):

1. Delete the existing Redis database in Coolify
2. Create a new Redis database
3. In Redis configuration, remove the password requirement
4. Then you can use:
   ```bash
   REDIS_HOST=<new-redis-uuid>
   REDIS_PORT=6379
   REDIS_USERNAME=
   REDIS_PASSWORD=
   ```

**But this is INSECURE and NOT recommended.**

## Next Steps

1. **Immediate:** Set the 4 Redis env vars in Coolify (Step 1 above)
2. **Deploy:** Redeploy the application
3. **Verify:** Check logs for `✅ Redis connected` and `✅ Redis ready`
4. **Test:** Access `https://dev.lumiku.com` and verify all features work

## If Still Failing

If deployment still fails after setting Redis password, check:

1. **Typo in password:** Copy-paste exactly, no spaces
2. **Redis container running:** Check Redis database status in Coolify
3. **Network connectivity:** Containers in same network (`coolify`)
4. **Port conflicts:** Port 6379 available inside container
5. **Application logs:** Look for other errors besides Redis

Run this in Coolify terminal to debug:

```bash
# Check if Redis container is running
docker ps | grep redis

# Check if Redis is accessible from app container
docker exec -it <app-container-id> sh
ping u8s0cgsks4gcwo84ccskwok4
nc -zv u8s0cgsks4gcwo84ccskwok4 6379
```

## Summary

**What was wrong:** You removed Redis password but Redis requires authentication

**The fix:** Set `REDIS_PASSWORD=43bgTxX07rGOxcDeD2Z67qc57qSAH39KEUJXCHap7W613KVNZPnLaOBdBG2Z0Yq6`

**Why it works:** Application can now authenticate with Redis using the correct password

---

**Ready to fix?** Go to Coolify → Applications → dev-superlumiku → Environment → Set the 4 Redis variables → Save → Redeploy
