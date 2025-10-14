# 🔧 Troubleshooting: 400 Error on Create Project

## ❓ Error Yang Terjadi

**Error Message:** `Request failed with status code 400`

**Location:** `POST /api/apps/avatar-creator/projects/create`

**Screenshot:** Modal "Create New Project" menunjukkan error 400

---

## 🔍 Root Cause Analysis

### Kemungkinan Penyebab:

#### 1. ✅ Deployment Masih Running (PALING MUNGKIN)
**Status:** Deployment UUID `boco84cokkg8ogk0w80wss8s` sedang di-build

**Explanation:**
- Deployment di-trigger ~5 menit yang lalu
- Docker build + Prisma migration memakan waktu 3-7 menit
- Saat deployment running, API tidak bisa diakses atau mengembalikan error 400

**Solusi:** Tunggu deployment selesai (cek di Coolify dashboard)

#### 2. Database Migration Belum Selesai
**Explanation:**
- Backend sudah running tapi Prisma migration belum selesai
- Schema baru (`bodyType` field) belum tersinkronisasi

**Solusi:** Wait for deployment to complete, migrations run automatically

#### 3. Validation Error dari Zod Schema
**Unlikely** - Code sudah benar, schema validation sudah sesuai:

```typescript
// From routes.ts line 18-21
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})
```

Frontend mengirim:
```json
{
  "name": "Testing Coba",
  "description": "Ini percobaan 1 menggunakan FLUX"
}
```

Ini seharusnya VALID ✅

---

## ✅ Verification Steps

### Step 1: Check Deployment Status

**Via Coolify UI:**
1. Login: https://cf.avolut.com
2. Navigate to: `dev-superlumiku` application
3. Go to: **Deployments** tab
4. Find deployment: `boco84cokkg8ogk0w80wss8s`

**Expected Logs:**
```
🔨 Building Docker image...
✅ Docker build successful
📦 Running migrations...
✅ Prisma migrations applied
🚀 Starting container...
✅ Container started
🏥 Health check passed
✅ Deployment successful
```

**Current Status:** Probably still building...

### Step 2: Test API Health Endpoint

```bash
# Test if API is responding
curl https://dev.lumiku.com/health

# Expected (when ready):
{"status":"ok","timestamp":"2025-10-12T..."}

# If still deploying:
# Connection error or 502 Bad Gateway
```

### Step 3: Test Auth & Project Creation

```bash
# Step 1: Login
curl -X POST https://dev.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  -v

# Step 2: Create project (copy token from step 1)
curl -X POST https://dev.lumiku.com/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Testing FLUX","description":"First test with FLUX preview"}' \
  -v
```

---

## 🚀 Quick Fix Actions

### Action 1: Wait for Deployment (RECOMMENDED)

**Estimated Time:** 2-5 more minutes

**What to do:**
1. Open Coolify: https://cf.avolut.com
2. Monitor deployment logs for UUID: `boco84cokkg8ogk0w80wss8s`
3. Wait for "Deployment successful" message
4. Refresh browser and try creating project again

### Action 2: Force Restart (If Deployment Stuck)

**If deployment shows as "Completed" but API still returns 400:**

```bash
# Via Coolify API - Force restart
curl -X POST \
  -H "Authorization: Bearer 5|CJbL8liBi6ra65UfLhGlru4YexDVur9U86E9ZxYGc478ab97" \
  "https://cf.avolut.com/api/v1/applications/d8ggwoo484k8ok48g8k8cgwk/restart"
```

### Action 3: Check Backend Logs

**Via Coolify UI:**
1. Go to: dev-superlumiku → **Logs** tab
2. Look for errors in real-time logs

**Common errors to look for:**
- ❌ `Prisma Client not generated`
- ❌ `Database connection failed`
- ❌ `Environment variable not found`

### Action 4: Manual Migration (Last Resort)

**If migrations didn't run during deployment:**

