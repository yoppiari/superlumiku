# 🌐 Dual Environment Setup Guide
## dev.lumiku.com & app.lumiku.com

Panduan lengkap untuk setup dua environment:
- **Development**: dev.lumiku.com (branch `development`)
- **Production**: app.lumiku.com (branch `main`)

---

## 📋 Overview

| Environment | Domain | Branch | Docker Compose | Env File |
|------------|---------|---------|----------------|----------|
| **Development** | dev.lumiku.com | `development` | docker-compose.dev.yml | .env.development |
| **Production** | app.lumiku.com | `main` | docker-compose.prod.yml | .env.production |

---

## 🚀 Setup Development (dev.lumiku.com)

### 1. Push Branch Development ke GitHub

```bash
# Pastikan di branch development
git checkout development

# Add dan commit changes
git add .
git commit -m "Setup development environment for dev.lumiku.com"

# Push ke GitHub
git push origin development
```

### 2. Setup di Coolify

**Login ke Coolify:**
```
URL: https://cf.avolut.com
```

**Buat Application Baru:**
1. Klik **+ New Application**
2. Pilih **Public Repository**
3. Isi form:
   ```
   Repository URL: https://github.com/yoppiari/superlumiku.git
   Branch: development
   Name: Lumiku Development
   Build Pack: Docker Compose
   Docker Compose File: docker-compose.dev.yml
   ```

**Setup Domain:**
1. Tab **Domains**
2. Tambahkan: `dev.lumiku.com`
3. Enable **SSL/HTTPS**
4. Save

**Setup Environment Variables:**

```bash
# Generate secrets dulu di terminal lokal:
openssl rand -base64 32  # untuk JWT_SECRET
openssl rand -base64 24  # untuk POSTGRES_PASSWORD
```

Di Coolify, tab **Environment Variables**, copy-paste ini (ganti `<...>` dengan nilai yang di-generate):

```env
# Database Configuration
POSTGRES_USER=lumiku_dev
POSTGRES_PASSWORD=<password-dari-openssl>
POSTGRES_DB=lumiku_development
DATABASE_URL=postgresql://lumiku_dev:<password-sama>@postgres:5432/lumiku_development?schema=public
POSTGRES_HOST=postgres

# Server Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=<jwt-secret-dari-openssl>
JWT_EXPIRES_IN=7d

# Payment Gateway (Duitku Sandbox)
DUITKU_MERCHANT_CODE=DS25180
DUITKU_API_KEY=55e33f1d71cc5ed5ce8b5abab54fc7ae
DUITKU_ENV=sandbox
DUITKU_CALLBACK_URL=https://dev.lumiku.com/api/mainapp/payment/callback
DUITKU_RETURN_URL=https://dev.lumiku.com

# AI Services (gunakan API keys Anda)
ANTHROPIC_API_KEY=<your-anthropic-api-key>
MODELSLAB_API_KEY=LUQAR899Uwep23PdtlokPOmge7qLGI9UQtNRk3BfPlBHZM5NxIUXxiUJgbwS
EDENAI_API_KEY=

# File Storage
UPLOAD_PATH=./uploads
OUTPUT_PATH=./outputs
MAX_FILE_SIZE=524288000
UPLOAD_DIR=./uploads
OUTPUT_DIR=./uploads/outputs

# FFmpeg
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe

# CORS
CORS_ORIGIN=https://dev.lumiku.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Deploy:**
1. Klik **Deploy**
2. Monitor logs
3. Tunggu status ✅ **Deployed**

**Enable Auto-Deploy:**
1. Tab **Source**
2. Enable **Auto Deploy on Push**
3. Branch: `development`

Sekarang setiap push ke branch `development` akan otomatis deploy ke `dev.lumiku.com`!

---

## 🎯 Setup Production (app.lumiku.com)

### 1. Merge Development ke Main (Setelah Testing)

```bash
# Checkout ke main
git checkout main

# Merge dari development
git merge development

