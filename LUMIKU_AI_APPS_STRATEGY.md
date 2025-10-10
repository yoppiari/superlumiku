# Lumiku AI Apps - Strategic Development Plan

**Date:** 2025-10-10
**Status:** Planning & Discussion Phase
**Goal:** Expand Lumiku with AI-powered apps for UMKM content creation

---

## 🎯 **BUSINESS OBJECTIVE**

**Target Market:** UMKM Indonesia yang struggle dengan biaya produksi konten visual

**Pain Points:**
- Biaya photoshoot mahal (Rp 5-15 juta per session)
- Waktu produksi lama
- Perlu ratusan variasi konten untuk ads/promo
- UMKM sering punya multiple brand lines

**Solution:** All-in-one AI platform untuk create avatar → generate poses → create poster variations

---

## 📱 **PLANNED APPLICATIONS**

### **App 1: Avatar AI**
**Purpose:** User membuat & manage avatar collection untuk berbagai keperluan

**Features:**
- Upload foto atau AI-generate avatar
- Multi-avatar per brand category (skincare, fashion, kids, etc)
- Avatar collection management
- Link avatar ke brand kits

**Use Case:**
```
UMKM "Beauty Shop" punya 3 brand lines:
├─ Skincare "Aura" → Avatar: Female, 25-30yo, elegant
├─ Fashion "Elite" → Avatar: Female, 20-25yo, trendy
└─ Kids "Little Joy" → Avatar: Children models
```

---

### **App 2: Pose AI** ⭐ **CORE FEATURE**
**Purpose:** Generate ratusan pose variations dengan avatar + produk

**Key Innovation:** Dataset-driven generation (HIGH success rate)

**Flow:**
1. User pilih avatar + upload produk
2. System remove background produk (SAM - existing)
3. User pilih pose distribution:
   - Standing: 50 variations
   - Walking: 30 variations
   - Sitting: 20 variations
4. AI generate dengan ControlNet + pose dataset
5. Output: 100 unique professional product photos

**Technology:**
- **Pose Dataset:** Pre-curated dari Hugging Face (500-1000 poses)
- **Generation:** ControlNet + Stable Diffusion XL via Hugging Face Inference API
- **Background Removal:** MobileSAM (existing)
- **Queue:** BullMQ (existing) untuk batch processing

**Why Dataset Approach?**
- ❌ Generate pose from scratch = high failure rate (30-40% fail)
- ✅ Use pre-validated pose templates = >90% success rate
- ✅ Categorized by use case (fashion, skincare, lifestyle)
- ✅ Faster generation (no trial-and-error)

---

### **App 3: Poster Editor Enhancement**
**Purpose:** Create puluhan variasi poster dari hasil pose generation

**Existing Features (Keep):**
- Canvas-based editing (Fabric.js)
- Text detection & editing (Tesseract.js)
- AI Inpainting (ModelsLab)
- Quick Edit mode (SAM)

**New Features:**
- Drag & drop pose results ke canvas
- Apply brand kit (colors, fonts, logo)
- Template library
- Batch variation generator
- Multi-platform export (IG, FB, TikTok, WhatsApp Business)

---

## 🏗️ **ARCHITECTURE DECISIONS**

### **Approach: Extend Existing Plugin System**

**Current Structure:**
```
backend/src/apps/
├── video-mixer/
├── carousel-mix/
├── looping-flow/
├── video-generator/
└── poster-editor/
```

**New Structure:**
```
backend/src/apps/
├── [existing apps...]
├── brand-kit/          # NEW - Multi-brand management
├── avatar-manager/     # NEW - Avatar creation & management
├── product-manager/    # NEW - Product upload & categorization
└── pose-generator/     # NEW - Core pose generation engine
```

**Why NOT Microservices?**
- ✅ Faster development for startup stage
- ✅ Shared auth, billing, user management
- ✅ Simpler deployment (Coolify)
- ✅ Lower infrastructure cost
- ✅ Can refactor to microservices later if needed

---

## 🎨 **BRAND KIT - MULTI-BRAND SUPPORT**

**User Feedback:** UMKM bisa punya beberapa brand berbeda ✅

**Database Schema:**
```prisma
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

  user        User     @relation(fields: [userId], references: [id])
  avatars     Avatar[]
  products    Product[]

  @@index([userId])
  @@map("brand_kits")
}
```

**UI Flow:**
```
Dashboard → Brand Kits
  ├─ [+ Create New Brand Kit]
  ├─ Skincare Aura (default)
  │   ├─ 5 avatars
  │   └─ 20 products
  ├─ Fashion Elite
  │   ├─ 3 avatars
  │   └─ 15 products
  └─ Kids World
      ├─ 2 avatars
      └─ 10 products
```

---

## 📊 **ANALYTICS APPROACH**

### **Phase 1: Internal Analytics (RECOMMENDED untuk MVP)**

**Purpose:** Track user's own productivity & content creation patterns

**No External Website Needed** - All tracking internal!

**Metrics:**
```
✅ Berapa banyak design dibuat per brand
✅ Berapa banyak pose dibuat per kategori
✅ Model AI mana yang paling sering dipakai
✅ Export format mana yang paling populer (IG vs FB vs TikTok)
✅ Peak usage time (kapan user paling aktif)
✅ Time saved vs traditional photoshoot
✅ Cost saved (estimated)
```

**Dashboard Example:**
```
📊 Your Analytics (Last 30 Days)

Brand: Skincare Aura
├─ 150 designs created
├─ 450 exports (3x reuse avg!)
├─ Most used: IG Post (60%), Story (30%)
├─ Peak time: 7-9 PM
└─ Estimated savings: ~Rp 15,000,000 (vs photoshoot)

💡 Suggestions:
- Your IG Posts perform well, create more variations!
- Try TikTok format - trending for skincare
```

