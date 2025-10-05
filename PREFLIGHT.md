# Pre-Deployment Checklist

**WAJIB dilakukan sebelum deployment ke Coolify production!**

---

## ✅ Pre-Deployment Checklist

### 1. Code & Repository

- [ ] **Code sudah di-commit dan di-push ke GitHub**
  ```bash
  git status  # Pastikan tidak ada uncommitted changes
  git push origin main
  ```

- [ ] **Repository accessible di**: https://github.com/yoppiari/superlumiku/

- [ ] **Branch yang akan di-deploy**: `main` (atau branch production)

---

### 2. Environment Configuration

- [ ] **File `.env.production` sudah dibuat**
  ```bash
  cp .env.production.example .env.production
  ```

- [ ] **JWT_SECRET sudah di-generate dengan secure random string**
  ```bash
  openssl rand -base64 32
  # Copy hasil ke JWT_SECRET di .env.production
  ```

- [ ] **DATABASE_URL sudah di-set untuk PostgreSQL production**
  ```
  postgresql://lumiku_user:SECURE_PASSWORD@postgres:5432/lumiku_production?schema=public
  ```

- [ ] **REDIS_HOST dan REDIS_PORT sudah benar**
  ```
  REDIS_HOST=redis (untuk Coolify internal)
  REDIS_PORT=6379
  ```

- [ ] **CORS_ORIGIN sudah di-set ke domain production**
  ```
  CORS_ORIGIN=https://cf.avolut.com
  ```

- [ ] **Duitku payment gateway dalam mode production**
  ```
  DUITKU_ENV=production
  DUITKU_MERCHANT_CODE=<production-code>
  DUITKU_API_KEY=<production-key>
  DUITKU_CALLBACK_URL=https://cf.avolut.com/api/payments/callback
  DUITKU_RETURN_URL=https://cf.avolut.com/payments/status
  ```

- [ ] **Semua required environment variables sudah di-set**

---

### 3. Dependencies Check

- [ ] **PostgreSQL service tersedia di Coolify**
  - Database name: `lumiku_production`
  - User dengan permissions yang benar
  - Accessible dari app container

- [ ] **Redis service tersedia di Coolify**
  - Redis 7+ recommended
  - Accessible dari app container
  - Tidak perlu password jika private network

- [ ] **FFmpeg tersedia** (otomatis include di Docker image)

---

### 4. Local Testing (MANDATORY)

- [ ] **Build Docker image berhasil**
  ```bash
  docker build -t lumiku:latest .
  # Should complete without errors
  ```

- [ ] **Docker Compose production test berhasil**
  ```bash
  docker-compose -f docker-compose.prod.yml up --build
  # All services should start successfully
  ```

- [ ] **Smoke test PASSED**
  ```bash
  bash scripts/smoke-test.sh http://localhost
  # All tests must PASS
  ```

- [ ] **Comprehensive test suite PASSED**
  ```bash
  bash scripts/test-deployment.sh http://localhost
  # All tests must PASS
  ```

- [ ] **Test user registration & login works**
  ```bash
  curl -X POST http://localhost/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123","name":"Test"}'

  curl -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123"}'
  ```

- [ ] **Frontend loads correctly**
  ```bash
  curl http://localhost/
  # Should return HTML with React app
  ```

- [ ] **API endpoints responding**
  ```bash
  curl http://localhost/health
  curl http://localhost/api/apps
  ```

---

### 5. Database Migrations

- [ ] **Prisma schema updated to PostgreSQL**
  ```bash
  # Check backend/prisma/schema.prisma
  # datasource db { provider = "postgresql" }
  ```

- [ ] **Migration files ready**
  ```bash
  cd backend
  bun prisma migrate dev --name production_ready
  # Or: bun prisma migrate deploy (for production)
  ```

- [ ] **Seed data prepared (optional but recommended)**
  ```bash
  cd backend
  bun run prisma:seed
  ```

---

### 6. File Structure Verification

- [ ] **Dockerfile exists di root**
  ```bash
  ls -la Dockerfile
  ```

- [ ] **docker-compose.prod.yml exists**
  ```bash
  ls -la docker-compose.prod.yml
  ```

- [ ] **Nginx config exists**
  ```bash
  ls -la docker/nginx.conf
  ```

