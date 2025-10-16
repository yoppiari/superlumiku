# Manual Deployment - Dashboard Fix

**Status:** ✅ Code sudah di-commit dan push ke branch development
**Commit:** b5a2d58 - "fix(frontend): Add defensive null checks to prevent dashboard TypeError"
**Date:** October 14, 2025

---

## Yang Sudah Dikerjakan ✅

### 1. Fix Dashboard Error
Staff-engineer sudah memperbaiki TypeError yang menyebabkan "Page Error":

**File:** `frontend/src/pages/Dashboard.tsx`

**Perubahan:**
- ✅ Tambah function `formatNumber()` untuk format angka dengan aman
- ✅ Tambah null coalescing operator (??) di semua tempat
- ✅ Ganti semua `.toLocaleString()` dengan `formatNumber()`
- ✅ Tambah default values di state initialization
- ✅ Tambah error handling yang defensive

### 2. Build & Commit
- ✅ Frontend build berhasil tanpa error TypeScript
- ✅ Commit ke development branch: `b5a2d58`
- ✅ Push ke GitHub berhasil

---

## Langkah Deployment Manual

### Opsi 1: Via Coolify Web UI (RECOMMENDED)

**Step 1: Login ke Coolify**
1. Buka: https://cf.avolut.com
2. Login dengan credentials Anda

**Step 2: Find Application**
1. Cari aplikasi **"Lumiku Frontend"** atau **"dev-superlumiku"**
2. UUID: `d8ggwoo484k8ok48g8k8cgwk`

**Step 3: Deploy**
1. Klik aplikasi tersebut
2. Klik tombol **"Deploy"** atau **"Redeploy"**
3. Tunggu build selesai (2-5 menit)

**Step 4: Monitor Build**
1. Lihat build logs di Coolify
2. Pastikan tidak ada error
3. Tunggu status "Deployed" dengan checkmark hijau

---

### Opsi 2: Auto-Deploy via Webhook

Jika webhook sudah dikonfigurasi, deployment mungkin sudah otomatis triggered saat push ke branch development. Cek di Coolify apakah ada deployment baru yang sedang berjalan.

---

## Verifikasi Setelah Deploy

### 1. Check Dashboard
```
URL: https://dev.lumiku.com/dashboard
```

**Yang Harus Terlihat:**
- ✅ Dashboard loading tanpa "Page Error"
- ✅ Stats menampilkan angka (atau "0" jika belum ada data)
- ✅ Credit balance terformat dengan baik
- ✅ Tidak ada console error

### 2. Check Browser Console
1. Tekan F12 untuk buka DevTools
2. Lihat tab "Console"
3. **Tidak boleh ada error:**
   - ❌ `TypeError: Cannot read properties of undefined`
   - ❌ `toLocaleString is not a function`

**Yang Normal:**
- ✅ Request ke API berhasil
- ✅ Data loading dengan baik
- ✅ Mungkin ada warning biasa (bukan error)

### 3. Check Apps Display
**Sebelum seed AI models:**
- Akan terlihat 2 apps: Video Mixer, Carousel Mix
- Avatar Creator belum muncul (karena belum ada AI models)

**Setelah seed AI models:**
- Akan terlihat 3 apps: Video Mixer, Carousel Mix, **Avatar Creator**
- Avatar Creator dengan icon purple (user-circle)

---

## Next Step: Seed AI Models (IMPORTANT!)

Setelah frontend deploy berhasil, jalankan seed untuk AI models:

### Via Coolify Terminal

**Step 1: Buka Terminal**
1. Di Coolify, buka aplikasi **backend** (bukan frontend)
2. Klik tab "Terminal"

**Step 2: Run Seed**
```bash
cd /app/backend
bun prisma/seed.ts
```

**Expected Output:**
```
🌱 Starting database seeding...
=====================================

🌱 Seeding subscription plans...
✅ Seeded 5 subscription plans

🌱 Seeding AI models...
✅ Seeded 13 AI models          <-- Ini yang penting!

🌱 Creating test user...
✅ Created test user

=====================================
✅ Database seeding completed successfully!
```

**Step 3: Restart Backend**
Klik tombol "Restart" untuk restart backend service

---

## Verifikasi Final

### Test Complete Flow

**1. Dashboard Loading**
```
✅ https://dev.lumiku.com/dashboard
   - No "Page Error"
   - Stats showing properly
   - Credit balance formatted correctly
```

**2. Avatar Creator Visible**
```
✅ Dashboard shows 3 apps:
   - Video Mixer (green icon)
   - Carousel Mix (blue icon)
   - Avatar Creator (purple icon) <-- HARUS MUNCUL!
```

**3. Console Check**
```
✅ No errors in browser console
✅ API calls returning 200 OK
✅ Data loading correctly
```