**Implementation:**
```prisma
model DesignMetrics {
  id          String   @id @default(cuid())
  userId      String
  brandKitId  String
  designType  String   // "avatar", "pose", "poster"

  // Usage stats
  timesCreated     Int  @default(0)
  timesExported    Int  @default(0)
  formatBreakdown  String // JSON: {"ig_post": 50, "fb_cover": 30}

  // Time tracking
  avgCreationTime  Int  // seconds
  totalTimeSaved   Int  // vs traditional methods

  // Period
  period      String   // "2025-10" for monthly aggregation

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, brandKitId, designType, period])
  @@index([userId, period])
  @@map("design_metrics")
}
```

### **Phase 2: External Performance Tracking (FUTURE - Premium Feature)**

**Purpose:** Track real ad performance (CTR, conversions) dari Meta/TikTok

**Requirements:**
- Meta Pixel integration
- TikTok Pixel integration
- Webhook receiver
- OAuth for user's ad accounts

**Complexity:** HIGH (4-6 weeks)
**Decision:** Skip untuk MVP, bisa jadi premium feature nanti

---

## 🤖 **POSE GENERATOR - TECHNICAL DEEP DIVE**

### **Core Strategy: Dataset + ControlNet**

**Problem dengan Generate from Scratch:**
```
❌ AI generates random pose → 30-40% failure rate
❌ Unnatural poses
❌ Product placement errors
❌ Inconsistent quality
❌ Wasted credits & time
```

**Solution dengan Pose Dataset:**
```
✅ Pre-validated pose templates → >90% success rate
✅ Natural, professional poses
✅ Categorized by use case
✅ Faster generation (no retries)
✅ Predictable results
```

### **Pose Dataset Sources (Hugging Face)**

**Recommended Datasets:**
1. **OpenPose Dataset:**
   - `sayakpaul/poses-controlnet-dataset` (15k poses)
   - `richar/human-pose-estimation-dataset` (10k poses)

2. **Fashion-specific:**
   - `zcxu-eric/fashion_model_poses`
   - `huggan/fashion-pose-estimation`

3. **Lifestyle:**
   - Custom curated from open datasets

**Categorization:**
```
Fashion:
├─ Standing (Front, Side, Back)
├─ Walking (Casual, Runway)
├─ Sitting (Chair, Floor)
└─ Action (Jumping, Spinning)

Skincare:
├─ Close-up (Face focus)
├─ Application (Hands on face)
├─ Lifestyle (Natural poses)
└─ Before/After (Comparison)

Kids Products:
├─ Playing (Active)
├─ Sitting (Calm)
├─ Running (Dynamic)
└─ Group (Multiple kids)
```

### **Technology Stack**

**Generation Engine:**
```
Model: ControlNet + Stable Diffusion XL
Provider: Hugging Face Inference API
Endpoint: lllyasviel/control_v11p_sd15_openpose
```

**Alternative Providers (if needed):**
- **Fal.ai:** Optimized ControlNet (~Rp 80/image)
- **Replicate:** Similar pricing, good reliability
- **Self-hosted:** Deploy on Hugging Face Spaces (FREE tier available)

**Cost Comparison:**
```
Hugging Face Inference API:
├─ FREE Tier: 30,000 requests/month (enough for testing)
├─ Pro Tier: $9/month for faster inference
└─ Pay-as-you-go: ~$0.001/request (~Rp 15/image)

Fal.ai:
└─ ~$0.005/image (~Rp 80/image)

ModelsLab (current):
└─ Custom pricing (already integrated)
```

**Recommended:** Start with **Hugging Face FREE tier**, upgrade to Pro ($9/month) jika perlu faster.

---

## 🗄️ **DATABASE SCHEMA ADDITIONS**

### **Core Models:**