# Push ke GitHub
git push origin main
```

### 2. Setup di Coolify

**Buat Application Baru (Terpisah!):**
1. Klik **+ New Application**
2. Pilih **Public Repository**
3. Isi form:
   ```
   Repository URL: https://github.com/yoppiari/superlumiku.git
   Branch: main
   Name: Lumiku Production
   Build Pack: Docker Compose
   Docker Compose File: docker-compose.prod.yml
   ```

**Setup Domain:**
1. Tab **Domains**
2. Tambahkan: `app.lumiku.com`
3. Enable **SSL/HTTPS**
4. Save

**Setup Environment Variables:**

```bash
# Generate secrets BARU untuk production:
openssl rand -base64 32  # untuk JWT_SECRET
openssl rand -base64 32  # untuk POSTGRES_PASSWORD (lebih panjang!)
```

⚠️ **PENTING: Jangan gunakan secrets yang sama dengan development!**

Di Coolify, tab **Environment Variables**:

```env
# Database Configuration
POSTGRES_USER=lumiku_user
POSTGRES_PASSWORD=<production-password-dari-openssl>
POSTGRES_DB=lumiku_production
DATABASE_URL=postgresql://lumiku_user:<password-sama>@postgres:5432/lumiku_production?schema=public
POSTGRES_HOST=postgres

# Server Configuration
NODE_ENV=production
PORT=3000

# JWT Configuration
JWT_SECRET=<production-jwt-secret-dari-openssl>
JWT_EXPIRES_IN=7d

# Payment Gateway (Duitku PRODUCTION)
# IMPORTANT: Ganti dengan credentials production Duitku!
DUITKU_MERCHANT_CODE=<your-production-merchant-code>
DUITKU_API_KEY=<your-production-api-key>
DUITKU_ENV=production
DUITKU_CALLBACK_URL=https://app.lumiku.com/api/mainapp/payment/callback
DUITKU_RETURN_URL=https://app.lumiku.com

# AI Services (Production API Keys)
ANTHROPIC_API_KEY=<your-production-anthropic-api-key>
MODELSLAB_API_KEY=<your-production-modelslab-api-key>
EDENAI_API_KEY=

# File Storage
UPLOAD_PATH=./uploads
OUTPUT_PATH=./outputs
MAX_FILE_SIZE=524288000
UPLOAD_DIR=./uploads
OUTPUT_DIR=./uploads/outputs

# FFmpeg
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe

# CORS
CORS_ORIGIN=https://app.lumiku.com

# Rate Limiting (lebih ketat untuk production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Deploy:**
1. Klik **Deploy**
2. Monitor logs
3. Tunggu status ✅ **Deployed**

**Enable Auto-Deploy:**
1. Tab **Source**
2. Enable **Auto Deploy on Push**
3. Branch: `main`

Sekarang setiap push ke branch `main` akan otomatis deploy ke `app.lumiku.com`!

---

## 🔄 Workflow Development

### Daily Development:

```bash
# 1. Pastikan di branch development
git checkout development

# 2. Buat changes
# ... edit code ...

# 3. Test locally
docker-compose -f docker-compose.dev.yml up --build

# 4. Commit dan push
git add .
git commit -m "feat: add new feature"
git push origin development

# 5. Otomatis deploy ke dev.lumiku.com! 🎉
```

### Release ke Production:

```bash
# 1. Test di dev.lumiku.com dulu!
# Pastikan semua fitur berjalan dengan baik

# 2. Merge ke main
git checkout main
git merge development

# 3. Push ke production
git push origin main

# 4. Otomatis deploy ke app.lumiku.com! 🚀
```

---

## 📊 Monitoring

### Development (dev.lumiku.com)

**Health Check:**
```bash
curl https://dev.lumiku.com/health
```

**Logs:**
```bash
# Di Coolify Dashboard
Application: Lumiku Development → Logs
```

**Database:**
```bash
docker exec lumiku-dev-postgres psql -U lumiku_dev -d lumiku_development
```

### Production (app.lumiku.com)

**Health Check:**
```bash
curl https://app.lumiku.com/health
```

**Logs:**
```bash
# Di Coolify Dashboard
Application: Lumiku Production → Logs
```

**Database:**
```bash
docker exec lumiku-postgres psql -U lumiku_user -d lumiku_production
```

---

## 🗄️ Database Management

### Run Migrations (Development)

```bash
# Via Coolify Terminal atau SSH
docker exec -it lumiku-dev-app bash
bunx prisma migrate dev
bunx prisma generate
```

### Run Migrations (Production)

