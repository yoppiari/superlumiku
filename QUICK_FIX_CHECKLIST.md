# ⚡ QUICK FIX CHECKLIST - Avatar Creator Infrastructure

**CRITICAL BLOCKERS PREVENTING AVATAR CREATOR FROM WORKING**

---

## 🚨 STEP 1: Install Docker Desktop (EASIEST OPTION)

### Windows 10/11 Pro/Enterprise/Education:
```
1. Download: https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop
3. Restart computer if prompted
4. Open Docker Desktop → Wait for "Docker is running"
```

### Windows Home:
```
Option 1: Upgrade to Pro (if possible)
Option 2: Install PostgreSQL + Memurai natively (see full guide)
```

---

## 🚀 STEP 2: Start PostgreSQL + Redis with Docker

```powershell
# Open PowerShell in: C:\Users\yoppi\Downloads\Lumiku App\backend

# Start only database services (NOT the full app)
docker-compose up -d postgres redis

# Check they're running
docker-compose ps

# Expected output:
# lumiku-postgres    running
# lumiku-redis       running
```

---

## 🔑 STEP 3: Get HuggingFace API Key

```
1. Go to: https://huggingface.co/settings/tokens
2. Login or create free account
3. Click "New token"
4. Name: lumiku-avatar
5. Type: READ
6. Copy token (starts with hf_...)
```

---

## ✏️ STEP 4: Update .env File

```powershell
# Edit: C:\Users\yoppi\Downloads\Lumiku App\backend\.env
# Find line 32 and replace with your actual key:

HUGGINGFACE_API_KEY="hf_YOUR_ACTUAL_KEY_HERE"
```

---

## 🗄️ STEP 5: Run Database Migrations

```powershell
cd "C:\Users\yoppi\Downloads\Lumiku App\backend"

# Apply migrations
bun run prisma migrate deploy

# Seed database with Avatar Creator models
bun run prisma db seed

# Expected: "Avatar Creator models seeded successfully"
```

---

## 🖥️ STEP 6: Start Backend Server

```powershell
# In PowerShell window #1
cd "C:\Users\yoppi\Downloads\Lumiku App\backend"
bun run dev

# Expected output:
# ✅ Database connected successfully
# ✅ Redis connected successfully
# 🚀 Server running on http://localhost:3000
```

**IMPORTANT**: Leave this window open!

---

## 🤖 STEP 7: Start Avatar Worker

```powershell
# In PowerShell window #2 (NEW WINDOW)
cd "C:\Users\yoppi\Downloads\Lumiku App\backend"
bun run src/apps/avatar-creator/workers/avatar-generator.worker.ts

# Expected output:
# 🚀 Avatar Generator Worker started

# If you see "Redis not enabled" - Go back to Step 2
```

**IMPORTANT**: Leave this window open!

---

## ✅ STEP 8: Verify Everything Works

### Test 1: Check Services
```powershell
# All should return "LISTENING":
netstat -an | findstr "5433 6380 3000"

# Expected:
# TCP    127.0.0.1:5433         LISTENING  (PostgreSQL)
# TCP    127.0.0.1:6380         LISTENING  (Redis)
# TCP    127.0.0.1:3000         LISTENING  (Backend)
```

### Test 2: Open Avatar Creator
```
1. Open browser: http://localhost:3000
2. Login to Lumiku
3. Go to Dashboard
4. Find "Avatar Creator" app
5. Click to open
6. Create new project
7. Try uploading image → Should see preview
8. Try AI generation → Should work!
```

---

## 🎯 SUCCESS CRITERIA

✅ Avatar Creator loads without errors
✅ Can create new projects
✅ Can upload images (preview shows)
✅ Can delete projects
✅ AI generation works
✅ Generated avatars appear in project

---

## 🐛 IF SOMETHING FAILS

### "Can't reach database server at localhost:5433"
```powershell
# Check Docker containers
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# View logs
docker-compose logs postgres
```

### "Redis connection failed"
```powershell
# Restart Redis
docker-compose restart redis

# Test connection
docker exec lumiku-redis redis-cli ping
# Should return: PONG
```

### "401 Unauthorized" from HuggingFace
```
→ Your API key is wrong or not set
→ Check Step 3 again
→ Make sure you copied the ENTIRE key (starts with hf_)
→ Restart backend after updating .env
```

### "Worker not processing jobs"
```
→ Make sure Worker is running (Step 7)
→ Check Worker window for errors
→ Restart Worker if needed
```

### Avatar Creator not in dashboard
```powershell
# Re-run seed
cd backend
bun run prisma db seed

# Restart backend
# Press Ctrl+C in backend window, then:
bun run dev
```

---

## 📊 QUICK STATUS CHECK

Run this to check all services:

```powershell
Write-Host "Checking infrastructure status..."

# Check PostgreSQL
if (netstat -an | findstr "5433.*LISTENING") {
    Write-Host "✅ PostgreSQL running on port 5433"
} else {
    Write-Host "❌ PostgreSQL NOT running"
}

# Check Redis
if (netstat -an | findstr "6380.*LISTENING") {
    Write-Host "✅ Redis running on port 6380"
} else {
    Write-Host "❌ Redis NOT running"
}

# Check Backend
if (netstat -an | findstr "3000.*LISTENING") {
    Write-Host "✅ Backend running on port 3000"
} else {
    Write-Host "❌ Backend NOT running"
}

# Check HuggingFace key
$env_content = Get-Content "C:\Users\yoppi\Downloads\Lumiku App\backend\.env" -Raw
if ($env_content -match 'HUGGINGFACE_API_KEY="hf_[a-zA-Z0-9]+') {
    Write-Host "✅ HuggingFace API key configured"
} else {
    Write-Host "⚠️  HuggingFace API key NOT configured"
}
```

---

## ⏱️ TIME ESTIMATE

- Docker installation: 15 minutes
- HuggingFace key: 5 minutes
- Database setup: 5 minutes
- Starting services: 2 minutes
- **Total: ~30 minutes**

---

## 🎉 DONE!

Once all 8 steps are complete:
- Avatar Creator will be **fully functional**
- No code changes needed
- No additional configuration needed

**You can now create avatars, upload images, and generate AI avatars!**

---

## 📚 DETAILED GUIDE

For troubleshooting or alternative installation methods, see:
→ `INFRASTRUCTURE_FIX_GUIDE_COMPLETE.md`