```prisma
// ========================================
// BRAND KIT SYSTEM
// ========================================

model BrandKit {
  id          String   @id @default(cuid())
  userId      String
  brandName   String
  category    String?
  logoUrl     String?
  colors      String   // JSON array
  fonts       String   // JSON array
  tone        String?
  tagline     String?
  isDefault   Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
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

  user            User     @relation(fields: [userId], references: [id])
  brandKit        BrandKit @relation(fields: [brandKitId], references: [id])
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

  user            User     @relation(fields: [userId], references: [id])
  brandKit        BrandKit @relation(fields: [brandKitId], references: [id])
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

  project         PoseGenerationProject @relation(fields: [projectId], references: [id])
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

  generation      PoseGeneration @relation(fields: [generationId], references: [id])
  avatar          Avatar         @relation(fields: [avatarId], references: [id])
  product         Product        @relation(fields: [productId], references: [id])
  poseTemplate    PoseTemplate   @relation(fields: [poseTemplateId], references: [id])

  @@index([generationId])
  @@index([userId, createdAt])
  @@index([poseTemplateId, success]) // For tracking template success rates
  @@map("generated_poses")
}

// ========================================
// ANALYTICS
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

---

## 🚀 **DEVELOPMENT ROADMAP**

### **Phase 1: Foundation (Week 1-2)**
**Goal:** Setup basic infrastructure

**Tasks:**
- [ ] Add new database models (BrandKit, Avatar, Product, PoseTemplate, etc)
- [ ] Run Prisma migration
- [ ] Setup Hugging Face API client
- [ ] Download & categorize pose dataset (~500 poses)
- [ ] Create pose dataset loader service

**Deliverable:** Database ready, pose library loaded

---

### **Phase 2: Brand Kit System (Week 3)**
**Goal:** Multi-brand management

**Tasks:**
- [ ] Brand Kit CRUD API endpoints
- [ ] Frontend: Brand Kit management UI
- [ ] Brand Kit selector component (reusable)
- [ ] Color picker integration
- [ ] Font library integration
- [ ] Logo upload & management

**Deliverable:** Users can create & manage multiple brand kits

---

### **Phase 3: Avatar Manager (Week 4-5)**
**Goal:** Avatar creation & management

**Week 4:**
- [ ] Avatar upload API (with validation)
- [ ] Avatar CRUD endpoints
- [ ] Frontend: Avatar gallery UI
- [ ] Avatar editor (crop, adjust)
- [ ] Link avatars to brand kits

**Week 5:**
- [ ] AI Avatar generation (optional - Hugging Face SDXL)
- [ ] Avatar characteristics form (gender, age, style)
- [ ] Avatar preview & thumbnail generation
- [ ] Avatar search & filter

**Deliverable:** Users can upload/generate & manage avatar collections

---

### **Phase 4: Product Manager (Week 6)**
**Goal:** Product upload & categorization

**Tasks:**
- [ ] Product upload API
- [ ] Auto background removal integration (SAM - existing)
- [ ] Product categorization UI
- [ ] Product metadata form (type, placement, color)
- [ ] Product gallery with filtering
- [ ] Link products to brand kits
- [ ] Bulk product upload

**Deliverable:** Users can upload & manage product catalog

---

### **Phase 5: Pose Generator Core (Week 7-9)**
**Goal:** The magic happens here!

**Week 7 - Setup:**
- [ ] Pose Template browser UI
- [ ] Category & filter selection
- [ ] Pose preview component
- [ ] Pose distribution selector (standing: 50, walking: 30, etc)

**Week 8 - Generation Engine:**
- [ ] Hugging Face ControlNet integration
- [ ] Image preprocessing pipeline
- [ ] Single pose generation (test & validate)
- [ ] Quality assessment algorithm
- [ ] Error handling & retry logic

**Week 9 - Batch Processing:**
- [ ] BullMQ worker for batch generation
- [ ] Progress tracking & updates
- [ ] Real-time status via WebSocket/SSE
- [ ] Failed pose retry mechanism
- [ ] Success rate monitoring

**Deliverable:** Fully functional pose generation system

---

### **Phase 6: Poster Editor Enhancement (Week 10)**
**Goal:** Integrate pose results into existing Poster Editor

**Tasks:**
- [ ] Pose result picker component
- [ ] Drag & drop poses to canvas
- [ ] Apply brand kit to poster (colors, fonts, logo)
- [ ] Template system (pre-designed layouts)
- [ ] Multi-format export (IG, FB, TikTok, WA sizes)
- [ ] Batch variation generator
- [ ] Export queue & download

**Deliverable:** Complete workflow from pose → poster → export

---

### **Phase 7: Analytics Dashboard (Week 11)**
**Goal:** Show users their productivity gains

**Tasks:**
- [ ] Metrics collection service
- [ ] Analytics aggregation (daily/monthly)
- [ ] Dashboard UI components
- [ ] Charts & visualizations (usage, savings, trends)
- [ ] Export analytics report (PDF/CSV)
- [ ] Usage insights & recommendations

**Deliverable:** Analytics dashboard showing time & cost savings

---

### **Phase 8: Polish & Testing (Week 12)**
**Goal:** Production-ready

**Tasks:**
- [ ] UI/UX polish & consistency
- [ ] Onboarding flow for new users
- [ ] In-app tutorials
- [ ] Error message improvements
- [ ] Performance optimization
- [ ] Loading states & skeletons
- [ ] Mobile responsive check
- [ ] Cross-browser testing
- [ ] User acceptance testing (UAT)
- [ ] Documentation

**Deliverable:** Production-ready MVP

---

**Total Timeline:** **12 weeks for complete MVP**

---

## 💰 **COST ANALYSIS**

### **Development Infrastructure**

**FREE (Self-hosted):**
- ✅ Bun runtime
- ✅ PostgreSQL database
- ✅ Redis (BullMQ queue)
- ✅ MobileSAM (background removal)
- ✅ Hugging Face Inference API (FREE tier: 30k requests/month)

**PAID (Optional/Scalable):**
- Hugging Face Pro Inference: $9/month (faster generation)
- Fal.ai: Pay-as-you-go (~$0.005/image = Rp 80/image)
- Cloudflare R2 Storage: ~$0.015/GB/month (jika perlu CDN)

### **Per-User Generation Cost (Example)**

**Scenario:** 1 UMKM wants 100 poses from 1 avatar + 1 product

**Cost Breakdown:**
```
Avatar generation (optional): 1 × Rp 15 = Rp 15
Background removal (product): FREE (MobileSAM)
100 poses @ Rp 15/ea (HF Free): FREE (under quota)
100 poses @ Rp 80/ea (Fal.ai): Rp 8,000

Total: Rp 15 - Rp 8,000 (depending on provider)
```

**Traditional Photoshoot:**
```
Professional photoshoot: Rp 5,000,000 - 15,000,000
Model fee: Rp 1,000,000 - 3,000,000
Editing: Rp 500,000 - 1,000,000
Total: Rp 6,500,000 - 19,000,000

SAVINGS: 99.9%!
```

### **Pricing Strategy - UNLIMITED WITH SMART PROTECTION** ✅

> **Philosophy:** "Users feel unlimited freedom, system stays profitable & sustainable"

#### **FREE TIER**
```
✨ Perfect for trying Lumiku

- 1 brand kit
- 1 avatar
- 10 pose generations/month (hard limit)
- Watermark on exports
- Community support (Discord/Forum)
```

#### **STARTER - Rp 99,000/month**
```
✨ Perfect for small UMKM (1-2 products)

- UNLIMITED brand kits ✅
- UNLIMITED avatars ✅
- UNLIMITED pose generations ✅
- No watermark
- All templates
- Standard queue (process within 30 minutes)
- Email support (48h response)

*Fair Use: Optimized for up to 500 generations/month.
Beyond that, may experience slower processing during peak hours.
```

#### **PRO - Rp 299,000/month** ⭐ MOST POPULAR
```
✨ Perfect for active UMKM (5-10 products)

- UNLIMITED brand kits ✅
- UNLIMITED avatars ✅
- UNLIMITED pose generations ✅
- UNLIMITED poster exports ✅
- Premium templates
- Analytics dashboard
- Priority queue (5x faster - process within 5 minutes)
- API access (coming soon)
- Priority email support (24h response)

*Fair Use: Optimized for up to 2,000 generations/month.
Designed for professional content creators who need speed & volume.
```

#### **ENTERPRISE - Custom (Start Rp 1,500,000/month)**
```
✨ Perfect for agencies & multi-brand corporations

- Everything in PRO
- TRULY unlimited (no soft caps, dedicated resources)
- Custom AI model training (on your brand style)
- White-label option (your branding)
- Dedicated GPU queue (instant processing)
- SLA 99.9% uptime guarantee
- Dedicated account manager
- Team management (unlimited seats)
- Custom integrations
- On-premise deployment option