**4. Test API Response**
Buka browser console dan run:
```javascript
fetch('https://dev.lumiku.com/api/apps', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
  .then(r => r.json())
  .then(data => {
    console.log('Total apps:', data.apps.length)
    console.log('Apps:', data.apps.map(a => a.name))
    console.log('Avatar Creator found:',
      data.apps.some(a => a.appId === 'avatar-creator'))
  })
```

**Expected Output:**
```
Total apps: 3
Apps: ["Video Mixer", "Carousel Mix", "Avatar Creator"]
Avatar Creator found: true
```

---

## Troubleshooting

### Issue 1: Dashboard Still Shows "Page Error"

**Solution:**
1. Hard refresh browser: `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)
2. Clear browser cache:
   - Chrome: DevTools → Application → Clear Storage → "Clear site data"
3. Check Coolify deployment logs untuk memastikan build berhasil

### Issue 2: Avatar Creator Not Showing

**Root Cause:** AI models belum di-seed ke database

**Solution:**
```bash
# Di Coolify Terminal (backend)
cd /app/backend
bun prisma/seed.ts

# Restart backend
pm2 restart backend

# Atau via Coolify UI: klik "Restart"
```

**Verify Models Exist:**
```bash
cd /app
node check-existing-models.js
```

Should show:
```
🔍 AVATAR CREATOR MODELS:
✅ Found 4 models for avatar-creator:
   1. FLUX.1-dev Base (free) - 8 credits
   2. FLUX.1-dev + Realism LoRA (basic) - 12 credits
   3. FLUX.1-dev HD + Realism LoRA (pro) - 15 credits
   4. FLUX.1-schnell Fast (basic) - 6 credits
```

### Issue 3: Build Fails in Coolify

**Check:**
1. Lihat build logs di Coolify
2. Cari error TypeScript atau dependency issues

**Common Issues:**
- Node modules not installed → Run `npm install` in build
- TypeScript errors → Check if commit b5a2d58 was pulled
- Docker cache issues → Try force rebuild in Coolify

---

## Summary of Changes

### Frontend Fix (Dashboard.tsx)

**Before:**
```typescript
// Unsafe - crashes if creditBalance is undefined
{creditBalance.toLocaleString()} Credits

// Unsafe - crashes if stats.totalSpending is undefined
{stats.totalSpending.toLocaleString()}
```

**After:**
```typescript
// Safe - uses formatNumber() utility
const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0'
  }
  return value.toLocaleString()
}

// Safe rendering
{formatNumber(creditBalance)} Credits
{formatNumber(stats.totalSpending)}

// Safe state initialization
const [creditBalance, setCreditBalance] = useState(user?.creditBalance ?? 0)
const [stats, setStats] = useState({
  totalSpending: 0,
  totalWorks: 0,
  totalProjects: 0,
  lastLogin: new Date().toISOString()
})

// Safe API response handling
const balanceData = await creditsService.getBalance()
setCreditBalance(balanceData?.balance ?? 0)
```

---

## Deployment Timeline

| Step | Status | Time |
|------|--------|------|
| Fix dashboard error | ✅ Done | - |
| Build frontend | ✅ Done | 11.56s |
| Commit & push | ✅ Done | - |
| **Deploy via Coolify** | ⏳ Manual | 2-5 min |
| Verify dashboard | ⏳ Pending | 30s |
| Seed AI models | ⏳ Pending | 30s |
| Verify Avatar Creator | ⏳ Pending | 30s |
| **Total** | | **~5-10 min** |

---

## Success Criteria ✅

Deployment sukses jika:

- [x] ✅ Code sudah di-commit (b5a2d58)
- [x] ✅ Code sudah di-push ke development
- [ ] ⏳ Coolify build berhasil
- [ ] ⏳ Dashboard loading tanpa "Page Error"
- [ ] ⏳ Stats menampilkan angka dengan benar
- [ ] ⏳ Console tidak ada error toLocaleString
- [ ] ⏳ AI models sudah di-seed
- [ ] ⏳ Avatar Creator muncul di dashboard (3 apps total)

---

## Quick Reference

**Coolify URLs:**
- Dashboard: https://cf.avolut.com
- Frontend App: https://cf.avolut.com/project/.../application/d8ggwoo484k8ok48g8k8cgwk

**Production URLs:**
- Dashboard: https://dev.lumiku.com/dashboard
- API: https://dev.lumiku.com/api/apps

**Git:**
- Branch: development
- Commit: b5a2d58
- Files: frontend/src/pages/Dashboard.tsx

**Backend Seed:**
```bash
cd /app/backend
bun prisma/seed.ts
```

---

**Ready to Deploy!** 🚀

Silakan deploy via Coolify UI, kemudian lakukan verifikasi dan seed AI models.
