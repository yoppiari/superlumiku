# 🚀 Quick Start: Redis Setup for Local Development

**Goal:** Get Redis running locally in 5 minutes for video processing.

---

## For Windows Users (Local Dev)

### Step 1: Download Memurai (2 minutes)

1. Open: https://www.memurai.com/get-memurai
2. Click **"Download Memurai Developer"** (Free)
3. Run installer: `memurai-developer-setup.exe`
4. Keep all defaults, click Next → Next → Install

### Step 2: Verify Installation (30 seconds)

Open new terminal:
```bash
memurai-cli ping
```

Expected output: `PONG` ✅

### Step 3: Test Connection (30 seconds)

```bash
cd backend
bun test-redis.ts
```

Expected output:
```
✅ SET operation successful
✅ GET operation successful
✅ DEL operation successful

🎉 Redis connection is working perfectly!
```

### Step 4: Restart Backend (1 minute)

**Stop current backend servers:**
- Find terminals running `bun run dev`
- Press `Ctrl+C` to stop each one

**Start fresh:**
```bash
# Terminal 1: Backend
cd backend
bun run dev

# Should see:
# ✅ Redis connected
# ✅ Redis ready
```

### Step 5: Start Worker (30 seconds)

```bash
# Terminal 2: Worker (NEW)
cd backend
bun src/workers/video-mixer.worker.ts

# Should see:
# 🔧 Video Mixer Worker ready and listening for jobs
```

### Step 6: Test Video Generation ✅

1. Open frontend: http://localhost:5173
2. Go to Video Mixer
3. Upload some videos
4. Click "Start Processing"
5. Watch status change: pending → processing → completed
6. Download your generated videos!

---

## ⚠️ Important Notes

**For Local Development:**
- ✅ Memurai works great
- ✅ Auto-starts with Windows
- ✅ No configuration needed

**For Production:**
- ❌ DO NOT use Memurai
- ✅ Use Upstash, Redis Cloud, or AWS ElastiCache
- ✅ See `TODO_REDIS_SETUP.md` for cloud options

---

## 🐛 Troubleshooting

**Problem:** `memurai-cli ping` fails

**Solution:**
```bash
# Start Memurai service
net start Memurai

# Check status
sc query Memurai
```

**Problem:** Backend shows "Redis NOT configured"

**Solution:**
1. Restart terminal (close all terminals)
2. Open new terminal
3. Run `bun run dev` again

**Problem:** Worker can't connect to queue

**Solution:**
1. Stop worker (Ctrl+C)
2. Verify Redis: `memurai-cli ping`
3. Start worker again: `bun src/workers/video-mixer.worker.ts`

---

## 📊 Current Status Check

**Redis Working:**
```
✅ Redis connected
✅ Redis ready
```

**Redis NOT Working:**
```
⚠️  Redis NOT configured - Video processing disabled
   See TODO_REDIS_SETUP.md for setup instructions
```

---

**Time to Complete:** ~5 minutes
**Difficulty:** Easy
**For:** Local Development Only