*Contact sales for custom quote based on team size & usage
```

---

## 🛡️ **UNLIMITED PRICING WITH ABUSE PROTECTION SYSTEM**

### **Core Philosophy**

**Marketing Promise:** "UNLIMITED Everything!"
**System Reality:** 99% users never abuse, 1% managed smartly
**User Experience:** Freedom without artificial limits
**Business Outcome:** 90%+ profit margins, sustainable growth

---

### **1. FAIR USE POLICY (Transparent & Public)**

**Published on Pricing Page & ToS:**

```markdown
## Fair Use Policy

Lumiku Pro offers unlimited generations designed for normal business use.

**What's "normal business use"?**
- Creating content for your products & services
- Testing different poses & variations
- Seasonal campaigns & promotions
- Regular social media content

**Examples of Fair Use:**
✅ 50-500 generations/month: Typical small business
✅ 500-2,000 generations/month: Active content creator
✅ 2,000-5,000 generations/month: Heavy user (still ok!)

**Not Fair Use (Abuse):**
❌ Reselling Lumiku-generated content as a service
❌ Running automated bots for mass generation
❌ Generating content for other businesses (use Enterprise)
❌ Crypto mining or non-business usage on our infrastructure

**What happens if I exceed fair use?**
1. We'll email you with usage insights
2. Suggest Enterprise plan if you need higher volume
3. Temporary throttling during peak hours (you keep access)
4. We'll work with you to find the right solution

**We believe in transparency.** If you're a legitimate business with high needs,
we want to support you with the right plan, not punish you.
```

---

### **2. TIERED MONITORING SYSTEM**

#### **Level 1: GREEN (Normal) - 0-500 generations/month**
```
Status: ✅ All systems go
Action: None
Priority: Standard/Priority (based on plan)
Monitoring: Passive
```

#### **Level 2: YELLOW (Active User) - 501-2,000 generations/month**
```
Status: ⚡ Active user
Action:
  - Track usage patterns
  - If PRO: Continue priority queue
  - If STARTER: Send friendly email suggestion to upgrade to PRO
Monitoring: Automated tracking
Email: (for STARTER users)
  "🎉 You're a power user! Upgrade to PRO for 5x faster processing."
```

#### **Level 3: ORANGE (Heavy User) - 2,001-5,000 generations/month**
```
Status: ⚠️ High usage detected
Action:
  - PRO users: Continue service, but flag for review
  - Send email with insights & Enterprise offer
  - If during peak hours (9 AM - 9 PM): Standard queue
  - If during off-peak (9 PM - 9 AM): Priority queue
Monitoring: Daily review
Email: (PRO users)
  "📊 You generated 3,500 poses this month - amazing!
   You're in top 5% of users. Consider Enterprise for:
   - Dedicated GPU (instant processing)
   - Custom AI training
   - White-label option

   Schedule a call: [Link]"
```

#### **Level 4: RED (Potential Abuse) - 5,001+ generations/month**
```
Status: 🚨 Exceptional usage
Action:
  - Automatic soft throttle (longer queue times)
  - Email notification + phone call from support
  - Require Enterprise upgrade OR usage justification
  - If abuse confirmed (reselling, bots): Suspend + refund option
Monitoring: Manual review daily
Email: (All plans)
  "🚨 Exceptional Usage Detected

   You've generated 6,500+ poses this month.

   To ensure quality service for all users, we need to:
   1. Understand your use case
   2. Move you to Enterprise plan (dedicated resources)
   3. Or discuss custom pricing

   Your account is still active, but processing is temporarily
   slower during peak hours.

   Let's chat: [Schedule Call] or reply to this email.

   - Lumiku Team"
```

---

### **3. PROFIT MARGIN ANALYSIS - UNLIMITED PLANS**

#### **Scenario A: STARTER Plan - Average User (300 generations/month)**
```
Revenue: Rp 99,000/month
Cost: 300 × Rp 15 (HF Free) = Rp 4,500
Profit: Rp 94,500
Margin: 95.5% ✅
```

#### **Scenario B: PRO Plan - Average User (800 generations/month)**
```
Revenue: Rp 299,000/month
Cost: 800 × Rp 15 = Rp 12,000
Profit: Rp 287,000
Margin: 96% ✅
```

#### **Scenario C: PRO Plan - Power User (2,000 generations/month)**
```
Revenue: Rp 299,000/month
Cost: 2,000 × Rp 15 = Rp 30,000
Profit: Rp 269,000
Margin: 90% ✅
```

#### **Scenario D: PRO Plan - Heavy User (5,000 generations/month)**
```
Revenue: Rp 299,000/month
Cost: 5,000 × Rp 80 (Fal.ai fallback) = Rp 400,000
Profit: -Rp 101,000
Margin: -34% ❌

Solution: Auto-detect, contact user, upgrade to Enterprise
Enterprise revenue: Rp 1,500,000+
Enterprise cost: Rp 400,000
Enterprise profit: Rp 1,100,000+
Margin: 73% ✅
```

#### **Break-Even Analysis**
```
STARTER (Rp 99k):
- Break-even: 6,600 generations/month
- Fair use cap: 500 generations
- Safety margin: 13x ✅

PRO (Rp 299k):
- Break-even: 19,933 generations/month (HF @ Rp 15)
- Break-even: 3,738 generations/month (Fal.ai @ Rp 80)
- Fair use cap: 2,000 generations
- Safety margin: 10x (HF) or 1.8x (Fal.ai) ✅
```

**Conclusion:** Even in worst-case scenarios with Fal.ai, we're profitable! 🎉

---

### **4. TECHNICAL IMPLEMENTATION**

#### **A. Usage Tracking Service**

```typescript
// backend/src/services/usage-monitor.service.ts