```bash
# Via Coolify Terminal atau SSH
docker exec -it lumiku-app bash
bunx prisma migrate deploy  # ⚠️ Gunakan 'deploy' bukan 'dev'!
bunx prisma generate
```

### Backup Database (Production)

```bash
# Backup
docker exec lumiku-postgres pg_dump -U lumiku_user lumiku_production > backup_$(date +%Y%m%d).sql

# Restore (jika diperlukan)
cat backup_20241009.sql | docker exec -i lumiku-postgres psql -U lumiku_user -d lumiku_production
```

---

## 🔐 Security Checklist

### Development:
- ✅ Gunakan Duitku Sandbox
- ✅ JWT secret berbeda dari production
- ✅ Database credentials berbeda
- ✅ Rate limiting lebih longgar (100 req/15min)

### Production:
- ✅ Duitku Production credentials
- ✅ Strong JWT secret (min 32 chars)
- ✅ Strong database password
- ✅ Rate limiting lebih ketat (50 req/15min)
- ✅ SSL/HTTPS enabled
- ✅ Regular database backups
- ✅ Monitor logs regularly

---

## 🚨 Troubleshooting

### Dev Environment Issues

**Port Conflicts:**
```bash
# Check ports
netstat -ano | findstr "5433"
netstat -ano | findstr "6380"

# Kill process if needed
taskkill /PID <PID> /F
```

**Reset Development Database:**
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Production Environment Issues

**Rollback to Previous Version:**
1. Coolify Dashboard → Lumiku Production
2. Tab **Deployments**
3. Klik deployment sebelumnya
4. Klik **Redeploy**

**Database Connection Issues:**
```bash
# Check database
docker exec lumiku-postgres pg_isready -U lumiku_user

# Check logs
docker logs lumiku-postgres
```

---

## 📞 Quick Reference

### URLs:

| Service | Development | Production |
|---------|------------|------------|
| App | https://dev.lumiku.com | https://app.lumiku.com |
| Health | https://dev.lumiku.com/health | https://app.lumiku.com/health |
| Coolify | https://cf.avolut.com | https://cf.avolut.com |
| GitHub | https://github.com/yoppiari/superlumiku | https://github.com/yoppiari/superlumiku |

### Branches:

| Environment | Branch | Auto-Deploy |
|------------|---------|-------------|
| Development | `development` | ✅ Yes |
| Production | `main` | ✅ Yes |

### Container Names:

| Service | Development | Production |
|---------|------------|------------|
| App | lumiku-dev-app | lumiku-app |
| Database | lumiku-dev-postgres | lumiku-postgres |
| Redis | lumiku-dev-redis | lumiku-redis |

---

## ✅ Setup Checklist

### Development (dev.lumiku.com):
- [ ] Branch `development` pushed ke GitHub
- [ ] Application created di Coolify
- [ ] Branch set ke `development`
- [ ] Docker compose file: `docker-compose.dev.yml`
- [ ] Domain `dev.lumiku.com` added
- [ ] SSL/HTTPS enabled
- [ ] Environment variables configured
- [ ] Deployed successfully
- [ ] Auto-deploy enabled
- [ ] Database migrations run
- [ ] Health check passing
- [ ] Can login and test

### Production (app.lumiku.com):
- [ ] Branch `main` pushed ke GitHub
- [ ] **SEPARATE** application created di Coolify
- [ ] Branch set ke `main`
- [ ] Docker compose file: `docker-compose.prod.yml`
- [ ] Domain `app.lumiku.com` added
- [ ] SSL/HTTPS enabled
- [ ] **DIFFERENT** environment variables configured
- [ ] Production Duitku credentials set
- [ ] Production API keys set
- [ ] Deployed successfully
- [ ] Auto-deploy enabled
- [ ] Database migrations run
- [ ] Health check passing
- [ ] Production tested

---

## 🎉 Success!

Kedua environment sekarang running:

- **Development**: https://dev.lumiku.com
- **Production**: https://app.lumiku.com

**Next Steps:**
1. Test semua fitur di development
2. Fix bugs dan improve features
3. Push ke development (auto-deploy)
4. Test di dev.lumiku.com
5. Merge ke main untuk release
6. Auto-deploy ke app.lumiku.com
7. Monitor production logs

Happy coding! 🚀
