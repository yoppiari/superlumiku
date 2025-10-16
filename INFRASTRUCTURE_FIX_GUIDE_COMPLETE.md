# 🚨 INFRASTRUCTURE FIX GUIDE - Avatar Creator
## Complete Setup for Local Windows Development

**Status**: BLOCKED - Critical infrastructure services not running
**Environment**: Windows 11 Local Development
**Date**: 2025-10-15
**Location**: `C:\Users\yoppi\Downloads\Lumiku App\`

---

## 🔍 DIAGNOSIS SUMMARY

### ✅ WORKING COMPONENTS
1. **Bun Runtime**: v1.2.22 installed and working
2. **Upload Directory**: `backend/uploads/avatar-creator/` created ✓
3. **Static File Serving**: Configured in `backend/src/app.ts` line 35 ✓
4. **Avatar Worker Code**: Exists at `backend/src/apps/avatar-creator/workers/avatar-generator.worker.ts` ✓
5. **Prisma Schema**: Complete with Avatar Creator models ✓
6. **Docker Compose Config**: Available at `backend/docker-compose.yml` ✓

### ❌ CRITICAL BLOCKERS (PREVENTING AVATAR CREATOR FROM WORKING)

#### 1. PostgreSQL Database - NOT RUNNING ❌
```
Expected: localhost:5433
Current Status: NOT LISTENING
Impact: ALL database operations fail
Error: "Can't reach database server at localhost:5433"
```

**Current .env Configuration**:
```bash
DATABASE_URL="postgresql://lumiku_dev:lumiku_dev_password@localhost:5433/lumiku_development?schema=public"
POSTGRES_HOST="localhost"
POSTGRES_USER="lumiku_dev"
POSTGRES_PASSWORD="lumiku_dev_password"
POSTGRES_DB="lumiku_development"
```

#### 2. Redis Server - NOT RUNNING ❌
```
Expected: localhost:6380
Current Status: NOT LISTENING
Impact: Background job queue doesn't work (AI generation queue)
Error: Redis connection failed
```

**Current .env Configuration**:
```bash
REDIS_HOST="localhost"
REDIS_PORT="6380"
REDIS_PASSWORD=""
```

#### 3. Docker Not Installed ❌
```
Docker Command: Not found
Docker Daemon: Not accessible
Impact: Cannot use docker-compose.yml to start services
```

#### 4. HuggingFace API Key - PLACEHOLDER ⚠️
```
Current: HUGGINGFACE_API_KEY="your-huggingface-api-key-here"
Status: Not configured
Impact: FLUX AI generation will fail with 401 Unauthorized
```

---

## 🎯 INFRASTRUCTURE SETUP OPTIONS

You have **3 options** to fix the infrastructure:

### OPTION A: Docker Desktop (Recommended - Easiest)

**Pros**:
- All services in containers (isolated)
- One command to start everything
- Built-in docker-compose.yml ready to use

**Steps**:

1. **Install Docker Desktop for Windows**
   ```
   Download: https://www.docker.com/products/docker-desktop/

   System Requirements:
   - Windows 10/11 64-bit (Pro, Enterprise, or Education)
   - WSL 2 enabled (Docker will prompt to install)
   - Virtualization enabled in BIOS
   ```

2. **Start Docker Desktop**
   - Open Docker Desktop application
   - Wait for "Docker is running" status

3. **Create `.env` file for docker-compose**
   ```bash
   # Create: C:\Users\yoppi\Downloads\Lumiku App\backend\.env.docker

   DB_PORT=5433
   DB_NAME=lumiku_development
   DB_USER=lumiku_dev
   DB_PASSWORD=lumiku_dev_password

   REDIS_PORT=6380
   REDIS_PASSWORD=redis_password_here

   JWT_SECRET=ac9b38e945d02529bfa12b20a7bff40c1be06358b37efbb1e3931002f011431c

   HUGGINGFACE_API_KEY=your_actual_hf_key_here
   ```

4. **Start Services with Docker Compose**
   ```bash
   cd "C:\Users\yoppi\Downloads\Lumiku App\backend"

   # Start PostgreSQL and Redis only
   docker-compose up -d postgres redis

   # Check status
   docker-compose ps

   # View logs
   docker-compose logs -f postgres redis
   ```

5. **Verify Services Running**
   ```bash
   # Check PostgreSQL
   docker exec lumiku-postgres pg_isready -U lumiku_dev

   # Check Redis
   docker exec lumiku-redis redis-cli ping
   ```

6. **Run Migrations**
   ```bash
   cd backend
   bun run prisma migrate deploy
   bun run prisma db seed
   ```

7. **Start Backend Locally (not in Docker)**
   ```bash
   cd backend
   bun run dev
   ```

8. **Start Avatar Worker Locally**
   ```bash
   cd backend
   bun run src/apps/avatar-creator/workers/avatar-generator.worker.ts
   ```

---

### OPTION B: Install PostgreSQL & Redis Natively on Windows

**Pros**:
- No Docker required
- Services run as Windows services (auto-start)

**Cons**:
- More manual setup
- May conflict with other installations

**Steps**:

#### B1. Install PostgreSQL

1. **Download PostgreSQL 15**
   ```
   URL: https://www.postgresql.org/download/windows/
   Installer: postgresql-15.x-windows-x64.exe
   ```

2. **Install PostgreSQL**
   - Run installer
   - Port: **5433** (important!)
   - Password: `lumiku_dev_password`
   - Locale: en_US.UTF-8

3. **Create Database**
   ```bash
   # Open PowerShell
   cd "C:\Program Files\PostgreSQL\15\bin"

   # Create user
   .\psql.exe -U postgres -c "CREATE USER lumiku_dev WITH PASSWORD 'lumiku_dev_password';"

   # Create database
   .\psql.exe -U postgres -c "CREATE DATABASE lumiku_development OWNER lumiku_dev;"
   ```

4. **Test Connection**
   ```bash
   .\psql.exe -U lumiku_dev -d lumiku_development -h localhost -p 5433
   ```

#### B2. Install Redis

1. **Download Redis for Windows**
   ```
   Option 1 (WSL): Use WSL2 and install Redis in Ubuntu
   Option 2 (Native): Use Memurai (Redis-compatible for Windows)

   Memurai Download: https://www.memurai.com/get-memurai
   ```

2. **Install Memurai**
   - Run installer
   - Port: **6380**
   - Start as Windows Service: Yes

3. **Test Connection**
   ```bash
   # If using Memurai CLI
   memurai-cli -p 6380 ping

   # Should return: PONG
   ```

4. **Configure Redis in .env**
   ```bash
   REDIS_HOST="localhost"
   REDIS_PORT="6380"
   REDIS_PASSWORD=""  # Or set password in Memurai config
   ```

#### B3. Run Migrations and Start Services

Same as Option A steps 6-8.

---

### OPTION C: Use Remote Database Services (Cloud)

**Pros**:
- No local installation
- Production-like setup

**Cons**:
- Requires internet connection
- May have costs (free tiers available)

**Services**:

1. **PostgreSQL**:
   - Supabase (free tier: 500MB)
   - ElephantSQL (free tier: 20MB)
   - Neon (free tier: 3GB)

2. **Redis**:
   - Upstash (free tier: 10,000 requests/day)
   - Redis Cloud (free tier: 30MB)

**Setup**:
1. Create accounts and get connection strings
2. Update `.env` with remote URLs
3. Run migrations
4. Start backend and worker locally

---

## 🔑 HUGGINGFACE API KEY SETUP

**Required for Avatar Creator to work!**

### Step 1: Get API Key

1. Go to: https://huggingface.co/settings/tokens
2. Login or create account (free)
3. Click "New token"
4. Name: `lumiku-avatar-creator`
5. Type: **Read** (required for inference)
6. Click "Generate a token"
7. Copy the token (starts with `hf_...`)

### Step 2: Update .env

```bash
# In: C:\Users\yoppi\Downloads\Lumiku App\backend\.env
# Replace this line:
HUGGINGFACE_API_KEY="your-huggingface-api-key-here"

