# 🚀 Quick Start - Local Development

## Prerequisites
- ✅ PostgreSQL installed locally
- ✅ Redis installed (optional, for background jobs)
- ✅ Bun installed
- ✅ Node.js installed

---

## 📋 Step-by-Step Setup

### 1. Setup Local PostgreSQL Database

#### Option A: Use Docker (Easiest)
```bash
docker run --name lumiku-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lumiku_dev \
  -p 5432:5432 \
  -d postgres:15
```

#### Option B: Use Local PostgreSQL
Create database manually:
```sql
CREATE DATABASE lumiku_dev;
```

---

### 2. Configure Environment Variables

Edit `backend/.env`:

```bash
# Database (Local PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lumiku_dev?schema=public"

# Redis (Optional - for background jobs)
REDIS_HOST=localhost
REDIS_PORT=6379

# App Config
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=your-local-jwt-secret-change-this

# Payment (Duitku - use test keys)
DUITKU_MERCHANT_CODE=D28175
DUITKU_API_KEY=your-test-api-key
DUITKU_MERCHANT_USER_ID=MIDTEST

# Video Generator APIs
MODELSLAB_API_KEY=your_modelslab_key_here
EDENAI_API_KEY=your_edenai_key_here
```

---

### 3. Run Database Migration

```bash
cd backend

# Push schema to database (creates all tables)
bun prisma db push

# Or use migrations (proper way)
bun prisma migrate dev --name init
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "lumiku_dev"

🚀 Your database is now in sync with your Prisma schema.

✔ Generated Prisma Client
```

---

### 4. Create Test User

```bash
cd backend

# Create admin user with credits
bun run scripts/create-test-user.ts
```

Or manually via Prisma Studio:
```bash
bunx prisma studio
```

Then create user:
- Email: `test@example.com`
- Password: (hash with bcrypt) `password123`
- Role: `admin`
- Add 1000 credits

---

### 5. Start Backend

```bash
cd backend
bun run dev
```

**Expected Output:**
```
✅ Database connected successfully
✅ Storage initialized: uploads/

📦 Loading Video Generation Providers...
✅ Video Provider registered: ModelsLab (5 models)
✅ Video Provider registered: EdenAI (3 models)

✅ Loaded 8 video providers with 8 total models

📦 Loaded 4 plugins
✅ Enabled: 4
🚀 Dashboard apps: 4

✅ Plugin registered: Video Mixer (video-mixer)
✅ Plugin registered: Carousel Mix (carousel-mix)
✅ Plugin registered: Looping Flow (looping-flow)
✅ Plugin registered: AI Video Generator (video-generator)

🚀 Server running on http://localhost:3000
📝 Environment: development
🔗 CORS Origin: http://localhost:5173
```

---

### 6. Start Frontend

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### 7. Access Application

Open browser: **http://localhost:5173**

Login with:
- Email: `test@example.com`
- Password: `password123`

---

## 🎯 Verify Installation

### Check Backend Health
```bash
curl http://localhost:3000/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-06T..."
}
```

### Check Apps Endpoint
```bash
curl http://localhost:3000/api/apps
```

**Expected:**
```json
{
  "apps": [
    {
      "appId": "video-mixer",
      "name": "Video Mixer",
      "icon": "video",
      "color": "blue",
      "order": 5
    },
    {
      "appId": "carousel-mix",
      "name": "Carousel Mix",
      "icon": "layers",
      "color": "blue",
      "order": 6
    },
    {
      "appId": "video-generator",
      "name": "AI Video Generator",
      "icon": "film",
      "color": "purple",
      "order": 4
    }
  ]
}
```

### Check Video Generator Models
```bash
curl http://localhost:3000/api/apps/video-generator/models \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Troubleshooting

### "No apps available yet" in Dashboard

**Cause:** Backend not running or not returning apps

**Solution:**
1. Check backend is running: `curl http://localhost:3000/health`
2. Check backend console for plugin load messages
3. Check frontend is calling correct backend URL

### "Cannot connect to database"

**Cause:** PostgreSQL not running or wrong credentials

**Solution:**
1. Check PostgreSQL is running: `pg_isready -h localhost`
2. Verify DATABASE_URL in `.env`
3. Test connection: `bun prisma db push`

### "Video generation stuck in pending"

**Cause:** Redis not running (worker can't process jobs)

**Solution:**
1. Start Redis: `redis-server` (or use Docker)
2. Restart backend
3. Check worker logs in console

### Tables don't exist

**Cause:** Migration not run

**Solution:**
```bash
cd backend
bun prisma db push
```

---

## 📚 Optional: Redis Setup (For Background Jobs)

### Using Docker
```bash
docker run --name lumiku-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

### Verify Redis
```bash
redis-cli ping
# Should return: PONG
```

---

## 🎯 Quick Command Summary

```bash
# 1. Start PostgreSQL (Docker)
docker run --name lumiku-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# 2. Start Redis (Docker)
docker run --name lumiku-redis -p 6379:6379 -d redis:7-alpine

# 3. Setup database
cd backend
bun prisma db push

# 4. Start backend
bun run dev

# 5. Start frontend (new terminal)
cd frontend
npm run dev

# 6. Open browser
# http://localhost:5173
```

---

## 🎉 You're Ready!

After setup, you should see:
- ✅ Dashboard with 4 apps (Video Mixer, Carousel Mix, Looping Flow, Video Generator)
- ✅ Login working
- ✅ Credits system working
- ✅ All apps accessible

---

## 📝 Notes for Production

**IMPORTANT:** Konfigurasi ini HANYA untuk development lokal.

Untuk production (Coolify):
- ✅ DATABASE_URL sudah diset di Coolify environment variables
- ✅ PostgreSQL service sudah running di Coolify
- ✅ Migration di-run otomatis saat deployment
- ✅ Redis service sudah configured

**DO NOT** change production configuration!

---

**Development Time:** ~10 minutes
**Difficulty:** Easy
**Prerequisites:** PostgreSQL + Redis (optional)
