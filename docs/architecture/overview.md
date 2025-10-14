# Lumiku App - Architecture Overview

---
**Last Updated:** 2025-10-14
**Version:** 2.0.0
**Status:** Current
**Previous Version:** [CURRENT_ARCHITECTURE.md](../CURRENT_ARCHITECTURE.md) (outdated)
---

## Executive Summary

Lumiku is a comprehensive AI-powered content creation platform featuring 8 specialized applications for video mixing, carousel generation, avatar creation, and AI-powered content generation. The system implements a dual monetization model (Pay-As-You-Go and Subscription) with sophisticated quota and credit management.

**Current State:**
- **8 Production Apps:** Video Mixer, Carousel Mix, Looping Flow, Avatar Creator, Avatar Generator, Pose Generator, Poster Editor, Video Generator
- **35+ Database Models:** Full Prisma schema implementation
- **114+ API Endpoints:** Complete REST API
- **Dual User System:** PAYG (credits) + Subscription (quotas)
- **Payment Integration:** Duitku payment gateway
- **Architecture:** Monolithic with plugin system

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Video   │ │ Carousel │ │  Avatar  │ │   Pose   │      │
│  │  Mixer   │ │   Mix    │ │  Creator │ │Generator │ ... │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API (JSON)
┌─────────────────────┴───────────────────────────────────────┐
│              BACKEND (Express + TypeScript)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Core Services Layer                       │  │
│  │  • Authentication (JWT)  • Authorization             │  │
│  │  • Credit System         • Subscription System       │  │
│  │  • Quota Management      • Payment Processing        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Plugin System (8 Apps)                    │  │
│  │  • Isolated app modules  • Unified registration     │  │
│  │  • App-specific routes   • Credit/quota tracking    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Background Queue (BullMQ + Redis)         │  │
│  │  • Video processing      • AI generation             │  │
│  │  • Image manipulation    • Async operations          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                  DATA & STORAGE LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │    Redis     │  │  File System │     │
│  │  (Primary DB)│  │  (Queue+Cache)│ │   (Uploads)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│               EXTERNAL SERVICES                             │
│  • Hugging Face (Avatar generation)                         │
│  • Anthropic Claude (AI assistance)                         │
│  • Duitku (Payment gateway)                                 │
│  • ModelsLab/Eden AI (Image generation - future)            │
│  • FFmpeg (Video processing)                                │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **State Management:** React Context + Hooks
- **Styling:** Tailwind CSS
- **UI Components:** Lucide React icons, custom components
- **HTTP Client:** Axios with JWT interceptors
- **Routing:** React Router v6

#### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js with TypeScript
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Zod schemas
- **ORM:** Prisma (PostgreSQL)
- **Queue:** BullMQ with Redis
- **File Upload:** Multer
- **Video Processing:** FFmpeg (fluent-ffmpeg wrapper)

#### Database
- **Primary Database:** PostgreSQL (production)
- **Cache & Queue:** Redis
- **Schema Management:** Prisma Migrate
- **Total Models:** 35+ models

#### Infrastructure
- **Deployment:** Coolify (Docker-based)
- **File Storage:** Local filesystem (uploads/)
- **Payment Gateway:** Duitku (Indonesian payment)
- **Process Management:** PM2 (implied)

## Application Architecture

### Plugin System

Lumiku uses a **plugin-based architecture** where each app is an isolated module that registers itself with the core system.

**Plugin Structure:**
```
backend/src/apps/
├── video-mixer/
│   ├── plugin.config.ts    # App metadata and credit costs
│   ├── routes.ts            # Express routes
│   ├── services/            # Business logic
│   ├── repositories/        # Database access
│   ├── workers/             # Background jobs
│   └── types.ts             # TypeScript types
├── carousel-mix/
├── looping-flow/
├── avatar-creator/
└── avatar-generator/
```

**Plugin Configuration:**
```typescript
export const pluginConfig: PluginConfig = {
  appId: 'video-mixer',
  name: 'Video Mixer',
  description: 'Mix multiple short videos into longer videos',
  icon: 'video',
  version: '1.0.0',
  routePrefix: '/api/apps/video-mixer',
  credits: { /* credit costs */ },
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
    order: 5,
    color: 'blue',
    stats: { enabled: true },
  },
}
```