# With your actual key:
HUGGINGFACE_API_KEY="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Step 3: Verify Configuration

```bash
# Check if key is loaded
cd backend
bun run src/config/env.ts

# Should NOT show error about HUGGINGFACE_API_KEY
```

---

## 📋 POST-SETUP VERIFICATION CHECKLIST

After setting up infrastructure, run these tests:

### 1. Database Connection Test
```bash
cd backend
bun run prisma studio

# Should open Prisma Studio at http://localhost:5555
# Verify you see tables: users, avatar_projects, avatars, etc.
```

### 2. Redis Connection Test
```bash
# Test from backend code
cd backend
node -e "
const { Redis } = require('ioredis');
const redis = new Redis({ host: 'localhost', port: 6380 });
redis.ping().then(r => console.log('Redis:', r)).catch(e => console.error('Error:', e.message));
"
```

### 3. Backend Startup Test
```bash
cd backend
bun run dev

# Expected output:
# ✅ Environment variables validated successfully
# ✅ Database connected successfully
# ✅ Redis connected successfully
# 🚀 Server running on http://localhost:3000
```

### 4. Worker Startup Test
```bash
cd backend
bun run src/apps/avatar-creator/workers/avatar-generator.worker.ts

# Expected output:
# 🚀 Avatar Generator Worker started
# (No errors about Redis connection)
```

