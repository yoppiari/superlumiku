# Coolify Setup - Quick Guide

## ⚠️ Deployment Failed? Check This First!

### 1. Environment Variables (WAJIB!)

**Di Coolify UI:**
1. Go to **Configuration** tab
2. Scroll ke **Environment Variables**
3. Paste semua dari `.env.production`:

```env
# CRITICAL VARIABLES
DATABASE_URL=postgresql://lumiku_user:LumikuSecure2025!@postgres:5432/lumiku_production?schema=public
JWT_SECRET=zvgDJtehGk1RJIbKDy8cB+UflTPP+m11quRZDX42HFU=
REDIS_HOST=redis
REDIS_PORT=6379
CORS_ORIGIN=https://cf.avolut.com
NODE_ENV=production

# SERVER
PORT=3000

# DATABASE CREDENTIALS
POSTGRES_USER=lumiku_user
POSTGRES_PASSWORD=LumikuSecure2025!
POSTGRES_DB=lumiku_production
POSTGRES_HOST=postgres

# FILE STORAGE
UPLOAD_PATH=./uploads
OUTPUT_PATH=./outputs
MAX_FILE_SIZE=524288000

# FFMPEG
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe

# PAYMENT (Update dengan credentials production Anda!)
DUITKU_MERCHANT_CODE=your-merchant-code
DUITKU_API_KEY=your-api-key
DUITKU_ENV=production
DUITKU_CALLBACK_URL=https://cf.avolut.com/api/payments/callback
DUITKU_RETURN_URL=https://cf.avolut.com/payments/status

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Save**

---

### 2. Build Configuration

**Di Coolify Configuration tab:**

| Setting | Value |
|---------|-------|
| **Build Pack** | `Dockerfile` |
| **Base Directory** | `.` (root) |
| **Dockerfile Location** | `Dockerfile` |
| **Docker Compose Location** | (leave empty) |
| **Ports Exposes** | `80` |
| **Start Command** | (leave empty, ada di ENTRYPOINT) |

---

### 3. Required Services

#### PostgreSQL Database

**Setup:**
1. Click **+ Add Service** or **Resources**
2. Choose **PostgreSQL** (version 16)
3. Configure:
   - **Name**: `lumiku-postgres`
   - **Database**: `lumiku_production`
   - **Username**: `lumiku_user`
   - **Password**: `LumikuSecure2025!` (or generate secure one)

4. **Important**: Connect to same network as app
5. Start the service
6. Update `DATABASE_URL` env var dengan connection string yang benar

**Connection String Format:**
```
postgresql://USERNAME:PASSWORD@SERVICE_NAME:5432/DATABASE_NAME?schema=public
```

Example:
```
postgresql://lumiku_user:LumikuSecure2025!@lumiku-postgres:5432/lumiku_production?schema=public
```

#### Redis

**Setup:**
1. **+ Add Service**
2. Choose **Redis** (version 7)
3. Configure:
   - **Name**: `lumiku-redis`
   - **Password**: (leave empty if internal network)

4. Connect to same network
5. Update env vars:
   ```
   REDIS_HOST=lumiku-redis
   REDIS_PORT=6379
   ```

---

### 4. Network Configuration

**Ensure all services in same network:**
- App container
- PostgreSQL container
- Redis container

In Coolify, they should auto-connect if in same project.

---

### 5. Common Deployment Errors

#### Error: "DATABASE_URL not set"
**Fix**: Add environment variable `DATABASE_URL` di Coolify UI

#### Error: "Can't reach database server"
**Fix**:
- Ensure PostgreSQL service is running
- Check DATABASE_URL format
- Verify service name matches (e.g., `lumiku-postgres`)

#### Error: "Redis connection failed"
**Fix**:
- Start Redis service
- Update `REDIS_HOST` to Redis service name

#### Error: "EACCES: permission denied"
**Fix**: Already handled in Dockerfile, but if persists, add volume permissions

#### Error: "npm install failed" or "bun install failed"
**Fix**:
- Check internet connectivity on Coolify server
- Retry deployment
- Check build logs for specific package errors

---

### 6. Verify Deployment

After successful deployment:

**Check these URLs:**
```
https://cf.avolut.com/health       # Should return {"status":"ok"}
https://cf.avolut.com/             # Should load frontend
https://cf.avolut.com/api/apps     # Should return apps list
```

---

### 7. Debugging Failed Deployment

**Steps:**
1. Click on **Failed** deployment
2. View **Logs** tab
3. Look for error messages (biasanya di akhir logs)
4. Common errors:
   - Missing env vars → Add to Configuration
   - Database connection → Check PostgreSQL service
   - Redis connection → Check Redis service
   - Build errors → Check Dockerfile syntax

**Common Log Patterns:**
```
❌ ERROR: Required environment variable DATABASE_URL is not set
   → Add DATABASE_URL to environment variables

❌ PostgreSQL is unavailable
   → Start PostgreSQL service and verify connection

❌ Redis is unavailable
   → Start Redis service

❌ ffmpeg: command not found
   → Should not happen (included in Dockerfile), rebuild image
```

---

### 8. Manual Redeploy

After fixing issues:

**Via UI:**
1. Click **Deploy** button (top right)
2. Monitor deployment logs

**Via API:**
```bash
curl -X GET \
  -H "Authorization: Bearer 5|CJbL8liBi6ra65UfLhGlru4YexDVur9U86E9ZxYGc478ab97" \
  "https://cf.avolut.com/api/v1/deploy?uuid=jws8c80ckos00og0cos4cw8s"
```

---

### 9. Post-Deployment Checklist

- [ ] Health check returns OK
- [ ] Frontend loads
- [ ] Can register new user
- [ ] Can login
- [ ] File uploads work
- [ ] No errors in application logs

---

## Need Help?

1. Check **Logs** tab in Coolify
2. See **DEPLOYMENT.md** for detailed troubleshooting
3. Check GitHub commit `a835225` for deployed code

---

**App UUID**: `jws8c80ckos00og0cos4cw8s`
**Domain**: `https://cf.avolut.com`
**GitHub**: `https://github.com/yoppiari/superlumiku/`