import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export class UsageMonitorService {
  /**
   * Track generation usage (called after each generation)
   */
  async trackGeneration(userId: string, generationType: string) {
    const month = new Date().toISOString().slice(0, 7) // "2025-10"

    // Increment Redis counter (fast)
    const key = `usage:${userId}:${month}`
    const count = await redis.incr(key)
    await redis.expire(key, 60 * 60 * 24 * 35) // 35 days TTL

    // Check threshold
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    const tier = user?.subscription?.tier || 'free'
    const threshold = this.getThreshold(tier, count)

    if (threshold.action) {
      await this.executeAction(userId, tier, count, threshold)
    }

    return { count, threshold: threshold.level }
  }

  /**
   * Get threshold level based on count
   */
  private getThreshold(tier: string, count: number) {
    // FREE tier
    if (tier === 'free') {
      if (count > 10) {
        return {
          level: 'LIMIT_REACHED',
          action: 'BLOCK',
          message: 'Upgrade to Starter for unlimited generations'
        }
      }
      return { level: 'GREEN', action: null }
    }

    // STARTER & PRO tiers
    const thresholds = {
      starter: { yellow: 500, orange: 1500, red: 3000 },
      pro: { yellow: 2000, orange: 5000, red: 10000 }
    }

    const limits = thresholds[tier] || thresholds.pro

    if (count > limits.red) {
      return { level: 'RED', action: 'ALERT_TEAM' }
    } else if (count > limits.orange) {
      return { level: 'ORANGE', action: 'SOFT_THROTTLE' }
    } else if (count > limits.yellow) {
      return { level: 'YELLOW', action: 'SUGGEST_UPGRADE' }
    }

    return { level: 'GREEN', action: null }
  }

  /**
   * Execute action based on threshold
   */
  private async executeAction(
    userId: string,
    tier: string,
    count: number,
    threshold: any
  ) {
    switch (threshold.action) {
      case 'BLOCK':
        await this.logEvent(userId, 'LIMIT_REACHED', { count })
        break

      case 'SUGGEST_UPGRADE':
        const sent = await this.checkIfEmailSent(userId, 'SUGGEST_UPGRADE')
        if (!sent) {
          await this.sendUpgradeEmail(userId, tier, count)
          await this.markEmailSent(userId, 'SUGGEST_UPGRADE')
        }
        break

      case 'SOFT_THROTTLE':
        await this.applySoftThrottle(userId)
        const sentOrange = await this.checkIfEmailSent(userId, 'HIGH_USAGE')
        if (!sentOrange) {
          await this.sendHighUsageEmail(userId, count)
          await this.markEmailSent(userId, 'HIGH_USAGE')
        }
        break

      case 'ALERT_TEAM':
        await this.alertSupportTeam(userId, count)
        const sentRed = await this.checkIfEmailSent(userId, 'EXCEPTIONAL_USAGE')
        if (!sentRed) {
          await this.sendExceptionalUsageEmail(userId, count)
          await this.markEmailSent(userId, 'EXCEPTIONAL_USAGE')
        }
        break
    }
  }

  /**
   * Apply soft throttle (lower queue priority during peak hours)
   */
  private async applySoftThrottle(userId: string) {
    const hour = new Date().getHours()
    const isPeakHour = hour >= 9 && hour <= 21 // 9 AM - 9 PM

    if (isPeakHour) {
      await redis.setex(`throttle:${userId}`, 60 * 60 * 24, 'true')
    }
  }

  /**
   * Check queue priority (used by BullMQ)
   */
  async getQueuePriority(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    const tier = user?.subscription?.tier || 'free'
    const isThrottled = await redis.get(`throttle:${userId}`)

    // Priority levels (lower = higher priority)
    if (tier === 'enterprise') return 1  // Highest
    if (tier === 'pro' && !isThrottled) return 2
    if (tier === 'pro' && isThrottled) return 4  // Throttled PRO
    if (tier === 'starter') return 5
    return 10 // Free tier (lowest)
  }

  /**
   * Get user's current usage stats
   */
  async getUserUsageStats(userId: string) {
    const month = new Date().toISOString().slice(0, 7)
    const key = `usage:${userId}:${month}`
    const count = parseInt(await redis.get(key) || '0')

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    const tier = user?.subscription?.tier || 'free'
    const threshold = this.getThreshold(tier, count)

    return {
      currentMonth: month,
      generationsThisMonth: count,
      tier,
      status: threshold.level,
      isThrottled: await redis.exists(`throttle:${userId}`) === 1,
      recommendation: this.getRecommendation(tier, count)
    }
  }

  private getRecommendation(tier: string, count: number) {
    if (tier === 'free' && count > 5) {
      return {
        type: 'UPGRADE',
        plan: 'STARTER',
        reason: 'You\'re an active user! Upgrade for unlimited generations.'
      }
    }

    if (tier === 'starter' && count > 1000) {
      return {
        type: 'UPGRADE',
        plan: 'PRO',
        reason: 'Upgrade to PRO for 5x faster processing & priority support.'
      }
    }

    if (tier === 'pro' && count > 5000) {
      return {
        type: 'UPGRADE',
        plan: 'ENTERPRISE',
        reason: 'You need Enterprise! Dedicated resources + custom AI training.'
      }
    }

    return null
  }

  // Helper methods (implement as needed)
  private async sendUpgradeEmail(userId: string, tier: string, count: number) {
    console.log(`📧 Sending upgrade email to user ${userId}`)
  }

  private async sendHighUsageEmail(userId: string, count: number) {
    console.log(`📧 Sending high usage email to user ${userId}`)
  }

  private async sendExceptionalUsageEmail(userId: string, count: number) {
    console.log(`📧 Sending exceptional usage email to user ${userId}`)
  }

  private async alertSupportTeam(userId: string, count: number) {
    console.log(`🚨 Alerting support team about user ${userId} - ${count} generations`)
  }

  private async checkIfEmailSent(userId: string, emailType: string): Promise<boolean> {
    const month = new Date().toISOString().slice(0, 7)
    const key = `email:${userId}:${emailType}:${month}`
    return await redis.exists(key) === 1
  }

  private async markEmailSent(userId: string, emailType: string) {
    const month = new Date().toISOString().slice(0, 7)
    const key = `email:${userId}:${emailType}:${month}`
    await redis.setex(key, 60 * 60 * 24 * 35, 'true')
  }

  private async logEvent(userId: string, eventType: string, metadata: any) {
    await prisma.usageEvent.create({
      data: {
        userId,
        eventType,
        metadata: JSON.stringify(metadata),
      }
    })
  }
}

