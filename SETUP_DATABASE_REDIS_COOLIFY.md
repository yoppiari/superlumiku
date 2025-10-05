# Setup PostgreSQL & Redis di Coolify untuk Lumiku

## 🎯 Yang Perlu Di-Setup:

1. ✅ PostgreSQL Database (untuk menyimpan data aplikasi)
2. ✅ Redis (untuk job queue video processing)

---

# 📦 STEP 1: Setup PostgreSQL Database

## Via Coolify UI:

### 1.1 Buka Coolify Dashboard
- URL: https://cf.avolut.com
- Login dengan akun Anda

### 1.2 Add PostgreSQL Database
1. Di sidebar kiri, click **"Projects"**
2. Pilih project yang sama dengan aplikasi SuperLumiku
3. Click tombol **"+ Add Resource"** atau **"+ New"**
4. Pilih **"Database"**
5. Pilih **"PostgreSQL"**

### 1.3 Configure PostgreSQL
Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `lumiku-postgres` |
| **Description** | PostgreSQL for Lumiku App |
| **PostgreSQL Version** | `16` (latest stable) |
| **Database Name** | `lumiku_production` |
| **Database User** | `lumiku_user` |
| **Database Password** | `LumikuSecure2025!` |
| **Port** | `5432` (default) |
| **Destination** | Same as SuperLumiku app (localhost) |

### 1.4 Important Settings:
- ✅ **Network**: Make sure it's on **same network** as SuperLumiku app (usually `coolify` network)
- ✅ **Persistent Storage**: Enable untuk persist data
- ✅ **Auto-start**: Enable

### 1.5 Deploy PostgreSQL
- Click **"Save"** atau **"Deploy"**
- Wait sampai status **"Running"** (hijau)

---

# 🔴 STEP 2: Setup Redis

## Via Coolify UI:

### 2.1 Add Redis Service
1. Masih di project yang sama
2. Click **"+ Add Resource"** atau **"+ New"**
3. Pilih **"Database"**
4. Pilih **"Redis"**

### 2.2 Configure Redis
Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `lumiku-redis` |
| **Description** | Redis for Lumiku Job Queue |
| **Redis Version** | `7-alpine` (latest) |
| **Port** | `6379` (default) |
| **Password** | Leave empty (internal network only) |
| **Destination** | Same as SuperLumiku app |

### 2.3 Important Settings:
- ✅ **Network**: Same network as app (`coolify`)
- ✅ **Persistent Storage**: Enable (untuk AOF persistence)
- ✅ **Auto-start**: Enable

### 2.4 Deploy Redis
- Click **"Save"** atau **"Deploy"**
- Wait sampai status **"Running"**

---

# 🔧 STEP 3: Update Environment Variables (PENTING!)

Setelah PostgreSQL dan Redis running, Anda perlu **UPDATE** beberapa environment variables:

## 3.1 Get Database Connection Info

Dari PostgreSQL service yang baru dibuat, catat:
- Internal hostname (biasanya nama service: `lumiku-postgres`)
- Port: `5432`

## 3.2 Update DATABASE_URL

Di Coolify, go to **SuperLumiku** > **Configuration** > **Environment Variables**

Update variable `DATABASE_URL`:

### Jika service name PostgreSQL = `lumiku-postgres`:
```
DATABASE_URL=postgresql://lumiku_user:LumikuSecure2025!@lumiku-postgres:5432/lumiku_production?schema=public
```

### Jika service name PostgreSQL berbeda (misal `postgres`):
```
DATABASE_URL=postgresql://lumiku_user:LumikuSecure2025!@postgres:5432/lumiku_production?schema=public
```

**Format umum:**
```
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[SERVICE_NAME]:[PORT]/[DATABASE]?schema=public
```

## 3.3 Update REDIS_HOST

Update `REDIS_HOST` sesuai nama Redis service:

### Jika service name Redis = `lumiku-redis`:
```
REDIS_HOST=lumiku-redis
```

### Jika service name Redis = `redis`:
```
REDIS_HOST=redis
```

## 3.4 Update POSTGRES_HOST

