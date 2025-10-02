# Plugin Architecture - Lumiku App

## Overview

Dokumentasi ini menjelaskan **Hybrid Plugin Architecture** untuk Lumiku App - sebuah arsitektur modular yang memungkinkan pengembangan multiple mini-apps (Project Manager, Invoice Generator, Analytics Dashboard, dll) tanpa merusak core functionality seperti authentication, billing, dan credit system.

## Table of Contents

1. [Architecture Philosophy](#architecture-philosophy)
2. [Key Design Principles](#key-design-principles)
3. [Database Strategy](#database-strategy)
4. [Folder Structure](#folder-structure)
5. [Core Components](#core-components)
6. [Plugin Configuration](#plugin-configuration)
7. [Credit Middleware System](#credit-middleware-system)
8. [Step-by-Step Implementation](#step-by-step-implementation)
9. [App Generator Script](#app-generator-script)
10. [Best Practices](#best-practices)
11. [Comparison with Previous Architecture](#comparison-with-previous-architecture)

---

## Architecture Philosophy

### Single Database, Modular Apps

Berbeda dengan previous architecture (Video Mix Pro) yang menggunakan **multiple databases** (MainApp.db, VideoMix.db, Carousel.db), Lumiku App mengadopsi **Single Centralized Database** dengan modular plugin structure.

**Why Single Database?**

- ✅ **Simpler ACID transactions**: No cross-database sync needed
- ✅ **Faster development**: No API calls between services for data
- ✅ **Easier maintenance**: Single migration, single backup
- ✅ **Better for monolith scale**: Suitable until 100k+ users
- ✅ **Unified credit system**: Direct foreign key relations

**Architecture Diagram:**

```
┌────────────────────────────────────────────────────────────┐
│                      Lumiku Backend                         │
│                       (Hono + Bun)                          │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Core System │  │ Plugin Layer │  │ App Registry │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         ├─ Auth           ├─ Project Mgr    ├─ Register   │
│         ├─ Payment        ├─ Invoice Gen    ├─ Load       │
│         ├─ Credits        ├─ Analytics      ├─ Route      │
│         └─ Devices        ├─ Task Scheduler │             │
│                           ├─ Team Chat      │             │
│                           └─ File Manager   │             │
│                                                              │
├────────────────────────────────────────────────────────────┤
│              Single Centralized Database                    │
│                    (SQLite/PostgreSQL)                      │
│                                                              │
│  ┌──────────┐  ┌────────┐  ┌─────┐  ┌──────────┐         │
│  │  User    │  │ Credit │  │ App │  │ AppUsage │         │
│  │ Session  │  │ Device │  │     │  │          │         │
│  │ Payment  │  └────────┘  └─────┘  └──────────┘         │
│  └──────────┘                                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │         App-Specific Tables (Projects, etc)        │   │
│  └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## Key Design Principles

### 1. **Separation of Concerns**

```
Core System (Untouchable)     Plugin Apps (Safe to Build)
├── auth.routes.ts            ├── apps/project-manager/
├── payment.routes.ts         ├── apps/invoice-generator/
├── credit.routes.ts          ├── apps/analytics-dashboard/
└── device.routes.ts          └── apps/task-scheduler/
```

### 2. **Plugin Independence**

- Each app is self-contained
- Apps cannot directly modify core tables (User, Credit, Payment, Device)
- Apps communicate with core via middleware
- Removing an app doesn't break others

### 3. **Credit Middleware Protection**

- All credit operations MUST go through middleware
- Middleware ensures atomic transactions
- Automatic rollback on failure
- Usage tracking for analytics

### 4. **Dynamic Plugin Loading**

- Apps register themselves in plugin registry
- Apps can be enabled/disabled without code changes
- Routes auto-mounted based on configuration

---

## Database Strategy

### Core Tables (Protected)

These tables are managed by core services ONLY:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  credits   Credit[]
  sessions  Session[]
  devices   Device[]
  appUsages AppUsage[]
  payments  Payment[]
}

model Credit {
  id            String   @id @default(cuid())
  userId        String
  amount        Int      // Positive = add, Negative = deduct
  balance       Int      // Running balance
  type          String   // purchase, bonus, usage, refund
  description   String?
  referenceId   String?  // Link to AppUsage or Payment
  referenceType String?  // 'app_usage' or 'payment'
  createdAt     DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([createdAt])
}

model Device {
  id          String   @id @default(cuid())
  userId      String
  deviceHash  String   @unique
  deviceName  String
  userAgent   String
  ipAddress   String?
  lastUsedAt  DateTime @default(now())
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
}

model Payment {
  id              String   @id @default(cuid())
  userId          String
  merchantRef     String   @unique
  amount          Int
  paymentMethod   String
  status          String   // pending, success, failed
  callbackData    String?  @db.Text
  paidAt          DateTime?
  createdAt       DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
}
```

### App Registry Tables

These tables manage plugin apps:

```prisma
model App {
  id                    String   @id @default(cuid())
  appId                 String   @unique // 'project-manager', 'invoice-generator'
  name                  String
  description           String?
  icon                  String   // Lucide icon name
  enabled               Boolean  @default(true)
  beta                  Boolean  @default(false)
  comingSoon            Boolean  @default(false)
  creditCostBase        Int      @default(1)
  requiresSubscription  Boolean  @default(false)
  minSubscriptionTier   String?  // 'basic', 'pro', 'enterprise'
  version               String   @default("1.0.0")

  // Stats
  totalUsage            Int      @default(0)
  activeUsers           Int      @default(0)

  // Dashboard
  dashboardOrder        Int      @default(0)
  dashboardColor        String   @default("blue")

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  usages                AppUsage[]

  @@index([enabled])
  @@index([dashboardOrder])
}

model AppUsage {
  id          String   @id @default(cuid())
  userId      String
  appId       String
  action      String   // 'create_project', 'generate_invoice'
  creditUsed  Int
  metadata    String?  @db.Text // JSON string
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  app  App  @relation(fields: [appId], references: [appId])

  @@index([userId])
  @@index([appId])
  @@index([createdAt])
}
```

### App-Specific Tables

Each app can create its own tables:

```prisma
// Example: Project Manager app
model Project {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  status      String   @default("active")
  dueDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tasks Task[]

  @@index([userId])
}

model Task {
  id          String   @id @default(cuid())
  projectId   String
  title       String
  completed   Boolean  @default(false)
  priority    String   @default("medium")
  createdAt   DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
}

// Example: Invoice Generator app
model Invoice {
  id          String   @id @default(cuid())
  userId      String
  invoiceNo   String   @unique
  clientName  String
  totalAmount Int
  status      String   @default("draft")
  createdAt   DateTime @default(now())

  items InvoiceItem[]

  @@index([userId])
  @@index([invoiceNo])
}

model InvoiceItem {
  id          String @id @default(cuid())
  invoiceId   String
  description String
  quantity    Int
  unitPrice   Int
  total       Int

  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
}
```

---

## Folder Structure

```
backend/
├── src/
│   ├── core/                         # Core system (protected)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT validation
│   │   │   ├── cors.middleware.ts    # CORS config
│   │   │   └── credit.middleware.ts  # Credit deduction & recording
│   │   ├── services/
│   │   │   ├── auth.service.ts       # Register, login, profile
│   │   │   ├── payment.service.ts    # Duitku integration
│   │   │   ├── credit.service.ts     # Credit operations
│   │   │   └── device.service.ts     # Device tracking
│   │   └── lib/
│   │       ├── bcrypt.ts
│   │       ├── jwt.ts
│   │       └── duitku.ts
│   │
│   ├── plugins/                      # Plugin system
│   │   ├── types.ts                  # PluginConfig interface
│   │   ├── registry.ts               # PluginRegistry class
│   │   └── loader.ts                 # Auto-load plugins
│   │
│   ├── apps/                         # Plugin apps
│   │   ├── project-manager/
│   │   │   ├── plugin.config.ts      # App metadata & config
│   │   │   ├── routes.ts             # Hono routes
│   │   │   ├── services/
│   │   │   │   └── project.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── project.repository.ts
│   │   │   └── schemas/
│   │   │       └── project.schema.ts
│   │   │
│   │   ├── invoice-generator/
│   │   │   ├── plugin.config.ts
│   │   │   ├── routes.ts
│   │   │   └── services/
│   │   │       └── invoice.service.ts
│   │   │
│   │   ├── analytics-dashboard/
│   │   ├── task-scheduler/
│   │   ├── team-chat/
│   │   └── file-manager/
│   │
│   ├── routes/                       # Core routes
│   │   ├── auth.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── credit.routes.ts
│   │   └── device.routes.ts
│   │
│   ├── db/
│   │   └── client.ts                 # Prisma client
│   │
│   └── app.ts                        # Main Hono app
│
├── prisma/
│   ├── schema.prisma                 # All models
│   └── migrations/
│
└── scripts/
    └── generate-app.ts               # App generator CLI
```

**Frontend Structure:**

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx             # App cards grid
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Settings.tsx
│   │   └── Credits.tsx
│   │
│   ├── apps/                         # Plugin apps
│   │   ├── ProjectManager.tsx
│   │   ├── InvoiceGenerator.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── TaskScheduler.tsx
│   │   ├── TeamChat.tsx
│   │   └── FileManager.tsx
│   │
│   ├── components/
│   │   ├── AppCard.tsx               # Reusable app card
│   │   ├── CreditBadge.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── lib/
│   │   ├── api.ts                    # Axios instance
│   │   └── sso.ts                    # SSO utilities
│   │
│   └── store/
│       ├── authStore.ts              # Zustand auth
│       └── creditStore.ts            # Zustand credits
```

---

## Core Components

### 1. Plugin Types (`backend/src/plugins/types.ts`)

```typescript
export interface PluginConfig {
  // App Identity
  appId: string                       // 'project-manager', 'invoice-generator'
  name: string                        // 'Project Manager'
  description: string                 // 'Kelola proyek dan tim dengan mudah'
  icon: string                        // Lucide icon name: 'target', 'file-text'
  version: string                     // '1.0.0'

  // Routing
  routePrefix: string                 // '/api/apps/project-manager'

  // Credits Configuration
  credits: Record<string, number>     // { createProject: 5, updateProject: 2 }

  // Access Control
  access: {
    requiresAuth: boolean             // Requires login?
    requiresSubscription: boolean     // Subscription only?
    minSubscriptionTier: string | null // 'basic' | 'pro' | 'enterprise'
    allowedRoles: string[]            // ['user', 'admin']
  }

  // Features
  features: {
    enabled: boolean                  // Is app active?
    beta: boolean                     // Show beta badge?
    comingSoon: boolean               // Show coming soon?
  }

  // Dashboard
  dashboard: {
    order: number                     // Display order
    color: string                     // Card color
    stats: {
      enabled: boolean                // Show usage stats?
      endpoint: string                // '/api/apps/project-manager/stats'
    }
  }
}
```

### 2. Plugin Registry (`backend/src/plugins/registry.ts`)

```typescript
import { Hono } from 'hono'
import { PluginConfig } from './types'

export class PluginRegistry {
  private plugins: Map<string, PluginConfig> = new Map()
  private routes: Map<string, Hono> = new Map()

  /**
   * Register a new plugin app
   */
  register(config: PluginConfig, routes: Hono) {
    if (this.plugins.has(config.appId)) {
      throw new Error(`Plugin ${config.appId} is already registered`)
    }

    this.plugins.set(config.appId, config)
    this.routes.set(config.appId, routes)

    console.log(`✅ Plugin registered: ${config.name} (${config.appId})`)
  }

  /**
   * Get all registered plugins
   */
  getAll(): PluginConfig[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get plugin by appId
   */
  get(appId: string): PluginConfig | undefined {
    return this.plugins.get(appId)
  }

  /**
   * Get routes for a plugin
   */
  getRoutes(appId: string): Hono | undefined {
    return this.routes.get(appId)
  }

  /**
   * Get enabled plugins only
   */
  getEnabled(): PluginConfig[] {
    return this.getAll().filter(p => p.features.enabled)
  }

  /**
   * Get plugins for dashboard (enabled, not coming soon)
   */
  getDashboardApps(): PluginConfig[] {
    return this.getAll()
      .filter(p => p.features.enabled && !p.features.comingSoon)
      .sort((a, b) => a.dashboard.order - b.dashboard.order)
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry()
```

### 3. Plugin Loader (`backend/src/plugins/loader.ts`)

```typescript
import { pluginRegistry } from './registry'

// Import all plugins
import projectManagerConfig from '../apps/project-manager/plugin.config'
import projectManagerRoutes from '../apps/project-manager/routes'

import invoiceGeneratorConfig from '../apps/invoice-generator/plugin.config'
import invoiceGeneratorRoutes from '../apps/invoice-generator/routes'

import analyticsDashboardConfig from '../apps/analytics-dashboard/plugin.config'
import analyticsDashboardRoutes from '../apps/analytics-dashboard/routes'

// Add more imports as apps are created...

/**
 * Load all plugins into registry
 */
export function loadPlugins() {
  // Register each plugin
  pluginRegistry.register(projectManagerConfig, projectManagerRoutes)
  pluginRegistry.register(invoiceGeneratorConfig, invoiceGeneratorRoutes)
  pluginRegistry.register(analyticsDashboardConfig, analyticsDashboardRoutes)

  // Add more registrations...

  console.log(`\n📦 Loaded ${pluginRegistry.getAll().length} plugins`)
  console.log(`✅ Enabled: ${pluginRegistry.getEnabled().length}`)
  console.log(`🚀 Dashboard apps: ${pluginRegistry.getDashboardApps().length}\n`)
}
```

---

## Plugin Configuration

### Example: Project Manager App

**File: `backend/src/apps/project-manager/plugin.config.ts`**

```typescript
import { PluginConfig } from '../../plugins/types'

export const projectManagerConfig: PluginConfig = {
  // Identity
  appId: 'project-manager',
  name: 'Project Manager',
  description: 'Kelola proyek dan tim dengan mudah menggunakan AI',
  icon: 'target',
  version: '1.0.0',

  // Routing
  routePrefix: '/api/apps/project-manager',

  // Credits per action
  credits: {
    createProject: 5,           // 5 credits to create project
    updateProject: 2,           // 2 credits to update
    deleteProject: 1,           // 1 credit to delete
    addTask: 1,                 // 1 credit per task
    generateAISuggestion: 10,   // 10 credits for AI
  },

  // Access control
  access: {
    requiresAuth: true,         // Must be logged in
    requiresSubscription: false, // Free users can use
    minSubscriptionTier: null,  // No tier requirement
    allowedRoles: ['user', 'admin'],
  },

  // Features
  features: {
    enabled: true,              // App is live
    beta: false,                // Not in beta
    comingSoon: false,          // Not coming soon
  },

  // Dashboard config
  dashboard: {
    order: 1,                   // First app on dashboard
    color: 'blue',              // Card color
    stats: {
      enabled: true,
      endpoint: '/api/apps/project-manager/stats',
    },
  },
}

export default projectManagerConfig
```

---

## Credit Middleware System

### Core Middleware (`backend/src/core/middleware/credit.middleware.ts`)

```typescript
import { Context, Next } from 'hono'
import prisma from '../../db/client'

/**
 * Middleware: Deduct credits before action
 * Usage: deductCredits(5, 'create_project', 'project-manager')
 */
export const deductCredits = (amount: number, action: string, appId: string) => {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Check credit balance
    const balance = await getCreditBalance(userId)

    if (balance < amount) {
      return c.json({
        error: 'Insufficient credits',
        required: amount,
        current: balance,
      }, 402) // 402 Payment Required
    }

    // Store deduction info in context for later recording
    c.set('creditDeduction', {
      amount,
      action,
      appId,
    })

    await next()
  }
}

/**
 * Record credit usage after successful operation
 * Call this AFTER the operation succeeds
 */
export const recordCreditUsage = async (
  userId: string,
  appId: string,
  action: string,
  amount: number,
  metadata?: any
) => {
  // Get current balance
  const currentBalance = await getCreditBalance(userId)
  const newBalance = currentBalance - amount

  // Atomic transaction: deduct credits + log usage
  await prisma.$transaction([
    // 1. Create credit deduction record
    prisma.credit.create({
      data: {
        userId,
        amount: -amount,          // Negative for deduction
        balance: newBalance,
        type: 'usage',
        description: `${appId}: ${action}`,
        referenceType: 'app_usage',
      },
    }),

    // 2. Create app usage record
    prisma.appUsage.create({
      data: {
        userId,
        appId,
        action,
        creditUsed: amount,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    }),

    // 3. Update app statistics
    prisma.app.update({
      where: { appId },
      data: {
        totalUsage: { increment: 1 },
      },
    }),
  ])

  return { newBalance, creditUsed: amount }
}

/**
 * Get user's current credit balance
 */
export const getCreditBalance = async (userId: string): Promise<number> => {
  const lastCredit = await prisma.credit.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { balance: true },
  })

  return lastCredit?.balance || 0
}

/**
 * Middleware: Automatically record usage after success
 * Place this AFTER your route handler
 */
export const autoRecordUsage = async (c: Context) => {
  const deduction = c.get('creditDeduction')

  if (deduction) {
    const userId = c.get('userId')
    await recordCreditUsage(
      userId,
      deduction.appId,
      deduction.action,
      deduction.amount
    )
  }
}
```

---

## Step-by-Step Implementation

### Step 1: Setup Database Models

1. **Add App and AppUsage models to `prisma/schema.prisma`** (see Database Strategy section)
2. **Run migration:**
   ```bash
   cd backend
   bun prisma migrate dev --name add-app-models
   ```

### Step 2: Create Plugin System

1. **Create `backend/src/plugins/types.ts`** (see Core Components)
2. **Create `backend/src/plugins/registry.ts`** (see Core Components)
3. **Create `backend/src/plugins/loader.ts`** (see Core Components)

### Step 3: Create Credit Middleware

1. **Create `backend/src/core/middleware/credit.middleware.ts`** (see Credit Middleware System)

### Step 4: Build Your First App

Let's build **Project Manager** as example:

#### 4.1: Create App Folder

```bash
mkdir -p backend/src/apps/project-manager/{services,repositories,schemas}
```

#### 4.2: Create Plugin Config

**File: `backend/src/apps/project-manager/plugin.config.ts`**

```typescript
import { PluginConfig } from '../../plugins/types'

export const projectManagerConfig: PluginConfig = {
  appId: 'project-manager',
  name: 'Project Manager',
  description: 'Kelola proyek dan tim dengan AI',
  icon: 'target',
  version: '1.0.0',
  routePrefix: '/api/apps/project-manager',
  credits: {
    createProject: 5,
    updateProject: 2,
    deleteProject: 1,
    addTask: 1,
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
    order: 1,
    color: 'blue',
    stats: {
      enabled: true,
      endpoint: '/api/apps/project-manager/stats',
    },
  },
}

export default projectManagerConfig
```

#### 4.3: Create Database Schema

Add to `prisma/schema.prisma`:

```prisma
model Project {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  status      String   @default("active")
  dueDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tasks Task[]

  @@index([userId])
}

model Task {
  id          String   @id @default(cuid())
  projectId   String
  title       String
  completed   Boolean  @default(false)
  priority    String   @default("medium")
  createdAt   DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
}
```

Run migration:

```bash
bun prisma migrate dev --name add-project-models
```

#### 4.4: Create Repository

**File: `backend/src/apps/project-manager/repositories/project.repository.ts`**

```typescript
import prisma from '../../../db/client'

export class ProjectRepository {
  async create(userId: string, data: { name: string; description?: string; dueDate?: Date }) {
    return prisma.project.create({
      data: {
        userId,
        ...data,
      },
    })
  }

  async findByUserId(userId: string) {
    return prisma.project.findMany({
      where: { userId },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  async update(id: string, data: Partial<{ name: string; description: string; status: string }>) {
    return prisma.project.update({
      where: { id },
      data,
    })
  }

  async delete(id: string) {
    return prisma.project.delete({
      where: { id },
    })
  }

  async addTask(projectId: string, data: { title: string; priority?: string }) {
    return prisma.task.create({
      data: {
        projectId,
        ...data,
      },
    })
  }
}
```

#### 4.5: Create Service

**File: `backend/src/apps/project-manager/services/project.service.ts`**

```typescript
import { ProjectRepository } from '../repositories/project.repository'

const projectRepo = new ProjectRepository()

export class ProjectService {
  async createProject(userId: string, data: any) {
    // Business logic here
    const project = await projectRepo.create(userId, data)
    return project
  }

  async getProjects(userId: string) {
    return projectRepo.findByUserId(userId)
  }

  async getProjectById(id: string, userId: string) {
    const project = await projectRepo.findById(id)

    if (!project) {
      throw new Error('Project not found')
    }

    if (project.userId !== userId) {
      throw new Error('Unauthorized')
    }

    return project
  }

  async updateProject(id: string, userId: string, data: any) {
    const project = await this.getProjectById(id, userId)
    return projectRepo.update(id, data)
  }

  async deleteProject(id: string, userId: string) {
    const project = await this.getProjectById(id, userId)
    return projectRepo.delete(id)
  }

  async addTask(projectId: string, userId: string, data: any) {
    const project = await this.getProjectById(projectId, userId)
    return projectRepo.addTask(projectId, data)
  }
}
```

#### 4.6: Create Routes with Credit Middleware

**File: `backend/src/apps/project-manager/routes.ts`**

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../../core/middleware/auth.middleware'
import { deductCredits, recordCreditUsage } from '../../core/middleware/credit.middleware'
import { ProjectService } from './services/project.service'
import { projectManagerConfig } from './plugin.config'
import { z } from 'zod'

const routes = new Hono()
const projectService = new ProjectService()

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
})

const addTaskSchema = z.object({
  title: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']).optional(),
})

// ========================================
// GET ALL PROJECTS (No credit cost)
// ========================================
routes.get('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projects = await projectService.getProjects(userId)

    return c.json({ success: true, projects })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// CREATE PROJECT (5 credits)
// ========================================
routes.post(
  '/projects',
  authMiddleware,
  deductCredits(
    projectManagerConfig.credits.createProject,
    'create_project',
    projectManagerConfig.appId
  ),
  async (c) => {
    try {
      const userId = c.get('userId')
      const body = await c.req.json()
      const validated = createProjectSchema.parse(body)

      // Create project
      const project = await projectService.createProject(userId, validated)

      // Record credit usage
      const deduction = c.get('creditDeduction')
      const { newBalance, creditUsed } = await recordCreditUsage(
        userId,
        deduction.appId,
        deduction.action,
        deduction.amount,
        { projectId: project.id }
      )

      return c.json({
        success: true,
        project,
        creditUsed,
        creditBalance: newBalance,
      }, 201)
    } catch (error: any) {
      return c.json({ error: error.message }, 400)
    }
  }
)

// ========================================
// GET PROJECT BY ID (No credit cost)
// ========================================
routes.get('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')

    const project = await projectService.getProjectById(id, userId)

    return c.json({ success: true, project })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// UPDATE PROJECT (2 credits)
// ========================================
routes.put(
  '/projects/:id',
  authMiddleware,
  deductCredits(
    projectManagerConfig.credits.updateProject,
    'update_project',
    projectManagerConfig.appId
  ),
  async (c) => {
    try {
      const userId = c.get('userId')
      const id = c.req.param('id')
      const body = await c.req.json()
      const validated = updateProjectSchema.parse(body)

      // Update project
      const project = await projectService.updateProject(id, userId, validated)

      // Record credit usage
      const deduction = c.get('creditDeduction')
      const { newBalance, creditUsed } = await recordCreditUsage(
        userId,
        deduction.appId,
        deduction.action,
        deduction.amount,
        { projectId: project.id }
      )

      return c.json({
        success: true,
        project,
        creditUsed,
        creditBalance: newBalance,
      })
    } catch (error: any) {
      return c.json({ error: error.message }, 400)
    }
  }
)

// ========================================
// DELETE PROJECT (1 credit)
// ========================================
routes.delete(
  '/projects/:id',
  authMiddleware,
  deductCredits(
    projectManagerConfig.credits.deleteProject,
    'delete_project',
    projectManagerConfig.appId
  ),
  async (c) => {
    try {
      const userId = c.get('userId')
      const id = c.req.param('id')

      // Delete project
      await projectService.deleteProject(id, userId)

      // Record credit usage
      const deduction = c.get('creditDeduction')
      const { newBalance, creditUsed } = await recordCreditUsage(
        userId,
        deduction.appId,
        deduction.action,
        deduction.amount,
        { projectId: id }
      )

      return c.json({
        success: true,
        message: 'Project deleted',
        creditUsed,
        creditBalance: newBalance,
      })
    } catch (error: any) {
      return c.json({ error: error.message }, 400)
    }
  }
)

// ========================================
// ADD TASK (1 credit)
// ========================================
routes.post(
  '/projects/:id/tasks',
  authMiddleware,
  deductCredits(
    projectManagerConfig.credits.addTask,
    'add_task',
    projectManagerConfig.appId
  ),
  async (c) => {
    try {
      const userId = c.get('userId')
      const projectId = c.req.param('id')
      const body = await c.req.json()
      const validated = addTaskSchema.parse(body)

      // Add task
      const task = await projectService.addTask(projectId, userId, validated)

      // Record credit usage
      const deduction = c.get('creditDeduction')
      const { newBalance, creditUsed } = await recordCreditUsage(
        userId,
        deduction.appId,
        deduction.action,
        deduction.amount,
        { projectId, taskId: task.id }
      )

      return c.json({
        success: true,
        task,
        creditUsed,
        creditBalance: newBalance,
      }, 201)
    } catch (error: any) {
      return c.json({ error: error.message }, 400)
    }
  }
)

// ========================================
// GET STATS (No credit cost)
// ========================================
routes.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projects = await projectService.getProjects(userId)

    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalTasks: projects.reduce((sum, p) => sum + p.tasks.length, 0),
    }

    return c.json({ success: true, stats })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default routes
```

#### 4.7: Register Plugin in Loader

**Edit: `backend/src/plugins/loader.ts`**

```typescript
import { pluginRegistry } from './registry'
import projectManagerConfig from '../apps/project-manager/plugin.config'
import projectManagerRoutes from '../apps/project-manager/routes'

export function loadPlugins() {
  pluginRegistry.register(projectManagerConfig, projectManagerRoutes)

  console.log(`\n📦 Loaded ${pluginRegistry.getAll().length} plugins`)
}
```

#### 4.8: Mount Plugins in Main App

**Edit: `backend/src/app.ts`**

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { corsMiddleware } from './middleware/cors.middleware'
import authRoutes from './routes/auth.routes'
import paymentRoutes from './routes/payment.routes'
import deviceRoutes from './routes/device.routes'

// Import plugin system
import { loadPlugins } from './plugins/loader'
import { pluginRegistry } from './plugins/registry'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', corsMiddleware)

// Load all plugins
loadPlugins()

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Core API Routes
app.route('/api/auth', authRoutes)
app.route('/api/payment', paymentRoutes)
app.route('/api/devices', deviceRoutes)

// Mount all enabled plugin routes
for (const plugin of pluginRegistry.getEnabled()) {
  const routes = pluginRegistry.getRoutes(plugin.appId)
  if (routes) {
    app.route(plugin.routePrefix, routes)
    console.log(`🔌 Mounted: ${plugin.name} at ${plugin.routePrefix}`)
  }
}

// Get all apps for dashboard
app.get('/api/apps', (c) => {
  const apps = pluginRegistry.getDashboardApps()
  return c.json({ apps })
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({ error: err.message || 'Internal Server Error' }, 500)
})

export default app
```

#### 4.9: Build Frontend Component

**File: `frontend/src/apps/ProjectManager.tsx`**

```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Target, Plus, Trash2, Edit } from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  dueDate?: string
  createdAt: string
  tasks: Task[]
}

interface Task {
  id: string
  title: string
  completed: boolean
  priority: string
}

export default function ProjectManager() {
  const navigate = useNavigate()
  const { user, updateCreditBalance } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })

  // Fetch projects
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const res = await api.get('/api/apps/project-manager/projects')
      setProjects(res.data.projects)
    } catch (error: any) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const res = await api.post('/api/apps/project-manager/projects', newProject)

      // Update credit balance
      updateCreditBalance(res.data.creditBalance)

      // Add new project to list
      setProjects([res.data.project, ...projects])

      // Reset form
      setNewProject({ name: '', description: '' })

      alert(`Project created! Used ${res.data.creditUsed} credits`)
    } catch (error: any) {
      if (error.response?.status === 402) {
        alert('Insufficient credits! Please top up.')
        navigate('/credits')
      } else {
        alert(error.response?.data?.error || 'Failed to create project')
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return

    try {
      const res = await api.delete(`/api/apps/project-manager/projects/${id}`)
      updateCreditBalance(res.data.creditBalance)
      setProjects(projects.filter(p => p.id !== id))
      alert(`Deleted! Used ${res.data.creditUsed} credit`)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete')
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Project Manager</h1>
          </div>
          <div className="text-sm text-gray-600">
            Credits: <span className="font-bold">{user?.creditBalance || 0}</span>
          </div>
        </div>

        {/* Create Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Create New Project (5 credits)</h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <input
              type="text"
              placeholder="Project name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>

        {/* Projects List */}
        <div className="grid gap-4">
          {projects.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No projects yet. Create your first one!
            </div>
          ) : (
            projects.map(project => (
              <div key={project.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{project.name}</h3>
                    {project.description && (
                      <p className="text-gray-600 mt-2">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span>Status: {project.status}</span>
                      <span>Tasks: {project.tasks.length}</span>
                      <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
```

#### 4.10: Add Route

**Edit: `frontend/src/App.tsx`**

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ProjectManager from './apps/ProjectManager'
// ... other imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/apps/project-manager" element={<ProjectManager />} />
        {/* ... other routes */}
      </Routes>
    </BrowserRouter>
  )
}
```

### Step 5: Test Your App

1. **Start backend:**
   ```bash
   cd backend
   bun dev
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   bun dev
   ```

3. **Test flow:**
   - Login to Dashboard
   - Click "Project Manager" card
   - Create a project (should deduct 5 credits)
   - Verify credit balance updated
   - Check database for Credit and AppUsage records

### Step 6: Build More Apps

Repeat Step 4 for each app:
- Invoice Generator
- Analytics Dashboard
- Task Scheduler
- Team Chat
- File Manager

**Each app follows same pattern:**
1. Create plugin.config.ts
2. Create database models
3. Create repository
4. Create service
5. Create routes with credit middleware
6. Register in loader
7. Build frontend component
8. Add route

---

## App Generator Script

### What is App Generator Script?

**App Generator Script** adalah CLI tool yang otomatis membuat boilerplate code untuk plugin app baru. Tool ini mempercepat development dengan generate semua file yang dibutuhkan berdasarkan template.

### Benefits

- ✅ **Konsistensi**: Semua apps mengikuti structure yang sama
- ✅ **Speed**: Generate app skeleton dalam seconds
- ✅ **Reduce Errors**: Template sudah tested dan follow best practices
- ✅ **Focus on Logic**: Developer fokus ke business logic, bukan setup

### Implementation

**File: `backend/scripts/generate-app.ts`**

```typescript
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface AppConfig {
  appId: string           // 'task-scheduler'
  name: string            // 'Task Scheduler'
  description: string     // 'Schedule tasks with AI'
  icon: string            // 'calendar'
  color: string           // 'green'
  order: number           // 4
}

async function generateApp(config: AppConfig) {
  const appDir = path.join(__dirname, '../src/apps', config.appId)

  // 1. Create directories
  console.log(`\n📁 Creating directories...`)
  fs.mkdirSync(path.join(appDir, 'services'), { recursive: true })
  fs.mkdirSync(path.join(appDir, 'repositories'), { recursive: true })
  fs.mkdirSync(path.join(appDir, 'schemas'), { recursive: true })

  // 2. Generate plugin.config.ts
  console.log(`📝 Generating plugin.config.ts...`)
  const configContent = `import { PluginConfig } from '../../plugins/types'

export const ${toCamelCase(config.appId)}Config: PluginConfig = {
  appId: '${config.appId}',
  name: '${config.name}',
  description: '${config.description}',
  icon: '${config.icon}',
  version: '1.0.0',
  routePrefix: '/api/apps/${config.appId}',
  credits: {
    // Define your credit costs here
    exampleAction: 5,
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
    order: ${config.order},
    color: '${config.color}',
    stats: {
      enabled: true,
      endpoint: '/api/apps/${config.appId}/stats',
    },
  },
}

export default ${toCamelCase(config.appId)}Config
`
  fs.writeFileSync(path.join(appDir, 'plugin.config.ts'), configContent)

  // 3. Generate routes.ts
  console.log(`📝 Generating routes.ts...`)
  const routesContent = `import { Hono } from 'hono'
import { authMiddleware } from '../../core/middleware/auth.middleware'
import { deductCredits, recordCreditUsage } from '../../core/middleware/credit.middleware'
import { ${toPascalCase(config.appId)}Service } from './services/${config.appId}.service'
import { ${toCamelCase(config.appId)}Config } from './plugin.config'
import { z } from 'zod'

const routes = new Hono()
const service = new ${toPascalCase(config.appId)}Service()

// Add your routes here
routes.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    return c.json({
      success: true,
      message: 'Welcome to ${config.name}',
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Example route with credit deduction
routes.post(
  '/example',
  authMiddleware,
  deductCredits(
    ${toCamelCase(config.appId)}Config.credits.exampleAction,
    'example_action',
    ${toCamelCase(config.appId)}Config.appId
  ),
  async (c) => {
    try {
      const userId = c.get('userId')
      const body = await c.req.json()

      // Your logic here
      const result = { success: true }

      // Record credit usage
      const deduction = c.get('creditDeduction')
      const { newBalance, creditUsed } = await recordCreditUsage(
        userId,
        deduction.appId,
        deduction.action,
        deduction.amount
      )

      return c.json({
        success: true,
        result,
        creditUsed,
        creditBalance: newBalance,
      })
    } catch (error: any) {
      return c.json({ error: error.message }, 400)
    }
  }
)

export default routes
`
  fs.writeFileSync(path.join(appDir, 'routes.ts'), routesContent)

  // 4. Generate service
  console.log(`📝 Generating service...`)
  const serviceContent = `import { ${toPascalCase(config.appId)}Repository } from '../repositories/${config.appId}.repository'

const repo = new ${toPascalCase(config.appId)}Repository()

export class ${toPascalCase(config.appId)}Service {
  async exampleMethod(userId: string, data: any) {
    // Your business logic here
    return { success: true }
  }
}
`
  fs.writeFileSync(path.join(appDir, 'services', `${config.appId}.service.ts`), serviceContent)

  // 5. Generate repository
  console.log(`📝 Generating repository...`)
  const repoContent = `import prisma from '../../../db/client'

export class ${toPascalCase(config.appId)}Repository {
  async findByUserId(userId: string) {
    // Your database queries here
    return []
  }
}
`
  fs.writeFileSync(path.join(appDir, 'repositories', `${config.appId}.repository.ts`), repoContent)

  // 6. Success message
  console.log(`\n✅ App generated successfully!`)
  console.log(`\n📋 Next steps:`)
  console.log(`1. Add database models to prisma/schema.prisma`)
  console.log(`2. Run: bun prisma migrate dev --name add-${config.appId}-models`)
  console.log(`3. Implement business logic in services/`)
  console.log(`4. Add routes in routes.ts`)
  console.log(`5. Register in plugins/loader.ts:`)
  console.log(`   import ${toCamelCase(config.appId)}Config from '../apps/${config.appId}/plugin.config'`)
  console.log(`   import ${toCamelCase(config.appId)}Routes from '../apps/${config.appId}/routes'`)
  console.log(`   pluginRegistry.register(${toCamelCase(config.appId)}Config, ${toCamelCase(config.appId)}Routes)`)
  console.log(`\n6. Create frontend component in frontend/src/apps/${toPascalCase(config.appId)}.tsx`)
  console.log(`7. Add route in frontend/src/App.tsx\n`)
}

// Helper functions
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

// CLI interface
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log(`
🚀 Lumiku App Generator

Usage:
  bun scripts/generate-app.ts <app-id> <name> <description> <icon> <color> <order>

Example:
  bun scripts/generate-app.ts task-scheduler "Task Scheduler" "Schedule tasks with AI" calendar green 4

Arguments:
  app-id      : Kebab-case ID (e.g., task-scheduler)
  name        : Display name (e.g., "Task Scheduler")
  description : Short description
  icon        : Lucide icon name (e.g., calendar)
  color       : Card color (e.g., green)
  order       : Dashboard order (e.g., 4)
`)
  process.exit(0)
}

if (args.length < 6) {
  console.error('❌ Error: Missing arguments')
  console.log('Run: bun scripts/generate-app.ts --help')
  process.exit(1)
}

const config: AppConfig = {
  appId: args[0],
  name: args[1],
  description: args[2],
  icon: args[3],
  color: args[4],
  order: parseInt(args[5]),
}

generateApp(config)
```

### Usage Example

```bash
# Generate Task Scheduler app
cd backend
bun scripts/generate-app.ts \
  task-scheduler \
  "Task Scheduler" \
  "Schedule and manage tasks with AI assistance" \
  calendar \
  green \
  4

# Output:
# 📁 Creating directories...
# 📝 Generating plugin.config.ts...
# 📝 Generating routes.ts...
# 📝 Generating service...
# 📝 Generating repository...
# ✅ App generated successfully!
```

**Generated structure:**

```
backend/src/apps/task-scheduler/
├── plugin.config.ts
├── routes.ts
├── services/
│   └── task-scheduler.service.ts
├── repositories/
│   └── task-scheduler.repository.ts
└── schemas/
```

### After Generation

1. Add Prisma models
2. Run migration
3. Implement business logic
4. Register in loader
5. Build frontend component

---

## Best Practices

### 1. Credit Management

**✅ DO:**
- Always use `deductCredits` middleware before operations
- Always call `recordCreditUsage` after success
- Check balance before expensive operations
- Use atomic transactions for credit operations

**❌ DON'T:**
- Directly modify Credit table from app code
- Skip credit middleware
- Forget to record usage
- Deduct credits after operation (deduct first!)

### 2. Error Handling

**✅ DO:**
- Return 402 for insufficient credits
- Return 401 for unauthorized
- Return 400 for validation errors
- Use try-catch in all routes

**❌ DON'T:**
- Swallow errors silently
- Return generic error messages
- Forget to rollback on failure

### 3. Database Access

**✅ DO:**
- Use Repository pattern
- Use Prisma for all queries
- Create indexes on foreign keys
- Use transactions for related operations

**❌ DON'T:**
- Write raw SQL unless necessary
- Access User, Credit, Payment tables directly from apps
- Skip validation

### 4. Frontend Best Practices

**✅ DO:**
- Update credit balance after operations
- Show credit cost before action
- Handle 402 insufficient credits gracefully
- Redirect to /credits page when needed

**❌ DON'T:**
- Forget to update UI after credit deduction
- Show stale credit balance
- Allow operations without checking credits

### 5. Testing

**Test checklist for each app:**

- [ ] Create operation deducts correct credits
- [ ] Update operation deducts correct credits
- [ ] Delete operation deducts correct credits
- [ ] Read operations don't deduct credits
- [ ] 402 returned when insufficient credits
- [ ] Credit balance updates in response
- [ ] AppUsage record created
- [ ] App statistics updated
- [ ] Transaction rollback on failure
- [ ] Unauthorized access blocked

---

## Comparison with Previous Architecture

### Video Mix Pro (Multi-Database)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  MainApp    │     │  VideoMix   │     │  Carousel   │
│  (3002)     │◄────┤  (8001)     │     │  (8002)     │
│             │ API │             │     │             │
│  MainApp.db │     │ VideoMix.db │     │ Carousel.db │
└─────────────┘     └─────────────┘     └─────────────┘
     │ Credit              │                    │
     │ Authority           │ Sync User          │ Sync User
     │                     ▼                    ▼
     │              HTTP API Call        HTTP API Call
     │              /api/credits/       /api/credits/
     └──────────────deduct──────────────deduct────────
```

**Characteristics:**
- ✅ Complete isolation between apps
- ✅ Can scale apps independently
- ✅ Different tech stacks possible
- ❌ Complex cross-database operations
- ❌ Need API calls for credit operations
- ❌ User sync required (VideoMix adapter)
- ❌ Multiple backup/migration processes
- ❌ Harder to maintain ACID guarantees

### Lumiku App (Single Database)

```
┌────────────────────────────────────────────────────┐
│              Lumiku Backend (3000)                  │
├────────────────────────────────────────────────────┤
│  Core      │  Plugin Layer                         │
│  ──────    │  ──────────────────────────           │
│  Auth      │  Project  Invoice  Analytics          │
│  Payment   │  Manager  Gen      Dashboard          │
│  Credits   │                                        │
│  Devices   │  ▼ All share same database ▼          │
└────────────┴────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  Single Database │
              │   (SQLite/PG)    │
              └──────────────────┘
```

**Characteristics:**
- ✅ Simple architecture
- ✅ Direct database access (no API calls)
- ✅ ACID transactions guaranteed
- ✅ Easier maintenance
- ✅ Single backup/migration
- ✅ Faster development
- ❌ Less isolation
- ❌ Harder to scale independently (but sufficient until 100k+ users)

### When to Switch to Multi-Database?

Consider switching when:
- 100k+ active users
- Apps need independent scaling
- Different teams manage apps
- Apps have very different performance characteristics
- Need polyglot persistence (different DB types)

Until then, single database is simpler and faster to build.

---

## Appendix: Complete File Checklist

When building a new app, create these files:

**Backend:**
- [ ] `plugin.config.ts` - App configuration
- [ ] `routes.ts` - API routes with credit middleware
- [ ] `services/{app}.service.ts` - Business logic
- [ ] `repositories/{app}.repository.ts` - Database operations
- [ ] `schemas/{app}.schema.ts` - Zod validation schemas
- [ ] Update `prisma/schema.prisma` - Add models
- [ ] Update `plugins/loader.ts` - Register plugin

**Frontend:**
- [ ] `apps/{AppName}.tsx` - Main component
- [ ] Update `App.tsx` - Add route
- [ ] Update `Dashboard.tsx` - Add app card (if needed)

**Database:**
- [ ] Run migration: `bun prisma migrate dev`
- [ ] Check indexes created
- [ ] Verify relations

**Testing:**
- [ ] Test credit deduction
- [ ] Test insufficient credits (402)
- [ ] Test unauthorized access (401)
- [ ] Test validation errors (400)
- [ ] Test success flow
- [ ] Test UI credit balance update

---

## Summary

Lumiku App menggunakan **Hybrid Plugin Architecture** dengan:

1. **Single Centralized Database** - Simpler than microservices
2. **Modular Plugin Structure** - Clear separation of concerns
3. **Credit Middleware System** - Reusable and atomic
4. **Plugin Registry** - Dynamic app loading
5. **App Generator Script** - Fast boilerplate generation

**Key Protection:**
- Apps cannot modify core tables directly
- All credits operations through middleware
- Clear folder boundaries
- Standardized patterns

**Development Flow:**
1. Generate app with script
2. Define database models
3. Implement service logic
4. Add routes with credit middleware
5. Register in loader
6. Build frontend component
7. Test thoroughly

This architecture ensures **smooth development** without breaking core systems like auth, billing, and credit management.

---

**Questions?**

Refer to:
- `ARCHITECTURE.md` - Previous Video Mix Pro architecture
- `SSO_IMPLEMENTATION.md` - Authentication flow
- `SETUP.md` - Initial setup guide

---

Built with ❤️ by Lumiku Team