export const usageMonitor = new UsageMonitorService()
```

#### **B. Queue Priority Integration**

```typescript
// backend/src/apps/pose-generator/workers/pose-generation.worker.ts

import { Queue, Worker } from 'bullmq'
import { usageMonitor } from '@/services/usage-monitor.service'

const poseQueue = new Queue('pose-generation', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  }
})

// Add job with dynamic priority
export async function addPoseGenerationJob(userId: string, params: any) {
  const priority = await usageMonitor.getQueuePriority(userId)

  return await poseQueue.add('generate-pose', {
    userId,
    ...params
  }, {
    priority, // 1 = highest, 10 = lowest
  })
}

// Worker processes jobs by priority
const worker = new Worker('pose-generation', async (job) => {
  const { userId, ...params } = job.data

  // Track usage
  await usageMonitor.trackGeneration(userId, 'pose')

  // Generate pose
  const result = await generatePoseWithAI(params)

  return result
}, {
  connection: redis,
  concurrency: 10,
})
```

#### **C. Database Schema Additions**

```prisma
// Add to existing schema.prisma

model UsageEvent {
  id          String   @id @default(cuid())
  userId      String
  eventType   String   // "LIMIT_REACHED", "SUGGEST_UPGRADE", "HIGH_USAGE", etc
  metadata    String?  // JSON

  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId, eventType])
  @@index([createdAt])
  @@map("usage_events")
}

model UsageAlert {
  id          String   @id @default(cuid())
  userId      String
  month       String   // "2025-10"
  count       Int
  tier        String
  status      String   // "GREEN", "YELLOW", "ORANGE", "RED"

  // Actions taken
  emailSent   Boolean  @default(false)
  throttled   Boolean  @default(false)
  teamAlerted Boolean  @default(false)

  // Resolution
  resolved    Boolean  @default(false)
  resolution  String?  // "upgraded", "justified", "limited"

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, month])
  @@index([status, resolved])
  @@map("usage_alerts")
}
```

---

### **5. EMAIL TEMPLATES**

#### **Template 1: Upgrade Suggestion (YELLOW)**
```
Subject: 🎉 You're a Lumiku Power User!

Hi [Name],

Great news! You've generated [count] poses this month, putting you in
the top 20% of Lumiku users. 🚀

You're clearly getting value from Lumiku. Here's how upgrading to
[SUGGESTED_PLAN] can help you even more:

✅ 5x Faster Processing (priority queue)
✅ Analytics Dashboard (track your productivity)
✅ Premium Templates (professional designs)
✅ Priority Support (24h response)

[Upgrade Now Button]

Keep creating amazing content!

- The Lumiku Team

P.S. Have questions? Reply to this email - we're here to help!
```

#### **Template 2: High Usage Notification (ORANGE)**
```
Subject: 📊 Your Lumiku Usage Insights

Hi [Name],

Wow! You've generated [count] poses this month - you're a true content
creation machine! 💪

You're in the top 5% of Lumiku users. To ensure we can continue
providing you with great service, we'd love to learn more about your
use case.

Current Status:
- Generations: [count] this month
- Your Plan: [CURRENT_PLAN]
- Status: Active ✅

What's Next?
For users generating >2,000 poses/month, we recommend our Enterprise plan:
- Dedicated GPU resources (instant processing)
- Custom AI training on your brand style
- White-label option
- Dedicated account manager

[Schedule a Call] [View Enterprise Pricing]

You'll continue to have full access to Lumiku. During peak hours
(9 AM - 9 PM), processing may take a bit longer, but off-peak
processing remains fast.

Questions? Let's chat!

- The Lumiku Team
```

#### **Template 3: Exceptional Usage Alert (RED)**
```
Subject: 🚨 Let's Find the Right Plan for You

Hi [Name],

We noticed exceptional usage on your account: [count] generations
this month.

To maintain quality service for all users, we need to understand
your use case better.

Your Options:
1. Enterprise Plan: Dedicated resources, truly unlimited
   [Learn More] [Schedule Call]

2. Explain Your Use Case: If you have unique needs, let's discuss
   [Reply to This Email]

3. Usage Review: We'll review together and find the best solution
   [Schedule Review Call]

Current Status:
- Your account remains active
- Processing continues (with longer queue times during peak hours)
- All your data & content are safe

We're here to support legitimate business use. If you're reselling
Lumiku content or using automated bots, that's against our Terms
of Service.

Let's find the right solution together.

- The Lumiku Team
support@lumiku.com
```

---

### **6. IMPLEMENTATION ROADMAP - ABUSE PROTECTION**

#### **Week 1-2: Core Monitoring**
- [ ] Create `UsageMonitorService`
- [ ] Redis-based usage tracking
- [ ] Threshold detection (GREEN/YELLOW/ORANGE/RED)
- [ ] Database models (`UsageEvent`, `UsageAlert`)
- [ ] Basic logging

#### **Week 3-4: Queue Priority**
- [ ] Integrate with BullMQ
- [ ] Dynamic priority based on tier + throttle status
- [ ] Soft throttle mechanism
- [ ] Peak hour detection

#### **Week 5-6: Email & Admin Tools**
- [ ] Email templates
- [ ] Automated email sending
- [ ] Email tracking (prevent spam)
- [ ] Admin usage monitor dashboard
- [ ] Slack/Discord alerts for RED status

---

### **7. LEGAL - FAIR USE POLICY (ToS Section)**

```markdown
### Fair Use Policy

**Effective Date:** [Date]

Lumiku's "Unlimited" plans are designed to give you creative freedom
for normal business operations. Here's what that means:

#### What's Included in Fair Use

- Creating marketing content for your business
- Testing variations and designs
- Seasonal campaigns and promotions
- Regular social media content creation
- Product photography for your catalog

#### What's Not Included (Prohibited Use)