### 5. Avatar Creator API Test
```bash
# Get auth token first (create user or login)
# Then test avatar creation endpoint

curl -X POST http://localhost:3000/api/avatar-creator/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project", "description": "Testing infrastructure"}'

# Expected: 201 Created with project JSON
```

### 6. Database Migration Status
```bash
cd backend
bun run prisma migrate status

# Expected: "Database schema is up to date!"
```

### 7. Seed Data Check
```bash
cd backend
bun run prisma db seed

# Check if Avatar Creator models exist
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.aIModel.findMany({ where: { appId: 'avatar-creator' } })
  .then(models => console.log('Avatar Creator models:', models.length))
  .finally(() => prisma.\$disconnect());
"
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Can't reach database server"
**Solution**:
- Verify PostgreSQL is running: `tasklist | findstr postgres`
- Check port 5433 is listening: `netstat -an | findstr 5433`
- Try connecting with psql: `psql -U lumiku_dev -h localhost -p 5433`

### Issue: "Redis connection failed"
**Solution**:
- Verify Redis/Memurai is running: `tasklist | findstr memurai`
- Check port 6380 is listening: `netstat -an | findstr 6380`
- Test with CLI: `redis-cli -p 6380 ping` or `memurai-cli -p 6380 ping`

### Issue: "Docker daemon not running"
**Solution**:
- Open Docker Desktop app
- Wait for "Docker is running" in system tray
- Restart Docker Desktop if needed

### Issue: "Migration failed"
**Solution**:
```bash
# Reset database (DEVELOPMENT ONLY!)
cd backend
bun run prisma migrate reset

# Or manually apply migrations
bun run prisma migrate deploy
```

### Issue: "Worker not processing jobs"
**Solution**:
1. Check worker is running: Look for process in Task Manager
2. Check Redis connection: Worker logs should show "Redis connected"
3. Check queue: Use Redis CLI to inspect queue
   ```bash
   redis-cli -p 6380
   > LLEN bull:avatar-generation:wait
   > LRANGE bull:avatar-generation:wait 0 -1
   ```

### Issue: "HuggingFace 401 Unauthorized"
**Solution**:
- Verify API key in .env starts with `hf_`
- Check key permissions at https://huggingface.co/settings/tokens
- Generate new token with **Read** access
- Restart backend after updating .env

---

## 📊 INFRASTRUCTURE HEALTH MONITORING

### Check All Services Status
```bash
# PowerShell script to check all services
$services = @{
    "PostgreSQL" = { netstat -an | findstr "5433.*LISTENING" }
    "Redis" = { netstat -an | findstr "6380.*LISTENING" }
    "Backend" = { netstat -an | findstr "3000.*LISTENING" }
}

