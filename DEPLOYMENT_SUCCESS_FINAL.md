# ✅ Deployment Success - Lumiku App on Coolify

**Date:** 2025-10-09
**Environment:** Production (dev.lumiku.com)
**Status:** ✅ Successfully Deployed and Running

---

## 📋 Summary

Successfully deployed Lumiku application to Coolify at **https://dev.lumiku.com** with full functionality including:
- ✅ Frontend (React + Vite) served via Nginx
- ✅ Backend (Bun + Hono) running on port 3001
- ✅ PostgreSQL database with all tables migrated
- ✅ Redis connected for job queues (BullMQ)
- ✅ User authentication working (login/register)
- ✅ File uploads and outputs directories configured

---

## 🔧 Issues Fixed During Deployment

### 1. TypeScript Compilation Errors
**Problem:** Build failed due to strict TypeScript checks
- Unused imports and variables (TS6133)
- Invalid props passed to components (TS2322)
- NodeJS namespace error in browser environment (TS2503)

**Solution:**
- Removed unused imports and variables across 7 files
- Fixed component prop interfaces
- Changed `NodeJS.Timeout` to `number` type for browser compatibility

**Files Changed:**
- `frontend/src/App.tsx`
- `frontend/src/apps/PosterEditor.tsx`
- `frontend/src/apps/VideoGenerator.tsx`
- `frontend/src/apps/poster-editor/components/AnnotateCanvas.tsx`
- `frontend/src/apps/poster-editor/components/InpaintCanvas.tsx`
- `frontend/src/apps/poster-editor/components/ToolsPanel.tsx`
- `frontend/src/apps/poster-editor/components/EditorCanvas.tsx`

**Commit:** `5a95236`

---

### 2. Docker Build - Missing Python Dependencies
**Problem:** Canvas npm package failed to build
```
gyp ERR! find Python
error: install script from "canvas" exited with 1
```

**Solution:** Added Python3 and cairo dependencies to Dockerfile

**Changes in `Dockerfile`:**
```dockerfile
# Backend Builder Stage
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Production Stage
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    bind-tools \
    iputils
```

---

### 3. Database Configuration Mismatch
**Problem:** Prisma schema configured for SQLite but using PostgreSQL
```
Error: the URL must start with the protocol `file:`
provider = "sqlite"
```

**Solution:** Changed Prisma datasource provider

**Changes in `backend/prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

---

### 4. Redis Authentication with Username
**Problem:** Redis connection failed with WRONGPASS error
```
error: WRONGPASS invalid username-password pair or user is disabled
```

**Root Cause:** Redis 6+ uses ACL requiring both username and password

**Solution:** Added `username` parameter to Redis connection

**Changes in `backend/src/lib/redis.ts`:**
```typescript
redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  username: process.env.REDIS_USERNAME || 'default',  // ADDED
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})
```

---

### 5. Database Tables Not Created
**Problem:** Login failed because database tables didn't exist

**Solution:** Ran Prisma migrations in Coolify terminal
```bash
cd /app/backend && bun prisma db push --accept-data-loss
```

**Result:** Created 28 tables including:
- users
- credits
- subscriptions
- sessions
- payments
- apps
- carousel_generations
- looping_flow_generations
- poster_editor_projects
- And 19 more...

---

### 6. Test User Not Created
**Problem:** Login returned 401 because no users existed in database

**Solution:** Created test user via script
```bash
cd /app/backend && bun run scripts/create-test-user.ts
```

**Test User Credentials:**
- Email: `test@lumiku.com`
- Password: `password123`
- Role: `admin`
- Initial Credits: `1000`

---

## 🔐 Environment Variables

### Database (PostgreSQL)
```bash
DATABASE_URL=postgresql://postgres:6LP00jegy7IU06kaX9llkmZRU1AdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES@107.155.75.50:5986/lumiku-dev
POSTGRES_HOST=107.155.75.50
POSTGRES_PORT=5986
POSTGRES_DB=lumiku-dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=6LP00jegy7IU06kaX9llkmZRU1AdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES
```

### Redis
```bash
REDIS_HOST=u8s0cgsks4gcwo84ccskwok4
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=43bgTxX07rGOxcDeD2Z67qc57qSAH39KEUJXCHap7W613KVNZPnLaOBdBG2Z0YqB
```

### Application
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=8f9a3b2c1d4e5f6g7h89j0k11m3n4o5pOq7r8s9t0u1v2w3x4y5z6
CORS_ORIGIN=https://dev.lumiku.com
```

### Payment Gateway (Duitku)
```bash
DUITKU_API_KEY=55e33f1d71cc5ed5ce8b5abab54fc7ae
DUITKU_MERCHANT_CODE=DS25180
```

---

## 📁 File Structure

```
/app/
├── frontend/
│   └── dist/              # Built frontend (served by Nginx)
│       └── index.html
├── backend/
│   ├── src/
│   │   ├── index.ts       # Backend entry point
│   │   ├── app.ts
│   │   ├── routes/
│   │   ├── services/
│   │   └── lib/
│   │       └── redis.ts   # Redis connection config
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── scripts/
│   │   └── create-test-user.ts
│   ├── uploads/           # User uploaded files
│   └── outputs/           # Generated outputs
└── docker/
    ├── nginx.conf         # Nginx configuration
    ├── docker-entrypoint.sh
    └── healthcheck.sh
```