- **Reselling**: Using Lumiku to generate content as a service for other businesses
- **Automation**: Running automated bots or scripts for mass generation
- **Abuse**: Intentionally degrading service for other users
- **Violation**: Any use that violates our Terms of Service

#### How We Monitor Fair Use

We track usage patterns to ensure service quality for all users:

- **Normal Use** (0-2,000 generations/month): Full speed, priority processing
- **Heavy Use** (2,000-5,000/month): Continued access, may experience slower
  processing during peak hours
- **Exceptional Use** (5,000+/month): We'll contact you to discuss Enterprise plan

#### Our Commitment

We believe in transparency and partnership:

✅ We'll never suspend your account without warning
✅ We'll always reach out to understand your use case
✅ We'll work with you to find the right solution
✅ Legitimate high-volume users are encouraged to upgrade to Enterprise

Questions? Contact us: support@lumiku.com
```

---

## 🎯 **SUCCESS METRICS**

**Product Metrics:**
- Pose generation success rate: >90%
- Average generation time: <30s per pose
- User satisfaction (rating): >4.2/5
- Export completion rate: >80%

**Business Metrics:**
- User activation (create 1st pose): >60% of signups
- Weekly active users: >50% of paid users
- Average time saved per user: >10 hours/week
- Estimated cost saved: >Rp 1,000,000/user/month
- Monthly recurring revenue (MRR) growth: >20%

---

## ⚠️ **RISKS & MITIGATION**

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|-------------------|
| **Pose generation failure rate high** | High | Medium | Use pre-validated dataset (>90% success), implement retry logic |
| **AI generation cost too expensive** | High | Low | Start with HF Free tier (30k/month), optimize prompts, cache results |
| **Slow generation speed** | Medium | Medium | Batch processing with BullMQ, overnight queue option, HF Pro upgrade |
| **Storage cost escalation** | Medium | Low | Auto-delete after 30 days, image compression, CDN optimization |
| **User adoption low** | High | Medium | Start with existing Poster Editor users, onboarding flow, tutorials |
| **Hugging Face API downtime** | Medium | Low | Fallback to Fal.ai or Replicate, queue retry mechanism |
| **Dataset quality issues** | Medium | Low | Manual curation of top 500 poses, continuous quality monitoring |
| **Competition** | Medium | Medium | Focus on Indonesian market, UMKM pricing, all-in-one platform |

---

## 🏆 **COMPETITIVE ADVANTAGES**

**Why Lumiku Will Win:**

1. **All-in-One Platform**
   - Kompetitor: Biasanya split (avatar generation terpisah dari pose generation)
   - Lumiku: Avatar → Pose → Poster dalam satu flow

2. **UMKM-Focused Pricing**
   - 99% cheaper than traditional photoshoot
   - Tiered pricing mulai dari Rp 99k/month
   - No hidden costs

3. **Indonesian Market Focus**
   - UI/UX dalam Bahasa Indonesia
   - Local payment (Duitku - already integrated!)
   - Local customer support
   - Templates sesuai tren Indonesia

4. **High Success Rate**
   - Dataset-driven pose generation (>90% success)
   - Bukan random generation yang fail rate tinggi
   - Pre-validated poses for each category

5. **Multi-Brand Support**
   - UMKM dengan banyak brand line
   - Easy switching antar brand kits
   - Consistent branding per brand

6. **Productivity Focus**
   - Analytics showing time & cost saved
   - Batch processing untuk efficiency
   - Template library untuk quick start

---

## 🔄 **INTEGRATION WITH EXISTING APPS**

**Current Lumiku Apps:**
- ✅ Video Mixer (video content mixing)
- ✅ Carousel Mix (carousel generation)
- ✅ Looping Flow (looping videos)
- ✅ Video Generator (AI video from text)
- ✅ Poster Editor (poster editing with AI inpaint)

**Integration Points:**

**Pose Generator → Poster Editor:**
```
1. User generates 100 poses
2. Click "Create Posters" on any pose
3. Opens Poster Editor with pose pre-loaded
4. Apply brand kit automatically
5. Generate variations
6. Export multi-format
```

**Poster Editor → Video Generator:**
```
1. User creates poster with pose
2. Click "Animate This"
3. Opens Video Generator
4. Creates video ad from poster
5. Add motion, effects, music
```

**Avatar Manager → Video Generator:**
```
Future: Use avatar as character in AI video
- Avatar talks (with AI voice)
- Avatar demonstrates product
- Avatar in different scenes
```

**Shared Components:**
```
✅ BrandKit: Used across all apps
✅ Credit System: Unified across all features
✅ Queue System: BullMQ for all async jobs
✅ File Manager: Shared upload & storage
✅ Auth & User Management: Single system
```

---

## 📝 **NEXT STEPS & DISCUSSION POINTS**

### **Topics to Discuss:**

1. **Avatar Generation Method:**
   - Upload only (simple, fast)
   - AI generate only (more features, complex)
   - Both options (flexible, recommended)

2. **Pose Dataset Curation:**
   - How many poses per category? (500? 1000?)
   - Manual curation vs automated filtering?
   - Should we allow user-contributed poses?

3. **Generation Provider Priority:**
   - Start with Hugging Face Free tier?
   - Or directly use Fal.ai (paid but faster)?
   - Or build multi-provider fallback system?

4. **Pricing Model:**
   - Credit-based (PAYG)
   - Subscription-based (unlimited)
   - Hybrid (both options)

5. **Feature Scope for MVP:**
   - Should we include AI avatar generation in Phase 1?
   - Or focus on upload-only first?
   - Should analytics be in MVP or Phase 2?

6. **Development Environment:**
   - Develop in `dev.lumiku.com` with feature flags?
   - Separate subdomain `beta.lumiku.com`?
   - How to handle testing without disrupting production?

7. **User Onboarding:**
   - Guided tour for new features?
   - Video tutorials?
   - Sample brand kit to get started?

8. **Quality Control:**
   - Manual review for low-quality generations?
   - Automatic quality filtering?
   - User feedback loop for improvement?

---

## 📚 **TECHNICAL REFERENCES**

### **Hugging Face Resources:**
- ControlNet OpenPose: `lllyasviel/control_v11p_sd15_openpose`
- Pose Datasets: `sayakpaul/poses-controlnet-dataset`
- Inference API Docs: https://huggingface.co/docs/api-inference

### **Alternative Providers:**
- Fal.ai: https://fal.ai/models/controlnet-openpose
- Replicate: https://replicate.com/controlnet
- Stability AI: https://platform.stability.ai/

### **Existing Lumiku Tech:**
- MobileSAM: Already integrated for background removal
- ModelsLab: Already integrated for inpainting
- BullMQ: Already used for queue processing
- Prisma + PostgreSQL: Main database

---

## 📞 **CONTACT & FEEDBACK**

**Project Status:** Planning & Discussion Phase
**Next Action:** Review this document, discuss points above, then decide implementation priorities

**Key Decisions:**
1. ✅ **CONFIRMED:** Multi-brand approach for Brand Kit
2. ✅ **CONFIRMED:** Unlimited pricing with smart abuse protection system
3. ✅ **CONFIRMED:** Internal analytics first (external pixel tracking = future premium feature)
4. ⏳ **PENDING:** Pose dataset strategy (500 vs 1000 poses, manual vs automated curation)
5. ⏳ **PENDING:** Primary generation provider (HF Free tier vs Fal.ai vs multi-provider fallback)
6. ⏳ **PENDING:** MVP scope (AI avatar generation in Phase 1 or Phase 2?)

---

**Document Version:** 2.0
**Last Updated:** 2025-10-10
**Status:** Strategic Plan with Confirmed Pricing & Abuse Protection System

**Major Updates in v2.0:**
- ✅ Added complete "Unlimited Pricing with Abuse Protection" system
- ✅ Detailed profit margin analysis for all user scenarios
- ✅ Full technical implementation (UsageMonitorService + Queue Priority)
- ✅ Email templates for all monitoring levels
- ✅ Database schema for usage tracking
- ✅ Legal fair use policy text
- ✅ 6-week implementation roadmap for abuse protection

---

## 🎬 **SAMPLE USER JOURNEY (End-to-End)**

**Meet Ibu Sari - UMKM Owner with 2 Brand Lines:**

### **Day 1: Setup**
```
1. Login to Lumiku
2. Create Brand Kit #1: "Skincare Aura"
   - Logo: ✅ Uploaded
   - Colors: #FFB6C1, #FFF0F5, #C71585
   - Fonts: Playfair Display, Inter
   - Tone: Elegant, sophisticated

