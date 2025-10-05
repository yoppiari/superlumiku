# Lumiku - Deployment Guide untuk Coolify

Dokumentasi lengkap untuk deployment aplikasi Lumiku ke Coolify.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Local Testing dengan Docker Compose](#local-testing)
4. [Deployment ke Coolify](#deployment-ke-coolify)
5. [Environment Variables](#environment-variables)
6. [Testing Deployment](#testing-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Sistem Requirements
- **Coolify** instance yang sudah running
- **GitHub Repository**: https://github.com/yoppiari/superlumiku/
- **Domain**: cf.avolut.com (sudah terkonfigurasi di Coolify)
- **API Key Coolify**: `5|CJbL8liBi6ra65UfLhGlru4YexDVur9U86E9ZxYGc478ab97`
- **App UUID**: `jws8c80ckos00og0cos4cw8s`

### Dependencies yang Dibutuhkan
- PostgreSQL (database)
- Redis (job queue untuk video processing)
- FFmpeg (untuk video/image processing)

---

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/yoppiari/superlumiku/
cd superlumiku
```

### 2. Setup Environment Variables
```bash
# Copy template environment file
cp .env.production.example .env.production

# Edit dan isi dengan values production
nano .env.production
```

**Penting**: Pastikan update values berikut:
- `JWT_SECRET` - Generate dengan: `openssl rand -base64 32`
- `DATABASE_URL` - PostgreSQL connection string
- `CORS_ORIGIN` - Domain production: `https://cf.avolut.com`
- `DUITKU_*` - Payment gateway credentials untuk production

### 3. Local Testing (WAJIB sebelum deploy!)
```bash
# Build dan run dengan docker-compose
docker-compose -f docker-compose.prod.yml up --build

# Di terminal lain, run smoke test
bash scripts/smoke-test.sh http://localhost

# Run comprehensive tests
bash scripts/test-deployment.sh http://localhost
```

**✅ Semua tests harus PASSED sebelum deploy ke production!**

---

## Local Testing

### Build Docker Image
```bash
docker build -t lumiku:latest .
```

### Run dengan Docker Compose
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Verify Services
```bash
# Check containers
docker ps

# Check health
curl http://localhost/health

# Check frontend
curl http://localhost/

# Check API
curl http://localhost/api/apps
```

---

## Deployment ke Coolify

### Method 1: Via Coolify UI (Recommended)

1. **Login ke Coolify Dashboard**
   ```
   https://cf.avolut.com
   ```

2. **Buka Application Settings**
   - Navigate ke application dengan UUID: `jws8c80ckos00og0cos4cw8s`

3. **Configure Build Settings**

   **Build Pack**: `Dockerfile`

   **Dockerfile Path**: `Dockerfile` (di root repository)

   **Build Command**: (kosongkan, sudah di Dockerfile)

   **Start Command**: (kosongkan, sudah di ENTRYPOINT)

   **Port**: `80`

4. **Set Environment Variables**

   Paste semua environment variables dari `.env.production`:

   ```env
   DATABASE_URL=postgresql://username:password@postgres:5432/lumiku_production
   JWT_SECRET=your-secure-random-string-min-32-chars
   REDIS_HOST=redis
   REDIS_PORT=6379
   CORS_ORIGIN=https://cf.avolut.com
   NODE_ENV=production
   # ... (copy semua dari .env.production)
   ```

5. **Configure Services (Jika belum ada)**

   **PostgreSQL Database:**
   - Type: PostgreSQL 16
   - Database Name: `lumiku_production`
   - Username: `lumiku_user`
   - Password: (generate secure password)

   **Redis:**
   - Type: Redis 7
   - No password (jika private network)

6. **Deploy**
   - Click **Deploy** button
   - Monitor deployment logs

### Method 2: Via Coolify API (Automated)

```bash
# Set environment variables
export COOLIFY_DOMAIN="cf.avolut.com"
export COOLIFY_API_KEY="5|CJbL8liBi6ra65UfLhGlru4YexDVur9U86E9ZxYGc478ab97"
export APP_UUID="jws8c80ckos00og0cos4cw8s"

# Run deployment script
bash scripts/deploy-coolify.sh
```

### Method 3: Manual API Call

```bash
curl -X GET \
  -H "Authorization: Bearer 5|CJbL8liBi6ra65UfLhGlru4YexDVur9U86E9ZxYGc478ab97" \
  "https://cf.avolut.com/api/v1/deploy?uuid=jws8c80ckos00og0cos4cw8s"
```

---

## Environment Variables

### ⚠️ CRITICAL Variables (MUST be set)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@postgres:5432/lumiku_production` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | Generated via `openssl rand -base64 32` |
| `REDIS_HOST` | Redis hostname | `redis` or `your-redis.upstash.io` |
| `CORS_ORIGIN` | Production domain | `https://cf.avolut.com` |

### 🔧 Application Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Backend server port |
| `NODE_ENV` | `production` | Environment mode |
| `UPLOAD_PATH` | `./uploads` | File upload directory |
| `OUTPUT_PATH` | `./outputs` | Output file directory |
| `MAX_FILE_SIZE` | `524288000` | Max upload size (500MB) |

### 💳 Payment Gateway (Duitku)

| Variable | Description |
|----------|-------------|
| `DUITKU_MERCHANT_CODE` | Merchant code dari Duitku |
| `DUITKU_API_KEY` | API key dari Duitku |
| `DUITKU_ENV` | `production` atau `sandbox` |
| `DUITKU_CALLBACK_URL` | `https://cf.avolut.com/api/payments/callback` |
| `DUITKU_RETURN_URL` | `https://cf.avolut.com/payments/status` |

### 🎬 FFmpeg

| Variable | Default | Description |
|----------|---------|-------------|
| `FFMPEG_PATH` | `ffmpeg` | FFmpeg binary path |
| `FFPROBE_PATH` | `ffprobe` | FFprobe binary path |

---

## Testing Deployment

### Post-Deployment Tests

#### 1. Smoke Test (Quick Check)
```bash
bash scripts/smoke-test.sh https://cf.avolut.com
```

Tests:
- ✅ Frontend accessible
- ✅ Backend health check
- ✅ API endpoints responding
- ✅ Authentication endpoints

#### 2. Comprehensive Test Suite
```bash
bash scripts/test-deployment.sh https://cf.avolut.com
```

Tests:
- ✅ Infrastructure health (Nginx, Backend)
- ✅ Authentication flow (Register, Login, Profile)
- ✅ Credits system
- ✅ Static file serving
- ✅ All app plugins (Video Mixer, Carousel Mix, Looping Flow)
- ✅ Database connectivity
- ✅ Error handling

#### 3. Manual Tests

**Test Frontend:**
```bash
curl https://cf.avolut.com/
```

**Test Backend API:**
```bash
curl https://cf.avolut.com/health
curl https://cf.avolut.com/api/apps
```

**Test Authentication:**
```bash
# Register
curl -X POST https://cf.avolut.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST https://cf.avolut.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## Troubleshooting

### 🔴 Common Issues

#### 1. Build Gagal

**Error**: `npm install failed` atau `bun install failed`

**Solution**:
```bash
# Clear Docker cache dan rebuild
docker builder prune -a
docker-compose -f docker-compose.prod.yml build --no-cache
```

#### 2. Database Connection Failed

**Error**: `Can't reach database server`

**Check**:
```bash
# Verify PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:password@postgres:5432/lumiku_production?schema=public
```

**Solution**:
- Pastikan PostgreSQL service running di Coolify
- Verify credentials benar
- Check network connectivity antara app dan database

#### 3. Redis Connection Failed

**Error**: `Redis connection closed` atau `Redis unavailable`

**Check**:
```bash
# Test Redis connection
docker exec -it lumiku-redis redis-cli ping
# Should return: PONG
```

**Solution**:
- Pastikan Redis service running
- Verify `REDIS_HOST` dan `REDIS_PORT` benar
- Check Redis logs: `docker logs lumiku-redis`

#### 4. FFmpeg Not Found

**Error**: `ffmpeg: command not found`

**Solution**:
FFmpeg sudah include di Docker image. Jika error:
```bash
# Rebuild Docker image
docker-compose -f docker-compose.prod.yml build --no-cache app
```

#### 5. Permission Denied untuk Uploads

**Error**: `EACCES: permission denied, mkdir '/app/backend/uploads'`

**Solution**:
```bash
# Fix di Dockerfile sudah ada, tapi jika masih error:
docker exec -it lumiku-app chmod -R 755 /app/backend/uploads
docker exec -it lumiku-app chmod -R 755 /app/backend/outputs
```

#### 6. CORS Errors di Frontend

**Error**: `Access to fetch at 'https://cf.avolut.com/api/...' has been blocked by CORS`

**Solution**:
- Pastikan `CORS_ORIGIN=https://cf.avolut.com` di environment variables
- Restart aplikasi setelah update env vars

#### 7. JWT Secret Not Secure

**Error**: `JWT secret is too short`

**Solution**:
```bash
# Generate secure JWT secret
openssl rand -base64 32

# Update di .env.production
JWT_SECRET="generated-secret-here"
```

### 📝 Debug Logs

#### View Application Logs
```bash
# Via Docker Compose
docker-compose -f docker-compose.prod.yml logs -f app

# Via Coolify UI
# Navigate to application > Logs tab
```

#### View Database Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f postgres
```

#### View Redis Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f redis
```

---

## Rollback Procedures

### Method 1: Via Coolify UI

1. Navigate to application
2. Go to **Deployments** tab
3. Find previous successful deployment
4. Click **Redeploy**

### Method 2: Via Git

```bash
# Find previous commit
git log --oneline

# Revert to previous version
git revert <commit-hash>
git push

# Trigger new deployment
bash scripts/deploy-coolify.sh
```

### Method 3: Emergency Rollback

```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout <previous-commit>

# Rebuild and deploy
docker-compose -f docker-compose.prod.yml up --build -d
```

---

## Production Checklist

Sebelum deploy ke production, pastikan:

- [ ] Semua environment variables sudah di-set
- [ ] JWT_SECRET menggunakan secure random string
- [ ] DATABASE_URL menunjuk ke PostgreSQL production
- [ ] CORS_ORIGIN di-set ke domain production
- [ ] Duitku credentials untuk production (bukan sandbox)
- [ ] Local testing dengan docker-compose PASSED
- [ ] Smoke tests PASSED
- [ ] Comprehensive tests PASSED
- [ ] Database migrations berjalan sukses
- [ ] Redis terkoneksi dan healthy
- [ ] FFmpeg tersedia dan berfungsi
- [ ] File uploads directory accessible
- [ ] SSL certificate aktif di domain
- [ ] Backup database sebelum deploy

---

## Monitoring & Maintenance

### Health Checks

Application otomatis running health checks setiap 30 detik:
- Nginx status
- Backend API (`/health`)
- Frontend accessibility

### Logs

**Access logs**:
- Nginx: `/var/log/nginx/access.log`
- Backend: stdout (via Docker logs)

**Error logs**:
- Nginx: `/var/log/nginx/error.log`
- Backend: stderr (via Docker logs)

### Backups

**Database Backup** (Recommended: Daily):
```bash
# Manual backup
docker exec lumiku-postgres pg_dump -U lumiku_user lumiku_production > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i lumiku-postgres psql -U lumiku_user lumiku_production < backup_20250105.sql
```

**Uploads Backup**:
```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/
```

---

## Support & Resources

- **GitHub Repository**: https://github.com/yoppiari/superlumiku/
- **Coolify Docs**: https://coolify.io/docs
- **Issue Tracker**: https://github.com/yoppiari/superlumiku/issues

---

**Dibuat sebagai referensi utama untuk deployment Lumiku ke Coolify.**

Jika menemukan error yang tidak tercantum di dokumentasi ini, silakan tambahkan ke section Troubleshooting untuk referensi di masa depan.
