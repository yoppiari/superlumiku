# Complete Guide: Adding New Apps to Lumiku Platform

> **Last Updated:** October 2025
> **Target Audience:** Developers building new apps for the Lumiku AI platform

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start Template](#quick-start-template)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Real Examples from Existing Apps](#real-examples-from-existing-apps)
5. [Plugin System Deep Dive](#plugin-system-deep-dive)
6. [Database Schema Patterns](#database-schema-patterns)
7. [Frontend Patterns](#frontend-patterns)
8. [API Design Patterns](#api-design-patterns)
9. [Testing Your App](#testing-your-app)
10. [Deployment Checklist](#deployment-checklist)

---

## Architecture Overview

### The Lumiku Plugin Architecture

Lumiku uses a **modular plugin architecture** where each app is a self-contained module with:

```
┌─────────────────────────────────────────────────┐
│              Lumiku Platform Core               │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Avatar  │  │  Carousel│  │   Your   │     │
│  │ Creator  │  │   Mix    │  │   App    │ ... │
│  │ (Plugin) │  │ (Plugin) │  │ (Plugin) │     │
│  └──────────┘  └──────────┘  └──────────┘     │
├─────────────────────────────────────────────────┤
│         Plugin Registry (Auto-discover)         │
└─────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Separation of Concerns**: Backend and frontend are completely separate
2. **Plugin-Based**: Apps register themselves via plugin system
3. **Database-First**: Define Prisma schema for data models
4. **RESTful APIs**: Standard REST endpoints for all operations
5. **Credit System**: Integrated billing for AI operations
6. **Type Safety**: Full TypeScript across the stack

### Technology Stack

- **Backend**: Hono.js (Express alternative), Prisma ORM, PostgreSQL
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **State Management**: Zustand
- **AI Services**: HuggingFace, Segmind, EdenAI
- **Storage**: Local filesystem (configurable to S3)

---

## Quick Start Template

Use this template to describe your new app in natural language. Claude Code will handle the implementation:

```markdown
Create a new app called [APP_NAME].

Description: [One sentence describing what it does]

Icon: [Lucide icon name - see lucide.dev]
Color: [blue/green/purple/orange/red/pink/indigo]

Features:
- [Feature 1] - costs [X] credits
- [Feature 2] - costs [Y] credits
- [Feature 3] - free

Data Models:
- [Model1]: needs [field1, field2, field3]
- [Model2]: needs [field1, field2]

Special Requirements:
- [Any specific AI model to use]
- [Any file processing needs]
- [Any real-time features]

Build complete backend and frontend with plugin system integration.
```

### Example: Invoice Generator

```markdown
Create a new app called Invoice Generator.

Description: Create and manage professional invoices for businesses

Icon: file-text
Color: green

Features:
- Create invoice - costs 10 credits
- Edit invoice - costs 3 credits
- Delete invoice - costs 0 credits
- Add line item - costs 1 credit
- Generate PDF - costs 5 credits
- Send via email - costs 3 credits
- AI suggest line items - costs 8 credits

Data Models:
- Invoice: needs userId, invoiceNumber, clientName, clientEmail, totalAmount, status (paid/unpaid), dueDate, createdAt, updatedAt
- InvoiceItem: needs invoiceId, description, quantity, unitPrice, totalPrice

Build complete backend and frontend with plugin system integration.
```

---

## Step-by-Step Implementation

### Phase 1: Database Schema (Backend)

**File**: `backend/prisma/schema.prisma`

Add your models following the existing pattern:

```prisma
// ========================================
// [YOUR APP NAME] Models
// ========================================

model InvoiceProject {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  invoices Invoice[]

  @@index([userId])
  @@index([userId, createdAt(sort: Desc)])
  @@map("invoice_projects")
}

model Invoice {
  id            String   @id @default(cuid())
  projectId     String
  userId        String
  invoiceNumber String   @unique
  clientName    String
  clientEmail   String?
  totalAmount   Float
  status        String   @default("unpaid") // paid, unpaid, overdue
  dueDate       DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  project InvoiceProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  items   InvoiceItem[]

  @@index([projectId])
  @@index([userId])
  @@index([status])
  @@index([userId, createdAt(sort: Desc)])
  @@map("invoices")
}

model InvoiceItem {
  id          String  @id @default(cuid())
  invoiceId   String
  description String
  quantity    Int
  unitPrice   Float
  totalPrice  Float

  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
  @@map("invoice_items")
}
```

**Important Index Patterns:**
- Always index foreign keys
- Index common query patterns (userId + createdAt)
- Use `onDelete: Cascade` for parent-child relationships

### Phase 2: Backend Plugin Configuration

**File**: `backend/src/apps/invoice-generator/plugin.config.ts`

```typescript
import { PluginConfig } from '../../plugins/types'

export const invoiceGeneratorConfig: PluginConfig = {
  // Identity
  appId: 'invoice-generator',
  name: 'Invoice Generator',
  description: 'Create and manage professional invoices',
  icon: 'file-text',
  version: '1.0.0',

  // Routing
  routePrefix: '/api/apps/invoice-generator',

  // Credits Configuration
  credits: {
    createInvoice: 10,
    editInvoice: 3,
    deleteInvoice: 0,
    addLineItem: 1,
    generatePDF: 5,
    sendEmail: 3,
    aiSuggest: 8,
  },

  // Access Control
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

  // Dashboard
  dashboard: {
    order: 10, // Position in dashboard
    color: 'green',
    stats: {
      enabled: true,
      endpoint: '/api/apps/invoice-generator/stats',
    },
  },
}

export default invoiceGeneratorConfig
```

### Phase 3: Backend Routes

**File**: `backend/src/apps/invoice-generator/routes.ts`

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { AuthVariables } from '../../types/hono'
import { invoiceGeneratorService } from './services/invoice-generator.service'

const app = new Hono<{ Variables: AuthVariables }>()

// ========================================
// Projects Routes
// ========================================

/**
 * GET /api/apps/invoice-generator/projects
 * Get all projects for current user
 */
app.get('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projects = await invoiceGeneratorService.getProjects(userId)

    return c.json({ projects })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * POST /api/apps/invoice-generator/projects
 * Create new project
 */
app.post('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()

    if (!body.name) {
      return c.json({ error: 'Project name is required' }, 400)
    }

    const project = await invoiceGeneratorService.createProject(userId, body)

    return c.json({
      message: 'Project created successfully',
      project,
    })
  } catch (error: any) {
    console.error('Error creating project:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ========================================
// Invoices Routes
// ========================================

/**
 * POST /api/apps/invoice-generator/invoices
 * Create new invoice (deducts credits)
 */
app.post('/invoices', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()

    // Validation
    if (!body.projectId || !body.clientName) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const invoice = await invoiceGeneratorService.createInvoice(userId, body)

    return c.json({
      message: 'Invoice created successfully',
      invoice,
      creditsUsed: 10,
    })
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    return c.json({ error: error.message }, 500)
  }
})

/**
 * GET /api/apps/invoice-generator/invoices/:id
 * Get invoice by ID with items
 */
app.get('/invoices/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const invoiceId = c.req.param('id')

    const invoice = await invoiceGeneratorService.getInvoice(invoiceId, userId)

    return c.json({ invoice })
  } catch (error: any) {
    console.error('Error fetching invoice:', error)
    const status = error.message === 'Invoice not found' ? 404 : 500
    return c.json({ error: error.message }, status)
  }
})

// ========================================
// Stats Route
// ========================================

app.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const stats = await invoiceGeneratorService.getUserStats(userId)

    return c.json({ stats })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app
```

### Phase 4: Backend Service Layer

**File**: `backend/src/apps/invoice-generator/services/invoice-generator.service.ts`

```typescript
import { prisma } from '../../../db/client'
import { creditService } from '../../../services/credit.service'

class InvoiceGeneratorService {
  /**
   * Get all projects for user
   */
  async getProjects(userId: string) {
    return await prisma.invoiceProject.findMany({
      where: { userId },
      include: {
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Create new project
   */
  async createProject(userId: string, data: { name: string; description?: string }) {
    return await prisma.invoiceProject.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
      },
    })
  }

  /**
   * Create new invoice (with credit deduction)
   */
  async createInvoice(userId: string, data: any) {
    // Validate project ownership
    const project = await prisma.invoiceProject.findFirst({
      where: { id: data.projectId, userId },
    })

    if (!project) {
      throw new Error('Project not found')
    }

    // Deduct credits FIRST (throws if insufficient)
    await creditService.deductCredits(
      userId,
      10, // Cost from plugin.config.ts
      'invoice_creation',
      {
        appId: 'invoice-generator',
        action: 'createInvoice',
      }
    )

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        projectId: data.projectId,
        userId,
        invoiceNumber: await this.generateInvoiceNumber(),
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        totalAmount: 0, // Will be calculated from items
        status: 'unpaid',
        dueDate: new Date(data.dueDate),
      },
      include: {
        items: true,
      },
    })

    return invoice
  }

  /**
   * Get invoice by ID (with authorization check)
   */
  async getInvoice(invoiceId: string, userId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId, // Authorization: only owner can view
      },
      include: {
        items: true,
        project: true,
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    return invoice
  }

  /**
   * Get user stats
   */
  async getUserStats(userId: string) {
    const [totalProjects, totalInvoices, totalRevenue] = await Promise.all([
      prisma.invoiceProject.count({ where: { userId } }),
      prisma.invoice.count({ where: { userId } }),
      prisma.invoice.aggregate({
        where: { userId, status: 'paid' },
        _sum: { totalAmount: true },
      }),
    ])

    return {
      totalProjects,
      totalInvoices,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    }
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const date = new Date()
    const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`

    const count = await prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
      },
    })

    return `${prefix}-${String(count + 1).padStart(4, '0')}`
  }
}

export const invoiceGeneratorService = new InvoiceGeneratorService()
```

### Phase 5: Register Plugin

**File**: `backend/src/plugins/loader.ts`

Add your plugin import and registration:

```typescript
import { pluginRegistry } from './registry'

// Import existing plugins
import videoMixerConfig from '../apps/video-mixer/plugin.config'
import videoMixerRoutes from '../apps/video-mixer/routes'
// ... other imports

// YOUR NEW PLUGIN
import invoiceGeneratorConfig from '../apps/invoice-generator/plugin.config'
import invoiceGeneratorRoutes from '../apps/invoice-generator/routes'

export function loadPlugins() {
  // Register existing plugins
  pluginRegistry.register(videoMixerConfig, videoMixerRoutes)

  // YOUR NEW PLUGIN
  pluginRegistry.register(invoiceGeneratorConfig, invoiceGeneratorRoutes)

  console.log(`\n📦 Loaded ${pluginRegistry.getAll().length} plugins`)
}
```

### Phase 6: Frontend Store (State Management)

**File**: `frontend/src/stores/invoiceGeneratorStore.ts`

```typescript
import { create } from 'zustand'
import axios from 'axios'

interface InvoiceProject {
  id: string
  name: string
  description?: string
  invoices: Invoice[]
  createdAt: string
  updatedAt: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail?: string
  totalAmount: number
  status: 'paid' | 'unpaid' | 'overdue'
  dueDate: string
  items: InvoiceItem[]
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface InvoiceGeneratorStore {
  // State
  projects: InvoiceProject[]
  currentProject: InvoiceProject | null
  isLoading: boolean
  error: string | null

  // Actions
  loadProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<InvoiceProject>
  selectProject: (projectId: string) => Promise<void>
  createInvoice: (data: any) => Promise<Invoice>
  deleteInvoice: (invoiceId: string) => Promise<void>
}

export const useInvoiceGeneratorStore = create<InvoiceGeneratorStore>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  // Load all projects
  loadProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/apps/invoice-generator/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      set({ projects: res.data.projects, isLoading: false })
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to load projects', isLoading: false })
    }
  },

  // Create new project
  createProject: async (name: string, description?: string) => {
    const token = localStorage.getItem('token')
    const res = await axios.post(
      '/api/apps/invoice-generator/projects',
      { name, description },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const newProject = res.data.project
    set((state) => ({ projects: [newProject, ...state.projects] }))
    return newProject
  },

  // Select project (load full details)
  selectProject: async (projectId: string) => {
    set({ isLoading: true })
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`/api/apps/invoice-generator/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      set({ currentProject: res.data.project, isLoading: false })
    } catch (error: any) {
      set({ error: error.response?.data?.error, isLoading: false })
    }
  },

  // Create invoice
  createInvoice: async (data: any) => {
    const token = localStorage.getItem('token')
    const res = await axios.post(
      '/api/apps/invoice-generator/invoices',
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    // Refresh current project
    if (get().currentProject?.id === data.projectId) {
      await get().selectProject(data.projectId)
    }

    return res.data.invoice
  },

  // Delete invoice
  deleteInvoice: async (invoiceId: string) => {
    const token = localStorage.getItem('token')
    await axios.delete(`/api/apps/invoice-generator/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    // Refresh current project
    if (get().currentProject) {
      await get().selectProject(get().currentProject!.id)
    }
  },
}))
```

### Phase 7: Frontend Component

**File**: `frontend/src/apps/InvoiceGenerator.tsx`

```typescript
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useInvoiceGeneratorStore } from '../stores/invoiceGeneratorStore'
import { useAuthStore } from '../stores/authStore'
import { FileText, Plus, ArrowLeft, Coins } from 'lucide-react'
import ProfileDropdown from '../components/ProfileDropdown'