```
POSTGRES_HOST=lumiku-postgres
```
(atau sesuai nama PostgreSQL service Anda)

## 3.5 Save Environment Variables
- Click **"Save All Environment Variables"**

---

# 🚀 STEP 4: Redeploy Aplikasi

Setelah PostgreSQL, Redis, dan env vars sudah ready:

1. Go to **SuperLumiku** application
2. Click tab **"Deployments"**
3. Click tombol **"Deploy"** (top right, hijau)
4. Wait deployment selesai

---

# ✅ STEP 5: Verify Setup

## 5.1 Check Services Running

Di Coolify dashboard, pastikan semua **RUNNING** (hijau):
- ✅ `lumiku-postgres` - Running
- ✅ `lumiku-redis` - Running
- ✅ `SuperLumiku` - Running/Healthy

## 5.2 Check Application Logs

1. Go to **SuperLumiku** > **Logs** tab
2. Look for success messages:
   ```
   ✅ Database connected successfully
   ✅ Redis connected
   ✅ Redis ready
   🚀 Server running on http://localhost:3000
   ```

## 5.3 Test Endpoints

Open browser atau curl:

### Health Check:
```
https://app.lumiku.com/health
```
Should return: `{"status":"ok"}`

### API Apps:
```
https://app.lumiku.com/api/apps
```
Should return list of apps

### Frontend:
```
https://app.lumiku.com/
```
Should load React app

---

# 🔍 TROUBLESHOOTING

## Error: "Can't reach database server"

**Cause**: Database service belum running atau network tidak match

**Fix**:
1. Check PostgreSQL service status (harus Running)
2. Verify `DATABASE_URL` uses correct service name
3. Ensure both services in same network

## Error: "Redis connection failed"

**Cause**: Redis service belum running atau hostname salah

**Fix**:
1. Check Redis service status (harus Running)
2. Verify `REDIS_HOST` matches Redis service name
3. Check Redis logs untuk errors

## Error: "Port 3000 already in use"

**Cause**: Conflict dengan Nginx di dalam container

**Fix**: Tidak perlu fix, ini normal. Nginx di port 80, backend di port 3000 internal.

## Error: "Database does not exist"

**Cause**: Database `lumiku_production` belum dibuat

**Fix**:
1. Connect ke PostgreSQL via terminal/psql
2. Create database:
   ```sql
   CREATE DATABASE lumiku_production;
   ```

---

# 📊 Alternative: Setup via Coolify API (Advanced)

Jika Anda punya API key dengan **write permission**, bisa via API:

## Create PostgreSQL:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "postgresql",
    "name": "lumiku-postgres",
    "environment_id": 3,
    "destination_uuid": "fc04ogk",
    "postgres_user": "lumiku_user",
    "postgres_password": "LumikuSecure2025!",
    "postgres_db": "lumiku_production"
  }' \
  https://cf.avolut.com/api/v1/databases
```

## Create Redis:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "redis",
    "name": "lumiku-redis",
    "environment_id": 3,
    "destination_uuid": "fc04ogk"
  }' \
  https://cf.avolut.com/api/v1/databases
```

*Note: API key Anda saat ini TIDAK punya write permission, jadi harus via UI*

---

# 📝 Summary Checklist

- [ ] PostgreSQL service created dan running
- [ ] Redis service created dan running
- [ ] Both services on same network as app
- [ ] `DATABASE_URL` updated dengan service name yang benar
- [ ] `REDIS_HOST` updated dengan service name yang benar
- [ ] `POSTGRES_HOST` updated dengan service name yang benar
- [ ] Environment variables saved
- [ ] Application redeployed
- [ ] Health check returns OK
- [ ] No errors in application logs

---

# 🎯 Expected Result

Setelah semua setup:
- ✅ PostgreSQL running dan accessible
- ✅ Redis running dan accessible
- ✅ Application connected ke database
- ✅ Job queue (BullMQ) connected ke Redis
- ✅ Migrations auto-run saat startup
- ✅ Application healthy dan accessible di https://app.lumiku.com

---

**Jika masih ada error, screenshot logs dan saya akan bantu debug!**