### Implemented Applications

#### 1. Video Mixer
**Purpose:** Mix multiple short videos into longer videos with anti-fingerprinting features
**Route:** `/api/apps/video-mixer`
**Features:**
- Upload multiple videos
- Group videos for sequential/random mixing
- Anti-fingerprinting options (order mixing, different starts, speed variations)
- Quality settings (resolution, bitrate, frame rate, aspect ratio)
- Duration management (fixed or smart distribution)
- Metadata manipulation (CapCut, TikTok, Instagram, YouTube)

**Database Models:** VideoMixerProject, VideoMixerGroup, VideoMixerVideo, VideoMixerGeneration

#### 2. Carousel Mix
**Purpose:** Generate Instagram/social media carousel posts automatically
**Route:** `/api/apps/carousel-mix`
**Features:**
- Position-based slide management (2-8 slides)
- Multiple images/videos per position
- Text variations per position
- Advanced text styling (font, position, shadow, outline)
- Smart combination generation
- Batch carousel creation

**Database Models:** CarouselProject, CarouselSlide, CarouselText, CarouselPositionSettings, CarouselGeneration

#### 3. Looping Flow
**Purpose:** Create seamless video loops with multi-layer audio
**Route:** `/api/apps/looping-flow`
**Features:**
- Perfect seamless loops (crossfade, boomerang)
- Multi-layer audio mixing (up to 4 layers)
- Audio crossfade and fade in/out
- Target duration with loop repetition
- Volume control per layer

**Database Models:** LoopingFlowProject, LoopingFlowVideo, LoopingFlowGeneration, LoopingFlowAudioLayer

#### 4. Avatar Creator
**Purpose:** Create AI avatars with full persona system
**Route:** `/api/apps/avatar-creator`
**Features:**
- Text-to-image avatar generation (FLUX.1-dev + LoRA)
- Upload custom avatars
- Generate from presets
- Full persona system (name, age, personality, background)
- Visual attributes (gender, ethnicity, body type, hair, eyes)
- Usage tracking across apps

**Database Models:** AvatarProject, Avatar, AvatarPreset, PersonaExample, AvatarUsageHistory, AvatarGeneration

#### 5. Avatar Generator
**Purpose:** Generate avatar variations using Hugging Face
**Route:** `/api/apps/avatar-generator`
**Features:**
- Hugging Face Stable Diffusion integration
- Avatar variation generation
- Style customization

**Database Models:** (Uses Avatar models from Avatar Creator)

#### 6. Pose Generator
**Purpose:** Generate avatar poses (frontend)
**Status:** Frontend-only implementation
**Features:**
- Pose template selection
- Avatar pose generation
- Pose customization

#### 7. Poster Editor
**Purpose:** AI-powered image editing and inpainting (frontend)
**Status:** Frontend-only implementation
**Features:**
- Image upload and editing
- AI-powered inpainting
- SAM (Segment Anything Model) integration
- Dual AI mode (quick edit vs advanced)

#### 8. Video Generator
**Purpose:** AI-powered video generation (frontend)
**Status:** Frontend-only implementation
**Features:**
- Text-to-video generation
- Multiple AI models (Veo 3, Kling, Wan2.2)
- Resolution and duration options

## Core Systems

### 1. Authentication & Authorization

**Implementation:** JWT-based authentication with role-based access control

**Key Files:**
- `backend/src/middleware/auth.ts`
- `backend/src/routes/auth.routes.ts`

**User Roles:**
- `user` - Standard user (default)
- `admin` - Administrator with full access

**JWT Configuration:**
- Secret: Minimum 32 characters (enforced)
- Expiration: Configurable (default 7 days)
- Storage: Session table (single device per session)

**Security Features:**
- Password hashing (bcrypt)
- Rate limiting on auth endpoints
- Device tracking
- IP whitelist for payment callbacks

### 2. Dual Monetization System

Lumiku implements a **dual user system** supporting both PAYG and Subscription models.