- [ ] **Scripts executable**
  ```bash
  chmod +x docker/docker-entrypoint.sh
  chmod +x docker/healthcheck.sh
  chmod +x scripts/*.sh
  ```

- [ ] **.dockerignore configured properly**

---

### 7. Coolify Configuration

- [ ] **Coolify account accessible**
  ```
  URL: https://cf.avolut.com
  API Key: 5|CJbL8liBi6ra65UfLhGlru4YexDVur9U86E9ZxYGc478ab97
  ```

- [ ] **App UUID confirmed**: `jws8c80ckos00og0cos4cw8s`

- [ ] **GitHub repository connected to Coolify**

- [ ] **Build Pack set to**: `Dockerfile`

- [ ] **Port exposed**: `80`

- [ ] **Environment variables configured in Coolify UI**
  - Paste all from `.env.production`
  - Verify no typos

- [ ] **PostgreSQL database created in Coolify**

- [ ] **Redis service created in Coolify**

- [ ] **Domain configured**: cf.avolut.com
  - SSL certificate active
  - DNS pointing correctly

---

### 8. Security Checks

- [ ] **JWT_SECRET is NOT the default value**

- [ ] **Database password is strong**

- [ ] **No sensitive credentials in git repository**
  ```bash
  git log --all --full-history --source --name-only -- .env .env.local
  # Should return empty (no .env files in history)
  ```

- [ ] **.gitignore includes sensitive files**
  ```
  .env
  .env.local
  .env.production
  *.db
  ```

- [ ] **API keys for production (not sandbox/test)**

---

### 9. Backup & Rollback Plan

- [ ] **Current production database backed up** (if exists)
  ```bash
  # If updating existing deployment
  pg_dump -h HOST -U USER -d DATABASE > backup_$(date +%Y%m%d).sql
  ```

- [ ] **Rollback plan prepared**
  - Know how to revert to previous deployment in Coolify
  - Have previous working commit hash ready

- [ ] **Monitoring setup**
  - Know how to access logs in Coolify
  - Have notification channel ready (email/Slack)

---

### 10. Final Verification

- [ ] **All tests passed locally**

- [ ] **No TypeScript errors**
  ```bash
  cd frontend && npm run build
  cd backend && bun build
  ```

- [ ] **No console errors in development**

- [ ] **File upload/download works**

- [ ] **Video processing works (if applicable)**

- [ ] **Payment flow tested** (in sandbox first)

- [ ] **Team notified about deployment**

- [ ] **Maintenance window scheduled** (if needed)

---

## 🚀 Ready to Deploy!

Jika semua checklist di atas **✅ PASSED**, Anda siap untuk deploy:

### Deploy via Script
```bash
bash scripts/deploy-coolify.sh
```

### Deploy via Manual API
```bash
curl -X GET \
  -H "Authorization: Bearer 5|CJbL8liBi6ra65UfLhGlru4YexDVur9U86E9ZxYGc478ab97" \
  "https://cf.avolut.com/api/v1/deploy?uuid=jws8c80ckos00og0cos4cw8s"
```

### Deploy via Coolify UI
1. Login to https://cf.avolut.com
2. Navigate to application
3. Click **Deploy** button

---

## 📝 Post-Deployment Tasks

After deployment completes:

1. **Run smoke test**
   ```bash
   bash scripts/smoke-test.sh https://cf.avolut.com
   ```

2. **Run comprehensive tests**
   ```bash
   bash scripts/test-deployment.sh https://cf.avolut.com
   ```

3. **Manual verification**
   - Open https://cf.avolut.com in browser
   - Test user registration
   - Test file upload
   - Test video processing
   - Check logs for errors

4. **Monitor for 30 minutes**
   - Watch error logs
   - Check response times
   - Verify no crashes

5. **Document deployment**
   - Record deployment time
   - Record commit hash deployed
   - Note any issues encountered

---

## ❌ If Deployment Fails

See **DEPLOYMENT.md** → Troubleshooting section

Common fixes:
1. Check Coolify logs
2. Verify environment variables
3. Check database connectivity
4. Verify Redis availability
5. Rollback if necessary

---

**Last Updated**: 2025-01-05

**Checklist Version**: 1.0