3. Create Brand Kit #2: "Kids Joy"
   - Logo: ✅ Uploaded
   - Colors: #FFD700, #FF6B6B, #4ECDC4
   - Fonts: Fredoka, Nunito
   - Tone: Playful, fun
```

### **Day 2: Avatar Creation**
```
Brand: Skincare Aura
1. Upload avatar photo (female model, 25-30yo)
2. Set characteristics:
   - Gender: Female
   - Age: Young adult
   - Style: Elegant
3. Save as "Aura Model - Main"

Brand: Kids Joy
1. Upload avatar photo (kid model, 5-7yo)
2. Set characteristics:
   - Gender: Unisex
   - Age: Kids
   - Style: Playful
3. Save as "Joy Kids - Main"
```

### **Day 3: Product Upload**
```
Brand: Skincare Aura
1. Upload 5 products:
   - Serum bottle
   - Moisturizer jar
   - Cleanser tube
   - Toner bottle
   - Mask sachet
2. Auto background removal (SAM) ✅
3. Categorize each product
4. Save to "Skincare Aura" brand

Brand: Kids Joy
1. Upload 3 products:
   - Kids t-shirt
   - Kids pants
   - Kids shoes
2. Background removal ✅
3. Save to "Kids Joy" brand
```

### **Day 4: POSE GENERATION! 🎯**
```
Brand: Skincare Aura
Product: Serum bottle

1. Select avatar: "Aura Model - Main"
2. Select product: "Serum bottle"
3. Choose pose distribution:
   - Close-up (holding serum): 30 poses
   - Application (applying serum): 40 poses
   - Lifestyle (natural pose): 30 poses
   Total: 100 poses

4. Click "Generate Poses"
5. System starts batch generation...
6. Progress: 10%... 50%... 90%... Done! ✅

Results:
- 97 successful poses (97% success rate!)
- 3 failed (auto-flagged for retry)
- Estimated time saved: 50 hours of photoshoot!
```

### **Day 5: Create Posters**
```
1. Browse 97 generated poses
2. Pick top 20 favorites
3. For each pose:
   - Open in Poster Editor
   - Apply brand kit (auto colors & fonts)
   - Add text: "New Serum - Glowing Skin in 7 Days"
   - Generate 5 variations (different layouts)

Total: 20 poses × 5 variations = 100 unique posters!
```

### **Day 6: Export & Use**
```
1. Select all 100 posters
2. Batch export:
   - Instagram Post (1080x1080): 100 files
   - Instagram Story (1080x1920): 100 files
   - Facebook Post (1200x630): 100 files
   - WhatsApp Status (1080x1920): 100 files

Total: 400 ready-to-use marketing materials!

3. Download as ZIP
4. Upload to Meta Ads Manager
5. Upload to TikTok Ads
6. Share on WhatsApp Business
```

### **Day 7: Check Analytics**
```
Dashboard shows:
📊 This Week:
- 200 poses generated (2 brands)
- 400 posters created
- 800 exports (multi-format)
- Time saved: 100+ hours
- Cost saved vs photoshoot: Rp 12,000,000+

💡 Insights:
- Your most exported: IG Post (45%)
- Best performing category: Close-up poses
- Suggestion: Generate more "Application" poses
```

### **Result:**
```
Traditional way:
- Cost: Rp 12,000,000
- Time: 2-3 weeks
- Material: 50-100 photos max

With Lumiku:
- Cost: Rp 299,000 (Pro plan)
- Time: 1 week
- Material: 400+ unique designs

ROI: 4,000%+ 🚀
```

---

**END OF STRATEGIC PLAN**

---

*This document will be updated as decisions are made and development progresses.*
