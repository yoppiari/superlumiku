# ✅ Setup Complete: Dual Environment Ready!

## 🎯 Yang Sudah Dilakukan

### 1. ✅ GitHub Setup
- Branch `development` sudah dibuat dan pushed ke GitHub
- Repository: https://github.com/yoppiari/superlumiku.git
- Commit hash: 1123e8c

### 2. ✅ File Konfigurasi Lengkap
- **Development**: `.env.development` (untuk dev.lumiku.com)
- **Production**: `.env.production` (untuk app.lumiku.com)
- **Docker Dev**: `docker-compose.dev.yml`
- **Docker Prod**: `docker-compose.prod.yml`

### 3. ✅ Dokumentasi Lengkap
- `DUAL_ENVIRONMENT_SETUP.md` - Panduan lengkap dual environment
- `COOLIFY_DEV_SETUP_GUIDE.md` - Panduan Coolify deployment

---

## 🚀 Langkah Selanjutnya (Setup di Coolify)

### Setup Development (dev.lumiku.com)

1. **Login ke Coolify**
   ```
   URL: https://cf.avolut.com
   ```

2. **Buat Application Baru**
   - Klik **+ New Application**
   - Pilih **Public Repository**
   - Repository: `https://github.com/yoppiari/superlumiku.git`
   - Branch: `development`
   - Name: `Lumiku Development`
   - Build Pack: `Docker Compose`
   - Docker Compose File: `docker-compose.dev.yml`

3. **Setup Domain**
   - Tab **Domains**
   - Add: `dev.lumiku.com`
   - Enable SSL/HTTPS ✅
   - Save

4. **Generate Secrets**
   ```bash
   # Di terminal lokal, jalankan:
   openssl rand -base64 32  # untuk JWT_SECRET
   openssl rand -base64 24  # untuk POSTGRES_PASSWORD
   ```

5. **Setup Environment Variables**

   Di Coolify, tab **Environment Variables**, paste ini (ganti `<...>`):

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

   # AI Services (ganti dengan API key Anda)
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

6. **Deploy!**
   - Klik **Deploy** 🚀
   - Monitor logs
   - Tunggu status: ✅ **Deployed**

7. **Enable Auto-Deploy**
   - Tab **Source**
   - Enable **Auto Deploy on Push** ✅
   - Branch: `development`

8. **Run Migrations**
   ```bash
   # Via Coolify Terminal
   docker exec -it lumiku-dev-app bash
   bunx prisma migrate deploy
   bunx prisma generate
   bun run backend/scripts/create-test-user.ts
   ```

9. **Test!**
   ```
   https://dev.lumiku.com
   ```

---

### Setup Production (app.lumiku.com) - Nanti Setelah Testing

1. **Merge Development ke Main**
   ```bash
   git checkout main
   git merge development
   git push origin main
   ```

2. **Buat Application BARU di Coolify**
   - ⚠️ **PENTING**: Buat application terpisah!
   - Repository: sama
   - Branch: `main`
   - Name: `Lumiku Production`
   - Docker Compose File: `docker-compose.prod.yml`

3. **Setup Domain**
   - Add: `app.lumiku.com`
   - Enable SSL/HTTPS

4. **Generate NEW Secrets untuk Production**
   ```bash
   openssl rand -base64 32  # JWT_SECRET production
   openssl rand -base64 32  # POSTGRES_PASSWORD production
   ```

5. **Setup Environment Variables**
   - Gunakan `.env.production` sebagai template
   - ⚠️ **Ganti semua values production!**
   - Jangan gunakan secrets yang sama dengan development!
   - Ganti Duitku ke production credentials
   - Ganti semua API keys ke production

6. **Deploy Production**
   - Klik **Deploy**
   - Enable **Auto Deploy on Push** untuk branch `main`

---

## 📊 Environment Overview

| Aspect | Development | Production |
|--------|------------|------------|
| **Domain** | dev.lumiku.com | app.lumiku.com |
| **Branch** | `development` | `main` |
| **Docker Compose** | docker-compose.dev.yml | docker-compose.prod.yml |
| **Env File** | .env.development | .env.production |
| **Duitku** | Sandbox (DS25180) | Production (TBD) |
| **Database** | lumiku_development | lumiku_production |
| **Container Prefix** | lumiku-dev-* | lumiku-* |
| **Ports (local)** | 5433, 6380 | 5432, 6379 |
| **Rate Limit** | 100 req/15min | 50 req/15min |

---

## 🔄 Daily Workflow

### Development:
```bash
# 1. Make changes
git checkout development
# ... edit code ...

# 2. Test locally (optional)
docker-compose -f docker-compose.dev.yml up --build

# 3. Commit dan push
git add .
git commit -m "feat: add new feature"
git push origin development

# 4. Auto-deploy ke dev.lumiku.com! 🎉
```