```bash
# SSH to server
ssh deploy@dev.lumiku.com  # or appropriate user

# Navigate to project
cd /path/to/lumiku/backend

# Generate Prisma Client
bun prisma generate

# Push schema changes
bun prisma db push --skip-generate

# Restart PM2 service
pm2 restart lumiku-backend

# Check logs
pm2 logs lumiku-backend --lines 50
```

---

## 📊 Expected Timeline

| Time | Status | Action |
|------|--------|--------|
| **T+0** (Now) | 🔨 Building | Wait - deployment triggered |
| **T+2 min** | 📦 Installing deps | Wait - npm/bun install running |
| **T+3 min** | 🔄 Running migrations | Wait - Prisma migrate deploy |
| **T+4 min** | 🚀 Starting container | Wait - Docker container starting |
| **T+5 min** | ✅ **READY** | **Try create project again** |

---

## 🔍 Debugging Information

### Request Details (From Browser Console)

**Request:**
```http
POST /api/apps/avatar-creator/projects HTTP/1.1
Host: dev.lumiku.com
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Testing Coba",
  "description": "Ini percobaan 1 menggunakan FLUX"
}
```

**Response:**
```http
HTTP/1.1 400 Bad Request

{
  "error": "..."  // Error message should be here
}
```

**Missing:** Exact error message from backend

### Backend Code (routes.ts:72-88)

```typescript
routes.post('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()

    const validated = createProjectSchema.parse(body)

    const project = await avatarProjectService.createProject(userId, validated)

    return c.json({
      success: true,
      project,
      message: 'Project created successfully',
    }, 201)
  } catch (error: any) {
    console.error('Error creating project:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 400)
  }
})
```

**Error logged in backend should show exact cause!**

---

## ✅ Resolution Checklist

Wait ~5 minutes and then verify:

- [ ] Deployment status shows "Completed" in Coolify
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Backend logs show "Avatar Creator API initialized"
- [ ] No Prisma errors in logs
- [ ] Can create project successfully
- [ ] Project appears in project list
- [ ] Can enter project and see avatars list

---

## 📞 Next Steps

### If Error Persists After Deployment:

1. **Check Coolify deployment logs:**
   - Look for migration errors
   - Look for Prisma Client generation errors
   - Look for environment variable errors

2. **Check backend runtime logs:**
   - Look for actual error message
   - Look for stack trace

3. **Verify database schema:**
   - Connect to PostgreSQL
   - Check if `AvatarProject` table exists
   - Check if foreign keys are correct

4. **Test with curl:**
   - Bypass frontend to isolate issue
   - Get exact error response from API

---

## 🎯 Expected Result (After Deployment Completes)

**Success Response:**
```json
{
  "success": true,
  "project": {
    "id": "clxxxxxx...",
    "userId": "user_id",
    "name": "Testing Coba",
    "description": "Ini percobaan 1 menggunakan FLUX",
    "avatars": [],
    "createdAt": "2025-10-12T...",
    "updatedAt": "2025-10-12T..."
  },
  "message": "Project created successfully"
}
```

**UI Behavior:**
- ✅ Modal closes
- ✅ Project appears in project list
- ✅ User can click project to enter
- ✅ Can upload/generate avatars in project

---

## 📝 Summary

**Current Status:** Deployment in progress

**Most Likely Cause:** API not ready yet (deployment still running)

**Recommended Action:**
1. Wait 5 more minutes
2. Check Coolify deployment logs
3. Try creating project again once deployment shows "Completed"

**If still fails after deployment:**
- Check backend logs for exact error
- Verify Prisma migrations ran successfully
- Test with curl to get detailed error response

---

**Deployment UUID:** `boco84cokkg8ogk0w80wss8s`
**App UUID:** `d8ggwoo484k8ok48g8k8cgwk`
**Monitor at:** https://cf.avolut.com

---

**Expected Resolution Time:** 5-10 minutes from deployment trigger
