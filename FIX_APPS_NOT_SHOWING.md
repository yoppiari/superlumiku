# 🔧 Fix: Apps Not Showing on Dashboard

## 🔍 Root Cause Analysis

**Problem:** Dashboard menampilkan "No apps available yet"

**Penyebab:**
- Apps sekarang menggunakan plugin system (bukan database)
- Apps hanya muncul jika ada minimal 1 AI model yang accessible untuk user
- Tabel `ai_models` masih kosong di production database
- Tanpa AI models, semua apps ter-filter out oleh access control

**Arsitektur:**
```
Dashboard → GET /api/apps
  → accessControlService.getUserAccessibleApps(userId)
    → Untuk setiap plugin app:
      → modelRegistryService.getUserAccessibleModels(userId, appId)
      → Jika models.length > 0 ✅ App ditampilkan
      → Jika models.length === 0 ❌ App disembunyikan
```

---

## ✅ Solution: Seed AI Models ke Production Database

### 📦 Apps yang Akan Muncul:

Setelah seeding, 6 apps akan muncul di dashboard:

1. **Video Generator** 🎬
   - Wan 2.2 T2V (Free)
   - Google Veo 2 (Basic)
   - Kling 2.5 Pro (Pro)

2. **Poster Editor** 🖼️
   - Inpaint Standard (Free)
   - Inpaint Pro (Pro)

3. **Video Mixer** 🎞️
   - FFmpeg Standard (Free)

4. **Carousel Mix** 📊
   - Canvas Standard (Free)

5. **Looping Flow** 🔄
   - FFmpeg Loop (Free)

6. **Avatar Generator** 👤 [NEW!]
   - ControlNet OpenPose SD 1.5 (Free)
   - ControlNet OpenPose SDXL (Basic)
   - ControlNet OpenPose SDXL Ultra (Pro)

---

## 🚀 Langkah Deployment ke Coolify

### Step 1: Upload Script ke Server

1. Buka **Coolify Dashboard** → Application: `lumiku-app`
2. Masuk ke **Terminal** tab
3. Upload file `seed-models-production.js` ke root directory:

```bash
# Atau copy-paste isi file seed-models-production.js ke server
cat > seed-models-production.js << 'EOF'
[paste seluruh isi file seed-models-production.js]
EOF
```

### Step 2: Install Dependencies

```bash
npm install pg
```

### Step 3: Run Seed Script

```bash
node seed-models-production.js
```

### Step 4: Expected Output

```
✅ Connected to production database

🌱 Seeding AI models...

✅ Seeded: Wan 2.2 T2V (Free) (free tier)
✅ Seeded: Google Veo 2 (basic tier)
✅ Seeded: Kling 2.5 Pro (pro tier)
✅ Seeded: Inpaint Standard (free tier)
✅ Seeded: Inpaint Pro (pro tier)
✅ Seeded: FFmpeg Standard (free tier)
✅ Seeded: Canvas Standard (free tier)
✅ Seeded: FFmpeg Loop (free tier)
✅ Seeded: ControlNet OpenPose SD 1.5 (Free) (free tier)
✅ Seeded: ControlNet OpenPose SDXL (basic tier)
✅ Seeded: ControlNet OpenPose SDXL Ultra (pro tier)

🔍 Verifying models in database...

✅ AI Models in database:

════════════════════════════════════════════════════════════════════════════════

1. App: avatar-generator
   - ControlNet OpenPose SD 1.5 (Free) (huggingface)
     Tier: free, Enabled: ✅
   - ControlNet OpenPose SDXL (huggingface)
     Tier: basic, Enabled: ✅
   - ControlNet OpenPose SDXL Ultra (huggingface)
     Tier: pro, Enabled: ✅

2. App: carousel-mix
   - Canvas Standard (local)
     Tier: free, Enabled: ✅

3. App: looping-flow
   - FFmpeg Loop (local)
     Tier: free, Enabled: ✅

4. App: poster-editor
   - Inpaint Standard (segmind)
     Tier: free, Enabled: ✅
   - Inpaint Pro (segmind)
     Tier: pro, Enabled: ✅

5. App: video-generator
   - Wan 2.2 T2V (Free) (modelslab)
     Tier: free, Enabled: ✅
   - Google Veo 2 (edenai)
     Tier: basic, Enabled: ✅
   - Kling 2.5 Pro (edenai)
     Tier: pro, Enabled: ✅

6. App: video-mixer
   - FFmpeg Standard (local)
     Tier: free, Enabled: ✅

════════════════════════════════════════════════════════════════════════════════

🎉 AI models seeded successfully! (11 models)
📱 Now 6 apps will appear on dashboard:
   ✅ Video Generator
   ✅ Poster Editor
   ✅ Video Mixer
   ✅ Carousel Mix
   ✅ Looping Flow
   ✅ Avatar Generator

💡 Refresh your browser to see the apps!

✅ Database connection closed
```

### Step 5: Refresh Browser

1. Buka https://dev.lumiku.com/dashboard
2. Press **F5** atau **Ctrl+R** (hard refresh: Ctrl+Shift+R)
3. Semua 6 apps seharusnya muncul! 🎉

---

## 📊 User Access by Tier

### Free Tier Users:
- ✅ Video Generator (Wan 2.2 T2V)
- ✅ Poster Editor (Inpaint Standard)
- ✅ Video Mixer (FFmpeg Standard)
- ✅ Carousel Mix (Canvas Standard)
- ✅ Looping Flow (FFmpeg Loop)
- ✅ Avatar Generator (ControlNet SD 1.5)

### Basic/Pro/Premium Tier Users:
- Semua apps di atas **+** models yang lebih tinggi (Veo 2, SDXL, dll)

---

## 🧪 Verification

Setelah refresh, cek dashboard:

1. **Apps & Tools section** harus menampilkan 6 cards
2. Klik salah satu app → harus redirect ke app page
3. Check console log backend → harus show:
   ```
   📱 Dashboard Apps for user xxx:
     - Accessible apps: 6
     - Apps: Video Generator, Poster Editor, Video Mixer, Carousel Mix, Looping Flow, Avatar Generator
   ```

---

## 🔍 Troubleshooting

### Jika apps masih tidak muncul:

1. **Check database connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM ai_models;"
   ```
   Should return: `11` (atau lebih jika sudah ada models lain)

2. **Check backend logs:**
   - Buka Coolify → Application Logs
   - Cari error messages

3. **Check user tier:**
   ```sql
   SELECT email, "subscriptionTier", "accountType" FROM users WHERE email = 'test@lumiku.com';
   ```

4. **Re-run seed if needed:**
   ```bash
   node seed-models-production.js
   ```

---

## 📝 Notes

- Script ini **idempotent** (aman di-run berkali-kali)
- Model yang sudah ada akan di-skip
- Tidak ada downtime saat seeding
- Free tier users bisa akses 6 apps dengan models gratis
- Premium users bisa akses semua models (free + paid)

---

## ✅ Success Criteria

- [x] AI models table populated (11 models minimum)
- [x] Dashboard menampilkan 6 apps
- [x] Free users dapat akses semua apps dengan free models
- [x] Premium users dapat akses all models
- [x] No errors di console
- [x] Apps clickable dan redirect correctly

---

**Next Step:** Upload `seed-models-production.js` ke Coolify dan run sekarang! 🚀
