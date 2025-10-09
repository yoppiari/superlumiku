# 🚀 Panduan Setup Coolify untuk dev.lumiku.com

## Step-by-Step Setup di Coolify Dashboard

### 1️⃣ Login ke Coolify

```
URL: https://cf.avolut.com
```

### 2️⃣ Buat Application Baru

1. Klik **+ New Application**
2. Pilih **Public Repository**
3. Isi form:

```
Repository URL: https://github.com/yoppiari/superlumiku.git
Branch: development
Name: Lumiku Development
```

### 3️⃣ Konfigurasi Build Settings

1. **Build Pack**: `Docker Compose`
2. **Docker Compose File**: `docker-compose.dev.yml`
3. **Base Directory**: `/` (root)

### 4️⃣ Setup Domain

1. Di tab **Domains**
2. Tambahkan domain: `dev.lumiku.com`
3. Enable **SSL/HTTPS** (Let's Encrypt otomatis)
4. Klik **Save**

### 5️⃣ Setup Environment Variables

Di tab **Environment Variables**, tambahkan semua variables berikut:

#### 🔐 Generate Secrets Dulu

**Jalankan di terminal lokal:**

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Database Password
openssl rand -base64 24
```

#### 📝 Environment Variables yang Harus Diisi

Copy-paste ini ke Coolify, ganti nilai yang di `<...>`:

```env
# Database Configuration
POSTGRES_USER=lumiku_dev
POSTGRES_PASSWORD=<password-dari-openssl-rand>
POSTGRES_DB=lumiku_development
DATABASE_URL=postgresql://lumiku_dev:<password-sama>@postgres:5432/lumiku_development?schema=public
POSTGRES_HOST=postgres

# Server Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=<jwt-secret-dari-openssl-rand>
JWT_EXPIRES_IN=7d

# Payment Gateway (Duitku Sandbox)
DUITKU_MERCHANT_CODE=DS25180
DUITKU_API_KEY=55e33f1d71cc5ed5ce8b5abab54fc7ae
DUITKU_ENV=sandbox
DUITKU_CALLBACK_URL=https://dev.lumiku.com/api/mainapp/payment/callback
DUITKU_RETURN_URL=https://dev.lumiku.com

# AI Services
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

### 6️⃣ Setup Persistent Storage (Optional)

Coolify akan otomatis create volumes dari `docker-compose.dev.yml`:
- ✅ `postgres_dev_data` - PostgreSQL data
- ✅ `redis_dev_data` - Redis data
- ✅ `uploads_dev_data` - Upload files
- ✅ `outputs_dev_data` - Generated outputs

**Tidak perlu setup manual**, volumes sudah defined di `docker-compose.dev.yml`.

### 7️⃣ Deploy!

1. Klik tombol **Deploy** di kanan atas
2. Monitor logs di tab **Deployments**
3. Tunggu hingga status: ✅ **Deployed**

### 8️⃣ Verify Deployment

**Cek aplikasi:**
```
https://dev.lumiku.com
```

**Cek health endpoint:**
```
https://dev.lumiku.com/health
```

**Login dengan test account:**
```
Email: test@example.com
Password: password123
```

---

## 🔧 Post-Deployment Tasks

### Setup Database Tables

Setelah deployment berhasil, run migrations:

1. Buka **Terminal** di Coolify (atau SSH ke server)
2. Jalankan:

```bash
# Masuk ke container
docker exec -it lumiku-dev-app bash

# Run Prisma migrations
bunx prisma migrate deploy

# Generate Prisma Client
bunx prisma generate

# Seed database (optional)
bun run scripts/create-test-user.ts
```

### Test Payment Gateway

```bash
# Test Duitku Sandbox
curl https://dev.lumiku.com/api/mainapp/payment/create -X POST \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000, "productDetails": "Test"}'
```

---

## 🔄 Auto-Deploy Setup

### Enable Auto-Deploy dari GitHub

1. Di Coolify, tab **Source**
2. Enable **Auto Deploy on Push**
3. Pilih branch: `development`

Sekarang setiap push ke branch `development` akan otomatis deploy ke `dev.lumiku.com`!

### GitHub Webhook (Optional)

Coolify sudah setup webhook otomatis ke GitHub repo Anda. Cek di:
```
GitHub Repo → Settings → Webhooks
```

---

## 📊 Monitoring & Logs

### View Logs

**Di Coolify Dashboard:**
1. Klik application **Lumiku Development**
2. Tab **Logs**
3. Pilih service:
   - `app` - Application logs
   - `postgres` - Database logs
   - `redis` - Redis logs

**Via Terminal:**
```bash
# Application logs
docker logs -f lumiku-dev-app

# Database logs
docker logs -f lumiku-dev-postgres

# Redis logs
docker logs -f lumiku-dev-redis
```

### Check Services Health

```bash
# Check all containers
docker ps | grep lumiku-dev

# Check database
docker exec lumiku-dev-postgres pg_isready -U lumiku_dev

# Check Redis
docker exec lumiku-dev-redis redis-cli ping
```

---

## 🚨 Troubleshooting

### ❌ Build Failed

**Check:**
1. Dockerfile syntax di root project
2. docker-compose.dev.yml syntax
3. Build logs di Coolify

**Fix:**
```bash
# Test build locally
docker-compose -f docker-compose.dev.yml build
```

### ❌ Database Connection Error

**Check:**
1. `DATABASE_URL` di environment variables
2. `POSTGRES_PASSWORD` matching
3. Database container running

**Fix:**
```bash
# Restart database
docker restart lumiku-dev-postgres

# Check connection
docker exec lumiku-dev-app bunx prisma db pull
```

### ❌ Redis Connection Error

**Check:**
1. `REDIS_HOST=redis` (bukan localhost!)
2. `REDIS_PORT=6379`
3. Redis container running

**Fix:**
```bash
# Restart Redis
docker restart lumiku-dev-redis

# Test connection
docker exec lumiku-dev-redis redis-cli ping
```

### ❌ SSL Certificate Error

**Wait 2-5 minutes** untuk Let's Encrypt provision certificate.

**Manual refresh:**
1. Coolify → Application → Domains
2. Klik **Regenerate Certificate**

### ❌ Application Won't Start

**Check logs:**
```bash
docker logs lumiku-dev-app
```

**Common issues:**
- Missing environment variables
- Database not ready (wait for health check)
- Port conflicts
- Prisma migration needed

**Fix:**
```bash
# Restart all services
docker-compose -f docker-compose.dev.yml restart

# Or redeploy from Coolify
```

---

## 🎯 Next Steps

Setelah dev environment running:

1. ✅ Test semua features di `dev.lumiku.com`
2. ✅ Setup automated testing (optional)
3. ✅ Configure monitoring alerts
4. ✅ Document API changes
5. ✅ Setup staging environment (optional)

---

## 📞 Support

**Coolify Issues:**
- Docs: https://coolify.io/docs
- Discord: https://discord.gg/coolify

**Application Issues:**
- Check logs first
- Review SETUP_DEV_ENVIRONMENT.md
- Contact team

---

## ✅ Checklist Setup

- [ ] Push branch `development` ke GitHub
- [ ] Buat application baru di Coolify
- [ ] Set branch ke `development`
- [ ] Set docker-compose file ke `docker-compose.dev.yml`
- [ ] Setup domain `dev.lumiku.com`
- [ ] Generate secrets (JWT, DB password)
- [ ] Input semua environment variables
- [ ] Deploy application
- [ ] Run database migrations
- [ ] Test application di browser
- [ ] Setup auto-deploy on push
- [ ] Verify monitoring & logs

---

**Selamat! 🎉 Development environment sudah siap!**

Test di: https://dev.lumiku.com
