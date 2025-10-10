# AVATAR & POSE GENERATOR - QUICK START GUIDE

**🚀 Fastest Path to MVP**

This guide shows you the **absolute minimum** steps to get Avatar & Pose Generator running on dev.lumiku.com.

---

## ⚡ TLDR - 5 Minute Setup

```bash
# 1. Add database models
# Copy schema from AVATAR_POSE_MASTER_REFERENCE.md

# 2. Run migration
cd backend
bun prisma generate
bun prisma migrate dev --name add-avatar-pose-system

# 3. Install dependencies
bun add @huggingface/inference axios canvas

# 4. Add .env variables
echo "HUGGINGFACE_API_KEY=hf_your_token_here" >> .env

# 5. Start development
bun dev
```

✅ **Done!** Now follow implementation phases below.

---

## 📋 PRE-FLIGHT CHECKLIST

Before you start, make sure you have:

- [x] Access to dev.lumiku.com codebase
- [x] PostgreSQL database running
- [x] Redis running (for BullMQ)
- [x] Hugging Face account (free): https://huggingface.co/join
- [x] Hugging Face API token: https://huggingface.co/settings/tokens
- [x] Node/Bun installed locally
- [x] Git access to lumiku repo

---

## 🎯 IMPLEMENTATION PHASES (Choose Your Starting Point)

### Option A: Full MVP (12 Weeks)
Follow all phases in `AVATAR_POSE_MASTER_REFERENCE.md`

### Option B: Quick Prototype (2 Weeks) ⭐ RECOMMENDED
Build minimum viable prototype to test concept:
- ✅ Brand Kit (basic)
- ✅ Avatar Manager (upload only, no AI generation)
- ✅ Product Manager (with SAM)
- ✅ Pose Generator (10 poses max, single template)

### Option C: Core Feature Only (1 Week)
Just Pose Generator with hardcoded avatar/product:
- ❌ Skip Brand Kit
- ❌ Skip Avatar Manager
- ❌ Skip Product Manager
- ✅ Pose Generator only

**This guide covers Option B (Quick Prototype)**

---

## 🏁 STEP-BY-STEP QUICK PROTOTYPE

### STEP 1: Database Setup (15 minutes)

#### 1.1 Add Schema

Open `backend/prisma/schema.prisma` and add:

```prisma
// Add to end of file
model BrandKit {
  id          String   @id @default(cuid())
  userId      String
  brandName   String
  category    String?
  logoUrl     String?
  colors      String   // JSON
  fonts       String   // JSON
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  avatars     Avatar[]
  products    Product[]

  @@index([userId])
  @@map("brand_kits")
}

model Avatar {
  id              String   @id @default(cuid())
  userId          String
  brandKitId      String
  name            String
  baseImageUrl    String
  thumbnailUrl    String?
  gender          String?
  sourceType      String   // "upload" only for now
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  brandKit        BrandKit @relation(fields: [brandKitId], references: [id], onDelete: Cascade)
  generatedPoses  GeneratedPose[]

  @@index([userId])
  @@index([brandKitId])
  @@map("avatars")
}

model Product {
  id              String   @id @default(cuid())
  userId          String
  brandKitId      String
  name            String
  category        String
  originalUrl     String
  transparentUrl  String?
  thumbnailUrl    String?
  productType     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  brandKit        BrandKit @relation(fields: [brandKitId], references: [id], onDelete: Cascade)
  generatedPoses  GeneratedPose[]

  @@index([userId])
  @@index([brandKitId])
  @@map("products")
}

model PoseTemplate {
  id              String   @id @default(cuid())
  category        String
  keypointsJson   String
  previewUrl      String
  tags            String
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  generatedPoses  GeneratedPose[]

  @@index([category, isActive])
  @@map("pose_templates")
}

model PoseGeneration {
  id              String   @id @default(cuid())
  userId          String
  avatarId        String
  productId       String
  totalPoses      Int
  provider        String   // "huggingface"
  modelId         String
  basePrompt      String
  status          String   @default("pending")
  progress        Int      @default(0)
  creditUsed      Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  completedAt     DateTime?

  generatedPoses  GeneratedPose[]

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
  prompt          String
  outputUrl       String
  thumbnailUrl    String?
  success         Boolean  @default(true)
  provider        String
  createdAt       DateTime @default(now())

  generation      PoseGeneration @relation(fields: [generationId], references: [id], onDelete: Cascade)
  avatar          Avatar         @relation(fields: [avatarId], references: [id])
  product         Product        @relation(fields: [productId], references: [id])
  poseTemplate    PoseTemplate   @relation(fields: [poseTemplateId], references: [id])

  @@index([generationId])
  @@index([userId, createdAt])
  @@map("generated_poses")
}
```

