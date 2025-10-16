# Production Deployment Checklist - Quick Reference

**Before you deploy to Coolify, complete this checklist.**

---

## CRITICAL BLOCKERS (Must Fix First)

### 1. Redis Connection at Import Time
**File**: `backend/src/apps/pose-generator/queue/queue.config.ts`

**Current** (line 30):
```typescript
const connection = new Redis({ ... })  // ❌ Executes on import
```

**Fix** (Lazy initialization):
```typescript
let connection: Redis | null = null

export function getRedisConnection(): Redis {
  if (!connection) {
    connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      lazyConnect: true, // Important!
    })
  }
  return connection
}
```

**Then re-enable**: `backend/src/plugins/loader.ts` line 20-21

---

### 2. Production Environment Variables
**File**: Create `.env.production.secure`

```bash
# CRITICAL - Generate these FIRST
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
REDIS_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Production Database
DATABASE_URL=postgresql://lumiku_user:YOUR_DB_PASSWORD@postgres:5432/lumiku_production?schema=public

# Redis (REQUIRED)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<paste generated password>
REDIS_ENABLED=true

# Duitku Payment (Get from dashboard)
DUITKU_MERCHANT_CODE=<real merchant code>
DUITKU_API_KEY=<real api key - 32+ chars>
DUITKU_ENV=production
DUITKU_CALLBACK_URL=https://api.yourdomain.com/api/payment/callback
DUITKU_RETURN_URL=https://yourdomain.com/payment/success

# Storage (Docker absolute paths)
STORAGE_MODE=local
UPLOAD_PATH=/app/backend/uploads
OUTPUT_PATH=/app/backend/outputs
UPLOAD_DIR=/app/backend/uploads
OUTPUT_DIR=/app/backend/uploads

# CORS
CORS_ORIGIN=https://yourdomain.com

# Trusted Proxies
TRUSTED_PROXY_IPS=172.16.0.0/12,10.0.0.0/8
```

**Validation**:
```bash
# Check no placeholders remain
grep -E "YOUR_|CHANGE_THIS|your-" .env.production
# Should return NOTHING
```

---

### 3. Frontend Environment Variables
**File**: Create `frontend/.env.production`

```bash
VITE_API_URL=https://api.yourdomain.com
```

**Update**: `frontend/src/lib/api.ts`
```typescript
const getApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl) {
    throw new Error('VITE_API_URL must be set in production')
  }
  return apiUrl
}
```

---

### 4. Database Initialization Order
**File**: `backend/src/index.ts`

**Move** database check BEFORE worker imports (line 89):
```typescript
async function start() {
  // 1. DATABASE FIRST
  await checkDatabase()

  // 2. THEN REDIS
  await checkRedis()

  // 3. THEN WORKERS (they use database)
  if (process.env.REDIS_ENABLED !== 'false') {
    await Promise.allSettled([
      import('./workers/video-mixer.worker'),
      import('./workers/carousel-mix.worker'),
      import('./workers/looping-flow.worker'),
    ])
  }

  // 4. CONTINUE WITH REST
  await initStorage()
  initializeScheduler()
  // ...
}
```

---

### 5. Storage Absolute Paths
**File**: `backend/src/lib/storage.ts`

**Replace** line 6:
```typescript
const getUploadDir = (): string => {
  const uploadDir = process.env.UPLOAD_DIR || process.env.UPLOAD_PATH

  if (!uploadDir && process.env.NODE_ENV === 'production') {
    throw new Error('UPLOAD_DIR must be set in production')
  }

  return uploadDir || './uploads'
}

const UPLOAD_DIR = getUploadDir()
```

**Update Dockerfile** (line 88):
```dockerfile
# Create persistent storage with correct permissions
RUN mkdir -p /app/backend/uploads /app/backend/outputs /app/backend/logs && \
    chown -R nodejs:nodejs /app/backend/uploads /app/backend/outputs /app/backend/logs

# Declare volume mount points
VOLUME ["/app/backend/uploads", "/app/backend/outputs"]
```

---

### 6. Session Verification in Auth
**File**: `backend/src/middleware/auth.middleware.ts`

**Add** session check (line 16):
```typescript
const payload = verifyToken(token)

// NEW: Verify session exists and is active
const session = await prisma.session.findUnique({
  where: { token },
  select: { id: true, userId: true, expiresAt: true },
})

if (!session || session.expiresAt < new Date()) {
  return c.json({ error: 'Unauthorized - Session expired' }, 401)
}
```

**Update** login to create session (`backend/src/services/auth.service.ts` line 105):
```typescript
const token = signToken({ userId: user.id, email: user.email })

// CREATE SESSION
const expiresAt = new Date()
expiresAt.setDate(expiresAt.getDate() + 7)

await prisma.session.create({
  data: {
    userId: user.id,
    token,
    expiresAt,
  },
})
```

---

## HIGH PRIORITY (Deploy Day 2)

### 7. Redis Production Validation
**File**: `backend/src/lib/redis.ts`