foreach ($service in $services.Keys) {
    $result = & $services[$service]
    if ($result) {
        Write-Host "✅ $service is running"
    } else {
        Write-Host "❌ $service is NOT running"
    }
}
```

### Health Check Endpoints
```bash
# Basic health check
curl http://localhost:3000/health

# Database health check
curl http://localhost:3000/api/health

# Detailed database schema check
curl http://localhost:3000/health/database
```

---

## 🎯 RECOMMENDED SETUP FOR YOU

Based on your Windows environment, I recommend:

### **OPTION A: Docker Desktop** (if you have Windows Pro/Enterprise)
- Easiest to set up
- Clean isolation
- One command to start/stop all services
- Best for development

### **OPTION B: Native PostgreSQL + Memurai** (if Docker not available)
- Works on Windows Home
- Services auto-start with Windows
- No virtualization overhead
- Good for long-term development

---

## 📝 QUICK START SCRIPT

Once you've chosen an option and installed services, run this script:

```bash
# File: C:\Users\yoppi\Downloads\Lumiku App\start-dev.ps1

# Start PostgreSQL (if native install)
# Start-Service postgresql-x64-15

# Start Redis/Memurai (if native install)
# Start-Service Memurai

# Or start Docker services
# cd backend
# docker-compose up -d postgres redis

# Wait for services
Start-Sleep -Seconds 5

# Run migrations
cd backend
bun run prisma migrate deploy

# Seed database
bun run prisma db seed

# Start backend
Start-Process -NoNewWindow -FilePath "bun" -ArgumentList "run","dev"

# Start avatar worker
Start-Process -NoNewWindow -FilePath "bun" -ArgumentList "run","src/apps/avatar-creator/workers/avatar-generator.worker.ts"

Write-Host "🚀 All services started!"
Write-Host "Backend: http://localhost:3000"
Write-Host "Press Ctrl+C to stop"
```

---

## 🔧 FILES MODIFIED/CREATED

### ✅ Created
- `C:\Users\yoppi\Downloads\Lumiku App\backend\uploads\avatar-creator\` directory

### ℹ️ Already Configured (No Changes Needed)
- `backend\.env` - Database and Redis config already correct
- `backend\src\app.ts` - Static file serving configured (line 35)
- `backend\docker-compose.yml` - Ready to use
- `backend\prisma\schema.prisma` - Avatar Creator models present

### ⚠️ Needs Manual Update
- `backend\.env` - HUGGINGFACE_API_KEY (line 32) - **YOU MUST SET THIS**

---

## 📞 NEXT STEPS

1. **Choose your infrastructure option** (A, B, or C)
2. **Follow the setup steps** for your chosen option
3. **Get HuggingFace API key** (required!)
4. **Run the verification checklist**
5. **Test Avatar Creator** end-to-end

**Once infrastructure is running, Avatar Creator will be fully functional!**

---

## 📊 CURRENT STATUS SUMMARY

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Bun Runtime | ✅ Working | None |
| Upload Directory | ✅ Created | None |
| Static File Serving | ✅ Configured | None |
| Prisma Schema | ✅ Complete | None |
| Avatar Worker Code | ✅ Ready | None |
| **PostgreSQL** | ❌ **NOT RUNNING** | **Install & Start** |
| **Redis** | ❌ **NOT RUNNING** | **Install & Start** |
| **HF API Key** | ⚠️ **NOT SET** | **Get from HuggingFace** |
| Docker | ❌ Not Installed | Optional (for Option A) |

---

**Infrastructure Setup Time Estimate**:
- Option A (Docker): 30-45 minutes
- Option B (Native): 45-60 minutes
- Option C (Cloud): 15-30 minutes

**Once infrastructure is ready, Avatar Creator will work immediately - no code changes needed!**