#### 1.2 Update User Model

Find `model User` and add relations:

```prisma
model User {
  // ... existing fields ...

  // ADD THESE RELATIONS:
  brandKits    BrandKit[]
  avatars      Avatar[]
  products     Product[]

  // ... existing relations ...
}
```

#### 1.3 Run Migration

```bash
cd backend
bun prisma generate
bun prisma migrate dev --name add-avatar-pose-quick-prototype
```

✅ **Verify:** Check database has new tables: `brand_kits`, `avatars`, `products`, etc.

---

### STEP 2: Install Dependencies (5 minutes)

```bash
# Backend
cd backend
bun add @huggingface/inference axios canvas

# Frontend
cd ../frontend
bun add react-dropzone react-color

cd ..
```

✅ **Verify:** No installation errors

---

### STEP 3: Environment Variables (2 minutes)

Add to `backend/.env`:

```bash
# Hugging Face API
HUGGINGFACE_API_KEY="hf_xxxxxxxxxxxxxxxxxxxxx"
HUGGINGFACE_MODEL_ID="lllyasviel/control_v11p_sd15_openpose"

# Storage
MAX_AVATAR_SIZE_MB=10
MAX_PRODUCT_SIZE_MB=20
```

**Get your HF token:** https://huggingface.co/settings/tokens (Create new token with "Inference API" permission)

✅ **Verify:** Token works:
```bash
curl https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### STEP 4: Create Backend Structure (10 minutes)

#### 4.1 Brand Kit Plugin

Create file: `backend/src/apps/brand-kit/plugin.config.ts`

```typescript
import { PluginConfig } from '../../plugins/types'

export const brandKitConfig: PluginConfig = {
  appId: 'brand-kit',
  name: 'Brand Kit',
  description: 'Manage brand identities',
  icon: 'palette',
  version: '1.0.0',
  routePrefix: '/api/apps/brand-kit',
  credits: {
    createBrandKit: 5,
    updateBrandKit: 2,
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
    order: 10,
    color: 'purple',
    stats: { enabled: false },
  },
}

export default brandKitConfig
```

Create file: `backend/src/apps/brand-kit/routes.ts`

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import prisma from '../../db/client'

const routes = new Hono()

// Create brand kit
routes.post('/kits', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()

  const brandKit = await prisma.brandKit.create({
    data: {
      userId,
      brandName: body.brandName,
      category: body.category,
      colors: JSON.stringify(body.colors || []),
      fonts: JSON.stringify(body.fonts || []),
      isDefault: body.isDefault || false,
    },
  })

  return c.json({ brandKit })
})

// List brand kits
routes.get('/kits', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const brandKits = await prisma.brandKit.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ brandKits })
})

// Get single brand kit
routes.get('/kits/:id', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const brandKit = await prisma.brandKit.findFirst({
    where: { id, userId },
  })

  if (!brandKit) {
    return c.json({ error: 'Brand kit not found' }, 404)
  }

  return c.json({ brandKit })
})

export default routes
```

#### 4.2 Register Plugin

Edit `backend/src/plugins/loader.ts`:

```typescript
// ADD IMPORT
import brandKitConfig from '../apps/brand-kit/plugin.config'
import brandKitRoutes from '../apps/brand-kit/routes'

export function loadPlugins() {
  // ... existing registrations ...

  // ADD THIS:
  pluginRegistry.register(brandKitConfig, brandKitRoutes)

  console.log(`\n📦 Loaded ${pluginRegistry.getAll().length} plugins`)
  // ... rest of function ...
}
```

✅ **Verify:** Start backend, check logs:
```bash
cd backend
bun run src/index.ts

# Should see:
# 🔌 Mounted: Brand Kit at /api/apps/brand-kit
```

---

### STEP 5: Create Frontend UI (15 minutes)

Create file: `frontend/src/apps/BrandKit.tsx`

