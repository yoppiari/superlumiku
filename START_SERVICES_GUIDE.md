# 🚀 PANDUAN START SERVICES - LUMIKU APP

## ✅ **STEP 1: DATABASE CONNECTION TELAH DIPERBAIKI**

File `backend/.env` telah diupdate:
```
✅ DATABASE_URL: postgres:5432 → localhost:5433
✅ POSTGRES_HOST: postgres → localhost
✅ REDIS_HOST: redis → localhost
✅ REDIS_PORT: 6379 → 6380
```

---

## 🐳 **STEP 2: START DOCKER CONTAINERS**

### **Option A: Start via Docker Desktop (RECOMMENDED)**

1. **Buka Docker Desktop**
   - Klik icon Docker di taskbar Windows
   - Tunggu sampai Docker Desktop fully started
   - Status akan menjadi "Docker Desktop is running"

2. **Start PostgreSQL dan Redis containers:**
   ```powershell
   # Buka PowerShell atau Command Prompt
   cd "C:\Users\yoppi\Downloads\Lumiku App"

   # Start database dan redis
   docker-compose -f docker-compose.dev.yml up -d postgres redis
   ```

3. **Verify containers running:**
   ```powershell
   docker ps
   ```

   Expected output:
   ```
   CONTAINER ID   IMAGE                 STATUS         PORTS
   xxxxx          postgres:16-alpine    Up X minutes   0.0.0.0:5433->5432/tcp
   xxxxx          redis:7-alpine        Up X minutes   0.0.0.0:6380->6379/tcp
   ```

### **Option B: Install Docker Desktop (if not installed)**

1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop
3. Restart computer
4. Follow Option A steps

---

## 🔧 **STEP 3: START BACKEND SERVER**

Setelah PostgreSQL dan Redis running:

```powershell
cd "C:\Users\yoppi\Downloads\Lumiku App\backend"
bun run dev
```

Expected output:
```
✅ Connected to database
🚀 Server running on http://localhost:3000
```

---

## 🌐 **STEP 4: START FRONTEND**

Open new terminal:

```powershell
cd "C:\Users\yoppi\Downloads\Lumiku App\frontend"
npm run dev
```

Expected output:
```
✅ Local: http://localhost:5173
```

---

## ✅ **STEP 5: VERIFY EVERYTHING WORKS**

### A. Test Backend Health
```powershell
curl http://localhost:3000/api/health
```

### B. Test Database Connection
```powershell
cd backend
bun run src/test-create-project-debug.ts
```

Expected: `✅ ALL STEPS PASSED!`

### C. Test in Browser
1. Open: http://localhost:5173
2. Login/Register
3. Go to Avatar Creator
4. Click "Create New Project"
5. Enter name and description
6. Click "Create Project"

Expected: ✅ **Success! Project created**

---

## 🆘 **TROUBLESHOOTING**

### Issue: "Cannot connect to Docker daemon"

**Solution:**
```powershell
# Start Docker Desktop manually
# Wait 1-2 minutes for it to fully start
# Then retry docker-compose command
```

### Issue: "Port 5433 already in use"

**Solution:**
```powershell
# Check what's using the port
netstat -ano | findstr :5433

# If it's an old container
docker ps -a
docker stop <container-id>
docker rm <container-id>

# Then restart
docker-compose -f docker-compose.dev.yml up -d postgres redis
```

### Issue: "Backend still can't connect to database"

**Solution:**
```powershell
# 1. Verify containers are running
docker ps

# 2. Check container logs
docker logs lumiku-dev-postgres
docker logs lumiku-dev-redis

# 3. Test connection directly
docker exec -it lumiku-dev-postgres psql -U lumiku_dev -d lumiku_development -c "SELECT 1;"

# Should output: 1 row
```

### Issue: Backend crashes with Prisma error

**Solution:**
```powershell
cd backend

# Regenerate Prisma Client
bunx prisma generate

# Push schema to database
bunx prisma db push

# Restart backend
bun run dev
```

---

## 📊 **QUICK START CHECKLIST**

- [ ] Docker Desktop installed and running
- [ ] PostgreSQL container started (port 5433)
- [ ] Redis container started (port 6380)
- [ ] Backend .env file updated (already done ✅)
- [ ] Backend server running (port 3000)
- [ ] Frontend server running (port 5173)
- [ ] Create project test successful

---

## 🎯 **NEXT STEPS AFTER SERVICES RUNNING**

Jalankan comprehensive test:

```powershell
bun run test-avatar-projects-comprehensive.js
```

Expected:
```
✅ Database Connection
✅ Table Exists
✅ User Exists
✅ Prisma Create
✅ Auth Token
✅ API Endpoint
✅ Validation Schema

ALL TESTS PASSED: 7/7 tests successful
```

---

## 💡 **TIP: Auto-Start Services**

Buat file `start-dev.bat` untuk auto-start semua services:

```batch
@echo off
echo Starting Lumiku Development Environment...

echo.
echo [1/4] Starting Docker Containers...
docker-compose -f docker-compose.dev.yml up -d postgres redis

echo.
echo [2/4] Waiting for database to be ready...
timeout /t 5 /nobreak

echo.
echo [3/4] Starting Backend Server...
start cmd /k "cd backend && bun run dev"

echo.
echo [4/4] Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo ✅ All services started!
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
pause
```

Save as `start-dev.bat`, then double-click to start everything!

---

**Status:** 🔧 Configuration Fixed - Ready to Start Services
**Next Action:** Start Docker containers dengan command di atas
