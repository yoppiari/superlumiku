# QUICK FIX - Copy & Paste These Values

## Root Cause
Redis requires authentication but you removed the password. The app can't connect without credentials.

## Fix: Add These 4 Environment Variables in Coolify

Go to: **Coolify → Applications → dev-superlumiku → Environment**

Add/Update these variables:

```
REDIS_HOST
u8s0cgsks4gcwo84ccskwok4

REDIS_PORT
6379

REDIS_USERNAME
default

REDIS_PASSWORD
43bgTxX07rGOxcDeD2Z67qc57qSAH39KEUJXCHap7W613KVNZPnLaOBdBG2Z0Yq6
```

## Important Notes

1. **Copy exactly** - no spaces, no quotes in Coolify UI
2. **REDIS_HOST is correct** - it's the Redis container UUID in Docker network
3. **REDIS_USERNAME must be "default"** - Redis 6+ requires this
4. **REDIS_PASSWORD is the real password** from your Redis database

## After Setting Variables

1. Click **Save** in Coolify
2. Click **Redeploy**
3. Wait 4-5 minutes for deployment
4. Check logs for: `✅ Redis connected` and `✅ Redis ready`

## Expected Success

**Before (FAILING):**
```
🔧 Video Mixer Worker ready and listening for jobs
⚠️  Redis connection closed    ← THIS IS THE ERROR
🔧 Looping Flow Worker ready and listening for jobs
⚠️  Redis connection closed    ← THIS IS THE ERROR
```

**After (SUCCESS):**
```
✅ Redis connected             ← FIXED!
✅ Redis ready                 ← FIXED!
🔧 Video Mixer Worker ready and listening for jobs
🔧 Looping Flow Worker ready and listening for jobs
🔧 Carousel Mix Worker ready and listening for jobs
```

## Verify Working

```bash
curl https://dev.lumiku.com/api/health
```

Should return: `{"status":"ok"}` or similar

---

**Questions?** Read the full explanation in `DEPLOYMENT_FIX_REDIS_AUTH.md`