```typescript
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Palette } from 'lucide-react'

interface BrandKit {
  id: string
  brandName: string
  category?: string
  colors: string[]
  createdAt: string
}

export default function BrandKit() {
  const navigate = useNavigate()
  const [brandKits, setBrandKits] = useState<BrandKit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    brandName: '',
    category: '',
    colors: ['#FF5733', '#33FF57', '#3357FF'],
  })

  useEffect(() => {
    loadBrandKits()
  }, [])

  const loadBrandKits = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/apps/brand-kit/kits', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      // Parse colors JSON
      const parsed = data.brandKits.map((kit: any) => ({
        ...kit,
        colors: JSON.parse(kit.colors),
      }))

      setBrandKits(parsed)
    } catch (error) {
      console.error('Failed to load brand kits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/apps/brand-kit/kits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        await loadBrandKits()
        setShowForm(false)
        setFormData({ brandName: '', category: '', colors: ['#FF5733'] })
      }
    } catch (error) {
      console.error('Failed to create brand kit:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <Palette className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-semibold">Brand Kit Manager</h1>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              New Brand Kit
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : brandKits.length === 0 ? (
          <div className="text-center py-12">
            <Palette className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No brand kits yet</h3>
            <p className="text-slate-600 mb-4">Create your first brand kit to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Create Brand Kit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brandKits.map((kit) => (
              <div key={kit.id} className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="font-semibold text-lg mb-2">{kit.brandName}</h3>
                {kit.category && (
                  <p className="text-sm text-slate-600 mb-4">{kit.category}</p>
                )}
                <div className="flex gap-2">
                  {kit.colors.slice(0, 5).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create Brand Kit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Brand Name</label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. Skincare Aura"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="e.g. skincare, fashion"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

✅ **Verify:** Navigate to `/apps/brand-kit` in browser, create a brand kit

---

### STEP 6: Test End-to-End (5 minutes)

```bash
# Terminal 1: Backend
cd backend
bun run src/index.ts

# Terminal 2: Frontend
cd frontend
bun run dev
```

1. Open browser: http://localhost:5173
2. Login with test credentials
3. Go to Dashboard
4. Click "Brand Kit" (should appear in app list)
5. Create a new brand kit
6. Verify it appears in list

✅ **Success!** Brand Kit is working!

---

## ⚡ NEXT STEPS

Now that Brand Kit is working, repeat the same pattern for:

### Week 1: Avatar Manager
- Copy brand-kit structure
- Change to avatar-related code
- Add file upload handling
- Test avatar upload

### Week 2: Product Manager + Pose Generator (Basic)
- Product Manager: Similar to Avatar Manager
- Pose Generator: Start with 1 hardcoded template
- Generate 1 pose at a time
- Test full flow: Brand Kit → Avatar → Product → Pose

---

## 🐛 COMMON ISSUES & FIXES

### Issue: "Plugin not showing in dashboard"
```typescript
// Check: features.enabled = true in plugin.config.ts
// Check: Plugin registered in loader.ts
// Check: Backend restarted after changes
```

### Issue: "404 on API endpoint"
```typescript
// Check: routePrefix matches fetch URL
// Backend: '/api/apps/brand-kit'
// Frontend: fetch('/api/apps/brand-kit/kits')
```

### Issue: "Database relation error"
```bash
# Solution:
cd backend
bun prisma generate
# Restart backend
```

### Issue: "CORS error"
```typescript
// Check: CORS_ORIGIN in .env matches frontend URL
// Default: http://localhost:5173
```

---

## 📊 PROGRESS TRACKING

Use this checklist:

- [ ] Database migrated successfully
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Brand Kit backend working
- [ ] Brand Kit frontend working
- [ ] Avatar Manager backend working
- [ ] Avatar Manager frontend working
- [ ] Product Manager backend working
- [ ] Product Manager frontend working
- [ ] Pose Generator basic working (1 pose)
- [ ] Pose Generator batch working (10 poses)
- [ ] Integration: Pose → Poster Editor

---

## 🎯 SUCCESS METRICS

Your quick prototype is ready when:

✅ User can create brand kit
✅ User can upload 1 avatar
✅ User can upload 1 product
✅ System can generate 10 poses from 1 template
✅ Poses appear in results gallery
✅ No critical errors in console

**Time estimate: 2 weeks part-time, 1 week full-time**

---

## 🚀 DEPLOY TO DEV.LUMIKU.COM

Once working locally:

```bash
# 1. Commit changes
git add .
git commit -m "feat: Add Avatar & Pose Generator (Quick Prototype)"

# 2. Push to dev branch
git push origin dev

# 3. SSH to dev.lumiku.com
ssh user@dev.lumiku.com

# 4. Pull latest
cd /path/to/lumiku
git pull origin dev

# 5. Run migrations
cd backend
bun prisma migrate deploy

# 6. Restart services
pm2 restart lumiku-backend
pm2 restart lumiku-frontend

# 7. Test
curl https://dev.lumiku.com/api/apps
```

---

## 📞 NEED HELP?

Reference these documents:
1. **AVATAR_POSE_MASTER_REFERENCE.md** - Complete technical reference
2. **LUMIKU_AI_APPS_STRATEGY.md** - Business strategy & planning
3. **This file** - Quick start steps

**If Claude Code restarts:**
Show `AVATAR_POSE_MASTER_REFERENCE.md` first for full context.

---

**Good luck! 🚀**

*You got this! Start with Brand Kit, then build from there.*
