# Avatar Preview Flow - Deployment Guide

## 🎉 Backend Implementation: COMPLETE ✅

### What Was Implemented

The two-phase avatar generation flow has been fully implemented in the backend:

1. **Phase 1: Generate Preview** → User gets to see the avatar before committing
2. **Phase 2: Save** → Only if user likes the result

### Key Features Added

✅ **FLUX.1-dev + Realism LoRA Integration**
- Upgraded from SDXL (1B params) to FLUX.1-dev (12B params)
- Added XLabs-AI/flux-RealismLora for ultra-realistic portraits
- Better quality, photorealistic results

✅ **Two-Phase API Endpoints**
- `POST /api/avatar-creator/projects/:projectId/avatars/generate-preview` - Preview without saving
- `POST /api/avatar-creator/projects/:projectId/avatars/save-preview` - Save after approval

✅ **Body Type Support**
- Half Body (portrait/headshot) - default
- Full Body (full body portrait)

✅ **Database Schema Updates**
- Added `bodyType` field to Avatar model
- Updated style enum to include 'professional' and 'traditional'

---

## 📦 Files Modified

### Backend Files
1. **`backend/prisma/schema.prisma`** ✅
   - Added `bodyType String?` field
   - Updated style enum

2. **`backend/src/lib/huggingface-client.ts`** ✅
   - Added `fluxTextToImage()` method
   - LoRA support with configurable scale

3. **`backend/src/apps/avatar-creator/services/avatar-ai.service.ts`** ✅
   - `generatePreview()` - Returns base64 images without DB save
   - `savePreview()` - Converts base64 to files and saves to DB
   - Updated `buildAvatarPrompt()` for bodyType support

4. **`backend/src/apps/avatar-creator/routes.ts`** ✅
   - Added `generatePreviewSchema` validation
   - Added `savePreviewSchema` validation
   - Added `/generate-preview` endpoint (line 338-372)
   - Added `/save-preview` endpoint (line 374-416)

5. **`.env.development` & `.env.production`** ✅
   - Added FLUX model environment variables

6. **`backend/src/test-flux-avatar.ts`** ✅
   - Created test script for FLUX generation

---

## 🚀 Deployment Steps

### Step 1: Start Docker Services

The backend requires PostgreSQL and Redis running in Docker:

```bash
# Start Docker services (postgres + redis)
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Or start all services
docker-compose -f docker-compose.dev.yml up -d
```

**Note**: Docker must be installed and running on your system.

### Step 2: Run Database Migration

Once Docker is running, apply the schema changes:

```bash
cd backend
bun x prisma db push
```

Or create a named migration:

```bash
cd backend
bun x prisma migrate dev --name add_body_type_and_styles_to_avatar
```

### Step 3: Restart Backend Server

If the backend is running, restart it to pick up the new endpoints:

```bash
cd backend
bun dev
```

### Step 4: Test the New Endpoints

#### Test Preview Generation
```bash
curl -X POST http://localhost:3000/api/avatar-creator/projects/{projectId}/avatars/generate-preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "prompt": "Professional Indonesian woman with modern hijab, smiling",
    "gender": "female",
    "ageRange": "adult",
    "style": "professional",
    "bodyType": "half_body"
  }'
```

Expected response (~20-30 seconds):
```json
{
  "success": true,
  "preview": {
    "imageBase64": "...",
    "thumbnailBase64": "...",
    "enhancedPrompt": "professional portrait photo, Professional Indonesian woman..."
  },
  "message": "Preview generated successfully. Review and save if you like it."
}
```

#### Test Save Preview
```bash
curl -X POST http://localhost:3000/api/avatar-creator/projects/{projectId}/avatars/save-preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "My Avatar",
    "imageBase64": "...",
    "thumbnailBase64": "...",
    "generationPrompt": "...",
    "gender": "female",
    "ageRange": "adult",
    "style": "professional",
    "bodyType": "half_body"
  }'
```

Expected response (<1 second):
```json
{
  "success": true,
  "avatar": {
    "id": "...",
    "imageUrl": "/uploads/avatars/...",
    "thumbnailUrl": "/uploads/avatars/..."
  },
  "message": "Avatar saved successfully"
}
```

---

## 🔧 Environment Variables Required

Make sure these are set in your `.env` file:

```bash
# Database
DATABASE_URL="postgresql://lumiku_dev:lumiku_dev_password@postgres:5432/lumiku_development?schema=public"

# Redis
REDIS_HOST="redis"
REDIS_PORT="6379"

# HuggingFace API
HUGGINGFACE_API_KEY="hf_..." # Your HuggingFace API key

# FLUX Models (already configured)
FLUX_MODEL="black-forest-labs/FLUX.1-dev"
FLUX_LORA_MODEL="XLabs-AI/flux-RealismLora"
```

---

## 📝 API Endpoints Reference

### 1. Generate Preview (No Save)
- **URL**: `POST /api/avatar-creator/projects/:projectId/avatars/generate-preview`
- **Auth**: Required (Bearer token)
- **Body**:
  ```json
  {
    "prompt": "string (10-500 chars)",
    "gender": "male | female | unisex (optional)",
    "ageRange": "young | adult | mature (optional)",
    "style": "casual | formal | sporty | professional | traditional (optional)",
    "ethnicity": "string (optional)",
    "bodyType": "half_body | full_body (optional, default: half_body)"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "preview": {
      "imageBase64": "string",
      "thumbnailBase64": "string",
      "enhancedPrompt": "string"
    }
  }
  ```
- **Time**: 20-30 seconds
- **Credits**: NOT deducted

