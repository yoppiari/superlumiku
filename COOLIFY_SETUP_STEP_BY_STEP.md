# 🚀 Step-by-Step: Setup dev.lumiku.com di Coolify

## 📋 Prerequisites

✅ GitHub repository sudah ready: https://github.com/yoppiari/superlumiku.git
✅ Branch `development` sudah pushed
✅ Docker Compose files ready
✅ Secrets sudah di-generate

---

## 🔐 Generated Secrets (Simpan ini!)

```
JWT_SECRET=r4mjmVg4AgSZZyM3NfMvXtRKJX7Q9YrVlPtxX2cLB+k=
POSTGRES_PASSWORD=/+w+kvEJBHgxgdyupKTqg8EhyQfvlKIy
```

⚠️ **PENTING**: Copy secrets ini sekarang! Akan digunakan di step berikutnya.

---

## 📝 Step-by-Step Guide

### Step 1: Login ke Coolify

1. Buka browser, akses: **https://cf.avolut.com**
2. Login dengan credentials Anda
3. Anda akan masuk ke dashboard Coolify

---

### Step 2: Buat Project Baru (Optional)

1. Klik **Projects** di sidebar kiri
2. Klik **+ New Project** (atau gunakan existing project)
3. Isi:
   - Name: `Lumiku`
   - Description: `Lumiku App - Development & Production`
4. Klik **Create**

---

### Step 3: Buat Application untuk Development

1. Di dashboard, klik **+ New Resource**
2. Pilih **Application**
3. Pilih **Public Repository**

**Configuration:**

```
Repository URL: https://github.com/yoppiari/superlumiku.git
```

4. Klik **Continue**

---

### Step 4: Configure Application

Di halaman konfigurasi:

#### Basic Settings:
```
Name: Lumiku Development
Description: Development environment for dev.lumiku.com
```

#### Build Settings:
```
Branch: development
Build Pack: Docker Compose
Docker Compose File: docker-compose.dev.yml
Base Directory: / (root)
```

#### Server:
- Pilih server yang tersedia
- Atau gunakan default server

5. Klik **Save**

---

### Step 5: Configure Domain

1. Di halaman application, klik tab **Domains**
2. Klik **+ Add Domain**
3. Isi:
   ```
   Domain: dev.lumiku.com
   ```
4. Toggle **Generate SSL Certificate** → ON ✅
5. Klik **Save**

⏰ **Note**: SSL certificate akan di-generate otomatis oleh Let's Encrypt (2-5 menit)

---

### Step 6: Set Environment Variables

1. Klik tab **Environment Variables**
2. Klik **+ Add Variable** atau **Bulk Edit**

**Copy-paste ini** (sudah include generated secrets!):

```env
# Database Configuration
POSTGRES_USER=lumiku_dev
POSTGRES_PASSWORD=/+w+kvEJBHgxgdyupKTqg8EhyQfvlKIy
POSTGRES_DB=lumiku_development
DATABASE_URL=postgresql://lumiku_dev:/+w+kvEJBHgxgdyupKTqg8EhyQfvlKIy@postgres:5432/lumiku_development?schema=public
POSTGRES_HOST=postgres

# Server Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=r4mjmVg4AgSZZyM3NfMvXtRKJX7Q9YrVlPtxX2cLB+k=
JWT_EXPIRES_IN=7d

# Payment Gateway (Duitku Sandbox)
DUITKU_MERCHANT_CODE=DS25180
DUITKU_API_KEY=55e33f1d71cc5ed5ce8b5abab54fc7ae
DUITKU_ENV=sandbox
DUITKU_CALLBACK_URL=https://dev.lumiku.com/api/mainapp/payment/callback
DUITKU_RETURN_URL=https://dev.lumiku.com

# AI Services (GANTI dengan API key Anda!)
ANTHROPIC_API_KEY=your-anthropic-api-key-here
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

⚠️ **IMPORTANT**: Ganti `ANTHROPIC_API_KEY` dengan API key Anda yang sebenarnya!

3. Klik **Save**

---

### Step 7: Configure Auto-Deploy (GitHub Integration)

1. Klik tab **Source** atau **Git**
2. Toggle **Auto Deploy on Push** → ON ✅
3. Pastikan branch: `development`
4. Klik **Save**

**Optional - Webhook:**
- Coolify akan otomatis setup webhook ke GitHub
- Cek di: GitHub → Repository → Settings → Webhooks
- Seharusnya ada webhook dari Coolify

---

### Step 8: Deploy Application! 🚀

1. Klik tab **Deployments**
2. Klik tombol **Deploy** (biasanya di kanan atas)
3. Coolify akan mulai:
   - Clone repository
   - Pull Docker images
   - Build containers
   - Start services

**Monitor Logs:**
- Tab **Logs** akan menampilkan real-time logs
- Tunggu hingga selesai (biasanya 5-10 menit untuk first deploy)

**Success Indicators:**
```
✅ Building...
✅ Starting services...
✅ postgres is healthy
✅ redis is healthy
✅ app is healthy
✅ Deployment successful!
```

---

### Step 9: Run Database Migrations

Setelah deployment selesai dan container running:

#### Via Coolify Terminal:

1. Klik tab **Terminal** atau **Console**
2. Pilih container: `app` (lumiku-dev-app)
3. Jalankan commands berikut satu per satu:

```bash
# Run Prisma migrations
bunx prisma migrate deploy

# Generate Prisma Client
bunx prisma generate

# Create test user
bun run backend/scripts/create-test-user.ts
```

#### Atau via SSH (jika Anda punya akses SSH ke server):

```bash
# Exec ke container
docker exec -it lumiku-dev-app bash

