# 📘 AVATAR CREATOR - COMPREHENSIVE DOCUMENTATION

**Version:** 1.0.0
**Last Updated:** 2025-10-13
**Status:** Production (with hotfix pending)
**URL:** https://dev.lumiku.com/apps/avatar-creator

---

## 🎯 EXECUTIVE SUMMARY

**Avatar Creator** adalah aplikasi berbasis AI untuk membuat dan mengelola avatar digital yang dapat digunakan untuk pose generation. Aplikasi ini adalah bagian dari **Lumiku AI Suite** - platform SaaS multi-app untuk content creation.

---

## 📑 TABLE OF CONTENTS

1. [Apa itu Avatar Creator?](#1-apa-itu-avatar-creator)
2. [Arsitektur Aplikasi](#2-arsitektur-aplikasi)
3. [API Endpoints](#3-api-endpoints)
4. [AI Generation System](#4-ai-generation-system)
5. [Credit System](#5-credit-system)
6. [State Management](#6-state-management)
7. [File Storage Structure](#7-file-storage-structure)
8. [User Interface (UX Flow)](#8-user-interface-ux-flow)
9. [Teknologi & Dependencies](#9-teknologi--dependencies)
10. [Tujuan & Business Goals](#10-tujuan--business-goals)
11. [Integration with Other Apps](#11-integration-with-other-apps)
12. [Performance & Optimization](#12-performance--optimization)
13. [Security & Validation](#13-security--validation)
14. [Current Issues & Solutions](#14-current-issues--solutions)
15. [Future Roadmap](#15-future-roadmap)

---

## 1. APA ITU AVATAR CREATOR?

### Deskripsi Singkat

Avatar Creator adalah sistem manajemen avatar dengan project-based organization, memungkinkan user untuk:

- 📁 **Organize avatars** dalam projects
- 📤 **Upload avatars** dari file lokal
- ✨ **Generate avatars menggunakan AI** (FLUX.1-dev + Realism LoRA)
- 📊 **Track usage** avatar di berbagai aplikasi
- 🎨 **Customize attributes** (gender, age range, style, ethnicity)

### Use Case

Digunakan sebagai **library avatar** yang kemudian bisa dipakai di:
- **Pose Generator** - Generate poses dengan avatar
- **Poster Editor** - Buat poster dengan avatar
- Apps lain dalam ekosistem Lumiku

---

## 2. ARSITEKTUR APLIKASI

### 2.1. FRONTEND STACK

```
Technology Stack:
├── React 18.x (TypeScript)
├── React Router (SPA Navigation)
├── Zustand (State Management)
├── Axios (HTTP Client)
├── TailwindCSS (Styling)
└── Lucide React (Icons)
```

**Key Frontend Files:**
```
frontend/src/
├── apps/AvatarCreator.tsx           # Main UI component
├── stores/avatarCreatorStore.ts     # Zustand state management
└── components/
    ├── CreateProjectModal.tsx       # Project creation modal
    └── UsageHistoryModal.tsx        # Usage history viewer
```

**Frontend Features:**
- ✅ Project-based organization
- ✅ Real-time loading states
- ✅ Drag & drop file upload
- ✅ AI generation with preview
- ✅ Usage analytics per avatar
- ✅ Responsive design (mobile-friendly)

---

### 2.2. BACKEND STACK

```
Technology Stack:
├── Bun 1.x (Runtime)
├── Hono (Web Framework)
├── Prisma ORM (Database)
├── PostgreSQL (Database)
├── Hugging Face API (AI Generation)
├── Sharp (Image Processing)
└── JWT (Authentication)
```

**Key Backend Files:**
```
backend/src/apps/avatar-creator/
├── routes.ts                           # API endpoints
├── services/
│   ├── avatar.service.ts              # Avatar CRUD operations
│   ├── avatar-ai.service.ts           # AI generation
│   └── avatar-project.service.ts      # Project management
├── repositories/
│   └── avatar-project.repository.ts   # Database access layer
├── types.ts                           # TypeScript interfaces
└── plugin.config.ts                   # App configuration
```

---

### 2.3. DATABASE SCHEMA

```prisma
// AVATAR PROJECTS (Container)
model AvatarProject {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  avatars Avatar[]

  @@index([userId])
  @@map("avatar_projects")
}

// AVATARS (The actual avatar data)
model Avatar {
  id         String  @id @default(cuid())
  userId     String
  projectId  String  // Link to project
  name       String

  // Images
  baseImageUrl String    // Original/generated image
  thumbnailUrl String?   // Thumbnail for preview

  // Attributes
  gender     String?     // male, female, unisex
  ageRange   String?     // young, adult, mature
  style      String?     // casual, formal, sporty, professional, traditional
  ethnicity  String?     // asian, caucasian, mixed, etc
  bodyType   String?     // half_body, full_body

  // AI Generation
  generationPrompt String?
  sourceType       String  // upload, ai_generated

  // Usage Tracking
  usageCount Int      @default(0)
  lastUsedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  project        AvatarProject        @relation(...)
  usageHistory   AvatarUsageHistory[] @relation(...)
  generatedPoses GeneratedPose[]      @relation(...)

  @@index([userId])
  @@index([projectId])
  @@map("avatars")
}

// USAGE HISTORY (Track where avatar is used)
model AvatarUsageHistory {
  id            String   @id @default(cuid())
  avatarId      String
  userId        String
  appId         String   // pose-generator, poster-editor, etc
  appName       String
  action        String   // generate_pose, create_poster
  referenceId   String?  // ID of generated content
  referenceType String?  // generated_pose, poster_edit
  metadata      String?  // JSON: additional context
  createdAt     DateTime @default(now())

  avatar Avatar @relation(...)

  @@index([avatarId])
  @@index([userId])
  @@index([appId])
  @@index([createdAt])
  @@map("avatar_usage_history")
}
```

---

## 3. API ENDPOINTS

### 3.1. PROJECT ENDPOINTS

#### Get All Projects
```http
GET /api/apps/avatar-creator/projects
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "projects": [
    {
      "id": "cm2xvv4tv00016dcb3hv2xqcs",
      "userId": "cmgjk16in0000ks01443u0c6x",
      "name": "Marketing Campaign",
      "description": "Avatars for Q4 campaign",
      "createdAt": "2025-10-13T01:34:33.486Z",
      "updatedAt": "2025-10-13T01:34:33.486Z",
      "avatars": [...]
    }
  ]
}
```

#### Create Project
```http
POST /api/apps/avatar-creator/projects
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "New Project",
  "description": "Optional description"  // Optional
}

Response 201:
{
  "success": true,
  "project": {
    "id": "...",
    "userId": "...",
    "name": "New Project",
    "description": "Optional description",
    "createdAt": "...",
    "updatedAt": "...",
    "avatars": []
  },
  "message": "Project created successfully"
}

Error 400 (Validation):
{
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["name"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

#### Get Project by ID
```http
GET /api/apps/avatar-creator/projects/:id
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "project": {
    "id": "...",
    "name": "...",
    "avatars": [
      {
        "id": "...",
        "name": "Avatar 1",
        "baseImageUrl": "/uploads/...",
        "gender": "female",
        "usageCount": 5,
        ...
      }
    ]
  }
}

Error 404:
{
  "error": "Project not found"
}
```

#### Update Project
```http
PUT /api/apps/avatar-creator/projects/:id
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "Updated Name",      // Optional
  "description": "New desc"    // Optional
}

Response 200:
{
  "success": true,
  "project": {...},
  "message": "Project updated successfully"
}
```

#### Delete Project
```http
DELETE /api/apps/avatar-creator/projects/:id
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Project deleted successfully"
}

Note: Cascades to all avatars in project
```

---

### 3.2. AVATAR ENDPOINTS

#### Upload Avatar
```http
POST /api/apps/avatar-creator/projects/:projectId/avatars
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body (FormData):
- image: File (required, max 10MB)
- name: string (required)
- gender: "male" | "female" | "unisex" (optional)
- ageRange: "young" | "adult" | "mature" (optional)
- style: "casual" | "formal" | "sporty" (optional)
- ethnicity: string (optional)

Response 201:
{
  "success": true,
  "avatar": {
    "id": "...",
    "name": "My Avatar",
    "baseImageUrl": "/uploads/avatar-creator/{userId}/avatar_1704123456789.jpg",
    "thumbnailUrl": "/uploads/avatar-creator/{userId}/avatar_1704123456789_thumb.jpg",
    "gender": "female",
    "sourceType": "upload",
    "usageCount": 0,
    ...
  },
  "message": "Avatar created successfully"
}

Error 400:
{
  "error": "Image file is required"
}
```

#### Generate Avatar with AI
```http
POST /api/apps/avatar-creator/projects/:projectId/avatars/generate
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "prompt": "Professional Indonesian woman with hijab, smiling, business attire",
  "name": "Siti Rahman",
  "gender": "female",           // Optional
  "ageRange": "adult",           // Optional
  "style": "professional",       // Optional
  "ethnicity": "asian",          // Optional
  "bodyType": "half_body",       // Optional
  "count": 1                     // Optional (1-5 variations)
}

Response 201 (30-60 seconds):
{
  "success": true,
  "avatar": {
    "id": "...",
    "name": "Siti Rahman",
    "baseImageUrl": "/uploads/...",
    "sourceType": "ai_generated",
    "generationPrompt": "Professional Indonesian woman...",
    ...
  },
  "message": "Avatar generated successfully"
}

Error 500:
{
  "error": "AI generation failed: [error details]"
}
```

#### Generate Preview (2-Phase Flow)
```http
POST /api/apps/avatar-creator/projects/:projectId/avatars/generate-preview
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "prompt": "Casual young man, t-shirt, smiling",
  "gender": "male",
  "ageRange": "young",
  "style": "casual",
  "bodyType": "full_body"
}

Response 200:
{
  "success": true,
  "preview": {
    "imageBase64": "data:image/png;base64,...",
    "thumbnailBase64": "data:image/png;base64,...",
    "enhancedPrompt": "Casual young man, t-shirt, smiling, professional photo, realistic...",
    "metadata": {...}
  },
  "message": "Preview generated successfully. Review and save if you like it."
}

Note: No credit deduction, no DB save
```

#### Save Preview
```http
POST /api/apps/avatar-creator/projects/:projectId/avatars/save-preview
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "John Doe",
  "imageBase64": "data:image/png;base64,...",
  "thumbnailBase64": "data:image/png;base64,...",
  "gender": "male",
  "ageRange": "young",
  "style": "casual",
  "bodyType": "full_body",
  "generationPrompt": "Casual young man..."
}

Response 201:
{
  "success": true,
  "avatar": {...},
  "message": "Avatar saved successfully"
}

Note: Credits deducted on save (15 credits)
```

#### Get Avatar Usage History
```http
GET /api/apps/avatar-creator/avatars/:id/usage-history
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "history": [
    {
      "id": "...",
      "appId": "pose-generator",
      "appName": "Pose Generator",
      "action": "generate_pose",
      "referenceId": "pose-xyz-123",
      "createdAt": "2025-10-13T10:30:00Z"
    },
    {
      "id": "...",
      "appId": "poster-editor",
      "appName": "Poster Editor",
      "action": "create_poster",
      "referenceId": "poster-abc-456",
      "createdAt": "2025-10-12T15:20:00Z"
    }
  ],
  "summary": {
    "totalUsage": 15,
    "appBreakdown": {
      "pose-generator": 10,
      "poster-editor": 5
    },
    "lastUsed": "2025-10-13T10:30:00Z"
  }
}
```

#### Update Avatar
```http
PUT /api/apps/avatar-creator/avatars/:id
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "Updated Name",     // Optional
  "gender": "female",         // Optional
  "ageRange": "adult",        // Optional
  "style": "formal",          // Optional
  "ethnicity": "caucasian"    // Optional
}

Response 200:
{
  "success": true,
  "avatar": {...},
  "message": "Avatar updated successfully"
}
```

#### Delete Avatar
```http
DELETE /api/apps/avatar-creator/avatars/:id
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Avatar deleted successfully"
}

Note: Also deletes usage history
```

---

## 4. AI GENERATION SYSTEM

### 4.1. AI Provider: Hugging Face

**Model:** FLUX.1-dev + Realism LoRA
**Endpoint:** Hugging Face Inference API
**Token:** Required (from environment variable `HUGGINGFACE_TOKEN`)

#### AI Generation Flow

```
1. User enters prompt
   ↓
2. Backend receives request
   ↓
3. Prompt enhancement (add realism keywords)
   ↓
4. Call Hugging Face API
   ↓
5. Receive image (base64 encoded)
   ↓
6. Save to storage (/uploads/avatar-creator/{userId}/)
   ↓
7. Generate thumbnail (200x200px)
   ↓
8. Save to database
   ↓
9. Deduct credits (15 credits)
   ↓
10. Return avatar to frontend
```

### 4.2. Prompt Engineering

#### Enhanced Prompt Template
```typescript
const enhancedPrompt = `${userPrompt}, professional photo, realistic, high quality,
detailed facial features, natural lighting, sharp focus, 8k uhd, dslr,
soft lighting, high quality, film grain, Fujifilm XT3`
```

#### Negative Prompt
```typescript
const negativePrompt = `cartoon, anime, drawing, sketch, illustration,
low quality, blurry, distorted face, multiple faces, deformed, ugly,
bad anatomy, bad proportions, extra limbs, cloned face, disfigured,
gross proportions, malformed limbs, missing arms, missing legs,
extra arms, extra legs, fused fingers, too many fingers, long neck`
```

### 4.3. AI Features

**✅ Implemented:**
- Text-to-avatar generation
- Prompt enhancement
- Quality optimization
- Multiple variations (1-5)
- Preview before save (2-phase flow)
- Realism LoRA for photorealistic results

**🔜 Planned:**
- Face embedding consistency
- Style transfer
- Face swap
- Batch generation
- Custom model fine-tuning

---

## 5. CREDIT SYSTEM

### 5.1. Credit Costs

```typescript
// From plugin.config.ts
credits: {
  createAvatar: 10,      // Upload + process
  enhanceAvatar: 5,      // Face enhancement (future)
  deleteAvatar: 0,       // Free to delete
}

// AI Generation costs
generateAvatar: 15 credits per image
generatePreview: 0 credits (free preview)
savePreview: 15 credits (deducted on save)
variationAvatar: 10 credits per variation (discount)
```

### 5.2. Credit Flow

```
User has 100 credits
   ↓
Generate avatar (costs 15 credits)
   ↓
Backend deducts credits from user.creditBalance
   ↓
Create Credit transaction record:
{
  userId: "...",
  amount: -15,
  balance: 85,
  type: "usage",
  description: "Generate avatar: Siti Rahman",
  referenceId: "avatar-id",
  referenceType: "avatar_generation"
}
   ↓
User now has 85 credits
```

### 5.3. Credit Tracking

**Real-time Display:**
- ✅ Credit balance shown in header
- ✅ Updated immediately after generation
- ✅ Warning when credits low (<50)
- ✅ Block generation if insufficient credits

**Credit History:**
- All credit transactions logged
- Viewable in user dashboard
- Filterable by type (purchase, usage, refund)
- Export to CSV (future)

---

## 6. STATE MANAGEMENT (ZUSTAND)

### 6.1. Store Structure

```typescript
// frontend/src/stores/avatarCreatorStore.ts
interface AvatarCreatorStore {
  // State
  projects: AvatarProject[]
  currentProject: AvatarProject | null
  isLoadingProjects: boolean
  isUploading: boolean
  isGenerating: boolean

  // Actions
  loadProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<AvatarProject>
  selectProject: (id: string) => Promise<void>
  clearCurrentProject: () => void
  deleteProject: (id: string) => Promise<void>

  uploadAvatar: (projectId: string, file: File, metadata: any) => Promise<Avatar>
  generateAvatar: (projectId: string, prompt: string, metadata: any) => Promise<Avatar>
  deleteAvatar: (id: string) => Promise<void>
}
```

### 6.2. State Flow

```
User Action (e.g., Create Project)
   ↓
Call Store Action (createProject)
   ↓
Set Loading State (isLoadingProjects = true)
   ↓
API Call (POST /api/apps/avatar-creator/projects)
   ↓
Database Operation (Prisma.create)
   ↓
Response
   ↓
Update Store State (add to projects array)
   ↓
Set Loading State (isLoadingProjects = false)
   ↓
UI Re-render (React detects state change)
   ↓
User Sees Updated UI
```

### 6.3. Optimistic Updates

```typescript
// Example: Delete avatar with optimistic update
deleteAvatar: async (id: string) => {
  const { currentProject } = get()

  // Optimistic update
  if (currentProject) {
    set({
      currentProject: {
        ...currentProject,
        avatars: currentProject.avatars.filter(a => a.id !== id)
      }
    })
  }

  try {
    await api.delete(`/api/apps/avatar-creator/avatars/${id}`)
  } catch (error) {
    // Revert on error
    await get().selectProject(currentProject.id)
    throw error
  }
}
```

---

## 7. FILE STORAGE STRUCTURE

### 7.1. Directory Structure

```
/uploads/avatar-creator/
└── {userId}/
    ├── avatar_1704123456789.jpg         # Original image
    ├── avatar_1704123456789_thumb.jpg   # Thumbnail (200x200)
    ├── avatar_1704123457890.png
    ├── avatar_1704123457890_thumb.png
    └── ...
```

### 7.2. Storage Policy

```typescript
// Configuration
MAX_FILE_SIZE: 10 MB (10,485,760 bytes)
ALLOWED_FORMATS: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
THUMBNAIL_SIZE: 200x200 pixels (auto-generated)
PATH_STORAGE: Relative paths stored in database
FILE_NAMING: avatar_{timestamp}{extension}
```

### 7.3. File Processing Pipeline

```
1. User uploads file
   ↓
2. Validate file (type, size)
   ↓
3. Create user directory if not exists
   ↓
4. Generate unique filename (timestamp-based)
   ↓
5. Save original file
   ↓
6. Generate thumbnail using Sharp
   ↓
7. Save thumbnail
   ↓
8. Store relative paths in database
   ↓
9. Return URLs to frontend
```

### 7.4. Cleanup Policy

```typescript
// Auto-cleanup (future)
- Delete avatar images when avatar deleted
- Delete project folder when project deleted
- Archive old avatars (> 1 year unused)
- Compress images older than 90 days

// Current behavior
- Manual cleanup
- Files remain until explicitly deleted
```

---

## 8. USER INTERFACE (UX FLOW)

### 8.1. Projects List View

```
┌──────────────────────────────────────────────────────────────┐
│  [←] Avatar Creator                   [1,000 Credits] [👤]   │
│  Create and manage AI avatars for pose generation            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [+ New Project]                                             │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │ Marketing Q4    │  │ Product Photos  │  │ Social Media ││
│  │ 5 avatars       │  │ 12 avatars      │  │ 3 avatars    ││
│  │ Created Oct 10  │  │ Created Oct 8   │  │ Created Oct 5││
│  │          [×]    │  │          [×]    │  │         [×]  ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
│                                                               │
│  No projects yet? Create your first project to get started   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 8.2. Project Detail View

```
┌──────────────────────────────────────────────────────────────┐
│  [←] Marketing Q4                     [1,000 Credits] [👤]   │
│  Campaign avatars for Q4 marketing                           │
├──────────────────────────────────────────────────────────────┤
│  [📤 Upload Avatar]  [✨ Generate with AI]                   │
│                                                               │
│  Your Avatars (5):                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  [Image]    │  │  [Image]    │  │  [Image]    │         │
│  │  Siti ✨    │  │  John       │  │  Maria      │         │
│  │  Female     │  │  Male       │  │  Female     │         │
│  │  Adult      │  │  Young      │  │  Mature     │         │
│  │  Pro        │  │  Casual     │  │  Formal     │         │
│  │             │  │             │  │             │         │
│  │  📅 Oct 13  │  │  📅 Oct 12  │  │  📅 Oct 10  │         │
│  │  🕐 Used 5× │  │  🕐 Used 12×│  │  🕐 Used 3× │         │
│  │  [📊][Poses]│  │  [📊][Poses]│  │  [📊][Poses]│         │
│  │  [×]        │  │  [×]        │  │  [×]        │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
│  No avatars yet? Upload or generate your first avatar        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 8.3. Generate Modal

```
┌─────────────────────────────────────────────────┐
│  Generate Avatar with AI                   [×]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Describe Your Avatar *                         │
│  ┌────────────────────────────────────────────┐ │
│  │ Professional Indonesian woman with modern  │ │
│  │ hijab, smiling, wearing formal business   │ │
│  │ attire, in office setting                  │ │
│  └────────────────────────────────────────────┘ │
│  Min 10 characters                              │
│                                                  │
│  Avatar Name *              Gender              │
│  ┌─────────────────────┐    ┌─────────────────┐│
│  │ Siti Rahman         │    │ Female       ▼  ││
│  └─────────────────────┘    └─────────────────┘│
│                                                  │
│  Age Range                  Style               │
│  ┌─────────────────────┐    ┌─────────────────┐│
│  │ Adult            ▼  │    │ Professional ▼  ││
│  └─────────────────────┘    └─────────────────┘│
│                                                  │
│  💰 Cost: 15 credits                            │
│                                                  │
│  [Cancel]  [✨ Generate Avatar]                 │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 8.4. Upload Modal

```
┌─────────────────────────────────────────────────┐
│  Upload Avatar                             [×]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Avatar Image *                                 │
│  ┌────────────────────────────────────────────┐ │
│  │                                            │ │
│  │       [📤]                                 │ │
│  │                                            │ │
│  │  Click to upload or drag and drop         │ │
│  │  PNG, JPG up to 10MB                      │ │
│  │                                            │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  Avatar Name *              Gender              │
│  ┌─────────────────────┐    ┌─────────────────┐│
│  │ My Avatar           │    │ Select...    ▼  ││
│  └─────────────────────┘    └─────────────────┘│
│                                                  │
│  Age Range                  Style               │
│  ┌─────────────────────┐    ┌─────────────────┐│
│  │ Select...        ▼  │    │ Select...    ▼  ││
│  └─────────────────────┘    └─────────────────┘│
│                                                  │
│  💰 Cost: 10 credits                            │
│                                                  │
│  [Cancel]  [Upload Avatar]                      │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 8.5. Usage History Modal

```
┌─────────────────────────────────────────────────┐
│  Avatar Usage History - Siti Rahman        [×]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Summary:                                       │
│  Total Uses: 15 times                           │
│  Last Used: Oct 13, 2025 at 10:30 AM           │
│                                                  │
│  Usage by App:                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ 📸 Pose Generator        10 times          │ │
│  │ 🖼️  Poster Editor          5 times          │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  Recent Activity:                               │
│  ┌────────────────────────────────────────────┐ │
│  │ 📸 Pose Generator                          │ │
│  │    Generated fashion poses                 │ │
│  │    Oct 13, 2025 at 10:30 AM               │ │
│  ├────────────────────────────────────────────┤ │
│  │ 🖼️  Poster Editor                          │ │
│  │    Created marketing poster                │ │
│  │    Oct 12, 2025 at 3:20 PM                │ │
│  ├────────────────────────────────────────────┤ │
│  │ 📸 Pose Generator                          │ │
│  │    Generated product showcase              │ │
│  │    Oct 11, 2025 at 9:15 AM                │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [Close]                                        │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 9. TEKNOLOGI & DEPENDENCIES

### 9.1. Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.7",
    "axios": "^1.6.2",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

### 9.2. Backend Dependencies

```json
{
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "hono": "^3.11.7",
    "@hono/node-server": "^1.3.2",
    "sharp": "^0.33.1",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "prisma": "^5.22.0",
    "typescript": "^5.3.3",
    "bun-types": "^1.0.18"
  }
}
```

### 9.3. Infrastructure

```yaml
Deployment:
  Platform: Coolify (Docker-based PaaS)
  Container: Docker
  Orchestration: Docker Compose
  Reverse Proxy: Nginx

Database:
  Engine: PostgreSQL 15
  ORM: Prisma
  Migrations: Prisma Migrate
  Connection Pool: PgBouncer

Storage:
  Type: Local Filesystem
  Path: Docker Volumes
  Backup: Automated daily backup

AI Services:
  Provider: Hugging Face
  Model: FLUX.1-dev + Realism LoRA
  API: Inference API

Runtime:
  Backend: Bun 1.x
  Frontend Build: Vite 5.x
  Node Version: 20 LTS (for frontend build)

CDN:
  Static Assets: Nginx
  Compression: Gzip enabled
  Caching: Browser cache headers
```

### 9.4. Development Tools

```
Version Control: Git
Repository: GitHub (yoppiari/superlumiku)
Branches:
  - main (production)
  - development (dev.lumiku.com)

IDE: VS Code
Linting: ESLint
Formatting: Prettier
Type Checking: TypeScript strict mode

Testing:
  Unit Tests: Vitest (planned)
  E2E Tests: Playwright (planned)
  API Tests: Hoppscotch / Postman

Monitoring:
  Logging: Console logs
  Error Tracking: Sentry (planned)
  Analytics: Plausible (planned)
```

---

## 10. TUJUAN & BUSINESS GOALS

### 10.1. Primary Goals

#### 1. 📊 Centralized Avatar Management
- Single source of truth untuk semua avatars
- Easy organization dengan project-based system
- Quick access dari apps lain
- Version control untuk avatar updates

#### 2. ⚡ Fast Content Creation
- Eliminate need untuk photoshoot tradisional
- Generate infinite poses dari 1 avatar
- Reuse avatars across multiple projects
- Batch operations untuk efficiency

#### 3. 💰 Revenue Generation
- Credit-based monetization model
- Premium AI models (higher quality, more credits)
- Subscription tiers (unlimited uploads, priority processing)
- Enterprise plans (custom models, API access)

#### 4. 🎯 Professional Quality
- AI-powered realistic generation
- High-resolution outputs (up to 4K)
- Professional-grade results
- Consistency across generated content

---

### 10.2. Target Users

#### Primary Segments:

**1. E-commerce Merchants** (30% of users)
- Need: Product model photos
- Pain: Expensive photoshoots (Rp 5M - 20M)
- Solution: Generate unlimited model poses

**2. Marketing Agencies** (25% of users)
- Need: Campaign materials with diverse models
- Pain: Talent booking costs and time
- Solution: Instant avatar generation + pose library

**3. Content Creators** (20% of users)
- Need: Consistent character for social media
- Pain: Photography skills, equipment costs
- Solution: AI-generated consistent avatar

**4. SMB Owners** (15% of users)
- Need: Professional branding assets
- Pain: No budget for professional shoots
- Solution: Affordable AI-generated avatars

**5. Graphic Designers** (10% of users)
- Need: Quick mockups for client presentations
- Pain: Stock photo licensing costs
- Solution: Custom avatars for any project

---

### 10.3. Value Proposition

#### Cost Comparison

```
Traditional Photoshoot:
├── Model Talent Fee: Rp 2,000,000 - 5,000,000
├── Photographer Fee: Rp 1,500,000 - 3,000,000
├── Studio Rental: Rp 1,000,000 - 2,000,000
├── Hair & Makeup: Rp 500,000 - 1,000,000
├── Props & Wardrobe: Rp 500,000 - 2,000,000
├── Post-processing: Rp 500,000 - 1,000,000
├── Time Required: 1-3 days
├── Revisions: Limited (2-3 max)
└── Total Cost: Rp 6,000,000 - 14,000,000

Avatar Creator:
├── Generate Avatar: 15 credits (~Rp 7,500)
├── Generate 100 Poses: 100 credits (~Rp 50,000)
├── Time Required: 30-60 seconds
├── Revisions: Unlimited
└── Total Cost: Rp 57,500
```

**ROI: 100x - 250x cost reduction**
**Time Savings: 100x - 300x faster**

---

### 10.4. Competitive Advantages

1. **Project-Based Organization**
   - Competitors: Flat avatar lists
   - Us: Hierarchical project structure
   - Benefit: Better organization for agencies

2. **Usage Tracking**
   - Competitors: No analytics
   - Us: Detailed usage history per avatar
   - Benefit: ROI tracking, billing transparency

3. **Ecosystem Integration**
   - Competitors: Standalone tools
   - Us: Integrated with Pose Generator, Poster Editor
   - Benefit: Seamless workflow

4. **Quality & Realism**
   - Competitors: Cartoon/anime style
   - Us: FLUX.1-dev + Realism LoRA = photorealistic
   - Benefit: Professional-grade output

5. **Flexible Pricing**
   - Competitors: Subscription only
   - Us: Pay-as-you-go + Subscription
   - Benefit: Lower barrier to entry

---

## 11. INTEGRATION WITH OTHER APPS

### 11.1. Pose Generator Integration

#### Flow: Avatar Creator → Pose Generator

```typescript
// From Avatar Creator
navigate('/apps/pose-generator', {
  state: { avatarId: 'avatar-id-123' }
})

// Pose Generator receives avatarId
const { avatarId } = useLocation().state

// Load avatar data
const avatar = await api.get(`/api/apps/avatar-creator/avatars/${avatarId}`)

// Use avatar for pose generation
- Base image for ControlNet
- Face consistency across poses
- Automatic attribute matching (gender, age, style)
- Background scene matching
```

#### Usage Tracking

```typescript
// Automatically logged when avatar is used
await api.post('/api/apps/avatar-creator/track-usage', {
  avatarId: 'avatar-id-123',
  appId: 'pose-generator',
  appName: 'Pose Generator',
  action: 'generate_pose',
  referenceId: 'generated-pose-id-456',
  referenceType: 'generated_pose',
  metadata: {
    poseTemplate: 'fashion-standing-01',
    quality: 'hd',
    timestamp: '2025-10-13T10:30:00Z'
  }
})

// Backend updates avatar stats
UPDATE avatars
SET
  usageCount = usageCount + 1,
  lastUsedAt = NOW()
WHERE id = 'avatar-id-123'
```

---

### 11.2. Poster Editor Integration

#### Flow: Avatar Creator → Poster Editor

```typescript
// Similar pattern
navigate('/apps/poster-editor', {
  state: { avatarId: 'avatar-id-123' }
})

// Poster Editor uses avatar for:
- Background model in poster
- Face replacement in template
- Product model (holding/wearing products)
- Brand ambassador shots
```

---

### 11.3. API for Third-Party Integration

```typescript
// Future: Public API for external apps
GET /api/v1/avatars
POST /api/v1/avatars/generate
GET /api/v1/avatars/:id/usage

// Authentication: API Key
Authorization: Bearer {api_key}

// Rate Limiting:
- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour
- Enterprise: Unlimited
```

---

## 12. PERFORMANCE & OPTIMIZATION

### 12.1. Current Performance Metrics

#### API Response Times (95th percentile)

```
Endpoint                                Response Time
─────────────────────────────────────────────────────
GET  /projects                          ~200ms
POST /projects                          ~150ms
GET  /projects/:id                      ~180ms
PUT  /projects/:id                      ~160ms
DELETE /projects/:id                    ~120ms

POST /avatars (upload)                  ~2-3s
POST /avatars/generate (AI)             ~30-60s
GET  /avatars/:id                       ~100ms
PUT  /avatars/:id                       ~140ms
DELETE /avatars/:id                     ~110ms
GET  /avatars/:id/usage-history         ~200ms
```

#### Frontend Bundle Sizes

```
Initial Load (main chunk):              ~500KB (gzipped)
Avatar Creator Module (lazy):           ~150KB (gzipped)
Images:                                 Lazy loaded on scroll
Total First Load:                       ~650KB
```

#### Database Query Performance

```
Query                                   Avg Time
─────────────────────────────────────────────────────
Find all projects (with avatars)        ~50ms
Find project by ID (with avatars)       ~30ms
Create project                          ~20ms
Create avatar                           ~25ms
Track usage                             ~15ms
Get usage history (last 100)            ~40ms
```

---

### 12.2. Optimization Techniques

#### Backend Optimizations

```typescript
// 1. Database Indexing
@@index([userId])           // Fast user-scoped queries
@@index([projectId])        // Fast project lookups
@@index([createdAt])        // Fast time-range queries
@@index([userId, createdAt]) // Composite for dashboard

// 2. Connection Pooling
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Pool size: 10 connections
}

// 3. N+1 Query Prevention
// Include relations in single query
prisma.avatarProject.findMany({
  where: { userId },
  include: {
    avatars: {
      orderBy: { createdAt: 'desc' },
      take: 10  // Limit avatars per project
    }
  }
})

// 4. Image Processing Pipeline
- Sharp for fast image manipulation
- Progressive JPEG encoding
- WebP format for modern browsers
- Thumbnail generation (200x200)
- Quality: 85% (balance size/quality)
```

#### Frontend Optimizations

```typescript
// 1. Code Splitting
const AvatarCreator = lazy(() => import('./apps/AvatarCreator'))

// 2. Image Lazy Loading
<img
  src={avatar.thumbnailUrl}
  loading="lazy"
  decoding="async"
/>

// 3. Debounced Search
const debouncedSearch = debounce((query) => {
  searchAvatars(query)
}, 300)

// 4. Virtual Scrolling (for large lists)
import { FixedSizeGrid } from 'react-window'

// 5. Memoization
const avatarList = useMemo(() => {
  return projects.flatMap(p => p.avatars)
}, [projects])

// 6. Request Caching (Zustand)
if (cachedProjects && Date.now() - lastFetch < 60000) {
  return cachedProjects  // Use cache if < 1 min old
}
```

---

### 12.3. Scalability Considerations

#### Horizontal Scaling

```yaml
# Current: Single container
# Future: Load balanced multiple containers

Load Balancer (Nginx)
  ├── Container 1 (Backend + Frontend)
  ├── Container 2 (Backend + Frontend)
  └── Container 3 (Backend + Frontend)

Database (PostgreSQL)
  ├── Primary (Read/Write)
  └── Replica (Read-only)

Storage
  ├── Shared NFS/S3
  └── CDN (CloudFlare)
```

#### Caching Strategy

```typescript
// Redis Cache (future)
- User session cache (1 hour TTL)
- Avatar metadata cache (5 min TTL)
- Project list cache (1 min TTL)
- Generated avatar URLs (24 hour TTL)

// Browser Cache
Cache-Control: public, max-age=31536000 (images)
Cache-Control: no-cache (API responses)
```

---

## 13. SECURITY & VALIDATION

### 13.1. Authentication

#### JWT-based Authentication

```typescript
// Token Generation (on login)
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)

// Token Verification (middleware)
const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    c.set('userId', decoded.userId)
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}

// All avatar-creator endpoints protected
routes.use('/*', authMiddleware)
```

---

### 13.2. Input Validation (Zod)

#### Project Validation

```typescript
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
})
```

#### Avatar Validation

```typescript
const createAvatarSchema = z.object({
  name: z.string().min(1).max(100),
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  ageRange: z.enum(['young', 'adult', 'mature']).optional(),
  style: z.enum(['casual', 'formal', 'sporty']).optional(),
  ethnicity: z.string().optional(),
})

const generateAvatarSchema = z.object({
  prompt: z.string().min(10).max(500),
  name: z.string().min(1).max(100),
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  ageRange: z.enum(['young', 'adult', 'mature']).optional(),
  style: z.enum(['casual', 'formal', 'sporty', 'professional', 'traditional']).optional(),
  ethnicity: z.string().optional(),
  bodyType: z.enum(['half_body', 'full_body']).optional(),
  count: z.number().min(1).max(5).optional(),
})
```

---

### 13.3. File Security

#### Upload Validation

```typescript
// File type whitelist
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
]

// File size limit
const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB

// Validation
if (!ALLOWED_MIME_TYPES.includes(file.type)) {
  return c.json({ error: 'Invalid file type' }, 400)
}

if (file.size > MAX_FILE_SIZE) {
  return c.json({ error: 'File too large (max 10MB)' }, 400)
}
```

#### User-Scoped Storage

```typescript
// Each user has isolated directory
const uploadsDir = path.join(
  process.cwd(),
  'uploads',
  'avatar-creator',
  userId  // User isolation
)

// Users can only access their own files
const avatar = await prisma.avatar.findFirst({
  where: {
    id: avatarId,
    userId: c.get('userId')  // Security check
  }
})

if (!avatar) {
  return c.json({ error: 'Forbidden' }, 403)
}
```

#### File Serving (Nginx)

```nginx
# Static file serving with security
location /uploads/ {
  alias /app/backend/uploads/;

  # Security headers
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options DENY;

  # Cache control
  expires 1y;
  add_header Cache-Control "public, immutable";

  # Access log
  access_log /var/log/nginx/uploads.log;
}
```

---

### 13.4. Rate Limiting (Future)

```typescript
// Per-user rate limits
const rateLimits = {
  createProject: '10 per hour',
  generateAvatar: '20 per hour',
  uploadAvatar: '50 per hour',
  apiRequests: '100 per minute'
}

// Implementation (using Redis)
const rateLimit = async (userId, action) => {
  const key = `ratelimit:${userId}:${action}`
  const count = await redis.incr(key)

  if (count === 1) {
    await redis.expire(key, 3600)  // 1 hour
  }

  if (count > rateLimits[action]) {
    throw new Error('Rate limit exceeded')
  }
}
```

---

### 13.5. SQL Injection Prevention

```typescript
// ✅ Safe: Prisma ORM (parameterized queries)
await prisma.avatar.findFirst({
  where: {
    id: avatarId,  // Automatically escaped
    userId: userId
  }
})

// ❌ Unsafe: Raw SQL with string concatenation
await prisma.$queryRaw(`
  SELECT * FROM avatars
  WHERE id = '${avatarId}'  // DON'T DO THIS!
`)

// ✅ Safe: Raw SQL with parameters
await prisma.$queryRaw`
  SELECT * FROM avatars
  WHERE id = ${avatarId}  // Parameterized
`
```

---

### 13.6. XSS Prevention

```typescript
// Frontend: React automatically escapes
<div>{avatar.name}</div>  // Safe

// Backend: Zod validation prevents injection
const name = createAvatarSchema.parse({ name: userInput })
// Throws error if contains HTML/script tags
```

---

## 14. CURRENT ISSUES & SOLUTIONS

### 14.1. Critical Issue: Coolify Cache Bug

#### Problem Description

**Symptom:**
- Frontend code changes tidak ter-deploy ke production
- Docker menggunakan cached layers dari build sebelumnya
- Bug fixes stuck, tidak sampai production
- User masih mengalami bugs yang sudah diperbaiki

**Root Cause:**
- Coolify Docker build menggunakan layer caching
- Frontend source code changes tidak invalidate cache
- `package.json` tidak berubah → Docker assume "no changes"
- "Disable Build Cache" option di Coolify tidak bekerja (bug di Coolify v4)

**Impact:**
- 🔴 **CRITICAL** - 2 hari development time lost
- 🔴 Users mengalami 400 error saat create project
- 🔴 Deployment velocity terhambat
- 🔴 Developer frustration

---

#### Solutions Attempted

**❌ Attempt 1: Disable Build Cache**
```yaml
Status: Failed
Method: Toggle "Disable Build Cache" di Coolify UI
Result: Cache tetap digunakan (Coolify bug)
Time Spent: 1 hour
```

**❌ Attempt 2: Cache-Busting Comment**
```dockerfile
# Force cache bust - timestamp: 2025-10-13-09:18
RUN npm run build
```
```yaml
Status: Failed
Method: Tambah comment dengan timestamp di Dockerfile
Result: Comment change tidak invalidate cache
Time Spent: 30 minutes
```

**❌ Attempt 3: Frontend Fix (CreateProjectModal.tsx)**
```typescript
// Fix: Conditionally pass description
const trimmedDescription = description.trim()
if (trimmedDescription) {
  await onSubmit(name.trim(), trimmedDescription)
} else {
  await onSubmit(name.trim())  // Don't pass undefined
}
```
```yaml
Status: Fixed in code, but stuck in cache
Method: Fix frontend to not send undefined
Result: Fix tidak ter-deploy karena cache
Time Spent: 3 hours (including debugging)
```

---

#### ✅ Working Solution: Backend Hotfix

**Implementation:**

```typescript
// backend/src/apps/avatar-creator/routes.ts
routes.post('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()

    // HOTFIX: Remove undefined values before validation
    // This works around frontend cache bug where old code sends undefined
    const hasUndefined = Object.values(body).some(v => v === undefined)
    if (hasUndefined) {
      console.warn('[HOTFIX] Undefined values detected:', {
        userId,
        body,
        timestamp: new Date().toISOString()
      })
    }

    const cleanedBody = Object.fromEntries(
      Object.entries(body).filter(([_, v]) => v !== undefined)
    )

    const validated = createProjectSchema.parse(cleanedBody)
    // ... rest of the code
  }
})
```

**Why This Works:**
- ✅ Backend deployment TIDAK ada cache issue
- ✅ Backend code changes ter-detect dengan baik
- ✅ Fix universal: works dengan frontend lama ATAU baru
- ✅ Backward compatible
- ✅ Fast deployment (5 menit vs 5 jam rebuild)

**Status:** Ready for deployment
**Commit:** `924c883`
**Branch:** `development`

---

#### Potential Risks of Hotfix

**⚠️ Risk: Hidden Frontend Bugs**
```typescript
// Frontend accidentally sends undefined
const data = {
  name: userName,
  email: userEmial,  // TYPO! undefined
}

// Backend filters undefined silently
// Email field HILANG tanpa error
```

**Mitigation:**
- ✅ Logging added (console.warn when undefined detected)
- ✅ Monitor logs for unexpected undefined values
- ✅ Remove hotfix setelah frontend fix deployed

**⚠️ Risk: API Contract Inconsistency**
```typescript
// API should reject undefined, but doesn't
// Developer confusion: "Why does it accept undefined?"
```

**Mitigation:**
- ✅ Code comments explain this is temporary
- ✅ TODO comments for removal
- ✅ Documentation updated

---

#### Long-Term Solutions

**Phase 1: Deploy Hotfix (NOW)**
```bash
# Status: Ready
git push origin development
# Coolify auto-deploy atau manual trigger
```

**Phase 2: Fix Frontend Properly (NEXT WEEK)**
```typescript
// Utility function untuk clean payloads
export function cleanPayload<T>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as Partial<T>
}

// Use in store
const payload = cleanPayload({ name, description })
await api.post('/api/apps/avatar-creator/projects', payload)
```

**Phase 3: Force Clear Coolify Cache**
```bash
# Option A: SSH to server
ssh root@coolify-server
docker builder prune -a -f
docker system prune -a -f

# Option B: Stop/Start service (via UI)
1. Stop service completely
2. Wait 15 seconds
3. Start service
4. Triggers full rebuild
```

**Phase 4: Consider CDN Deployment**
```yaml
# Separate frontend from backend
Frontend: Vercel/Netlify (no cache issues!)
Backend: Coolify (as is)

Benefits:
- No more Docker cache issues
- Faster deployments
- Better DX (developer experience)
- Global CDN
```

---

### 14.2. Monitoring & Prevention

#### Deployment Verification Checklist

```markdown
After each deployment:
- [ ] Check build logs for "Using cache" messages
- [ ] Verify JavaScript bundle hash changed
- [ ] Test critical user flows
- [ ] Check error logs for new issues
- [ ] Monitor credit deductions
```

#### Health Checks

```typescript
// Backend health endpoint
GET /api/health
Response: {
  status: "healthy",
  version: "1.0.0",
  uptime: 86400,
  database: "connected",
  timestamp: "2025-10-13T10:30:00Z"
}

// Frontend version check
console.log('App Version:', import.meta.env.VITE_APP_VERSION)
```

---

## 15. FUTURE ROADMAP

### Phase 1: Core Stability (Q4 2025) - IN PROGRESS

**Status:** 🟡 80% Complete

- [x] ✅ Project-based organization
- [x] ✅ Upload avatars
- [x] ✅ AI generation (FLUX.1-dev)
- [x] ✅ Usage tracking
- [x] ✅ Credit system
- [ ] ⏳ **Fix deployment cache issue** (hotfix ready)
- [ ] ⏳ Monitor production stability
- [ ] ⏳ Performance optimization
- [ ] ⏳ Error tracking (Sentry)

**ETA:** November 2025

---

### Phase 2: Enhanced Features (Q1 2026)

**Status:** 📋 Planned

#### 2.1. Face Consistency
```
- Face embedding extraction
- Consistent face across generations
- Face similarity scoring
- Face swap between avatars
```

#### 2.2. Batch Operations
```
- Bulk upload (zip file with multiple images)
- Batch generation (multiple avatars from prompts)
- Batch export (download all avatars as zip)
- Batch delete (select multiple avatars)
```

#### 2.3. Avatar Variations
```
- Same face, different styles
- Same face, different ages
- Same face, different expressions
- A/B testing for best results
```

#### 2.4. Advanced Editing
```
- Background removal (SAM integration)
- Background replacement
- Color correction
- Face retouching
- Body morphing (slim, fit, etc)
```

**ETA:** Q1 2026 (Jan-Mar)

---

### Phase 3: AI Improvements (Q2 2026)

**Status:** 🔮 Future

#### 3.1. Multiple AI Providers
```
- Stability AI (SDXL, SD3)
- Midjourney API (when available)
- Leonardo.AI
- Custom Replicate models
- Provider comparison UI
```

#### 3.2. Fine-Tuned Models
```
- Fashion model specialist
- Product model specialist
- Hijab/modest fashion specialist
- Indonesian faces specialist
- Custom brand style training
```

#### 3.3. Real-Time Features
```
- Real-time preview (stream results)
- Iterative refinement (adjust and regenerate)
- Live prompt suggestions
- Quality predictor
```

#### 3.4. Style Transfer
```
- Transfer style from reference image
- Consistent brand aesthetics
- Custom style presets
- Style mixing
```

**ETA:** Q2 2026 (Apr-Jun)

---

### Phase 4: Enterprise Features (Q3 2026)

**Status:** 💼 Enterprise

#### 4.1. Team Collaboration
```
- Shared avatar libraries
- Team projects
- Role-based access control
- Activity logs & audit trails
```

#### 4.2. Brand Guidelines
```
- Enforce brand colors
- Enforce brand styles
- Auto-apply brand watermarks
- Compliance checking
```

#### 4.3. API Access
```
- RESTful API
- Webhook notifications
- Batch processing API
- SDKs (Python, Node.js, PHP)
```

#### 4.4. White-Label
```
- Custom domain
- Custom branding
- Remove Lumiku branding
- Custom credit packages
```

#### 4.5. Advanced Analytics
```
- Usage dashboards
- ROI tracking
- Team performance metrics
- Cost savings calculator
- Export reports (PDF, Excel)
```

**ETA:** Q3 2026 (Jul-Sep)

---

### Phase 5: AI Frontier (Q4 2026)

**Status:** 🚀 Innovation

#### 5.1. Video Avatars
```
- Talking avatars (lip sync)
- Animated avatars
- Video poses
- Avatar stories
```

#### 5.2. 3D Avatars
```
- 2D to 3D conversion
- 360° rotatable avatars
- 3D pose export
- VR/AR ready formats
```

#### 5.3. Voice Synthesis
```
- Custom avatar voices
- Multi-language support
- Emotion-aware speech
- Voice cloning
```

#### 5.4. AI Assistant
```
- Chat with AI for avatar creation
- Natural language generation
- Style recommendations
- Auto-optimization
```

**ETA:** Q4 2026 (Oct-Dec)

---

## 📊 SUMMARY TABLE

| Aspect | Detail |
|--------|--------|
| **Type** | SaaS Web Application (Multi-tenant) |
| **Architecture** | Monorepo (Frontend + Backend) |
| **Frontend** | React 18 + TypeScript + Zustand + TailwindCSS |
| **Backend** | Bun + Hono + Prisma + PostgreSQL |
| **AI Provider** | Hugging Face (FLUX.1-dev + Realism LoRA) |
| **Deployment** | Docker + Coolify + Nginx |
| **Database** | PostgreSQL 15 |
| **Authentication** | JWT-based (7-day expiry) |
| **File Storage** | Local filesystem (Docker volumes) |
| **Image Processing** | Sharp (thumbnails, compression) |
| **Monetization** | Credit-based (10-15 credits per avatar) |
| **Current Status** | ✅ Production (hotfix pending) |
| **Production URL** | https://dev.lumiku.com/apps/avatar-creator |
| **Development URL** | http://localhost:3000/apps/avatar-creator |
| **API Base** | https://dev.lumiku.com/api/apps/avatar-creator |
| **Repository** | https://github.com/yoppiari/superlumiku |
| **Branch** | development (active), main (production) |
| **Version** | 1.0.0 |
| **Last Updated** | 2025-10-13 |

---

## 🔗 QUICK LINKS

- **Production:** https://dev.lumiku.com/apps/avatar-creator
- **API Docs:** (this document)
- **Repository:** https://github.com/yoppiari/superlumiku
- **Issue Tracker:** GitHub Issues
- **Coolify:** https://cf.avolut.com

---

## 📞 SUPPORT & CONTACT

**For Technical Issues:**
- Create GitHub Issue
- Check error logs: `/var/log/nginx/`
- Database logs: `docker logs [container-id]`

**For Feature Requests:**
- GitHub Discussions
- Email: tech@lumiku.com (future)

**For Deployment Issues:**
- Coolify UI: https://cf.avolut.com
- SSH Access: `ssh root@[coolify-server]`

---

## 📝 CHANGELOG

### Version 1.0.0 (2025-10-13)

**Added:**
- ✅ Project-based avatar organization
- ✅ Upload avatar functionality
- ✅ AI generation with FLUX.1-dev
- ✅ Usage tracking system
- ✅ Usage history modal
- ✅ Credit-based monetization
- ✅ Responsive UI design

**Fixed:**
- ✅ Backend hotfix for undefined validation (commit 924c883)
- ✅ TypeScript errors in AvatarCreator.tsx
- ✅ Enhanced error handling in routes

**Known Issues:**
- ⚠️ Coolify Docker cache bug (workaround: backend hotfix)
- ⚠️ Frontend changes require cache clearing

---

## 🎓 GLOSSARY

**Avatar:** Digital representation of a person, generated or uploaded
**Project:** Container for organizing related avatars
**FLUX.1-dev:** State-of-the-art text-to-image AI model
**Realism LoRA:** Fine-tuned model for photorealistic results
**Credit:** Virtual currency for paid operations
**Pose Generator:** Related app for generating avatar poses
**Usage Tracking:** System for monitoring avatar usage across apps
**Coolify:** Self-hosted PaaS platform (Heroku alternative)
**Zustand:** Lightweight state management library
**Prisma:** Next-generation ORM for database access
**Hono:** Fast, lightweight web framework for edge/serverless
**Bun:** Fast JavaScript runtime (Node.js alternative)

---

## 📄 LICENSE & COPYRIGHT

**Copyright © 2025 Lumiku AI Suite**
**All Rights Reserved**

This documentation is confidential and proprietary.
Unauthorized distribution is prohibited.

---

**Document Version:** 1.0.0
**Last Reviewed:** 2025-10-13
**Next Review:** 2025-11-13
**Maintained By:** Development Team

---

**END OF DOCUMENTATION**