---

## 🌐 Nginx Configuration

```nginx
server {
    listen 3000;

    # Frontend static files
    root /app/frontend/dist;
    index index.html;

    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Long timeouts for video processing
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Serve uploaded files
    location /uploads/ {
        alias /app/backend/uploads/;
        expires 30d;
    }

    # Serve output files
    location /outputs/ {
        alias /app/backend/outputs/;
        expires 7d;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🚀 Deployment Process

### 1. Git Push
```bash
git add .
git commit -m "Your commit message"
git push origin development
```

### 2. Trigger Coolify Deployment
- Go to Coolify dashboard
- Click "Redeploy" button
- Or auto-deploy via webhook (if configured)

### 3. Deployment Steps (Automated)
1. ✅ Build frontend (Vite)
2. ✅ Build backend (Bun)
3. ✅ Generate Prisma Client
4. ✅ Create production Docker image
5. ✅ Start Nginx
6. ✅ Wait for PostgreSQL connection
7. ✅ Wait for Redis connection
8. ✅ Run database migrations
9. ✅ Start backend server
10. ✅ Health check passes

### 4. Post-Deployment (Manual - Only First Time)
```bash
# In Coolify Terminal:

# 1. Run database migrations
cd /app/backend && bun prisma db push --accept-data-loss

# 2. Create test user (if needed)
cd /app/backend && bun run scripts/create-test-user.ts

# 3. Verify health
curl http://127.0.0.1:3001/health
```

---

## 🧪 Testing

### 1. Health Check
```bash
curl https://dev.lumiku.com/health
# Expected: {"status":"ok","timestamp":"2025-10-09T..."}
```

### 2. Login Test
```bash
curl -X POST https://dev.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lumiku.com","password":"password123"}'
```

**Expected Response:**
```json
{
  "user": {
    "id": "...",
    "email": "test@lumiku.com",
    "name": "Test User",
    "creditBalance": 1000
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Browser Test
1. Navigate to https://dev.lumiku.com
2. Click Login
3. Enter credentials:
   - Email: `test@lumiku.com`
   - Password: `password123`
4. Should redirect to `/dashboard`

---

## 🐛 Troubleshooting

### Login Returns 401
**Cause:** User doesn't exist in database
**Solution:** Run create-test-user script
```bash
cd /app/backend && bun run scripts/create-test-user.ts
```

### Redis Connection Error
**Cause:** Wrong password or missing username
**Solution:** Check environment variables match Redis config
```bash
REDIS_USERNAME=default
REDIS_PASSWORD=<correct-password>
```

### Database Tables Missing
**Cause:** Migrations not run
**Solution:** Run Prisma migrations
```bash
cd /app/backend && bun prisma db push --accept-data-loss
```

### Frontend 404 Errors
**Cause:** Nginx not serving files correctly
**Solution:** Check Nginx config and verify frontend build exists
```bash
ls -la /app/frontend/dist/
```

### Backend Not Starting
**Cause:** Check logs for errors
**Solution:**
```bash
# In Coolify, check Logs tab
# Look for:
# - Database connection errors
# - Redis connection errors
# - Port conflicts
```

---

## 📊 Current Status

**Application:** ✅ Running
**URL:** https://dev.lumiku.com
**Backend:** ✅ Healthy (port 3001)
**Frontend:** ✅ Served by Nginx (port 3000)
**Database:** ✅ Connected (PostgreSQL)
**Redis:** ✅ Connected
**Authentication:** ✅ Working

**Test Account:**
- Email: `test@lumiku.com`
- Password: `password123`
- Credits: `1000`

---

## 🔄 Future Reference

### To Add New User
```bash
cd /app/backend && bun run scripts/create-test-user.ts
```
(Modify the script to change email/password)

### To Run Migrations
```bash
cd /app/backend && bun prisma migrate dev --name your_migration_name
# Or in production:
cd /app/backend && bun prisma migrate deploy
```

### To Check Database Tables
```bash
cd /app/backend && bun prisma studio --browser none
# Or query directly:
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

### To Reset Redis Cache
```bash
# Access Redis CLI
redis-cli -h u8s0cgsks4gcwo84ccskwok4 -p 6379 -a <password> --user default
# Then run:
FLUSHALL
```

---

## 📝 Important Notes

1. **Always test locally first** before deploying to production
2. **Database migrations are irreversible** - always backup before running
3. **Redis password must match** between app env vars and Redis config
4. **PostgreSQL host must be internal hostname** (not external IP)
5. **Test user credentials** are stored in plain text in script - change in production
6. **Environment variables** must be set in Coolify UI, not in .env files
7. **Deployment takes ~1-2 minutes** - wait for "Running" status before testing

---

## 🎉 Success Criteria Met

- ✅ Application deploys without errors
- ✅ Frontend loads correctly
- ✅ Backend responds to API requests
- ✅ Database connection established
- ✅ Redis connection established
- ✅ User can register/login
- ✅ Authentication persists across page reloads
- ✅ File uploads work (uploads/ directory)
- ✅ Video generation queue ready (Redis + BullMQ)
- ✅ All 28 database tables created
- ✅ Health check endpoint returns OK

---

**Deployment completed successfully! 🚀**

Last updated: 2025-10-09