#### Pay-As-You-Go (PAYG) System
- **Account Type:** `payg`
- **Currency:** Credits
- **Payment:** Purchase credits via Duitku
- **Usage:** Deduct credits per action
- **Tracking:** Credit table with transaction history

#### Subscription System
- **Account Type:** `subscription`
- **Currency:** Quotas (daily/monthly limits)
- **Tiers:** Free, Basic, Pro, Enterprise
- **Benefits:** Access to premium AI models based on tier
- **Tracking:** QuotaUsage table with period-based resets

**See:** [Subscription System Documentation](./subscription-system.md) for complete details.

### 3. AI Model Registry

Centralized registry for all AI models across apps.

**Purpose:**
- Track available AI models per app
- Control access based on subscription tier
- Manage pricing (credits for PAYG, quotas for subscription)
- Monitor model usage and analytics

**Database Model:** AIModel
- `modelKey`: Unique identifier (e.g., "video-generator:veo3")
- `tier`: Access tier (free, basic, pro, enterprise)
- `creditCost`: Base cost for PAYG users
- `quotaCost`: Quota cost for subscription users (1-5)
- `capabilities`: JSON metadata (resolution, duration, etc.)

**Example Models:**
- `video-generator:veo3` - Google Veo 3 (Pro tier, 15 credits or 2 quotas)
- `poster-editor:flux-dev` - FLUX.1-dev (Basic tier, 5 credits or 1 quota)
- `avatar-creator:sdxl` - Stable Diffusion XL (Free tier, 3 credits or 1 quota)

### 4. Credit System (PAYG Users)

**Flow:**
1. User purchases credits via Duitku
2. Credits are added to user balance (Credit table)
3. App actions deduct credits based on `pluginConfig.credits`
4. Transaction history maintained in Credit table

**Credit Calculation:**
- Base cost + feature costs
- Example (Video Mixer): Base (1) + HD (2) + Speed Variations (1) = 4 credits

**Credit Table Fields:**
- `amount`: Credits added/deducted
- `balance`: Running balance after transaction
- `type`: purchase, bonus, usage, refund
- `referenceId`: Link to app action (e.g., generation ID)

### 5. Quota System (Subscription Users)

**Flow:**
1. User subscribes to plan (Basic/Pro/Enterprise)
2. Daily/monthly quota allocated based on plan
3. App actions consume quotas (tracked in QuotaUsage)
4. Quotas reset automatically per period
5. Premium models available based on subscription tier

**Quota Tracking:**
- Daily quota: Resets every 24 hours
- Monthly quota: Resets on subscription renewal date
- Model breakdown: Track which models were used

**QuotaUsage Table:**
- `period`: Date string (e.g., "2025-10-14" for daily)
- `usageCount`: Total quota used in period
- `quotaLimit`: Max quota from subscription plan
- `modelBreakdown`: JSON object with model usage counts
- `resetAt`: Automatic reset timestamp

### 6. Payment System (Duitku)

**Integration:** Duitku Indonesian payment gateway

**Payment Flow:**
1. User initiates credit purchase
2. Backend creates Duitku payment request
3. User redirected to Duitku payment page
4. User completes payment
5. Duitku sends callback to `/api/payments/callback`
6. Backend validates callback (signature + IP whitelist)
7. Credits added to user account
8. User redirected to return URL

**Security:**
- IP whitelist validation (Duitku server IPs only)
- Signature verification (HMAC-SHA256)
- Duplicate prevention (merchantOrderId uniqueness)

**Payment Table:**
- `merchantOrderId`: Unique order ID
- `reference`: Duitku reference number
- `status`: pending, success, failed, expired
- `creditAmount`: Credits purchased
- `duitkuData`: Full Duitku response (JSON)

### 7. File Storage

**Local Filesystem Storage:**
- **Uploads:** `./uploads/` - User uploaded files
- **Outputs:** `./uploads/outputs/` - Generated files
- **Structure:**
  - `/uploads/{userId}/{appId}/{projectId}/{filename}`
  - `/uploads/outputs/{userId}/{appId}/{generationId}/{filename}`

**Storage Management:**
- User storage quota: Default 1GB per user
- Storage tracking: `User.storageQuota` and `User.storageUsed`
- File cleanup: Manual (no automatic cleanup yet)

