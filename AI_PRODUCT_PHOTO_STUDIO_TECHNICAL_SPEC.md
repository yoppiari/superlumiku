# AI PRODUCT PHOTO STUDIO - COMPLETE TECHNICAL SPECIFICATION

**Version**: 1.0.0
**Status**: Implementation-Ready
**Target Platform**: Lumiku Platform
**Last Updated**: 2025-10-17

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Database Schema (Prisma)](#2-database-schema-prisma)
3. [Plugin Configuration](#3-plugin-configuration)
4. [API Endpoints Specification](#4-api-endpoints-specification)
5. [Service Interfaces](#5-service-interfaces)
6. [Queue Job Specifications](#6-queue-job-specifications)
7. [Credit Pricing Configuration](#7-credit-pricing-configuration)
8. [Integration Patterns](#8-integration-patterns)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Deployment Checklist](#10-deployment-checklist)

---

## 1. OVERVIEW

AI Product Photo Studio is a comprehensive SaaS tool for UMKM (SME) sellers to create professional e-commerce product photos without studio equipment or photography skills.

### Key Features

- **Background Removal & Replacement**: AI-powered background processing with solid colors, gradients, and AI-generated scenes
- **Lighting Enhancement**: Studio-quality lighting adjustments with shadow generation
- **Template Library**: Pre-designed templates for Instagram, Shopee, Tokopedia, TikTok Shop
- **Batch Processing**: Process up to 100 photos simultaneously with workflow automation
- **Export Options**: Multi-platform formats with social media optimizations
- **Cross-App Integration**: Seamless integration with Background Remover, Image Upscaler, Carousel Mix

### Technical Stack

- **Backend**: Hono.js, Bun runtime, Prisma ORM
- **Database**: PostgreSQL
- **AI Services**: Remove.bg/Segmind (background removal), FLUX/Stable Diffusion (background generation), EdenAI (lighting)
- **Image Processing**: Sharp.js for manipulation, FFmpeg for advanced operations
- **Queue**: BullMQ for async processing
- **Storage**: Local filesystem (configurable to S3)

---

## 2. DATABASE SCHEMA (PRISMA)

Add this schema to `backend/prisma/schema.prisma`:

```prisma
// ========================================
// Product Photo Studio App Models
// ========================================

// Main project container for organizing product photos
model ProductPhotoProject {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?

  // Project Settings
  category        String  @default("general") // ecommerce, fashion, food, electronics, beauty
  defaultTemplate String? // Default template ID for batch processing

  // Stats
  totalPhotos     Int @default(0)
  totalProcessed  Int @default(0)
  totalExported   Int @default(0)

  // Status
  status String @default("active") // active, archived, deleted

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  items       ProductPhotoItem[]
  generations ProductPhotoGeneration[]
  exports     ProductPhotoExport[]

  @@index([userId])
  @@index([userId, createdAt(sort: Desc)]) // User's recent projects
  @@index([userId, updatedAt(sort: Desc)]) // Recently modified projects
  @@index([status])
  @@index([category])
  @@map("product_photo_projects")
}

// Individual product photo items
model ProductPhotoItem {
  id        String @id @default(cuid())
  projectId String
  userId    String

  // Original Image
  originalFileName  String
  originalFilePath  String
  originalFileSize  Int // bytes
  originalWidth     Int
  originalHeight    Int
  originalMimeType  String

  // Processed Image (after background removal/replacement)
  processedFilePath String?
  processedFileSize Int?
  processedWidth    Int?
  processedHeight   Int?

  // Background Removed Image (intermediate step)
  bgRemovedFilePath String?

  // Thumbnails
  thumbnailUrl    String?
  previewUrl      String? // Higher quality preview

  // Processing Status
  status        String  @default("uploaded") // uploaded, processing, processed, failed
  processingLog String? @db.Text // JSON log of processing steps
  errorMessage  String? @db.Text

  // Workflow Configuration Applied
  workflowConfig String? @db.Text // JSON: Stores applied workflow settings
  templateId     String? // Reference to ProductPhotoTemplate

  // Metadata
  productName  String?
  productSku   String?
  productTags  String[] // For search/filtering
  notes        String?   @db.Text

  // User Actions
  isFavorite    Boolean @default(false)
  downloadCount Int     @default(0)

  // Order (for UI sorting)
  displayOrder Int @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  project    ProductPhotoProject     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  variations ProductPhotoVariation[]

  @@index([projectId])
  @@index([userId])
  @@index([projectId, displayOrder]) // Ordered items in project
  @@index([status])
  @@index([isFavorite])
  @@index([templateId])
  @@index([productTags], type: Gin) // Full-text search on tags
  @@map("product_photo_items")
}

// Variations of processed photos (different backgrounds, lighting, etc)
model ProductPhotoVariation {
  id     String @id @default(cuid())
  itemId String
  userId String

  // Variation Image
  fileName     String
  filePath     String
  fileSize     Int
  width        Int
  height       Int
  thumbnailUrl String?

  // Variation Type
  variationType String // background, lighting, shadow, template

  // Configuration
  variationConfig String @db.Text // JSON: Specific settings for this variation

  // Metadata
  variationName String? // User-friendly name
  isSelected    Boolean @default(false) // User selected this as final

  // User Actions
  downloadCount Int @default(0)

  createdAt DateTime @default(now())

  // Relations
  item ProductPhotoItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([itemId])
  @@index([userId])
  @@index([variationType])
  @@index([isSelected])
  @@map("product_photo_variations")
}

// Async generation jobs (batch processing, AI background generation)
model ProductPhotoGeneration {
  id        String @id @default(cuid())
  projectId String
  userId    String

  // Generation Type
  generationType String // batch_process, ai_background, template_apply, lighting_enhance

  // Input Items
  itemIds      String[] // Array of item IDs to process
  totalItems   Int

  // Workflow Configuration
  workflowConfig String @db.Text // JSON: Complete workflow settings
  templateId     String? // Reference to ProductPhotoTemplate if used

  // Status Tracking
  status           String @default("pending") // pending, processing, completed, failed, partial
  progress         Int    @default(0) // 0-100
  itemsCompleted   Int    @default(0)
  itemsFailed      Int    @default(0)

  // Credit Tracking
  creditCharged  Int
  creditRefunded Int @default(0)

  // Queue Management
  queueJobId String? // BullMQ job ID

  // Results
  outputPaths    String? @db.Text // JSON array of generated file paths
  errorMessage   String? @db.Text
  processingLog  String? @db.Text // JSON: Detailed processing log

  // Timestamps
  createdAt   DateTime  @default(now())
  startedAt   DateTime?
  completedAt DateTime?

  // Performance Metrics
  avgProcessingTime   Float? // Seconds per item
  totalProcessingTime Float? // Total seconds

  // Relations
  project ProductPhotoProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([userId])
  @@index([status])
  @@index([status, createdAt]) // Process pending jobs in order
  @@index([userId, createdAt(sort: Desc)]) // User's recent generations
  @@index([queueJobId])
  @@map("product_photo_generations")
}

// Template library for quick styling
model ProductPhotoTemplate {
  id   String @id @default(cuid())
  name String

  // Template Info
  description    String? @db.Text
  category       String // ecommerce, fashion, food, electronics, beauty
  subcategory    String? // instagram_post, shopee_listing, tokopedia_banner
  previewImageUrl String
  thumbnailUrl   String?

  // Template Configuration
  // This is the complete workflow config that will be applied
  templateConfig String @db.Text // JSON: Background, lighting, shadow, export settings

  // Platform Optimization
  platform         String? // instagram, shopee, tokopedia, tiktok, lazada
  aspectRatio      String  @default("1:1") // 1:1, 4:5, 9:16, 16:9
  recommendedWidth Int     @default(1080)
  recommendedHeight Int    @default(1080)

  // Access Control
  isPublic    Boolean @default(true)
  isFeatured  Boolean @default(false)
  isPremium   Boolean @default(false)
  minTier     String? // Minimum subscription tier required

  // Creator
  createdBy String  @default("system") // system, userId for user templates
  sourceType String @default("curated") // curated, user_contributed

  // Stats
  usageCount      Int   @default(0)
  favoriteCount   Int   @default(0)
  ratingAvg       Float @default(0.0)
  popularityScore Int   @default(0) // Computed: usageCount + favoriteCount

  // Display
  displayOrder Int     @default(0)
  tags         String[] // Search tags

  // Status
  isActive Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
  @@index([category, subcategory])
  @@index([platform])
  @@index([isPublic, isActive])
  @@index([isFeatured, usageCount(sort: Desc)])
  @@index([popularityScore(sort: Desc)])
  @@index([tags], type: Gin)
  @@map("product_photo_templates")
}

// Export jobs (ZIP downloads, multi-format exports)
model ProductPhotoExport {
  id        String @id @default(cuid())
  projectId String
  userId    String

  // Export Configuration
  exportType   String // zip_all, zip_selected, multi_format
  itemIds      String[] // Items to export
  totalItems   Int

  // Format Configuration
  formats      String[] // original, jpeg, png, webp
  resolutions  String[] // 1080x1080, 1200x1200, 2400x2400
  platforms    String[] // instagram, shopee, tokopedia, tiktok

  // Output
  zipFilePath String?
  zipFileSize Int?

  // Status
  status       String  @default("pending") // pending, processing, completed, failed
  progress     Int     @default(0) // 0-100
  errorMessage String? @db.Text

  // Queue
  queueJobId String? // BullMQ job ID

  // Credit Tracking
  creditCharged Int @default(0)

  // Expiry (ZIP files are temporary)
  expiresAt DateTime? // Auto-delete after 7 days

  // Timestamps
  createdAt   DateTime  @default(now())
  completedAt DateTime?

  // Relations
  project ProductPhotoProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([userId])
  @@index([status])
  @@index([expiresAt]) // Cleanup expired exports
  @@index([userId, createdAt(sort: Desc)])
  @@map("product_photo_exports")
}

// Usage tracking for analytics and integration
model ProductPhotoUsage {
  id     String @id @default(cuid())
  userId String

  // Action Type
  action     String // upload, process, export, integrate
  actionType String // single, batch

  // Reference
  referenceId   String?
  referenceType String? // project, item, generation, export

  // Metadata
  metadata String? @db.Text // JSON: Action-specific data

  // Credit Used
  creditUsed Int @default(0)

  // Integration (if action involves another app)
  integratedWith String? // background-remover, image-upscaler, carousel-mix

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([userId, createdAt(sort: Desc)])
  @@index([integratedWith])
  @@index([referenceId, referenceType])
  @@map("product_photo_usages")
}
```

### Schema Design Rationale

**Indexes Strategy**:
- **Foreign Keys**: All userId, projectId indexed for fast joins
- **Status Fields**: Indexed for queue processing and filtering
- **Timestamps**: Descending order for "recent items" queries
- **Full-Text Search**: Gin indexes on array fields (tags)
- **Composite Indexes**: Common query patterns like `[userId, createdAt(sort: Desc)]`

**Cascade Deletion**:
- Project deletion → Cascade to items, generations, exports
- Item deletion → Cascade to variations
- Prevents orphaned data

**JSON Fields**:
- `workflowConfig`: Stores complete workflow settings (background, lighting, shadow)
- `processingLog`: Debugging and audit trail
- `templateConfig`: Template blueprint for reusability

**Performance Considerations**:
- Separate `ProductPhotoVariation` table to avoid bloating main items table
- `displayOrder` for efficient sorting without ORDER BY expensive columns
- `popularityScore` pre-computed field for faster sorting

---

## 3. PLUGIN CONFIGURATION

**File**: `backend/src/apps/product-photo-studio/plugin.config.ts`

```typescript
import { PluginConfig } from '../../plugins/types'

/**
 * Product Photo Studio Plugin Configuration
 *
 * AI-powered product photography tool for UMKM sellers.
 * Creates professional e-commerce photos without studio equipment.
 *
 * CREDIT SYSTEM:
 * - Background removal: 5 credits (uses Background Remover integration)
 * - Background replacement (solid): 10 credits
 * - Background replacement (AI): 15-25 credits (depends on complexity)
 * - Lighting enhancement: 8 credits
 * - Shadow generation: 8 credits
 * - Template application: 15 credits (includes all enhancements)
 * - Batch processing: Dynamic pricing with bulk discount
 * - Export (ZIP): 5 credits base + 1 credit per 10 images
 *
 * INTEGRATION:
 * - Background Remover: For background removal
 * - Image Upscaler: For upscaling processed images
 * - Carousel Mix: For creating carousel posts from product photos
 */
export const productPhotoStudioConfig: PluginConfig = {
  // Identity
  appId: 'product-photo-studio',
  name: 'Product Photo Studio',
  description: 'Create professional product photos with AI - remove backgrounds, enhance lighting, apply templates',
  icon: 'camera',
  version: '1.0.0',

  // Routing
  routePrefix: '/api/apps/product-photo-studio',

  // Credits Configuration
  // Pricing reflects computational cost and value delivered
  credits: {
    // Project Management (Free)
    createProject: 0,
    deleteProject: 0,

    // Upload (Storage + Processing)
    uploadPhoto: 2, // Per photo: Storage + thumbnail generation

    // Background Processing
    removeBackground: 5, // Uses Background Remover API
    replaceBackgroundSolid: 10, // Solid color/gradient compositing
    replaceBackgroundTemplate: 12, // Template-based background
    replaceBackgroundAISimple: 15, // AI-generated simple background
    replaceBackgroundAIComplex: 25, // AI-generated complex scene

    // Lighting Enhancement
    lightingEnhance: 8, // Studio lighting simulation
    autoLighting: 8, // Auto-detect and fix lighting

    // Shadow Generation
    shadowGenerate: 8, // Realistic shadow generation
    shadowCustom: 10, // Custom shadow with advanced controls

    // Template Application (Bundled Workflow)
    applyTemplate: 15, // Includes background + lighting + shadow

    // Batch Processing
    batchProcessBase: 10, // Base cost for batch job
    batchProcessPerItem: 5, // Per item in batch (discounted from single)

    // Variations
    generateVariation: 5, // Generate alternative version

    // Export
    exportSingle: 0, // Single download is free
    exportZip: 5, // Base cost for ZIP generation
    exportMultiFormat: 10, // Export in multiple formats
    exportMultiPlatform: 15, // Export optimized for multiple platforms

    // Integration
    sendToUpscaler: 0, // Integration is free (upscaler charges separately)
    sendToCarousel: 0, // Integration is free (carousel mix charges separately)
  },

  // Access Control
  access: {
    requiresAuth: true,
    requiresSubscription: false, // PAYG model available
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },

  // Features
  features: {
    enabled: true,
    beta: false, // Production-ready
    comingSoon: false,
  },

  // Dashboard
  dashboard: {
    order: 4, // After Avatar Creator, Pose Generator, Background Remover
    color: 'emerald', // Green theme for product/commerce
    stats: {
      enabled: true,
      endpoint: '/api/apps/product-photo-studio/stats',
    },
  },
}

export default productPhotoStudioConfig
```

---

## 4. API ENDPOINTS SPECIFICATION

### 4.1 Project Management

#### `POST /api/apps/product-photo-studio/projects`

Create new product photo project.

**Request**:
```typescript
interface CreateProjectRequest {
  name: string
  description?: string
  category?: string // ecommerce, fashion, food, electronics, beauty
  defaultTemplate?: string // Template ID
}
```

**Response**:
```typescript
interface CreateProjectResponse {
  id: string
  userId: string
  name: string
  description: string | null
  category: string
  totalPhotos: number
  createdAt: string
}
```

**Errors**: 400, 401, 500
**Auth**: Required
**Credits**: 0 (free)

**Example**:
```bash
curl -X POST https://lumiku.app/api/apps/product-photo-studio/projects \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Shopee Product Lineup",
    "category": "ecommerce"
  }'
```

---

#### `GET /api/apps/product-photo-studio/projects`

List all projects for authenticated user.

**Query Parameters**:
```typescript
interface ListProjectsQuery {
  status?: string // active, archived, deleted
  category?: string
  limit?: number // Default: 50, Max: 100
  offset?: number // For pagination
  sortBy?: string // createdAt, updatedAt, name
  sortOrder?: 'asc' | 'desc' // Default: desc
}
```

**Response**:
```typescript
interface ListProjectsResponse {
  projects: Array<{
    id: string
    name: string
    description: string | null
    category: string
    totalPhotos: number
    totalProcessed: number
    status: string
    createdAt: string
    updatedAt: string
  }>
  total: number
  limit: number
  offset: number
}
```

**Errors**: 401, 500
**Auth**: Required
**Credits**: 0

---

#### `GET /api/apps/product-photo-studio/projects/:id`

Get project details with items.

**Response**:
```typescript
interface GetProjectResponse {
  id: string
  userId: string
  name: string
  description: string | null
  category: string
  defaultTemplate: string | null
  totalPhotos: number
  totalProcessed: number
  totalExported: number
  status: string
  createdAt: string
  updatedAt: string
  items: Array<{
    id: string
    originalFileName: string
    thumbnailUrl: string
    status: string
    isFavorite: boolean
    createdAt: string
  }>
}
```

**Errors**: 401, 404, 500
**Auth**: Required
**Credits**: 0

---

#### `PUT /api/apps/product-photo-studio/projects/:id`

Update project details.

**Request**:
```typescript
interface UpdateProjectRequest {
  name?: string
  description?: string
  category?: string
  defaultTemplate?: string
  status?: string // active, archived
}
```

**Response**:
```typescript
interface UpdateProjectResponse {
  id: string
  name: string
  description: string | null
  category: string
  updatedAt: string
}
```

**Errors**: 400, 401, 404, 500
**Auth**: Required
**Credits**: 0

---

#### `DELETE /api/apps/product-photo-studio/projects/:id`

Delete project and all associated items.

**Response**:
```typescript
interface DeleteProjectResponse {
  success: boolean
  deletedItems: number
  message: string
}
```

**Errors**: 401, 404, 500
**Auth**: Required
**Credits**: 0

---

### 4.2 File Upload

#### `POST /api/apps/product-photo-studio/projects/:projectId/items/upload`

Upload product photos to project.

**Request**: `multipart/form-data`
```typescript
interface UploadItemsRequest {
  files: File[] // Max 50 files per request
  productName?: string
  productSku?: string
  productTags?: string[] // JSON array
  notes?: string
}
```

**Response**:
```typescript
interface UploadItemsResponse {
  uploadedItems: Array<{
    id: string
    projectId: string
    originalFileName: string
    originalFilePath: string
    originalFileSize: number
    originalWidth: number
    originalHeight: number
    thumbnailUrl: string
    status: string // uploaded
    createdAt: string
  }>
  totalUploaded: number
  totalFailed: number
  creditUsed: number // 2 credits per uploaded item
  errors?: Array<{
    fileName: string
    error: string
  }>
}
```

**File Validation**:
- **Max file size**: 20MB per file
- **Allowed types**: image/jpeg, image/png, image/webp
- **Min dimensions**: 500x500px
- **Max dimensions**: 8000x8000px
- **Max batch**: 50 files per upload

**Errors**: 400 (invalid file), 401, 403 (insufficient credits), 404, 413 (file too large), 500
**Auth**: Required
**Credits**: 2 per uploaded file

**Example**:
```bash
curl -X POST https://lumiku.app/api/apps/product-photo-studio/projects/PROJECT_ID/items/upload \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "files=@product1.jpg" \
  -F "files=@product2.jpg" \
  -F "productName=Coffee Mug Set" \
  -F "productTags=[\"coffee\",\"mug\",\"ceramic\"]"
```

---

#### `DELETE /api/apps/product-photo-studio/items/:id`

Delete photo item.

**Response**:
```typescript
interface DeleteItemResponse {
  success: boolean
  message: string
  storageFreed: number // Bytes freed
}
```

**Errors**: 401, 404, 500
**Auth**: Required
**Credits**: 0

---

### 4.3 Processing

#### `POST /api/apps/product-photo-studio/items/:id/process`

Process single photo with workflow.

**Request**:
```typescript
interface ProcessItemRequest {
  workflow: {
    // Background
    background?: {
      action: 'remove' | 'replace'
      replaceWith?: {
        type: 'solid' | 'gradient' | 'template' | 'ai'
        color?: string // #FFFFFF or gradient:linear-#FF0000-#0000FF
        templateId?: string
        aiPrompt?: string // For AI-generated background
        complexity?: 'simple' | 'complex' // For AI backgrounds
      }
    }

    // Lighting
    lighting?: {
      enhance: boolean
      preset?: 'studio' | 'natural' | 'dramatic' | 'soft'
      brightness?: number // -100 to 100
      contrast?: number // -100 to 100
      warmth?: number // -100 to 100 (color temperature)
    }

    // Shadow
    shadow?: {
      generate: boolean
      type?: 'natural' | 'drop' | 'reflection'
      opacity?: number // 0 to 100
      blur?: number // 0 to 100
      angle?: number // 0 to 360
      distance?: number // 0 to 100
    }

    // Export Settings
    export?: {
      format?: 'jpeg' | 'png' | 'webp'
      quality?: number // 1 to 100
      width?: number
      height?: number
      aspectRatio?: string // 1:1, 4:5, 9:16, 16:9
    }
  }

  // Save as variation or overwrite
  saveAsVariation?: boolean
  variationName?: string
}
```

**Response**:
```typescript
interface ProcessItemResponse {
  id: string
  itemId: string
  status: string // processing, completed
  processedFilePath?: string // If completed synchronously
  thumbnailUrl?: string
  variationId?: string // If saved as variation
  creditUsed: number
  processingTime?: number // Seconds
  queueJobId?: string // If async processing
}
```

**Credit Calculation**:
```typescript
let cost = 0

if (workflow.background?.action === 'remove') {
  cost += 5 // removeBackground
}

if (workflow.background?.replaceWith) {
  if (workflow.background.replaceWith.type === 'solid') {
    cost += 10 // replaceBackgroundSolid
  } else if (workflow.background.replaceWith.type === 'template') {
    cost += 12 // replaceBackgroundTemplate
  } else if (workflow.background.replaceWith.type === 'ai') {
    cost += workflow.background.replaceWith.complexity === 'complex' ? 25 : 15
  }
}

if (workflow.lighting?.enhance) {
  cost += 8 // lightingEnhance
}

if (workflow.shadow?.generate) {
  cost += workflow.shadow.type === 'natural' ? 8 : 10
}

// Total cost
return cost
```

**Errors**: 400, 401, 403 (insufficient credits), 404, 500
**Auth**: Required
**Credits**: Dynamic (5-51 credits depending on workflow)

---

#### `POST /api/apps/product-photo-studio/projects/:projectId/batch-process`

Process multiple photos with same workflow.

**Request**:
```typescript
interface BatchProcessRequest {
  itemIds: string[] // Max 100 items
  workflow: WorkflowConfig // Same as single process
  saveAsVariations?: boolean
}
```

**Response**:
```typescript
interface BatchProcessResponse {
  generationId: string
  projectId: string
  totalItems: number
  status: string // pending (async processing)
  creditCharged: number
  queueJobId: string
  estimatedTime: number // Seconds
  createdAt: string
}
```

**Credit Calculation**:
```typescript
const singleItemCost = calculateWorkflowCost(workflow)
const baseJobCost = 10 // batchProcessBase

// Bulk discount: 5 credits per item instead of full cost
const bulkItemCost = 5 // batchProcessPerItem

const totalCost = baseJobCost + (itemIds.length * bulkItemCost)

return totalCost
```

**Errors**: 400, 401, 403 (insufficient credits), 404, 500
**Auth**: Required
**Credits**: 10 + (5 × number of items)

**Example**:
```bash
curl -X POST https://lumiku.app/api/apps/product-photo-studio/projects/PROJECT_ID/batch-process \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "itemIds": ["item1", "item2", "item3"],
    "workflow": {
      "background": {
        "action": "replace",
        "replaceWith": {
          "type": "solid",
          "color": "#FFFFFF"
        }
      },
      "shadow": {
        "generate": true,
        "type": "natural"
      }
    }
  }'
```

---

#### `GET /api/apps/product-photo-studio/generations/:id`

Get generation status and results.

**Response**:
```typescript
interface GetGenerationResponse {
  id: string
  projectId: string
  userId: string
  generationType: string
  totalItems: number
  status: string
  progress: number // 0-100
  itemsCompleted: number
  itemsFailed: number
  creditCharged: number
  outputPaths?: string[] // Array of processed file paths
  errorMessage?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  avgProcessingTime?: number
  totalProcessingTime?: number
}
```

**Errors**: 401, 404, 500
**Auth**: Required
**Credits**: 0

---

### 4.4 Templates

#### `GET /api/apps/product-photo-studio/templates`

List available templates.

**Query Parameters**:
```typescript
interface ListTemplatesQuery {
  category?: string
  subcategory?: string
  platform?: string
  featured?: boolean
  limit?: number
  offset?: number
}
```

**Response**:
```typescript
interface ListTemplatesResponse {
  templates: Array<{
    id: string
    name: string
    description: string
    category: string
    subcategory: string | null
    previewImageUrl: string
    thumbnailUrl: string
    platform: string | null
    aspectRatio: string
    isFeatured: boolean
    isPremium: boolean
    usageCount: number
    ratingAvg: number
    tags: string[]
  }>
  total: number
  limit: number
  offset: number
}
```

**Errors**: 401, 500
**Auth**: Required
**Credits**: 0

---

#### `GET /api/apps/product-photo-studio/templates/:id`

Get template details and configuration.

**Response**:
```typescript
interface GetTemplateResponse {
  id: string
  name: string
  description: string
  category: string
  subcategory: string | null
  previewImageUrl: string
  thumbnailUrl: string
  templateConfig: {
    background: BackgroundConfig
    lighting: LightingConfig
    shadow: ShadowConfig
    export: ExportConfig
  }
  platform: string | null
  aspectRatio: string
  recommendedWidth: number
  recommendedHeight: number
  isPublic: boolean
  isFeatured: boolean
  isPremium: boolean
  usageCount: number
  tags: string[]
}
```

**Errors**: 401, 404, 500
**Auth**: Required
**Credits**: 0

---

#### `POST /api/apps/product-photo-studio/items/:id/apply-template`

Apply template to item.

**Request**:
```typescript
interface ApplyTemplateRequest {
  templateId: string
  saveAsVariation?: boolean
  variationName?: string
}
```

**Response**:
```typescript
interface ApplyTemplateResponse {
  id: string
  itemId: string
  status: string // processing, completed
  templateId: string
  processedFilePath?: string
  variationId?: string
  creditUsed: number // 15 credits
  queueJobId?: string
}
```

**Errors**: 400, 401, 403 (insufficient credits), 404, 500
**Auth**: Required
**Credits**: 15

---

### 4.5 Export

#### `GET /api/apps/product-photo-studio/items/:id/download`

Download single processed photo.

**Query Parameters**:
```typescript
interface DownloadItemQuery {
  format?: 'original' | 'processed'
  variationId?: string // Download specific variation
}
```

**Response**: Binary file (image/jpeg, image/png, image/webp)

**Errors**: 401, 404, 500
**Auth**: Required
**Credits**: 0 (free)

---

#### `POST /api/apps/product-photo-studio/projects/:projectId/export-zip`

Export multiple photos as ZIP.

**Request**:
```typescript
interface ExportZipRequest {
  itemIds?: string[] // Specific items, or all if not provided
  formats?: string[] // jpeg, png, webp
  resolutions?: Array<{
    width: number
    height: number
    suffix?: string // e.g., "_1080x1080"
  }>
  platforms?: string[] // instagram, shopee, tokopedia, tiktok
  includeOriginals?: boolean
  includeVariations?: boolean
}
```

**Response**:
```typescript
interface ExportZipResponse {
  exportId: string
  projectId: string
  totalItems: number
  status: string // pending, processing
  creditCharged: number
  queueJobId: string
  estimatedTime: number // Seconds
  expiresAt: string // 7 days from completion
  createdAt: string
}
```

**Credit Calculation**:
```typescript
const baseExportCost = 5 // exportZip
const itemCount = itemIds?.length || project.totalPhotos

// Additional costs
let additionalCost = 0
if (formats && formats.length > 1) {
  additionalCost += 5 // exportMultiFormat
}
if (platforms && platforms.length > 1) {
  additionalCost += 10 // exportMultiPlatform
}

const totalCost = baseExportCost + additionalCost
return totalCost
```

**Errors**: 400, 401, 403 (insufficient credits), 404, 500
**Auth**: Required
**Credits**: 5-20 (depending on options)

---

#### `GET /api/apps/product-photo-studio/exports/:id`

Get export status.

**Response**:
```typescript
interface GetExportResponse {
  id: string
  projectId: string
  exportType: string
  totalItems: number
  status: string
  progress: number // 0-100
  zipFilePath?: string
  zipFileSize?: number
  downloadUrl?: string // Pre-signed URL for download
  expiresAt?: string
  createdAt: string
  completedAt?: string
}
```

**Errors**: 401, 404, 500
**Auth**: Required
**Credits**: 0

---

#### `GET /api/apps/product-photo-studio/exports/:id/download`

Download ZIP export.

**Response**: Binary file (application/zip)

**Errors**: 401, 404, 410 (expired), 500
**Auth**: Required
**Credits**: 0

---

### 4.6 Integration

#### `POST /api/apps/product-photo-studio/items/:id/upscale`

Send item to Image Upscaler app.

**Request**:
```typescript
interface SendToUpscalerRequest {
  variationId?: string // Upscale specific variation
  upscaleFactor?: number // 2, 4, 8
  quality?: string // standard, high, ultra
}
```

**Response**:
```typescript
interface SendToUpscalerResponse {
  success: boolean
  upscalerJobId: string
  message: string
  redirectUrl: string // URL to Image Upscaler app to view result
}
```

**Errors**: 400, 401, 404, 500
**Auth**: Required
**Credits**: 0 (Image Upscaler charges separately)

---

#### `POST /api/apps/product-photo-studio/projects/:projectId/create-carousel`

Create carousel from project photos.

**Request**:
```typescript
interface CreateCarouselRequest {
  itemIds: string[] // Photos to include in carousel
  carouselName: string
  texts?: string[] // Texts for carousel slides
}
```

**Response**:
```typescript
interface CreateCarouselResponse {
  success: boolean
  carouselProjectId: string
  message: string
  redirectUrl: string // URL to Carousel Mix app
}
```

**Errors**: 400, 401, 404, 500
**Auth**: Required
**Credits**: 0 (Carousel Mix charges separately)

---

### 4.7 Stats & Analytics

#### `GET /api/apps/product-photo-studio/stats`

Get user's usage statistics.

**Response**:
```typescript
interface GetStatsResponse {
  totalProjects: number
  totalPhotos: number
  totalProcessed: number
  totalExported: number
  totalCreditsUsed: number

  // Recent Activity
  recentProjects: Array<{
    id: string
    name: string
    totalPhotos: number
    updatedAt: string
  }>

  // Popular Templates
  popularTemplates: Array<{
    id: string
    name: string
    usageCount: number
  }>

  // Credit Breakdown
  creditBreakdown: {
    backgroundRemoval: number
    backgroundReplacement: number
    lighting: number
    shadow: number
    templates: number
    export: number
  }
}
```

**Errors**: 401, 500
**Auth**: Required
**Credits**: 0

---

## 5. SERVICE INTERFACES

### 5.1 ProductPhotoService

**File**: `backend/src/apps/product-photo-studio/services/product-photo.service.ts`

```typescript
import { ProductPhotoProject, ProductPhotoItem, ProductPhotoGeneration } from '@prisma/client'

export interface CreateProjectData {
  name: string
  description?: string
  category?: string
  defaultTemplate?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
  category?: string
  defaultTemplate?: string
  status?: string
}

export interface UploadItemData {
  file: File
  projectId: string
  productName?: string
  productSku?: string
  productTags?: string[]
  notes?: string
}

export interface WorkflowConfig {
  background?: BackgroundConfig
  lighting?: LightingConfig
  shadow?: ShadowConfig
  export?: ExportConfig
}

export interface BackgroundConfig {
  action: 'remove' | 'replace'
  replaceWith?: {
    type: 'solid' | 'gradient' | 'template' | 'ai'
    color?: string
    templateId?: string
    aiPrompt?: string
    complexity?: 'simple' | 'complex'
  }
}

export interface LightingConfig {
  enhance: boolean
  preset?: 'studio' | 'natural' | 'dramatic' | 'soft'
  brightness?: number
  contrast?: number
  warmth?: number
}

export interface ShadowConfig {
  generate: boolean
  type?: 'natural' | 'drop' | 'reflection'
  opacity?: number
  blur?: number
  angle?: number
  distance?: number
}

export interface ExportConfig {
  format?: 'jpeg' | 'png' | 'webp'
  quality?: number
  width?: number
  height?: number
  aspectRatio?: string
}

export interface ProcessItemData {
  itemId: string
  workflow: WorkflowConfig
  saveAsVariation?: boolean
  variationName?: string
}

export interface BatchProcessData {
  projectId: string
  itemIds: string[]
  workflow: WorkflowConfig
  saveAsVariations?: boolean
}

export interface ProductPhotoService {
  // Project Management
  createProject(userId: string, data: CreateProjectData): Promise<ProductPhotoProject>
  getProject(userId: string, projectId: string): Promise<ProductPhotoProject | null>
  listProjects(userId: string, options?: ListOptions): Promise<{ projects: ProductPhotoProject[], total: number }>
  updateProject(userId: string, projectId: string, data: UpdateProjectData): Promise<ProductPhotoProject>
  deleteProject(userId: string, projectId: string): Promise<{ success: boolean, deletedItems: number }>

  // Item Management
  uploadItem(userId: string, data: UploadItemData): Promise<ProductPhotoItem>
  uploadItems(userId: string, files: UploadItemData[]): Promise<{ items: ProductPhotoItem[], errors: any[] }>
  getItem(userId: string, itemId: string): Promise<ProductPhotoItem | null>
  deleteItem(userId: string, itemId: string): Promise<{ success: boolean, storageFreed: number }>

  // Processing
  processItem(userId: string, data: ProcessItemData): Promise<ProcessResult>
  batchProcess(userId: string, data: BatchProcessData): Promise<ProductPhotoGeneration>
  getGenerationStatus(userId: string, generationId: string): Promise<ProductPhotoGeneration>

  // Templates
  listTemplates(options?: ListTemplatesOptions): Promise<{ templates: any[], total: number }>
  getTemplate(templateId: string): Promise<any>
  applyTemplate(userId: string, itemId: string, templateId: string, options?: ApplyOptions): Promise<ProcessResult>

  // Export
  exportZip(userId: string, projectId: string, options: ExportOptions): Promise<any>
  getExportStatus(userId: string, exportId: string): Promise<any>

  // Stats
  getUserStats(userId: string): Promise<StatsResponse>
}

export interface ListOptions {
  status?: string
  category?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ListTemplatesOptions {
  category?: string
  subcategory?: string
  platform?: string
  featured?: boolean
  limit?: number
  offset?: number
}

export interface ApplyOptions {
  saveAsVariation?: boolean
  variationName?: string
}

export interface ExportOptions {
  itemIds?: string[]
  formats?: string[]
  resolutions?: Array<{ width: number, height: number, suffix?: string }>
  platforms?: string[]
  includeOriginals?: boolean
  includeVariations?: boolean
}

export interface ProcessResult {
  id: string
  itemId: string
  status: 'processing' | 'completed' | 'failed'
  processedFilePath?: string
  thumbnailUrl?: string
  variationId?: string
  creditUsed: number
  processingTime?: number
  queueJobId?: string
  errorMessage?: string
}

export interface StatsResponse {
  totalProjects: number
  totalPhotos: number
  totalProcessed: number
  totalExported: number
  totalCreditsUsed: number
  recentProjects: any[]
  popularTemplates: any[]
  creditBreakdown: {
    backgroundRemoval: number
    backgroundReplacement: number
    lighting: number
    shadow: number
    templates: number
    export: number
  }
}
```

---

### 5.2 BackgroundService

**File**: `backend/src/apps/product-photo-studio/services/background.service.ts`

```typescript
export interface RemoveBackgroundOptions {
  inputPath: string
  outputPath: string
  format?: 'png' | 'webp'
  quality?: number
}

export interface ReplaceBackgroundOptions {
  inputPath: string // Background-removed image
  outputPath: string
  background: {
    type: 'solid' | 'gradient' | 'template' | 'ai'
    color?: string
    templateId?: string
    aiPrompt?: string
    complexity?: 'simple' | 'complex'
  }
  width?: number
  height?: number
}

export interface BackgroundService {
  /**
   * Remove background from image
   * Uses Background Remover integration or fallback to Segmind/Remove.bg
   */
  removeBackground(options: RemoveBackgroundOptions): Promise<{
    outputPath: string
    fileSize: number
    width: number
    height: number
    processingTime: number
  }>

  /**
   * Replace background with solid color or gradient
   */
  replaceBackgroundSolid(options: ReplaceBackgroundOptions): Promise<{
    outputPath: string
    fileSize: number
    processingTime: number
  }>

  /**
   * Replace background using template
   */
  replaceBackgroundTemplate(options: ReplaceBackgroundOptions): Promise<{
    outputPath: string
    fileSize: number
    processingTime: number
  }>

  /**
   * Generate AI background and replace
   */
  replaceBackgroundAI(options: ReplaceBackgroundOptions): Promise<{
    outputPath: string
    fileSize: number
    processingTime: number
    aiModel: string
  }>

  /**
   * Composite foreground onto background
   */
  compositeImages(foregroundPath: string, backgroundPath: string, outputPath: string): Promise<void>
}
```

---

### 5.3 LightingService

**File**: `backend/src/apps/product-photo-studio/services/lighting.service.ts`

```typescript
export interface EnhanceLightingOptions {
  inputPath: string
  outputPath: string
  preset?: 'studio' | 'natural' | 'dramatic' | 'soft'
  brightness?: number // -100 to 100
  contrast?: number // -100 to 100
  warmth?: number // -100 to 100 (color temperature)
  autoEnhance?: boolean
}

export interface LightingService {
  /**
   * Enhance lighting with preset
   */
  enhanceLighting(options: EnhanceLightingOptions): Promise<{
    outputPath: string
    fileSize: number
    processingTime: number
    adjustments: {
      brightness: number
      contrast: number
      warmth: number
    }
  }>

  /**
   * Auto-detect and fix lighting issues
   */
  autoEnhanceLighting(inputPath: string, outputPath: string): Promise<{
    outputPath: string
    fileSize: number
    processingTime: number
    detectedIssues: string[]
    adjustments: any
  }>

  /**
   * Apply studio lighting preset
   */
  applyStudioLighting(inputPath: string, outputPath: string): Promise<void>

  /**
   * Adjust color temperature (warmth)
   */
  adjustColorTemperature(inputPath: string, outputPath: string, warmth: number): Promise<void>
}
```

---

### 5.4 ShadowService

**File**: `backend/src/apps/product-photo-studio/services/shadow.service.ts`

```typescript
export interface GenerateShadowOptions {
  inputPath: string // Subject image (background removed)
  outputPath: string
  type: 'natural' | 'drop' | 'reflection'
  opacity?: number // 0 to 100
  blur?: number // 0 to 100
  angle?: number // 0 to 360
  distance?: number // 0 to 100
  color?: string // Default: #000000
}

export interface ShadowService {
  /**
   * Generate realistic shadow for product
   */
  generateShadow(options: GenerateShadowOptions): Promise<{
    outputPath: string
    fileSize: number
    processingTime: number
    shadowType: string
  }>

  /**
   * Generate natural floor shadow
   */
  generateNaturalShadow(inputPath: string, outputPath: string, options?: Partial<GenerateShadowOptions>): Promise<void>

  /**
   * Generate drop shadow (elevated object)
   */
  generateDropShadow(inputPath: string, outputPath: string, options?: Partial<GenerateShadowOptions>): Promise<void>

  /**
   * Generate reflection shadow (mirror effect)
   */
  generateReflectionShadow(inputPath: string, outputPath: string, options?: Partial<GenerateShadowOptions>): Promise<void>

  /**
   * Detect subject bounds for shadow placement
   */
  detectSubjectBounds(inputPath: string): Promise<{
    x: number
    y: number
    width: number
    height: number
  }>
}
```

---

### 5.5 TemplateService

**File**: `backend/src/apps/product-photo-studio/services/template.service.ts`

```typescript
export interface TemplateService {
  /**
   * Get template by ID
   */
  getTemplate(templateId: string): Promise<any>

  /**
   * List templates with filters
   */
  listTemplates(options?: ListTemplatesOptions): Promise<{ templates: any[], total: number }>

  /**
   * Apply template workflow to item
   */
  applyTemplate(itemPath: string, templateId: string, outputPath: string): Promise<{
    outputPath: string
    fileSize: number
    processingTime: number
    workflowApplied: WorkflowConfig
  }>

  /**
   * Create custom template (admin/premium users)
   */
  createTemplate(data: CreateTemplateData): Promise<any>

  /**
   * Update template
   */
  updateTemplate(templateId: string, data: UpdateTemplateData): Promise<any>

  /**
   * Increment template usage counter
   */
  incrementUsage(templateId: string): Promise<void>
}

export interface CreateTemplateData {
  name: string
  description?: string
  category: string
  subcategory?: string
  previewImageUrl: string
  templateConfig: WorkflowConfig
  platform?: string
  aspectRatio?: string
  tags?: string[]
  isPremium?: boolean
}

export interface UpdateTemplateData {
  name?: string
  description?: string
  templateConfig?: WorkflowConfig
  tags?: string[]
}
```

---

### 5.6 ExportService

**File**: `backend/src/apps/product-photo-studio/services/export.service.ts`

```typescript
export interface ExportService {
  /**
   * Export single item as file
   */
  exportSingle(itemId: string, options?: ExportSingleOptions): Promise<{
    filePath: string
    fileSize: number
    format: string
  }>

  /**
   * Export multiple items as ZIP
   */
  exportZip(projectId: string, options: ExportZipOptions): Promise<{
    exportId: string
    zipPath?: string
    queueJobId?: string
    status: string
  }>

  /**
   * Export with multiple formats
   */
  exportMultiFormat(itemPath: string, formats: string[], outputDir: string): Promise<{
    outputs: Array<{
      format: string
      path: string
      size: number
    }>
  }>

  /**
   * Export optimized for platform
   */
  exportForPlatform(itemPath: string, platform: string, outputPath: string): Promise<{
    outputPath: string
    width: number
    height: number
    format: string
    fileSize: number
  }>

  /**
   * Generate download URL (pre-signed)
   */
  generateDownloadUrl(exportId: string, expiresIn?: number): Promise<string>

  /**
   * Cleanup expired exports
   */
  cleanupExpiredExports(): Promise<number>
}

export interface ExportSingleOptions {
  format?: 'jpeg' | 'png' | 'webp'
  quality?: number
  width?: number
  height?: number
}

export interface ExportZipOptions {
  itemIds?: string[]
  formats?: string[]
  resolutions?: Array<{ width: number, height: number, suffix?: string }>
  platforms?: string[]
  includeOriginals?: boolean
  includeVariations?: boolean
}
```

---

## 6. QUEUE JOB SPECIFICATIONS

### 6.1 Job Types

**File**: `backend/src/apps/product-photo-studio/jobs/types.ts`

```typescript
export enum ProductPhotoJobType {
  BG_REMOVAL = 'bg_removal',
  BG_REPLACEMENT = 'bg_replacement',
  LIGHTING_ENHANCE = 'lighting_enhance',
  SHADOW_GENERATE = 'shadow_generate',
  TEMPLATE_APPLY = 'template_apply',
  BATCH_PROCESS = 'batch_process',
  EXPORT_ZIP = 'export_zip',
  CLEANUP_TEMP = 'cleanup_temp',
}

export interface BaseJobData {
  userId: string
  projectId?: string
  itemId?: string
  generationId?: string
  exportId?: string
}

export interface BgRemovalJobData extends BaseJobData {
  inputPath: string
  outputPath: string
  format?: 'png' | 'webp'
  quality?: number
}

export interface BgReplacementJobData extends BaseJobData {
  inputPath: string
  outputPath: string
  background: {
    type: 'solid' | 'gradient' | 'template' | 'ai'
    color?: string
    templateId?: string
    aiPrompt?: string
    complexity?: 'simple' | 'complex'
  }
}

export interface LightingEnhanceJobData extends BaseJobData {
  inputPath: string
  outputPath: string
  preset?: 'studio' | 'natural' | 'dramatic' | 'soft'
  brightness?: number
  contrast?: number
  warmth?: number
}

export interface ShadowGenerateJobData extends BaseJobData {
  inputPath: string
  outputPath: string
  type: 'natural' | 'drop' | 'reflection'
  opacity?: number
  blur?: number
  angle?: number
  distance?: number
}

export interface TemplateApplyJobData extends BaseJobData {
  inputPath: string
  outputPath: string
  templateId: string
}

export interface BatchProcessJobData extends BaseJobData {
  itemIds: string[]
  workflow: WorkflowConfig
  saveAsVariations?: boolean
}

export interface ExportZipJobData extends BaseJobData {
  itemIds: string[]
  formats?: string[]
  resolutions?: Array<{ width: number, height: number, suffix?: string }>
  platforms?: string[]
  includeOriginals?: boolean
  includeVariations?: boolean
  outputPath: string
}

export interface CleanupTempJobData {
  olderThan: Date // Delete files older than this
  directory: string
}
```

---

### 6.2 Worker Implementation

**File**: `backend/src/apps/product-photo-studio/jobs/worker.ts`

```typescript
import { Worker, Job, Queue } from 'bullmq'
import { productPhotoStudioConfig } from '../plugin.config'
import { BackgroundService } from '../services/background.service'
import { LightingService } from '../services/lighting.service'
import { ShadowService } from '../services/shadow.service'
import { TemplateService } from '../services/template.service'
import { ExportService } from '../services/export.service'
import prisma from '../../../db/client'
import { ProductPhotoJobType } from './types'

// Queue configuration
export const productPhotoQueue = new Queue('product-photo-studio', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
})

// Worker configuration
export const productPhotoWorker = new Worker(
  'product-photo-studio',
  async (job: Job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`)

    try {
      switch (job.name) {
        case ProductPhotoJobType.BG_REMOVAL:
          return await processBgRemoval(job)

        case ProductPhotoJobType.BG_REPLACEMENT:
          return await processBgReplacement(job)

        case ProductPhotoJobType.LIGHTING_ENHANCE:
          return await processLightingEnhance(job)

        case ProductPhotoJobType.SHADOW_GENERATE:
          return await processShadowGenerate(job)

        case ProductPhotoJobType.TEMPLATE_APPLY:
          return await processTemplateApply(job)

        case ProductPhotoJobType.BATCH_PROCESS:
          return await processBatchProcess(job)

        case ProductPhotoJobType.EXPORT_ZIP:
          return await processExportZip(job)

        case ProductPhotoJobType.CLEANUP_TEMP:
          return await processCleanupTemp(job)

        default:
          throw new Error(`Unknown job type: ${job.name}`)
      }
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error)
      throw error
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    concurrency: 5, // Process 5 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // per 60 seconds
    },
  }
)

// Job processors
async function processBgRemoval(job: Job) {
  const data = job.data as BgRemovalJobData
  const backgroundService = new BackgroundService()

  await job.updateProgress(0)

  const result = await backgroundService.removeBackground({
    inputPath: data.inputPath,
    outputPath: data.outputPath,
    format: data.format,
    quality: data.quality,
  })

  await job.updateProgress(100)

  // Update item status in database
  if (data.itemId) {
    await prisma.productPhotoItem.update({
      where: { id: data.itemId },
      data: {
        bgRemovedFilePath: result.outputPath,
        status: 'processed',
      },
    })
  }

  return result
}

async function processBgReplacement(job: Job) {
  const data = job.data as BgReplacementJobData
  const backgroundService = new BackgroundService()

  await job.updateProgress(0)

  let result

  if (data.background.type === 'solid' || data.background.type === 'gradient') {
    result = await backgroundService.replaceBackgroundSolid({
      inputPath: data.inputPath,
      outputPath: data.outputPath,
      background: data.background,
    })
    await job.updateProgress(100)
  } else if (data.background.type === 'template') {
    result = await backgroundService.replaceBackgroundTemplate({
      inputPath: data.inputPath,
      outputPath: data.outputPath,
      background: data.background,
    })
    await job.updateProgress(100)
  } else if (data.background.type === 'ai') {
    await job.updateProgress(25)
    result = await backgroundService.replaceBackgroundAI({
      inputPath: data.inputPath,
      outputPath: data.outputPath,
      background: data.background,
    })
    await job.updateProgress(100)
  }

  // Update item
  if (data.itemId) {
    await prisma.productPhotoItem.update({
      where: { id: data.itemId },
      data: {
        processedFilePath: result.outputPath,
        processedFileSize: result.fileSize,
        status: 'processed',
      },
    })
  }

  return result
}

async function processLightingEnhance(job: Job) {
  const data = job.data as LightingEnhanceJobData
  const lightingService = new LightingService()

  await job.updateProgress(0)

  const result = await lightingService.enhanceLighting({
    inputPath: data.inputPath,
    outputPath: data.outputPath,
    preset: data.preset,
    brightness: data.brightness,
    contrast: data.contrast,
    warmth: data.warmth,
  })

  await job.updateProgress(100)

  return result
}

async function processShadowGenerate(job: Job) {
  const data = job.data as ShadowGenerateJobData
  const shadowService = new ShadowService()

  await job.updateProgress(0)

  const result = await shadowService.generateShadow({
    inputPath: data.inputPath,
    outputPath: data.outputPath,
    type: data.type,
    opacity: data.opacity,
    blur: data.blur,
    angle: data.angle,
    distance: data.distance,
  })

  await job.updateProgress(100)

  return result
}

async function processTemplateApply(job: Job) {
  const data = job.data as TemplateApplyJobData
  const templateService = new TemplateService()

  await job.updateProgress(0)

  const result = await templateService.applyTemplate(
    data.inputPath,
    data.templateId,
    data.outputPath
  )

  await job.updateProgress(100)

  // Update item
  if (data.itemId) {
    await prisma.productPhotoItem.update({
      where: { id: data.itemId },
      data: {
        processedFilePath: result.outputPath,
        processedFileSize: result.fileSize,
        templateId: data.templateId,
        workflowConfig: JSON.stringify(result.workflowApplied),
        status: 'processed',
      },
    })
  }

  return result
}

async function processBatchProcess(job: Job) {
  const data = job.data as BatchProcessJobData

  await job.updateProgress(0)

  const totalItems = data.itemIds.length
  let completedItems = 0
  let failedItems = 0

  // Update generation status
  if (data.generationId) {
    await prisma.productPhotoGeneration.update({
      where: { id: data.generationId },
      data: {
        status: 'processing',
        startedAt: new Date(),
      },
    })
  }

  const startTime = Date.now()

  // Process each item
  for (const itemId of data.itemIds) {
    try {
      const item = await prisma.productPhotoItem.findUnique({
        where: { id: itemId },
      })

      if (!item) {
        failedItems++
        continue
      }

      // Execute workflow on item
      await executeWorkflow(item.originalFilePath, data.workflow, itemId)

      completedItems++

      // Update progress
      const progress = Math.floor((completedItems / totalItems) * 100)
      await job.updateProgress(progress)

      if (data.generationId) {
        await prisma.productPhotoGeneration.update({
          where: { id: data.generationId },
          data: {
            progress,
            itemsCompleted: completedItems,
            itemsFailed: failedItems,
          },
        })
      }
    } catch (error) {
      console.error(`Failed to process item ${itemId}:`, error)
      failedItems++
    }
  }

  const endTime = Date.now()
  const totalTime = (endTime - startTime) / 1000 // seconds
  const avgTime = totalTime / totalItems

  // Update generation to completed
  if (data.generationId) {
    await prisma.productPhotoGeneration.update({
      where: { id: data.generationId },
      data: {
        status: completedItems === totalItems ? 'completed' : 'partial',
        progress: 100,
        itemsCompleted: completedItems,
        itemsFailed: failedItems,
        completedAt: new Date(),
        avgProcessingTime: avgTime,
        totalProcessingTime: totalTime,
      },
    })
  }

  return {
    totalItems,
    completedItems,
    failedItems,
    avgProcessingTime: avgTime,
    totalProcessingTime: totalTime,
  }
}

async function processExportZip(job: Job) {
  const data = job.data as ExportZipJobData
  const exportService = new ExportService()

  await job.updateProgress(0)

  // Update export status
  if (data.exportId) {
    await prisma.productPhotoExport.update({
      where: { id: data.exportId },
      data: {
        status: 'processing',
      },
    })
  }

  // Collect all files to export
  const filesToExport: string[] = []

  for (const itemId of data.itemIds) {
    const item = await prisma.productPhotoItem.findUnique({
      where: { id: itemId },
      include: { variations: true },
    })

    if (!item) continue

    // Add original if requested
    if (data.includeOriginals) {
      filesToExport.push(item.originalFilePath)
    }

    // Add processed
    if (item.processedFilePath) {
      filesToExport.push(item.processedFilePath)
    }

    // Add variations if requested
    if (data.includeVariations && item.variations) {
      for (const variation of item.variations) {
        filesToExport.push(variation.filePath)
      }
    }
  }

  await job.updateProgress(50)

  // Create ZIP
  const zipResult = await createZipArchive(filesToExport, data.outputPath)

  await job.updateProgress(100)

  // Update export
  if (data.exportId) {
    await prisma.productPhotoExport.update({
      where: { id: data.exportId },
      data: {
        status: 'completed',
        zipFilePath: zipResult.path,
        zipFileSize: zipResult.size,
        progress: 100,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })
  }

  return zipResult
}

async function processCleanupTemp(job: Job) {
  const data = job.data as CleanupTempJobData
  // Implementation for cleaning up temporary files
  // Delete exports older than 7 days, temp processing files, etc.
  return { deleted: 0 }
}

// Helper: Execute workflow on item
async function executeWorkflow(inputPath: string, workflow: WorkflowConfig, itemId: string) {
  let currentPath = inputPath

  // Step 1: Background removal
  if (workflow.background?.action === 'remove') {
    const bgService = new BackgroundService()
    const bgResult = await bgService.removeBackground({
      inputPath: currentPath,
      outputPath: currentPath.replace(/\.(jpg|jpeg|png)$/, '_nobg.png'),
    })
    currentPath = bgResult.outputPath
  }

  // Step 2: Background replacement
  if (workflow.background?.replaceWith) {
    const bgService = new BackgroundService()
    const replaceResult = await bgService.replaceBackgroundSolid({
      inputPath: currentPath,
      outputPath: currentPath.replace(/\.png$/, '_bg.png'),
      background: workflow.background.replaceWith,
    })
    currentPath = replaceResult.outputPath
  }

  // Step 3: Lighting enhancement
  if (workflow.lighting?.enhance) {
    const lightingService = new LightingService()
    const lightResult = await lightingService.enhanceLighting({
      inputPath: currentPath,
      outputPath: currentPath.replace(/\.png$/, '_lit.png'),
      ...workflow.lighting,
    })
    currentPath = lightResult.outputPath
  }

  // Step 4: Shadow generation
  if (workflow.shadow?.generate) {
    const shadowService = new ShadowService()
    const shadowResult = await shadowService.generateShadow({
      inputPath: currentPath,
      outputPath: currentPath.replace(/\.png$/, '_shadow.png'),
      type: workflow.shadow.type || 'natural',
      ...workflow.shadow,
    })
    currentPath = shadowResult.outputPath
  }

  // Update item with final result
  await prisma.productPhotoItem.update({
    where: { id: itemId },
    data: {
      processedFilePath: currentPath,
      workflowConfig: JSON.stringify(workflow),
      status: 'processed',
    },
  })

  return currentPath
}

// Helper: Create ZIP archive
async function createZipArchive(files: string[], outputPath: string) {
  // Implementation using archiver or similar
  // Return { path, size }
  return { path: outputPath, size: 0 }
}

// Worker event handlers
productPhotoWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`)
})

productPhotoWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err)
})

productPhotoWorker.on('progress', (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`)
})
```

---

## 7. CREDIT PRICING CONFIGURATION

**File**: `backend/src/apps/product-photo-studio/config/pricing.ts`

```typescript
import { WorkflowConfig } from '../services/product-photo.service'

/**
 * Credit Pricing Configuration for Product Photo Studio
 *
 * PRICING PHILOSOPHY:
 * - Fair pricing based on computational cost
 * - Bulk discounts for batch processing
 * - Bundle discounts for workflow combinations
 * - Integration costs covered by target apps
 */

export const PRODUCT_PHOTO_CREDITS = {
  // Project Management (Free)
  project: {
    create: 0,
    delete: 0,
    update: 0,
  },

  // Upload
  upload: {
    perPhoto: 2, // Storage + thumbnail generation + metadata extraction
  },

  // Background Processing
  background: {
    remove: 5, // Background Remover API integration
    replaceSolid: 10, // Solid color/gradient compositing
    replaceTemplate: 12, // Template-based background
    replaceAISimple: 15, // AI-generated simple background (FLUX simple prompt)
    replaceAIComplex: 25, // AI-generated complex scene (FLUX detailed prompt)
  },

  // Lighting Enhancement
  lighting: {
    enhance: 8, // Studio lighting simulation
    auto: 8, // Auto-detect and fix lighting
    custom: 10, // Custom advanced lighting controls
  },

  // Shadow Generation
  shadow: {
    natural: 8, // Natural floor shadow
    drop: 10, // Drop shadow (elevated object)
    reflection: 10, // Reflection shadow (mirror effect)
    custom: 12, // Custom shadow with advanced controls
  },

  // Template Application
  template: {
    apply: 15, // Bundled workflow (background + lighting + shadow)
    premium: 20, // Premium templates with advanced effects
  },

  // Batch Processing
  batch: {
    baseJob: 10, // Base cost for batch job setup
    perItem: 5, // Discounted per-item cost (vs 15+ for single workflow)
    discount: 0.5, // 50% discount on bulk (10+ items)
  },

  // Variations
  variation: {
    generate: 5, // Generate alternative version
  },

  // Export
  export: {
    single: 0, // Single download is free
    zipBase: 5, // Base cost for ZIP generation
    multiFormat: 10, // Export in multiple formats (JPEG, PNG, WebP)
    multiPlatform: 15, // Export optimized for multiple platforms
    perPlatform: 3, // Additional cost per platform beyond first
  },

  // Integration (Free - target app charges separately)
  integration: {
    upscaler: 0,
    carousel: 0,
  },
}

/**
 * Calculate credit cost for workflow
 */
export function calculateWorkflowCost(workflow: WorkflowConfig): number {
  let cost = 0

  // Background processing
  if (workflow.background) {
    if (workflow.background.action === 'remove') {
      cost += PRODUCT_PHOTO_CREDITS.background.remove
    }

    if (workflow.background.replaceWith) {
      const replaceType = workflow.background.replaceWith.type

      switch (replaceType) {
        case 'solid':
          cost += PRODUCT_PHOTO_CREDITS.background.replaceSolid
          break
        case 'gradient':
          cost += PRODUCT_PHOTO_CREDITS.background.replaceSolid
          break
        case 'template':
          cost += PRODUCT_PHOTO_CREDITS.background.replaceTemplate
          break
        case 'ai':
          const complexity = workflow.background.replaceWith.complexity || 'simple'
          cost += complexity === 'complex'
            ? PRODUCT_PHOTO_CREDITS.background.replaceAIComplex
            : PRODUCT_PHOTO_CREDITS.background.replaceAISimple
          break
      }
    }
  }

  // Lighting enhancement
  if (workflow.lighting?.enhance) {
    cost += PRODUCT_PHOTO_CREDITS.lighting.enhance
  }

  // Shadow generation
  if (workflow.shadow?.generate) {
    const shadowType = workflow.shadow.type || 'natural'

    switch (shadowType) {
      case 'natural':
        cost += PRODUCT_PHOTO_CREDITS.shadow.natural
        break
      case 'drop':
        cost += PRODUCT_PHOTO_CREDITS.shadow.drop
        break
      case 'reflection':
        cost += PRODUCT_PHOTO_CREDITS.shadow.reflection
        break
      default:
        cost += PRODUCT_PHOTO_CREDITS.shadow.custom
    }
  }

  return cost
}

/**
 * Calculate credit cost for batch processing
 */
export function calculateBatchCost(itemCount: number, workflow: WorkflowConfig): number {
  const baseJobCost = PRODUCT_PHOTO_CREDITS.batch.baseJob
  const perItemCost = PRODUCT_PHOTO_CREDITS.batch.perItem

  // Apply bulk discount for 10+ items
  const discount = itemCount >= 10 ? PRODUCT_PHOTO_CREDITS.batch.discount : 0

  const itemsCost = itemCount * perItemCost * (1 - discount)

  return Math.ceil(baseJobCost + itemsCost)
}

/**
 * Calculate credit cost for template application
 */
export function calculateTemplateCost(templateId: string, isPremium: boolean = false): number {
  return isPremium
    ? PRODUCT_PHOTO_CREDITS.template.premium
    : PRODUCT_PHOTO_CREDITS.template.apply
}

/**
 * Calculate credit cost for export
 */
export function calculateExportCost(options: {
  formats?: string[]
  platforms?: string[]
  multiFormat?: boolean
  multiPlatform?: boolean
}): number {
  let cost = PRODUCT_PHOTO_CREDITS.export.zipBase

  // Multiple formats
  if (options.multiFormat || (options.formats && options.formats.length > 1)) {
    cost += PRODUCT_PHOTO_CREDITS.export.multiFormat
  }

  // Multiple platforms
  if (options.multiPlatform || (options.platforms && options.platforms.length > 1)) {
    cost += PRODUCT_PHOTO_CREDITS.export.multiPlatform

    // Additional cost per extra platform
    const extraPlatforms = Math.max(0, (options.platforms?.length || 1) - 1)
    cost += extraPlatforms * PRODUCT_PHOTO_CREDITS.export.perPlatform
  }

  return cost
}

/**
 * Bundle discount calculator
 * If user applies full workflow (background + lighting + shadow), give discount
 */
export function calculateBundleDiscount(workflow: WorkflowConfig): number {
  const hasBackground = workflow.background?.action === 'remove' || workflow.background?.replaceWith
  const hasLighting = workflow.lighting?.enhance === true
  const hasShadow = workflow.shadow?.generate === true

  // Full bundle: 10% discount
  if (hasBackground && hasLighting && hasShadow) {
    const fullCost = calculateWorkflowCost(workflow)
    const discount = Math.floor(fullCost * 0.1)
    return discount
  }

  // Partial bundle: 5% discount
  if ((hasBackground && hasLighting) || (hasBackground && hasShadow) || (hasLighting && hasShadow)) {
    const fullCost = calculateWorkflowCost(workflow)
    const discount = Math.floor(fullCost * 0.05)
    return discount
  }

  return 0
}

/**
 * Final cost with discounts applied
 */
export function calculateFinalCost(workflow: WorkflowConfig, isBatch: boolean = false, itemCount: number = 1): number {
  if (isBatch) {
    return calculateBatchCost(itemCount, workflow)
  }

  const baseCost = calculateWorkflowCost(workflow)
  const discount = calculateBundleDiscount(workflow)

  return Math.max(1, baseCost - discount) // Minimum 1 credit
}

/**
 * Credit cost summary for transparency
 */
export interface CreditCostSummary {
  breakdown: {
    background: number
    lighting: number
    shadow: number
    export: number
  }
  subtotal: number
  discount: number
  bundleDiscount: string // Human-readable: "10% Full Bundle Discount"
  total: number
}

export function generateCostSummary(workflow: WorkflowConfig, itemCount: number = 1): CreditCostSummary {
  const breakdown = {
    background: 0,
    lighting: 0,
    shadow: 0,
    export: 0,
  }

  // Calculate breakdown
  if (workflow.background) {
    if (workflow.background.action === 'remove') {
      breakdown.background += PRODUCT_PHOTO_CREDITS.background.remove
    }
    if (workflow.background.replaceWith) {
      const replaceType = workflow.background.replaceWith.type
      if (replaceType === 'solid' || replaceType === 'gradient') {
        breakdown.background += PRODUCT_PHOTO_CREDITS.background.replaceSolid
      } else if (replaceType === 'template') {
        breakdown.background += PRODUCT_PHOTO_CREDITS.background.replaceTemplate
      } else if (replaceType === 'ai') {
        breakdown.background += workflow.background.replaceWith.complexity === 'complex'
          ? PRODUCT_PHOTO_CREDITS.background.replaceAIComplex
          : PRODUCT_PHOTO_CREDITS.background.replaceAISimple
      }
    }
  }

  if (workflow.lighting?.enhance) {
    breakdown.lighting += PRODUCT_PHOTO_CREDITS.lighting.enhance
  }

  if (workflow.shadow?.generate) {
    breakdown.shadow += PRODUCT_PHOTO_CREDITS.shadow[workflow.shadow.type || 'natural']
  }

  const subtotal = Object.values(breakdown).reduce((sum, val) => sum + val, 0)
  const discount = calculateBundleDiscount(workflow)

  let bundleDiscountLabel = 'No discount'
  if (discount > 0) {
    const percentage = Math.round((discount / subtotal) * 100)
    bundleDiscountLabel = `${percentage}% Bundle Discount`
  }

  const total = Math.max(1, subtotal - discount)

  return {
    breakdown,
    subtotal,
    discount,
    bundleDiscount: bundleDiscountLabel,
    total: total * itemCount,
  }
}
```

---

## 8. INTEGRATION PATTERNS

### 8.1 Background Remover Integration

Product Photo Studio integrates with Background Remover for high-quality background removal.

**Integration Flow**:

```typescript
// File: backend/src/apps/product-photo-studio/integrations/background-remover.integration.ts

import axios from 'axios'

export interface BackgroundRemoverIntegration {
  /**
   * Remove background using Background Remover app
   */
  async removeBackground(itemPath: string, outputPath: string): Promise<{
    success: boolean
    outputPath: string
    apiCost: number
  }>
}

export class BackgroundRemoverIntegrationService implements BackgroundRemoverIntegration {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.BACKGROUND_REMOVER_API_URL || 'http://localhost:3000'
  }

  async removeBackground(itemPath: string, outputPath: string) {
    try {
      // Call Background Remover API
      const token = await this.getServiceToken()

      const formData = new FormData()
      formData.append('image', fs.createReadStream(itemPath))
      formData.append('mode', 'standard') // standard, professional

      const response = await axios.post(
        `${this.baseUrl}/api/apps/background-remover/process`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      // Download result
      const resultUrl = response.data.outputUrl
      await this.downloadFile(resultUrl, outputPath)

      return {
        success: true,
        outputPath,
        apiCost: 5, // Background removal cost
      }
    } catch (error) {
      console.error('Background Remover integration error:', error)
      throw new Error('Failed to remove background via Background Remover')
    }
  }

  private async getServiceToken(): Promise<string> {
    // Get service-to-service authentication token
    // Implementation depends on auth strategy
    return process.env.SERVICE_TOKEN || ''
  }

  private async downloadFile(url: string, outputPath: string): Promise<void> {
    const response = await axios.get(url, { responseType: 'stream' })
    const writer = fs.createWriteStream(outputPath)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  }
}
```

**Usage in Background Service**:

```typescript
// In BackgroundService.removeBackground()
const integration = new BackgroundRemoverIntegrationService()
const result = await integration.removeBackground(inputPath, outputPath)
```

---

### 8.2 Image Upscaler Integration

Send processed photos to Image Upscaler for quality enhancement.

**Integration Flow**:

```typescript
// File: backend/src/apps/product-photo-studio/integrations/image-upscaler.integration.ts

export interface ImageUpscalerIntegration {
  /**
   * Send item to Image Upscaler app
   */
  async sendToUpscaler(
    userId: string,
    itemId: string,
    options: {
      upscaleFactor?: number
      quality?: string
    }
  ): Promise<{
    success: boolean
    upscalerJobId: string
    redirectUrl: string
  }>
}

export class ImageUpscalerIntegrationService implements ImageUpscalerIntegration {
  async sendToUpscaler(userId: string, itemId: string, options: any) {
    try {
      // Get item
      const item = await prisma.productPhotoItem.findUnique({
        where: { id: itemId },
      })

      if (!item) {
        throw new Error('Item not found')
      }

      // Create upscaler job via API
      const token = await this.getServiceToken()

      const response = await axios.post(
        `${process.env.IMAGE_UPSCALER_API_URL}/api/apps/image-upscaler/jobs`,
        {
          sourceApp: 'product-photo-studio',
          sourceItemId: itemId,
          imagePath: item.processedFilePath || item.originalFilePath,
          upscaleFactor: options.upscaleFactor || 2,
          quality: options.quality || 'standard',
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      const upscalerJobId = response.data.id

      // Track integration in usage
      await prisma.productPhotoUsage.create({
        data: {
          userId,
          action: 'integrate',
          actionType: 'single',
          referenceId: itemId,
          referenceType: 'item',
          integratedWith: 'image-upscaler',
          metadata: JSON.stringify({
            upscalerJobId,
            upscaleFactor: options.upscaleFactor,
          }),
        },
      })

      return {
        success: true,
        upscalerJobId,
        redirectUrl: `${process.env.FRONTEND_URL}/apps/image-upscaler/jobs/${upscalerJobId}`,
      }
    } catch (error) {
      console.error('Image Upscaler integration error:', error)
      throw new Error('Failed to send to Image Upscaler')
    }
  }

  private async getServiceToken(): Promise<string> {
    return process.env.SERVICE_TOKEN || ''
  }
}
```

---

### 8.3 Carousel Mix Integration

Create carousel posts from product photos.

**Integration Flow**:

```typescript
// File: backend/src/apps/product-photo-studio/integrations/carousel-mix.integration.ts

export interface CarouselMixIntegration {
  /**
   * Create carousel project from product photos
   */
  async createCarousel(
    userId: string,
    projectId: string,
    options: {
      itemIds: string[]
      carouselName: string
      texts?: string[]
    }
  ): Promise<{
    success: boolean
    carouselProjectId: string
    redirectUrl: string
  }>
}

export class CarouselMixIntegrationService implements CarouselMixIntegration {
  async createCarousel(userId: string, projectId: string, options: any) {
    try {
      // Get items
      const items = await prisma.productPhotoItem.findMany({
        where: {
          id: { in: options.itemIds },
          projectId,
          userId,
        },
      })

      if (items.length === 0) {
        throw new Error('No items found')
      }

      // Create carousel project via API
      const token = await this.getServiceToken()

      // Step 1: Create carousel project
      const projectResponse = await axios.post(
        `${process.env.CAROUSEL_MIX_API_URL}/api/apps/carousel-mix/projects`,
        {
          name: options.carouselName,
          defaultNumSlides: items.length,
        },
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      )

      const carouselProjectId = projectResponse.data.id

      // Step 2: Upload slides
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const slidePosition = i + 1

        const formData = new FormData()
        formData.append('file', fs.createReadStream(item.processedFilePath || item.originalFilePath))
        formData.append('slidePosition', slidePosition.toString())

        await axios.post(
          `${process.env.CAROUSEL_MIX_API_URL}/api/apps/carousel-mix/projects/${carouselProjectId}/slides`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        )
      }

      // Step 3: Add texts if provided
      if (options.texts && options.texts.length > 0) {
        for (let i = 0; i < options.texts.length; i++) {
          const text = options.texts[i]
          const slidePosition = i + 1

          await axios.post(
            `${process.env.CAROUSEL_MIX_API_URL}/api/apps/carousel-mix/projects/${carouselProjectId}/texts`,
            {
              slidePosition,
              content: text,
            },
            {
              headers: { 'Authorization': `Bearer ${token}` },
            }
          )
        }
      }

      // Track integration
      await prisma.productPhotoUsage.create({
        data: {
          userId,
          action: 'integrate',
          actionType: 'batch',
          referenceId: projectId,
          referenceType: 'project',
          integratedWith: 'carousel-mix',
          metadata: JSON.stringify({
            carouselProjectId,
            itemIds: options.itemIds,
          }),
        },
      })

      return {
        success: true,
        carouselProjectId,
        redirectUrl: `${process.env.FRONTEND_URL}/apps/carousel-mix/projects/${carouselProjectId}`,
      }
    } catch (error) {
      console.error('Carousel Mix integration error:', error)
      throw new Error('Failed to create carousel')
    }
  }

  private async getServiceToken(): Promise<string> {
    return process.env.SERVICE_TOKEN || ''
  }
}
```

---

### 8.4 Avatar Creator Integration (Future)

Allow using avatars as models in product photos (e.g., model wearing clothes).

**Future Integration Pattern**:

```typescript
// File: backend/src/apps/product-photo-studio/integrations/avatar-creator.integration.ts

export interface AvatarCreatorIntegration {
  /**
   * List user's avatars
   */
  async listAvatars(userId: string): Promise<Avatar[]>

  /**
   * Use avatar as model in product photo
   * Composite avatar with product (e.g., avatar wearing clothes)
   */
  async compositeAvatarWithProduct(
    avatarId: string,
    productItemId: string,
    options: {
      pose?: string
      scene?: string
    }
  ): Promise<{
    outputPath: string
  }>
}
```

---

## 9. FRONTEND ARCHITECTURE

### 9.1 Component Structure

**Two-View Pattern**:

1. **Projects List View**: Show all user's projects
2. **Project Detail View**: Show items in project + processing UI

**Component Tree**:

```
ProductPhotoStudio/
├── index.tsx                     // Main container
├── components/
│   ├── ProjectsList.tsx          // View 1: Projects grid
│   ├── ProjectDetail.tsx         // View 2: Project workspace
│   ├── UploadZone.tsx            // Drag-drop upload
│   ├── ItemGrid.tsx              // Photo grid with actions
│   ├── ItemCard.tsx              // Single photo card
│   ├── WorkflowPanel.tsx         // Workflow configuration UI
│   ├── BackgroundSelector.tsx   // Background options
│   ├── LightingControls.tsx     // Lighting sliders
│   ├── ShadowControls.tsx       // Shadow configuration
│   ├── TemplateGallery.tsx      // Template browser
│   ├── BatchProcessModal.tsx    // Batch processing UI
│   ├── ExportModal.tsx          // Export options
│   └── ProcessingStatus.tsx     // Real-time processing status
├── store/
│   └── productPhotoStore.ts     // Zustand state management
└── types/
    └── index.ts                  // TypeScript interfaces
```

---

### 9.2 Zustand Store

**File**: `frontend/src/apps/product-photo-studio/store/productPhotoStore.ts`

```typescript
import create from 'zustand'
import axios from 'axios'

interface ProductPhotoProject {
  id: string
  name: string
  description: string | null
  category: string
  totalPhotos: number
  totalProcessed: number
  status: string
  createdAt: string
  updatedAt: string
}

interface ProductPhotoItem {
  id: string
  projectId: string
  originalFileName: string
  originalFilePath: string
  thumbnailUrl: string
  processedFilePath: string | null
  status: string
  isFavorite: boolean
  createdAt: string
}

interface ProductPhotoStore {
  // State
  projects: ProductPhotoProject[]
  currentProject: ProductPhotoProject | null
  currentProjectItems: ProductPhotoItem[]
  templates: any[]
  isLoading: boolean
  error: string | null

  // View state
  currentView: 'projects' | 'project-detail'
  selectedItems: string[]

  // Actions: Projects
  loadProjects: () => Promise<void>
  createProject: (data: CreateProjectData) => Promise<ProductPhotoProject>
  selectProject: (id: string) => Promise<void>
  updateProject: (id: string, data: UpdateProjectData) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  backToProjects: () => void

  // Actions: Items
  uploadItems: (projectId: string, files: File[]) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  toggleFavorite: (itemId: string) => Promise<void>
  selectItem: (itemId: string) => void
  selectMultipleItems: (itemIds: string[]) => void
  clearSelection: () => void

  // Actions: Processing
  processItem: (itemId: string, workflow: WorkflowConfig) => Promise<void>
  batchProcess: (itemIds: string[], workflow: WorkflowConfig) => Promise<void>
  applyTemplate: (itemId: string, templateId: string) => Promise<void>

  // Actions: Templates
  loadTemplates: () => Promise<void>

  // Actions: Export
  exportZip: (projectId: string, options: ExportOptions) => Promise<void>

  // Actions: Integration
  sendToUpscaler: (itemId: string) => Promise<void>
  createCarousel: (projectId: string, itemIds: string[]) => Promise<void>
}

export const useProductPhotoStore = create<ProductPhotoStore>((set, get) => ({
  // Initial State
  projects: [],
  currentProject: null,
  currentProjectItems: [],
  templates: [],
  isLoading: false,
  error: null,
  currentView: 'projects',
  selectedItems: [],

  // Load projects
  loadProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/apps/product-photo-studio/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      set({ projects: response.data.projects, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Create project
  createProject: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('/api/apps/product-photo-studio/projects', data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const newProject = response.data
      set((state) => ({
        projects: [newProject, ...state.projects],
        isLoading: false,
      }))
      return newProject
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  // Select project
  selectProject: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`/api/apps/product-photo-studio/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      set({
        currentProject: response.data,
        currentProjectItems: response.data.items,
        currentView: 'project-detail',
        isLoading: false,
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Update project
  updateProject: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(`/api/apps/product-photo-studio/projects/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? response.data : p)),
        currentProject: state.currentProject?.id === id ? response.data : state.currentProject,
        isLoading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Delete project
  deleteProject: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/apps/product-photo-studio/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        currentView: state.currentProject?.id === id ? 'projects' : state.currentView,
        isLoading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Back to projects
  backToProjects: () => {
    set({
      currentProject: null,
      currentProjectItems: [],
      currentView: 'projects',
      selectedItems: [],
    })
  },

  // Upload items
  uploadItems: async (projectId, files) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))

      const response = await axios.post(
        `/api/apps/product-photo-studio/projects/${projectId}/items/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      set((state) => ({
        currentProjectItems: [...response.data.uploadedItems, ...state.currentProjectItems],
        isLoading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Delete item
  deleteItem: async (itemId) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/apps/product-photo-studio/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      set((state) => ({
        currentProjectItems: state.currentProjectItems.filter((item) => item.id !== itemId),
        selectedItems: state.selectedItems.filter((id) => id !== itemId),
        isLoading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Toggle favorite
  toggleFavorite: async (itemId) => {
    try {
      const token = localStorage.getItem('token')
      const item = get().currentProjectItems.find((i) => i.id === itemId)
      if (!item) return

      await axios.put(
        `/api/apps/product-photo-studio/items/${itemId}`,
        { isFavorite: !item.isFavorite },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      set((state) => ({
        currentProjectItems: state.currentProjectItems.map((i) =>
          i.id === itemId ? { ...i, isFavorite: !i.isFavorite } : i
        ),
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  // Select item
  selectItem: (itemId) => {
    set((state) => ({
      selectedItems: state.selectedItems.includes(itemId)
        ? state.selectedItems.filter((id) => id !== itemId)
        : [...state.selectedItems, itemId],
    }))
  },

  // Select multiple items
  selectMultipleItems: (itemIds) => {
    set({ selectedItems: itemIds })
  },

  // Clear selection
  clearSelection: () => {
    set({ selectedItems: [] })
  },

  // Process item
  processItem: async (itemId, workflow) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `/api/apps/product-photo-studio/items/${itemId}/process`,
        { workflow },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Update item status
      set((state) => ({
        currentProjectItems: state.currentProjectItems.map((item) =>
          item.id === itemId ? { ...item, status: 'processing' } : item
        ),
        isLoading: false,
      }))

      // Poll for completion if async
      if (response.data.queueJobId) {
        // TODO: Implement polling or WebSocket
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Batch process
  batchProcess: async (itemIds, workflow) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('token')
      const projectId = get().currentProject?.id
      if (!projectId) throw new Error('No project selected')

      const response = await axios.post(
        `/api/apps/product-photo-studio/projects/${projectId}/batch-process`,
        { itemIds, workflow },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      set((state) => ({
        currentProjectItems: state.currentProjectItems.map((item) =>
          itemIds.includes(item.id) ? { ...item, status: 'processing' } : item
        ),
        isLoading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Apply template
  applyTemplate: async (itemId, templateId) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `/api/apps/product-photo-studio/items/${itemId}/apply-template`,
        { templateId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      set((state) => ({
        currentProjectItems: state.currentProjectItems.map((item) =>
          item.id === itemId ? { ...item, status: 'processing' } : item
        ),
        isLoading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Load templates
  loadTemplates: async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/apps/product-photo-studio/templates', {
        headers: { Authorization: `Bearer ${token}` },
      })
      set({ templates: response.data.templates })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  // Export ZIP
  exportZip: async (projectId, options) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `/api/apps/product-photo-studio/projects/${projectId}/export-zip`,
        options,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // TODO: Poll for export completion
      set({ isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Send to upscaler
  sendToUpscaler: async (itemId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `/api/apps/product-photo-studio/items/${itemId}/upscale`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Redirect to upscaler
      window.location.href = response.data.redirectUrl
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  // Create carousel
  createCarousel: async (projectId, itemIds) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `/api/apps/product-photo-studio/projects/${projectId}/create-carousel`,
        { itemIds, carouselName: `Carousel from ${get().currentProject?.name}` },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Redirect to carousel mix
      window.location.href = response.data.redirectUrl
    } catch (error: any) {
      set({ error: error.message })
    }
  },
}))
```

---

## 10. DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Database migration created and tested locally
- [ ] All endpoints tested with Postman/curl
- [ ] Credit pricing validated
- [ ] File upload limits configured
- [ ] Storage paths configured
- [ ] Queue (Redis/BullMQ) running and tested
- [ ] Background Remover integration tested
- [ ] Environment variables documented

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/lumiku"

# Redis (for queue)
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Storage
STORAGE_PATH="/app/storage/product-photo-studio"
STORAGE_MAX_SIZE="1073741824" # 1GB per user

# AI Services
BACKGROUND_REMOVER_API_URL="http://localhost:3000"
FLUX_API_KEY="your-flux-api-key"
SEGMIND_API_KEY="your-segmind-api-key"
REMOVE_BG_API_KEY="your-removebg-api-key"

# Integration
SERVICE_TOKEN="your-service-token"
IMAGE_UPSCALER_API_URL="http://localhost:3000"
CAROUSEL_MIX_API_URL="http://localhost:3000"

# Frontend
FRONTEND_URL="http://localhost:5173"
```

### Database Migration

```bash
# Generate migration
bun prisma migrate dev --name add_product_photo_studio

# Apply to production
bun prisma migrate deploy
```

### Deployment Steps

1. **Push code to repository**
2. **Deploy backend**:
   - Run database migration
   - Configure environment variables in Coolify
   - Start backend service
   - Verify queue worker is running
3. **Deploy frontend**:
   - Build frontend with updated plugin
   - Deploy to Coolify
4. **Test integration**:
   - Create test project
   - Upload test image
   - Process with workflow
   - Verify credit deduction
   - Test export
5. **Monitor**:
   - Check logs for errors
   - Monitor queue jobs
   - Monitor credit usage
   - Monitor storage usage

### Post-Deployment

- [ ] Create sample templates
- [ ] Seed template library
- [ ] Test all integrations in production
- [ ] Monitor error logs for 24 hours
- [ ] Verify credit costs are fair
- [ ] Verify file cleanup cron job is running
- [ ] Update user documentation
- [ ] Announce feature to users

---

## READY FOR IMPLEMENTATION

This complete technical specification is ready to be implemented by the `lumiku-app-builder` agent.

**To proceed:**

Pass this specification to `lumiku-app-builder` agent with:

```
Build AI Product Photo Studio following this specification:
[paste this entire document or reference file path]
```

---

## APPENDIX: COMPARISON WITH EXISTING APPS

**Credit Pricing Comparison**:

| App | Feature | Credits | Product Photo Equivalent |
|-----|---------|---------|--------------------------|
| Avatar Creator | Generate avatar (FLUX) | 10 | AI Background Complex (25) |
| Pose Generator | Generate pose | 30 | Full Workflow (25-51) |
| Background Remover | Remove background | 5 | Background Removal (5) |
| Carousel Mix | 4-slide carousel | 25 | Export Multi-Platform (15) |
| Video Mixer | Generate video | 30 | Batch Process (10+) |

**Product Photo Studio is competitively priced**:
- Background removal (5) matches Background Remover
- Full workflow (25-51) is comparable to Pose Generator (30)
- Batch discount makes it attractive for sellers
- Integration costs are zero (users pay in target apps)

---

**END OF SPECIFICATION**

Generated: 2025-10-17
Version: 1.0.0
Status: Implementation-Ready ✅
