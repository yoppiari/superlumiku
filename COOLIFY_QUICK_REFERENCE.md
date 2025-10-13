# 📝 Coolify Setup - Quick Reference Card

## 🔐 Secrets (Development)

```
JWT_SECRET=r4mjmVg4AgSZZyM3NfMvXtRKJX7Q9YrVlPtxX2cLB+k=
POSTGRES_PASSWORD=/+w+kvEJBHgxgdyupKTqg8EhyQfvlKIy
```

---

## 📋 Application Config

| Setting | Value |
|---------|-------|
| **Repository** | https://github.com/yoppiari/superlumiku.git |
| **Branch** | development |
| **Name** | Lumiku Development |
| **Build Pack** | Docker Compose |
| **Docker Compose File** | docker-compose.dev.yml |
| **Domain** | dev.lumiku.com |
| **SSL** | ✅ Enabled (Let's Encrypt) |
| **Auto-Deploy** | ✅ Enabled |

---

## 🔧 Environment Variables (Copy-Paste)

```env
POSTGRES_USER=lumiku_dev
POSTGRES_PASSWORD=/+w+kvEJBHgxgdyupKTqg8EhyQfvlKIy
POSTGRES_DB=lumiku_development
DATABASE_URL=postgresql://lumiku_dev:/+w+kvEJBHgxgdyupKTqg8EhyQfvlKIy@postgres:5432/lumiku_development?schema=public
POSTGRES_HOST=postgres
NODE_ENV=development
PORT=3000
JWT_SECRET=r4mjmVg4AgSZZyM3NfMvXtRKJX7Q9YrVlPtxX2cLB+k=
JWT_EXPIRES_IN=7d
DUITKU_MERCHANT_CODE=DS25180
DUITKU_API_KEY=55e33f1d71cc5ed5ce8b5abab54fc7ae
DUITKU_ENV=sandbox
DUITKU_CALLBACK_URL=https://dev.lumiku.com/api/mainapp/payment/callback
DUITKU_RETURN_URL=https://dev.lumiku.com
ANTHROPIC_API_KEY=your-anthropic-api-key-here
MODELSLAB_API_KEY=LUQAR899Uwep23PdtlokPOmge7qLGI9UQtNRk3BfPlBHZM5NxIUXxiUJgbwS
EDENAI_API_KEY=
UPLOAD_PATH=./uploads
OUTPUT_PATH=./outputs
MAX_FILE_SIZE=524288000
UPLOAD_DIR=./uploads
OUTPUT_DIR=./uploads/outputs
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
CORS_ORIGIN=https://dev.lumiku.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

⚠️ **GANTI**: `ANTHROPIC_API_KEY` dengan key Anda!

---

## 🚀 Post-Deploy Commands

```bash
# Run migrations
bunx prisma migrate deploy

# Generate Prisma Client
bunx prisma generate

# Create test user
bun run backend/scripts/create-test-user.ts
```

---

## ✅ Test Endpoints

```bash
# Health check
curl https://dev.lumiku.com/health

# Login test
curl -X POST https://dev.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 📊 Test Login

```
Email: test@example.com
Password: password123
```

---

## 🔗 URLs

- **Coolify**: https://cf.avolut.com
- **Dev Site**: https://dev.lumiku.com
- **GitHub**: https://github.com/yoppiari/superlumiku

---

## ⚡ Quick Commands

```bash
# Check containers
docker ps | grep lumiku-dev

# View logs
docker logs -f lumiku-dev-app

# Database console
docker exec -it lumiku-dev-postgres psql -U lumiku_dev -d lumiku_development

# App console
docker exec -it lumiku-dev-app bash

# Restart services
docker restart lumiku-dev-app
docker restart lumiku-dev-postgres
docker restart lumiku-dev-redis
```

---

## 📝 Checklist

- [ ] Login ke https://cf.avolut.com
- [ ] Create application (Public Repository)
- [ ] Set repository + branch `development`
- [ ] Set Docker Compose file: `docker-compose.dev.yml`
- [ ] Add domain: `dev.lumiku.com`
- [ ] Enable SSL
- [ ] Add environment variables (copy dari atas)
- [ ] Ganti ANTHROPIC_API_KEY
- [ ] Enable auto-deploy
- [ ] Click Deploy
- [ ] Wait for deployment (5-10 min)
- [ ] Run migrations (bunx prisma migrate deploy)
- [ ] Generate Prisma (bunx prisma generate)
- [ ] Create test user (bun run backend/scripts/create-test-user.ts)
- [ ] Test health: curl https://dev.lumiku.com/health
- [ ] Test login via browser
- [ ] ✅ DONE!
