# 🚀 Manual Deployment & Seeding Guide

## Situasi Saat Ini

- ✅ Code sudah di-push ke GitHub (commit `8d2dc5e`)
- ✅ Admin API endpoint `/api/admin/seed-models` sudah dibuat
- ❌ Coolify **tidak auto-deploy** dari git push
- ⏳ Menunggu manual deployment atau trigger dari Coolify

---

## Option A: Trigger Manual Deploy di Coolify Dashboard

### Steps:

1. **Buka Coolify Dashboard:**
   - https://cf.avolut.com

2. **Navigate ke Application:**
   - Projects → Root Team → dev-superlumiku → Application

3. **Trigger Redeploy:**
   - Klik tombol **"Redeploy"** atau **"Force Rebuild + Deploy"**
   - Tunggu deployment selesai (~3-5 menit)

4. **Call API Seed:**
   ```bash
   curl -X POST https://dev.lumiku.com/api/admin/seed-models
   ```

5. **Expected Response:**
   ```json
   {
     "success": true,
     "message": "AI models seeded successfully",
     "stats": {
       "inserted": 11,
       "skipped": 0,
       "total": 11,
       "byApp": [
         {"appId": "avatar-generator", "count": 3},
         {"appId": "carousel-mix", "count": 1},
         {"appId": "looping-flow", "count": 1},
         {"appId": "poster-editor", "count": 2},
         {"appId": "video-generator", "count": 3},
         {"appId": "video-mixer", "count": 1}
       ]
     }
   }
   ```

6. **Refresh Browser:**
   - https://dev.lumiku.com/dashboard
   - Semua 6 apps akan muncul! 🎉

---

## Option B: Execute SQL Directly (FASTEST!)

Jika Anda punya akses ke PostgreSQL database (via pgAdmin, DBeaver, atau Coolify SQL terminal):

### Method 1: Via Coolify Database Terminal

1. Buka Coolify Dashboard
2. Navigate ke **Database** → `kssgoso` (PostgreSQL)
3. Klik **"Execute SQL"** atau **"Terminal"**
4. Copy-paste isi file `seed-models.sql`
5. Execute
6. Refresh browser → Apps muncul!

### Method 2: Via psql Command (di Coolify Terminal)

```bash
# Copy SQL file content, then:
psql $DATABASE_URL << 'EOF'
[paste isi seed-models.sql]
EOF
```

### Method 3: Using Prisma Studio

1. Install Prisma Studio di local:
   ```bash
   npm install -g prisma
   ```

2. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="postgresql://postgres:3qQOc2DzN8GpkTAKkTNvvoXKn4ZPbyxkX65zRMBL0IbI9XsVZd5zQkhAj5j793e6@kssgoso:5432/postgres"
   ```

3. Run:
   ```bash
   npx prisma studio
   ```

4. Manual insert via UI (tedious but works)

---

## Option C: Quick Fix via Coolify Terminal (RECOMMENDED!)

Gunakan commands dari file `COOLIFY_COMMANDS_COPY_PASTE.txt`:

1. Buka Coolify Terminal (seperti screenshot sebelumnya)
2. Copy semua isi `COOLIFY_COMMANDS_COPY_PASTE.txt`
3. Paste & Enter
4. Done! ✅

---

## Verification

Setelah seeding, verify dengan:

```bash
# Check total models
curl -s https://dev.lumiku.com/api/admin/seed-models | python -m json.tool

# Check apps endpoint (needs auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" https://dev.lumiku.com/api/apps

# Or simply refresh dashboard
open https://dev.lumiku.com/dashboard
```

---

## Why Auto-Deploy Not Working?

Possible reasons:
- Coolify GitHub webhook belum di-setup
- Auto-deploy disabled di application settings
- Branch mismatch (app deploy dari `main` tapi code di `development`)
- Coolify perlu manual trigger untuk security

**Solution:** Enable auto-deploy di Coolify Application Settings → Deployments → Auto Deploy on Push

---

## Next Steps After Seeding

1. ✅ Verify 6 apps muncul di dashboard
2. ✅ Test 1-2 apps functionality
3. ✅ Setup auto-deploy untuk next updates
4. ✅ Document seeding process for future reference

---

**Quick Command untuk Check Deployment Status:**
```bash
# Check if new endpoint exists
curl -I https://dev.lumiku.com/api/admin/seed-models 2>&1 | grep "HTTP"

# 404 = Old version
# 200/405 = New version deployed
```