**Planned:**
- S3-compatible storage (future)
- CDN integration (future)
- Automatic cleanup of old files

### 8. Background Queue System

**Implementation:** BullMQ + Redis

**Use Cases:**
- Video generation and processing
- Image generation and manipulation
- Long-running AI operations
- Batch processing

**Queue Structure:**
```typescript
// Worker registration
const videoMixerQueue = new Queue('video-mixer-generation', {
  connection: redisConnection,
})

// Job processing
videoMixerQueue.process(async (job) => {
  // Process video mixing
  await processVideoMixing(job.data)
})
```

**Job Status Tracking:**
- `pending`: Job queued
- `processing`: Job in progress
- `completed`: Job finished successfully
- `failed`: Job failed with error

## Database Architecture

### Overview

**Total Models:** 35+
**Database:** PostgreSQL
**ORM:** Prisma
**Schema Location:** `backend/prisma/schema.prisma`

### Model Categories

**Core Models (8):**
- User, Session, Device, Credit, Payment, ToolConfig, App, AppUsage

**Subscription System (5):**
- AIModel, SubscriptionPlan, Subscription, QuotaUsage, ModelUsage

**Video Mixer (4):**
- VideoMixerProject, VideoMixerGroup, VideoMixerVideo, VideoMixerGeneration

**Carousel Mix (5):**
- CarouselProject, CarouselSlide, CarouselText, CarouselPositionSettings, CarouselGeneration

**Looping Flow (4):**
- LoopingFlowProject, LoopingFlowVideo, LoopingFlowGeneration, LoopingFlowAudioLayer

**Avatar System (6):**
- AvatarProject, Avatar, AvatarPreset, PersonaExample, AvatarUsageHistory, AvatarGeneration

**See:** [Database Schema Documentation](./database-schema.md) for complete details.

## API Structure

### Route Organization

**Core Routes (12 route files):**
- `/api/auth/*` - Authentication (register, login, profile)
- `/api/credits/*` - Credit management (PAYG users)
- `/api/credit/*` - Credit operations (legacy)
- `/api/subscriptions/*` - Subscription management
- `/api/quotas/*` - Quota management and tracking
- `/api/payments/*` - Duitku payment processing
- `/api/devices/*` - Device management and tracking
- `/api/stats/*` - Usage statistics
- `/api/model-stats/*` - AI model usage stats
- `/api/generation/*` - Generation tracking
- `/api/pose-template/*` - Pose template management
- `/api/admin/*` - Admin operations

**App Routes (5 apps with backend):**
- `/api/apps/video-mixer/*` - Video Mixer endpoints
- `/api/apps/carousel-mix/*` - Carousel Mix endpoints
- `/api/apps/looping-flow/*` - Looping Flow endpoints
- `/api/apps/avatar-creator/*` - Avatar Creator endpoints
- `/api/apps/avatar-generator/*` - Avatar Generator endpoints

**Total Endpoints:** 114+ API endpoints

**See:** [API Documentation](../api/README.md) for complete endpoint reference.

## Security Architecture

### Authentication
- JWT tokens with secure secret (min 32 chars)
- Session tracking with device fingerprinting
- Password hashing with bcrypt
- Token expiration and refresh

### Authorization
- Role-based access control (user, admin)
- Per-app access control via plugin config
- Subscription tier requirements
- Protected endpoints with middleware

### Rate Limiting
- IP-based rate limiting for auth endpoints
- Account-based lockout after failed attempts
- Global rate limiting for system protection
- Redis-backed distributed rate limiting

### Payment Security
- IP whitelist for payment callbacks (Duitku servers only)
- HMAC-SHA256 signature verification
- Duplicate transaction prevention
- Secure secret management

### Data Protection
- Environment variable validation (Zod)
- No secrets in code or version control
- CORS configuration for frontend origin
- Trusted proxy IP configuration

**See:** [Security Documentation](../security/security-overview.md) for complete details.

## Performance & Scalability

### Current Architecture

**Type:** Monolithic with plugin system
**Deployment:** Single server (Coolify/Docker)
**Database:** Single PostgreSQL instance
**Queue:** Redis-backed BullMQ

