# AVATAR & POSE GENERATOR - MASTER IMPLEMENTATION REFERENCE

**Document Version:** 1.0
**Created:** 2025-10-10
**Status:** Implementation Guide for dev.lumiku.com
**Target:** Complete Avatar & Pose Generator System

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Implementation Location](#implementation-location)
4. [Database Schema (Copy-Paste Ready)](#database-schema)
5. [Plugin Configuration](#plugin-configuration)
6. [API Endpoints](#api-endpoints)
7. [File Structure](#file-structure)
8. [Dependencies](#dependencies)
9. [Environment Variables](#environment-variables)
10. [Implementation Checklist](#implementation-checklist)
11. [Troubleshooting](#troubleshooting)
12. [Rollback Strategy](#rollback-strategy)

---

## 📊 EXECUTIVE SUMMARY

### What We're Building

**4 New Applications** untuk Lumiku platform:
1. **Brand Kit Manager** - Multi-brand management system
2. **Avatar Manager** - Avatar upload & AI generation
3. **Product Manager** - Product catalog with background removal
4. **Pose Generator** - AI-powered pose generation (CORE FEATURE)

### Target Market
UMKM Indonesia yang butuh ratusan product photos tanpa photoshoot mahal.

### Core Innovation
**Dataset-driven pose generation** dengan >90% success rate menggunakan:
- Pre-validated pose templates (500-1000 poses dari Hugging Face)
- ControlNet + Stable Diffusion XL
- BullMQ batch processing

### Timeline
**12 weeks** untuk complete MVP

### Cost Savings for Users
- Traditional photoshoot: Rp 6.5jt - 19jt
- With Lumiku: Rp 299k/month
- **ROI: 4,000%+**

---

## 🏗️ SYSTEM ARCHITECTURE

### Existing Lumiku Architecture (CONFIRMED)

```
Lumiku Suite (Dev: dev.lumiku.com)
├── Backend: Bun + Hono
├── Frontend: React + Vite
├── Database: PostgreSQL (Prisma ORM)
├── Storage: Local uploads/ directory
├── Queue: BullMQ (Redis required)
└── Plugins: Auto-loaded via registry
```

### Plugin System Pattern (EXISTING)

**Backend Plugin Structure:**
```typescript
backend/src/apps/[app-name]/
├── plugin.config.ts         // Plugin metadata & config
├── routes.ts                // Hono routes
├── services/                // Business logic
├── repositories/            // Data access
├── controllers/             // Request handlers
├── workers/                 // BullMQ workers
└── lib/                     // Utilities
```

**Frontend App Structure:**
```typescript
frontend/src/apps/
├── [AppName].tsx            // Main component
└── [app-name]/              // Supporting components (optional)
    └── components/
```

**Plugin Registration Flow:**
1. Create `plugin.config.ts` with `PluginConfig` type
2. Create `routes.ts` with Hono router
3. Import both in `backend/src/plugins/loader.ts`
4. Call `pluginRegistry.register(config, routes)`
5. Plugin auto-mounted at `config.routePrefix`

---

## 📍 IMPLEMENTATION LOCATION

### ✅ CONFIRMED Structure for Avatar & Pose System

```
backend/src/apps/
├── video-mixer/          ✅ Existing
├── carousel-mix/         ✅ Existing
├── looping-flow/         ✅ Existing
├── video-generator/      ✅ Existing
├── poster-editor/        ✅ Existing
│
├── brand-kit/            🆕 NEW - Multi-brand management
│   ├── plugin.config.ts
│   ├── routes.ts
│   ├── services/
│   │   └── brand-kit.service.ts
│   ├── repositories/
│   │   └── brand-kit.repository.ts
│   └── controllers/
│       └── brand-kit.controller.ts
│
├── avatar-manager/       🆕 NEW - Avatar management
│   ├── plugin.config.ts
│   ├── routes.ts
│   ├── services/
│   │   ├── avatar.service.ts
│   │   └── avatar-ai.service.ts      // AI avatar generation (Phase 2)
│   ├── repositories/
│   │   └── avatar.repository.ts
│   └── controllers/
│       └── avatar.controller.ts
│
├── product-manager/      🆕 NEW - Product catalog
│   ├── plugin.config.ts
│   ├── routes.ts
│   ├── services/
│   │   ├── product.service.ts
│   │   └── sam-remover.service.ts    // Background removal
│   ├── repositories/
│   │   └── product.repository.ts
│   └── controllers/
│       └── product.controller.ts
│
└── pose-generator/       🆕 NEW - Core pose engine
    ├── plugin.config.ts
    ├── routes.ts
    ├── services/
    │   ├── pose-generation.service.ts
    │   ├── controlnet.service.ts
    │   └── pose-dataset.service.ts
    ├── repositories/
    │   └── pose.repository.ts
    ├── controllers/
    │   └── pose.controller.ts
    ├── workers/
    │   └── pose-generation.worker.ts
    └── lib/
        ├── pose-loader.ts            // Load pose dataset
        └── huggingface-client.ts     // HF Inference API
```

**Frontend:**
```
frontend/src/apps/
├── VideoMixer.tsx        ✅ Existing
├── CarouselMix.tsx       ✅ Existing
├── LoopingFlow.tsx       ✅ Existing
├── VideoGenerator.tsx    ✅ Existing
├── PosterEditor.tsx      ✅ Existing
│
├── BrandKit.tsx          🆕 NEW
├── AvatarManager.tsx     🆕 NEW
├── ProductManager.tsx    🆕 NEW
└── PoseGenerator.tsx     🆕 NEW
```

---

## 💾 DATABASE SCHEMA

### COPY-PASTE READY: Add to `backend/prisma/schema.prisma`

```prisma
// ========================================
// AVATAR & POSE GENERATOR SYSTEM
// ========================================

// ========================================
// BRAND KIT SYSTEM
// ========================================

model BrandKit {
  id          String   @id @default(cuid())
  userId      String

  // Multi-brand support
  brandName   String   // "Skincare Aura", "Fashion Elite", "Kids World"
  category    String?  // "skincare", "fashion", "kids", etc

  // Brand Assets
  logoUrl     String?
  colors      String   // JSON: ["#FF5733", "#33FF57"]
  fonts       String   // JSON: [{family: "Inter", weights: [400,700]}]

  // Brand Voice (for future AI copywriting)
  tone        String?  // "casual", "formal", "playful"
  tagline     String?

  isDefault   Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  avatars     Avatar[]
  products    Product[]

  @@index([userId])
  @@map("brand_kits")
}

// ========================================
// AVATAR SYSTEM
// ========================================

model Avatar {
  id              String   @id @default(cuid())
  userId          String
  brandKitId      String

  name            String   // "Skincare Model - Aura"
  baseImageUrl    String   // Original avatar image
  thumbnailUrl    String?

  // Avatar characteristics (for better pose matching)
  gender          String?  // "male", "female", "unisex"
  ageRange        String?  // "young", "adult", "mature"
  style           String?  // "casual", "formal", "sporty"
  ethnicity       String?  // "asian", "caucasian", "mixed", etc

  // Generation settings (if AI-generated)
  generationPrompt   String?
  faceEmbedding      String? // For consistent face across poses (future)

  // Source
  sourceType      String   // "upload", "ai_generated"

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  brandKit        BrandKit @relation(fields: [brandKitId], references: [id], onDelete: Cascade)
  generatedPoses  GeneratedPose[]

  @@index([userId])
  @@index([brandKitId])
  @@map("avatars")
}

// ========================================
// PRODUCT SYSTEM
// ========================================

model Product {
  id              String   @id @default(cuid())
  userId          String
  brandKitId      String

  name            String
  category        String   // "skincare", "fashion-top", "accessory", etc
  subcategory     String?  // "serum", "moisturizer", "shirt", "shoes"

  // Product assets
  originalUrl     String   // Original upload
  transparentUrl  String?  // After background removal (SAM)
  thumbnailUrl    String?

  // Product metadata (for better placement in poses)
  productType     String   // "bottle", "tube", "box", "clothing", "accessory"
  placement       String   // "hand-held", "worn", "displayed", "table"
  dominantColor   String?  // For smart background matching

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  brandKit        BrandKit @relation(fields: [brandKitId], references: [id], onDelete: Cascade)
  generatedPoses  GeneratedPose[]

  @@index([userId])
  @@index([brandKitId])
  @@index([category])
  @@map("products")
}

// ========================================
// POSE TEMPLATE LIBRARY
// ========================================

model PoseTemplate {
  id              String   @id @default(cuid())

  // Categorization
  category        String   // "fashion-standing", "skincare-application", etc
  subcategory     String?  // "casual", "formal", "action"

  // Pose data (OpenPose format - 18 keypoints)
  keypointsJson   String   // JSON: [{x, y, confidence}, ...]
  previewUrl      String   // Small preview image

  // Metadata
  difficulty      String   // "simple", "medium", "complex"
  tags            String   // JSON: ["standing", "front-facing", "arms-crossed"]
  description     String?

  // Quality tracking
  usageCount      Int      @default(0)
  successRate     Float    @default(0.95) // Track generation success
  avgQualityScore Float    @default(0.85)

  // Filtering
  gender          String?  // "male", "female", "unisex"
  productPlacement String? // "hand-left", "hand-right", "worn", "both-hands"

  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  generatedPoses  GeneratedPose[]

  @@index([category, isActive])
  @@index([successRate])
  @@map("pose_templates")
}

// ========================================
// POSE GENERATION
// ========================================

model PoseGenerationProject {
  id              String   @id @default(cuid())
  userId          String
  brandKitId      String

  name            String
  description     String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  generations     PoseGeneration[]

  @@index([userId])
  @@map("pose_generation_projects")
}

model PoseGeneration {
  id              String   @id @default(cuid())
  projectId       String
  userId          String
  avatarId        String
  productId       String

  // Generation settings
  totalPoses      Int      // Target number of poses
  poseDistribution String  // JSON: {"standing": 50, "walking": 30, "sitting": 20}

  // AI settings
  provider        String   // "huggingface", "fal", "replicate"
  modelId         String   // "control_v11p_sd15_openpose"

  // Prompt engineering
  basePrompt      String   // From brand kit + product
  negativePrompt  String?

  // Status
  status          String   @default("pending") // pending, processing, completed, failed
  progress        Int      @default(0) // 0-100

  // Results
  successfulPoses Int      @default(0)
  failedPoses     Int      @default(0)

  // Credits
  creditUsed      Int      @default(0)

  // Output
  outputFolder    String?  // Path to generated poses

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  completedAt     DateTime?

  project         PoseGenerationProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  generatedPoses  GeneratedPose[]

  @@index([projectId])
  @@index([userId])
  @@index([status])
  @@map("pose_generations")
}

model GeneratedPose {
  id              String   @id @default(cuid())
  generationId    String
  userId          String
  avatarId        String
  productId       String
  poseTemplateId  String

  // Generation params
  prompt          String
  negativePrompt  String?
  controlnetImage String?  // Pose skeleton image used

  // Result
  outputUrl       String
  thumbnailUrl    String?

  // Quality metrics
  success         Boolean  @default(true)
  qualityScore    Float?   // 0-1 (AI quality assessment)
  generationTime  Int      // seconds

  // AI metadata
  provider        String   // "huggingface", "fal", etc
  providerJobId   String?
  seed            Int?     // For reproducibility

  // Usage tracking
  exported        Boolean  @default(false)
  exportCount     Int      @default(0)
  usedInPosters   Int      @default(0)

  // User feedback (optional)
  userRating      Int?     // 1-5 stars

  createdAt       DateTime @default(now())

  generation      PoseGeneration @relation(fields: [generationId], references: [id], onDelete: Cascade)
  avatar          Avatar         @relation(fields: [avatarId], references: [id])
  product         Product        @relation(fields: [productId], references: [id])
  poseTemplate    PoseTemplate   @relation(fields: [poseTemplateId], references: [id])

  @@index([generationId])
  @@index([userId, createdAt])
  @@index([poseTemplateId, success]) // For tracking template success rates
  @@map("generated_poses")
}

// ========================================
// ANALYTICS (Internal - Track User Productivity)
// ========================================

model DesignMetrics {
  id              String   @id @default(cuid())
  userId          String
  brandKitId      String
  designType      String   // "avatar", "pose", "poster"

  // Usage stats
  timesCreated    Int      @default(0)
  timesExported   Int      @default(0)
  formatBreakdown String   // JSON: {"ig_post": 50, "fb_cover": 30}

  // Time tracking
  avgCreationTime Int      // seconds
  totalTimeSaved  Int      // vs traditional methods (estimated)

  // Cost tracking
  estimatedSavings Float   // Rupiah saved vs photoshoot

  // Period
  period          String   // "2025-10" for monthly aggregation

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, brandKitId, designType, period])
  @@index([userId, period])
  @@map("design_metrics")
}
```

### Update User Model Relations

**Add to existing `model User`:**
```prisma
model User {
  // ... existing fields ...

  // NEW RELATIONS for Avatar & Pose System
  brandKits    BrandKit[]
  avatars      Avatar[]
  products     Product[]

  // ... existing relations ...
}
```

---

## 🔌 PLUGIN CONFIGURATION

### 1. Brand Kit Plugin

**File:** `backend/src/apps/brand-kit/plugin.config.ts`

```typescript
import { PluginConfig } from '../../plugins/types'

export const brandKitConfig: PluginConfig = {
  // Identity
  appId: 'brand-kit',
  name: 'Brand Kit Manager',
  description: 'Manage multiple brand identities with colors, fonts, and logos',
  icon: 'palette',
  version: '1.0.0',

  // Routing
  routePrefix: '/api/apps/brand-kit',

  // Credits per action
  credits: {
    createBrandKit: 5,
    updateBrandKit: 2,
    deleteBrandKit: 1,
    uploadLogo: 3,
  },

  // Access control
  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },

  // Features
  features: {
    enabled: true,
    beta: false,
    comingSoon: false,
  },

  // Dashboard config
  dashboard: {
    order: 10,
    color: 'purple',
    stats: {
      enabled: true,
      endpoint: '/api/apps/brand-kit/stats',
    },
  },
}

export default brandKitConfig
```

### 2. Avatar Manager Plugin

**File:** `backend/src/apps/avatar-manager/plugin.config.ts`

```typescript
import { PluginConfig } from '../../plugins/types'

export const avatarManagerConfig: PluginConfig = {
  appId: 'avatar-manager',
  name: 'Avatar Manager',
  description: 'Upload and manage avatar collection for pose generation',
  icon: 'user-circle',
  version: '1.0.0',

  routePrefix: '/api/apps/avatar-manager',

  credits: {
    uploadAvatar: 5,
    generateAvatarAI: 20,      // AI generation (Phase 2)
    updateAvatar: 2,
    deleteAvatar: 1,
  },

  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },

  features: {
    enabled: true,
    beta: false,
    comingSoon: false,
  },

  dashboard: {
    order: 11,
    color: 'blue',
    stats: {
      enabled: true,
      endpoint: '/api/apps/avatar-manager/stats',
    },
  },
}

export default avatarManagerConfig
```

### 3. Product Manager Plugin

**File:** `backend/src/apps/product-manager/plugin.config.ts`

```typescript
import { PluginConfig } from '../../plugins/types'

export const productManagerConfig: PluginConfig = {
  appId: 'product-manager',
  name: 'Product Manager',
  description: 'Upload products and auto-remove backgrounds',
  icon: 'package',
  version: '1.0.0',

  routePrefix: '/api/apps/product-manager',

  credits: {
    uploadProduct: 5,
    removeBackground: 3,       // SAM background removal
    bulkUpload: 10,            // per batch
    updateProduct: 2,
    deleteProduct: 1,
  },

  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },

  features: {
    enabled: true,
    beta: false,
    comingSoon: false,
  },

  dashboard: {
    order: 12,
    color: 'green',
    stats: {
      enabled: true,
      endpoint: '/api/apps/product-manager/stats',
    },
  },
}

export default productManagerConfig
```

### 4. Pose Generator Plugin ⭐ CORE

**File:** `backend/src/apps/pose-generator/plugin.config.ts`

```typescript
import { PluginConfig } from '../../plugins/types'

export const poseGeneratorConfig: PluginConfig = {
  appId: 'pose-generator',
  name: 'Pose Generator',
  description: 'Generate hundreds of professional product photos with AI poses',
  icon: 'zap',
  version: '1.0.0',

  routePrefix: '/api/apps/pose-generator',

  credits: {
    generatePose: 10,          // Per pose generated
    batchGeneration: 5,        // Per pose when batch (100+)
    retryFailedPose: 5,
    qualityEnhancement: 15,    // Super resolution (future)
    exportToPoster: 3,         // Send to Poster Editor
  },

  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },

  features: {
    enabled: true,
    beta: true,               // Beta during Phase 1-8
    comingSoon: false,
  },

  dashboard: {
    order: 13,
    color: 'orange',
    stats: {
      enabled: true,
      endpoint: '/api/apps/pose-generator/stats',
    },
  },
}

export default poseGeneratorConfig
```

---

## 🌐 API ENDPOINTS

### Brand Kit Endpoints

```
POST   /api/apps/brand-kit/kits           - Create new brand kit
GET    /api/apps/brand-kit/kits           - List all brand kits (user's)
GET    /api/apps/brand-kit/kits/:id       - Get specific brand kit
PATCH  /api/apps/brand-kit/kits/:id       - Update brand kit
DELETE /api/apps/brand-kit/kits/:id       - Delete brand kit
POST   /api/apps/brand-kit/kits/:id/logo  - Upload logo
GET    /api/apps/brand-kit/stats          - Usage statistics
```

### Avatar Manager Endpoints

```
POST   /api/apps/avatar-manager/avatars           - Upload avatar
POST   /api/apps/avatar-manager/avatars/generate  - AI generate avatar (Phase 2)
GET    /api/apps/avatar-manager/avatars           - List avatars (by brand kit)
GET    /api/apps/avatar-manager/avatars/:id       - Get avatar details
PATCH  /api/apps/avatar-manager/avatars/:id       - Update avatar
DELETE /api/apps/avatar-manager/avatars/:id       - Delete avatar
GET    /api/apps/avatar-manager/stats             - Usage statistics
```

### Product Manager Endpoints

```
POST   /api/apps/product-manager/products                - Upload product
POST   /api/apps/product-manager/products/bulk           - Bulk upload
POST   /api/apps/product-manager/products/:id/remove-bg  - Remove background (SAM)
GET    /api/apps/product-manager/products                - List products (by brand kit)
GET    /api/apps/product-manager/products/:id            - Get product details
PATCH  /api/apps/product-manager/products/:id            - Update product
DELETE /api/apps/product-manager/products/:id            - Delete product
GET    /api/apps/product-manager/stats                   - Usage statistics
```

### Pose Generator Endpoints

```
POST   /api/apps/pose-generator/projects                     - Create project
GET    /api/apps/pose-generator/projects                     - List projects
GET    /api/apps/pose-generator/projects/:id                 - Get project details

POST   /api/apps/pose-generator/generate                     - Start generation
GET    /api/apps/pose-generator/generate/:id                 - Get generation status
POST   /api/apps/pose-generator/generate/:id/retry           - Retry failed poses

GET    /api/apps/pose-generator/templates                    - List pose templates
GET    /api/apps/pose-generator/templates/:id                - Get template details
GET    /api/apps/pose-generator/templates/category/:cat      - Filter by category

GET    /api/apps/pose-generator/results/:generationId        - Get all results
GET    /api/apps/pose-generator/results/:id/download         - Download single pose
POST   /api/apps/pose-generator/results/:id/rate             - Rate pose quality

GET    /api/apps/pose-generator/stats                        - Usage statistics
```

---

## 📦 DEPENDENCIES

### Backend Dependencies (Add to `package.json`)

```json
{
  "dependencies": {
    // EXISTING - Already installed
    "@prisma/client": "^5.x.x",
    "hono": "^3.x.x",
    "bullmq": "^4.x.x",
    "redis": "^4.x.x",

    // NEW - For Avatar & Pose System
    "@huggingface/inference": "^2.6.0",     // Hugging Face API client
    "axios": "^1.6.0",                       // HTTP client for API calls
    "form-data": "^4.0.0",                   // Multipart form handling
    "sharp": "^0.33.0",                      // Image processing (already installed?)
    "canvas": "^2.11.2"                      // For pose skeleton rendering
  }
}
```

### Frontend Dependencies (Add to `package.json`)

```json
{
  "dependencies": {
    // NEW - For Avatar & Pose UI
    "react-dropzone": "^14.2.3",            // File upload
    "react-color": "^2.19.3",               // Color picker for brand kit
    "@tanstack/react-query": "^5.x.x",      // Already installed
    "zustand": "^4.x.x"                     // Already installed
  }
}
```

### Install Commands

```bash
# Backend
cd backend
bun add @huggingface/inference axios form-data canvas

# Frontend
cd frontend
bun add react-dropzone react-color

# Install if not exists
bun add sharp
```

---

## 🔐 ENVIRONMENT VARIABLES

### Add to `.env` (Development)

```bash
# EXISTING
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
JWT_SECRET="..."
CORS_ORIGIN="http://localhost:5173"

# NEW: Hugging Face API
HUGGINGFACE_API_KEY="hf_xxxxxxxxxxxxxxxxxxxxx"
HUGGINGFACE_MODEL_ID="lllyasviel/control_v11p_sd15_openpose"

# NEW: Fal.ai (Fallback Provider - Optional)
FAL_API_KEY="xxxxxxxxxxxxxxxxxxxxx"

# NEW: Replicate (Alternative Provider - Optional)
REPLICATE_API_TOKEN="r8_xxxxxxxxxxxxxxxxxxxxx"

# NEW: Pose Dataset Storage
POSE_DATASET_PATH="./storage/pose-dataset"
POSE_DATASET_URL="https://huggingface.co/datasets/sayakpaul/poses-controlnet-dataset"

# NEW: Storage Limits
MAX_AVATAR_SIZE_MB=10
MAX_PRODUCT_SIZE_MB=20
MAX_POSES_PER_GENERATION=500
```

### Add to `.env.production` (Coolify/dev.lumiku.com)

```bash
# Update with production values
DATABASE_URL="postgresql://prod_user:prod_pass@prod_host:5432/lumiku_prod"
REDIS_URL="redis://prod_redis:6379"

# Get keys from:
# - Hugging Face: https://huggingface.co/settings/tokens
# - Fal.ai: https://fal.ai/dashboard
# - Replicate: https://replicate.com/account/api-tokens
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (Week 1-2)

#### Database Setup
- [ ] Copy schema additions to `backend/prisma/schema.prisma`
- [ ] Add relations to existing `User` model
- [ ] Run `bun prisma:generate`
- [ ] Run `bun prisma migrate dev --name add-avatar-pose-system`
- [ ] Verify migration successful in database

#### Dependencies
- [ ] Install backend dependencies (`@huggingface/inference`, `axios`, etc)
- [ ] Install frontend dependencies (`react-dropzone`, `react-color`)
- [ ] Test imports work (no errors)

#### Environment Setup
- [ ] Add Hugging Face API key to `.env`
- [ ] Get free HF token: https://huggingface.co/settings/tokens
- [ ] Test HF API connection with simple script
- [ ] Setup pose dataset download path

#### Pose Dataset Preparation
- [ ] Download pose dataset from Hugging Face (500-1000 poses)
- [ ] Categorize poses (fashion, skincare, lifestyle)
- [ ] Create `PoseTemplate` seed data
- [ ] Load templates into database

**Deliverable:** Database ready, dependencies installed, pose library loaded

---

### Phase 2: Brand Kit System (Week 3)

#### Backend
- [ ] Create `backend/src/apps/brand-kit/` folder structure
- [ ] Implement `plugin.config.ts`
- [ ] Implement `routes.ts` with CRUD endpoints
- [ ] Create `brand-kit.service.ts` (business logic)
- [ ] Create `brand-kit.repository.ts` (data access)
- [ ] Create `brand-kit.controller.ts` (request handlers)
- [ ] Register plugin in `backend/src/plugins/loader.ts`
- [ ] Test API endpoints with Postman/Thunder Client

#### Frontend
- [ ] Create `frontend/src/apps/BrandKit.tsx`
- [ ] Implement brand kit list view
- [ ] Implement create/edit form
- [ ] Add color picker (react-color)
- [ ] Add font selector
- [ ] Add logo upload
- [ ] Test full CRUD flow

**Deliverable:** Users can create & manage multiple brand kits

---

### Phase 3: Avatar Manager (Week 4-5)

#### Week 4: Upload & CRUD
- [ ] Create `backend/src/apps/avatar-manager/` structure
- [ ] Implement `plugin.config.ts`
- [ ] Implement `routes.ts`
- [ ] Create `avatar.service.ts`
- [ ] Create `avatar.repository.ts`
- [ ] Handle file upload (multipart/form-data)
- [ ] Generate thumbnails with Sharp
- [ ] Register plugin
- [ ] Test API endpoints

#### Week 4: Frontend
- [ ] Create `frontend/src/apps/AvatarManager.tsx`
- [ ] Implement file upload (react-dropzone)
- [ ] Avatar gallery view
- [ ] Avatar editor (crop, adjust)
- [ ] Link to brand kit selector
- [ ] Test upload flow

#### Week 5: AI Generation (Optional - Can Skip for MVP)
- [ ] Create `avatar-ai.service.ts`
- [ ] Integrate Hugging Face SDXL
- [ ] Implement face consistency (embeddings)
- [ ] Add generation UI
- [ ] Test AI avatar generation

**Deliverable:** Users can upload & manage avatars

---

### Phase 4: Product Manager (Week 6)

#### Backend
- [ ] Create `backend/src/apps/product-manager/` structure
- [ ] Implement `plugin.config.ts`
- [ ] Implement `routes.ts`
- [ ] Create `product.service.ts`
- [ ] Create `sam-remover.service.ts` (integrate existing SAM)
- [ ] Handle bulk upload
- [ ] Auto background removal on upload
- [ ] Register plugin

#### Frontend
- [ ] Create `frontend/src/apps/ProductManager.tsx`
- [ ] Bulk upload UI
- [ ] Product gallery with categories
- [ ] Preview with/without background
- [ ] Product metadata form
- [ ] Filter by brand kit

**Deliverable:** Users can upload & manage product catalog

---

### Phase 5: Pose Generator Core (Week 7-9) ⭐

#### Week 7: Setup & UI
- [ ] Create `backend/src/apps/pose-generator/` structure
- [ ] Implement `plugin.config.ts`
- [ ] Implement `routes.ts`
- [ ] Create `pose-dataset.service.ts` (load templates)
- [ ] Create pose template browser API
- [ ] Frontend: Pose template browser UI
- [ ] Frontend: Category filters
- [ ] Frontend: Pose distribution selector

#### Week 8: Generation Engine
- [ ] Create `huggingface-client.ts` (HF Inference API wrapper)
- [ ] Create `controlnet.service.ts`
- [ ] Implement single pose generation
- [ ] Test with 1 avatar + 1 product + 1 pose template
- [ ] Implement quality assessment
- [ ] Error handling & retry logic
- [ ] Test with various templates

#### Week 9: Batch Processing
- [ ] Create BullMQ worker `pose-generation.worker.ts`
- [ ] Implement batch generation logic
- [ ] Progress tracking (Redis)
- [ ] Real-time updates (SSE or polling)
- [ ] Failed pose retry mechanism
- [ ] Success rate monitoring
- [ ] Frontend: Progress UI
- [ ] Frontend: Results gallery
- [ ] Test batch generation (10, 50, 100 poses)

**Deliverable:** Fully functional pose generation system

---

### Phase 6: Poster Editor Enhancement (Week 10)

#### Integration
- [ ] Add "Send to Poster Editor" button in Pose Generator
- [ ] Pose result picker component
- [ ] Drag & drop poses to Poster Editor canvas
- [ ] Auto-apply brand kit (colors, fonts, logo)
- [ ] Template system integration
- [ ] Multi-format export
- [ ] Batch variation generator
- [ ] Test full workflow: Pose → Poster → Export

**Deliverable:** Complete workflow from pose to poster to export

---

### Phase 7: Analytics Dashboard (Week 11)

#### Backend
- [ ] Create `DesignMetrics` tracking service
- [ ] Daily/monthly aggregation
- [ ] Analytics API endpoints
- [ ] Time saved calculator
- [ ] Cost saved calculator

#### Frontend
- [ ] Analytics dashboard UI
- [ ] Charts (usage, savings, trends)
- [ ] Export analytics (PDF/CSV)
- [ ] Usage insights & recommendations

**Deliverable:** Analytics dashboard showing productivity gains

---

### Phase 8: Polish & Testing (Week 12)

- [ ] UI/UX consistency check
- [ ] Onboarding flow for new users
- [ ] In-app tutorials
- [ ] Error message improvements
- [ ] Performance optimization
- [ ] Loading states & skeletons
- [ ] Mobile responsive check
- [ ] Cross-browser testing
- [ ] User acceptance testing
- [ ] Documentation (user guides)
- [ ] Deploy to dev.lumiku.com
- [ ] Beta testing with real users

**Deliverable:** Production-ready MVP

---

## 🔧 TROUBLESHOOTING

### Database Issues

**Problem:** Migration fails
```bash
# Solution: Reset database (CAUTION: Dev only!)
bun prisma migrate reset
bun prisma migrate dev --name add-avatar-pose-system
```

**Problem:** Relation error
```bash
# Solution: Regenerate Prisma client
bun prisma generate
```

### Plugin Loading Issues

**Problem:** Plugin not appearing in dashboard
```typescript
// Check: backend/src/plugins/loader.ts
// Make sure plugin is registered:
pluginRegistry.register(brandKitConfig, brandKitRoutes)

// Check: plugin.config.ts
features: {
  enabled: true,  // Must be true!
  beta: false,
  comingSoon: false,
}
```

**Problem:** Routes not working (404)
```typescript
// Check routePrefix matches API calls
// Backend: routePrefix: '/api/apps/brand-kit'
// Frontend: fetch('/api/apps/brand-kit/kits')
```

### Hugging Face API Issues

**Problem:** API key invalid
```bash
# Test connection:
curl https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Problem:** Rate limit exceeded
```bash
# Solution: Use free tier wisely (30k/month)
# Or upgrade to HF Pro ($9/month)
# Or add fallback to Fal.ai
```

**Problem:** Model loading timeout
```bash
# Solution: Models may be cold-starting (first load)
# Retry after 30 seconds
# Or use "warm" models (frequently used)
```

### File Upload Issues

**Problem:** File too large
```typescript
// Check: middleware/file-upload.ts
// Increase limit if needed:
limits: {
  fileSize: 20 * 1024 * 1024, // 20MB
}
```

**Problem:** MIME type not allowed
```typescript
// Add to allowed types:
fileFilter: (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type'))
  }
}
```

### BullMQ Worker Issues

**Problem:** Worker not processing
```bash
# Check Redis connection
redis-cli ping
# Should return: PONG

# Check worker logs
DEBUG=bullmq:* bun run backend
```

**Problem:** Jobs stuck in queue
```bash
# Clear queue (Dev only!)
redis-cli FLUSHALL
```

---

## 🔄 ROLLBACK STRATEGY

### If Something Goes Wrong

#### Level 1: Code Rollback
```bash
# Revert to last commit
git reset --hard HEAD~1

# Or create rollback branch
git checkout -b rollback-avatar-pose
git revert <commit-hash>
```

#### Level 2: Database Rollback
```bash
# Rollback last migration
bun prisma migrate resolve --rolled-back <migration-name>

# Or reset to specific migration
bun prisma migrate reset --skip-seed
bun prisma migrate deploy --to <migration-name>
```

#### Level 3: Plugin Disable
```typescript
// backend/src/apps/[app]/plugin.config.ts
features: {
  enabled: false,  // Disable plugin
  beta: false,
  comingSoon: true,
}

// Remove from loader.ts temporarily
// Comment out: pluginRegistry.register(...)
```

#### Level 4: Environment Variable Rollback
```bash
# Revert to previous .env
cp .env.backup .env

# Or disable HF integration
HUGGINGFACE_API_KEY=""
```

### Safe Deployment Checklist

Before deploying to dev.lumiku.com:
- [ ] All tests passing locally
- [ ] Database migrations tested on dev DB
- [ ] Environment variables set correctly
- [ ] Backup current production data
- [ ] Create rollback branch
- [ ] Deploy during low-traffic time
- [ ] Monitor logs for 30 minutes post-deploy
- [ ] Test critical user flows
- [ ] Have rollback plan ready

---

## 📞 QUICK REFERENCE

### Key Files to Modify

```
✏️  backend/prisma/schema.prisma       - Add new models
✏️  backend/src/plugins/loader.ts      - Register new plugins
✏️  backend/src/apps/[app]/            - Create new apps
✏️  frontend/src/apps/                 - Create frontend apps
✏️  .env                                - Add API keys
```

### Key Commands

```bash
# Database
bun prisma generate              # Generate Prisma client
bun prisma migrate dev           # Create migration
bun prisma studio                # Open DB GUI

# Development
bun dev                          # Start both backend & frontend
bun dev:backend                  # Backend only
bun dev:frontend                 # Frontend only

# Testing
curl http://localhost:3000/api/apps  # Test API
```

### Key Endpoints to Test

```bash
# After each phase, test these:
GET  /api/apps                   # Check plugin appears
GET  /api/apps/brand-kit/kits   # Check routes work
POST /api/apps/avatar-manager/avatars  # Test file upload
POST /api/apps/pose-generator/generate # Test generation
```

---

## 🎯 SUCCESS CRITERIA

### MVP is Ready When:

- ✅ User can create multiple brand kits
- ✅ User can upload avatars per brand kit
- ✅ User can upload products with auto background removal
- ✅ User can browse 500+ pose templates
- ✅ User can generate 100+ poses in one batch
- ✅ Pose generation success rate >90%
- ✅ Average generation time <30s per pose
- ✅ User can send pose to Poster Editor
- ✅ Analytics show time & cost savings
- ✅ All features work on dev.lumiku.com

---

## 📚 EXTERNAL RESOURCES

### API Documentation
- Hugging Face Inference API: https://huggingface.co/docs/api-inference
- ControlNet: https://huggingface.co/lllyasviel/control_v11p_sd15_openpose
- Fal.ai: https://fal.ai/models/controlnet-openpose
- Replicate: https://replicate.com/controlnet

### Datasets
- Pose Dataset: https://huggingface.co/datasets/sayakpaul/poses-controlnet-dataset
- Fashion Poses: https://huggingface.co/datasets/zcxu-eric/fashion_model_poses

### Tools
- Prisma Docs: https://www.prisma.io/docs
- BullMQ Docs: https://docs.bullmq.io
- Hono Docs: https://hono.dev

---

**END OF MASTER REFERENCE**

*This document is your single source of truth. Bookmark it, print it, keep it handy!*

**If Claude errors/restarts, show this document first.**

---

**Document Maintainer:** Avatar & Pose Generator Team
**Last Updated:** 2025-10-10
**Next Review:** After Phase 8 completion