**Add** (line 5):
```typescript
if (process.env.NODE_ENV === 'production') {
  if (!process.env.REDIS_HOST) {
    throw new Error('REDIS_HOST is required in production')
  }
  if (!process.env.REDIS_PASSWORD) {
    console.warn('WARNING: REDIS_PASSWORD not set in production')
  }
}
```

---

### 8. Database Connection Pooling
**File**: `backend/src/db/client.ts`

**Replace** client creation:
```typescript
const getDatabaseUrl = (): string => {
  let url = process.env.DATABASE_URL!

  if (process.env.NODE_ENV === 'production') {
    const urlObj = new URL(url)
    urlObj.searchParams.set('connection_limit', '20')
    urlObj.searchParams.set('pool_timeout', '30')
    url = urlObj.toString()
  }

  return url
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url: getDatabaseUrl() } },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})
```

---

### 9. Enhanced Health Check
**File**: `backend/src/app.ts`

**Replace** `/api/health` (line 49):
```typescript
app.get('/api/health', async (c) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {} as Record<string, { status: string; message?: string }>,
  }

  let allHealthy = true

  // Database
  try {
    await prisma.$queryRaw`SELECT 1`
    health.checks.database = { status: 'up' }
  } catch (error: any) {
    health.checks.database = { status: 'down', message: error.message }
    allHealthy = false
  }

  // Redis (if enabled)
  if (isRedisEnabled() && redis) {
    try {
      await redis.ping()
      health.checks.redis = { status: 'up' }
    } catch (error: any) {
      health.checks.redis = { status: 'down', message: error.message }
      allHealthy = false
    }
  }

  // Storage
  try {
    const testFile = path.join(env.UPLOAD_PATH, '.health')
    await fs.writeFile(testFile, 'ok')
    await fs.unlink(testFile)
    health.checks.storage = { status: 'up' }
  } catch (error: any) {
    health.checks.storage = { status: 'down', message: error.message }
    allHealthy = false
  }

  health.status = allHealthy ? 'healthy' : 'degraded'
  return c.json(health, allHealthy ? 200 : 503)
})
```

---

### 10. Worker Error Handling
**File**: `backend/src/index.ts`

**Replace** worker imports (line 11-18):
```typescript
if (process.env.REDIS_ENABLED !== 'false') {
  const workerImports = [
    import('./workers/video-mixer.worker'),
    import('./workers/carousel-mix.worker'),
    import('./workers/looping-flow.worker'),
  ]

  Promise.allSettled(workerImports).then((results) => {
    const failed = results.filter(r => r.status === 'rejected')
    const succeeded = results.filter(r => r.status === 'fulfilled')

    if (failed.length > 0) {
      console.error(`❌ ${failed.length} worker(s) failed:`)
      failed.forEach((r, i) => {
        if (r.status === 'rejected') console.error(`   Worker ${i}: ${r.reason}`)
      })
    }

    if (succeeded.length === 0 && process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: No workers started')
      process.exit(1)
    }

    console.log(`✅ ${succeeded.length} worker(s) initialized`)
  })
}
```

---

### 11. Fix Auth Store Race Condition
**File**: `frontend/src/stores/authStore.ts`

**Replace** `setAuth` (line 30):
```typescript
setAuth: (user, token) => {
  try {
    if (!user || !token) {
      throw new Error('Invalid user or token')
    }

    localStorage.setItem('token', token)

    const savedToken = localStorage.getItem('token')
    if (savedToken !== token) {
      throw new Error('Failed to save token')
    }

    set({ user, token, isAuthenticated: true })
  } catch (error) {
    console.error('[AUTH] Failed:', error)
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
    throw error
  }
}
```

**Update** `frontend/src/pages/Login.tsx` (remove delay, line 35):
```typescript
const { user, token } = response
setAuth(user, token)  // Will throw if fails
navigate('/dashboard', { replace: true })  // No delay needed
```

---

## COOLIFY CONFIGURATION

### Volume Mounts (Add in Coolify UI)
```yaml
volumes:
  - lumiku-uploads:/app/backend/uploads
  - lumiku-outputs:/app/backend/outputs
  - lumiku-logs:/app/backend/logs
```

### Environment Secrets (Add in Coolify UI)
```
JWT_SECRET=<generated>
REDIS_PASSWORD=<generated>
POSTGRES_PASSWORD=<generated>
DUITKU_MERCHANT_CODE=<real>
DUITKU_API_KEY=<real>
```

### Health Check Configuration
```
Path: /api/health
Interval: 30s
Timeout: 10s
Retries: 3
```

---

## PRE-DEPLOYMENT VALIDATION

Run these commands BEFORE deploying:

```bash
# 1. Check environment variables
cd backend
grep -E "YOUR_|CHANGE_THIS|your-" .env.production
# Should return NOTHING

# 2. Validate no process.env direct access (should use env.ts)
grep -r "process.env\." src/ | grep -v "config/env.ts" | grep -v "node_modules"
# Review any matches

# 3. Check for console.log (replace with logger)
grep -r "console\." src/ | wc -l
# Note: Should migrate to structured logging

# 4. Test database connection
bun run prisma db push --preview-feature

# 5. Test Redis connection (if available locally)
redis-cli -h localhost -p 6379 -a yourpassword ping
# Should return: PONG

# 6. Build backend
bun run build
# Should succeed

# 7. Build frontend
cd ../frontend
npm run build
# Should succeed
```

---

## DEPLOYMENT SEQUENCE

1. **Prepare Environment**
   ```bash
   # Generate secrets
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # REDIS_PASSWORD
   ```

2. **Setup Coolify**
   - Create new project
   - Add environment secrets
   - Configure volume mounts
   - Set health check path to `/api/health`

3. **Deploy Database**
   - Ensure PostgreSQL service running
   - Run migrations: `bun run prisma migrate deploy`
   - Verify connection

4. **Deploy Redis**
   - Ensure Redis service running with password
   - Test connection

5. **Deploy Backend**
   - Push code to repository
   - Coolify auto-builds from Dockerfile
   - Monitor logs for startup errors
   - Verify health check passes

6. **Deploy Frontend**
   - Ensure VITE_API_URL set correctly
   - Build and deploy
   - Test API connectivity

7. **Smoke Test**
   ```bash
   # Health check
   curl https://api.yourdomain.com/api/health

   # Create test user
   curl -X POST https://api.yourdomain.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"TestPassword123!","name":"Test"}'

   # Login
   curl -X POST https://api.yourdomain.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"TestPassword123!"}'
   ```

---

## ROLLBACK PLAN

If deployment fails:

1. **Identify Issue**
   ```bash
   # Check logs in Coolify
   # Check health endpoint
   curl https://api.yourdomain.com/api/health
   ```

2. **Quick Fixes**
   - Environment variable typo? → Fix in Coolify UI, redeploy
   - Database migration failed? → Rollback migration
   - Redis connection failed? → Check password, restart Redis

3. **Full Rollback**
   - In Coolify: Click "Rollback to Previous Build"
   - Database: `bun run prisma migrate reset` (DEV ONLY)
   - Clear Redis: `redis-cli FLUSHALL` (use cautiously)

---

## POST-DEPLOYMENT CHECKLIST

After deployment succeeds:

- [ ] Health check returns 200
- [ ] Can register new user
- [ ] Can login
- [ ] Can access dashboard
- [ ] Can create project
- [ ] Can upload files
- [ ] Workers processing jobs
- [ ] Payment flow works (test mode)
- [ ] Logs are clean (no errors)
- [ ] Performance acceptable (check response times)

---

## MONITORING (Setup After Deployment)

### Logs to Watch
```bash
# Application logs
tail -f /app/backend/logs/app.log

# Worker logs
tail -f /app/backend/logs/worker.log

# Nginx access logs (Coolify)
tail -f /var/log/nginx/access.log
```

### Metrics to Track
- Response times (target: < 200ms for API calls)
- Error rate (target: < 1%)
- Database connection pool usage
- Redis memory usage
- Disk usage (uploads directory)
- Worker queue depth

### Alerts to Configure
- Health check fails 3+ times
- Error rate > 5%
- Disk usage > 80%
- Response time > 1s
- Worker queue > 100 jobs

---

## COMMON ISSUES & FIXES

### "Database connection refused"
**Cause**: DATABASE_URL incorrect or database not started
**Fix**: Check DATABASE_URL, ensure postgres service running

### "Redis connection timeout"
**Cause**: REDIS_HOST or REDIS_PASSWORD incorrect
**Fix**: Verify Redis environment variables, test connection

### "CORS policy violation"
**Cause**: CORS_ORIGIN doesn't match frontend URL
**Fix**: Update CORS_ORIGIN in backend .env

### "Files not persisting"
**Cause**: Volumes not mounted
**Fix**: Add volume mounts in Coolify configuration

### "JWT verification failed"
**Cause**: JWT_SECRET changed or not set
**Fix**: Ensure JWT_SECRET consistent across deployments

### "Workers not processing jobs"
**Cause**: Redis not connected or workers failed to start
**Fix**: Check Redis connection, review worker logs

---

## SECURITY CHECKLIST

Before going live:

- [ ] JWT_SECRET is 64+ characters, random
- [ ] REDIS_PASSWORD is strong
- [ ] POSTGRES_PASSWORD is strong
- [ ] Duitku using production credentials (not sandbox)
- [ ] CORS_ORIGIN set to exact production URL (no wildcards)
- [ ] HTTPS enforced (Coolify handles this)
- [ ] No hardcoded secrets in code
- [ ] No .env files committed to git
- [ ] Rate limiting enabled
- [ ] Session verification active
- [ ] File upload limits enforced

---

**Estimated Total Time**: 4-6 hours
**Confidence Level After Fixes**: 95%

Good luck! 🚀