### Release to Production:
```bash
# 1. Pastikan semua sudah tested di dev.lumiku.com

# 2. Merge ke main
git checkout main
git merge development

# 3. Push
git push origin main

# 4. Auto-deploy ke app.lumiku.com! 🚀
```

---

## 🧪 Testing

### Endpoint untuk Test:

**Development:**
```bash
# Health check
curl https://dev.lumiku.com/health

# Login
curl -X POST https://dev.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Dashboard
curl https://dev.lumiku.com/api/mainapp/apps
```

**Production (nanti):**
```bash
# Health check
curl https://app.lumiku.com/health
```

---

## 📁 Project Structure

```
Lumiku App/
├── .env.development          # Dev environment config ✅
├── .env.production           # Prod environment config ✅
├── docker-compose.dev.yml    # Dev Docker setup ✅
├── docker-compose.prod.yml   # Prod Docker setup ✅
├── DUAL_ENVIRONMENT_SETUP.md # Panduan lengkap ✅
├── COOLIFY_DEV_SETUP_GUIDE.md # Coolify guide ✅
│
├── backend/
│   ├── src/
│   │   ├── apps/
│   │   │   ├── poster-editor/  # Poster Editor app ✅
│   │   │   └── video-generator/ # Video Generator app ✅
│   │   └── lib/
│   │       └── sam/            # SAM integration ✅
│   ├── scripts/
│   │   ├── create-test-user.ts  # Create test user ✅
│   │   └── add-credits.ts       # Add credits ✅
│   └── prisma/
│       └── schema.prisma        # Database schema ✅
│
└── frontend/
    └── src/
        ├── apps/
        │   ├── PosterEditor.tsx    # Poster Editor UI ✅
        │   └── VideoGenerator.tsx  # Video Generator UI ✅
        └── lib/
            └── imageUrl.ts         # Image URL helper ✅
```

---

## 🔐 Security Notes

### Development:
- ✅ Duitku Sandbox mode
- ✅ Weak secrets OK (tapi generate random!)
- ✅ Relaxed rate limiting

### Production:
- ⚠️ **HARUS** gunakan Duitku Production
- ⚠️ **HARUS** strong secrets (min 32 chars)
- ⚠️ **HARUS** different dari development
- ⚠️ Stricter rate limiting
- ⚠️ Regular backups
- ⚠️ Monitor logs regularly

---

## 🎉 Next Actions

**Sekarang (Immediate):**
1. ✅ Setup dev.lumiku.com di Coolify
2. ✅ Deploy development environment
3. ✅ Test semua fitur di dev.lumiku.com
4. ✅ Fix bugs jika ada

**Nanti (After Testing):**
1. ⏳ Setup app.lumiku.com di Coolify
2. ⏳ Deploy production environment
3. ⏳ Ganti Duitku ke production
4. ⏳ Monitor production

---

## 📞 Quick Links

| Resource | URL |
|----------|-----|
| **GitHub Repo** | https://github.com/yoppiari/superlumiku |
| **Coolify Dashboard** | https://cf.avolut.com |
| **Development Site** | https://dev.lumiku.com (soon!) |
| **Production Site** | https://app.lumiku.com (later!) |

---

## ✅ Checklist

### Development Setup:
- [x] Branch `development` created and pushed
- [ ] Application created in Coolify
- [ ] Domain `dev.lumiku.com` configured
- [ ] Environment variables set
- [ ] Deployed successfully
- [ ] Auto-deploy enabled
- [ ] Database migrations run
- [ ] Test user created
- [ ] Health check passing
- [ ] All features tested

### Production Setup (Later):
- [ ] Tested thoroughly in development
- [ ] Merged to `main` branch
- [ ] Application created in Coolify
- [ ] Domain `app.lumiku.com` configured
- [ ] Production environment variables set
- [ ] Production Duitku credentials configured
- [ ] Deployed successfully
- [ ] Auto-deploy enabled
- [ ] Database migrations run
- [ ] Production tested
- [ ] Monitoring setup

---

## 🎊 Summary

**Siap Deploy!** 🚀

Semua file dan konfigurasi sudah lengkap. Tinggal:
1. Setup di Coolify dashboard untuk `dev.lumiku.com`
2. Test di development
3. Nanti setup production di `app.lumiku.com`

**Files Created:**
- ✅ `.env.development` - Dev environment
- ✅ `.env.production` - Production template
- ✅ `docker-compose.dev.yml` - Dev Docker config
- ✅ `DUAL_ENVIRONMENT_SETUP.md` - Complete guide
- ✅ `COOLIFY_DEV_SETUP_GUIDE.md` - Coolify guide

**Git Status:**
- ✅ Committed: 1123e8c
- ✅ Pushed to: origin/development
- ✅ Ready for Coolify deployment!

---

**Happy Deploying! 🎉**