# Run migrations
bunx prisma migrate deploy
bunx prisma generate
bun run backend/scripts/create-test-user.ts

# Exit container
exit
```

---

### Step 10: Verify Deployment ✅

#### Test Health Endpoint:

```bash
curl https://dev.lumiku.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-09T..."
}
```

#### Test di Browser:

1. Buka: **https://dev.lumiku.com**
2. Seharusnya muncul login page
3. Login dengan test user:
   ```
   Email: test@example.com
   Password: password123
   ```

#### Check Services:

```bash
# Check all containers
docker ps | grep lumiku-dev

# Expected output:
# lumiku-dev-app       (running)
# lumiku-dev-postgres  (running)
# lumiku-dev-redis     (running)
```

---

## ✅ Setup Complete Checklist

- [ ] Login ke Coolify dashboard
- [ ] Project created (optional)
- [ ] Application created dengan repository
- [ ] Branch set ke `development`
- [ ] Build pack: Docker Compose
- [ ] Docker compose file: `docker-compose.dev.yml`
- [ ] Domain `dev.lumiku.com` added
- [ ] SSL certificate enabled
- [ ] Environment variables configured
- [ ] ANTHROPIC_API_KEY replaced dengan real key
- [ ] Auto-deploy enabled untuk branch `development`
- [ ] Deployment successful
- [ ] Database migrations run
- [ ] Test user created
- [ ] Health check passing (curl)
- [ ] Can access via browser
- [ ] Can login with test user

---

## 🔧 Troubleshooting

### ❌ Build Failed

**Check:**
1. Tab **Logs** → lihat error message
2. Pastikan `docker-compose.dev.yml` syntax benar
3. Pastikan semua environment variables set

**Fix:**
- Klik **Redeploy** setelah fix issues

### ❌ Container Won't Start

**Check logs:**
```bash
docker logs lumiku-dev-app
```

**Common issues:**
- Database not ready → tunggu sebentar, database butuh waktu startup
- Missing env variables → double check Step 6
- Port conflicts → pastikan port 80 tidak digunakan

### ❌ SSL Certificate Error

**Wait**: Let's Encrypt butuh 2-5 menit untuk provision certificate

**Manual refresh:**
1. Tab **Domains**
2. Klik **Regenerate Certificate**

### ❌ Database Connection Error

**Check:**
```bash
# Test database connection
docker exec lumiku-dev-postgres pg_isready -U lumiku_dev

# Should return: accepting connections
```

**Fix:**
1. Pastikan `DATABASE_URL` benar
2. Pastikan password matching
3. Restart database: `docker restart lumiku-dev-postgres`

### ❌ 502 Bad Gateway

**Causes:**
- App container belum sehat
- App crash saat startup
- Port mapping salah

**Check:**
```bash
# Check app logs
docker logs lumiku-dev-app

# Check if app is listening
docker exec lumiku-dev-app netstat -tlnp | grep 80
```

---

## 📊 Post-Deployment

### Monitor Logs

**Real-time logs:**
1. Coolify Dashboard → Application → Logs
2. Select service:
   - `app` → Application logs
   - `postgres` → Database logs
   - `redis` → Redis logs

**Via command line:**
```bash
docker logs -f lumiku-dev-app
docker logs -f lumiku-dev-postgres
docker logs -f lumiku-dev-redis
```

### Check Container Status

```bash
# All containers
docker ps

# Specific check
docker inspect lumiku-dev-app | grep -i health
```

### Database Management

**Connect to database:**
```bash
docker exec -it lumiku-dev-postgres psql -U lumiku_dev -d lumiku_development
```

**Common queries:**
```sql
-- List tables
\dt

-- Check users
SELECT * FROM "User";

-- Check credits
SELECT email, credits FROM "User";

-- Exit
\q
```

---

## 🔄 Auto-Deploy Testing

Test auto-deploy dengan membuat perubahan kecil:

```bash
# Di terminal lokal
cd "C:\Users\yoppi\Downloads\Lumiku App"

# Buat perubahan kecil (contoh)
echo "# Test auto-deploy" >> README.md

# Commit dan push
git add README.md
git commit -m "test: auto-deploy"
git push origin development

# Monitor di Coolify
# Tab "Deployments" akan otomatis show new deployment!
```

---

## 🎯 Next Steps

Setelah dev.lumiku.com running:

1. ✅ Test semua features:
   - Login/Register
   - Dashboard
   - Poster Editor
   - Video Generator
   - Payment (sandbox)

2. ✅ Fix bugs di development

3. ✅ Push updates (auto-deploy!)

4. ⏳ Setelah stable, setup production (app.lumiku.com)

---

## 📞 Quick Reference

**Coolify Dashboard:**
```
https://cf.avolut.com
```

**Development Site:**
```
https://dev.lumiku.com
```

**Health Check:**
```bash
curl https://dev.lumiku.com/health
```

**Test Login:**
```
Email: test@example.com
Password: password123
```

**Container Names:**
- `lumiku-dev-app`
- `lumiku-dev-postgres`
- `lumiku-dev-redis`

**Secrets:**
```
JWT_SECRET=r4mjmVg4AgSZZyM3NfMvXtRKJX7Q9YrVlPtxX2cLB+k=
POSTGRES_PASSWORD=/+w+kvEJBHgxgdyupKTqg8EhyQfvlKIy
```

---

## 🎉 Success!

Jika semua checklist ✅, congratulations! Development environment sudah running di:

**https://dev.lumiku.com**

Setiap push ke branch `development` akan otomatis deploy! 🚀

---

**Need Help?**
- Check Coolify docs: https://coolify.io/docs
- Check application logs di Coolify dashboard
- Check container logs: `docker logs <container-name>`
