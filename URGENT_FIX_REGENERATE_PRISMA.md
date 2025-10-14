# 🚨 URGENT: Regenerate Prisma Client & Restart

## ❗ MASALAH:
Table `avatar_usage_history` sudah dibuat ✅
Health check menunjukkan semua table ada ✅
TAPI masih error 400 ❌

## 🎯 ROOT CAUSE KEMUNGKINAN:
**Prisma Client belum tahu tentang table baru!**

Prisma Client di-generate saat build time, tapi table dibuat setelah itu.
Client perlu di-regenerate atau service perlu restart.

---

## ⚡ SOLUSI 1: Restart Backend Service (TERCEPAT)

### Via Coolify UI:
1. Buka: https://cf.avolut.com
2. Pilih: `dev-superlumiku`
3. Klik: **Restart** button (icon refresh)

### Via Coolify Terminal:
```bash
# Restart akan trigger:
# 1. Load schema baru dari database
# 2. Regenerate Prisma Client
# 3. Refresh connections
```

---

## ⚡ SOLUSI 2: Regenerate Prisma Client Manual

### Di Coolify Terminal:
```bash
cd /app/backend
bun prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client
```

**TAPI** ini tidak cukup! Prisma Client di-load saat startup.
**HARUS RESTART SERVICE!**

---

## ⚡ SOLUSI 3: Force Prisma to Sync (Comprehensive)

### Di Coolify Terminal:
```bash
# Step 1: Regenerate Prisma Client
cd /app/backend
bun prisma generate

# Step 2: Verify schema in DB
bun prisma db pull

# Step 3: Restart via process manager
# (Coolify will auto-restart after this)
```

---

## 🔍 SOLUSI 4: Debug Mode - Lihat Error Detail

### Test API dengan curl untuk lihat error message:

```bash
# Get your auth token from browser localStorage first
# Then run:

curl -X POST https://dev.lumiku.com/api/apps/avatar-creator/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"Test Debug","description":"Debug test"}' \
  -v
```

Atau buka file `test-create-project-direct.html` di browser dev.lumiku.com
untuk test dengan token otomatis.

---

## 📊 ATAU: Check Backend Logs

### Via Coolify:
1. Buka: https://cf.avolut.com
2. Pilih: `dev-superlumiku`
3. Tab: **Logs**
4. Filter: "error" atau "400"
5. Lihat error detail

Look for errors like:
- "Invalid `prisma.avatarProject.create()`"
- "Unknown field"
- "Table does not exist" (should not happen now)
- "Foreign key constraint"

---

## ✅ RECOMMENDED STEPS (IN ORDER):

### 1. **RESTART SERVICE DULU** (1 click)
   - Paling cepat
   - Paling aman
   - Auto-load schema baru

### 2. **Check Logs** (after restart)
   - Lihat apakah masih ada error
   - Identify specific issue

### 3. **Test Create Project**
   - Via browser
   - Should work after restart

### 4. **If Still Fails:**
   - Open `test-create-project-direct.html`
   - Get detailed error message
   - Report error untuk further debugging

---

## 🎯 KEMUNGKINAN ERROR LAIN:

### Error: "Foreign key constraint"
**Fix:** Create foreign key dari avatars ke avatar_usage_history
```sql
ALTER TABLE "avatar_usage_history"
ADD CONSTRAINT "avatar_usage_history_avatarId_fkey"
FOREIGN KEY ("avatarId") REFERENCES "avatars"("id")
ON DELETE CASCADE;
```

### Error: "userId not found"
**Fix:** Auth middleware issue, check token

### Error: "Validation error"
**Fix:** Check Zod schema vs request payload

---

## 📝 QUICK COMMAND REFERENCE:

```bash
# 1. Restart (RECOMMENDED FIRST STEP)
# Click "Restart" button in Coolify UI

# 2. If restart not available via UI:
curl -X POST https://cf.avolut.com/api/v1/applications/d8ggwoo484k8ok48g8k8cgwk/restart \
  -H "Authorization: Bearer $COOLIFY_TOKEN"

# 3. Regenerate Prisma (if needed)
cd /app/backend && bun prisma generate

# 4. Check logs
# Via Coolify UI > Logs tab

# 5. Verify health
curl http://localhost:3001/health/database
```

---

## 🔥 EMERGENCY: Force Redeploy

Jika semua gagal, trigger new deployment:
1. Code sudah di-push (commit 4c48f06)
2. Deployment akan include auto-fix
3. Table akan ter-create otomatis
4. Service akan restart dengan schema baru

**Check deployment status:**
https://cf.avolut.com (Deployments tab)

---

**⚡ MULAI DENGAN: RESTART SERVICE!**

Ini paling mungkin solve masalahnya karena Prisma Client
perlu di-load ulang untuk recognize table baru.
