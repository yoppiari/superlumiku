# Week 2: Avatar & Pose Generator - Summary & Next Steps

## ✅ Completed (Day 1 & 2)

### Day 1: Dataset Preparation
- ✅ Downloaded 800 fashion poses from Hugging Face
- ✅ Created seed script for pose_templates table
- ✅ Seeded 800 dummy poses to production database
- ✅ Setup git branch workflow (development → dev.lumiku.com)

### Day 2: API Endpoints
- ✅ Created PoseTemplateService (244 LOC)
- ✅ Created PoseTemplateRoutes (143 LOC)
- ✅ Implemented 4 RESTful endpoints:
  - GET /api/poses (list with filters)
  - GET /api/poses/:id (single pose)
  - GET /api/poses/random (random pose)
  - GET /api/poses/stats (statistics)
- ✅ Deployed to dev.lumiku.com

### Dataset Status
- ✅ Fashion dataset: 800 samples downloaded locally
  - Location: `backend/storage/pose-dataset/fashion/`
  - Files: 1,601 (800 images + 800 masks + metadata.json)
  - Gender: 696 Women (87%), 104 Men (13%)
- ❌ Lifestyle dataset: Failed (network timeout)
  - Can be downloaded later when needed

---

## 📋 Day 3 Plan: Create Avatar & Pose Generator App

### Current Architecture Analysis

Lumiku menggunakan **plugin-based architecture**:
- Apps located in: `backend/src/apps/`
- Existing apps:
  - video-mixer
  - carousel-mix
  - looping-flow
  - poster-editor
  - video-generator

### Task 1: Create Avatar Generator App Structure

Need to create new app following the plugin pattern:

```
backend/src/apps/avatar-generator/
├── plugin.ts              # Plugin registration
├── routes.ts              # API routes
├── service.ts             # Business logic
├── types.ts               # TypeScript interfaces
└── workers/               # Background processing
    └── avatar-gen.worker.ts
```

### Task 2: Avatar Generator Features

**Core Functionality:**
1. **Pose Selection**
   - Browse pose templates (use /api/poses endpoint)
   - Filter by category, difficulty, gender
   - Random pose button
   - Preview pose keypoints

2. **Avatar Generation**
   - Input: User photo + Selected pose
   - AI Model: Use ControlNet with OpenPose
   - Process: Extract person → Apply pose → Generate avatar
   - Output: Avatar image in selected pose

3. **Generation Tracking**
   - Store generation history
   - Track credit usage
   - Show preview/download

### Task 3: Frontend UI (if needed)

Current frontend structure unknown. Options:
1. **Option A**: Create dedicated frontend page (if frontend exists)
2. **Option B**: API-only for now, frontend later
3. **Option C**: Use existing plugin pattern for frontend

---

## 🎯 Immediate Next Steps (Day 3)

### Step 1: Analyze Existing App Structure
- Read one existing app (e.g., video-mixer)
- Understand plugin registration pattern
- Identify worker pattern for async processing

### Step 2: Create Avatar Generator App
- Create directory structure
- Register plugin
- Create basic routes
- Implement avatar generation service

### Step 3: Integrate ControlNet
- Setup AI model endpoint (if not exists)
- Create worker for background processing
- Test pose-to-avatar generation

### Step 4: Test & Deploy
- Test with real pose templates
- Deploy to dev.lumiku.com
- Verify end-to-end flow

---

## 📊 API Endpoints Summary (Ready to Use)

All endpoints authenticated with Bearer token:

```bash
# List poses with filters
GET /api/poses?category=fashion&difficulty=easy&limit=20

# Get single pose
GET /api/poses/:id

# Random pose
GET /api/poses/random?gender=female

# Statistics
GET /api/poses/stats
```

**Response Example:**
```json
{
  "data": [
    {
      "id": "cuid123",
      "category": "fashion",
      "previewUrl": "/storage/pose-dataset/fashion/fashion_0000_image.jpg",
      "keypointsJson": "{...}",
      "difficulty": "medium",
      "gender": "female",
      "tags": "standing,arms-crossed"
    }
  ],
  "meta": {
    "total": 800,
    "page": 1,
    "perPage": 20,
    "hasMore": true
  }
}
```

---

## 🔧 Technical Stack

**Backend:**
- Framework: Hono (Bun runtime)
- Database: PostgreSQL (Prisma ORM)
- AI Models: ControlNet + OpenPose
- Queue: Bull/BullMQ for background jobs

**Deployment:**
- Dev: https://dev.lumiku.com (auto-deploy from `development` branch)
- Prod: https://app.lumiku.com (manual deploy from `main` branch)

---

## 🚧 Blockers & Decisions Needed

### Decision 1: AI Model Integration
**Question**: Where is ControlNet hosted?
- Option A: External API (Replicate, Hugging Face)
- Option B: Self-hosted (Docker container)
- Option C: Serverless (Modal, Banana)

**Current Status**: Need to check existing AI integrations in other apps

### Decision 2: Frontend Approach
**Question**: Create frontend now or API-only?
- Option A: Full-stack (backend + frontend)
- Option B: API-only (frontend later)

**Recommendation**: Start with API-only, test with Postman/curl

### Decision 3: Real Images vs Dummy Data
**Question**: Use real pose images or continue with dummy data?
- Current: 800 real images downloaded locally
- Need to: Serve images from backend or upload to CDN?

**Recommendation**: Serve from backend `/uploads` directory first

---

## 📝 Files to Review Next

1. `backend/src/apps/video-mixer/plugin.ts` - Understand plugin pattern
2. `backend/src/apps/video-mixer/service.ts` - Understand service pattern
3. `backend/src/apps/video-mixer/workers/*` - Understand worker pattern
4. `backend/src/plugins/loader.ts` - Understand plugin loading
5. `backend/src/plugins/types.ts` - Understand plugin interface

---

**Status**: Week 2 Day 2 COMPLETED, Ready for Day 3
**Last Updated**: 2025-10-10
**Next Action**: Analyze existing app structure and create Avatar Generator plugin
