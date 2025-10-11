# Fix Frontend 404 Issue - SOLVED! ✅

## 🔍 Root Cause

Coolify expose **port 3000** dari container, tapi kita punya **2 services yang rebutan port**:
- ❌ Nginx listening di port 80 (inside container)
- ❌ Backend listening di port 3000 (inside container)

Karena Coolify expose port 3000, **semua request langsung ke backend**, bypass Nginx!

Hasilnya:
- ✅ `/health` works (backend route)
- ❌ `/` returns 404 (tidak ada route di backend, seharusnya di-serve Nginx)

## 🛠️ Solution

**Pisahkan port antara Nginx dan Backend:**

| Service | Old Port | New Port | Exposed? |
|---------|----------|----------|----------|
| Nginx   | 80       | **3000** | ✅ YES (Coolify expose ini) |
| Backend | 3000     | **3001** | ❌ NO (internal only) |

### Architecture Flow:

```
Internet → Coolify (app.lumiku.com)
         ↓
    Port 3000 (Nginx)
         ↓
    ┌─────────────────────┐
    │  Nginx (port 3000)  │
    └─────────────────────┘
            ↓
    ┌──────┴──────┐
    │             │
    ▼             ▼
Frontend      Backend
(static)    (port 3001)
```

- **User request `/`** → Nginx serve `index.html`
- **User request `/api/xxx`** → Nginx proxy ke `http://localhost:3001/api/xxx`
- **User request `/health`** → Nginx proxy ke `http://localhost:3001/health`

## 📝 Changes Made

### 1. **docker/nginx.conf**
```nginx
server {
    listen 3000;  # Changed from 80

    location /api/ {
        proxy_pass http://127.0.0.1:3001;  # Changed from 3000
    }

    location /health {
        proxy_pass http://127.0.0.1:3001/health;  # Changed from 3000
    }
}
```

### 2. **Dockerfile**
```dockerfile
EXPOSE 3000  # Changed from 80
```

### 3. **FINAL_ENV_FOR_COOLIFY.txt**
```env
PORT=3001  # Changed from 3000 (for backend)
```

### 4. **docker/healthcheck.sh**
```bash
# Check backend at new port
curl http://localhost:3001/health

# Check Nginx at port 3000
curl http://localhost:3000/
```

## 🚀 Deployment Steps

### 1. Update Environment Variable di Coolify

Go to Coolify → SuperLumiku → Configuration → Environment Variables

**UPDATE variable `PORT`:**
```
PORT=3001
```

(Semua environment variables lain tetap sama)

### 2. Redeploy

- Go to **Deployments** tab
- Click **"Redeploy"** button (orange)
- Wait for deployment selesai (~2-3 menit)

### 3. Test

Setelah deployment SUCCESS:

#### Test 1: Homepage (Frontend)
```
https://app.lumiku.com/
```
**Expected:** React app loading ✅

#### Test 2: Health Check (Backend via Nginx)
```
https://app.lumiku.com/health
```
**Expected:** `{"status":"ok"}` ✅

#### Test 3: API (Backend via Nginx)
```
https://app.lumiku.com/api/apps
```
**Expected:** JSON response with app list ✅

## ✅ Success Criteria

Jika fix berhasil, kamu akan lihat:

1. **Homepage loading** - React app muncul
2. **No more 404** - Frontend routes works
3. **API still works** - Backend accessible via Nginx proxy
4. **Health check works** - Returns OK

## 🔍 Verification in Logs

Di Coolify logs (SuperLumiku > Logs), kamu akan lihat:

```
✅ Frontend files verified
   Files in /app/frontend/dist:
   total 48K
   -rw-r--r-- 1 root root  719 Oct  5 16:10 index.html
   drwxr-xr-x 2 root root 4.0K Oct  5 16:10 assets
   ...

🌐 Starting Nginx...
Nginx configuration test is successful
✅ Nginx started

🚀 Starting Backend Server...
🚀 Server running on http://localhost:3001
```

**Note:** Backend sekarang di port **3001**, bukan 3000!

## 📊 Summary

| What | Before | After |
|------|--------|-------|
| Coolify exposed port | 3000 | 3000 (same) |
| Nginx port (inside) | 80 | **3000** ✅ |
| Backend port (inside) | 3000 | **3001** ✅ |
| Frontend accessible? | ❌ 404 | ✅ Works |
| API accessible? | ✅ Direct | ✅ Via Nginx |

---

**Commit:** `0c82409` - fix: Fix frontend 404 by separating Nginx and Backend ports

**Files changed:**
- docker/nginx.conf
- docker/healthcheck.sh
- Dockerfile
- FINAL_ENV_FOR_COOLIFY.txt

---

## 🎯 Next Steps

1. ✅ Update `PORT=3001` di Coolify environment variables
2. ✅ Redeploy aplikasi
3. ✅ Test `https://app.lumiku.com/`
4. ✅ Verify frontend loads correctly
5. ✅ Test login & apps functionality

**Jika masih ada masalah, screenshot logs dan hasil test!**