**Bottlenecks:**
1. Video processing on single server
2. File storage on local filesystem
3. No horizontal scaling (yet)
4. No CDN for static assets

### Scalability Considerations

**Short-term (Current Capacity):**
- Can handle 100-1000 concurrent users
- Video processing queue prevents overload
- Redis caching for frequently accessed data

**Medium-term (Horizontal Scaling):**
- Multiple backend instances behind load balancer
- Separate worker servers for queue processing
- S3-compatible object storage
- CDN for uploaded/generated files
- Database read replicas

**Long-term (Microservices):**
- Extract apps into separate services
- Separate service for authentication
- Dedicated video processing service
- Event-driven architecture with message bus

## Environment Configuration

**Total Variables:** 80+ environment variables

**Categories:**
- Core Configuration (NODE_ENV, PORT, DATABASE_URL)
- JWT Authentication (JWT_SECRET, JWT_EXPIRES_IN)
- CORS (CORS_ORIGIN)
- Redis (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD)
- File Storage (UPLOAD_PATH, OUTPUT_PATH, MAX_FILE_SIZE)
- Payment Gateway (DUITKU_*)
- Rate Limiting (RATE_LIMIT_*)
- AI Services (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
- FFmpeg (FFMPEG_PATH, FFPROBE_PATH)
- Trusted Proxies (TRUSTED_PROXY_IPS)

**See:** [Environment Variables Documentation](../deployment/environment-variables.md) for complete reference.

## Development Workflow

### Local Development Setup

1. **Prerequisites:**
   - Node.js v18+
   - PostgreSQL
   - Redis
   - FFmpeg

2. **Installation:**
   ```bash
   npm install
   ```

3. **Database Setup:**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Environment Configuration:**
   - Copy `.env.example` to `.env`
   - Configure database, JWT secret, Redis

5. **Start Services:**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

**See:** [Development Guide](../development/development-guide.md) for detailed setup.

## Deployment Architecture

### Production Deployment

**Platform:** Coolify (Docker-based)
**Services:**
- Backend (Express + TypeScript)
- Frontend (React - served via backend in production)
- PostgreSQL Database
- Redis (queue + cache)

**Deployment Flow:**
1. Push to Git repository
2. Coolify detects changes
3. Docker build (backend)
4. Database migrations (auto-run)
5. Service restart with zero downtime
6. Health check verification

**See:** [Production Deployment Guide](../deployment/production-deployment.md)

## Limitations & Known Issues

### Current Limitations

1. **File Storage:**
   - Local filesystem only (no cloud storage)
   - No automatic cleanup of old files
   - Storage quota not enforced (tracked only)

2. **Scalability:**
   - Single server deployment
   - No horizontal scaling capability
   - Video processing on main server

3. **AI Services:**
   - Some apps frontend-only (no backend implementation)
   - Limited AI model providers
   - No fallback if external service fails

4. **Monitoring:**
   - Basic logging only
   - No structured monitoring/observability
   - No error tracking service (Sentry, etc.)

5. **Testing:**
   - Limited test coverage
   - No E2E tests
   - Manual testing required

### Planned Improvements

**Q4 2025:**
- S3-compatible object storage
- Structured logging and monitoring
- Horizontal scaling support
- API rate limiting per user
- Enhanced error handling

**Q1 2026:**
- Microservices extraction (video processing)
- CDN integration
- Advanced caching strategies
- Real-time notifications (WebSocket)
- Mobile app API optimization

## Related Documentation

- **[Subscription System](./subscription-system.md)** - Complete subscription and quota documentation
- **[Database Schema](./database-schema.md)** - All 35+ database models documented
- **[API Reference](../api/README.md)** - Complete API endpoint documentation
- **[Plugin Architecture](../PLUGIN_ARCHITECTURE.md)** - How to add new apps
- **[Development Guide](../development/development-guide.md)** - Development workflow
- **[Deployment Guide](../deployment/production-deployment.md)** - Production deployment
- **[Security Overview](../security/security-overview.md)** - Security architecture

---

**Document Status:** Current
**Last Major Update:** 2025-10-14 (Complete rewrite with current implementation)
**Next Review:** 2025-11-14
**Maintainer:** Technical Team
