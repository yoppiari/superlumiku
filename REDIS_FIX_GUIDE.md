# Redis Configuration Fix Guide
## Lumiku Production Environment

---

## Problem Summary

**Error**: `WRONGPASS invalid username-password pair or user is disabled`

**Impact**:
- BullMQ workers cannot connect to Redis
- Video generation worker failing
- Carousel generation worker failing
- Looping flow worker failing
- Rate limiting system not functional

---

## Root Cause

The application is trying to authenticate with Redis using:
```
Username: default
Password: 43bgTxX07rGOxcDeD2Z67qc57qSAH39KEUJXCHap7W613KVNZPnLaOBdBG2Z0YqB
```

But Redis either:
1. Has password authentication disabled (most common in Docker)
2. Has a different password configured
3. Doesn't have the "default" user configured in ACL

---

## Quick Fix Steps

### Option 1: Disable Redis Authentication (Recommended for Internal Docker Network)

Since Redis is on the internal Coolify Docker network (`u8s0cgsks4gcwo84ccskwok4`), it's secure without password authentication.

1. **Access Coolify UI**: https://cf.avolut.com
2. **Navigate to**: Applications → dev-superlumiku → Environment Variables
3. **Update these variables**:
   ```
   REDIS_PASSWORD = (leave empty)
   REDIS_USERNAME = (leave empty)
   ```
4. **Save changes**
5. **Restart application**: Click "Restart" button
6. **Verify**: Check logs for connection errors

### Option 2: Find Correct Redis Password

If Redis does require authentication:

1. **SSH into Coolify server**:
   ```bash
   ssh root@cf.avolut.com
   ```

2. **Find Redis container**:
   ```bash
   docker ps | grep redis
   ```

3. **Check Redis configuration**:
   ```bash
   docker exec -it <redis-container-name> cat /etc/redis/redis.conf | grep requirepass
   ```

4. **Test connection without password**:
   ```bash
   docker exec -it <redis-container-name> redis-cli PING
   ```
   - If you get `PONG`, no password is needed
   - If you get `NOAUTH`, password is required

5. **Test with password**:
   ```bash
   docker exec -it <redis-container-name> redis-cli
   AUTH default 43bgTxX07rGOxcDeD2Z67qc57qSAH39KEUJXCHap7W613KVNZPnLaOBdBG2Z0YqB
   PING
   ```

6. **Update environment variables in Coolify UI** with correct credentials

---

## Manual Fix via Coolify UI

### Step-by-Step Instructions

1. **Login to Coolify**
   - URL: https://cf.avolut.com
   - Use your Coolify credentials

2. **Navigate to Application**
   - Click "Applications" in sidebar
   - Find "dev-superlumiku" (UUID: d8ggwoo484k8ok48g8k8cgwk)
   - Click on the application

3. **Access Environment Variables**
   - Click "Environment" tab
   - Or click "Configuration" → "Environment Variables"

4. **Locate Redis Variables**
   - Find: `REDIS_PASSWORD`
   - Find: `REDIS_USERNAME`

5. **Update Values**

   **For Option 1 (No Authentication)**:
   - `REDIS_PASSWORD`: Delete the value (make it empty)
   - `REDIS_USERNAME`: Delete the value (make it empty)

   **For Option 2 (Correct Password)**:
   - `REDIS_PASSWORD`: Enter the correct password
   - `REDIS_USERNAME`: Enter the correct username (or leave empty if not using ACL)

6. **Save Changes**
   - Click "Save" or "Update" button
   - Wait for confirmation message

7. **Restart Application**
   - Go back to application overview
   - Click "Restart" button
   - Wait for container to restart (~30 seconds)

8. **Verify Fix**
   - Click "Logs" tab
   - Look for Redis connection messages
   - Should NOT see "WRONGPASS" errors
   - Should see successful worker connections

---

## Verification Commands

### Check Application Health
```bash
curl https://dev.lumiku.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "lumiku-backend",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-10-14T..."
}
```

### Check Application Logs (via Coolify UI)
Look for these success messages:
```
✓ Redis connected successfully
✓ Video worker started
✓ Carousel worker started
✓ Looping flow worker started
✓ Rate limiter initialized
```

Should NOT see:
```
✗ WRONGPASS invalid username-password pair
✗ Redis connection failed
✗ Worker failed to start
```

---

## Alternative: Using Coolify API (Requires Write Permissions)

If you have a Coolify API token with write permissions:

### Update Redis Password to Empty
```bash
curl -X PATCH "https://cf.avolut.com/api/v1/applications/d8ggwoo484k8ok48g8k8cgwk/envs/qoso4kc4w484s4gwcockosgg" \
  -H "Authorization: Bearer YOUR_API_TOKEN_WITH_WRITE_PERMISSION" \
  -H "Content-Type: application/json" \
  -d '{"value":""}'
```

### Update Redis Username to Empty
```bash
curl -X PATCH "https://cf.avolut.com/api/v1/applications/d8ggwoo484k8ok48g8k8cgwk/envs/pwo08k0w88gcoookcso8g4k4" \
  -H "Authorization: Bearer YOUR_API_TOKEN_WITH_WRITE_PERMISSION" \
  -H "Content-Type: application/json" \
  -d '{"value":""}'
```

### Restart Application
```bash
curl -X POST "https://cf.avolut.com/api/v1/applications/d8ggwoo484k8ok48g8k8cgwk/restart" \
  -H "Authorization: Bearer YOUR_API_TOKEN_WITH_WRITE_PERMISSION"
```

---

## Testing After Fix

### 1. Test Video Worker
1. Login to https://dev.lumiku.com
2. Navigate to Video Generator
3. Create a test video
4. Verify it's queued and processed
5. Check job status updates

### 2. Test Carousel Worker
1. Navigate to Carousel Generator
2. Create a test carousel
3. Verify processing completes
4. Check output is correct

### 3. Test Rate Limiting
1. Make multiple rapid API requests
2. Verify rate limit headers are present
3. Verify rate limit kicks in after threshold

### 4. Check Redis Keys
SSH into server and run:
```bash
docker exec -it <redis-container> redis-cli KEYS "*"
```

Should see keys like:
```
bull:video-generation:*
bull:carousel-generation:*
bull:looping-flow:*
rate-limit:*
```

---

## Environment Variables Reference

### Current Redis Configuration
```bash
REDIS_HOST=u8s0cgsks4gcwo84ccskwok4
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=43bgTxX07rGOxcDeD2Z67qc57qSAH39KEUJXCHap7W613KVNZPnLaOBdBG2Z0YqB
```

### Recommended Redis Configuration (No Auth)
```bash
REDIS_HOST=u8s0cgsks4gcwo84ccskwok4
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
```

### Alternative: Construct REDIS_URL
If your application supports `REDIS_URL` instead of individual variables:

**Without password**:
```bash
REDIS_URL=redis://u8s0cgsks4gcwo84ccskwok4:6379
```

**With password**:
```bash
REDIS_URL=redis://default:PASSWORD@u8s0cgsks4gcwo84ccskwok4:6379
```

---

## Troubleshooting

### Issue: Still getting WRONGPASS after removing password
**Solution**:
1. Ensure you saved the changes in Coolify
2. Restart the application (not just redeploy)
3. Check if there's a cached Redis URL that includes the password
4. Look for `REDIS_URL` environment variable that might override individual settings

### Issue: Application won't start after change
**Solution**:
1. Check application logs in Coolify
2. Verify Redis container is running: `docker ps | grep redis`
3. Test Redis connectivity from app container: `docker exec -it <app-container> ping u8s0cgsks4gcwo84ccskwok4`
4. Rollback changes if needed

### Issue: Workers still not connecting
**Solution**:
1. Check if workers are being started: Look for worker initialization in logs
2. Verify BullMQ is using correct Redis config
3. Check if there are separate worker containers that need updating
4. Restart worker processes separately if they run in different containers

---

## Additional Notes

1. **Security**: If Redis is only accessible within the Docker network (`u8s0cgsks4gcwo84ccskwok4`), password authentication is not strictly necessary as the network itself provides isolation.

2. **Coolify Service UUID**: The `REDIS_HOST` value `u8s0cgsks4gcwo84ccskwok4` is a Coolify-generated UUID that resolves to the Redis service within the Docker network. This is correct and should not be changed.

3. **Port**: Redis default port is 6379, which is correct.

4. **Connection String**: Some libraries prefer a single `REDIS_URL` connection string. Check your application code to see which format it expects.

---

## Success Criteria

After implementing the fix, you should see:

- No "WRONGPASS" errors in logs
- All workers starting successfully
- Jobs being processed from queues
- Rate limiting functional
- Health check includes Redis status
- No connection timeout errors

---

## Support

If issues persist after trying both options:
1. Check Redis container logs: `docker logs <redis-container-name>`
2. Review application connection code in `backend/src/lib/redis.ts`
3. Verify BullMQ configuration in worker files
4. Check if there are multiple Redis instances
5. Contact Coolify support if Redis service is misconfigured

---

**Last Updated**: October 14, 2025
**Related Document**: DEPLOYMENT_STATUS_2025_10_14.md
