# ⚠️ IMPORTANT: Redis Setup Required for Video Processing

**Status:** 🔴 NOT CONFIGURED - Application running in DEV mode without Redis

---

## 🎯 What You Need To Do

Video processing currently **will not work** because Redis queue system is not setup. You need to setup Redis before you can generate videos.

---

## 🚨 Development vs Production

- **Local Development:** Use Memurai (Option 3) - Easiest for Windows
- **Production/Staging:** Use Upstash or Redis Cloud (Option 1) - Reliable, scalable
- **Team Development:** Use Docker (Option 2) or Cloud - Consistent across team

**⚠️ Important:** Memurai is for **local development only**. For production deployment, use cloud Redis (Upstash, Redis Cloud, AWS ElastiCache, etc.)

---

## 📋 Quick Setup (Choose ONE option)

### Option 1: Cloud Redis - Upstash (Easiest, Recommended) ⭐

**Time:** 2 minutes
**Cost:** Free (10,000 commands/day)

1. **Sign up:** https://upstash.com/ (use Google/GitHub)
2. **Create Database:**
   - Click "Create Database"
   - Name: `lumiku-redis`
   - Region: Singapore or Tokyo (closest to you)
   - Type: **Free**
   - Click "Create"

3. **Get Connection Details:**
   - Click your database
   - Copy these values:
     ```
     Endpoint: gusc1-xxx-xxx-12345.upstash.io
     Port: 6379
     Password: AXxxx...xxx (long string)
     ```

4. **Update `.env` file:**
   ```bash
   # Open: backend/.env
   # Replace these lines:
   REDIS_HOST="gusc1-xxx-xxx-12345.upstash.io"
   REDIS_PORT="6379"
   REDIS_PASSWORD="your-password-from-upstash"
   ```

5. **Restart Backend:**
   ```bash
   # Stop current backend (Ctrl+C)
   cd backend
   bun run dev
   ```

6. **Start Worker:**
   ```bash
   # New terminal
   cd backend
   bun src/workers/video-mixer.worker.ts
   ```

---

### Option 2: Docker (If you have Docker installed)

```bash
# Run Redis container
docker run -d --name redis-lumiku -p 6379:6379 redis:alpine

# Verify it's running
docker ps | grep redis

# .env already configured for localhost, just restart backend
```

---

### Option 3: Native Installation (Windows - Memurai) ⭐ **RECOMMENDED FOR LOCAL DEV**

**Memurai** is Redis for Windows - 100% compatible, runs as Windows service.

1. **Download:**
   - Visit: https://www.memurai.com/get-memurai
   - Click "Download Memurai Developer" (Free, no credit card)
   - File size: ~15MB

2. **Install:**
   - Run installer (memurai-developer-setup.exe)
   - Keep all default settings
   - Port: 6379 (default)
   - No password needed for local dev

3. **Verify Installation:**
   ```bash
   # Open new terminal (after install)
   memurai-cli ping
   # Should return: PONG
   ```

4. **Start Service (Auto-starts after install):**
   ```bash
   # Check if running
   sc query Memurai

   # If not running, start it:
   net start Memurai
   ```

5. **.env is already configured!**
   ```bash
   REDIS_HOST="localhost"
   REDIS_PORT="6379"
   REDIS_PASSWORD=""
   ```

6. **Test Connection:**
   ```bash
   cd backend
   bun test-redis.ts
   ```

7. **Restart Backend:**
   ```bash
   # Stop current backend (Ctrl+C in terminal 42117c, ea5220, 3aba08)
   # Then start again:
   cd backend
   bun run dev

   # You should see:
   # ✅ Redis connected
   # ✅ Redis ready
   ```

**That's it!** Memurai runs as Windows service, auto-starts with PC.

---

## 🧪 Testing

After Redis is setup, test it:

```bash
cd backend
bun test-redis.ts
```

Expected output:
```
✅ Redis connected
✅ Redis ready
✅ SET operation successful
✅ GET operation successful
✅ DEL operation successful

🎉 Redis connection is working!
```

---

## 🚀 Running Full System

Once Redis is setup:

```bash
# Terminal 1: Backend API
cd backend
bun run dev

# Terminal 2: Worker (NEW - for video processing)
cd backend
bun src/workers/video-mixer.worker.ts

# Terminal 3: Frontend
cd frontend
bun run dev
```

---

## 📊 What Happens Without Redis?

- ✅ **Still Works:** All other features (projects, uploads, settings)
- ❌ **Won't Work:** Video generation (will create generation record but won't process)
- ⚠️ **Status:** Generations will stay "pending" forever

---

## 🔍 How to Check if Redis is Working

1. **Redis Connection:**
   - Backend logs should show: `✅ Redis connected`
   - If error: Check REDIS_HOST, REDIS_PORT, REDIS_PASSWORD in .env

2. **Worker Process:**
   - Worker logs should show: `🔧 Video Mixer Worker ready and listening for jobs`
   - If not running: Start with `bun src/workers/video-mixer.worker.ts`

3. **Generate Videos:**
   - Click "Start Processing"
   - Status should change: pending → processing → completed
   - If stuck on "pending": Worker is not running or Redis not connected

---

## 📚 Detailed Documentation

- **Redis Setup Guide:** `/docs/REDIS_SETUP_GUIDE.md`
- **Architecture Guide:** `/docs/VIDEO_PROCESSING_ARCHITECTURE.md`
- **Troubleshooting:** See REDIS_SETUP_GUIDE.md

---

## 🔗 Quick Links

- Upstash: https://upstash.com/
- Memurai (Windows): https://www.memurai.com/
- Docker: https://www.docker.com/products/docker-desktop
- FFmpeg (already installed ✅)

---

## ⏰ Reminder

**Before deploying to production**, you MUST setup Redis. The application will not process videos without it.

**Estimated Setup Time:** 2-5 minutes (depending on option chosen)

---

## 🚀 Production Deployment Checklist

Before going to production:

- [ ] **DO NOT use Memurai in production** - It's for local dev only
- [ ] Setup cloud Redis (Upstash, Redis Cloud, AWS ElastiCache)
- [ ] Use strong password for Redis
- [ ] Enable TLS/SSL for Redis connection
- [ ] Set appropriate `maxmemory` and eviction policy
- [ ] Enable persistence (RDB or AOF)
- [ ] Setup monitoring and alerts
- [ ] Configure worker auto-restart (PM2, systemd, etc.)
- [ ] Test failover scenarios

**Recommended for Production:**
- Upstash Redis (serverless, auto-scaling)
- Redis Cloud (managed service)
- AWS ElastiCache (if on AWS)
- Azure Cache for Redis (if on Azure)

---

**Last Updated:** 2025-10-02
**Priority:** 🔴 HIGH - Required for video processing feature
**Environment:**
- ✅ Development: Memurai (local)
- ⚠️ Production: Cloud Redis only