export default function InvoiceGenerator() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { user } = useAuthStore()

  const {
    projects,
    currentProject,
    isLoading,
    loadProjects,
    createProject,
    selectProject,
  } = useInvoiceGeneratorStore()

  const [showCreateModal, setShowCreateModal] = useState(false)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Load project if projectId in URL
  useEffect(() => {
    if (projectId) {
      selectProject(projectId)
    }
  }, [projectId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  // Project Detail View
  if (currentProject) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Sticky Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/apps/invoice-generator')}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                      {currentProject.name}
                    </h1>
                    {currentProject.description && (
                      <p className="text-sm text-slate-600">{currentProject.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-lg">
                  <Coins className="w-5 h-5 text-slate-600" />
                  <span className="font-medium text-slate-900">
                    {user?.creditBalance?.toLocaleString() || 0} Credits
                  </span>
                </div>
                <ProfileDropdown />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Invoice
          </button>
        </div>

        {/* Invoices List */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 pb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Invoices</h2>

            {currentProject.invoices.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No invoices yet</p>
                <p className="text-sm text-slate-500">Create your first invoice to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentProject.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="p-4 border border-slate-200 rounded-lg hover:border-green-300 transition cursor-pointer"
                    onClick={() => navigate(`/apps/invoice-generator/invoice/${invoice.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{invoice.invoiceNumber}</h3>
                        <p className="text-sm text-slate-600">{invoice.clientName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          Rp {invoice.totalAmount.toLocaleString()}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                          invoice.status === 'unpaid' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Projects List View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">Invoice Generator</h1>
                  <p className="text-sm text-slate-600">Create and manage professional invoices</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-lg">
                <Coins className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-900">
                  {user?.creditBalance?.toLocaleString() || 0} Credits
                </span>
              </div>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* New Project Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/apps/invoice-generator/${project.id}`)}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-2">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-gray-600 mb-4">{project.description}</p>
              )}
              <div className="text-sm text-gray-500">
                {project.invoices.length} invoices
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Phase 8: Register Frontend Route

**File**: `frontend/src/App.tsx`

Add route for your app:

```typescript
import InvoiceGenerator from './apps/InvoiceGenerator'

function App() {
  return (
    <Routes>
      {/* Existing routes */}
      <Route path="/apps/avatar-creator" element={<AvatarCreator />} />
      <Route path="/apps/avatar-creator/:projectId" element={<AvatarCreator />} />

      {/* YOUR NEW APP */}
      <Route path="/apps/invoice-generator" element={<InvoiceGenerator />} />
      <Route path="/apps/invoice-generator/:projectId" element={<InvoiceGenerator />} />
    </Routes>
  )
}
```

---

## Real Examples from Existing Apps

### Example 1: Avatar Creator (Complex AI Generation)

**What it does:** Creates AI-powered avatars with persona system

**Key Features:**
- Upload avatar images
- Generate avatars using FLUX AI model
- Create from presets
- Track usage across other apps
- Full persona system (name, age, personality, background)

**Database Schema:**
```prisma
model AvatarProject {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  avatars Avatar[]

  @@index([userId])
  @@index([userId, createdAt(sort: Desc)])
  @@map("avatar_projects")
}

model Avatar {
  id       String  @id @default(cuid())
  userId   String
  projectId String

  name         String
  baseImageUrl String
  thumbnailUrl String?

  // Persona fields
  personaName        String?
  personaAge         Int?
  personaPersonality String? @db.Text
  personaBackground  String? @db.Text

  // Visual attributes
  gender    String?
  ageRange  String?
  style     String?

  // Generation info
  sourceType       String // uploaded, text_to_image, from_preset
  generationPrompt String? @db.Text

  // Usage tracking
  usageCount Int       @default(0)
  lastUsedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project      AvatarProject        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  usageHistory AvatarUsageHistory[]

  @@index([userId])
  @@index([projectId])
  @@index([userId, usageCount(sort: Desc)])
  @@map("avatars")
}
```

**Plugin Configuration:**
```typescript
export const avatarCreatorConfig: PluginConfig = {
  appId: 'avatar-creator',
  name: 'Avatar Creator',
  description: 'Create realistic AI avatars with persona',
  icon: 'user-circle',
  version: '1.0.0',

  routePrefix: '/api/apps/avatar-creator',

  credits: {
    generateAvatar: 10,     // FLUX AI generation
    uploadAvatar: 2,        // Upload + processing
    fromPreset: 8,          // Generate from preset
    editPersona: 0,         // Free to edit
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
    color: 'purple',
    stats: {
      enabled: true,
      endpoint: '/api/apps/avatar-creator/stats',
    },
  },
}
```

**Key API Endpoints:**
```typescript
// Projects CRUD
GET    /api/apps/avatar-creator/projects
POST   /api/apps/avatar-creator/projects
GET    /api/apps/avatar-creator/projects/:id
PUT    /api/apps/avatar-creator/projects/:id
DELETE /api/apps/avatar-creator/projects/:id

// Avatar Management
POST   /api/apps/avatar-creator/projects/:projectId/avatars/upload
POST   /api/apps/avatar-creator/projects/:projectId/avatars/generate
POST   /api/apps/avatar-creator/projects/:projectId/avatars/from-preset
GET    /api/apps/avatar-creator/avatars/:id
PUT    /api/apps/avatar-creator/avatars/:id
DELETE /api/apps/avatar-creator/avatars/:id

// Generation Status
GET    /api/apps/avatar-creator/generations/:id

// Usage Tracking
GET    /api/apps/avatar-creator/avatars/:id/usage-history

// Presets
GET    /api/apps/avatar-creator/presets
GET    /api/apps/avatar-creator/presets/:id

// Stats
GET    /api/apps/avatar-creator/stats
```

**Credit Deduction Pattern:**
```typescript
async generateAvatar(projectId: string, userId: string, data: any) {
  // Step 1: Validate project ownership
  const project = await prisma.avatarProject.findFirst({
    where: { id: projectId, userId },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // Step 2: Deduct credits FIRST (throws if insufficient)
  await creditService.deductCredits(
    userId,
    10, // Cost from config
    'avatar_generation',
    {
      appId: 'avatar-creator',
      action: 'generateAvatar',
      projectId,
    }
  )

  // Step 3: Create generation record
  const generation = await prisma.avatarGeneration.create({
    data: {
      userId,
      projectId,
      prompt: data.prompt,
      status: 'pending',
      options: JSON.stringify(data),
    },
  })

  // Step 4: Queue background job
  await queueAvatarGeneration(generation.id)

  return generation
}
```

### Example 2: Carousel Mix (File Processing + AI)

**What it does:** Generates carousel post variations with smart text/image combinations

**Key Features:**
- Upload images/videos for each position
- Add text variations per position
- Position-based text styling
- Generate multiple carousel sets
- Smart mixing algorithms (sequential, random, weighted)

**Database Schema:**
```prisma
model CarouselProject {
  id               String   @id @default(cuid())
  userId           String
  name             String
  description      String?
  defaultNumSlides Int      @default(4)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  slides           CarouselSlide[]
  texts            CarouselText[]
  generations      CarouselGeneration[]
  positionSettings CarouselPositionSettings[]

  @@index([userId])
  @@index([userId, createdAt(sort: Desc)])
  @@map("carousel_projects")
}

model CarouselSlide {
  id            String   @id @default(cuid())
  projectId     String
  slidePosition Int      // Which position (1, 2, 3, 4)
  fileName      String
  filePath      String
  fileType      String   // 'image' or 'video'
  order         Int

  project CarouselProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([projectId, slidePosition])
  @@map("carousel_slides")
}

model CarouselText {
  id            String   @id @default(cuid())
  projectId     String
  slidePosition Int      // Which position (1, 2, 3, 4)
  content       String
  order         Int

  project CarouselProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([projectId, slidePosition])
  @@map("carousel_texts")
}

model CarouselPositionSettings {
  id            String @id @default(cuid())
  projectId     String
  slidePosition Int

  // Text styling (shared across all texts in this position)
  fontFamily      String @default("Inter")
  fontSize        Int    @default(32)
  fontColor       String @default("#FFFFFF")
  fontWeight      Int    @default(700)
  backgroundColor String @default("rgba(0, 0, 0, 0.5)")

  // Position
  textPosition  String @default("center")
  textAlignment String @default("center")
  positionX     Int    @default(50)
  positionY     Int    @default(50)

  project CarouselProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, slidePosition])
  @@map("carousel_position_settings")
}

model CarouselGeneration {
  id               String @id @default(cuid())
  projectId        String
  userId           String
  status           String @default("pending")
  numSlides        Int    // 2, 4, 6, or 8
  numSetsGenerated Int
  creditUsed       Int

  // Text variation algorithm
  textVariationAlgo     String? @default("sequential")
  textVariationSettings String? // JSON

  outputPath  String? // ZIP file path
  outputPaths String? // JSON array

  createdAt   DateTime  @default(now())
  completedAt DateTime?

  project CarouselProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([userId])
  @@index([status])
  @@map("carousel_generations")
}
```

**Credit Calculation:**
```typescript
// Dynamic credit calculation based on generation complexity
credits: {
  baseGeneration: 5,      // Base cost per carousel
  perSlide: 2,            // Cost per slide
  perTextVariation: 1,    // Cost per text variation
  bulkMultiplier: 1.5,    // For 10+ sets
}

// Example: 4-slide carousel with 3 text variations per position
// = 5 (base) + (4 * 2) + (4 * 3 * 1) = 5 + 8 + 12 = 25 credits
```

**Key Service Methods:**
```typescript
async generateCarousels(projectId: string, userId: string, options: any) {
  // Calculate credits dynamically
  const creditCost = this.calculateCreditCost(options)

  // Deduct credits
  await creditService.deductCredits(userId, creditCost, 'carousel_generation')

  // Create generation record
  const generation = await prisma.carouselGeneration.create({
    data: {
      projectId,
      userId,
      numSlides: options.numSlides,
      numSetsGenerated: options.numSets,
      creditUsed: creditCost,
      textVariationAlgo: options.textVariationAlgo,
    },
  })

  // Queue background worker
  await queueCarouselGeneration(generation.id)

  return generation
}
```

---

## Plugin System Deep Dive

### Understanding PluginConfig

The `PluginConfig` interface is the contract between your app and the platform:

```typescript
export interface PluginConfig {
  // App Identity
  appId: string                       // Unique ID: 'invoice-generator'
  name: string                        // Display name: 'Invoice Generator'
  description: string                 // Short description for dashboard
  icon: string                        // Lucide icon name: 'file-text'
  version: string                     // Semantic version: '1.0.0'

  // Routing
  routePrefix: string                 // API prefix: '/api/apps/invoice-generator'

  // Credits Configuration
  credits: Record<string, number>     // { createInvoice: 10, editInvoice: 3 }

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
    order: number                     // Display order (1-10)
    color: string                     // Card color
    stats: {
      enabled: boolean                // Show usage stats?
      endpoint: string                // Stats API endpoint
    }
  }
}
```

### Plugin Registry Flow

```
1. App Definition
   └─> plugin.config.ts (Configuration)
   └─> routes.ts (API endpoints)

2. Plugin Loader
   └─> Imports plugin config + routes
   └─> Registers in PluginRegistry

3. Platform Core
   └─> Loads all plugins via loadPlugins()
   └─> Mounts routes with prefix
   └─> Shows in dashboard

4. Frontend
   └─> Fetches enabled apps from /api/apps
   └─> Renders app cards in dashboard
```

### Auto-Discovery

The platform automatically:
- Discovers all registered plugins
- Mounts their routes at the specified prefix
- Shows enabled apps in dashboard
- Handles authorization per access rules
- Tracks usage statistics

---

## Database Schema Patterns

### Common Patterns

1. **Project-Based Structure** (Recommended)
```prisma
model YourAppProject {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations to child entities
  items YourAppItem[]

  @@index([userId])
  @@index([userId, createdAt(sort: Desc)])
  @@map("your_app_projects")
}

model YourAppItem {
  id        String   @id @default(cuid())
  projectId String
  // ... item fields
  createdAt DateTime @default(now())

  project YourAppProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@map("your_app_items")
}
```

2. **Generation/Job Pattern** (For async AI tasks)
```prisma
model YourAppGeneration {
  id        String   @id @default(cuid())
  userId    String
  projectId String?
  status    String   @default("pending") // pending, processing, completed, failed

  // Input
  prompt   String @db.Text
  options  String? @db.Text // JSON

  // Output
  outputPath   String?
  errorMessage String? @db.Text

  // Metadata
  creditUsed Int
  createdAt   DateTime  @default(now())
  completedAt DateTime?

  @@index([userId])
  @@index([status])
  @@index([userId, status])
  @@index([userId, createdAt(sort: Desc)])
  @@index([status, createdAt]) // For job queue
  @@map("your_app_generations")
}
```

3. **Usage Tracking Pattern**
```prisma
model YourAppUsage {
  id            String   @id @default(cuid())
  userId        String
  appId         String
  action        String
  referenceId   String?
  referenceType String?
  creditUsed    Int
  metadata      String?  @db.Text // JSON
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([userId, createdAt(sort: Desc)])
  @@index([appId])
  @@map("your_app_usage")
}
```

### Index Strategy

**Always index:**
- Foreign keys (userId, projectId, etc.)
- Status fields (for filtering)
- Timestamps with DESC for recent queries
- Composite indexes for common query patterns

**Example:**
```prisma
@@index([userId])                         // Filter by user
@@index([status])                         // Filter by status
@@index([userId, createdAt(sort: Desc)])  // User's recent items
@@index([status, createdAt])              // Queue processing order
@@index([userId, status])                 // User's items by status
```

---

## Frontend Patterns

### Standard Component Structure

Every app follows this structure:

```typescript
export default function YourApp() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { user } = useAuthStore()

  const {
    projects,
    currentProject,
    isLoading,
    loadProjects,
    selectProject,
  } = useYourAppStore()

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Load project if ID in URL
  useEffect(() => {
    if (projectId) {
      selectProject(projectId)
    }
  }, [projectId])

  if (isLoading) {
    return <LoadingScreen />
  }

  // Two views: Project Detail or Projects List
  if (currentProject) {
    return <ProjectDetailView />
  }

  return <ProjectsListView />
}
```

### Standard Header Component

All apps use a consistent sticky header:

```typescript
<div className="bg-white border-b border-slate-200 sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
    <div className="flex items-center justify-between">
      {/* Left: Back button + Icon + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <YourIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {appName}
            </h1>
            <p className="text-sm text-slate-600">{description}</p>
          </div>
        </div>
      </div>

      {/* Right: Credits + Profile */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-lg">
          <Coins className="w-5 h-5 text-slate-600" />
          <span className="font-medium text-slate-900">
            {user?.creditBalance?.toLocaleString() || 0} Credits
          </span>
        </div>
        <ProfileDropdown />
      </div>
    </div>
  </div>
</div>
```

### State Management Pattern (Zustand)

```typescript
import { create } from 'zustand'
import axios from 'axios'

interface YourAppStore {
  // State
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null

  // Actions
  loadProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<Project>
  selectProject: (id: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

export const useYourAppStore = create<YourAppStore>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  // Actions
  loadProjects: async () => {
    set({ isLoading: true })
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/apps/your-app/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      set({ projects: res.data.projects, isLoading: false })
    } catch (error: any) {
      set({ error: error.response?.data?.error, isLoading: false })
    }
  },

  createProject: async (name: string, description?: string) => {
    const token = localStorage.getItem('token')
    const res = await axios.post(
      '/api/apps/your-app/projects',
      { name, description },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const newProject = res.data.project
    set((state) => ({ projects: [newProject, ...state.projects] }))
    return newProject
  },

  selectProject: async (id: string) => {
    set({ isLoading: true })
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`/api/apps/your-app/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      set({ currentProject: res.data.project, isLoading: false })
    } catch (error: any) {
      set({ error: error.response?.data?.error, isLoading: false })
    }
  },

  deleteProject: async (id: string) => {
    const token = localStorage.getItem('token')
    await axios.delete(`/api/apps/your-app/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    set((state) => ({
      projects: state.projects.filter(p => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }))
  },
}))
```

---

## API Design Patterns

### Standard CRUD Endpoints

Every app follows this pattern:

```typescript
// Projects
GET    /api/apps/your-app/projects              // List all
POST   /api/apps/your-app/projects              // Create new
GET    /api/apps/your-app/projects/:id          // Get by ID
PUT    /api/apps/your-app/projects/:id          // Update
DELETE /api/apps/your-app/projects/:id          // Delete

// Items (child resources)
GET    /api/apps/your-app/projects/:projectId/items
POST   /api/apps/your-app/projects/:projectId/items
GET    /api/apps/your-app/items/:id
PUT    /api/apps/your-app/items/:id
DELETE /api/apps/your-app/items/:id

// AI Generation (if applicable)
POST   /api/apps/your-app/generate              // Start generation
GET    /api/apps/your-app/generations/:id       // Check status

// Stats
GET    /api/apps/your-app/stats                 // User statistics
```

### Error Handling Pattern

```typescript
app.get('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')

    const project = await service.getProject(projectId, userId)

    return c.json({ project })
  } catch (error: any) {
    console.error('Error fetching project:', error)

    // Map specific errors to HTTP status codes
    const statusCode =
      error.message === 'Project not found' ? 404 :
      error.message === 'Unauthorized' ? 403 :
      500

    return c.json({
      error: error.message || 'Failed to fetch project'
    }, statusCode)
  }
})
```

### Authorization Pattern

```typescript
async getProject(projectId: string, userId: string) {
  const project = await prisma.yourAppProject.findFirst({
    where: {
      id: projectId,
      userId, // IMPORTANT: Authorization check
    },
    include: {
      items: true,
    },
  })

  if (!project) {
    throw new Error('Project not found') // Returns 404
  }

  return project
}
```

### Credit Deduction Pattern

```typescript
async createItem(projectId: string, userId: string, data: any) {
  // Step 1: Validate ownership
  const project = await prisma.yourAppProject.findFirst({
    where: { id: projectId, userId },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // Step 2: Deduct credits FIRST (throws if insufficient)
  await creditService.deductCredits(
    userId,
    10, // Cost from plugin.config.ts
    'item_creation',
    {
      appId: 'your-app',
      action: 'createItem',
      projectId,
    }
  )

  // Step 3: Create item (only if credits deducted successfully)
  const item = await prisma.yourAppItem.create({
    data: {
      projectId,
      ...data,
    },
  })

  return item
}
```

---

## Testing Your App

### Local Development Testing

1. **Start Backend**
```bash
cd backend
npm run dev
```

2. **Start Frontend**
```bash
cd frontend
npm run dev
```

3. **Test Plugin Registration**
```bash
curl http://localhost:3000/api/apps/your-app/health
```

Expected response:
```json
{
  "status": "ok",
  "app": "your-app",
  "message": "Your App API is running"
}
```

4. **Test Authentication**
```bash
# Login first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token in subsequent requests
curl http://localhost:3000/api/apps/your-app/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Testing Checklist

- [ ] Plugin registers successfully on backend start
- [ ] All CRUD endpoints work (create, read, update, delete)
- [ ] Authorization checks prevent unauthorized access
- [ ] Credit deduction works correctly
- [ ] Insufficient credits are handled gracefully
- [ ] Frontend loads without errors
- [ ] State management updates correctly
- [ ] Navigation between views works
- [ ] Error messages display properly
- [ ] Loading states show correctly

### Common Issues

**Plugin not showing in dashboard:**
- Check `features.enabled` is `true` in config
- Verify plugin is imported in `loader.ts`
- Check `features.comingSoon` is `false`

**Authorization errors:**
- Verify `authMiddleware` is applied to routes
- Check userId is extracted correctly: `c.get('userId')`
- Ensure database queries filter by userId

**Credit deduction fails:**
- Check credit amount in plugin.config.ts
- Verify creditService.deductCredits is called BEFORE operation
- Ensure error handling doesn't proceed after deduction failure

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run database migration: `npx prisma migrate deploy`
- [ ] Test all endpoints in staging
- [ ] Verify credit costs are correct
- [ ] Check file upload limits (if applicable)
- [ ] Test with production-like data
- [ ] Review error logging
- [ ] Check memory usage with concurrent users

### Environment Variables

Add to `.env.production`:
```bash
# Your app specific variables (if any)
YOUR_APP_API_KEY=xxx
YOUR_APP_MAX_FILE_SIZE=10485760  # 10MB
```

### Database Migration

```bash
# Create migration
npx prisma migrate dev --name add_your_app_models

# Deploy to production
npx prisma migrate deploy
```

### Monitoring

Monitor these metrics:
- API response times
- Credit deduction accuracy
- Error rates
- File storage usage (if applicable)
- AI generation success rate

---

## Quick Reference

### File Structure Template

```
backend/
├── prisma/
│   └── schema.prisma                          # Add your models here
├── src/
│   ├── apps/
│   │   └── your-app/
│   │       ├── plugin.config.ts               # Plugin configuration
│   │       ├── routes.ts                      # API endpoints
│   │       ├── types.ts                       # TypeScript types
│   │       ├── services/
│   │       │   └── your-app.service.ts        # Business logic
│   │       └── repositories/
│   │           └── your-app.repository.ts     # Database queries
│   └── plugins/
│       └── loader.ts                          # Register plugin here

frontend/
├── src/
│   ├── apps/
│   │   └── YourApp.tsx                        # Main component
│   ├── stores/
│   │   └── yourAppStore.ts                    # State management
│   ├── components/
│   │   ├── CreateProjectModal.tsx             # Reusable modals
│   │   └── ...
│   └── App.tsx                                # Add route here
```

### Common Lucide Icons

- `file-text` - Documents, invoices
- `user-circle` - Avatars, profiles
- `layers` - Carousels, stacks
- `video` - Video apps
- `image` - Image processing
- `sparkles` - AI features
- `calendar` - Scheduling, dates
- `check-circle` - Tasks, habits
- `folder` - Projects, folders
- `settings` - Configuration
- `chart-bar` - Analytics, stats

### Credit Cost Guidelines

- **Simple CRUD** (edit, delete): 0-2 credits
- **Create operation**: 5-10 credits
- **File processing**: 5-15 credits
- **AI generation (simple)**: 10-20 credits
- **AI generation (complex)**: 20-50 credits
- **Bulk operations**: Add 1.5x multiplier

---

## Next Steps

1. Read `PLUGIN_TEMPLATE/` for complete boilerplate code
2. Follow `CAROUSEL_GENERATOR_TUTORIAL.md` for a worked example
3. Check `COMMON_PITFALLS.md` for troubleshooting
4. Review existing apps for patterns

## Resources

- **Lucide Icons**: https://lucide.dev/icons
- **Prisma Docs**: https://www.prisma.io/docs
- **Hono Docs**: https://hono.dev
- **TailwindCSS**: https://tailwindcss.com/docs

---

**Questions?** Check the troubleshooting guide or review existing app implementations in `backend/src/apps/` and `frontend/src/apps/`.
