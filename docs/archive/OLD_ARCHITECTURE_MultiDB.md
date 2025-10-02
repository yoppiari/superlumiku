# Adopted Video Mix Pro - Comprehensive Architecture Documentation

> **Purpose**: This document provides a complete technical overview of the Adopted Video Mix Pro platform, enabling rapid understanding and strategic planning for future development.

**Last Updated**: 2025-09-30
**System Status**: All components operational
**Technology**: Bun monorepo with TypeScript, React, Hono, Express, Prisma

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Patterns](#2-architecture-patterns)
3. [MainApp - Central Hub](#3-mainapp---central-hub)
4. [VideoMixPro - Video Processing Engine](#4-videomixpro---video-processing-engine)
5. [CarouselGeneratorPro - AI Image Generator](#5-carouselseneratorpro---ai-image-generator)
6. [Framework - Shared Components](#6-framework---shared-components)
7. [Credit System Architecture](#7-credit-system-architecture)
8. [Authentication & SSO](#8-authentication--sso)
9. [Database Architecture](#9-database-architecture)
10. [Deployment & Infrastructure](#10-deployment--infrastructure)
11. [Future Improvement Opportunities](#11-future-improvement-opportunities)

---

## 1. System Overview

### 1.1 Platform Description

**Adopted Video Mix Pro** is a multi-tenant SaaS platform providing automated content creation tools for social media:

- **MainApp**: Central authentication hub, credit management system, payment gateway integration
- **VideoMixPro**: Automated video mixing and anti-fingerprinting for social media platforms
- **CarouselGeneratorPro**: AI-powered carousel image generation for Instagram, LinkedIn, TikTok

### 1.2 Monorepo Structure

```
Adopted Video Mix Pro/
├── server.ts                    # Unified Bun server (port 8001)
├── package.json                 # Workspace configuration
├── Framework/                   # Shared authentication & billing
│   ├── auth/                   # JWT auth, session management
│   ├── billing/                # Payment & credit system
│   └── shared/                 # Common types & utilities
├── Apps/
│   ├── MainApp/                # Landing page & dashboard (React + Hono)
│   │   ├── src/                # React frontend
│   │   ├── backend/            # Hono API (auth, payment, credits)
│   │   └── prisma/             # SQLite database
│   ├── VideoMixPro/            # Video processing app (React + Express)
│   │   ├── frontend/           # React SPA
│   │   ├── src/                # Express backend
│   │   └── prisma/             # SQLite database
│   └── CarouselGeneratorPro/   # Carousel generator (React + Hono)
│       ├── frontend/           # React SPA (Vite)
│       ├── backend/            # Hono API
│       └── prisma/             # SQLite database
├── docs/                       # Project documentation
└── ARCHITECTURE.md            # This file
```

### 1.3 Technology Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Bun | 1.0+ |
| **Backend Frameworks** | Hono, Express | 3.11.0, 4.18.2 |
| **Frontend Framework** | React | 18.2.0 |
| **Build Tools** | Create React App, Vite | 5.0.1, 4.4 |
| **Database ORM** | Prisma | 5.0+ |
| **Database (Dev)** | SQLite | 3 |
| **Database (Prod)** | PostgreSQL | 13+ |
| **Authentication** | JWT | jsonwebtoken 9.0 |
| **Video Processing** | FFmpeg | 4.4+ (static binary) |
| **AI Provider** | Anthropic Claude | API v0.63.1 |
| **Payment Gateway** | Duitku | REST API |
| **Image Processing** | @napi-rs/canvas, Sharp | 0.1.80, 0.34.4 |

### 1.4 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Unified Bun Server (Port 8001)               │
│                         server.ts                                │
└──────────────┬──────────────────┬─────────────────┬─────────────┘
               │                  │                 │
       ┌───────▼────────┐ ┌──────▼────────┐ ┌─────▼──────────┐
       │   MainApp      │ │  VideoMixPro  │ │ CarouselGenPro │
       │   (/)          │ │  (/videomix)  │ │  (/carousel)   │
       │                │ │  [Protected]  │ │  [Protected]   │
       └───────┬────────┘ └──────┬────────┘ └─────┬──────────┘
               │                  │                 │
       ┌───────▼────────┐ ┌──────▼────────┐ ┌─────▼──────────┐
       │ /api/mainapp   │ │ /api/videomix │ │ /api/carousel  │
       │  - auth        │ │  - processing │ │  - bulk-gen    │
       │  - payment     │ │  - projects   │ │  - ai-gen      │
       │  - credits     │ │  - videos     │ │  - projects    │
       └───────┬────────┘ └──────┬────────┘ └─────┬──────────┘
               │                  │                 │
       ┌───────▼────────┐ ┌──────▼────────┐ ┌─────▼──────────┐
       │ MainApp.db     │ │ VideoMix.db   │ │ Carousel.db    │
       │ (SQLite)       │ │ (SQLite)      │ │ (SQLite)       │
       │ - Users        │ │ - Projects    │ │ - Carousels    │
       │ - Payments     │ │ - Videos      │ │ - Slides       │
       │ - Credits ★    │ │ - Jobs        │ │ - Credits      │
       └────────────────┘ └───────────────┘ └────────────────┘
              ↑                    ↓                 ↓
              │                    │                 │
              └────────────────────┴─────────────────┘
                   Credit Sync via API Calls
```

**Key Architectural Principles**:
- **Single Entry Point**: All apps served from one Bun server
- **Microservices Pattern**: Each app has its own database and API
- **Centralized Credits**: MainApp is the single source of truth for user credits
- **Shared Authentication**: JWT tokens work across all applications
- **Protected Routing**: Sub-apps require authentication at the server level

---

## 2. Architecture Patterns

### 2.1 Microservices with Monorepo

**Pattern**: Each application is an independent microservice with its own:
- Database (SQLite in dev, PostgreSQL in prod)
- API endpoints
- Frontend build
- Business logic

**Benefits**:
- Independent scaling
- Technology flexibility (Express for VideoMixPro, Hono for MainApp/Carousel)
- Isolated failures
- Clear service boundaries

**Tradeoffs**:
- Data synchronization required
- More complex deployment
- Cross-service dependencies

### 2.2 API Gateway Pattern

**Implementation**: `server.ts` acts as API gateway
- Routes requests to appropriate backend
- Handles authentication at gateway level
- Serves static files with protection

**Routing Strategy**:
```javascript
// Frontend Routes
'/' → MainApp React SPA
'/videomix/*' → VideoMixPro SPA (auth required)
'/carousel/*' → Carousel SPA (auth required)

// API Routes
'/api/mainapp/*' → MainApp Hono backend
'/api/videomix/*' → VideoMixPro Express backend
'/api/carousel/*' → Carousel Hono backend
'/api/session/create' → SSO session endpoint
```

### 2.3 Database Per Service

**Pattern**: Each service maintains its own database
- **MainApp**: User accounts, payments, credit transactions
- **VideoMixPro**: Projects, videos, processing jobs
- **CarouselGeneratorPro**: Carousel projects, slides

**Synchronization**:
- User data synced via VideoMixPro adapter (`videomix-adapter.ts`)
- Credit balance fetched on-demand from MainApp
- No distributed transactions (eventual consistency)

### 2.4 Repository Pattern

**Implementation**: Controllers → Services → Repositories → Database
- Clean separation of concerns
- Testable business logic
- Swappable data sources

**Example from VideoMixPro**:
```typescript
Controller (processing.controller.ts)
  → Service (video-processing.service.ts)
    → Repository (Prisma Client)
      → Database (SQLite/PostgreSQL)
```

---

## 3. MainApp - Central Hub

### 3.1 Responsibilities

**Primary Functions**:
1. **User Management**: Registration, authentication, profile management
2. **Credit Authority**: Single source of truth for all user credits
3. **Payment Gateway**: Duitku integration for credit purchases
4. **SSO Provider**: Single Sign-On for sub-applications
5. **Dashboard**: Unified interface for accessing all applications

**Not Credit System** (Important): MainApp does NOT use the credit system itself - it only manages credits for other applications.

### 3.2 Frontend Architecture

**Technology**: React 18.2 + TypeScript + Tailwind CSS + React Router 6

**Pages**:
```typescript
// Public Routes
/login              - Authentication with SSO support
/register           - User registration (100 free credits)

// Protected Routes (require authentication)
/dashboard          - Main dashboard with app launcher
/dashboard/buy-credits    - Credit purchase interface
/dashboard/history  - Transaction history
/payment/success    - Payment confirmation
/payment/failed     - Payment error handling
/payment/status     - Payment status checking
```

**Key Components**:
- **Dashboard.tsx**: Credit balance display, app launcher cards, usage stats
- **BuyCredits.tsx**: 5 credit packages, payment method selection
- **PurchaseHistory.tsx**: Filterable transaction history with stats
- **Login.tsx**: JWT authentication with redirect support

**State Management**:
- localStorage for token storage (`token`, `authToken`, `user`)
- React Context for global state (auth, notifications)
- No Redux/Zustand (kept simple for landing page)

### 3.3 Backend API (Hono)

**Location**: `Apps/MainApp/backend/index.ts`

**Endpoints**:

**Authentication** (`/api/mainapp/auth`):
```typescript
POST   /auth/register         - Create account (100 welcome credits)
POST   /auth/login           - JWT authentication
POST   /auth/logout          - Session termination
GET    /auth/profile         - User profile + recent transactions
PUT    /auth/profile         - Update name/password
GET    /auth/credits         - Credit balance + statistics
```

**Payment** (`/api/mainapp/payment`):
```typescript
GET    /payment/packages     - Available credit packages
GET    /payment/methods      - Duitku payment methods
POST   /payment/create       - Create payment request
GET    /payment/status/:id   - Check payment status (with auto-update)
GET    /payment/history      - Paginated payment history
POST   /payment/callback     - Duitku webhook (public endpoint)
```

**Credits** (`/api/mainapp/credits`):
```typescript
GET    /credits/balance      - User credit balance
POST   /credits/check        - Validate sufficient credits
POST   /credits/deduct       - Deduct credits (called by sub-apps)
POST   /credits/refund       - Refund credits (processing failure)
GET    /credits/transactions - Transaction history
```

### 3.4 Credit Packages

**Pricing Structure** (Fixed at Rp 50/credit):
```
4,000 credits   = Rp 200,000
6,000 credits   = Rp 300,000
10,000 credits  = Rp 500,000
20,000 credits  = Rp 1,000,000
40,000 credits  = Rp 2,000,000
```

### 3.5 Duitku Payment Integration

**Service**: `Apps/MainApp/backend/services/duitku.service.ts`

**Payment Flow**:
1. User selects package → Frontend calls `POST /payment/create`
2. Backend creates Payment record (status: pending)
3. Backend calls Duitku API with MD5 signature
4. Duitku returns payment URL
5. User redirected to Duitku payment page
6. User completes payment
7. **Webhook** → Duitku sends callback to `POST /payment/callback`
8. Backend validates signature → Updates payment status
9. **On success**: Atomically add credits to user account
10. Frontend redirects to `/payment/success`

**Security**:
- MD5 signature validation: `merchantCode + orderId + amount + apiKey`
- Webhook signature: `merchantCode + amount + orderId + resultCode + apiKey`
- Unique merchant order IDs: `PAY-{timestamp}-{uuid}`
- 24-hour payment expiry
- Idempotency via database constraints

**Supported Payment Methods**:
- Virtual Account (bank transfer)
- E-Wallets: OVO, DANA, ShopeePay, LinkAja
- QRIS: Universal QR payment

### 3.6 Database Schema

**File**: `Apps/MainApp/prisma/schema.prisma`

**Core Models**:

```prisma
User {
  id, email, password, name
  credits       Int @default(0)      // Source of truth
  role          String @default("user")
  isActive      Boolean @default(true)
  createdAt, updatedAt

  payments[]
  creditTransactions[]
  sessions[]
}

Payment {
  id, userId
  merchantOrderId  String @unique
  duitkuReference  String?
  amount           Int                // IDR
  credits          Int                // Credits purchased
  status           String             // pending|success|failed|expired
  paymentMethod    String?
  createdAt, updatedAt, paidAt
  metadata         String?            // JSON

  user User
}

CreditTransaction {
  id, userId
  amount        Int                   // Positive=credit, Negative=debit
  balance       Int                   // Balance after transaction
  type          String                // purchase|usage|refund|bonus
  description   String
  referenceId   String?               // Related entity ID
  referenceType String?               // payment|project|job
  createdAt

  user User
}

Session {
  id, userId
  token         String @unique        // JWT token
  expiresAt     DateTime
  createdAt

  user User
}
```

---

## 4. VideoMixPro - Video Processing Engine

### 4.1 Purpose & Features

**Core Purpose**: Automated video mixing with anti-fingerprinting for social media content creation

**Key Features**:
- Multi-video upload with metadata extraction
- Auto-mixing: AI-powered variant generation
- Manual mixing: Group-based video sequencing
- Anti-fingerprinting: Order mixing, speed variations, smart trimming
- Voice-over mode: Audio overlay processing
- Batch processing with progress monitoring
- Credit-based pricing with volume discounts

**Target Platforms**: TikTok, Instagram Reels, YouTube Shorts, YouTube

### 4.2 Frontend Architecture

**Technology**: React 18 + TypeScript + React Router + Axios

**Location**: `Apps/VideoMixPro/frontend/`

**Key Pages**:
```typescript
/videomix/dashboard          - Overview, stats, recent jobs
/videomix/projects           - Project management
/videomix/projects/:id       - Project detail with video upload
/videomix/processing/:id     - Job monitoring
/videomix/credits            - Credit usage analytics
```

**Components**:
- **Dashboard.tsx**: Project stats, recent jobs, quick actions
- **ProjectList.tsx**: Paginated projects with video/group counts
- **VideoUpload.tsx**: Multi-file upload with drag-and-drop
- **VideoGroupManager.tsx**: Drag-and-drop video organization
- **ProcessingSettings.tsx**: Mixing configuration UI
- **JobMonitor.tsx**: Real-time job progress tracking
- **CreditUsageDisplay.tsx**: Transaction history with filtering

**State Management**:
- localStorage: `authToken` for JWT
- React state hooks for local component state
- Axios interceptors for authentication

### 4.3 Backend Architecture (Express.js)

**Location**: `Apps/VideoMixPro/src/`

**Entry Point**: `index.ts` (Express server on port 3002 in dev)

**API Structure** (`/api/v1` prefix):

**Authentication**:
```typescript
POST   /auth/register        - User registration
POST   /auth/login          - JWT authentication
GET    /auth/profile        - User profile
```

**Projects**:
```typescript
GET    /projects             - List projects (paginated)
POST   /projects             - Create project
GET    /projects/:id         - Project details
PUT    /projects/:id         - Update settings
DELETE /projects/:id         - Delete project
```

**Videos**:
```typescript
POST   /videos/upload        - Multi-file upload (Multer)
GET    /videos/project/:id   - List project videos
DELETE /videos/:id           - Delete video
PUT    /videos/:id/assign    - Assign to group
PUT    /videos/bulk-assign   - Bulk group assignment
```

**Groups**:
```typescript
POST   /groups               - Create video group
PUT    /groups/:id           - Update group
DELETE /groups/:id           - Delete group
GET    /groups/project/:id   - List project groups
POST   /groups/project/:id/reorder - Reorder groups
```

**Processing**:
```typescript
POST   /processing/start/:projectId       - Start processing job
GET    /processing/status/:jobId          - Job status
GET    /processing/job/:jobId/details     - Detailed job info
POST   /processing/cancel/:jobId          - Cancel running job
POST   /processing/credits-estimate       - Calculate credit cost
GET    /processing/jobs                   - User job list
GET    /processing/outputs/:jobId         - Job outputs
GET    /processing/download/:outputId     - Download single output
POST   /processing/job/:jobId/download-batch - Batch ZIP download
```

**Voice-Over**:
```typescript
POST   /voiceover/upload     - Upload voice-over audio
GET    /voiceover/project/:id - List project voice-overs
DELETE /voiceover/:id         - Delete voice-over
```

### 4.4 Core Services

**Video Processing Service** (`src/services/video-processing.service.ts` - 2,120 lines)

**Responsibilities**:
1. **Metadata Extraction**: Duration, resolution, format, bitrate, FPS, codec
2. **FFmpeg Command Generation**: Dynamic filter complex creation
3. **Job Queue Management**: Active job tracking, progress monitoring
4. **Process Execution**: Spawn FFmpeg with stderr monitoring
5. **Error Handling**: Retry with exponential backoff, credit refunds
6. **Output Management**: File storage, database recording

**Processing Modes**:
- **AUTO**: Intelligent variant generation via Auto-Mixing Service
- **MANUAL**: Group-based sequential mixing
- **VOICEOVER**: Audio overlay with speed adjustment

**Key Methods**:
```typescript
class VideoProcessingService {
  processVideoJob(jobId, settings, authToken)
  extractVideoMetadata(filePath) → VideoMetadata
  buildFFmpegCommand(videoFiles, settings) → FFmpegCommand
  executeFFmpegCommand(command, jobId, outputPath)
  cancelJob(jobId)
  refundCreditsOnFailure(userId, jobId, creditsUsed)
}
```

**Auto-Mixing Service** (`src/services/auto-mixing.service.ts` - 1,351 lines)

**Purpose**: Generate unique video variants with anti-fingerprinting

**Core Algorithm**:
```typescript
generateVariants(videos, settings, groups?) → VideoVariant[] {
  1. Load video clips
  2. Apply order mixing (permutations/rotations)
  3. Generate speed combinations
  4. Calculate smart durations (if enabled)
  5. Filter for different starting videos
  6. Return requested output count
}
```

**Anti-Fingerprinting Features**:

1. **Order Mixing**:
   - Full permutations: n! combinations
   - Rotated orders: Each output starts differently
   - Group-based: Random within groups or strict order

2. **Speed Variations**:
   - Per-video speed multipliers: 0.5x - 2.0x
   - Minimal variations: 0.95x - 1.05x
   - Audio tempo adjustment

3. **Smart Trimming**:
   - Fixed duration output with intelligent trim distribution
   - Modes: Proportional, Equal, Weighted
   - Center-based trimming to preserve important content

4. **Aspect Ratio Adaptation**:
   - TikTok/Reels/Shorts: 9:16 (1080x1920)
   - Instagram Square: 1:1 (1080x1080)
   - YouTube: 16:9 (1920x1080)
   - Original: Maintains source

5. **Metadata Injection**:
   - Normal: Clean metadata
   - CapCut: Mimics CapCut editor signature
   - VN: Mimics VN Video Editor
   - InShot: Mimics InShot editor

**FFmpeg Filter Generation**:
```typescript
buildFilterComplex(videos, settings) → FilterString {
  For each video:
    - Smart trim (if enabled)
    - Speed adjustment
    - Scale to target resolution
    - Pad to aspect ratio
    - Normalize FPS
  Concatenate all streams → [outv][outa]
}
```

**Credit Calculator Service** (`src/services/credit-calculator.service.ts`)

**Pricing Model**:

**Base Cost**: 1 credit per output video

**Volume Discounts**:
```
1-5 videos:     100% (no discount)
6-10 videos:    95%  (5% discount)
11-25 videos:   90%  (10% discount)
26-50 videos:   85%  (15% discount)
51-100 videos:  82%  (18% discount)
101-200 videos: 80%  (20% max discount)
201-500 videos: 85%  (server protection)
500+ videos:    90%  (heavy load protection)
```

**Complexity Multipliers**:
```
Order Mixing:        +0.2x (memory for permutations)
Speed Variations:    +0.5x (FFmpeg filter complexity)
Different Starting:  +0.2x (additional logic)
Group Mixing:        +0.3x (sorting overhead)
Voice-Over Mode:     +0.8x (CPU-intensive)
```

**Quality Multipliers**:
```
Resolution:
  SD (720p):     0.8x
  HD (1080p):    1.0x
  Full HD:       1.5x

Bitrate:
  Low:           0.7x
  Medium:        1.0x
  High:          1.3x

Frame Rate:
  60 FPS:        +1.2x
```

**Server Load Protection**:
```
0-200 outputs:    1.0x
201-500 outputs:  1.06x
501-1000 outputs: 1.12x
1000+ outputs:    1.25x
```

**Voice-Over Service** (`src/services/voice-over.service.ts`)

**Features**:
1. Upload audio files (MP3, WAV, M4A)
2. Extract duration via FFprobe
3. Calculate optimal speed (0.8x - 1.5x clamp)
4. Apply video speed adjustment
5. Merge audio with AAC encoding
6. Round-robin assignment for multiple outputs

### 4.5 FFmpeg Integration

**Configuration**:
```env
FFMPEG_PATH="C:/path/to/ffmpeg.exe"
FFPROBE_PATH="C:/path/to/ffprobe.exe"
```

**Static Binary**: Bundled FFmpeg 4.4+ for consistent behavior

**Usage Pattern**:
```typescript
fluent-ffmpeg(inputPath)
  .input(video1)
  .input(video2)
  .complexFilter(filterString)
  .videoCodec('libx264')
  .audioCodec('aac')
  .outputOptions(['-preset', 'fast'])
  .on('progress', updateJobProgress)
  .on('error', handleError)
  .on('end', () => saveOutput())
  .save(outputPath)
```

**Process Management**:
- Store FFmpeg process PID with job
- Monitor stderr for progress updates
- Kill process tree on cancellation
- Cleanup temp files after processing

### 4.6 Database Schema

**File**: `Apps/VideoMixPro/prisma/schema.prisma`

**Key Models**:

```prisma
User {
  id, email, password, firstName, lastName
  credits         Int @default(0)     // Synced from MainApp
  licenseType     String @default("FREE")
  role            String @default("USER")
  isActive        Boolean @default(true)
  lastLoginAt     DateTime?
  createdAt, updatedAt

  projects[]
  creditTransactions[]
  payments[]
  notifications[]
}

Project {
  id, userId
  name, description
  status          String @default("DRAFT")  // DRAFT|PROCESSING|COMPLETED|FAILED
  outputCount     Int @default(0)
  settings        String                     // JSON stored as text
  createdAt, updatedAt

  videoFiles[]
  videoGroups[]
  voiceOverFiles[]
  processingJobs[]
}

VideoFile {
  id, projectId, groupId?
  originalName, filename, path
  size            Int
  duration        Float
  format, resolution
  uploadedAt

  project  Project
  group    VideoGroup?
}

VideoGroup {
  id, projectId
  name
  order           Int
  createdAt

  videoFiles[]
  project    Project
}

VoiceOverFile {
  id, projectId
  originalName, filename, path
  size            Int
  duration        Float
  format
  order           Int @default(0)
  uploadedAt

  project  Project
}

ProcessingJob {
  id, projectId
  status          String @default("PENDING")  // PENDING|PROCESSING|COMPLETED|FAILED|CANCELLED
  progress        Int @default(0)             // 0-100
  startedAt       DateTime?
  completedAt     DateTime?
  errorMessage    String?
  creditsUsed     Int @default(0)
  outputCount     Int @default(1)
  refundedAt      DateTime?
  settings        String?                     // JSON
  mainAppTransactionId String?                // For refunds
  createdAt

  outputFiles[]
  project     Project
}

OutputFile {
  id, jobId
  filename, path
  size            Int
  duration        Float
  metadata        String                      // JSON
  sourceFiles     String                      // JSON array
  createdAt

  job ProcessingJob
}

CreditTransaction {
  id, userId
  amount          Int
  type            String                      // USAGE|REFUND|PURCHASE
  description     String
  referenceId     String?                     // Job/project ID
  paymentId       String?
  createdAt

  user    User
  payment Payment?
}
```

### 4.7 Credit Integration with MainApp

**Service**: `src/services/mainapp-credit.service.ts`

**Flow**:
1. User triggers processing
2. Calculate required credits
3. Check balance via MainApp API: `GET /api/mainapp/credits/balance`
4. Deduct credits: `POST /api/mainapp/credits/deduct`
5. Store MainApp transaction ID in ProcessingJob
6. Execute video processing
7. **On failure**: Refund via `POST /api/mainapp/credits/refund`

**VideoMix Adapter** (`src/videomix-adapter.ts`):
- Syncs user data between MainApp and VideoMixPro databases
- On every authenticated request:
  1. Fetch user from MainApp database
  2. Create/update user in VideoMixPro database
  3. Sync credit balance from MainApp
- Provides Hono endpoints for simplified integration

---

## 5. CarouselGeneratorPro - AI Image Generator

### 5.1 Purpose & Features

**Core Purpose**: AI-powered carousel generation for social media (Instagram, LinkedIn, TikTok)

**Key Features**:
- AI content generation via Anthropic Claude
- 9 preset text styles with visual effects
- Bulk generation with combination algorithm
- Canvas-based image rendering (1080x1080)
- Brand watermarking and logos
- Multiple export formats (PNG, JPG, PDF, JSON)
- Credit-based pricing

### 5.2 Frontend Architecture

**Technology**: React 18 + TypeScript + Vite + Zustand + Tailwind CSS + Radix UI

**Location**: `Apps/CarouselGeneratorPro/frontend/`

**Build Tool**: Vite (faster than CRA)

**Key Pages**:
```typescript
/carousel/dashboard          - Overview, project list
/carousel/editor/:id         - Main carousel editor
/carousel/bulk-generator     - Bulk generation workflow
/carousel/projects           - Project management
/carousel/credits            - Credit usage tracking
```

**State Management** (Zustand):
```typescript
carouselStore = {
  document: CarouselDocument | null
  selectedSlideIndex: number
  selectedElementId: string | null

  // Actions
  addSlide(), updateSlide(), deleteSlide()
  addElement(), updateElement(), deleteElement()
  selectSlide(), selectElement()
  updateTheme(), updateBrand()
}
```

**Key Components**:
- **CarouselEditor**: Main canvas editor with drag-and-drop
- **SlidePanel**: Slide thumbnail navigation
- **ElementPanel**: Element properties editor
- **AIPanel**: Prompt input and AI generation
- **BulkGenerator**: Multi-slide bulk configuration
- **StyleSelector**: 9 text style previews

### 5.3 Backend Architecture (Hono)

**Location**: `Apps/CarouselGeneratorPro/backend/src/`

**Entry Point**: `index.ts` (Hono server)

**API Endpoints**:
```typescript
POST   /bulk-generate         - Generate bulk carousel sets
POST   /generate             - Generate single carousel (AI or manual)
POST   /projects             - Create carousel project
GET    /projects             - List projects
GET    /project/:id          - Project details
PUT    /projects/:id         - Update project
DELETE /projects/:id          - Delete project
GET    /project/:id/download - Download outputs
GET    /outputs/*            - Serve generated images
GET    /downloads/:filename  - Download ZIP archives
GET    /health               - Health check
```

### 5.4 Core Services

**Carousel AI Service** (`backend/src/services/carousel-ai.service.ts`)

**Anthropic Claude Integration**:
- **Model**: claude-3-haiku-20240307 (fast, cost-effective)
- **Max Tokens**: 4000
- **Temperature**: 0.7
- **Cost**: 5 credits per generation

**Generation Process**:
```typescript
generateCarouselWithAI(prompt, options) → Slide[] {
  1. Build system prompt with style guidelines
  2. Construct user prompt with requirements
  3. Call Anthropic API
  4. Parse JSON response
  5. Map to Slide objects with elements
  6. Apply default animations and styling
  7. Fallback to templates if AI fails
}
```

**Prompt Templates**:
- Instagram Tips
- LinkedIn Professional Post
- Tutorial Steps
- Product Features
- Event Announcement
- Quote/Inspiration
- Statistics/Data
- Before/After

**Visual Styles**:
- **Professional**: Clear, data-focused, formal
- **Creative**: Engaging, metaphors, colorful
- **Minimal**: 3-4 bullet points max, clean
- **Playful**: Fun, casual, emojis

**Image Generator Service** (`backend/src/services/image-generator.service.ts`)

**Canvas Rendering Pipeline**:
```typescript
generateImage(slide, settings) → Buffer {
  1. Create 1080x1080 canvas
  2. Render background (solid/gradient/pattern/image)
  3. Render elements by z-index:
     - Images (z-index 0): Center crop
     - Text (z-index 10): With style effects
  4. Apply brand overlays (logo, handle)
  5. Add page numbers
  6. Export PNG buffer
}
```

**Text Style Effects**:
```
Modern:      Bold with shadow
TikTok:      Uppercase with stroke outline
Instagram:   Gradient background box
Elegant:     Italic cursive with shadow
Classic:     Serif with border lines
Minimalist:  Lowercase with letter spacing
Y2K:         Neon glow (magenta/cyan)
Kinetic:     RGB chromatic shift
Sketch:      Rotated with rough background
```

**Bulk Generator Service** (`backend/src/services/bulk-generator.service.ts`)

**Combination Algorithm**:
```typescript
For each set (setIndex):
  For each slide (slideIndex):
    textIndex = (setIndex + slideIndex) % totalTexts
    imageIndex = (setIndex + slideIndex) % totalImages
    Create slide: texts[textIndex] + images[imageIndex]
```

**Features**:
- Rotation ensures variety across sets
- Each slide: 1 image + 1 text combo
- Configurable text style, position, alignment, font size
- Individual ZIP per set + master ZIP
- Cost: 1 credit per set

**Credit Calculator Service** (`backend/src/services/credit-calculator.service.ts`)

**Pricing**:
```typescript
Single carousel:      2 credits
Bulk per set:         1 credit
AI generation:        +1 credit
Template save:        0 credits (free)
PDF export:           0 credits (free)
PowerPoint export:    1 credit
```

### 5.5 Data Structures

**CarouselDocument**:
```typescript
{
  id, version
  metadata: {
    title, description, createdAt, updatedAt, author, tags
  }
  slides: Slide[] {
    id, order, layout
    elements: Element[] {
      id, type, content, position, size, style, zIndex, animation
    }
    background, animations, notes
  }
  settings: {
    showPageNumbers, pageNumberPosition
    slideSize: { width, height, aspectRatio }
    autoPlay, loop, navigation, progress
  }
  theme: { primary, secondary, background, text, accent }
  brand: { name, handle, logo, avatar }
  fonts: { title, subtitle, body }
}
```

**Element Types**:
- `title`: Main heading text
- `subtitle`: Subheading text
- `description`: Body text
- `image`: Background or inline image
- `shape`: Decorative shapes

### 5.6 Database Schema

**File**: `Apps/CarouselGeneratorPro/backend/prisma/schema.prisma`

```prisma
User {
  id, email, password, firstName, lastName
  credits         Int @default(10)
  licenseType     String @default("FREE")
  isActive        Boolean @default(true)
  createdAt, updatedAt

  carouselProjects[]
  creditTransactions[]
}

CarouselProject {
  id, userId
  title
  type            String                  // single|bulk
  content         String                  // JSON stored as text
  creditsUsed     Int @default(0)
  status          String                  // DRAFT|PROCESSING|COMPLETED|FAILED
  slides          Int                     // Slide count
  outputs         String?                 // JSON array
  metadata        String?                 // JSON
  createdAt, updatedAt

  user User
}

CreditTransaction {
  id, userId
  amount          Int
  type            String                  // usage|refund|purchase|bonus
  balance         Int                     // Balance after transaction
  description     String
  metadata        String?                 // JSON
  referenceId     String?
  createdAt

  user User
}
```

### 5.7 File Organization

**Output Structure**:
```
Apps/CarouselGeneratorPro/backend/outputs/
  bulk/
    {projectId}/
      set-1-slide-1.png
      set-1-slide-2.png
      set-1.zip
      set-2.zip
      download.zip (master)
  carousel/
    {projectId}/
      slide-1.png
      slide-2.png
  downloads/
    {filename}.zip
```

---

## 6. Framework - Shared Components

### 6.1 Structure

**Location**: `Framework/`

```
Framework/
├── auth/
│   ├── backend/           # Authentication service
│   │   ├── AuthService    # JWT generation, validation
│   │   ├── IUserRepository # User data interface
│   │   └── createAuthRoutes # Express/Hono route factory
│   └── frontend/          # React auth components
│       ├── AuthProvider   # Context provider
│       ├── LoginForm      # Reusable login
│       └── RegisterForm   # Reusable registration
├── billing/
│   ├── backend/           # Payment service
│   │   ├── PaymentService # Payment lifecycle
│   │   ├── IPaymentRepository
│   │   └── ICreditRepository
│   └── frontend/          # Payment UI components
├── shared/
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Common utilities
│   └── constants/        # Shared constants
└── serverAuth.ts          # Server-level auth middleware
```

### 6.2 Authentication Module

**Backend** (`Framework/auth/backend/`):

**AuthService**:
```typescript
class AuthService {
  constructor(config, userRepository)

  register(email, password, userData) → { user, token }
  login(email, password) → { user, token }
  validateToken(token) → userId
  generateToken(userId, email) → JWT
  hashPassword(password) → hash
  comparePassword(password, hash) → boolean
}
```

**Usage**:
```typescript
import { AuthService, IUserRepository } from '@framework/auth-backend';

const authService = new AuthService(
  { jwtSecret: process.env.JWT_SECRET },
  new PrismaUserRepository()
);

const { user, token } = await authService.login(email, password);
```

**Frontend** (`Framework/auth/frontend/`):

**AuthProvider**:
```typescript
<AuthProvider authService={authService}>
  <App />
</AuthProvider>

// Inside components
const { user, login, logout, isAuthenticated } = useAuth();
```

### 6.3 Billing Module

**Backend** (`Framework/billing/backend/`):

**PaymentService**:
```typescript
class PaymentService {
  createPayment(userId, amount, description)
  markAsPaid(paymentId, method)
  refundPayment(paymentId, reason)
  getUserPayments(userId)
  getPaymentStatistics(userId)
}
```

**Credit Management**:
```typescript
class CreditService {
  getUserCredits(userId) → number
  addCredits(userId, amount, description)
  deductCredits(userId, amount, description)
  refundCredits(userId, amount, referenceId)
  getTransactionHistory(userId)
}
```

### 6.4 Shared Types

**Location**: `Framework/shared/types/`

```typescript
// User
interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  credits: number
  role: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Authentication
interface AuthResponse {
  user: User
  token: string
  expiresIn: string
}

// Payment
interface Payment {
  id: string
  userId: string
  amount: number
  credits: number
  status: PaymentStatus
  paymentMethod?: string
  createdAt: Date
}

enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

// Credit Transaction
interface CreditTransaction {
  id: string
  userId: string
  amount: number
  balance: number
  type: TransactionType
  description: string
  referenceId?: string
  createdAt: Date
}

enum TransactionType {
  PURCHASE = 'purchase',
  USAGE = 'usage',
  REFUND = 'refund',
  BONUS = 'bonus'
}
```

### 6.5 Server-Level Authentication

**File**: `Framework/auth/serverAuth.ts`

**Middleware**:
```typescript
// Frontend route protection
authCheckMiddleware(c, next) {
  const token = getCookie(c, 'authToken')
  if (!token) return c.redirect('/login')

  try {
    verifyToken(token)
    return next()
  } catch {
    return c.redirect('/login')
  }
}

// API endpoint protection
apiAuthMiddleware(c, next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  c.set('userId', payload.userId)
  return next()
}
```

---

## 7. Credit System Architecture

### 7.1 Design Principles

**Centralized Authority**: MainApp is the single source of truth
- Only MainApp database stores authoritative credit balance
- Sub-apps never directly modify credit balances
- All credit operations go through MainApp API

**Atomic Operations**: Transaction-based credit management
- Deduction and transaction record creation in single DB transaction
- Rollback on failure ensures consistency
- No race conditions or partial updates

**Audit Trail**: Complete transaction history
- Every credit change recorded with metadata
- Reference IDs link transactions to source entities
- Balance snapshots stored per transaction

### 7.2 Credit Flow

**Purchase Flow**:
```
1. User selects package in MainApp
2. Payment created (status: pending)
3. User completes payment via Duitku
4. Duitku webhook triggers
5. Validate signature
6. Atomic operation:
   - Update payment status = success
   - Increment user credits
   - Create transaction (type: purchase)
7. User notified
```

**Deduction Flow** (VideoMixPro example):
```
1. User starts video processing
2. VideoMixPro calculates required credits
3. VideoMixPro calls MainApp: POST /api/mainapp/credits/deduct
   Body: { userId, amount, description, referenceId }
4. MainApp atomic operation:
   - Check balance >= amount
   - Decrement user credits
   - Create transaction (type: usage)
   - Return transaction ID
5. VideoMixPro stores transaction ID in job
6. Processing begins
```

**Refund Flow**:
```
1. Processing fails in VideoMixPro
2. VideoMixPro calls MainApp: POST /api/mainapp/credits/refund
   Body: { userId, amount, referenceId, reason }
3. MainApp atomic operation:
   - Increment user credits
   - Create transaction (type: refund)
   - Link to original transaction
4. User credits restored
5. Job marked as failed
```

### 7.3 API Contract

**Credit Endpoints** (MainApp):

```typescript
// Check balance
GET /api/mainapp/credits/balance
Headers: Authorization: Bearer {token}
Response: { balance: number }

// Check sufficient credits
POST /api/mainapp/credits/check
Body: { amount: number }
Response: { sufficient: boolean, balance: number }

// Deduct credits
POST /api/mainapp/credits/deduct
Body: {
  userId: string
  amount: number
  description: string
  referenceId?: string
  referenceType?: string
}
Response: {
  success: boolean
  transactionId: string
  remainingCredits: number
}

// Refund credits
POST /api/mainapp/credits/refund
Body: {
  userId: string
  amount: number
  referenceId: string
  reason: string
}
Response: {
  success: boolean
  transactionId: string
  newBalance: number
}

// Transaction history
GET /api/mainapp/credits/transactions?limit=50&offset=0
Response: {
  transactions: CreditTransaction[]
  total: number
}
```

### 7.4 Pricing Models

**VideoMixPro**:
- Base: 1 credit per output video
- Volume discounts: Up to 20% off (101-200 videos)
- Complexity multipliers: Order mixing, speed variations, voice-over
- Quality multipliers: Resolution, bitrate, frame rate
- Server load protection: Additional charge for 200+ outputs

**CarouselGeneratorPro**:
- Single carousel: 2 credits
- Bulk generation: 1 credit per set
- AI generation: +1 credit
- Exports: Free (PDF), 1 credit (PPT)

### 7.5 Credit Synchronization

**VideoMixPro Adapter** (`Apps/VideoMixPro/src/videomix-adapter.ts`):

**On Every Authenticated Request**:
```typescript
1. Extract JWT token from Authorization header
2. Verify token and get userId
3. Fetch user from MainApp database
4. Check if user exists in VideoMixPro database
   - If not: Create user record
   - If yes: Update user record
5. Sync credit balance from MainApp to VideoMixPro
6. Proceed with request
```

**Benefits**:
- Always displays accurate balance in VideoMixPro UI
- No stale data issues
- Seamless user experience across apps

---

## 8. Authentication & SSO

### 8.1 JWT-Based Authentication

**Token Structure**:
```typescript
{
  userId: string
  email: string
  role: string
  iat: number      // Issued at
  exp: number      // Expiry (7 days)
}
```

**Configuration**:
- Secret: `process.env.JWT_SECRET` (shared across all apps)
- Algorithm: HS256
- Expiry: 7 days

### 8.2 Session Storage

**Database Sessions**:
- Stored in `Session` table (MainApp database)
- Linked to user via foreign key
- Allows token invalidation on logout

**Client Storage**:
- localStorage keys: `token`, `authToken`, `user`
- `token`: Used for API calls (Authorization header)
- `authToken`: Used for SSO cookie
- `user`: Cached user data (JSON)

### 8.3 Single Sign-On (SSO) Flow

**Session Creation Endpoint**: `POST /api/session/create` (Main server)

**Process**:
```
1. User logged in MainApp (has JWT token)
2. User clicks "Launch VideoMixPro" button
3. Frontend calls: POST /api/session/create
   Headers: Authorization: Bearer {token}
4. Server validates token
5. Server sets HTTP-only cookie:
   Name: authToken
   Value: {JWT token}
   HttpOnly: true
   Secure: true (in production)
   SameSite: Lax
   Path: /
   MaxAge: 7 days
6. Frontend redirects to /videomix
7. Server checks authToken cookie before serving /videomix
8. VideoMixPro extracts token from cookie
9. VideoMixPro validates token with same JWT secret
10. VideoMixPro syncs user from MainApp database
11. User authenticated in VideoMixPro
```

**Security**:
- HTTP-only cookies prevent XSS attacks
- Same-origin policy enforced
- Token validation on every request
- Session expiry handled by JWT expiration

### 8.4 Protected Route Middleware

**Server-Level Protection** (`server.ts`):

```typescript
// Protect VideoMixPro static files
app.use('/videomix/static/*', authCheckMiddleware, serveStatic(...))

// Protect VideoMixPro SPA
app.use('/videomix/*', authCheckMiddleware, async (c) => {
  // Serve index.html or static assets
})

// Protect Carousel static files
app.use('/carousel/static/*', authCheckMiddleware, serveStatic(...))

// Protect Carousel SPA
app.use('/carousel/*', authCheckMiddleware, async (c) => {
  // Serve index.html or static assets
})
```

**authCheckMiddleware**:
```typescript
async function authCheckMiddleware(c, next) {
  const token = getCookie(c, 'authToken')

  if (!token) {
    // Redirect to MainApp login with return URL
    return c.redirect(`/?redirect=${encodeURIComponent(c.req.path)}`)
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch (error) {
    return c.redirect('/?error=session_expired')
  }
}
```

**API-Level Protection**:
```typescript
// MainApp API middleware
app.use('/api/mainapp/credits/*', authMiddleware)
app.use('/api/mainapp/payment/*', authMiddleware)

// VideoMixPro API middleware
app.use('/api/v1/projects', authenticate)
app.use('/api/v1/videos', authenticate)
app.use('/api/v1/processing', authenticate)

// Carousel API middleware
app.use('/projects', authMiddleware)
app.use('/generate', authMiddleware)
```

### 8.5 Authentication Middleware Implementation

**MainApp** (`backend/middleware/auth.middleware.ts`):
```typescript
export async function authMiddleware(c, next) {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'No token provided' }, 401)
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !user.isActive) {
      return c.json({ error: 'User not found or inactive' }, 401)
    }

    c.set('userId', user.id)
    c.set('userEmail', user.email)
    c.set('userRole', user.role)
    c.set('user', user)

    return next()
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
```

**VideoMixPro** (`src/middleware/auth.middleware.ts`):
```typescript
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    req.userId = user.id
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
```

---

## 9. Database Architecture

### 9.1 Multi-Database Strategy

**Rationale**: Each application maintains its own database for:
- Service isolation
- Independent scaling
- Technology flexibility
- Clear ownership

**Databases**:
```
MainApp:          Apps/MainApp/prisma/dev.db
VideoMixPro:      Apps/VideoMixPro/prisma/dev.db
CarouselGenPro:   Apps/CarouselGeneratorPro/backend/prisma/dev.db
```

**Data Ownership**:
- **MainApp**: Users (auth), Credits (authority), Payments, Sessions
- **VideoMixPro**: Projects, Videos, Groups, Jobs, Outputs
- **CarouselGenPro**: Carousel Projects, Slides

### 9.2 Cross-Database References

**User Synchronization**:
- MainApp user ID used as foreign key in sub-app databases
- Sub-apps sync user records via API calls
- No direct foreign key constraints across databases

**Credit Balance**:
- MainApp stores authoritative balance
- Sub-apps cache balance locally for display
- Real-time sync on every authenticated request

### 9.3 Schema Management (Prisma)

**Development Workflow**:
```bash
# Make schema changes
edit Apps/MainApp/prisma/schema.prisma

# Generate migration
cd Apps/MainApp
npx prisma migrate dev --name add_field

# Generate Prisma Client
npx prisma generate

# View data
npx prisma studio
```

**Production Deployment**:
```bash
# Apply migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### 9.4 Database Providers

**Development**: SQLite
- File-based, no installation required
- Fast for local development
- Suitable for single-server deployments

**Production**: PostgreSQL
- Robust for multi-user environments
- ACID compliance
- Better concurrency handling
- Scalable

**Provider Configuration** (`schema.prisma`):
```prisma
datasource db {
  provider = "sqlite"  // or "postgresql"
  url      = env("DATABASE_URL")
}
```

**Environment Variables**:
```env
# Development (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# Production (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### 9.5 Transaction Patterns

**Atomic Credit Operations** (MainApp):
```typescript
// Deduct credits with transaction
const result = await prisma.$transaction(async (tx) => {
  // Check balance
  const user = await tx.user.findUnique({
    where: { id: userId }
  })

  if (user.credits < amount) {
    throw new Error('Insufficient credits')
  }

  // Deduct credits
  const updatedUser = await tx.user.update({
    where: { id: userId },
    data: { credits: { decrement: amount } }
  })

  // Create transaction record
  const transaction = await tx.creditTransaction.create({
    data: {
      userId,
      amount: -amount,
      balance: updatedUser.credits,
      type: 'usage',
      description,
      referenceId,
      referenceType
    }
  })

  return { user: updatedUser, transaction }
})
```

**Processing Job Creation** (VideoMixPro):
```typescript
// Create job and deduct credits atomically
const job = await prisma.processingJob.create({
  data: {
    projectId,
    status: 'PENDING',
    creditsUsed,
    settings: JSON.stringify(settings)
  }
})

try {
  // Call MainApp to deduct credits
  const deductResult = await mainAppCreditService.deductCredits(
    userId, creditsUsed, `Video processing job ${job.id}`
  )

  // Store transaction ID for potential refund
  await prisma.processingJob.update({
    where: { id: job.id },
    data: { mainAppTransactionId: deductResult.transactionId }
  })

  // Queue processing
  await processVideo(job.id)
} catch (error) {
  // Delete job if credit deduction failed
  await prisma.processingJob.delete({ where: { id: job.id } })
  throw error
}
```

---

## 10. Deployment & Infrastructure

### 10.1 Development Environment

**Requirements**:
- Bun 1.0+
- Node.js 18+ (for compatibility)
- FFmpeg 4.4+ (bundled or system-installed)

**Startup Sequence**:
```bash
# 1. Install dependencies
bun install

# 2. Generate Prisma clients
cd Apps/MainApp && bun prisma:generate && cd ../..
cd Apps/VideoMixPro && bun db:generate && cd ../..
cd Apps/CarouselGeneratorPro/backend && bun prisma generate && cd ../../..

# 3. Push database schemas
cd Apps/MainApp && bun prisma:push && cd ../..
cd Apps/VideoMixPro && bun db:setup && cd ../..
cd Apps/CarouselGeneratorPro/backend && bun prisma db push && cd ../../..

# 4. Build frontends
cd Apps/MainApp && bun build && cd ../..
cd Apps/VideoMixPro/frontend && bun build && cd ../../..
cd Apps/CarouselGeneratorPro/frontend && bun build && cd ../../..

# 5. Start unified server
bun run dev  # or: bun server.ts
```

**Server URLs**:
```
MainApp:           http://localhost:8001/
VideoMixPro:       http://localhost:8001/videomix
CarouselGenPro:    http://localhost:8001/carousel

MainApp API:       http://localhost:8001/api/mainapp
VideoMixPro API:   http://localhost:8001/api/videomix
Carousel API:      http://localhost:8001/api/carousel
```

### 10.2 Environment Configuration

**Root `.env`**:
```env
PORT=8001
NODE_ENV=development
JWT_SECRET=your-jwt-secret-change-in-production
```

**MainApp `.env`** (`Apps/MainApp/.env`):
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=your-jwt-secret-change-in-production

# Duitku Payment
DUITKU_MERCHANT_CODE=your-merchant-code
DUITKU_API_KEY=your-api-key
DUITKU_ENV=sandbox
DUITKU_CALLBACK_URL=http://localhost:8001/api/mainapp/payment/callback
DUITKU_RETURN_URL=http://localhost:8001/payment/status
```

**VideoMixPro `.env`** (`Apps/VideoMixPro/.env`):
```env
DATABASE_URL="file:./prisma/dev.db"
DATABASE_PROVIDER="sqlite"
NODE_ENV=development
PORT=3002
JWT_SECRET=your-jwt-secret-change-in-production
FRONTEND_URL="http://localhost:8001"

# FFmpeg Paths
FFMPEG_PATH="C:/path/to/ffmpeg.exe"
FFPROBE_PATH="C:/path/to/ffprobe.exe"

# MainApp Integration
MAIN_APP_URL="http://localhost:8001"
```

**CarouselGenPro `.env`** (`Apps/CarouselGeneratorPro/backend/.env`):
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=your-jwt-secret-change-in-production
ANTHROPIC_API_KEY=your-anthropic-api-key
NODE_ENV=development
```

### 10.3 Production Deployment

**Infrastructure Requirements**:
- Server: 4 CPU cores, 8GB RAM minimum
- Storage: SSD for video processing, 100GB+ free space
- Database: PostgreSQL 13+ (managed service recommended)
- FFmpeg: System-installed or containerized

**Docker Deployment** (recommended):

**Dockerfile** (VideoMixPro example):
```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy workspace root for monorepo dependencies
COPY package.json bun.lock ./
COPY Apps/VideoMixPro ./Apps/VideoMixPro
COPY Framework ./Framework

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
WORKDIR /app/Apps/VideoMixPro
RUN npx prisma generate

# Build backend
RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13-alpine
    environment:
      POSTGRES_USER: videomix
      POSTGRES_PASSWORD: secure-password
      POSTGRES_DB: videomix_production
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  mainapp:
    build:
      context: .
      dockerfile: Apps/MainApp/Dockerfile
    environment:
      DATABASE_URL: postgresql://videomix:secure-password@postgres:5432/mainapp
      JWT_SECRET: ${JWT_SECRET}
      DUITKU_MERCHANT_CODE: ${DUITKU_MERCHANT_CODE}
      DUITKU_API_KEY: ${DUITKU_API_KEY}
    ports:
      - "8001:8001"
    depends_on:
      - postgres

  videomix:
    build:
      context: .
      dockerfile: Apps/VideoMixPro/Dockerfile
    environment:
      DATABASE_URL: postgresql://videomix:secure-password@postgres:5432/videomix
      JWT_SECRET: ${JWT_SECRET}
      MAIN_APP_URL: http://mainapp:8001
    volumes:
      - video_uploads:/app/uploads
      - video_outputs:/app/outputs
    depends_on:
      - postgres

  carousel:
    build:
      context: .
      dockerfile: Apps/CarouselGeneratorPro/Dockerfile
    environment:
      DATABASE_URL: postgresql://videomix:secure-password@postgres:5432/carousel
      JWT_SECRET: ${JWT_SECRET}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    volumes:
      - carousel_outputs:/app/outputs
    depends_on:
      - postgres

volumes:
  postgres_data:
  video_uploads:
  video_outputs:
  carousel_outputs:
```

**Deployment Checklist**:
- [ ] Update all JWT_SECRET values to strong random strings
- [ ] Configure PostgreSQL connection strings
- [ ] Update CORS origins to production domain
- [ ] Configure Duitku with production credentials
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure file storage (AWS S3 or similar)
- [ ] Set up logging and monitoring (Sentry, LogRocket)
- [ ] Configure automated backups (daily database snapshots)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure rate limiting on APIs
- [ ] Set up health check endpoints
- [ ] Configure process manager (PM2 or systemd)

### 10.4 Scaling Considerations

**Horizontal Scaling**:
- Stateless design allows multiple server instances
- Load balancer (nginx) distributes traffic
- Shared PostgreSQL for all instances
- Shared file storage (S3) for uploads/outputs

**Database Scaling**:
- Read replicas for VideoMixPro (heavy reads)
- Connection pooling (PgBouncer)
- Database indexing on frequently queried fields

**Video Processing Scaling**:
- Dedicated worker nodes for FFmpeg processing
- Queue system (Bull + Redis) for job distribution
- Horizontal scaling of worker pool

**Caching Strategy**:
- Redis for session storage
- CDN for static assets
- API response caching for metadata

---

## 11. Future Improvement Opportunities

### 11.1 Architecture Improvements

**1. Unified Database for Credits** (High Priority)
- **Current**: Each app has its own credit balance
- **Problem**: Synchronization complexity, potential inconsistency
- **Solution**: Single PostgreSQL database for credits with multi-tenancy
- **Benefits**: Simplified credit management, real-time accuracy

**2. Message Queue for Background Jobs** (High Priority)
- **Current**: In-memory job queue in VideoMixPro
- **Problem**: Jobs lost on server restart, no horizontal scaling
- **Solution**: Implement Bull + Redis for distributed job queue
- **Benefits**: Persistent jobs, scalable workers, retry mechanisms

**3. Centralized Logging** (Medium Priority)
- **Current**: Console.log scattered across services
- **Problem**: Difficult to debug production issues
- **Solution**: Implement structured logging (Winston) + centralized storage (ELK or Datadog)
- **Benefits**: Searchable logs, alerting, debugging

**4. API Gateway with Rate Limiting** (Medium Priority)
- **Current**: Each app handles its own rate limiting
- **Problem**: No global rate limits, DDoS vulnerability
- **Solution**: Kong or custom Hono middleware with Redis
- **Benefits**: Protection, throttling, analytics

**5. Microservices Communication** (Low Priority)
- **Current**: Direct HTTP calls between services
- **Problem**: Tight coupling, no retry logic
- **Solution**: Event-driven architecture with RabbitMQ or Kafka
- **Benefits**: Loose coupling, resilience, scalability

### 11.2 VideoMixPro Improvements

**1. Transition Effects** (High Priority)
- **Current**: Basic concatenation
- **Feature**: Add transitions (fade, dissolve, wipe, zoom)
- **Implementation**: FFmpeg xfade filter
- **Complexity**: Medium (requires filter chain modification)

**2. Color Grading Variations** (Medium Priority)
- **Feature**: Apply different LUTs/color filters per output
- **Use Case**: Additional anti-fingerprinting layer
- **Implementation**: FFmpeg colorchannelmixer, curves, lut3d filters

**3. Audio Ducking** (Medium Priority)
- **Feature**: Lower music volume when voice-over is speaking
- **Implementation**: FFmpeg sidechaincompress filter

**4. Video Trimming UI** (High Priority)
- **Current**: Smart trimming only
- **Feature**: Manual trim points per video with timeline UI
- **UX**: Drag handles on video timeline

**5. Batch Download Progress** (Low Priority)
- **Current**: Download starts after ZIP creation
- **Feature**: Real-time ZIP creation progress
- **Implementation**: Server-sent events or WebSocket

**6. Template Presets** (Medium Priority)
- **Feature**: Save and load processing configurations
- **Use Case**: Quick setup for recurring tasks
- **Storage**: User preferences in database

### 11.3 CarouselGeneratorPro Improvements

**1. Video Carousels** (High Priority)
- **Feature**: Support short video clips (3-5 seconds) per slide
- **Use Case**: Instagram Reels carousels, TikTok photo slideshows
- **Implementation**: FFmpeg image-to-video + concat

**2. Animation Effects** (High Priority)
- **Feature**: Ken Burns effect, slide-in, fade transitions
- **Implementation**: CSS animations for preview, canvas rendering for export

**3. Stock Image Integration** (Medium Priority)
- **Feature**: Search and insert Unsplash/Pexels images
- **API**: Unsplash API, Pexels API
- **Cost**: 0 credits (free APIs)

**4. Collaboration Features** (Low Priority)
- **Feature**: Share projects, invite team members
- **Database**: Add ProjectMember table
- **Permissions**: Owner, editor, viewer

**5. Template Marketplace** (Low Priority)
- **Feature**: Browse and purchase/download carousel templates
- **Monetization**: Premium templates, creator payouts

**6. Multi-Language AI** (Medium Priority)
- **Current**: Supports multiple languages but not optimized
- **Feature**: Language-specific prompt templates
- **Enhancement**: Fine-tune prompts for non-English outputs

### 11.4 MainApp Improvements

**1. Subscription Plans** (High Priority)
- **Current**: Pay-per-use credits
- **Feature**: Monthly/annual subscriptions with included credits
- **Benefits**: Recurring revenue, user loyalty
- **Pricing**: Starter (50K/month), Pro (200K/month), Enterprise (unlimited)

**2. Usage Analytics Dashboard** (Medium Priority)
- **Feature**: Charts for credit usage over time
- **Graphs**: Daily/weekly/monthly consumption, app breakdown
- **Library**: Chart.js or Recharts

**3. Referral Program** (Low Priority)
- **Feature**: Earn credits by referring friends
- **Mechanics**: Unique referral codes, 20% bonus on first purchase
- **Storage**: Referral table with attribution

**4. Admin Panel** (High Priority)
- **Feature**: Manage users, view transactions, generate reports
- **Routes**: `/admin` (protected, role-based)
- **Features**: User search, credit adjustment, usage reports

**5. Email Notifications** (Medium Priority)
- **Triggers**: Payment success, low credits, job completion, job failure
- **Service**: SendGrid or AWS SES
- **Templates**: Handlebars email templates

**6. Multi-Factor Authentication** (Medium Priority)
- **Feature**: TOTP (Google Authenticator) for enhanced security
- **Library**: speakeasy for TOTP generation

### 11.5 Technical Debt & Refactoring

**1. TypeScript Strict Mode** (Medium Priority)
- **Current**: Some files have relaxed type checking
- **Goal**: Enable `strict: true` in all tsconfig.json
- **Benefit**: Catch bugs at compile time

**2. Unit Test Coverage** (High Priority)
- **Current**: Minimal test coverage
- **Goal**: 80% coverage for services and controllers
- **Framework**: Jest with @testing-library/react

**3. API Documentation** (High Priority)
- **Current**: Documentation in Markdown files
- **Goal**: Interactive API docs (Swagger/OpenAPI)
- **Tool**: swagger-jsdoc + swagger-ui-express

**4. Environment Variable Validation** (Medium Priority)
- **Current**: No validation, crashes on missing vars
- **Solution**: Zod schema validation on startup
- **Benefit**: Clear error messages, fail fast

**5. Database Migration Management** (Medium Priority)
- **Current**: Manual migration running
- **Solution**: Automated migrations in CI/CD
- **Tool**: Prisma migrate deploy in deployment scripts

**6. Frontend State Management** (Low Priority)
- **VideoMixPro**: Consider Zustand for complex state
- **MainApp**: React Query for server state caching
- **Benefit**: Reduced boilerplate, better caching

### 11.6 Performance Optimizations

**1. FFmpeg Hardware Acceleration** (High Priority)
- **Feature**: GPU-accelerated video encoding (NVENC, QuickSync)
- **Benefit**: 5-10x faster processing
- **Configuration**: FFmpeg compiled with CUDA/NVENC support

**2. Lazy Loading Components** (Medium Priority)
- **Current**: All React components loaded upfront
- **Solution**: React.lazy() + Suspense
- **Benefit**: Faster initial page load

**3. Image Optimization** (Medium Priority)
- **Feature**: WebP format for carousel thumbnails
- **Tool**: Sharp for server-side conversion
- **Benefit**: 30-50% smaller file sizes

**4. CDN for Static Assets** (High Priority in Production)
- **Feature**: Serve JS/CSS/images from CloudFlare or AWS CloudFront
- **Benefit**: Faster global load times, reduced server load

**5. Database Query Optimization** (Medium Priority)
- **Action**: Add indexes on frequently queried fields
- **Fields**: `User.email`, `Project.userId`, `ProcessingJob.status`
- **Benefit**: Faster query execution

**6. Video Thumbnail Generation** (Low Priority)
- **Feature**: Extract thumbnails for video preview
- **Implementation**: FFmpeg frame extraction
- **Benefit**: Better UX in project view

### 11.7 Security Enhancements

**1. Input Validation** (High Priority)
- **Current**: Basic validation
- **Enhancement**: Comprehensive Zod schemas for all endpoints
- **Benefit**: Prevent injection attacks, data corruption

**2. Rate Limiting per User** (High Priority)
- **Current**: Global rate limits
- **Feature**: Per-user API call limits
- **Storage**: Redis with sliding window
- **Benefit**: Fair usage, abuse prevention

**3. File Upload Validation** (High Priority)
- **Current**: Basic MIME type checking
- **Enhancement**: Magic number validation, malware scanning
- **Library**: file-type for magic numbers
- **Benefit**: Prevent malicious uploads

**4. CORS Configuration** (Medium Priority)
- **Current**: Wildcard localhost origins
- **Production**: Strict origin whitelist
- **Benefit**: Prevent CSRF attacks

**5. SQL Injection Prevention** (Low Priority)
- **Current**: Prisma provides protection
- **Action**: Audit raw SQL queries (if any)
- **Benefit**: Defense in depth

**6. Dependency Scanning** (Medium Priority)
- **Tool**: npm audit, Snyk
- **Frequency**: Weekly automated scans
- **Benefit**: Early detection of vulnerabilities

---

## 12. Quick Reference

### 12.1 Key File Locations

**Main Server**:
- `server.ts` - Unified Bun server entry point

**MainApp**:
- Frontend: `Apps/MainApp/src/`
- Backend: `Apps/MainApp/backend/`
- Database: `Apps/MainApp/prisma/dev.db`
- Schema: `Apps/MainApp/prisma/schema.prisma`

**VideoMixPro**:
- Frontend: `Apps/VideoMixPro/frontend/src/`
- Backend: `Apps/VideoMixPro/src/`
- Database: `Apps/VideoMixPro/prisma/dev.db`
- Schema: `Apps/VideoMixPro/prisma/schema.prisma`
- Processing Service: `Apps/VideoMixPro/src/services/video-processing.service.ts`
- Auto-Mixing: `Apps/VideoMixPro/src/services/auto-mixing.service.ts`

**CarouselGeneratorPro**:
- Frontend: `Apps/CarouselGeneratorPro/frontend/src/`
- Backend: `Apps/CarouselGeneratorPro/backend/src/`
- Database: `Apps/CarouselGeneratorPro/backend/prisma/dev.db`
- Schema: `Apps/CarouselGeneratorPro/backend/prisma/schema.prisma`
- AI Service: `Apps/CarouselGeneratorPro/backend/src/services/carousel-ai.service.ts`

**Framework**:
- Auth Backend: `Framework/auth/backend/`
- Auth Frontend: `Framework/auth/frontend/`
- Billing: `Framework/billing/`
- Shared Types: `Framework/shared/types/`

### 12.2 Common Commands

```bash
# Development
bun run dev                    # Start unified server
bun server.ts --hot           # With hot reload

# Build all apps
bun run build:all

# Build specific app
bun run build:videomix
bun run build:carousel
bun run build:mainapp

# Database operations
cd Apps/MainApp && bun prisma:studio       # Open MainApp database GUI
cd Apps/VideoMixPro && npx prisma studio   # Open VideoMixPro database
cd Apps/VideoMixPro && bun db:setup        # Setup VideoMixPro database

# Testing
bun test                       # Run all tests
bun test --watch              # Watch mode

# Cleanup
bun run clean                 # Remove all node_modules
```

### 12.3 Default Credentials

**MainApp** (created by seed script):
```
Admin User:
  Email: admin@videomix.pro
  Password: Admin123!
  Credits: 1000

Demo User:
  Email: demo@example.com
  Password: Demo123!
  Credits: 100
```

### 12.4 Port Configuration

```
Unified Server:         8001
MainApp (standalone):   3001
VideoMixPro Backend:    3002
VideoMixPro Frontend:   3000
Carousel Backend:       3004
Carousel Frontend:      3005
```

### 12.5 Critical Environment Variables

**Required for All**:
- `JWT_SECRET` - Shared secret for JWT tokens (MUST be identical across all apps)
- `NODE_ENV` - development | production

**MainApp**:
- `DUITKU_MERCHANT_CODE` - Duitku merchant identifier
- `DUITKU_API_KEY` - Duitku API key
- `DUITKU_CALLBACK_URL` - Webhook endpoint
- `DUITKU_RETURN_URL` - Success redirect URL

**VideoMixPro**:
- `FFMPEG_PATH` - Absolute path to ffmpeg.exe
- `FFPROBE_PATH` - Absolute path to ffprobe.exe
- `MAIN_APP_URL` - MainApp base URL for credit API

**CarouselGeneratorPro**:
- `ANTHROPIC_API_KEY` - Claude AI API key

---

## Conclusion

This architecture documentation provides a complete technical overview of the Adopted Video Mix Pro platform. The system demonstrates modern SaaS architecture principles with microservices, centralized authentication, atomic credit management, and sophisticated business logic.

**Key Strengths**:
1. **Separation of Concerns**: Clear boundaries between applications
2. **Centralized Credit Authority**: Consistent billing across services
3. **Scalable Architecture**: Stateless design supports horizontal scaling
4. **Comprehensive Features**: Anti-fingerprinting, AI generation, payment integration
5. **Production-Ready**: Transaction safety, error handling, monitoring

**Areas for Enhancement**:
1. Implement distributed job queue (Bull + Redis)
2. Add comprehensive test coverage
3. Enhance monitoring and observability
4. Optimize video processing with GPU acceleration
5. Implement advanced features (transitions, templates, analytics)

**For Future Development**:
When planning improvements, prioritize:
1. High-impact features that increase user value
2. Technical debt reduction for maintainability
3. Performance optimizations for better UX
4. Security enhancements for trust and compliance

This document serves as the single source of truth for understanding the platform architecture. Use it to onboard new developers, plan feature development, and make strategic technical decisions.

---

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Maintained By**: Development Team