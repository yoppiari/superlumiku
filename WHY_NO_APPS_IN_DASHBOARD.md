# ❓ Why "No apps available yet" in Dashboard?

## 🔍 Current Situation

Anda melihat dashboard dengan "No apps available yet" seperti screenshot ini:

```
┌─────────────────────────────────┐
│ Apps & Tools         View All  │
├─────────────────────────────────┤
│                                 │
│   No apps available yet         │
│                                 │
└─────────────────────────────────┘
```

## 💡 Root Cause

Dashboard menampilkan apps dari **backend API endpoint**: `GET /api/apps`

Jika backend **tidak running** atau **database tidak tersetup**, endpoint ini return empty array atau error.

---

## ✅ Solution - Quick Fix (5 menit)

### Step 1: Check Backend Status

```bash
curl http://localhost:3000/health
```

**Jika error atau no response:**
→ Backend tidak running!

### Step 2: Setup Database (One-time)

```bash
cd backend

# Setup PostgreSQL lokal (pilih salah satu):

# Option A: Docker (recommended)
docker run --name lumiku-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lumiku_dev \
  -p 5432:5432 -d postgres:15

# Option B: Use existing PostgreSQL
# Just create database: lumiku_dev
```

### Step 3: Configure .env

Edit `backend/.env`:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lumiku_dev?schema=public"
```

### Step 4: Run Migration

```bash
cd backend
bun prisma db push
```

**Expected output:**
```
🚀 Your database is now in sync with your Prisma schema. Done in 2.34s
✔ Generated Prisma Client
```

### Step 5: Create Test User

```bash
bun run scripts/create-test-user.ts
```

**Output:**
```
✅ Test user created successfully!

📧 Email: test@example.com
🔑 Password: password123
👤 Name: Test User
🎭 Role: admin
💰 Credits: 1000
```

### Step 6: Start Backend

```bash
bun run dev
```

**You should see:**
```
✅ Database connected successfully
✅ Storage initialized

📦 Loading Video Generation Providers...
✅ Video Provider registered: ModelsLab (5 models)
✅ Video Provider registered: EdenAI (3 models)

📦 Loaded 4 plugins
✅ Enabled: 4
🚀 Dashboard apps: 4

✅ Plugin registered: Video Mixer (video-mixer)
✅ Plugin registered: Carousel Mix (carousel-mix)
✅ Plugin registered: Looping Flow (looping-flow)
✅ Plugin registered: AI Video Generator (video-generator)

🚀 Server running on http://localhost:3000
```

### Step 7: Verify Apps Endpoint

```bash
curl http://localhost:3000/api/apps
```

**Expected:**
```json
{
  "apps": [
    {
      "appId": "video-generator",
      "name": "AI Video Generator",
      "description": "Generate videos from text and images using AI models",
      "icon": "film",
      "color": "purple",
      "order": 4,
      "beta": false
    },
    {
      "appId": "video-mixer",
      "name": "Video Mixer",
      ...
    },
    {
      "appId": "carousel-mix",
      "name": "Carousel Mix",
      ...
    }
  ]
}
```

### Step 8: Refresh Dashboard

1. Open browser: http://localhost:5173/dashboard
2. **Refresh page** (F5 atau Ctrl+R)
3. You should now see **4 app cards**! 🎉

---

## 🎯 Expected Result After Fix

Dashboard should show:

```
┌─────────────────────────────────────────────┐
│ Apps & Tools                     View All  │
├─────────────────────────────────────────────┤
│                                             │
│  🎬 AI Video Generator  [Purple]            │
│  Generate videos from text and images       │
│                                             │
│  📹 Video Mixer  [Blue]                     │
│  Mix multiple short videos                  │
│                                             │
│  📊 Carousel Mix  [Blue]                    │
│  Generate carousel combinations             │
│                                             │
│  🔁 Looping Flow  [Blue]                    │
│  Loop short videos into longer videos       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 Alternative: Skip Local Dev, Deploy to Production

**Jika tidak mau setup lokal**, Anda bisa langsung deploy ke production (Coolify):

### Production Setup (2 menit)

1. **Add API Keys** di Coolify Environment Variables:
   ```
   MODELSLAB_API_KEY=your_key_here
   EDENAI_API_KEY=your_key_here
   ```

2. **Run Migration** via Coolify Terminal:
   ```bash
   cd /app/backend
   bun prisma db push --accept-data-loss
   ```

3. **Restart Application**:
   - Click "Redeploy" di Coolify

4. **Access Production**:
   ```
   https://lumiku.avolut.com/dashboard
   ```

**Apps akan langsung muncul!**

---

## 📋 Checklist

### Backend Running?
- [ ] Run: `curl http://localhost:3000/health`
- [ ] Should return: `{"status":"ok"}`

### Database Setup?
- [ ] PostgreSQL running locally
- [ ] DATABASE_URL configured in .env
- [ ] Migration run: `bun prisma db push`
- [ ] Tables created (19 tables)

### Test User Created?
- [ ] Run: `bun run scripts/create-test-user.ts`
- [ ] Can login with test@example.com

### Apps Endpoint Working?
- [ ] Run: `curl http://localhost:3000/api/apps`
- [ ] Returns array with 4 apps

### Frontend Refresh?
- [ ] Refresh browser (F5)
- [ ] Apps appear in dashboard

---

## 🎯 Quick Commands (Copy-Paste)

**Complete setup dari nol:**

```bash
# 1. Start PostgreSQL (Docker)
docker run --name lumiku-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lumiku_dev -p 5432:5432 -d postgres:15

# 2. Configure (edit .env manually)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lumiku_dev?schema=public"

# 3. Setup database
cd backend
bun prisma db push

# 4. Create test user
bun run scripts/create-test-user.ts

# 5. Start backend
bun run dev

# 6. Start frontend (new terminal)
cd frontend
npm run dev

# 7. Open browser
# http://localhost:5173
```

**Total time:** 5-10 menit

---

## 💡 Understanding the Flow

```
Browser (Dashboard)
    ↓
    ├─ Calls: GET /api/apps
    ↓
Backend API
    ↓
    ├─ Plugin Registry
    ↓
    ├─ Returns: List of enabled plugins
    ↓
Frontend
    ↓
    └─ Displays: App cards
```

**If any step fails:**
- Backend not running → No response
- Database not setup → Plugin registration fails
- Plugin not registered → Empty apps array
- Frontend not refreshed → Shows old data

---

## 🚀 Next Steps After Seeing Apps

1. **Click "AI Video Generator"** card
2. Create new project
3. Select model (8 models available)
4. Enter prompt
5. Configure settings (resolution, duration)
6. Generate video!

---

**Problem solved! Dashboard akan menampilkan apps setelah backend running dengan database tersetup.** 🎉

Untuk detail setup lengkap, lihat: **QUICK_START_LOCAL_DEV.md**
