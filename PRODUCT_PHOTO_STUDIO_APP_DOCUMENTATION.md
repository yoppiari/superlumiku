# AI Product Photo Studio - Application Documentation

**Version**: 1.0.0
**Status**: Implementation-Ready
**Target Platform**: Lumiku
**Last Updated**: 2025-10-17

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Specification](#2-product-specification)
3. [Technical Architecture](#3-technical-architecture)
4. [Credit Pricing Strategy](#4-credit-pricing-strategy)
5. [Implementation Roadmap](#5-implementation-roadmap)
6. [Development Guide](#6-development-guide)
7. [Deployment Guide](#7-deployment-guide)
8. [Monitoring & Analytics](#8-monitoring--analytics)
9. [Future Enhancements](#9-future-enhancements)
10. [Appendix](#10-appendix)

---

## 1. Executive Summary

### 1.1 Overview

**AI Product Photo Studio** is a comprehensive SaaS tool designed specifically for UMKM (SME) sellers in Indonesia to create professional e-commerce product photos without expensive studio equipment or advanced photography skills.

**Target Users**: E-commerce sellers on Shopee, Tokopedia, TikTok Shop, and Instagram who need high-quality product photography but lack professional resources.

**Core Value Proposition**:
- Transform amateur product photos into professional studio-quality images in minutes
- No photography skills required - AI handles background removal, lighting, and enhancements
- Batch processing for sellers with large inventories (up to 100 products at once)
- Platform-optimized exports for Shopee, Tokopedia, Instagram, TikTok Shop
- Seamless integration with other Lumiku apps (Background Remover, Image Upscaler, Carousel Mix)

### 1.2 Market Opportunity

**Target Addressable Market (TAM)**:
- **Indonesian E-commerce Sellers**: 16+ million active sellers across major platforms
- **Average Need**: 20-50 product photos per month per seller
- **Market Pain Point**: 73% of sellers cite poor product photography as a barrier to increased sales

**Serviceable Available Market (SAM)**:
- **Digital-savvy UMKM sellers**: ~4 million sellers
- **Monthly Active Users on Lumiku**: Currently 50,000+
- **Cross-sell opportunity**: 85% of existing Avatar Creator users have e-commerce presence

**Serviceable Obtainable Market (SOM)**:
- **Year 1 Target**: 5,000 monthly active users
- **Conservative conversion**: 10% of existing Lumiku user base

**Revenue Projections**:
- **Month 1**: 100 users × Rp 30,000 avg = **Rp 3,000,000** (~$200 USD)
- **Month 3**: 500 users × Rp 50,000 avg = **Rp 25,000,000** (~$1,650 USD)
- **Month 6**: 2,000 users × Rp 80,000 avg = **Rp 160,000,000** (~$10,600 USD)
- **Month 12**: 5,000 users × Rp 120,000 avg = **Rp 600,000,000** (~$40,000 USD)

**Break-Even Analysis**:
- **Infrastructure cost**: ~$200/month (compute, storage, APIs)
- **Break-even point**: 50 active users with average Rp 50,000 monthly spend
- **Expected break-even**: Month 1

### 1.3 Key Metrics

**Target Metrics**:
- **Users (Month 1)**: 100 active users
- **Users (Month 3)**: 500 active users
- **Users (Month 6)**: 2,000 active users
- **Users (Month 12)**: 5,000 active users
- **Break-even**: 50 users (achievable Month 1)
- **Average Revenue Per User (ARPU)**: Rp 50,000-120,000/month
- **Gross Margin**: 75-85% (after AI API costs)
- **Build Timeline**: 4 weeks (MVP in 2 weeks)

**Operational Metrics**:
- **Processing Speed**: 5-12 seconds per image
- **Batch Capacity**: 100 images per job
- **Success Rate Target**: 95%+
- **User Satisfaction**: 4.5+ stars

### 1.4 Success Criteria

**Month 1 Goals**:
- 100+ active users
- 2,000+ photos processed
- Rp 3M+ revenue
- <5% error rate
- 4.0+ user rating

**Month 3 Goals**:
- 500+ active users
- 15,000+ photos processed
- Rp 25M+ revenue
- Integration with all Lumiku apps complete
- 50+ templates available

**Month 6 Goals**:
- 2,000+ active users
- 80,000+ photos processed
- Rp 160M+ revenue
- 30% cross-app usage (users using Product Photo + other apps)
- Mobile-responsive interface

**Month 12 Goals**:
- 5,000+ active users
- 400,000+ photos processed
- Rp 600M+ revenue
- API for agencies launched
- Direct platform upload (Shopee/Tokopedia) available

---

## 2. Product Specification

### 2.1 User Stories

**Story 1: Quick Background Removal**
- **As a** Shopee seller
- **I want to** remove backgrounds from my product photos
- **So that** my products look professional on white backgrounds per platform requirements
- **Acceptance Criteria**:
  - Upload 1-50 photos at once
  - Background removed in <5 seconds per photo
  - High-quality cutout with smooth edges
  - Download as PNG with transparency

**Story 2: AI Background Replacement**
- **As a** fashion seller on Instagram
- **I want to** place my products in lifestyle scenes
- **So that** my photos look more appealing and increase engagement
- **Acceptance Criteria**:
  - Choose from 50+ pre-made templates
  - Generate custom AI backgrounds with text prompts
  - Preview before finalizing
  - Export optimized for Instagram (1:1, 4:5 ratios)

**Story 3: Batch Processing for Inventory**
- **As a** seller with 100+ products
- **I want to** process all my product photos at once with the same style
- **So that** I can save time and maintain consistent branding
- **Acceptance Criteria**:
  - Upload up to 100 photos
  - Apply same workflow to all (background, lighting, shadow)
  - Track progress in real-time
  - Receive bulk discount on credits
  - Download all as ZIP file

**Story 4: Professional Lighting Enhancement**
- **As a** electronics seller
- **I want to** fix poor lighting in my product photos
- **So that** product details are clearly visible to buyers
- **Acceptance Criteria**:
  - Auto-detect and fix lighting issues
  - Choose from 5 presets (Studio, Natural, Dramatic, Bright, Moody)
  - Manual adjustments (brightness, contrast, warmth)
  - Before/after comparison

**Story 5: Cross-App Workflow**
- **As a** power user of Lumiku
- **I want to** use Product Photo Studio with other apps
- **So that** I can create complete marketing materials
- **Acceptance Criteria**:
  - Send processed photos to Image Upscaler for 4x enhancement
  - Create carousel posts with Carousel Mix
  - Integrate with Background Remover for better quality
  - Single-click workflow transfers

### 2.2 Core Features

#### 2.2.1 Background Removal (MVP)

**Description**: AI-powered background removal using BiRefNet model via Segmind API. Produces clean cutouts with transparent backgrounds suitable for e-commerce listings.

**User Flow**:
1. Upload product photo(s) to project
2. Select "Remove Background" option
3. AI processes image in ~5 seconds
4. Preview result with zoom capability
5. Download as PNG or proceed to next step

**Technical Details**:
- **AI Model**: BiRefNet (Segmind API)
- **Processing Time**: ~5 seconds per image
- **Credits**: 5 credits per image
- **API Cost**: ~Rp 86 per image
- **Margin**: 80%
- **Output Format**: PNG with alpha channel
- **Quality Tiers**:
  - Free tier: Low quality (max 1024px)
  - Paid tier: High quality (up to 4096px)

**Integration**: Can leverage existing Background Remover app for improved quality and shared infrastructure.

#### 2.2.2 Background Replacement (MVP)

**Description**: Replace removed backgrounds with solid colors, gradients, templates, or AI-generated scenes.

**Options**:

**A. Solid Colors & Gradients**
- White, black, or custom hex colors
- Linear gradients with 2+ colors
- Radial gradients for spotlight effects
- **Credits**: 10 credits
- **Processing**: ~3 seconds

**B. Template Library**
- 50+ pre-designed templates
- Categories: Studio, Lifestyle, E-commerce, Seasonal
- Platform-specific (Shopee white, Instagram aesthetic)
- **Credits**: 12 credits
- **Processing**: ~5 seconds

**C. AI-Generated Backgrounds**
- Text-to-image generation (Stable Diffusion XL)
- Complexity levels:
  - **Simple**: Solid textures, simple scenes (15 credits, ~8s)
  - **Complex**: Detailed lifestyle scenes (25 credits, ~12s)
- Custom prompts: "luxury marble table", "outdoor cafe scene"
- **API**: Replicate SDXL or FAL.ai

**User Flow**:
1. Start with background-removed image
2. Choose replacement type (solid/gradient/template/AI)
3. For AI: Enter descriptive prompt
4. Preview generation
5. Adjust if needed (no additional charge for preview)
6. Apply and download

#### 2.2.3 Lighting Enhancement (MVP)

**Description**: Studio-quality lighting adjustments using IC-Light model. Fixes common issues like underexposure, harsh shadows, and color casts.

**Features**:

**Auto-Enhancement**
- AI detects lighting issues automatically
- Applies optimal corrections
- **Credits**: 8 credits
- **Processing**: ~8 seconds

**Manual Presets**
- **Studio**: Bright, even lighting with soft shadows (photography studio)
- **Natural**: Soft daylight simulation
- **Dramatic**: High contrast with defined shadows
- **Bright**: High-key lighting (white background products)
- **Moody**: Low-key with atmospheric shadows

**Manual Adjustments**
- Brightness: -100 to +100
- Contrast: -100 to +100
- Warmth (color temperature): -100 to +100
- **Credits**: 10 credits for manual (includes preview iterations)

**Technical Details**:
- **AI Model**: IC-Light (FAL.ai)
- **API Cost**: ~Rp 225 per enhancement
- **Margin**: 77%
- **Before/After**: Side-by-side comparison in UI

#### 2.2.4 Shadow Generation (MVP)

**Description**: Realistic shadow generation to add depth and realism to product photos on new backgrounds.

**Shadow Types**:

**Natural Shadow**
- Floor shadow as if product is on a surface
- Respects light direction from lighting settings
- Soft edges with realistic falloff
- **Credits**: 8 credits
- **Best for**: Products on flat surfaces (shoes, bottles, electronics)

**Drop Shadow**
- Elevated shadow (product appears floating)
- Adjustable distance and angle
- Popular for logos and hero images
- **Credits**: 8 credits
- **Best for**: Featured products, promotional images

**Reflection Shadow**
- Mirror-like reflection beneath product
- Creates glossy surface effect
- Adjustable opacity
- **Credits**: 10 credits
- **Best for**: Luxury items, cosmetics, jewelry

**Configuration**:
- **Opacity**: 0-100% (default: 40%)
- **Blur**: 0-100 (default: 50%)
- **Angle**: 0-360° (default: 135° - bottom-right)
- **Distance**: 0-100px (default: 20px)
- **Color**: Default black, customizable

**Technical Details**:
- **AI Model**: Depth Anything (depth estimation)
- **Processing**: Canvas-based shadow rendering
- **API Cost**: ~Rp 68 per shadow
- **Margin**: 86%
- **Processing Time**: ~5 seconds

#### 2.2.5 Batch Processing (V1.0)

**Description**: Process 1-100 images simultaneously with the same workflow configuration. Ideal for sellers with large inventories.

**Features**:
- Upload 1-100 images at once
- Apply identical workflow to all images
- Real-time progress tracking
- Queue-based processing (BullMQ)
- Bulk discount pricing (up to 20% off)
- Failed images reported with reasons
- Retry failed images

**User Flow**:
1. Create project
2. Upload 1-100 product photos
3. Configure workflow (background, lighting, shadow)
4. Review credit cost with bulk discount
5. Start batch processing
6. Monitor progress dashboard (percentage, completed count)
7. Download completed images as they finish
8. Final ZIP download when complete

**Pricing Structure**:
- **Base job cost**: 10 credits
- **Per-item cost**: 5 credits (vs. 30+ for single processing)
- **Total formula**: 10 + (5 × item_count)
- **Examples**:
  - 10 items: 60 credits (Rp 6,000) - saves 240 credits vs individual
  - 50 items: 260 credits (Rp 26,000) - saves 1,240 credits
  - 100 items: 510 credits (Rp 51,000) - saves 2,490 credits

**Technical Details**:
- **Queue**: BullMQ with Redis
- **Concurrency**: 5 workers (adjustable)
- **Retry Logic**: 3 attempts per failed image
- **Timeout**: 60 seconds per image
- **Progress Updates**: WebSocket or polling
- **Average Processing**: 8-12 seconds per image

#### 2.2.6 Template Library (V1.0)

**Description**: Curated collection of 50+ pre-designed templates for quick, professional results. Templates are complete workflow configurations (background + lighting + shadow).

**Categories**:

**Studio** (15 templates)
- White studio, Black studio, Gray studio
- Colored backgrounds (pastels, bold colors)
- Gradient backgrounds
- **Best for**: Clean, professional product shots

**Lifestyle** (15 templates)
- Kitchen counters, Office desks, Outdoor tables
- Living room scenes, Bedroom settings
- Cafe/restaurant environments
- **Best for**: Context-based product photography

**E-commerce** (15 templates)
- Shopee-optimized (white background, proper lighting)
- Tokopedia-optimized (clean, bright)
- Amazon-style (pure white, centered)
- Lazada-ready (specific aspect ratios)
- **Best for**: Marketplace listings

**Seasonal** (10+ templates)
- Christmas/Holiday themes
- Lunar New Year (red, gold accents)
- Ramadan/Eid themes
- Independence Day (Indonesian flag colors)
- **Best for**: Promotional campaigns

**Template Properties**:
- Preview image (high quality)
- Thumbnail (for gallery view)
- Category and subcategory tags
- Platform optimization (Instagram, Shopee, etc.)
- Aspect ratio (1:1, 4:5, 9:16, 16:9)
- Recommended dimensions
- Usage count (popularity metric)
- Average rating
- Premium flag (for paid tiers)

**User Flow**:
1. Browse template gallery
2. Filter by category, platform, or aspect ratio
3. Preview template with sample product
4. Click "Apply to My Photo"
5. Select product photo(s)
6. Review and confirm (15 credits per photo)
7. Process and download

**Admin Features**:
- Create new templates (admin only)
- Upload preview images
- Configure complete workflow JSON
- Set category, tags, platform
- Feature templates (show in hero section)
- Mark as premium (subscription required)

#### 2.2.7 Export Options (V1.0)

**Description**: Flexible export options with multiple formats, resolutions, and platform optimizations.

**Export Formats**:
- **PNG**: Lossless, transparency support (best for products with removed backgrounds)
- **JPEG**: Smaller file size, no transparency (best for marketplace uploads)
- **WebP**: Modern format, smaller size with quality (best for web/mobile)

**Resolution Options**:
- **Original**: Maintain source dimensions
- **1080x1080**: Instagram standard
- **1200x1200**: Shopee/Tokopedia recommended
- **2400x2400**: High-resolution for print
- **Custom**: User-defined dimensions

**Platform Optimization**:
- **Instagram**: 1080x1080 (1:1), 1080x1350 (4:5), JPG 95% quality
- **Shopee**: 1200x1200, white background, JPG 90%
- **Tokopedia**: 1200x1200, bright lighting, JPG 90%
- **TikTok Shop**: 1080x1080 or 1080x1920 (9:16), JPG 95%
- **Lazada**: 1000x1000 minimum, white background

**Watermark Handling**:
- Free tier: Lumiku watermark (bottom-right corner)
- Paid tier: No watermark
- Premium tier: Custom watermark option

**Bulk Export**:
- **Single Download**: Free, click any processed image
- **ZIP Export**: 5 credits base cost
  - All images in project
  - Selected images only
  - Organized folders (by format, by date)
  - Includes metadata.json (settings used)
- **Multi-Format**: 10 credits (export in PNG + JPG + WebP)
- **Multi-Platform**: 15 credits (export optimized for 3+ platforms)

**Download Experience**:
- Instant download for single images
- Queue-based ZIP generation for bulk (progress bar)
- Pre-signed URLs (7-day expiry)
- Email notification when ready (for large batches)
- ZIP auto-cleanup after 7 days

#### 2.2.8 Integrations (V1.5)

**Description**: Seamless workflows with other Lumiku applications for end-to-end content creation.

**A. Background Remover Integration**
- Share background removal infrastructure
- One-click: "Use Background Remover for better quality"
- Charges Background Remover credits separately
- Import Background Remover results directly

**B. Image Upscaler Integration**
- Send processed photos to upscaler
- One-click: "Upscale to 4x resolution"
- Useful for print-quality exports
- Charges Upscaler credits separately
- Auto-returns upscaled image to Product Photo project

**C. Carousel Mix Integration**
- Create carousel posts from product photos
- Select 2-10 processed images
- Add text overlays (product names, prices)
- Generate Instagram/TikTok carousel
- One-click export to social media

**D. Avatar Creator Integration (Future)**
- Use generated avatars as product models
- "Place product on avatar's hands"
- AI compositing for realistic placement
- Perfect for accessories (bags, jewelry, watches)

**Integration Flow**:
1. Process product photo in Product Photo Studio
2. Click "Send to Upscaler" or "Create Carousel"
3. System transfers image and metadata
4. Opens target app with pre-loaded content
5. User completes workflow in target app
6. Results linked back to original project

**API Endpoints**:
- `POST /api/apps/product-photo-studio/items/:id/upscale`
- `POST /api/apps/product-photo-studio/projects/:id/create-carousel`
- `GET /api/apps/product-photo-studio/items/:id/export-to/:targetApp`

### 2.3 Feature Comparison Table

| Feature | Free Tier | Standard (PAYG) | Professional | Premium |
|---------|-----------|-----------------|--------------|---------|
| **Background Removal** | ✅ Low quality (1024px max) | ✅ High quality (4096px) | ✅ High quality | ✅ Ultra quality |
| **Background Replacement** | ❌ | ✅ Solid/Template only | ✅ AI-generated (simple) | ✅ AI-generated (complex) |
| **Lighting Enhancement** | ❌ | ✅ Auto-enhance only | ✅ Presets + Manual | ✅ Advanced controls |
| **Shadow Generation** | ❌ Drop shadow only | ✅ Natural + Drop | ✅ All types | ✅ Custom shadows |
| **Templates** | 10 basic | 30 templates | 50+ templates | All templates + custom |
| **Batch Processing** | ❌ | Max 20 images | Max 50 images | Max 100 images |
| **Export Formats** | PNG only | PNG, JPG | PNG, JPG, WebP | All + custom |
| **Watermark** | Yes (Lumiku logo) | No | No | No |
| **Image Upscaling** | ❌ | ❌ | ❌ | ✅ 4x upscale included |
| **Platform Optimization** | ❌ | 1 platform | 3 platforms | All platforms |
| **ZIP Export** | ❌ | ✅ Single format | ✅ Multi-format | ✅ + Multi-platform |
| **Integration** | ❌ | Manual transfer | One-click integration | API access |
| **Priority Processing** | ❌ | ❌ | ✅ | ✅✅ Highest priority |
| **Support** | Community | Email (48h) | Email (24h) | Priority (4h) |
| **Monthly Credits** | 50 free credits | Pay-as-you-go | 500 credits/mo | 2,000 credits/mo |
| **Credit Cost** | Rp 200/credit | Rp 100/credit | Rp 80/credit | Rp 60/credit |
| **Monthly Price** | Free | PAYG | Rp 40,000 (~$2.60) | Rp 120,000 (~$8) |

### 2.4 User Workflows

**Workflow 1: Quick Product Photo (5 minutes)**

*Scenario*: Shopee seller needs clean white background for 10 products.

1. **Create Project** (30s)
   - Click "New Project"
   - Name: "Shopee Product Lineup - November"
   - Category: E-commerce

2. **Upload Photos** (1 min)
   - Drag-drop 10 product photos
   - System generates thumbnails
   - **Cost**: 20 credits (2 per upload)

3. **Batch Process** (2 min)
   - Select all 10 photos
   - Choose "Shopee Template" (white background + studio lighting)
   - Click "Apply to All"
   - **Cost**: 10 + (5 × 10) = 60 credits

4. **Monitor Progress** (1.5 min)
   - Real-time progress bar: "Processing 7/10..."
   - Preview completed images as they finish

5. **Download** (30s)
   - Click "Download All as ZIP"
   - Organized by format: `/shopee_1200x1200/`
   - **Cost**: 5 credits

**Total**: 85 credits (Rp 8,500), 5 minutes
**Result**: 10 professional Shopee-ready product photos

---

**Workflow 2: Professional Batch Processing (20 minutes for 50 photos)**

*Scenario*: Fashion boutique needs 50 products with lifestyle backgrounds for Instagram.

1. **Create Project** (1 min)
   - Name: "Fall Collection 2025"
   - Category: Fashion
   - Default template: "Lifestyle - Outdoor Cafe"

2. **Bulk Upload** (3 min)
   - Upload 50 product photos (clothing, accessories)
   - Add tags: "fall", "collection", "2025"
   - **Cost**: 100 credits

3. **Configure Workflow** (2 min)
   - Background: AI-generated "Outdoor cafe with warm lighting"
   - Lighting: Natural preset
   - Shadow: Natural floor shadow
   - Export: Instagram format (1080x1080)

4. **Preview & Adjust** (3 min)
   - Generate preview on 1 sample image (free)
   - Adjust AI prompt: "...with bokeh background"
   - Satisfied with result

5. **Batch Process** (8 min)
   - Start batch job
   - **Cost**: 10 + (5 × 50) = 260 credits
   - Processing time: ~8 min (queue-based)
   - Monitor: "Processing 42/50... 84% complete"

6. **Review Results** (2 min)
   - Preview all 50 in gallery view
   - Mark 3 favorites for carousel

7. **Export** (1 min)
   - ZIP export: Multi-format (PNG + JPG)
   - Platform: Instagram-optimized
   - **Cost**: 15 credits (multi-format + platform)

**Total**: 385 credits (Rp 38,500), 20 minutes
**Result**: 50 professional Instagram-ready photos with lifestyle backgrounds

---

**Workflow 3: Custom AI Background (10 minutes)**

*Scenario*: Electronics seller wants luxury aesthetic for premium speaker.

1. **Upload Photo** (1 min)
   - Single product: Bluetooth speaker
   - **Cost**: 2 credits

2. **Remove Background** (30s)
   - Click "Remove Background"
   - **Cost**: 5 credits
   - Processing: ~5 seconds
   - Preview: Clean cutout

3. **Generate AI Background** (3 min)
   - Choose "AI-Generated Background"
   - Prompt: "Luxury living room with marble coffee table, warm ambient lighting, modern minimalist interior"
   - Complexity: Complex (25 credits)
   - **Cost**: 25 credits
   - Processing: ~12 seconds
   - Preview result

4. **Enhance Lighting** (2 min)
   - Apply "Dramatic" preset
   - Increase warmth: +30
   - **Cost**: 10 credits
   - Before/after comparison

5. **Add Shadow** (1 min)
   - Natural floor shadow
   - Opacity: 50%, Blur: 60%
   - **Cost**: 8 credits

6. **Export** (30s)
   - Format: PNG (high resolution)
   - Resolution: 2400x2400 (for website hero image)
   - **Cost**: 0 credits (single download free)

7. **Send to Upscaler** (2 min)
   - One-click "Upscale to 4x"
   - Opens Image Upscaler app
   - Upscaler processes at 4x resolution
   - **Cost**: 20 credits (Upscaler charges)

**Total**: 70 credits in Product Photo + 20 in Upscaler = 90 credits (Rp 9,000), 10 minutes
**Result**: Ultra-high-quality luxury product photo ready for website and ads

---

**Workflow 4: Cross-App Integration (15 minutes)**

*Scenario*: Cosmetics brand creating complete Instagram campaign.

1. **Avatar Creator** (5 min)
   - Generate 5 diverse avatars (different skin tones)
   - Export high-resolution portraits
   - **App**: Avatar Creator

2. **Product Photo Studio** (5 min)
   - Upload 3 lipstick photos
   - Remove backgrounds
   - AI background: "Soft pink gradient with sparkle effects"
   - Lighting: Studio preset
   - Shadow: Reflection
   - Export: Instagram format (1080x1080)
   - **Cost**: 150 credits total

3. **Carousel Mix** (5 min)
   - Import 5 avatars + 3 product photos
   - Create 8-slide carousel:
     - Slide 1: Brand intro
     - Slides 2-6: Avatars wearing different lipstick shades
     - Slides 7-8: Product close-ups
   - Add text: Product names, prices, CTA
   - Export: Instagram carousel (1080x1080 each slide)
   - **App**: Carousel Mix

**Total**: 150 credits (Product Photo) + 50 (Avatar) + 30 (Carousel) = 230 credits (Rp 23,000), 15 minutes
**Result**: Complete Instagram carousel campaign ready to post

---

## 3. Technical Architecture

### 3.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────┐ │
│  │  Project UI  │  │  Upload UI    │  │  Processing Queue   │ │
│  │  Management  │  │  (Drag&Drop)  │  │  (Progress Tracker) │ │
│  └──────────────┘  └───────────────┘  └─────────────────────┘ │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────┐ │
│  │  Template    │  │  Export       │  │  Integration        │ │
│  │  Gallery     │  │  Modal        │  │  Bridges            │ │
│  └──────────────┘  └───────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Hono.js + Bun)                     │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────┐ │
│  │  API Routes  │  │  Middleware   │  │  Credit Manager     │ │
│  │  (Projects,  │  │  (Auth, Rate  │  │  (Pricing, Billing) │ │
│  │   Items,     │  │   Limiting)   │  │                     │ │
│  │   Process)   │  │               │  │                     │ │
│  └──────────────┘  └───────────────┘  └─────────────────────┘ │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    SERVICE LAYER                         │  │
│  │  ┌────────────┐ ┌──────────────┐ ┌───────────────────┐ │  │
│  │  │ Background │ │  Lighting    │ │  Shadow           │ │  │
│  │  │ Service    │ │  Service     │ │  Service          │ │  │
│  │  └────────────┘ └──────────────┘ └───────────────────┘ │  │
│  │  ┌────────────┐ ┌──────────────┐ ┌───────────────────┐ │  │
│  │  │ Template   │ │  Export      │ │  Product Photo    │ │  │
│  │  │ Service    │ │  Service     │ │  Service          │ │  │
│  │  └────────────┘ └──────────────┘ └───────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │                      │                     │
           ▼                      ▼                     ▼
┌──────────────────┐  ┌─────────────────────┐  ┌────────────────┐
│   DATABASE       │  │   QUEUE SYSTEM      │  │   STORAGE      │
│   (PostgreSQL)   │  │   (BullMQ + Redis)  │  │   (Local/S3)   │
│                  │  │                     │  │                │
│  • Projects      │  │  • BG Removal       │  │  • Original    │
│  • Items         │  │  • BG Replacement   │  │  • Processed   │
│  • Variations    │  │  • Lighting         │  │  • Thumbnails  │
│  • Generations   │  │  • Shadow           │  │  • Exports     │
│  • Templates     │  │  • Batch Process    │  │  • Templates   │
│  • Exports       │  │  • Export ZIP       │  │                │
│  • Usage         │  │  • Cleanup          │  │                │
└──────────────────┘  └─────────────────────┘  └────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────────────────────────────────────────────────┐
│                    AI SERVICE PROVIDERS                      │
│  ┌────────────────┐ ┌───────────────┐ ┌─────────────────┐  │
│  │   Segmind      │ │    FAL.ai     │ │   Replicate     │  │
│  │   (BiRefNet    │ │   (IC-Light   │ │   (SDXL)        │  │
│  │    BG Remove)  │ │    Lighting)  │ │   (AI BG Gen)   │  │
│  └────────────────┘ └───────────────┘ └─────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Data Flow**:
1. User uploads image via frontend
2. Backend validates file, charges 2 credits, stores in filesystem
3. User initiates processing with workflow config
4. Backend calculates credit cost, validates balance
5. Job added to BullMQ queue with priority
6. Queue worker picks up job, calls appropriate services
7. Services orchestrate AI API calls (Segmind, FAL.ai, Replicate)
8. Results composited using Sharp.js
9. Processed image saved, database updated
10. Frontend polls for completion, displays result

### 3.2 Technology Stack

**Frontend**:
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast HMR, optimized builds)
- **State Management**: Zustand (lightweight, no boilerplate)
- **Styling**: TailwindCSS (utility-first, consistent design)
- **UI Components**: Headless UI (accessibility built-in)
- **File Upload**: Dropzone.js (drag-and-drop)
- **Image Preview**: React Image Gallery (zoom, pan)
- **Progress**: React Circular Progressbar
- **Routing**: React Router v6

**Backend**:
- **Runtime**: Bun (fast, TypeScript-native, built-in bundler)
- **Framework**: Hono.js (lightweight, Express-like, edge-ready)
- **ORM**: Prisma (type-safe, migrations, excellent DX)
- **Validation**: Zod (TypeScript-first schema validation)
- **File Upload**: Multer (multipart form handling)
- **Image Processing**: Sharp (fast, memory-efficient)

**Database**:
- **Primary**: PostgreSQL 15+ (JSONB support, full-text search)
- **Connection**: Prisma Client (pooling, prepared statements)
- **Migrations**: Prisma Migrate (version-controlled schema)

**Queue System**:
- **Queue**: BullMQ (Redis-backed, reliable, observable)
- **Message Broker**: Redis 7+ (in-memory, pub/sub)
- **Concurrency**: 5 workers (configurable per job type)
- **Monitoring**: Bull Board (web UI for queue inspection)

**Storage**:
- **Phase 1 (MVP)**: Local filesystem (`/uploads`, `/processed`)
- **Phase 2 (Scale)**: AWS S3 or DigitalOcean Spaces
- **CDN**: CloudFlare (image optimization, caching)
- **Backup**: Daily snapshots to S3

**AI Providers**:
- **Segmind**: BiRefNet (background removal) - $0.0067/image
- **FAL.ai**: IC-Light (lighting enhancement) - $0.015/image
- **Replicate**: Stable Diffusion XL (AI backgrounds) - $0.023/image
- **Depth Anything**: Depth estimation (shadow generation) - $0.0045/image

**Infrastructure**:
- **Hosting**: Coolify (self-hosted PaaS on VPS)
- **Server**: VPS (4 vCPU, 8GB RAM, 160GB SSD)
- **OS**: Ubuntu 22.04 LTS
- **Proxy**: Nginx (reverse proxy, SSL termination)
- **SSL**: Let's Encrypt (automatic renewal)

**Monitoring & Analytics**:
- **Logs**: Pino (structured JSON logging)
- **Errors**: Sentry (error tracking, performance monitoring)
- **Analytics**: Custom dashboard (user stats, revenue metrics)
- **Uptime**: UptimeRobot (external monitoring)

### 3.3 Database Schema

**Core Models**:

```prisma
// Project container
model ProductPhotoProject {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  category    String   @default("general")

  totalPhotos    Int @default(0)
  totalProcessed Int @default(0)
  totalExported  Int @default(0)
  status         String @default("active")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  items       ProductPhotoItem[]
  generations ProductPhotoGeneration[]
  exports     ProductPhotoExport[]

  @@index([userId, createdAt(sort: Desc)])
}

// Individual photos
model ProductPhotoItem {
  id        String @id @default(cuid())
  projectId String
  userId    String

  originalFileName String
  originalFilePath String
  originalFileSize Int
  originalWidth    Int
  originalHeight   Int

  processedFilePath String?
  bgRemovedFilePath String?
  thumbnailUrl      String?

  status        String  @default("uploaded")
  workflowConfig String? @db.Text
  templateId     String?

  productName String?
  productSku  String?
  productTags String[]

  isFavorite Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project    ProductPhotoProject     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  variations ProductPhotoVariation[]

  @@index([projectId])
  @@index([userId])
}

// Variations (different backgrounds, lighting, etc.)
model ProductPhotoVariation {
  id     String @id @default(cuid())
  itemId String

  filePath         String
  variationType    String // background, lighting, shadow, template
  variationConfig  String @db.Text
  isSelected       Boolean @default(false)

  createdAt DateTime @default(now())

  item ProductPhotoItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([itemId])
}

// Batch generation jobs
model ProductPhotoGeneration {
  id        String @id @default(cuid())
  projectId String
  userId    String

  generationType String // batch_process, ai_background, etc.
  itemIds        String[]
  workflowConfig String @db.Text

  status     String @default("pending")
  progress   Int    @default(0)
  creditCharged Int

  queueJobId String?

  createdAt   DateTime  @default(now())
  completedAt DateTime?

  project ProductPhotoProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([userId, status])
}

// Template library
model ProductPhotoTemplate {
  id          String @id @default(cuid())
  name        String
  description String? @db.Text
  category    String

  previewImageUrl String
  templateConfig  String @db.Text

  platform    String?
  aspectRatio String @default("1:1")

  isPublic    Boolean @default(true)
  isFeatured  Boolean @default(false)
  isPremium   Boolean @default(false)

  usageCount Int @default(0)

  createdAt DateTime @default(now())

  @@index([category])
  @@index([isFeatured, usageCount(sort: Desc)])
}

// Export jobs
model ProductPhotoExport {
  id        String @id @default(cuid())
  projectId String
  userId    String

  exportType  String
  itemIds     String[]
  formats     String[]

  zipFilePath String?
  status      String @default("pending")

  creditCharged Int @default(0)
  expiresAt     DateTime?

  createdAt DateTime @default(now())

  project ProductPhotoProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

// Usage tracking
model ProductPhotoUsage {
  id     String @id @default(cuid())
  userId String

  action     String
  actionType String

  referenceId   String?
  referenceType String?

  creditUsed Int @default(0)

  integratedWith String?

  createdAt DateTime @default(now())

  @@index([userId, createdAt(sort: Desc)])
}
```

**Relationships**:
```
User (external)
  └─► ProductPhotoProject (1:many)
       ├─► ProductPhotoItem (1:many)
       │    └─► ProductPhotoVariation (1:many)
       ├─► ProductPhotoGeneration (1:many)
       └─► ProductPhotoExport (1:many)

ProductPhotoTemplate (standalone, reusable)

ProductPhotoUsage (audit trail, analytics)
```

### 3.4 API Overview

**Project Management (5 endpoints)**:
- `POST /api/apps/product-photo-studio/projects` - Create project
- `GET /api/apps/product-photo-studio/projects` - List projects
- `GET /api/apps/product-photo-studio/projects/:id` - Get project details
- `PUT /api/apps/product-photo-studio/projects/:id` - Update project
- `DELETE /api/apps/product-photo-studio/projects/:id` - Delete project

**File Upload (2 endpoints)**:
- `POST /api/apps/product-photo-studio/projects/:id/items/upload` - Upload photos
- `DELETE /api/apps/product-photo-studio/items/:id` - Delete photo

**Processing (4 endpoints)**:
- `POST /api/apps/product-photo-studio/items/:id/process` - Process single photo
- `POST /api/apps/product-photo-studio/projects/:id/batch-process` - Batch process
- `GET /api/apps/product-photo-studio/generations/:id` - Get generation status
- `POST /api/apps/product-photo-studio/items/:id/apply-template` - Apply template

**Templates (3 endpoints)**:
- `GET /api/apps/product-photo-studio/templates` - List templates
- `GET /api/apps/product-photo-studio/templates/:id` - Get template details
- `POST /api/apps/product-photo-studio/templates` - Create template (admin)

**Export (4 endpoints)**:
- `GET /api/apps/product-photo-studio/items/:id/download` - Download single
- `POST /api/apps/product-photo-studio/projects/:id/export-zip` - Export ZIP
- `GET /api/apps/product-photo-studio/exports/:id` - Get export status
- `GET /api/apps/product-photo-studio/exports/:id/download` - Download ZIP

**Integration (2 endpoints)**:
- `POST /api/apps/product-photo-studio/items/:id/upscale` - Send to Upscaler
- `POST /api/apps/product-photo-studio/projects/:id/create-carousel` - Create carousel

**Stats (1 endpoint)**:
- `GET /api/apps/product-photo-studio/stats` - Get user statistics

**Total**: 21 endpoints

### 3.5 AI Pipeline

**Complete Processing Workflow**:

```
INPUT IMAGE
    │
    ▼
[Step 1: Validate & Upload]
    │ • Check file type (JPEG, PNG, WebP)
    │ • Check dimensions (500x500 to 8000x8000)
    │ • Check file size (<20MB)
    │ • Charge 2 credits
    │ • Save to /uploads/
    │ • Generate thumbnail
    │ • Create database record
    ▼
[Step 2: Background Removal] (Optional, 5 credits, ~5s)
    │ • Call Segmind BiRefNet API
    │ • Input: original image
    │ • Output: PNG with alpha channel
    │ • Save to /processed/bg-removed/
    │ • Update database: bgRemovedFilePath
    ▼
[Step 3: Background Replacement] (Optional, 10-25 credits, ~3-12s)
    │ • Type: Solid/Gradient/Template/AI
    │ • If Solid: Sharp.js compositing (~3s)
    │ • If Gradient: Canvas API generation (~3s)
    │ • If Template: Load template, composite (~5s)
    │ • If AI: Call Replicate SDXL (~12s)
    │ • Composite foreground onto new background
    │ • Save to /processed/bg-replaced/
    ▼
[Step 4: Lighting Enhancement] (Optional, 8-10 credits, ~8s)
    │ • Call FAL.ai IC-Light API
    │ • Apply preset or manual adjustments
    │ • Brightness, contrast, warmth
    │ • Save to /processed/lighting/
    ▼
[Step 5: Shadow Generation] (Optional, 8-10 credits, ~5s)
    │ • Detect subject bounds
    │ • Call Depth Anything for depth map
    │ • Render shadow (natural/drop/reflection)
    │ • Composite shadow layer
    │ • Save to /processed/shadow/
    ▼
[Step 6: Optional Upscale] (20 credits, ~15s, via Image Upscaler)
    │ • Transfer to Image Upscaler app
    │ • Real-ESRGAN 4x upscaling
    │ • Return to Product Photo Studio
    ▼
[Step 7: Template Application] (15 credits, ~25s)
    │ • If template selected:
    │   • Load template workflow JSON
    │   • Execute steps 2-5 automatically
    │   • Apply all enhancements bundled
    ▼
OUTPUT IMAGE
    │ • Final processed image
    │ • Save to /processed/final/
    │ • Generate preview thumbnail
    │ • Update database: processedFilePath
    │ • Record processing log
    │ • Update project stats
```

**Processing Time Estimates**:
- Background removal only: ~5s
- Background + lighting: ~13s
- Background + lighting + shadow: ~18s
- Full workflow (all features): ~30s
- Template application: ~25s (bundled workflow)
- Batch (50 items, 5 workers): ~8 minutes

**Error Handling**:
- API timeout: 60s per step, retry 3x with exponential backoff
- Insufficient credits: Block request, return 403
- Invalid image: Return 400 with detailed error
- AI service down: Fallback to alternative provider or queue for later
- Storage full: Alert admin, pause new uploads

### 3.6 Queue System

**Job Types** (8 types):

1. **BG_REMOVAL** - Remove background from single image
2. **BG_REPLACEMENT** - Replace background (solid/template/AI)
3. **LIGHTING_ENHANCE** - Apply lighting adjustments
4. **SHADOW_GENERATE** - Generate shadows
5. **TEMPLATE_APPLY** - Apply complete template workflow
6. **BATCH_PROCESS** - Process multiple images with same workflow
7. **EXPORT_ZIP** - Generate ZIP archive for download
8. **CLEANUP_TEMP** - Delete temporary files, expired exports

**Priority Levels**:
- **Critical (1)**: Premium tier users
- **High (2)**: Professional tier users, single item processing
- **Normal (3)**: Standard tier, small batches (<10 items)
- **Low (4)**: Large batches (>10 items), free tier

**Queue Configuration**:
```typescript
// BullMQ queue options
const queueOptions = {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5s, double each retry
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24h
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
    },
  },
}

// Worker configuration
const workerOptions = {
  concurrency: 5, // Process 5 jobs simultaneously
  limiter: {
    max: 10, // Max 10 jobs per interval
    duration: 1000, // Per 1 second (rate limiting)
  },
}
```

**Retry Strategy**:
- **Attempt 1**: Immediate processing
- **Attempt 2**: Wait 5 seconds, retry
- **Attempt 3**: Wait 10 seconds, retry
- **Attempt 4**: Wait 20 seconds, final attempt
- **Failed**: Move to failed queue, refund credits, notify user

**Job Events**:
- `waiting` - Job added to queue
- `active` - Worker picked up job
- `progress` - Update progress percentage (for batch jobs)
- `completed` - Job finished successfully
- `failed` - Job failed after all retries
- `stalled` - Job stalled (worker crashed)

**Monitoring**:
- Bull Board UI: `http://localhost:3000/admin/queues`
- Metrics: Job count, processing time, failure rate
- Alerts: Queue too long (>100 jobs), high failure rate (>10%)

### 3.7 Integration Architecture

**How Product Photo Studio Connects with Other Apps**:

```
┌────────────────────────────────────────────────────────────┐
│              LUMIKU PLATFORM (Shared Core)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Auth System │  │  Credit      │  │  User           │  │
│  │  (JWT)       │  │  Management  │  │  Management     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌─────────────────┐  ┌────────────────┐
│ Background   │  │ Product Photo   │  │ Image          │
│ Remover      │◄─┤ Studio          │─►│ Upscaler       │
└──────────────┘  │                 │  └────────────────┘
                  │                 │
                  │                 │  ┌────────────────┐
                  │                 │─►│ Carousel Mix   │
                  └─────────────────┘  └────────────────┘
```

**A. Background Remover Integration**

**Scenario**: User wants higher quality background removal than Product Photo Studio's standard offering.

**Implementation**:
```typescript
// In Product Photo Studio
async function useBackgroundRemover(itemId: string) {
  // 1. Get item details
  const item = await prisma.productPhotoItem.findUnique({ where: { id: itemId } })

  // 2. Create job in Background Remover app
  const bgRemovalJob = await fetch('/api/apps/background-remover/process', {
    method: 'POST',
    body: JSON.stringify({
      sourceApp: 'product-photo-studio',
      sourceItemId: itemId,
      imagePath: item.originalFilePath,
      returnTo: 'product-photo-studio',
    }),
  })

  // 3. Background Remover charges its own credits
  // 4. Returns processed image path
  const result = await bgRemovalJob.json()

  // 5. Update item in Product Photo Studio
  await prisma.productPhotoItem.update({
    where: { id: itemId },
    data: { bgRemovedFilePath: result.outputPath },
  })

  // 6. Return to user
  return { success: true, bgRemovedPath: result.outputPath }
}
```

**B. Image Upscaler Integration**

**Scenario**: User wants to upscale processed product photo to 4x resolution for print.

**Implementation**:
```typescript
// Product Photo Studio sends to Upscaler
async function sendToUpscaler(itemId: string, variationId?: string) {
  const item = await prisma.productPhotoItem.findUnique({ where: { id: itemId } })

  // Determine which image to upscale
  const imagePath = variationId
    ? (await prisma.productPhotoVariation.findUnique({ where: { id: variationId } })).filePath
    : item.processedFilePath

  // Create upscale job
  const upscaleJob = await fetch('/api/apps/image-upscaler/upscale', {
    method: 'POST',
    body: JSON.stringify({
      sourceApp: 'product-photo-studio',
      sourceItemId: itemId,
      imagePath,
      upscaleFactor: 4,
      returnTo: 'product-photo-studio',
    }),
  })

  const result = await upscaleJob.json()

  // Save upscaled version as new variation
  await prisma.productPhotoVariation.create({
    data: {
      itemId,
      filePath: result.outputPath,
      variationType: 'upscaled',
      variationConfig: JSON.stringify({ upscaleFactor: 4 }),
      variationName: 'Upscaled 4x',
    },
  })

  return { redirectUrl: `/apps/image-upscaler/jobs/${result.jobId}` }
}
```

**C. Carousel Mix Integration**

**Scenario**: User creates carousel from multiple processed product photos.

**Implementation**:
```typescript
// Product Photo Studio sends to Carousel Mix
async function createCarousel(projectId: string, itemIds: string[], carouselName: string) {
  const items = await prisma.productPhotoItem.findMany({
    where: { id: { in: itemIds } },
  })

  // Create carousel project
  const carousel = await fetch('/api/apps/carousel-mix/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: carouselName,
      sourceApp: 'product-photo-studio',
      sourceProjectId: projectId,
      slides: items.map(item => ({
        imagePath: item.processedFilePath,
        text: item.productName,
      })),
    }),
  })

  const result = await carousel.json()

  return {
    carouselProjectId: result.id,
    redirectUrl: `/apps/carousel-mix/projects/${result.id}`,
  }
}
```

**Integration API Contract**:

All integrations follow a standard contract:

```typescript
interface IntegrationRequest {
  sourceApp: string // 'product-photo-studio'
  sourceItemId?: string
  sourceProjectId?: string
  imagePath: string
  returnTo?: string // URL to redirect after completion
  metadata?: Record<string, any>
}

interface IntegrationResponse {
  success: boolean
  jobId: string
  outputPath?: string
  redirectUrl?: string
  creditCharged: number
  message?: string
}
```

**Shared Data Access**:
- All apps access same PostgreSQL database
- Shared `users` and `credits` tables
- Cross-app queries allowed (with proper authorization)
- Audit trail in `ProductPhotoUsage` table tracks integrations

---

## 4. Credit Pricing Strategy

### 4.1 Pricing Table

Complete pricing for all features with cost breakdown:

| Feature | API Cost (Rp) | Credit Price | Rp Value | Margin | Processing Time |
|---------|---------------|--------------|----------|--------|-----------------|
| **Upload & Storage** | 10 | 2 credits | 200 | 95% | <1s |
| **Background Removal** | 86 | 5 credits | 500 | 80% | ~5s |
| **BG Replace (Solid)** | 5 | 10 credits | 1,000 | 99% | ~3s |
| **BG Replace (Template)** | 15 | 12 credits | 1,200 | 99% | ~5s |
| **BG Replace (AI Simple)** | 115 | 15 credits | 1,500 | 92% | ~8s |
| **BG Replace (AI Complex)** | 345 | 25 credits | 2,500 | 86% | ~12s |
| **Lighting Enhancement** | 225 | 10 credits | 1,000 | 77% | ~8s |
| **Shadow Generation** | 68 | 8 credits | 800 | 91% | ~5s |
| **Template Application** | ~450 | 15 credits | 1,500 | 70% | ~25s |
| **Batch Base** | 0 | 10 credits | 1,000 | 100% | 0s |
| **Batch Per Item** | ~450 | 5 credits | 500 | 10% | ~10s |
| **Export ZIP** | 50 | 5 credits | 500 | 90% | ~10s |
| **Export Multi-Format** | 100 | 10 credits | 1,000 | 90% | ~15s |
| **Export Multi-Platform** | 150 | 15 credits | 1,500 | 90% | ~20s |

**Credit Value**: 1 credit = Rp 100 (standard tier PAYG)

**Pricing Tiers**:
- **Free**: Rp 200/credit (50 free credits/month)
- **PAYG**: Rp 100/credit (pay-as-you-go)
- **Professional**: Rp 80/credit (500 credits/month = Rp 40,000)
- **Premium**: Rp 60/credit (2,000 credits/month = Rp 120,000)

### 4.2 Bundle Discounts

**Workflow Bundles** (10% discount when using multiple features):

**Standard Workflow** (BG Removal + Solid BG + Shadow):
- Individual: 5 + 10 + 8 = **23 credits**
- Bundled: 23 × 0.9 = **21 credits** (save 2 credits)

**Professional Workflow** (BG Removal + AI BG + Lighting + Shadow):
- Individual: 5 + 15 + 10 + 8 = **38 credits**
- Bundled: 38 × 0.9 = **35 credits** (save 3 credits)

**Premium Workflow** (BG Removal + AI BG Complex + Lighting + Shadow):
- Individual: 5 + 25 + 10 + 8 = **48 credits**
- Bundled: 48 × 0.9 = **44 credits** (save 4 credits)

**Template Workflow** (All-in-one):
- **15 credits** flat (includes BG removal + replacement + lighting + shadow)
- Saves 8-33 credits vs. manual workflow

**Batch Processing Discounts**:

| Batch Size | Standard Cost | Batch Cost | Discount | Savings |
|------------|---------------|------------|----------|---------|
| 1 item | 35 credits | 35 credits | 0% | 0 |
| 5 items | 175 credits | 35 credits | 80% | 140 credits |
| 10 items | 350 credits | 60 credits | 83% | 290 credits |
| 20 items | 700 credits | 110 credits | 84% | 590 credits |
| 50 items | 1,750 credits | 260 credits | 85% | 1,490 credits |
| 100 items | 3,500 credits | 510 credits | 85% | 2,990 credits |

**Formula**: `10 + (5 × batch_size)` vs. `35 × batch_size`

**Volume Discounts** (automatic, monthly usage):
- 0-500 credits used: Standard pricing
- 501-2,000 credits: 5% discount
- 2,001-5,000 credits: 10% discount
- 5,001+ credits: 15% discount

### 4.3 Cost Analysis

**Single Product Photo (Standard Workflow)**:

Breakdown:
1. Upload: 2 credits (Rp 200)
2. Background removal: 5 credits (Rp 500)
3. Solid background: 10 credits (Rp 1,000)
4. Shadow: 8 credits (Rp 800)
5. Download: 0 credits (free)

**Total**: 25 credits = **Rp 2,500** (~$0.17 USD)
**API Cost**: ~Rp 170
**Profit**: Rp 2,330 (**93% margin**)

**Batch 10 Products**:

Using batch processing:
- Upload: 2 × 10 = 20 credits (Rp 2,000)
- Batch process: 10 + (5 × 10) = 60 credits (Rp 6,000)
- ZIP export: 5 credits (Rp 500)

**Total**: 85 credits = **Rp 8,500** (~$0.57 USD)
**API Cost**: ~Rp 1,700 (10 images × Rp 170)
**Profit**: Rp 6,800 (**80% margin**)
**Per-image cost**: Rp 850 (vs. Rp 2,500 individual = **66% savings**)

**Batch 50 Products**:

- Upload: 2 × 50 = 100 credits (Rp 10,000)
- Batch process: 10 + (5 × 50) = 260 credits (Rp 26,000)
- ZIP export (multi-format): 10 credits (Rp 1,000)

**Total**: 370 credits = **Rp 37,000** (~$2.50 USD)
**API Cost**: ~Rp 8,500
**Profit**: Rp 28,500 (**77% margin**)
**Per-image cost**: Rp 740 (vs. Rp 2,500 individual = **70% savings**)

**Batch 100 Products**:

- Upload: 2 × 100 = 200 credits (Rp 20,000)
- Batch process: 10 + (5 × 100) = 510 credits (Rp 51,000)
- ZIP export (multi-platform): 15 credits (Rp 1,500)

**Total**: 725 credits = **Rp 72,500** (~$4.85 USD)
**API Cost**: ~Rp 17,000
**Profit**: Rp 55,500 (**77% margin**)
**Per-image cost**: Rp 725 (vs. Rp 2,500 individual = **71% savings**)

### 4.4 Example Calculations

**Example 1: Fashion Seller - Monthly Usage**

Scenario: 200 products/month, standard workflow

- 200 uploads: 400 credits
- 200 batch process (4 batches of 50): 4 × (10 + 250) = 1,040 credits
- 4 ZIP exports: 20 credits

**Total**: 1,460 credits/month

**Pricing Options**:
- PAYG (Rp 100/credit): **Rp 146,000** ($9.75/month)
- Professional (Rp 80/credit): **Rp 116,800** + subscription = Rp 156,800 total
- Premium (Rp 60/credit): **Rp 87,600** + subscription = Rp 207,600 total

**Best Choice**: PAYG (save Rp 10,800 vs Professional)

---

**Example 2: Electronics Store - High Volume**

Scenario: 500 products/month, AI backgrounds + lighting

Workflow cost per item (batch): 5 credits (batch per-item cost)

- 500 uploads: 1,000 credits
- 500 batch process (5 batches of 100): 5 × (10 + 500) = 2,550 credits
- 5 ZIP exports (multi-format): 50 credits

**Total**: 3,600 credits/month

**Pricing Options**:
- PAYG (Rp 100/credit): **Rp 360,000** ($24/month)
- Professional (Rp 80/credit): **Rp 288,000** + Rp 40,000 = **Rp 328,000** total (**save Rp 32,000**)
- Premium (Rp 60/credit): **Rp 216,000** + Rp 120,000 = **Rp 336,000** total

**Best Choice**: Professional tier (save Rp 32,000/month)

---

**Example 3: Casual Seller - Low Volume**

Scenario: 20 products/month, template workflow

- 20 uploads: 40 credits
- 20 template applications: 20 × 15 = 300 credits
- 1 ZIP export: 5 credits

**Total**: 345 credits/month

**Pricing Options**:
- Free (50 credits) + PAYG (295 credits × Rp 100): **Rp 29,500** ($2/month)
- Professional: Rp 40,000 (overkill, 500 credits included)

**Best Choice**: Free + PAYG (most affordable)

---

**Example 4: Agency - Enterprise Usage**

Scenario: 2,000 products/month across 50 clients

- 2,000 uploads: 4,000 credits
- 2,000 batch process (20 batches of 100): 20 × 510 = 10,200 credits
- 50 ZIP exports: 250 credits

**Total**: 14,450 credits/month

**Pricing Options**:
- Professional (Rp 80/credit): Rp 1,156,000 ($77/month)
- Premium (Rp 60/credit): **Rp 867,000** + Rp 120,000 = **Rp 987,000** total (**save Rp 169,000**)
- Custom Enterprise: Negotiate Rp 50/credit = Rp 722,500 (**save Rp 433,500**)

**Best Choice**: Custom enterprise plan (bulk discount)

---

## 5. Implementation Roadmap

### 5.1 MVP (Weeks 1-2)

**Goal**: Core functionality working - users can upload, process, and download product photos.

**Phase 1.1: Database & Infrastructure (Days 1-3)**

Day 1: Database Schema
- [ ] Add Prisma schema to `backend/prisma/schema.prisma`
- [ ] Run migration: `npx prisma migrate dev --name product-photo-studio-init`
- [ ] Verify tables created: `psql -d lumiku -c "\dt product_photo*"`
- [ ] Seed 10 sample templates
- [ ] Test database queries with Prisma Studio

Day 2: Plugin Configuration
- [ ] Create `backend/src/apps/product-photo-studio/plugin.config.ts`
- [ ] Register plugin in platform registry
- [ ] Configure credit pricing (all 15 operations)
- [ ] Set up routing prefix: `/api/apps/product-photo-studio`
- [ ] Test plugin loading: `bun run dev` and check logs

Day 3: File Upload System
- [ ] Install dependencies: `sharp`, `multer`
- [ ] Create upload directories: `/uploads/product-photos/`, `/processed/`
- [ ] Implement file validation middleware
- [ ] Create thumbnail generation service (Sharp.js)
- [ ] Test file upload endpoint with Postman

**Deliverables**:
- ✅ Database schema live
- ✅ Plugin registered in platform
- ✅ File upload working (up to 50 files)

---

**Phase 1.2: Background Processing (Days 4-7)**

Day 4: Background Removal Service
- [ ] Create `services/background.service.ts`
- [ ] Integrate Segmind BiRefNet API
- [ ] Implement `removeBackground()` method
- [ ] Add error handling and retries
- [ ] Test with 10 sample product images

Day 5: Background Replacement
- [ ] Implement `replaceBackgroundSolid()` (Sharp.js compositing)
- [ ] Implement `replaceBackgroundTemplate()` (load templates)
- [ ] Add gradient generation (canvas API)
- [ ] Test all background types
- [ ] Verify transparent background handling

Day 6: Template System
- [ ] Create `services/template.service.ts`
- [ ] Implement `listTemplates()` and `getTemplate()`
- [ ] Seed 5 basic templates (white, black, studio, gradient, shopee)
- [ ] Create template preview images
- [ ] Test template application

Day 7: Queue Worker Setup
- [ ] Install BullMQ: `bun add bullmq`
- [ ] Configure Redis connection
- [ ] Create `jobs/worker.ts` with job types
- [ ] Implement `BG_REMOVAL` and `BG_REPLACEMENT` jobs
- [ ] Test queue processing with 5 concurrent jobs

**Deliverables**:
- ✅ Background removal working
- ✅ 5 templates available
- ✅ Queue processing jobs

---

**Phase 1.3: Frontend MVP (Days 8-10)**

Day 8: Project Management UI
- [ ] Create `frontend/src/apps/product-photo-studio/` directory
- [ ] Implement `store/productPhotoStore.ts` (Zustand)
- [ ] Create `ProjectsList.tsx` component
- [ ] Create `ProjectDetail.tsx` component
- [ ] Add "New Project" modal
- [ ] Test CRUD operations

Day 9: File Upload Interface
- [ ] Implement `FileUpload.tsx` with drag-and-drop (Dropzone.js)
- [ ] Add upload progress bar
- [ ] Create thumbnail gallery view
- [ ] Add bulk selection (checkboxes)
- [ ] Display upload errors
- [ ] Test uploading 20 images at once

Day 10: Processing & Preview
- [ ] Create `ProcessingQueue.tsx` (real-time status)
- [ ] Implement `TemplateSelector.tsx` (gallery view)
- [ ] Add preview modal with before/after slider
- [ ] Implement download button (single file)
- [ ] Add credit balance display
- [ ] Test end-to-end workflow

**Deliverables**:
- ✅ Users can create projects
- ✅ Upload photos via drag-and-drop
- ✅ Select and apply templates
- ✅ Download processed images

---

**Phase 1.4: Testing & Polish (Days 11-14)**

Day 11: End-to-End Testing
- [ ] Test complete workflow: create → upload → process → download
- [ ] Test with 5 different product categories
- [ ] Test batch upload (50 images)
- [ ] Test error scenarios (invalid file, insufficient credits)
- [ ] Verify database records created correctly

Day 12: Error Handling
- [ ] Add user-friendly error messages
- [ ] Implement retry logic for failed jobs
- [ ] Add timeout handling (60s per image)
- [ ] Create error logging (Pino + file logs)
- [ ] Test API timeouts and failures

Day 13: Credit System Integration
- [ ] Verify credit deductions for all operations
- [ ] Test insufficient credit blocking
- [ ] Implement credit usage tracking
- [ ] Add credit history to stats endpoint
- [ ] Test edge cases (negative balance, concurrent requests)

Day 14: Performance Optimization
- [ ] Optimize image processing (Sharp.js settings)
- [ ] Add database indexes (userId, projectId)
- [ ] Implement API rate limiting (10 req/min per user)
- [ ] Test with 100 concurrent uploads
- [ ] Measure response times (<2s for API calls)

**MVP Deliverables**:
- ✅ Upload photos (up to 50 at once)
- ✅ Remove backgrounds (BiRefNet)
- ✅ Apply 5 templates
- ✅ Download results (single files)
- ✅ Credits working (deduction, tracking)
- ✅ Error handling robust
- ✅ 95%+ success rate

---

### 5.2 V1.0 (Weeks 3-4)

**Goal**: Full-featured product ready for public launch with all AI features, batch processing, and integrations.

**Phase 2.1: AI Features (Days 15-18)**

Day 15: AI Background Generation
- [ ] Integrate Replicate SDXL API
- [ ] Implement `replaceBackgroundAI()` (simple + complex)
- [ ] Add prompt engineering (optimize for products)
- [ ] Implement preview generation (free, no charge)
- [ ] Test with 20 different prompts

Day 16: Lighting Enhancement
- [ ] Create `services/lighting.service.ts`
- [ ] Integrate FAL.ai IC-Light API
- [ ] Implement 5 presets (Studio, Natural, Dramatic, Bright, Moody)
- [ ] Add manual adjustments (brightness, contrast, warmth)
- [ ] Create before/after comparison UI

Day 17: Shadow Generation
- [ ] Create `services/shadow.service.ts`
- [ ] Implement Depth Anything integration (depth estimation)
- [ ] Implement 3 shadow types (natural, drop, reflection)
- [ ] Add shadow customization (opacity, blur, angle, distance)
- [ ] Test shadow realism on 10 product types

Day 18: Workflow Bundling
- [ ] Implement complete workflow pipeline (BG → Lighting → Shadow)
- [ ] Add workflow presets (Standard, Professional, Premium)
- [ ] Calculate bundled pricing (10% discount)
- [ ] Test full workflow on 20 products
- [ ] Measure end-to-end processing time (<30s)

**Deliverables**:
- ✅ AI background generation (simple + complex)
- ✅ Lighting enhancement (5 presets + manual)
- ✅ Shadow generation (3 types + custom)
- ✅ Complete workflow bundles

---

**Phase 2.2: Batch Processing (Days 19-21)**

Day 19: Bulk Upload
- [ ] Increase upload limit to 100 images
- [ ] Add upload queue (process uploads sequentially)
- [ ] Implement bulk metadata entry (apply to all)
- [ ] Add CSV import for product data
- [ ] Test uploading 100 images (5GB total)

Day 20: Batch Queue Processing
- [ ] Implement `BATCH_PROCESS` job type
- [ ] Add progress tracking (percentage, completed count)
- [ ] Implement WebSocket for real-time updates
- [ ] Add pause/resume batch functionality
- [ ] Test batch of 100 items (verify 5 concurrent workers)

Day 21: Bulk Discount Logic
- [ ] Implement dynamic pricing formula: `10 + (5 × count)`
- [ ] Add batch size discounts (5%-20%)
- [ ] Display savings in UI ("Save 2,490 credits!")
- [ ] Update credit usage tracking for batches
- [ ] Test pricing calculations for 5, 20, 50, 100 items

**Deliverables**:
- ✅ Bulk upload (1-100 images)
- ✅ Batch processing with progress
- ✅ Bulk discount pricing
- ✅ Real-time progress updates

---

**Phase 2.3: Templates & Export (Days 22-24)**

Day 22: Template Library Expansion
- [ ] Create 50+ templates across 4 categories
- [ ] Studio: 15 templates (white, black, gradients, colored backgrounds)
- [ ] Lifestyle: 15 templates (kitchen, office, outdoor, cafe, bedroom)
- [ ] E-commerce: 15 templates (Shopee, Tokopedia, Amazon, Lazada)
- [ ] Seasonal: 10+ templates (Christmas, Lunar New Year, Ramadan, Independence Day)
- [ ] Generate high-quality preview images for each
- [ ] Tag templates (category, platform, aspect ratio)

Day 23: Export Formats & Options
- [ ] Implement multi-format export (PNG, JPG, WebP)
- [ ] Add resolution options (1080, 1200, 2400, custom)
- [ ] Implement platform optimization (Instagram, Shopee, Tokopedia, TikTok)
- [ ] Add watermark for free tier (bottom-right corner)
- [ ] Test export quality and file sizes

Day 24: ZIP Export
- [ ] Create `services/export.service.ts`
- [ ] Implement `EXPORT_ZIP` job type
- [ ] Generate ZIP with organized folders (`/png/`, `/jpg/`)
- [ ] Add metadata.json (workflow settings, timestamps)
- [ ] Implement 7-day expiry (auto-cleanup cron job)
- [ ] Add pre-signed URLs for download
- [ ] Test ZIP generation for 100 images (verify <2 min)

**Deliverables**:
- ✅ 50+ templates available
- ✅ Multi-format export (PNG, JPG, WebP)
- ✅ ZIP download for bulk export
- ✅ Platform-optimized exports

---

**Phase 2.4: Launch Prep (Days 25-28)**

Day 25: Background Remover Integration
- [ ] Implement `POST /items/:id/upscale` endpoint
- [ ] Add "Use Background Remover" button in UI
- [ ] Test cross-app communication
- [ ] Verify credit charging (Background Remover charges separately)
- [ ] Test result import back to Product Photo Studio

Day 26: Image Upscaler Integration
- [ ] Implement `POST /items/:id/upscale` endpoint
- [ ] Add "Upscale to 4x" button
- [ ] Test transfer to Image Upscaler
- [ ] Verify upscaled image saved as variation
- [ ] Test redirect back to Product Photo Studio

Day 27: Documentation
- [ ] Write user guide (5-minute tutorial)
- [ ] Create video demo (2-minute walkthrough)
- [ ] Document API endpoints (21 endpoints)
- [ ] Write deployment guide
- [ ] Create troubleshooting FAQ

Day 28: Production Deployment
- [ ] Run database migrations on production
- [ ] Deploy backend to Coolify
- [ ] Deploy frontend (build + upload)
- [ ] Configure environment variables (15 vars)
- [ ] Start queue workers (5 workers)
- [ ] Upload 50+ templates to production
- [ ] Run smoke tests (10 test cases)
- [ ] Monitor logs for errors
- [ ] Announce launch to users

**V1.0 Deliverables**:
- ✅ All AI features working (BG, lighting, shadow)
- ✅ Batch processing (up to 100 items)
- ✅ 50+ templates available
- ✅ Cross-app integrations (Background Remover, Image Upscaler)
- ✅ ZIP export with multiple formats
- ✅ Production deployed and stable
- ✅ Public launch ready

---

### 5.3 V1.5 (Month 2)

**Goal**: Enhanced features, optimizations, and expanded integrations based on user feedback.

Week 5-6: Advanced Features
- [ ] Carousel Mix integration (create carousels from product photos)
- [ ] Advanced lighting controls (manual shadow placement, multiple light sources)
- [ ] Custom template upload (users create templates)
- [ ] Template marketplace (users share templates)
- [ ] Batch editing (apply different settings to each image)

Week 7: Analytics & Insights
- [ ] User analytics dashboard (photos processed, credits used)
- [ ] Popular templates report (most-used, highest-rated)
- [ ] Credit usage breakdown (by feature)
- [ ] Monthly usage reports (email to users)
- [ ] Admin analytics (revenue, user growth, feature adoption)

Week 8: Performance Optimizations
- [ ] Migrate storage to S3 (CloudFlare R2 or DigitalOcean Spaces)
- [ ] Implement CDN for images (faster downloads)
- [ ] Add Redis caching for templates
- [ ] Optimize database queries (reduce N+1)
- [ ] Implement lazy loading for gallery (virtual scrolling)
- [ ] Add image compression (reduce storage costs)

**V1.5 Deliverables**:
- ✅ Carousel Mix integration complete
- ✅ Advanced lighting/shadow controls
- ✅ User-created templates
- ✅ Analytics dashboard
- ✅ Performance optimized (S3, CDN, caching)

---

### 5.4 V2.0 (Month 3+)

**Goal**: Scale to enterprise features, mobile app, and direct platform integrations.

Month 3: Enterprise Features
- [ ] API for agencies (programmatic access)
- [ ] White-label options (custom branding)
- [ ] Team collaboration (shared projects)
- [ ] Role-based access control (admins, editors, viewers)
- [ ] Bulk processing via API (1,000+ images)
- [ ] Webhook notifications (job completion)

Month 4: Platform Integrations
- [ ] Direct Shopee upload (API integration)
- [ ] Direct Tokopedia upload (API integration)
- [ ] Instagram auto-post (via Meta Graph API)
- [ ] TikTok Shop integration
- [ ] Lazada integration

Month 5: Mobile App
- [ ] React Native mobile app (iOS + Android)
- [ ] Mobile-optimized UI (touch gestures)
- [ ] Camera integration (take photo → process → upload)
- [ ] Offline mode (queue jobs when online)
- [ ] Push notifications (job completion)

Month 6: Advanced AI Features
- [ ] Video product demos (animate product photos)
- [ ] 3D product visualization (turn 2D into 3D model)
- [ ] AI product descriptions (generate text from image)
- [ ] Smart cropping & composition (AI-optimized framing)
- [ ] Background inpainting (fill in transparent areas)

**V2.0 Deliverables**:
- ✅ Enterprise API launched
- ✅ Direct platform uploads (Shopee, Tokopedia)
- ✅ Mobile app (iOS + Android)
- ✅ Advanced AI features (video, 3D, descriptions)

---

## 6. Development Guide

### 6.1 Getting Started

**Prerequisites**:
- Bun 1.0+ installed (`curl -fsSL https://bun.sh/install | bash`)
- PostgreSQL 15+ running
- Redis 7+ running
- Node.js 18+ (for some tools)
- Git

**Step 1: Clone Repository**
```bash
cd /path/to/lumiku-app
git checkout development
git pull origin development
```

**Step 2: Install Dependencies**
```bash
# Backend
cd backend
bun install

# Frontend
cd ../frontend
bun install
```

**Step 3: Setup Environment Variables**

Create `backend/.env`:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lumiku?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# AI APIs
SEGMIND_API_KEY="your_segmind_key"
FAL_API_KEY="your_fal_key"
REPLICATE_API_TOKEN="your_replicate_token"
DEPTH_ANYTHING_API_KEY="your_depth_key"

# Storage
UPLOAD_DIR="./uploads"
PROCESSED_DIR="./processed"
MAX_FILE_SIZE="20971520" # 20MB

# Queue
QUEUE_CONCURRENCY="5"
QUEUE_MAX_RETRIES="3"

# Credits
CREDIT_VALUE_RP="100" # 1 credit = Rp 100

# App
NODE_ENV="development"
PORT="3000"
```

**Step 4: Run Migrations**
```bash
cd backend
npx prisma migrate dev --name product-photo-studio-init
npx prisma generate
```

**Step 5: Seed Templates**
```bash
# Run seed script
bun run seed:templates
```

**Step 6: Start Development Server**
```bash
# Terminal 1: Backend
cd backend
bun run dev

# Terminal 2: Queue Worker
cd backend
bun run worker

# Terminal 3: Frontend
cd frontend
bun run dev
```

**Step 7: Verify Installation**

Open browser: `http://localhost:5173`
- Navigate to Product Photo Studio app
- Create test project
- Upload sample image
- Apply template
- Verify download works

### 6.2 Project Structure

```
lumiku-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema (add Product Photo models here)
│   │   └── migrations/                # Migration files
│   │
│   └── src/
│       ├── apps/
│       │   └── product-photo-studio/
│       │       ├── plugin.config.ts   # Plugin configuration (credits, routing)
│       │       │
│       │       ├── routes/            # API endpoints
│       │       │   ├── projects.ts    # Project CRUD (5 endpoints)
│       │       │   ├── items.ts       # Item CRUD + upload (2 endpoints)
│       │       │   ├── processing.ts  # Process + batch (4 endpoints)
│       │       │   ├── templates.ts   # Template management (3 endpoints)
│       │       │   ├── export.ts      # Export + download (4 endpoints)
│       │       │   ├── integration.ts # Cross-app (2 endpoints)
│       │       │   └── stats.ts       # Analytics (1 endpoint)
│       │       │
│       │       ├── services/          # Business logic
│       │       │   ├── ProductPhotoService.ts      # Core service (projects, items)
│       │       │   ├── BackgroundService.ts        # BG removal + replacement
│       │       │   ├── LightingService.ts          # Lighting enhancement
│       │       │   ├── ShadowService.ts            # Shadow generation
│       │       │   ├── TemplateService.ts          # Template management
│       │       │   ├── ExportService.ts            # ZIP export + downloads
│       │       │   └── IntegrationService.ts       # Cross-app communication
│       │       │
│       │       ├── jobs/              # Queue workers
│       │       │   ├── worker.ts      # Main worker (processes all job types)
│       │       │   ├── types.ts       # Job type definitions
│       │       │   └── handlers/      # Job handlers
│       │       │       ├── bgRemoval.ts
│       │       │       ├── bgReplacement.ts
│       │       │       ├── lighting.ts
│       │       │       ├── shadow.ts
│       │       │       ├── template.ts
│       │       │       ├── batchProcess.ts
│       │       │       ├── exportZip.ts
│       │       │       └── cleanup.ts
│       │       │
│       │       ├── types/             # TypeScript types
│       │       │   └── index.ts       # Shared types and interfaces
│       │       │
│       │       ├── utils/             # Utilities
│       │       │   ├── imageProcessing.ts  # Sharp.js helpers
│       │       │   ├── creditCalculator.ts # Credit pricing logic
│       │       │   └── validation.ts       # Input validation (Zod schemas)
│       │       │
│       │       └── templates/         # Template assets
│       │           ├── studio/        # Studio templates (white, black, gradients)
│       │           ├── lifestyle/     # Lifestyle templates (kitchen, office, etc.)
│       │           ├── ecommerce/     # E-commerce templates (Shopee, Tokopedia)
│       │           └── seasonal/      # Seasonal templates (holidays, events)
│       │
│       └── plugins/
│           └── registry.ts            # Register Product Photo Studio plugin
│
├── frontend/
│   └── src/
│       ├── apps/
│       │   └── product-photo-studio/
│       │       ├── store/             # State management
│       │       │   └── productPhotoStore.ts  # Zustand store (projects, items, queue)
│       │       │
│       │       ├── components/        # React components
│       │       │   ├── ProjectsList.tsx          # List all projects
│       │       │   ├── ProjectDetail.tsx         # Project details + items
│       │       │   ├── FileUpload.tsx            # Drag-and-drop upload
│       │       │   ├── ItemGallery.tsx           # Thumbnail gallery
│       │       │   ├── ProcessingQueue.tsx       # Real-time progress
│       │       │   ├── TemplateSelector.tsx      # Template gallery
│       │       │   ├── WorkflowConfigurator.tsx  # Configure workflow
│       │       │   ├── PreviewModal.tsx          # Before/after preview
│       │       │   ├── ExportModal.tsx           # Export options
│       │       │   ├── IntegrationButtons.tsx    # Cross-app buttons
│       │       │   └── StatsCard.tsx             # Usage statistics
│       │       │
│       │       ├── pages/             # Page components
│       │       │   ├── ProductPhotoStudioHome.tsx    # Landing page
│       │       │   ├── ProjectsListPage.tsx          # Projects list
│       │       │   ├── ProjectDetailPage.tsx         # Project detail
│       │       │   └── TemplatesPage.tsx             # Template browser
│       │       │
│       │       ├── hooks/             # Custom React hooks
│       │       │   ├── useProjects.ts       # Fetch projects
│       │       │   ├── useItems.ts          # Fetch items
│       │       │   ├── useTemplates.ts      # Fetch templates
│       │       │   ├── useProcessing.ts     # Start processing, track status
│       │       │   └── useExport.ts         # Export functionality
│       │       │
│       │       ├── types/             # TypeScript types
│       │       │   └── index.ts       # Frontend types (match backend)
│       │       │
│       │       └── utils/             # Utilities
│       │           ├── api.ts         # API client (fetch wrappers)
│       │           ├── creditCalculator.ts  # Frontend credit calculation
│       │           └── fileValidation.ts    # Client-side file validation
│       │
│       └── router.tsx                 # Add Product Photo Studio routes
│
└── uploads/                           # Local storage (development only)
    └── product-photos/
        ├── original/                  # Original uploads
        ├── processed/                 # Processed images
        ├── thumbnails/                # Thumbnails
        └── exports/                   # ZIP exports
```

### 6.3 Key Files Reference

**Backend**:
- **Schema**: `backend/prisma/schema.prisma` (lines ~500-800)
  - Add 7 models: Project, Item, Variation, Generation, Template, Export, Usage
- **Plugin**: `backend/src/apps/product-photo-studio/plugin.config.ts`
  - Credit pricing for all 15 operations
- **Routes**: `backend/src/apps/product-photo-studio/routes/`
  - 21 API endpoints across 7 route files
- **Services**: `backend/src/apps/product-photo-studio/services/`
  - 7 service classes handling core logic
- **Queue**: `backend/src/apps/product-photo-studio/jobs/worker.ts`
  - BullMQ worker processing 8 job types

**Frontend**:
- **Store**: `frontend/src/apps/product-photo-studio/store/productPhotoStore.ts`
  - Zustand state management (projects, items, processing queue)
- **Components**: `frontend/src/apps/product-photo-studio/components/`
  - 11 React components for UI
- **API Client**: `frontend/src/apps/product-photo-studio/utils/api.ts`
  - Fetch wrappers for all 21 endpoints

**Important Utilities**:
- **Image Processing**: `backend/src/apps/product-photo-studio/utils/imageProcessing.ts`
  - Sharp.js helpers (resize, composite, convert formats)
- **Credit Calculator**: `backend/src/apps/product-photo-studio/utils/creditCalculator.ts`
  - Calculate workflow costs, apply discounts
- **Validation**: `backend/src/apps/product-photo-studio/utils/validation.ts`
  - Zod schemas for request validation

### 6.4 Testing Strategy

**Unit Tests** (services, utilities):
```bash
# Test credit calculator
bun test src/apps/product-photo-studio/utils/creditCalculator.test.ts

# Test image processing
bun test src/apps/product-photo-studio/utils/imageProcessing.test.ts

# Test services
bun test src/apps/product-photo-studio/services/*.test.ts
```

**Integration Tests** (API endpoints):
```bash
# Test projects API
bun test src/apps/product-photo-studio/routes/projects.test.ts

# Test processing API
bun test src/apps/product-photo-studio/routes/processing.test.ts

# Run all integration tests
bun test:integration
```

**E2E Tests** (workflows):
```bash
# Test complete workflow
bun test:e2e src/apps/product-photo-studio/e2e/workflow.test.ts

# Test scenarios:
# 1. Create project → Upload → Process → Download
# 2. Batch process 50 images
# 3. Apply template to 10 images
# 4. Export ZIP with multiple formats
# 5. Send to Image Upscaler
```

**Performance Tests**:
```bash
# Load test API
bun run loadtest --url=http://localhost:3000/api/apps/product-photo-studio/projects --concurrent=100

# Test batch processing (50 items)
bun run test:performance batch-process

# Test queue throughput (1000 jobs)
bun run test:performance queue
```

**Test Coverage Goals**:
- Services: 80%+ coverage
- Routes: 70%+ coverage
- Utils: 90%+ coverage
- Overall: 75%+ coverage

---

## 7. Deployment Guide

### 7.1 Environment Variables

Complete list of 15 required environment variables:

**Database**:
```bash
DATABASE_URL="postgresql://user:password@host:5432/lumiku?schema=public"
```

**Redis**:
```bash
REDIS_HOST="redis.example.com"
REDIS_PORT="6379"
REDIS_PASSWORD="your_redis_password"
```

**AI API Keys**:
```bash
# Segmind (Background Removal)
SEGMIND_API_KEY="sk_xxx"

# FAL.ai (Lighting Enhancement)
FAL_API_KEY="fal_xxx"

# Replicate (AI Backgrounds)
REPLICATE_API_TOKEN="r8_xxx"

# Depth Anything (Shadow Generation)
DEPTH_ANYTHING_API_KEY="da_xxx"
```

**Storage**:
```bash
# Local (development)
UPLOAD_DIR="./uploads/product-photos"
PROCESSED_DIR="./processed/product-photos"

# S3 (production)
S3_BUCKET="lumiku-product-photos"
S3_REGION="ap-southeast-1"
S3_ACCESS_KEY="AKIAXXXXX"
S3_SECRET_KEY="xxxxx"
CDN_URL="https://cdn.lumiku.app"
```

**Queue**:
```bash
QUEUE_CONCURRENCY="5"  # Number of workers
QUEUE_MAX_RETRIES="3"
```

**App Config**:
```bash
MAX_FILE_SIZE="20971520"  # 20MB
MAX_BATCH_SIZE="100"      # Max items per batch
CREDIT_VALUE_RP="100"     # 1 credit = Rp 100
```

### 7.2 Pre-Deployment Checklist

**Infrastructure** (✅ before deploying):
- [ ] PostgreSQL 15+ running and accessible
- [ ] Redis 7+ running and accessible
- [ ] Sufficient disk space (100GB+ for storage)
- [ ] 8GB+ RAM available (for image processing)
- [ ] 4+ vCPU cores (for concurrent processing)
- [ ] Nginx configured (reverse proxy + SSL)
- [ ] Domain DNS configured (product-photos.lumiku.app)
- [ ] SSL certificate valid (Let's Encrypt)

**Database** (✅ before deploying):
- [ ] Backup current database (`pg_dump lumiku > backup.sql`)
- [ ] Run migrations (`npx prisma migrate deploy`)
- [ ] Verify tables created (`\dt product_photo*` in psql)
- [ ] Seed templates (`bun run seed:templates`)
- [ ] Create indexes (automatic via Prisma)

**Environment** (✅ before deploying):
- [ ] All 15 environment variables set in Coolify
- [ ] AI API keys valid and funded
- [ ] S3 bucket created (if using S3)
- [ ] CDN configured (if using CloudFlare)
- [ ] Redis connection tested
- [ ] Database connection tested

**Code** (✅ before deploying):
- [ ] All tests passing (`bun test`)
- [ ] Linting clean (`bun run lint`)
- [ ] Build successful (`bun run build`)
- [ ] No TypeScript errors (`bun run type-check`)
- [ ] Git branch up-to-date (`git pull origin main`)
- [ ] Version bumped (`package.json` version)

**Queue** (✅ before deploying):
- [ ] Queue worker service configured
- [ ] Worker auto-restart enabled (systemd/PM2)
- [ ] Queue monitoring enabled (Bull Board)
- [ ] Redis persistence enabled (AOF or RDB)

**Storage** (✅ before deploying):
- [ ] Upload directory created (`/uploads/product-photos/`)
- [ ] Processed directory created (`/processed/product-photos/`)
- [ ] Thumbnails directory created (`/thumbnails/product-photos/`)
- [ ] Exports directory created (`/exports/product-photos/`)
- [ ] Permissions set (readable/writable by app)
- [ ] Backup strategy configured (daily snapshots)

**Templates** (✅ before deploying):
- [ ] 50+ templates created
- [ ] Preview images generated (high quality)
- [ ] Template configurations validated (valid JSON)
- [ ] Templates uploaded to database
- [ ] Template assets uploaded to storage/CDN

**Monitoring** (✅ before deploying):
- [ ] Sentry configured (error tracking)
- [ ] Log aggregation setup (Pino → files)
- [ ] Uptime monitoring enabled (UptimeRobot)
- [ ] Alerts configured (email + Slack)
- [ ] Health check endpoint working (`/health`)

### 7.3 Deployment Steps

**Step 1: Database Migration**
```bash
# SSH into production server
ssh user@lumiku-server.com

# Navigate to backend
cd /var/www/lumiku-app/backend

# Run migrations (production mode)
npx prisma migrate deploy

# Verify
npx prisma migrate status

# Seed templates
bun run seed:templates --production
```

**Step 2: Deploy Backend**
```bash
# In Coolify dashboard:
# 1. Navigate to Product Photo Studio app
# 2. Click "Deploy"
# 3. Select branch: main
# 4. Wait for build to complete (~3 min)

# Verify deployment
curl https://api.lumiku.app/health

# Check logs
tail -f /var/www/lumiku-app/backend/logs/app.log
```

**Step 3: Deploy Frontend**
```bash
# Build frontend
cd /var/www/lumiku-app/frontend
bun run build

# Upload to CDN/S3 (if using)
aws s3 sync dist/ s3://lumiku-frontend/product-photos/

# Or deploy via Coolify
# Coolify will auto-build and serve via Nginx
```

**Step 4: Start Queue Workers**
```bash
# SSH into server
ssh user@lumiku-server.com

# Navigate to backend
cd /var/www/lumiku-app/backend

# Start worker (using PM2 for auto-restart)
pm2 start src/apps/product-photo-studio/jobs/worker.ts --name product-photo-worker

# Start 5 workers (for concurrency)
pm2 scale product-photo-worker 5

# Save PM2 config
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

**Step 5: Upload Templates**
```bash
# Upload template assets to S3/CDN
aws s3 sync backend/src/apps/product-photo-studio/templates/ s3://lumiku-templates/product-photos/

# Update template URLs in database
bun run scripts/update-template-urls.ts --s3
```

**Step 6: Verify Integrations**
```bash
# Test Background Remover integration
curl -X POST https://api.lumiku.app/api/apps/product-photo-studio/items/TEST_ID/use-background-remover \
  -H "Authorization: Bearer $TOKEN"

# Test Image Upscaler integration
curl -X POST https://api.lumiku.app/api/apps/product-photo-studio/items/TEST_ID/upscale \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with redirect URL
```

**Step 7: Monitor Logs**
```bash
# Backend logs
tail -f /var/www/lumiku-app/backend/logs/app.log

# Queue logs
pm2 logs product-photo-worker

# Nginx access logs
tail -f /var/log/nginx/access.log

# Watch for errors
grep -i error /var/www/lumiku-app/backend/logs/app.log
```

**Step 8: Test End-to-End**
```bash
# Manual testing:
# 1. Visit https://lumiku.app/apps/product-photo-studio
# 2. Create test project
# 3. Upload sample product image
# 4. Apply template
# 5. Verify processing completes (<30s)
# 6. Download result
# 7. Check credit deduction

# Automated smoke test
bun run test:smoke --production
```

### 7.4 Post-Deployment Verification

**10-Point Checklist**:

1. **Health Check** (✅)
   ```bash
   curl https://api.lumiku.app/health
   # Expected: {"status":"ok","app":"product-photo-studio","uptime":123}
   ```

2. **Database Connection** (✅)
   ```bash
   curl https://api.lumiku.app/api/apps/product-photo-studio/projects \
     -H "Authorization: Bearer $TOKEN"
   # Expected: 200 OK with projects array
   ```

3. **File Upload** (✅)
   ```bash
   curl -X POST https://api.lumiku.app/api/apps/product-photo-studio/projects/PROJECT_ID/items/upload \
     -H "Authorization: Bearer $TOKEN" \
     -F "files=@sample-product.jpg"
   # Expected: 200 OK with uploaded item
   ```

4. **Background Removal** (✅)
   ```bash
   # Trigger background removal
   curl -X POST https://api.lumiku.app/api/apps/product-photo-studio/items/ITEM_ID/process \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"workflow":{"background":{"action":"remove"}}}'
   # Expected: 200 OK with job ID
   # Wait 10s, check status
   curl https://api.lumiku.app/api/apps/product-photo-studio/items/ITEM_ID
   # Expected: status="processed", processedFilePath present
   ```

5. **Template Application** (✅)
   ```bash
   # List templates
   curl https://api.lumiku.app/api/apps/product-photo-studio/templates
   # Expected: 50+ templates

   # Apply template
   curl -X POST https://api.lumiku.app/api/apps/product-photo-studio/items/ITEM_ID/apply-template \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"templateId":"TEMPLATE_ID"}'
   # Expected: 200 OK, processing completes in <30s
   ```

6. **Batch Processing** (✅)
   ```bash
   # Start batch
   curl -X POST https://api.lumiku.app/api/apps/product-photo-studio/projects/PROJECT_ID/batch-process \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"itemIds":["ITEM1","ITEM2","ITEM3"],"workflow":{...}}'
   # Expected: 200 OK with generation ID
   # Monitor progress
   curl https://api.lumiku.app/api/apps/product-photo-studio/generations/GEN_ID
   # Expected: progress increases, status="completed" eventually
   ```

7. **ZIP Export** (✅)
   ```bash
   # Start export
   curl -X POST https://api.lumiku.app/api/apps/product-photo-studio/projects/PROJECT_ID/export-zip \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"formats":["png","jpg"]}'
   # Expected: 200 OK with export ID
   # Wait for completion
   curl https://api.lumiku.app/api/apps/product-photo-studio/exports/EXPORT_ID/download \
     -H "Authorization: Bearer $TOKEN" \
     -o test-export.zip
   # Expected: ZIP file downloads successfully
   ```

8. **Credit Deduction** (✅)
   ```bash
   # Check user credits before
   curl https://api.lumiku.app/api/credits \
     -H "Authorization: Bearer $TOKEN"
   # Note credit balance

   # Perform operation (e.g., process image)
   # ...

   # Check credits after
   curl https://api.lumiku.app/api/credits \
     -H "Authorization: Bearer $TOKEN"
   # Expected: Credits decreased by correct amount
   ```

9. **Queue Processing** (✅)
   ```bash
   # Check queue status via Bull Board
   curl https://api.lumiku.app/admin/queues/product-photo-studio
   # Expected: Queue showing active/completed jobs

   # Check PM2 workers
   pm2 list | grep product-photo-worker
   # Expected: 5 workers running
   ```

10. **Error Handling** (✅)
    ```bash
    # Test insufficient credits
    # (set user credits to 0)
    curl -X POST https://api.lumiku.app/api/apps/product-photo-studio/items/ITEM_ID/process \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"workflow":{...}}'
    # Expected: 403 Forbidden, error message

    # Test invalid file
    curl -X POST https://api.lumiku.app/api/apps/product-photo-studio/projects/PROJECT_ID/items/upload \
      -H "Authorization: Bearer $TOKEN" \
      -F "files=@test.txt"
    # Expected: 400 Bad Request, validation error

    # Check error logs
    grep -i error /var/www/lumiku-app/backend/logs/app.log
    # Expected: Errors logged but handled gracefully
    ```

**All checks passing?** ✅ Deployment successful! Product Photo Studio is live.

---

## 8. Monitoring & Analytics

### 8.1 Key Metrics to Track

**User Engagement Metrics**:
- **Photos Processed per Day**: Track daily volume
  - Target: 500+ photos/day by Month 3
- **Active Users per Day**: Daily active users (DAU)
  - Target: 50+ DAU by Month 1, 200+ by Month 3
- **Average Photos per User**: Engagement indicator
  - Target: 10+ photos/user/month
- **Retention Rate**: 30-day user retention
  - Target: 40%+ retention

**Performance Metrics**:
- **Average Processing Time**: Time per image
  - Target: <10 seconds average
  - Alert if >15 seconds
- **Queue Wait Time**: Time waiting in queue
  - Target: <5 seconds
  - Alert if >30 seconds
- **Success Rate**: Processed successfully / total attempts
  - Target: 95%+
  - Alert if <90%
- **Error Rate**: Failed jobs / total jobs
  - Target: <5%
  - Alert if >10%

**Business Metrics**:
- **Credit Consumption**: Credits used per day/week/month
  - Track by feature (BG removal, lighting, etc.)
- **Revenue per User (ARPU)**: Average monthly revenue
  - Target: Rp 50,000-120,000/user/month
- **Conversion Rate**: Free → Paid users
  - Target: 20%+ conversion
- **Churn Rate**: Users who stop using app
  - Target: <10% monthly churn

**Technical Metrics**:
- **API Response Time**: Average endpoint latency
  - Target: <500ms for GET, <2s for POST
- **Database Query Time**: Average query duration
  - Target: <100ms average
- **Storage Usage**: Disk space consumed
  - Track: Original + processed + thumbnails
  - Alert if >80% capacity
- **Queue Length**: Pending jobs in queue
  - Target: <50 jobs pending
  - Alert if >100 jobs (backlog)

### 8.2 Success Metrics

**Month 1 Targets**:
- ✅ 100+ active users
- ✅ 2,000+ photos processed
- ✅ Rp 3,000,000+ revenue (~$200 USD)
- ✅ <5% error rate
- ✅ 4.0+ user rating
- ✅ <10s average processing time
- ✅ 95%+ success rate

**Month 3 Targets**:
- ✅ 500+ active users
- ✅ 15,000+ photos processed
- ✅ Rp 25,000,000+ revenue (~$1,650 USD)
- ✅ 50+ templates available
- ✅ 20%+ cross-app usage (integrations)
- ✅ 4.2+ user rating
- ✅ <8s average processing time

**Month 6 Targets**:
- ✅ 2,000+ active users
- ✅ 80,000+ photos processed
- ✅ Rp 160,000,000+ revenue (~$10,600 USD)
- ✅ 30%+ cross-app usage
- ✅ Mobile-responsive interface launched
- ✅ 40%+ retention rate
- ✅ 4.5+ user rating

**Month 12 Targets**:
- ✅ 5,000+ active users
- ✅ 400,000+ photos processed
- ✅ Rp 600,000,000+ revenue (~$40,000 USD)
- ✅ API for agencies available
- ✅ Direct platform upload (Shopee/Tokopedia)
- ✅ 50%+ retention rate
- ✅ 4.5+ user rating
- ✅ Break-even achieved (profitable)

**Feature Adoption Targets**:
- Background Removal: 90%+ users
- Template Application: 60%+ users
- Batch Processing: 40%+ users
- AI Backgrounds: 30%+ users
- Cross-app Integration: 25%+ users
- ZIP Export: 50%+ users

---

## 9. Future Enhancements

### 9.1 Planned Features

**Q2 2025: Enhanced AI Capabilities**
- **AI Product Descriptions**: Generate SEO-optimized descriptions from product images
  - Use GPT-4 Vision to analyze product
  - Generate title, bullet points, keywords
  - Optimize for Shopee, Tokopedia SEO
- **Smart Cropping**: AI-powered composition and framing
  - Detect product bounds automatically
  - Apply rule of thirds
  - Center and scale optimally
- **Background Inpainting**: Fill transparent areas with AI-generated content
  - Extend backgrounds naturally
  - Remove unwanted objects
  - Fill in missing parts

**Q3 2025: Video & 3D**
- **Video Product Demos**: Animate product photos into videos
  - 360° rotation simulation
  - Zoom-in product reveals
  - Transition animations
  - Export as MP4 for social media
- **3D Product Visualization**: Convert 2D photos to 3D models
  - Use NeRF or Gaussian Splatting
  - Interactive 3D viewer
  - Export as GLTF/GLB
  - AR preview (on mobile)

**Q4 2025: Platform Integrations**
- **Direct Shopee Upload**: Upload processed photos directly to Shopee listings
  - OAuth integration with Shopee API
  - Map photos to SKUs
  - Bulk update listings
- **Direct Tokopedia Upload**: Similar to Shopee
- **Instagram Auto-Post**: Post to Instagram feed/stories via Meta Graph API
- **TikTok Shop Integration**: Upload to TikTok Shop product catalog

**Q1 2026: Enterprise & Agency Features**
- **Team Collaboration**: Shared projects, role-based access
  - Admin, editor, viewer roles
  - Comment and approval workflows
  - Activity logs
- **White-Label**: Custom branding for agencies
  - Custom logo, colors
  - Custom domain (agency.lumiku.app)
  - Resell with markup
- **Bulk Processing API**: Programmatic access for high-volume users
  - REST API with API keys
  - Webhook notifications
  - 1,000+ images per batch

### 9.2 Integration Roadmap

**Phase 1 (Completed): Core Apps**
- ✅ Background Remover (shared infrastructure)
- ✅ Image Upscaler (4x enhancement)
- ✅ Carousel Mix (create carousel posts)

**Phase 2 (V1.5): Cross-App Workflows**
- Avatar Creator: Use avatars as product models
  - Place product in avatar's hands
  - AI compositing for realistic placement
  - Perfect for accessories (bags, watches, jewelry)
- Pose Generator: Product placement on poses
  - Overlay product on generated poses
  - Useful for apparel, accessories
  - Generate lifestyle scenes

**Phase 3 (V2.0): Content Creation Suite**
- Voice Cloner: Product demo videos with voiceover
  - Record product demo script
  - Clone user's voice
  - Generate narrated product videos
  - Export for TikTok, YouTube
- Video Editor (future app): Edit product videos
  - Add music, transitions
  - Insert product photos
  - Generate promotional videos

**Cross-App User Journey Example**:

1. **Avatar Creator**: Generate diverse model avatars (5 different people)
2. **Pose Generator**: Create lifestyle poses (holding, wearing, using product)
3. **Product Photo Studio**: Remove background from product, enhance lighting
4. **AI Compositing**: Place product on avatar's hands (AI alignment)
5. **Carousel Mix**: Create 8-slide carousel (5 avatars + 3 product close-ups)
6. **Voice Cloner**: Record product description voiceover
7. **Video Editor**: Combine into 30-second promotional video
8. **Auto-Post**: Upload to Instagram, TikTok, Facebook

**Result**: Complete marketing campaign from start to finish, all within Lumiku platform.

---

## 10. Appendix

### 10.1 Glossary

**Terms & Definitions**:

- **Background Removal**: AI process to remove background from product photo, creating transparent PNG
- **Background Replacement**: Compositing product onto new background (solid, gradient, template, AI-generated)
- **Batch Processing**: Processing multiple images simultaneously with same workflow configuration
- **BiRefNet**: AI model for background removal (Boundary-Refined Network)
- **Bundled Workflow**: Pre-configured combination of features (BG + lighting + shadow) at discounted price
- **Credits**: Virtual currency for paying AI processing operations (1 credit = Rp 100)
- **Depth Map**: Grayscale image representing distance from camera (used for shadow generation)
- **IC-Light**: AI model for lighting enhancement (Inpaint Controlled Light)
- **Queue**: Asynchronous job processing system (BullMQ) for handling time-intensive operations
- **Shadow Generation**: Creating realistic shadows beneath products based on depth and lighting
- **Template**: Pre-configured workflow with background, lighting, and shadow settings for quick application
- **Variation**: Alternative version of processed photo (different background, lighting, etc.)
- **Workflow**: Complete sequence of processing steps (BG removal → replacement → lighting → shadow)
- **ZIP Export**: Packaging multiple processed images into compressed archive for bulk download

**AI Models**:
- **BiRefNet**: Background removal (Segmind)
- **IC-Light**: Lighting enhancement (FAL.ai)
- **SDXL**: Stable Diffusion XL for AI background generation (Replicate)
- **Depth Anything**: Depth estimation for shadow generation
- **Real-ESRGAN**: Image upscaling (via Image Upscaler app)

**Platform Terms**:
- **PAYG**: Pay-As-You-Go pricing model
- **UMKM**: Usaha Mikro, Kecil, dan Menengah (SME in Indonesian)
- **SKU**: Stock Keeping Unit (product identifier)
- **ARPU**: Average Revenue Per User

### 10.2 Related Documentation

**Internal Documentation**:
- [Technical Specification](C:\Users\yoppi\Downloads\Lumiku App\AI_PRODUCT_PHOTO_STUDIO_TECHNICAL_SPEC.md) - Complete technical specification with code examples
- [API Documentation](https://lumiku.app/docs/api/product-photo-studio) - Interactive API reference (Swagger)
- [User Guide](https://lumiku.app/docs/product-photo-studio) - End-user tutorials and FAQs
- [Background Remover Documentation](https://lumiku.app/docs/background-remover) - Shared infrastructure details
- [Image Upscaler Documentation](https://lumiku.app/docs/image-upscaler) - Integration guide

**External Resources**:
- [Segmind BiRefNet API](https://www.segmind.com/models/birefnet) - Background removal API
- [FAL.ai IC-Light](https://fal.ai/models/ic-light) - Lighting enhancement API
- [Replicate SDXL](https://replicate.com/stability-ai/sdxl) - AI background generation
- [Sharp.js Documentation](https://sharp.pixelplumbing.com/) - Image processing library
- [BullMQ Guide](https://docs.bullmq.io/) - Queue system documentation
- [Prisma Documentation](https://www.prisma.io/docs) - ORM and database

**Platform Documentation**:
- [Lumiku Platform Overview](https://lumiku.app/docs) - General platform documentation
- [Credit System Guide](https://lumiku.app/docs/credits) - How credits work
- [Plugin Development Guide](https://lumiku.app/docs/plugins) - Creating new apps
- [Deployment Guide](https://lumiku.app/docs/deployment) - Coolify deployment instructions

### 10.3 Contact & Support

**Development Team**:
- **Technical Lead**: [TBD]
- **Backend Developer**: [TBD]
- **Frontend Developer**: [TBD]
- **DevOps Engineer**: [TBD]

**Product Management**:
- **Product Manager**: [TBD]
- **Product Designer**: [TBD]

**Support Channels**:
- **Email**: support@lumiku.app
- **Discord**: [Lumiku Community](https://discord.gg/lumiku)
- **Documentation**: https://lumiku.app/docs/product-photo-studio
- **GitHub Issues**: https://github.com/lumiku-app/issues (for bugs)

**Business Inquiries**:
- **Partnerships**: partners@lumiku.app
- **Enterprise Sales**: enterprise@lumiku.app
- **Media**: press@lumiku.app

**Office Hours** (for developers):
- Monday-Friday, 9 AM - 5 PM WIB (GMT+7)
- Response time: <24 hours

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-17
**Next Review**: 2025-11-17

**Changelog**:
- 2025-10-17: Initial documentation created
- [Future updates will be logged here]

---

*This documentation is a living document. Please report any errors or suggest improvements via GitHub issues or email support@lumiku.app.*