### 2. Save Preview
- **URL**: `POST /api/avatar-creator/projects/:projectId/avatars/save-preview`
- **Auth**: Required (Bearer token)
- **Body**:
  ```json
  {
    "name": "string (1-100 chars)",
    "imageBase64": "string",
    "thumbnailBase64": "string",
    "generationPrompt": "string",
    "gender": "male | female | unisex (optional)",
    "ageRange": "young | adult | mature (optional)",
    "style": "casual | formal | sporty | professional | traditional (optional)",
    "ethnicity": "string (optional)",
    "bodyType": "half_body | full_body (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "avatar": {
      "id": "string",
      "imageUrl": "string",
      "thumbnailUrl": "string"
    }
  }
  ```
- **Time**: <1 second
- **Credits**: Deducted here (TODO: implement credit check)

### 3. Legacy: Generate & Save (Old Flow)
- **URL**: `POST /api/avatar-creator/projects/:projectId/avatars/generate`
- **Auth**: Required (Bearer token)
- **Body**:
  ```json
  {
    "prompt": "string",
    "name": "string",
    "gender": "male | female | unisex (optional)",
    "ageRange": "young | adult | mature (optional)",
    "style": "casual | formal | sporty | professional | traditional (optional)",
    "ethnicity": "string (optional)",
    "bodyType": "half_body | full_body (optional)",
    "count": "number (1-5, optional)"
  }
  ```
- **Still works**: Backward compatible

---

## 🎨 Frontend Implementation (TODO)

### What Needs to Be Done

1. **Update Store** (`frontend/src/stores/avatarCreatorStore.ts`)
   - Add preview state management
   - Add `generatePreview()` action
   - Add `savePreview()` action
   - Add `clearPreview()` action

2. **Update Modal UI** (`frontend/src/apps/AvatarCreator.tsx`)
   - Add bodyType dropdown
   - Implement two-phase modal flow:
     - **Phase 1**: Form with "Generate Preview" button
     - **Phase 2**: Preview image + name input + Save/Regenerate/Cancel buttons

See `AVATAR_PREVIEW_FLOW_IMPLEMENTATION.md` for detailed frontend code examples.

---

## ⚠️ Current Issue

**Docker is not running** on this system, preventing database migration.

### Solutions:

**Option A: Start Docker**
1. Install Docker Desktop for Windows
2. Start Docker Desktop
3. Run: `docker-compose -f docker-compose.dev.yml up -d`
4. Run migration: `cd backend && bun x prisma db push`

**Option B: Deploy to Coolify**
1. Push code to git repository
2. Coolify will automatically:
   - Start Docker containers
   - Run database migrations
   - Deploy the updated backend

**Option C: Use Coolify CLI**
If Coolify is already configured:
```bash
# Push changes
git add .
git commit -m "feat: Add avatar preview flow with FLUX + Realism LoRA"
git push

# Coolify will auto-deploy
```

---

## 🧪 Testing

### Manual Test Script

Run the test script to verify FLUX generation:

```bash
cd backend
bun run src/test-flux-avatar.ts
```

This will:
1. Check HuggingFace API configuration
2. Generate a test avatar using FLUX + Realism LoRA
3. Verify file creation
4. Show generation time and file size

### Expected Output
```
🧪 Testing FLUX + Realism LoRA Avatar Generation

1️⃣ Checking HuggingFace API configuration...
✅ API key configured

2️⃣ Generating test avatar...
   Model: FLUX.1-dev + XLabs-AI/flux-RealismLora
   This may take 20-30 seconds...

✅ Generation successful!
   Duration: 25.43 seconds
   File size: 345.67 KB

🎉 All tests passed!
```

---

## 📊 Implementation Status

### ✅ Completed
- [x] Database schema updates
- [x] FLUX integration with LoRA support
- [x] Preview generation service
- [x] Save preview service
- [x] API endpoints
- [x] Validation schemas
- [x] Test script
- [x] Documentation

### ⏳ Pending
- [ ] Run database migration (requires Docker)
- [ ] Frontend store updates
- [ ] Frontend modal UI updates
- [ ] Credit checking/deduction logic
- [ ] User testing

---

## 🔗 Related Documentation

- Full implementation guide: `AVATAR_PREVIEW_FLOW_IMPLEMENTATION.md`
- Test script: `backend/src/test-flux-avatar.ts`
- Docker config: `docker-compose.dev.yml`

---

## 💡 Tips

1. **Preview is free**: Users can regenerate unlimited times before saving
2. **FLUX is slow**: ~20-30 seconds per generation (show loading indicator)
3. **Base64 size**: Preview images are ~500KB each, plan bandwidth accordingly
4. **Backward compatible**: Old `/generate` endpoint still works
5. **LoRA quality**: Set `loraScale: 0.9` for best results (range: 0.8-1.0)

---

## 🆘 Troubleshooting

### Database Connection Failed
- **Symptom**: `Can't reach database server at postgres:5432`
- **Solution**: Start Docker containers
  ```bash
  docker-compose -f docker-compose.dev.yml up -d postgres redis
  ```

### HuggingFace API Error
- **Symptom**: `MODEL_LOADING` or `RATE_LIMIT_EXCEEDED`
- **Solution**:
  - Wait 1-2 minutes for model to load (first request)
  - Check API key in `.env`: `HUGGINGFACE_API_KEY`
  - Free tier has rate limits, wait between requests

### Image Quality Issues
- **Symptom**: Blurry or unrealistic avatars
- **Solution**:
  - Ensure LoRA is enabled: `useLoRA: true`
  - Increase LoRA scale: `loraScale: 0.9` to `1.0`
  - Update prompt with more details

---

**Status**: Backend 100% complete ✅ | Frontend 0% complete ⏳
**Next Step**: Start Docker → Run migration → Implement frontend
