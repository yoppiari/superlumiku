# Lumiku App - Current Architecture

**Last Updated:** 2025-10-02
**System Status:** Operational (Video Mixer app functional, background processing pending)
**Architecture Pattern:** Monolithic with Plugin System

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Pattern](#architecture-pattern)
4. [Plugin System](#plugin-system)
5. [Database Architecture](#database-architecture)
6. [Current Applications](#current-applications)
7. [Credit System](#credit-system)
8. [File Storage](#file-storage)
9. [Known Limitations](#known-limitations)
10. [Next Steps](#next-steps)

---

## System Overview

**Lumiku App** is a unified SaaS platform for AI-powered content creation tools. Unlike the previous multi-database microservices architecture, this system uses a **single centralized database** with **modular plugin architecture**.

### Key Architectural Principles

- **Single Database:** All apps share one SQLite database (dev) / PostgreSQL (prod)
- **Plugin-Based Apps:** Each app is a self-contained plugin with its own routes, services, and models
- **Unified Authentication:** Single JWT auth system across all apps
- **Centralized Credits:** Credit management handled by core system
- **Modular & Scalable:** Easy to add new apps without modifying core

### Current Structure

```
lumiku-app/
├── frontend/               # React SPA (Vite)
│   ├── src/
│   │   ├── pages/         # Dashboard, Login, Settings
│   │   └── apps/          # VideoMixer.tsx, future apps...
│   └── package.json
│
├── backend/               # Bun + Hono API
│   ├── src/
│   │   ├── core/          # Auth, credit middleware, shared services
│   │   ├── plugins/       # Plugin registry & loader
│   │   ├── apps/          # Plugin apps (video-mixer, future apps...)
│   │   ├── routes/        # Core routes (auth, credits, devices)
│   │   └── index.ts       # Main server
│   ├── prisma/
│   │   └── schema.prisma  # Unified database schema
│   └── package.json
│
├── docs/                  # Documentation
└── package.json           # Monorepo workspace config
```

---

## Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Bun | 1.0+ | Backend runtime & package manager |
| **Backend Framework** | Hono | 3.11+ | Lightweight web framework |
| **Frontend Framework** | React | 18.2+ | UI library |
| **Build Tool** | Vite | 4.4+ | Frontend build & dev server |
| **Database ORM** | Prisma | 5.0+ | Type-safe database access |
| **Database (Dev)** | SQLite | 3 | Development database |
| **Database (Prod)** | PostgreSQL | 13+ | Production database |
| **State Management** | Zustand | 4.4+ | Frontend state |
| **UI Components** | Radix UI + TailwindCSS | Latest | Design system |
| **Icons** | Lucide React | Latest | Icon library |
| **Authentication** | JWT | jsonwebtoken 9.0 | Token-based auth |
| **File Upload** | Multer | Latest | File handling |
| **Video Processing** | FFmpeg | 4.4+ | Video manipulation (planned) |

---

## Architecture Pattern

### Monolithic with Plugin System

Unlike traditional microservices, Lumiku uses a **modular monolith** approach:

```
┌─────────────────────────────────────────────────────────┐
│              Lumiku Backend (Bun + Hono)                │
│                   Port 3000                              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Core System (Protected)         Plugin Layer            │
│  ├─ Auth & JWT                   ├─ video-mixer         │
│  ├─ Credit Management            ├─ ai-generator (soon) │
│  ├─ Device Tracking              ├─ carousel-gen (soon) │
│  ├─ Payment (planned)            └─ looping-video (soon)│
│  └─ Middleware                                           │
│                                                           │
├─────────────────────────────────────────────────────────┤
│           Single Centralized Database                    │
│              (SQLite → PostgreSQL)                       │
│                                                           │
│  Core Tables            App Tables                       │
│  ├─ User                ├─ VideoMixerProject            │
│  ├─ Credit              ├─ VideoMixerVideo              │
│  ├─ Device              ├─ VideoMixerGroup              │
│  ├─ Session             ├─ VideoMixerGeneration         │
│  ├─ App (registry)      └─ ... (future apps)            │
│  └─ AppUsage                                             │
└─────────────────────────────────────────────────────────┘
             │
             ▼
   ┌──────────────────────┐
   │   Lumiku Frontend    │
   │  React + Vite + TS   │
   │    Port 5173         │
   └──────────────────────┘
```

### Why This Pattern?

**Advantages:**
- ✅ Simpler than microservices (single deployment, single database)
- ✅ ACID transactions guaranteed
- ✅ No network latency between services
- ✅ Easier debugging & development
- ✅ Sufficient for 100k+ users
- ✅ Clear module boundaries via plugin system

**Trade-offs:**
- ❌ Less isolation than microservices
- ❌ Harder to scale independently (but sufficient for now)
- ❌ All apps must use same tech stack

---

## Plugin System

### Overview

Each app in Lumiku is a **plugin** that self-registers with the system. This pattern allows adding new apps without modifying core code.

### Plugin Structure

```
backend/src/apps/video-mixer/
├── plugin.config.ts       # App metadata & configuration
├── routes.ts              # Hono routes
├── services/
│   └── video-mixer.service.ts
└── repositories/
    └── video-mixer.repository.ts
```

### Plugin Configuration

```typescript
// plugin.config.ts
export const videoMixerConfig: PluginConfig = {
  appId: 'video-mixer',
  name: 'Video Mixer',
  description: 'Mix multiple short videos into longer videos automatically',
  icon: 'video',
  version: '1.0.0',
  routePrefix: '/api/apps/video-mixer',
  credits: {
    baseGeneration: 1,
    orderMixing: 1,
    // ... other credit costs
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
    order: 5,
    color: 'blue',
    stats: {
      enabled: true,
      endpoint: '/api/apps/video-mixer/stats',
    },
  },
}
```

### Plugin Registration

```typescript
// backend/src/plugins/loader.ts
import { pluginRegistry } from './registry'
import videoMixerConfig from '../apps/video-mixer/plugin.config'
import videoMixerRoutes from '../apps/video-mixer/routes'

export function loadPlugins() {
  pluginRegistry.register(videoMixerConfig, videoMixerRoutes)
  // Future: Register more plugins here
}
```

### Plugin Routes

All plugin routes are automatically mounted at `{routePrefix}`:

```typescript
// backend/src/index.ts
loadPlugins()

for (const plugin of pluginRegistry.getEnabled()) {
  const routes = pluginRegistry.getRoutes(plugin.appId)
  if (routes) {
    app.route(plugin.routePrefix, routes)
  }
}
```

---

## Database Architecture

### Single Centralized Database

All apps share one database with clear table ownership:

#### Core Tables (Protected)

Managed by core system only:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())

  credits   Credit[]
  sessions  Session[]
  devices   Device[]
  appUsages AppUsage[]
}

model Credit {
  id            String   @id @default(cuid())
  userId        String
  amount        Int      // Positive = add, Negative = deduct
  balance       Int      // Running balance
  type          String   // 'purchase', 'bonus', 'usage', 'refund'
  description   String?
  referenceType String?
  createdAt     DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

#### App Registry Tables

Track installed apps:

```prisma
model App {
  id       String  @id @default(cuid())
  appId    String  @unique // 'video-mixer', 'ai-generator'
  name     String
  icon     String
  enabled  Boolean @default(true)

  // Stats (optional, auto-creates via upsert)
  totalUsage Int @default(0)
}

model AppUsage {
  id         String   @id @default(cuid())
  userId     String
  appId      String   // Plugin appId (no FK - in-memory plugins)
  action     String
  creditUsed Int
  metadata   String?
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

#### App-Specific Tables

Each plugin can create its own tables:

```prisma
// Video Mixer tables
model VideoMixerProject {
  id     String @id @default(cuid())
  userId String
  name   String

  videos      VideoMixerVideo[]
  groups      VideoMixerGroup[]
  generations VideoMixerGeneration[]
}

model VideoMixerVideo {
  id        String @id @default(cuid())
  projectId String
  fileName  String
  filePath  String
  duration  Float

  project VideoMixerProject @relation(...)
}

model VideoMixerGeneration {
  id                String   @id @default(cuid())
  projectId         String
  status            String   // 'pending', 'processing', 'completed', 'failed'
  totalVideos       Int
  creditUsed        Int

  // All generation settings (18 fields)
  enableOrderMixing Boolean
  videoResolution   String
  frameRate         Int
  // ... etc

  createdAt    DateTime  @default(now())
  completedAt  DateTime?

  project VideoMixerProject @relation(...)
}
```

### Database Migration Strategy

```bash
# Development
bun prisma migrate dev --name add-new-feature

# Production
bun prisma migrate deploy
```

---

## Current Applications

### 1. Video Mixer

**Status:** ✅ Fully implemented (UI, file upload, settings) | ⏳ Processing pending

**Features:**
- Project & video management
- Group-based organization
- Advanced anti-fingerprinting options
- Quality & format controls
- Duration management
- Generation history tracking

**Current Limitations:**
- Generation status stays "pending" (no background workers)
- No FFmpeg processing implemented yet
- Videos saved but not actually mixed

**Credit Costs:**
- Base generation: 1 credit/video
- Order mixing: +1 credit
- HD (720p): +2 credits
- Full HD (1080p): +5 credits
- 60 FPS: +3 credits
- Smart distribution: +1 credit

**API Endpoints:**
- `POST /api/apps/video-mixer/projects` - Create project
- `POST /api/apps/video-mixer/videos/upload` - Upload video
- `POST /api/apps/video-mixer/generate` - Generate videos
- `GET /api/apps/video-mixer/projects/:id/generations` - Get generation history

### Future Apps (Planned)

- **AI Generator** - Eden AI integration for AI-powered content
- **Carousel Generator** - Instagram/LinkedIn carousel creation
- **Looping Video Generator** - Seamless video loops

---

## Credit System

### How It Works

```
1. User performs action
   ↓
2. deductCredits() middleware checks balance
   ↓
3. If sufficient → proceed | If not → 402 Payment Required
   ↓
4. Action executes
   ↓
5. recordCreditUsage() logs transaction
   ↓
6. Update balance & create AppUsage record
```

### Credit Middleware

```typescript
// Check balance before action
deductCredits(amount, action, appId)

// Record usage after success
await recordCreditUsage(userId, appId, action, amount, metadata)
```

### Credit Balance Calculation

Uses running balance pattern:

```typescript
const getCreditBalance = async (userId: string) => {
  const lastCredit = await prisma.credit.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { balance: true },
  })
  return lastCredit?.balance || 0
}
```

---

## File Storage

### Storage System

```typescript
// backend/src/lib/storage.ts
export async function saveFile(file: File, category: 'videos' | 'temp') {
  const timestamp = Date.now()
  const randomId = randomBytes(8).toString('hex')
  const fileName = `${timestamp}_${randomId}${ext}`
  const filePath = `/${category}/${fileName}`

  // Save to ./uploads/{category}/
  await writeFile(`./uploads${filePath}`, buffer)

  return { filePath, fileName }
}
```

### Directory Structure

```
./uploads/
├── videos/          # Uploaded source videos
│   └── 1727883456_a1b2c3d4.mp4
└── temp/            # Temporary files
    └── processing_xyz.mp4
```

### Video Duration Extraction

```typescript
// backend/src/lib/video-utils.ts
export async function getVideoDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(`ffprobe ...`)
    return parseFloat(stdout.trim())
  } catch {
    return 5 // Fallback placeholder
  }
}
```

---

## Known Limitations

### Video Processing
- ❌ No background worker system
- ❌ No FFmpeg integration
- ❌ Generation status stays "pending"
- ❌ Cannot download generated videos yet

### Infrastructure
- ⚠️ Synchronous processing (blocks server)
- ⚠️ No job queue system
- ⚠️ No retry logic for failed operations

### Future Apps
- Only Video Mixer implemented
- AI Generator, Carousel, Looping Video planned

### Scalability
- Current architecture supports ~100k users
- Beyond that, consider:
  - Background job queue (BullMQ + Redis)
  - Separate worker processes
  - CDN for file serving
  - PostgreSQL connection pooling

---

## Next Steps

### Immediate (Phase 2)
1. **Background Queue System**
   - Install BullMQ + Redis
   - Create worker processes
   - Implement job status tracking

2. **FFmpeg Integration**
   - Actual video mixing
   - Apply anti-fingerprinting
   - Quality/format conversion

3. **Download Functionality**
   - Serve completed videos
   - Zip multiple outputs
   - Auto-cleanup old files

### Short-term
- AI Generator app (Eden AI)
- Carousel Generator app
- Looping Video Generator app
- Payment integration (Duitku)

### Long-term
- Admin dashboard
- Analytics & reporting
- User subscription tiers
- CDN integration
- Horizontal scaling

---

## Documentation References

- **[PLUGIN_ARCHITECTURE.md](PLUGIN_ARCHITECTURE.md)** - Detailed plugin system guide
- **[ADD_NEW_APP_PROMPT.md](ADD_NEW_APP_PROMPT.md)** - Template for creating new apps
- **[VIDEO_MIXER_CHANGELOG.md](VIDEO_MIXER_CHANGELOG.md)** - Video Mixer implementation history
- **[CHANGELOG.md](../CHANGELOG.md)** - Recent fixes & changes

---

## Support & Contribution

For issues or questions:
1. Check existing documentation
2. Review backend logs
3. Check browser console
4. Verify environment variables
5. Consult PLUGIN_ARCHITECTURE.md for plugin-specific issues

---

**Built with ❤️ using Bun, Hono, React, and Prisma**
