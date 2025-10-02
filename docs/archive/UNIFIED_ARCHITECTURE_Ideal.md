# Lumiku AI Suite - Unified Platform Architecture

> **Purpose**: Complete technical blueprint for building a unified AI tools platform with modular architecture, centralized billing, and seamless tool integration.

**Version**: 1.0
**Last Updated**: 2025-09-30
**Target**: Production-ready SaaS platform
**Inspiration**: Freepik AI Suite unified experience

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Vision & Goals](#2-platform-vision--goals)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Plugin System - Tool Integration](#6-plugin-system---tool-integration)
7. [Credit System & Billing](#7-credit-system--billing)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Database Architecture](#9-database-architecture)
10. [File Structure](#10-file-structure)
11. [Development Workflow](#11-development-workflow)
12. [Deployment Strategy](#12-deployment-strategy)
13. [Adding New Tools - Step by Step](#13-adding-new-tools---step-by-step)

---

## 1. Executive Summary

### 1.1 What We're Building

**Lumiku AI Suite** is a unified SaaS platform that provides multiple AI-powered content creation tools through a single, seamless interface - similar to Freepik's AI Suite experience.

**Key Characteristics**:
- **Single Page Application (SPA)**: One cohesive frontend with smooth transitions
- **Unified Navigation**: Sidebar navigation to switch between tools instantly
- **Centralized Billing**: One credit balance, used across all tools
- **Modular Tools**: Each tool is a plugin that can be added/removed independently
- **Consistent UX**: Shared design system and components across all tools

### 1.2 Core Principles

1. **Plugin Architecture First**: Tools are plugins, not separate apps
2. **Single Source of Truth**: One database for users, one for credits, one for auth
3. **Progressive Enhancement**: Start simple, add complexity when needed
4. **Developer Experience**: Adding new tool should take < 1 hour
5. **User Experience**: Navigation between tools should feel instant

### 1.3 Technology Stack

```typescript
// Frontend
- React 18+ with TypeScript
- Vite for build tooling (faster than CRA)
- React Router 6 (client-side routing)
- Zustand (lightweight state management)
- TailwindCSS + Radix UI (design system)
- React Query (server state management)

// Backend
- Bun runtime (fast, TypeScript-native)
- Hono framework (lightweight, fast routing)
- Prisma ORM (type-safe database)
- PostgreSQL (production) / SQLite (development)

// Infrastructure
- Monorepo with workspaces
- Shared packages for common functionality
- Environment-based configuration
```

---

## 2. Platform Vision & Goals

### 2.1 User Journey

```
Landing Page → Login/Register (100 free credits)
    ↓
Dashboard (All Tools View)
    ↓
Select Tool → Tool Interface
    ↓
Use Tool → Credits Deducted
    ↓
Navigate to Another Tool (instant, no reload)
    ↓
Buy More Credits (when needed)
```

### 2.2 Current Tools (from existing Architecture)

1. **Video Mix Pro** - Video processing with anti-fingerprinting
2. **Carousel Generator** - AI-powered carousel creation
3. **[Future Tools]** - Easy to add with plugin system

### 2.3 Design Principles (Based on Freepik)

**Main Tools Grid Layout** (Route: `/dashboard` or `/tools`):
```
┌────────────────────────────────────────────────────────────────────┐
│  [LOGO] Lumiku Suite   [All tools][Image][Video][Audio][Other]  [Pricing] [👤] │
├──────────┬─────────────────────────────────────────────────────────┤
│ 🏠 Home  │                                                         │
│ ✨ AI Tools │  "What can I help you create?"                      │
│          │                                                         │
│ Pinned   │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│ ⚡ All tools │ Video  │ │Carousel│ │ Image  │ │ Audio  │          │
│ 📋 My work  │  Mix   │ │ Gen    │ │Upscaler│ │ Tools  │          │
│ 💳 Credits  │  Pro   │ │  Pro   │ │        │ │        │          │
│ 👤 Profile  │        │ │        │ │        │ │        │          │
│          │  └────────┘ └────────┘ └────────┘ └────────┘          │
│          │                                                         │
│          │  All tools by category:                                │
│          │                                                         │
│ [Get plan]│  🖼️  IMAGE TOOLS                                      │
│ Unlock    │  ┌────┐ ┌────┐ ┌────┐ ┌────┐                         │
│   more    │  │Gen │ │Edit│ │Up  │ │BG  │ ...                     │
│          │  └────┘ └────┘ └────┘ └────┘                         │
│          │                                                         │
│          │  🎬  VIDEO TOOLS                                       │
│          │  ┌────┐ ┌────┐ ┌────┐                                 │
│          │  │Mix │ │Clip│ │Gen │ ...                             │
│          │  └────┘ └────┘ └────┘                                 │
│          │                                                         │
│          │  🎵  AUDIO TOOLS                                       │
│          │  ┌────┐ ┌────┐                                         │
│          │  │Vce │ │SFX │ ...                                     │
│          │  └────┘ └────┘                                         │
└──────────┴─────────────────────────────────────────────────────────┘
```

**Tool Interface Layout** (Route: `/tools/video-mix`):
```
┌─────────────────────────────────────────────────────────────────────────┐
│  [LOGO] ✨ Lumiku Suite / Video Mix Pro    [History▾]  [💰 Credits] [👤] │
├─────────────┬───────────────────────────────────────────────────────────┤
│             │                                                           │
│ 📤 Upload   │  "Upload your videos to start mixing"                    │
│             │  ┌──────────────────────────────────────────────────┐    │
│ Drop files  │  │  [Drag & drop or click to upload]               │    │
│ or click    │  │                                                  │    │
│             │  └──────────────────────────────────────────────────┘    │
│             │                                                           │
│ ⚙️ Settings │  Video preview and arrangement                           │
│             │                                                           │
│ 🎯 Mode     │  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│ Auto Mix >  │  │ video1   │ │ video2   │ │ video3   │                  │
│             │  │  [preview]│ │ [preview]│ │ [preview]│                  │
│ 🎬 Output   │  └──────────┘ └──────────┘ └──────────┘                  │
│ Format >    │                                                           │
│             │  Try other tools:                                         │
│ 🎨 Quality  │  ┌──────────┐ ┌──────────┐                               │
│ HD 1080p >  │  │Carousel  │ │  Image   │                               │
│             │  │Generator │ │ Upscaler │                               │
│ 🔀 Options  │  └──────────┘ └──────────┘                               │
│           > │                                                           │
│  ☑️ Order mix                                                           │
│  ☑️ Speed var│  Recent outputs                                          │
│  ☐ Trimming │  ┌────┐ ┌────┐ ┌────┐ ┌────┐                             │
│             │  │Out1│ │Out2│ │Out3│ │Out4│                             │
│ 📊 Count    │  └────┘ └────┘ └────┘ └────┘                             │
│ [-] 10 [+]  │                                                           │
│             │  💡 Tip: Use Auto Mix mode for AI-powered variants       │
│ 💰 Credits  │      Credit cost: ~8 credits for 10 videos               │
│ Required: 8 │                                                           │
│             │                                                           │
│ [Process]   │                                                           │
│             │                                                           │
└─────────────┴───────────────────────────────────────────────────────────┘
```

**Key UX Patterns (Adapted from Freepik)**:

1. **Top Navigation Bar (Always Visible)**
   - Logo + "Lumiku Suite" branding on left
   - Context (breadcrumb): "Lumiku Suite / Tool Name"
   - Action buttons (History dropdown when in tool) in middle
   - Credit display + User menu on right
   - Filter tabs (when on tools grid page)

2. **Left Sidebar (Persistent)**
   - **Main Navigation**: Home, AI Tools (main section)
   - **Pinned Section**: All tools, My work, Credits, Profile
   - **Upsell**: "Get a plan - Unlock more" button at bottom
   - Width: ~240px, collapsible on mobile
   - Simple, clean navigation focused on AI tools

3. **Main Content Area**
   - **Tools Grid View** (`/dashboard` or `/tools`):
     - Header: "What can I help you create?"
     - Filter tabs at top (All tools, Image, Video, Audio, Other)
     - Featured tools grid (3-4 large cards with thumbnails)
     - Categorized sections with category icons (IMAGE, VIDEO, AUDIO)
     - Smaller tool cards in grid (6 columns on desktop)
     - Upsell banner at bottom

   - **Tool Interface View** (`/tools/{tool-id}`):
     - Left settings panel (~320px, collapsible)
     - Main canvas/workspace area (flex-1)
     - "Try other tools" section below canvas
     - Recent outputs/history gallery
     - Tips and credit cost display

4. **Settings Panel in Tool View**
   - Collapsible accordion sections with icons
   - Each section expandable with chevron ">"
   - Visual toggle switches and sliders
   - Number selectors with +/- buttons
   - Credit cost calculator (live update)
   - Primary action button at bottom (Process/Generate)
   - Toggle button to hide/show panel (chevron icon)

5. **Responsive Behavior**
   - **Desktop (lg+)**: Full sidebar + settings panel visible
   - **Tablet (md)**: Sidebar hidden by default, overlay on toggle
   - **Mobile (sm)**: Sidebar becomes overlay, settings panel becomes bottom sheet
   - Tool cards: 4 cols → 3 cols → 2 cols → 1 col
   - Featured grid: 4 → 2 → 1 column

6. **Navigation Flow**
   - Instant client-side navigation between tools (no page reload)
   - Breadcrumb navigation always visible
   - Sidebar stays persistent (no remount)
   - Smooth transitions between views

---

## 3. System Architecture Overview

### 3.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Bun Server (Port 3000)                │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Hono API Router                       │ │
│  │  /api/auth/*                                      │ │
│  │  /api/credits/*                                   │ │
│  │  /api/tools/*  (registry)                        │ │
│  │  /api/tools/video-mix/*  (plugin routes)        │ │
│  │  /api/tools/carousel/*   (plugin routes)        │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                           ↕
┌──────────────────────────────────────────────────────────┐
│              React SPA (Single Build)                    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         React Router (Client-side)                 │ │
│  │  /                      → Landing/Home            │ │
│  │  /login                 → Login Page              │ │
│  │  /dashboard             → Main Dashboard          │ │
│  │  /tools                 → All Tools Grid          │ │
│  │  /tools/video-mix       → Video Mix Interface    │ │
│  │  /tools/carousel        → Carousel Interface     │ │
│  │  /credits               → Credit Management       │ │
│  │  /profile               → User Profile            │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         Plugin Container (Dynamic)                 │ │
│  │  - Loads tool components dynamically              │ │
│  │  - Isolates tool state                           │ │
│  │  - Manages tool lifecycle                        │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                           ↕
┌──────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    users     │  │   credits    │  │  sessions    │  │
│  │   (auth)     │  │ (billing)    │  │   (auth)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ tool_configs │  │ video_mix_*  │  │ carousel_*   │  │
│  │  (registry)  │  │ (tool data)  │  │ (tool data)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Single SPA** | Seamless navigation, shared state, better UX than iframe/micro-frontends |
| **Plugin System** | Easy to add tools, maintainable, modular |
| **Unified Backend** | Consistent API, easier auth, simpler deployment |
| **Single Database** | No sync issues, ACID transactions, simpler |
| **Client-side Routing** | Instant navigation, better perceived performance |
| **Zustand over Redux** | Lighter, less boilerplate, sufficient for our needs |
| **React Query** | Handles caching, refetching, loading states automatically |

### 3.3 Data Flow

**User Action → State Update → API Call → Database → Response → UI Update**

Example: Generating a carousel
```typescript
1. User clicks "Generate" in Carousel tool
2. Zustand updates: toolState.isGenerating = true
3. React Query mutation: POST /api/tools/carousel/generate
4. Backend:
   - Validates request
   - Checks credits via CreditService
   - Deducts credits (atomic transaction)
   - Calls CarouselPlugin.generate()
   - Saves to database
   - Returns result
5. React Query updates cache
6. Zustand updates: toolState.result = data
7. UI rerenders with new carousel
```

---

## 4. Frontend Architecture

### 4.1 Project Structure

```
frontend/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component with router
│   ├── routes/                     # Route definitions
│   │   ├── index.tsx              # Route configuration
│   │   ├── ProtectedRoute.tsx     # Auth wrapper
│   │   └── ToolRoute.tsx          # Tool loader wrapper
│   │
│   ├── layouts/                    # Layout components
│   │   ├── RootLayout.tsx         # Main layout (persistent sidebar)
│   │   ├── TopBar.tsx             # Top navigation bar
│   │   ├── Sidebar.tsx            # Left sidebar navigation
│   │   ├── ToolsGridLayout.tsx    # Layout for tools grid page
│   │   ├── ToolInterfaceLayout.tsx # Layout for individual tool
│   │   └── AuthLayout.tsx         # Login/register layout
│   │
│   ├── pages/                      # Page components
│   │   ├── Home.tsx               # Landing page
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   ├── ToolsGrid.tsx          # All tools view
│   │   ├── Login.tsx              # Authentication
│   │   ├── Credits.tsx            # Credit management
│   │   └── Profile.tsx            # User profile
│   │
│   ├── tools/                      # Tool plugins (modular)
│   │   ├── registry.ts            # Tool registration
│   │   ├── types.ts               # Tool interfaces
│   │   ├── ToolContainer.tsx      # Plugin wrapper
│   │   │
│   │   ├── video-mix/             # Video Mix tool
│   │   │   ├── index.tsx          # Tool entry point
│   │   │   ├── VideoMixTool.tsx   # Main component
│   │   │   ├── components/        # Tool-specific components
│   │   │   ├── hooks/             # Tool-specific hooks
│   │   │   ├── store.ts           # Tool state (Zustand)
│   │   │   ├── api.ts             # Tool API calls
│   │   │   └── config.ts          # Tool configuration
│   │   │
│   │   └── carousel/              # Carousel tool (same structure)
│   │       ├── index.tsx
│   │       ├── CarouselTool.tsx
│   │       └── ...
│   │
│   ├── components/                 # Shared components
│   │   ├── ui/                    # Base UI components (Radix)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── shared/                # Business components
│   │   │   ├── CreditDisplay.tsx
│   │   │   ├── ToolCard.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── ...
│   │   │
│   │   └── providers/             # Context providers
│   │       ├── AuthProvider.tsx
│   │       ├── ThemeProvider.tsx
│   │       └── QueryProvider.tsx
│   │
│   ├── stores/                     # Global state (Zustand)
│   │   ├── authStore.ts           # Authentication state
│   │   ├── creditStore.ts         # Credit balance
│   │   └── uiStore.ts             # UI state (sidebar, theme)
│   │
│   ├── lib/                        # Utilities & config
│   │   ├── api.ts                 # Axios instance with interceptors
│   │   ├── queryClient.ts         # React Query config
│   │   ├── utils.ts               # Helper functions
│   │   └── constants.ts           # Constants
│   │
│   ├── hooks/                      # Global hooks
│   │   ├── useAuth.ts             # Authentication hook
│   │   ├── useCredits.ts          # Credit management hook
│   │   └── useTools.ts            # Tool registry hook
│   │
│   └── types/                      # TypeScript types
│       ├── index.ts               # Shared types
│       ├── api.ts                 # API types
│       └── tools.ts               # Tool types
│
├── public/                         # Static assets
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 4.2 Layout Implementation (Freepik-Style)

#### 4.2.1 Root Layout Component

```typescript
// frontend/src/layouts/RootLayout.tsx

import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useState } from 'react'

export default function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Persistent Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

#### 4.2.2 Top Bar Component

```typescript
// frontend/src/layouts/TopBar.tsx

import { useLocation, Link } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'
import CreditDisplay from '@/components/shared/CreditDisplay'
import UserMenu from '@/components/shared/UserMenu'
import { useToolContext } from '@/hooks/useToolContext'

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation()
  const { currentTool } = useToolContext()

  // Build breadcrumb
  const getBreadcrumb = () => {
    if (location.pathname.startsWith('/tools/') && currentTool) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <Link to="/tools" className="text-gray-600 hover:text-gray-900">
            AI Suite
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{currentTool.name}</span>
        </div>
      )
    }
    return <span className="text-gray-900 font-medium">AI Suite</span>
  }

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
          <span className="font-bold text-xl hidden sm:inline">LUMIKU</span>
        </Link>

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center ml-6">
          {getBreadcrumb()}
        </div>
      </div>

      {/* Center Section - Context Actions */}
      {currentTool && (
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2">
            <span>History</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            Inspiration
          </button>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <CreditDisplay />
        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <UserMenu />
      </div>
    </header>
  )
}
```

#### 4.2.3 Sidebar Component

```typescript
// frontend/src/layouts/Sidebar.tsx

import { Link, useLocation } from 'react-router-dom'
import { Home, Sparkles, Zap, FileText, CreditCard, User, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation()
  const [aiToolsExpanded, setAiToolsExpanded] = useState(true)

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Sparkles, label: 'AI Tools', path: '/tools', expandable: true }
  ]

  const pinnedItems = [
    { icon: Zap, label: 'All tools', path: '/tools' },
    { icon: FileText, label: 'My work', path: '/my-work' },
    { icon: CreditCard, label: 'Credits', path: '/credits' },
    { icon: User, label: 'Profile', path: '/profile' }
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.path}>
                <Link
                  to={item.path}
                  onClick={item.expandable ? (e) => {
                    e.preventDefault()
                    setAiSuiteExpanded(!aiSuiteExpanded)
                  } : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.expandable && (
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform',
                        aiSuiteExpanded && 'transform rotate-180'
                      )}
                    />
                  )}
                </Link>

                {/* AI Tools Submenu */}
                {item.expandable && aiToolsExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    <Link
                      to="/tools"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
                    >
                      All Tools
                    </Link>
                    <Link
                      to="/tools/video-mix"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
                    >
                      Video Mix Pro
                    </Link>
                    <Link
                      to="/tools/carousel"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
                    >
                      Carousel Generator
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pinned Section */}
          <div className="mt-8">
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Pinned
              </h3>
            </div>
            <div className="space-y-1">
              {pinnedItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === item.path
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom CTA */}
        <div className="p-4 border-t border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50">
          <Link
            to="/pricing"
            className="block w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:shadow-lg"
          >
            Get a plan
          </Link>
          <p className="mt-2 text-xs text-center text-gray-600 font-medium">
            Unlock more
          </p>
        </div>
      </aside>
    </>
  )
}
```

#### 4.2.4 Tools Grid Layout

```typescript
// frontend/src/pages/ToolsGrid.tsx

import { useState } from 'react'
import { useTools } from '@/hooks/useTools'
import ToolCard from '@/components/shared/ToolCard'
import { cn } from '@/lib/utils'

type CategoryFilter = 'all' | 'image' | 'video' | 'audio' | 'other'

export default function ToolsGrid() {
  const [filter, setFilter] = useState<CategoryFilter>('all')
  const { tools } = useTools()

  const filteredTools = tools.filter(tool =>
    filter === 'all' ? true : tool.category === filter
  )

  const categories = [
    { id: 'all' as const, label: 'All tools' },
    { id: 'image' as const, label: 'Image' },
    { id: 'video' as const, label: 'Video' },
    { id: 'audio' as const, label: 'Audio' },
    { id: 'other' as const, label: 'Other' }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          What can I help you create?
        </h1>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-gray-200">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              filter === cat.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            )}
          >
            {cat.label}
          </button>
        ))}
        <div className="flex-1" />
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          See more
        </button>
      </div>

      {/* Featured Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
        {filteredTools
          .filter(tool => tool.config.featured)
          .map((tool) => (
            <ToolCard key={tool.id} tool={tool} size="large" />
          ))}
      </div>

      {/* All Tools by Category */}
      <div className="space-y-12">
        {['image', 'video', 'audio', 'other'].map((category) => {
          const categoryTools = tools.filter(t => t.category === category)
          if (categoryTools.length === 0) return null

          return (
            <section key={category}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center">
                  {/* Category icon */}
                </div>
                <h2 className="text-lg font-bold text-gray-900 uppercase">
                  {category}
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {categoryTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} size="small" />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Upsell Banner */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
        <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full mb-4">
          NEW
        </span>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Unlimited tool access with Premium+ and Pro plans
        </h3>
        <button className="mt-4 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center gap-2">
          See plans
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
```

#### 4.2.5 Tool Interface Layout

```typescript
// frontend/src/layouts/ToolInterfaceLayout.tsx

import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ToolInterfaceLayout() {
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(true)

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Settings Panel */}
      <aside
        className={cn(
          'border-r border-gray-200 bg-gray-50 transition-all duration-300 overflow-y-auto',
          settingsPanelOpen ? 'w-80' : 'w-0'
        )}
      >
        {settingsPanelOpen && (
          <div className="p-4">
            <Outlet context={{ panel: 'settings' }} />
          </div>
        )}
      </aside>

      {/* Toggle Button */}
      <button
        onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
        className="absolute left-80 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center"
      >
        {settingsPanelOpen ? (
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Outlet context={{ panel: 'main' }} />
      </div>
    </div>
  )
}
```

#### 4.2.6 Tool Card Component

```typescript
// frontend/src/components/shared/ToolCard.tsx

import { Link } from 'react-router-dom'
import { ToolPlugin } from '@/tools/types'
import { cn } from '@/lib/utils'

interface ToolCardProps {
  tool: ToolPlugin
  size?: 'small' | 'large'
}

export default function ToolCard({ tool, size = 'large' }: ToolCardProps) {
  const isLarge = size === 'large'

  return (
    <Link
      to={tool.path}
      className={cn(
        'block bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all overflow-hidden group',
        isLarge ? 'p-6' : 'p-4'
      )}
    >
      {/* Thumbnail/Icon */}
      <div
        className={cn(
          'rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 mb-4 flex items-center justify-center overflow-hidden',
          isLarge ? 'h-40' : 'h-24'
        )}
      >
        {tool.config.thumbnail ? (
          <img
            src={tool.config.thumbnail}
            alt={tool.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <tool.icon className={cn('text-white', isLarge ? 'w-16 h-16' : 'w-8 h-8')} />
        )}
      </div>

      {/* Content */}
      <div>
        {tool.config.badge && (
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded mb-2">
            {tool.config.badge}
          </span>
        )}
        <h3
          className={cn(
            'font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors',
            isLarge ? 'text-lg' : 'text-sm'
          )}
        >
          {tool.name}
        </h3>
        {isLarge && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {tool.description}
          </p>
        )}
      </div>
    </Link>
  )
}
```

### 4.3 Tool Plugin Interface

Every tool must implement this interface to work with the Freepik-style layout:

```typescript
// frontend/src/tools/types.ts

export interface ToolPlugin {
  // Metadata
  id: string                        // Unique identifier: 'video-mix'
  name: string                      // Display name: 'Video Mix Pro'
  description: string               // Short description
  icon: React.ComponentType         // Tool icon
  category: ToolCategory            // 'image' | 'video' | 'audio' | 'other'

  // Routing
  path: string                      // Route path: '/tools/video-mix'

  // Component
  Component: React.ComponentType    // Main tool component

  // Configuration
  config: ToolConfig                // Tool-specific config

  // Lifecycle hooks (optional)
  onMount?: () => void | Promise<void>
  onUnmount?: () => void | Promise<void>

  // Permissions (optional)
  requiredPermissions?: string[]    // e.g., ['premium']
}

export interface ToolConfig {
  // Display in Grid
  showInGrid: boolean               // Show in tools grid
  featured: boolean                 // Show in featured section
  badge?: string                    // Badge text (e.g., "SOON", "NEW", "BETA")
  thumbnail?: string                // Thumbnail image URL (if not using icon)

  // Layout
  layoutType: 'canvas' | 'form' | 'table' | 'custom'
  showSettingsPanel: boolean        // Left panel for settings (collapsible)
  settingsPanelWidth?: number       // Width in pixels (default: 320px)

  // Credits
  creditCost: {
    base: number                    // Base cost per use
    calculator?: (params: any) => number  // Dynamic calculation
  }

  // Features
  features: {
    upload: boolean                 // File upload support
    download: boolean               // Download results
    history: boolean                // Show history dropdown
    inspiration: boolean            // Show inspiration button
    favorites: boolean              // Save favorites
  }

  // Tool Actions (shown in top bar when tool is active)
  toolActions?: ToolAction[]
}

export interface ToolAction {
  id: string
  label: string
  icon?: React.ComponentType
  onClick: () => void
  dropdown?: boolean                // Show as dropdown
}

export type ToolCategory = 'image' | 'video' | 'audio' | 'text' | 'other'
```

### 4.3 Tool Registry System

```typescript
// frontend/src/tools/registry.ts

import { ToolPlugin } from './types'
import videoMixTool from './video-mix'
import carouselTool from './carousel'

class ToolRegistry {
  private tools: Map<string, ToolPlugin> = new Map()

  /**
   * Register a tool plugin
   */
  register(tool: ToolPlugin): void {
    if (this.tools.has(tool.id)) {
      console.warn(`Tool ${tool.id} already registered, overwriting`)
    }

    this.tools.set(tool.id, tool)
    console.log(`✅ Registered tool: ${tool.name}`)
  }

  /**
   * Get all registered tools
   */
  getAll(): ToolPlugin[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get tool by ID
   */
  getById(id: string): ToolPlugin | undefined {
    return this.tools.get(id)
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): ToolPlugin[] {
    return this.getAll().filter(tool => tool.category === category)
  }

  /**
   * Get featured tools
   */
  getFeatured(): ToolPlugin[] {
    return this.getAll().filter(tool => tool.config.featured)
  }

  /**
   * Check if tool exists
   */
  has(id: string): boolean {
    return this.tools.has(id)
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry()

// Auto-register tools
toolRegistry.register(videoMixTool)
toolRegistry.register(carouselTool)

// Export for easy access
export const getTools = () => toolRegistry.getAll()
export const getTool = (id: string) => toolRegistry.getById(id)
```

### 4.4 Example Tool Implementation

```typescript
// frontend/src/tools/video-mix/index.tsx

import { ToolPlugin } from '../types'
import { VideoIcon } from '@/components/icons'
import VideoMixTool from './VideoMixTool'
import { calculateVideoMixCredits } from './utils/creditCalculator'

const videoMixTool: ToolPlugin = {
  // Metadata
  id: 'video-mix',
  name: 'Video Mix Pro',
  description: 'Mix videos with anti-fingerprinting for social media',
  icon: VideoIcon,
  category: 'video',

  // Routing
  path: '/tools/video-mix',

  // Component
  Component: VideoMixTool,

  // Configuration
  config: {
    showInGrid: true,
    featured: true,
    layoutType: 'canvas',
    showSettingsPanel: true,

    creditCost: {
      base: 1,
      calculator: calculateVideoMixCredits
    },

    features: {
      upload: true,
      download: true,
      history: true,
      favorites: false
    }
  },

  // Lifecycle
  onMount: async () => {
    console.log('Video Mix tool mounted')
    // Initialize FFmpeg or other resources
  },

  onUnmount: () => {
    console.log('Video Mix tool unmounted')
    // Cleanup resources
  }
}

export default videoMixTool
```

```typescript
// frontend/src/tools/video-mix/VideoMixTool.tsx

import { useState } from 'react'
import { useVideoMixStore } from './store'
import { useGenerateVideo } from './hooks/useGenerateVideo'
import SettingsPanel from './components/SettingsPanel'
import VideoCanvas from './components/VideoCanvas'
import VideoUpload from './components/VideoUpload'

export default function VideoMixTool() {
  const { videos, settings } = useVideoMixStore()
  const { mutate: generateVideo, isLoading } = useGenerateVideo()

  const handleGenerate = () => {
    generateVideo({ videos, settings })
  }

  return (
    <div className="flex h-full">
      {/* Left Panel - Settings */}
      <SettingsPanel />

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6">
          {videos.length === 0 ? (
            <VideoUpload />
          ) : (
            <VideoCanvas videos={videos} />
          )}
        </div>

        <div className="border-t p-4">
          <button
            onClick={handleGenerate}
            disabled={isLoading || videos.length === 0}
            className="btn-primary w-full"
          >
            {isLoading ? 'Generating...' : 'Generate Videos'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 4.5 Routing Configuration

```typescript
// frontend/src/routes/index.tsx

import { createBrowserRouter } from 'react-router-dom'
import RootLayout from '@/layouts/RootLayout'
import ToolInterfaceLayout from '@/layouts/ToolInterfaceLayout'
import ProtectedRoute from './ProtectedRoute'
import { toolRegistry } from '@/tools/registry'

// Pages
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ToolsGrid from '@/pages/ToolsGrid'
import MyWork from '@/pages/MyWork'
import Credits from '@/pages/Credits'
import Profile from '@/pages/Profile'
import Pricing from '@/pages/Pricing'

// Generate tool routes dynamically
const toolRoutes = toolRegistry.getAll().map(tool => ({
  path: tool.path.replace('/tools/', ''), // Remove /tools/ prefix
  element: <tool.Component />
}))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Public routes
      {
        index: true,
        element: <Home />
      },
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'register',
        element: <Register />
      },

      // Protected routes
      {
        path: 'dashboard',
        element: <ProtectedRoute><ToolsGrid /></ProtectedRoute>
      },
      {
        path: 'tools',
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <ToolsGrid /> // Tools grid page
          },
          // Dynamic tool interface routes
          ...toolRoutes.map(route => ({
            ...route,
            element: (
              <ToolInterfaceLayout>
                {route.element}
              </ToolInterfaceLayout>
            )
          }))
        ]
      },
      {
        path: 'my-work',
        element: <ProtectedRoute><MyWork /></ProtectedRoute>
      },
      {
        path: 'credits',
        element: <ProtectedRoute><Credits /></ProtectedRoute>
      },
      {
        path: 'profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>
      },
      {
        path: 'pricing',
        element: <Pricing />
      }
    ]
  }
])
```

### 4.6 Shared State Management

```typescript
// frontend/src/stores/authStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean

  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false })
    }),
    {
      name: 'auth-storage'
    }
  )
)
```

```typescript
// frontend/src/stores/creditStore.ts

import { create } from 'zustand'

interface CreditState {
  balance: number
  loading: boolean
  lastUpdated: Date | null

  setBalance: (balance: number) => void
  deductCredits: (amount: number) => void
  addCredits: (amount: number) => void
  setLoading: (loading: boolean) => void
}

export const useCreditStore = create<CreditState>((set) => ({
  balance: 0,
  loading: false,
  lastUpdated: null,

  setBalance: (balance) => set({ balance, lastUpdated: new Date() }),

  deductCredits: (amount) => set((state) => ({
    balance: Math.max(0, state.balance - amount),
    lastUpdated: new Date()
  })),

  addCredits: (amount) => set((state) => ({
    balance: state.balance + amount,
    lastUpdated: new Date()
  })),

  setLoading: (loading) => set({ loading })
}))
```

---

## 5. Backend Architecture

### 5.1 Project Structure

```
backend/
├── src/
│   ├── index.ts                    # Server entry point
│   ├── app.ts                      # Hono app configuration
│   │
│   ├── routes/                     # Route handlers
│   │   ├── index.ts               # Route aggregation
│   │   ├── auth.routes.ts         # Authentication routes
│   │   ├── credit.routes.ts       # Credit management routes
│   │   ├── user.routes.ts         # User profile routes
│   │   └── tool.routes.ts         # Tool registry routes
│   │
│   ├── middleware/                 # Middleware
│   │   ├── auth.middleware.ts     # JWT verification
│   │   ├── cors.middleware.ts     # CORS configuration
│   │   ├── error.middleware.ts    # Error handling
│   │   ├── rate-limit.middleware.ts  # Rate limiting
│   │   └── logger.middleware.ts   # Request logging
│   │
│   ├── services/                   # Business logic
│   │   ├── auth.service.ts        # Authentication logic
│   │   ├── credit.service.ts      # Credit management
│   │   ├── user.service.ts        # User management
│   │   ├── payment.service.ts     # Payment processing (Duitku)
│   │   └── tool.service.ts        # Tool registry
│   │
│   ├── tools/                      # Tool plugins
│   │   ├── registry.ts            # Backend tool registry
│   │   ├── types.ts               # Tool interfaces
│   │   │
│   │   ├── video-mix/             # Video Mix tool backend
│   │   │   ├── index.ts           # Tool registration
│   │   │   ├── routes.ts          # Tool-specific routes
│   │   │   ├── service.ts         # Business logic
│   │   │   ├── validators.ts      # Input validation
│   │   │   └── creditCalculator.ts # Credit calculation
│   │   │
│   │   └── carousel/              # Carousel tool backend
│   │       ├── index.ts
│   │       ├── routes.ts
│   │       ├── service.ts
│   │       └── ...
│   │
│   ├── db/                         # Database
│   │   ├── client.ts              # Prisma client singleton
│   │   ├── seed.ts                # Database seeding
│   │   └── migrations/            # Prisma migrations
│   │
│   ├── lib/                        # Utilities
│   │   ├── jwt.ts                 # JWT helpers
│   │   ├── bcrypt.ts              # Password hashing
│   │   ├── validation.ts          # Zod schemas
│   │   └── constants.ts           # Constants
│   │
│   └── types/                      # TypeScript types
│       ├── index.ts               # Shared types
│       ├── api.ts                 # API types
│       └── context.ts             # Hono context types
│
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── dev.db                     # SQLite database (dev)
│
├── uploads/                        # Uploaded files (dev)
├── outputs/                        # Generated outputs (dev)
├── .env
├── tsconfig.json
└── package.json
```

### 5.2 Backend Tool Plugin Interface

```typescript
// backend/src/tools/types.ts

import { Hono } from 'hono'
import { Context } from 'hono'

export interface BackendToolPlugin {
  // Metadata
  id: string                        // Must match frontend tool ID
  name: string
  version: string

  // Routes
  routes: Hono                      // Tool-specific routes
  basePath: string                  // Base path: '/api/tools/video-mix'

  // Services
  service: ToolService              // Business logic interface

  // Configuration
  config: BackendToolConfig

  // Lifecycle
  onRegister?: () => void | Promise<void>
  onStart?: () => void | Promise<void>
  onStop?: () => void | Promise<void>
}

export interface ToolService {
  // Core operations
  create: (userId: string, data: any) => Promise<any>
  get: (id: string) => Promise<any>
  update: (id: string, data: any) => Promise<any>
  delete: (id: string) => Promise<void>
  list: (userId: string, filters?: any) => Promise<any[]>

  // Credit calculation
  calculateCredits: (params: any) => number

  // Processing (if applicable)
  process?: (id: string, params: any) => Promise<any>
}

export interface BackendToolConfig {
  // Database
  useDatabase: boolean              // Does tool need database tables?
  tablePrefix?: string              // e.g., 'videomix_'

  // File handling
  allowUploads: boolean
  uploadPath?: string               // e.g., 'uploads/video-mix'
  maxFileSize?: number              // bytes
  allowedFileTypes?: string[]       // e.g., ['.mp4', '.mov']

  // Processing
  asyncProcessing: boolean          // Use job queue?
  maxConcurrent?: number            // Max concurrent jobs
  timeout?: number                  // Processing timeout (ms)

  // Credits
  creditConfig: {
    deductOnStart: boolean          // Deduct before processing
    refundOnError: boolean          // Refund if error occurs
  }
}
```

### 5.3 Tool Registry Implementation

```typescript
// backend/src/tools/registry.ts

import { Hono } from 'hono'
import { BackendToolPlugin } from './types'

class BackendToolRegistry {
  private tools: Map<string, BackendToolPlugin> = new Map()
  private app: Hono

  constructor(app: Hono) {
    this.app = app
  }

  /**
   * Register a backend tool
   */
  async register(tool: BackendToolPlugin): Promise<void> {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool ${tool.id} already registered`)
    }

    // Register routes
    this.app.route(tool.basePath, tool.routes)

    // Store tool
    this.tools.set(tool.id, tool)

    // Lifecycle hook
    await tool.onRegister?.()

    console.log(`✅ Registered backend tool: ${tool.name} at ${tool.basePath}`)
  }

  /**
   * Get all tools
   */
  getAll(): BackendToolPlugin[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get tool by ID
   */
  getById(id: string): BackendToolPlugin | undefined {
    return this.tools.get(id)
  }

  /**
   * Get tool manifest for frontend
   */
  getManifest() {
    return this.getAll().map(tool => ({
      id: tool.id,
      name: tool.name,
      version: tool.version,
      basePath: tool.basePath
    }))
  }

  /**
   * Start all tools
   */
  async startAll(): Promise<void> {
    for (const tool of this.tools.values()) {
      await tool.onStart?.()
    }
  }

  /**
   * Stop all tools
   */
  async stopAll(): Promise<void> {
    for (const tool of this.tools.values()) {
      await tool.onStop?.()
    }
  }
}

export default BackendToolRegistry
```

### 5.4 Example Backend Tool Implementation

```typescript
// backend/src/tools/video-mix/index.ts

import { Hono } from 'hono'
import { BackendToolPlugin } from '../types'
import videoMixRoutes from './routes'
import VideoMixService from './service'

const videoMixTool: BackendToolPlugin = {
  id: 'video-mix',
  name: 'Video Mix Pro',
  version: '1.0.0',

  basePath: '/api/tools/video-mix',
  routes: videoMixRoutes,

  service: new VideoMixService(),

  config: {
    useDatabase: true,
    tablePrefix: 'videomix_',

    allowUploads: true,
    uploadPath: 'uploads/video-mix',
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedFileTypes: ['.mp4', '.mov', '.avi', '.mkv'],

    asyncProcessing: true,
    maxConcurrent: 3,
    timeout: 600000, // 10 minutes

    creditConfig: {
      deductOnStart: true,
      refundOnError: true
    }
  },

  onRegister: async () => {
    console.log('Video Mix tool registered')
    // Initialize FFmpeg, create upload directories, etc.
  },

  onStart: async () => {
    console.log('Video Mix tool started')
  }
}

export default videoMixTool
```

```typescript
// backend/src/tools/video-mix/routes.ts

import { Hono } from 'hono'
import { authMiddleware } from '@/middleware/auth.middleware'
import VideoMixService from './service'
import { validateVideoMixRequest } from './validators'

const videoMixRoutes = new Hono()
const service = new VideoMixService()

// Create project
videoMixRoutes.post('/projects', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const data = await c.req.json()

  const project = await service.create(userId, data)
  return c.json(project, 201)
})

// Upload video
videoMixRoutes.post('/upload', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const formData = await c.req.formData()

  const result = await service.handleUpload(userId, formData)
  return c.json(result)
})

// Start processing
videoMixRoutes.post('/process/:projectId', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const projectId = c.req.param('projectId')
  const settings = await c.req.json()

  // Validate
  const validated = validateVideoMixRequest.parse(settings)

  // Calculate credits
  const creditsRequired = service.calculateCredits(validated)

  // Check and deduct credits
  const creditService = c.get('creditService')
  await creditService.checkAndDeduct(userId, creditsRequired, {
    description: `Video Mix processing - Project ${projectId}`,
    referenceId: projectId,
    referenceType: 'video_mix_project'
  })

  // Start processing
  const job = await service.process(projectId, validated)

  return c.json(job)
})

// Get project
videoMixRoutes.get('/projects/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const project = await service.get(id)
  return c.json(project)
})

// List projects
videoMixRoutes.get('/projects', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const projects = await service.list(userId)
  return c.json(projects)
})

export default videoMixRoutes
```

### 5.5 Main Server Setup

```typescript
// backend/src/index.ts

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { cors } from 'hono/cors'
import BackendToolRegistry from './tools/registry'

// Import routes
import authRoutes from './routes/auth.routes'
import creditRoutes from './routes/credit.routes'
import userRoutes from './routes/user.routes'

// Import tools
import videoMixTool from './tools/video-mix'
import carouselTool from './tools/carousel'

// Import middleware
import { errorMiddleware } from './middleware/error.middleware'
import { loggerMiddleware } from './middleware/logger.middleware'

const app = new Hono()

// Global middleware
app.use('*', cors())
app.use('*', loggerMiddleware)

// API routes
app.route('/api/auth', authRoutes)
app.route('/api/credits', creditRoutes)
app.route('/api/users', userRoutes)

// Tool registry
const toolRegistry = new BackendToolRegistry(app)

// Register tools
await toolRegistry.register(videoMixTool)
await toolRegistry.register(carouselTool)

// Tool manifest endpoint
app.get('/api/tools/manifest', (c) => {
  return c.json(toolRegistry.getManifest())
})

// Serve static files (frontend build)
app.use('/*', serveStatic({ root: './dist' }))

// Error handling
app.onError(errorMiddleware)

// Start server
const port = process.env.PORT || 3000
console.log(`🚀 Server running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port: Number(port)
})

// Lifecycle
await toolRegistry.startAll()

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...')
  await toolRegistry.stopAll()
  process.exit(0)
})
```

---

## 6. Plugin System - Tool Integration

### 6.1 Plugin Architecture Principles

1. **Self-contained**: Each tool is independent with its own routes, services, and state
2. **Registry-based**: Tools register themselves with the platform
3. **Convention over configuration**: Follow standard structure for automatic integration
4. **Lazy loading**: Tool code only loaded when needed
5. **Isolated state**: Tool state doesn't leak to global state

### 6.2 Plugin Lifecycle

```
Registration → Initialization → Active → Deactivation
     ↓              ↓             ↓           ↓
  Register      onMount       Running     onUnmount
  metadata      resources     normally    cleanup
```

### 6.3 Communication Between Plugins

**Shared Services Pattern**:
```typescript
// Tools communicate through shared services, not directly

// ❌ BAD: Direct coupling
import { carouselStore } from '@/tools/carousel/store'
carouselStore.getState().data // Don't do this!

// ✅ GOOD: Through shared API
import { api } from '@/lib/api'
const data = await api.get('/api/tools/carousel/projects')
```

**Event Bus Pattern** (optional, for advanced use cases):
```typescript
// backend/src/lib/eventBus.ts

import { EventEmitter } from 'events'

class ToolEventBus extends EventEmitter {
  emitToolEvent(toolId: string, event: string, data: any) {
    this.emit(`${toolId}:${event}`, data)
  }

  onToolEvent(toolId: string, event: string, handler: (data: any) => void) {
    this.on(`${toolId}:${event}`, handler)
  }
}

export const toolEventBus = new ToolEventBus()

// Usage in tools
toolEventBus.emitToolEvent('video-mix', 'processing:complete', { jobId })
toolEventBus.onToolEvent('video-mix', 'processing:complete', handleComplete)
```

### 6.4 Plugin Data Isolation

**Database Namespacing**:
```prisma
// Each tool gets its own tables with prefix

model VideoMixProject {
  id        String   @id @default(cuid())
  userId    String
  // ... fields

  @@map("videomix_projects")
}

model CarouselProject {
  id        String   @id @default(cuid())
  userId    String
  // ... fields

  @@map("carousel_projects")
}
```

**File Storage Isolation**:
```
uploads/
  ├── video-mix/
  │   └── {userId}/
  │       └── {projectId}/
  │           └── video1.mp4
  └── carousel/
      └── {userId}/
          └── {projectId}/
              └── image1.png
```

---

## 7. Credit System & Billing

### 7.1 Credit System Architecture

**Centralized Authority Model**:
- One `User` table with `credits` field (single source of truth)
- One `CreditTransaction` table for audit trail
- All credit operations are atomic transactions
- Tools calculate cost, CreditService handles deduction

### 7.2 Database Schema for Credits

```prisma
// prisma/schema.prisma

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String
  name          String?

  // Credits
  credits       Int      @default(0)

  // Metadata
  role          String   @default("user")
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  sessions            Session[]
  creditTransactions  CreditTransaction[]
  payments            Payment[]
}

model CreditTransaction {
  id            String   @id @default(cuid())
  userId        String

  // Transaction details
  amount        Int              // Positive = credit, Negative = debit
  balance       Int              // Balance after transaction
  type          TransactionType
  description   String

  // Reference to source
  referenceId   String?          // Project/Job ID
  referenceType String?          // 'video_mix_project', 'carousel_generation'

  // Metadata
  metadata      Json?            // Additional data (settings used, etc.)
  createdAt     DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@map("credit_transactions")
}

enum TransactionType {
  PURCHASE      // Bought credits
  BONUS         // Free credits (registration, promotion)
  USAGE         // Used credits (tool operation)
  REFUND        // Refunded credits (failed operation)
  ADJUSTMENT    // Manual adjustment (admin)
}

model Payment {
  id                String   @id @default(cuid())
  userId            String

  // Payment details
  merchantOrderId   String   @unique
  amount            Int                // IDR
  credits           Int                // Credits purchased
  status            PaymentStatus

  // Gateway details
  paymentMethod     String?
  gatewayReference  String?            // Duitku reference

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  paidAt            DateTime?
  expiresAt         DateTime

  // Metadata
  metadata          Json?

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@map("payments")
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  EXPIRED
  CANCELLED
}
```

### 7.3 Credit Service Implementation

```typescript
// backend/src/services/credit.service.ts

import { prisma } from '@/db/client'
import { TransactionType } from '@prisma/client'

class CreditService {
  /**
   * Get user's current credit balance
   */
  async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    })

    if (!user) throw new Error('User not found')
    return user.credits
  }

  /**
   * Check if user has enough credits
   */
  async hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId)
    return balance >= amount
  }

  /**
   * Deduct credits from user (atomic transaction)
   */
  async deduct(
    userId: string,
    amount: number,
    options: {
      description: string
      referenceId?: string
      referenceType?: string
      metadata?: any
    }
  ): Promise<CreditTransaction> {
    return await prisma.$transaction(async (tx) => {
      // Get user with lock
      const user = await tx.user.findUnique({
        where: { id: userId }
      })

      if (!user) throw new Error('User not found')

      // Check balance
      if (user.credits < amount) {
        throw new Error(`Insufficient credits. Required: ${amount}, Available: ${user.credits}`)
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
          type: TransactionType.USAGE,
          description: options.description,
          referenceId: options.referenceId,
          referenceType: options.referenceType,
          metadata: options.metadata
        }
      })

      return transaction
    })
  }

  /**
   * Add credits to user (purchase, bonus, refund)
   */
  async add(
    userId: string,
    amount: number,
    type: TransactionType,
    options: {
      description: string
      referenceId?: string
      metadata?: any
    }
  ): Promise<CreditTransaction> {
    return await prisma.$transaction(async (tx) => {
      // Add credits
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: amount } }
      })

      // Create transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          balance: updatedUser.credits,
          type,
          description: options.description,
          referenceId: options.referenceId,
          metadata: options.metadata
        }
      })

      return transaction
    })
  }

  /**
   * Refund credits (e.g., when processing fails)
   */
  async refund(
    userId: string,
    amount: number,
    referenceId: string,
    reason: string
  ): Promise<CreditTransaction> {
    return this.add(userId, amount, TransactionType.REFUND, {
      description: `Refund: ${reason}`,
      referenceId
    })
  }

  /**
   * Check and deduct in one operation
   */
  async checkAndDeduct(
    userId: string,
    amount: number,
    options: {
      description: string
      referenceId?: string
      referenceType?: string
      metadata?: any
    }
  ): Promise<CreditTransaction> {
    const hasEnough = await this.hasEnoughCredits(userId, amount)

    if (!hasEnough) {
      const balance = await this.getBalance(userId)
      throw new Error(
        `Insufficient credits. Required: ${amount}, Available: ${balance}`
      )
    }

    return this.deduct(userId, amount, options)
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    userId: string,
    options?: {
      limit?: number
      offset?: number
      type?: TransactionType
    }
  ) {
    const { limit = 50, offset = 0, type } = options || {}

    return await prisma.creditTransaction.findMany({
      where: {
        userId,
        ...(type && { type })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })
  }

  /**
   * Get usage statistics
   */
  async getStatistics(userId: string) {
    const transactions = await prisma.creditTransaction.findMany({
      where: { userId }
    })

    const stats = {
      totalPurchased: 0,
      totalUsed: 0,
      totalRefunded: 0,
      totalBonus: 0,
      currentBalance: 0
    }

    transactions.forEach(tx => {
      switch (tx.type) {
        case TransactionType.PURCHASE:
          stats.totalPurchased += tx.amount
          break
        case TransactionType.USAGE:
          stats.totalUsed += Math.abs(tx.amount)
          break
        case TransactionType.REFUND:
          stats.totalRefunded += tx.amount
          break
        case TransactionType.BONUS:
          stats.totalBonus += tx.amount
          break
      }
    })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    })

    stats.currentBalance = user?.credits || 0

    return stats
  }
}

export default CreditService
```

### 7.4 Tool Credit Calculation Pattern

Each tool implements its own credit calculator:

```typescript
// backend/src/tools/video-mix/creditCalculator.ts

interface VideoMixParams {
  outputCount: number
  videos: Array<{ duration: number }>
  settings: {
    orderMixing: boolean
    speedVariations: boolean
    smartTrimming: boolean
    quality: 'sd' | 'hd' | 'fullhd'
    fps: number
  }
}

export function calculateVideoMixCredits(params: VideoMixParams): number {
  // Base cost: 1 credit per output
  let cost = params.outputCount * 1

  // Volume discount
  const discount = getVolumeDiscount(params.outputCount)
  cost = cost * discount

  // Complexity multipliers
  if (params.settings.orderMixing) cost *= 1.2
  if (params.settings.speedVariations) cost *= 1.5
  if (params.settings.smartTrimming) cost *= 1.2

  // Quality multipliers
  const qualityMultiplier = {
    'sd': 0.8,
    'hd': 1.0,
    'fullhd': 1.5
  }[params.settings.quality]
  cost *= qualityMultiplier

  // FPS multiplier
  if (params.settings.fps === 60) cost *= 1.2

  // Round up to nearest integer
  return Math.ceil(cost)
}

function getVolumeDiscount(count: number): number {
  if (count <= 5) return 1.0
  if (count <= 10) return 0.95
  if (count <= 25) return 0.90
  if (count <= 50) return 0.85
  if (count <= 100) return 0.82
  return 0.80
}
```

### 7.5 Frontend Credit Display

```typescript
// frontend/src/hooks/useCredits.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useCreditStore } from '@/stores/creditStore'

export function useCredits() {
  const queryClient = useQueryClient()
  const { setBalance, deductCredits, addCredits } = useCreditStore()

  // Fetch balance
  const { data: balance, isLoading } = useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: async () => {
      const res = await api.get('/api/credits/balance')
      return res.data.balance
    },
    onSuccess: (balance) => {
      setBalance(balance)
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000
  })

  // Fetch transactions
  const { data: transactions } = useQuery({
    queryKey: ['credits', 'transactions'],
    queryFn: async () => {
      const res = await api.get('/api/credits/transactions')
      return res.data
    }
  })

  // Optimistic update helper
  const updateBalanceOptimistically = (amount: number) => {
    queryClient.setQueryData(['credits', 'balance'], (old: number) => {
      return old + amount
    })
  }

  return {
    balance,
    transactions,
    isLoading,
    updateBalanceOptimistically
  }
}
```

```typescript
// frontend/src/components/shared/CreditDisplay.tsx

import { useCredits } from '@/hooks/useCredits'
import { CreditIcon } from '@/components/icons'

export default function CreditDisplay() {
  const { balance, isLoading } = useCredits()

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
      <CreditIcon className="w-5 h-5 text-yellow-600" />
      <span className="font-semibold">
        {isLoading ? '...' : balance?.toLocaleString()}
      </span>
      <span className="text-sm text-gray-600">credits</span>
    </div>
  )
}
```

### 7.6 Payment Integration (Duitku)

```typescript
// backend/src/services/payment.service.ts

import crypto from 'crypto'
import { prisma } from '@/db/client'
import CreditService from './credit.service'
import { TransactionType, PaymentStatus } from '@prisma/client'

class PaymentService {
  private creditService: CreditService

  constructor() {
    this.creditService = new CreditService()
  }

  /**
   * Create payment request
   */
  async createPayment(
    userId: string,
    packageId: string
  ) {
    const packages = this.getCreditPackages()
    const pkg = packages.find(p => p.id === packageId)

    if (!pkg) throw new Error('Invalid package')

    // Generate unique order ID
    const merchantOrderId = `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        merchantOrderId,
        amount: pkg.price,
        credits: pkg.credits,
        status: PaymentStatus.PENDING,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    })

    // Generate signature for Duitku
    const signature = this.generateSignature({
      merchantCode: process.env.DUITKU_MERCHANT_CODE!,
      merchantOrderId,
      amount: pkg.price,
      apiKey: process.env.DUITKU_API_KEY!
    })

    // Call Duitku API
    const duitkuResponse = await fetch(`${this.getDuitkuBaseUrl()}/api/merchant/createinvoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantCode: process.env.DUITKU_MERCHANT_CODE,
        merchantOrderId,
        paymentAmount: pkg.price,
        productDetails: `Lumiku Credits - ${pkg.credits} credits`,
        email: await this.getUserEmail(userId),
        customerVaName: await this.getUserName(userId),
        callbackUrl: process.env.DUITKU_CALLBACK_URL,
        returnUrl: process.env.DUITKU_RETURN_URL,
        signature,
        expiryPeriod: 1440 // 24 hours in minutes
      })
    })

    const result = await duitkuResponse.json()

    if (result.statusCode !== '00') {
      throw new Error(result.statusMessage || 'Payment creation failed')
    }

    // Update payment with gateway reference
    await prisma.payment.update({
      where: { id: payment.id },
      data: { gatewayReference: result.reference }
    })

    return {
      paymentId: payment.id,
      paymentUrl: result.paymentUrl,
      reference: result.reference
    }
  }

  /**
   * Handle Duitku callback (webhook)
   */
  async handleCallback(data: {
    merchantOrderId: string
    resultCode: string
    amount: string
    signature: string
  }) {
    // Verify signature
    const expectedSignature = this.generateCallbackSignature({
      merchantCode: process.env.DUITKU_MERCHANT_CODE!,
      amount: data.amount,
      merchantOrderId: data.merchantOrderId,
      resultCode: data.resultCode,
      apiKey: process.env.DUITKU_API_KEY!
    })

    if (data.signature !== expectedSignature) {
      throw new Error('Invalid signature')
    }

    // Get payment
    const payment = await prisma.payment.findUnique({
      where: { merchantOrderId: data.merchantOrderId }
    })

    if (!payment) throw new Error('Payment not found')

    // Check if already processed
    if (payment.status === PaymentStatus.SUCCESS) {
      console.log('Payment already processed:', payment.id)
      return { success: true }
    }

    // Update payment status
    const isSuccess = data.resultCode === '00'
    const newStatus = isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidAt: isSuccess ? new Date() : null,
        metadata: { callbackData: data }
      }
    })

    // Add credits if successful
    if (isSuccess) {
      await this.creditService.add(
        payment.userId,
        payment.credits,
        TransactionType.PURCHASE,
        {
          description: `Credit purchase - ${payment.credits} credits`,
          referenceId: payment.id,
          metadata: { merchantOrderId: payment.merchantOrderId }
        }
      )
    }

    return { success: true }
  }

  /**
   * Get available credit packages
   */
  getCreditPackages() {
    return [
      { id: 'starter', credits: 4000, price: 200000, pricePerCredit: 50 },
      { id: 'basic', credits: 6000, price: 300000, pricePerCredit: 50 },
      { id: 'pro', credits: 10000, price: 500000, pricePerCredit: 50 },
      { id: 'business', credits: 20000, price: 1000000, pricePerCredit: 50 },
      { id: 'enterprise', credits: 40000, price: 2000000, pricePerCredit: 50 }
    ]
  }

  private generateSignature(params: {
    merchantCode: string
    merchantOrderId: string
    amount: number
    apiKey: string
  }) {
    const string = `${params.merchantCode}${params.merchantOrderId}${params.amount}${params.apiKey}`
    return crypto.createHash('md5').update(string).digest('hex')
  }

  private generateCallbackSignature(params: {
    merchantCode: string
    amount: string
    merchantOrderId: string
    resultCode: string
    apiKey: string
  }) {
    const string = `${params.merchantCode}${params.amount}${params.merchantOrderId}${params.resultCode}${params.apiKey}`
    return crypto.createHash('md5').update(string).digest('hex')
  }

  private getDuitkuBaseUrl() {
    return process.env.DUITKU_ENV === 'production'
      ? 'https://passport.duitku.com'
      : 'https://sandbox.duitku.com'
  }

  private async getUserEmail(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    return user?.email || ''
  }

  private async getUserName(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    return user?.name || user?.email || 'User'
  }
}

export default PaymentService
```

---

## 8. Authentication & Authorization

### 8.1 JWT-Based Authentication

```typescript
// backend/src/services/auth.service.ts

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/db/client'
import CreditService from './credit.service'
import { TransactionType } from '@prisma/client'

interface JWTPayload {
  userId: string
  email: string
  role: string
}

class AuthService {
  private creditService: CreditService

  constructor() {
    this.creditService = new CreditService()
  }

  /**
   * Register new user
   */
  async register(data: {
    email: string
    password: string
    name?: string
  }) {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existing) {
      throw new Error('Email already registered')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        credits: 0 // Start with 0, will add welcome bonus
      }
    })

    // Give welcome bonus
    await this.creditService.add(
      user.id,
      100,
      TransactionType.BONUS,
      {
        description: 'Welcome bonus - 100 free credits'
      }
    )

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Create session
    await this.createSession(user.id, token)

    return {
      user: this.sanitizeUser(user),
      token
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      throw new Error('Invalid credentials')
    }

    // Check if active
    if (!user.isActive) {
      throw new Error('Account is inactive')
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Create session
    await this.createSession(user.id, token)

    return {
      user: this.sanitizeUser(user),
      token
    }
  }

  /**
   * Logout user
   */
  async logout(token: string) {
    await prisma.session.deleteMany({
      where: { token }
    })
  }

  /**
   * Verify token
   */
  verifyToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
      return payload
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '7d'
    })
  }

  /**
   * Create session record
   */
  private async createSession(userId: string, token: string) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt
      }
    })
  }

  /**
   * Remove sensitive fields
   */
  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user
    return sanitized
  }
}

export default AuthService
```

### 8.2 Auth Middleware

```typescript
// backend/src/middleware/auth.middleware.ts

import { Context, Next } from 'hono'
import { prisma } from '@/db/client'
import AuthService from '@/services/auth.service'

const authService = new AuthService()

export async function authMiddleware(c: Context, next: Next) {
  try {
    // Get token from header
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No token provided' }, 401)
    }

    const token = authHeader.substring(7)

    // Verify token
    const payload = authService.verifyToken(token)

    // Check session exists
    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() }
      }
    })

    if (!session) {
      return c.json({ error: 'Session expired' }, 401)
    }

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user || !user.isActive) {
      return c.json({ error: 'User not found or inactive' }, 401)
    }

    // Set user data in context
    c.set('userId', user.id)
    c.set('userEmail', user.email)
    c.set('userRole', user.role)
    c.set('user', user)

    await next()
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
}

/**
 * Optional auth - doesn't fail if no token
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization')

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const payload = authService.verifyToken(token)

      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      })

      if (user && user.isActive) {
        c.set('userId', user.id)
        c.set('user', user)
      }
    }
  } catch (error) {
    // Ignore errors in optional auth
  }

  await next()
}

/**
 * Role-based access control
 */
export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const userRole = c.get('userRole')

    if (!roles.includes(userRole)) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    await next()
  }
}
```

### 8.3 Frontend Auth Hook

```typescript
// frontend/src/hooks/useAuth.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

export function useAuth() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, token, isAuthenticated, setUser, setToken, logout: logoutStore } = useAuthStore()

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post('/api/auth/login', data)
      return res.data
    },
    onSuccess: (data) => {
      setUser(data.user)
      setToken(data.token)
      queryClient.invalidateQueries()
      navigate('/dashboard')
    }
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name?: string }) => {
      const res = await api.post('/api/auth/register', data)
      return res.data
    },
    onSuccess: (data) => {
      setUser(data.user)
      setToken(data.token)
      queryClient.invalidateQueries()
      navigate('/dashboard')
    }
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/logout')
    },
    onSuccess: () => {
      logoutStore()
      queryClient.clear()
      navigate('/login')
    }
  })

  return {
    user,
    token,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isLoading,
    isRegistering: registerMutation.isLoading
  }
}
```

---

## 9. Database Architecture

### 9.1 Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // or "sqlite" for development
  url      = env("DATABASE_URL")
}

// ==================== CORE TABLES ====================

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String
  name          String?

  // Credits
  credits       Int      @default(0)

  // Metadata
  role          String   @default("user")
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?

  // Relations
  sessions            Session[]
  creditTransactions  CreditTransaction[]
  payments            Payment[]

  // Tool-specific relations
  videoMixProjects    VideoMixProject[]
  carouselProjects    CarouselProject[]

  @@index([email])
  @@map("users")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("sessions")
}

model CreditTransaction {
  id            String          @id @default(cuid())
  userId        String

  amount        Int
  balance       Int
  type          TransactionType
  description   String

  referenceId   String?
  referenceType String?
  metadata      Json?

  createdAt     DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@index([type])
  @@map("credit_transactions")
}

enum TransactionType {
  PURCHASE
  BONUS
  USAGE
  REFUND
  ADJUSTMENT
}

model Payment {
  id                String        @id @default(cuid())
  userId            String

  merchantOrderId   String        @unique
  amount            Int
  credits           Int
  status            PaymentStatus

  paymentMethod     String?
  gatewayReference  String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  paidAt            DateTime?
  expiresAt         DateTime

  metadata          Json?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([merchantOrderId])
  @@map("payments")
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  EXPIRED
  CANCELLED
}

// ==================== VIDEO MIX TOOL ====================

model VideoMixProject {
  id          String   @id @default(cuid())
  userId      String

  name        String
  description String?
  status      ProjectStatus @default(DRAFT)

  settings    Json?    // Processing settings

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)

  videos      VideoFile[]
  groups      VideoGroup[]
  jobs        ProcessingJob[]

  @@index([userId])
  @@index([status])
  @@map("videomix_projects")
}

enum ProjectStatus {
  DRAFT
  PROCESSING
  COMPLETED
  FAILED
}

model VideoFile {
  id              String   @id @default(cuid())
  projectId       String
  groupId         String?

  originalName    String
  filename        String
  path            String
  size            Int
  duration        Float
  format          String?
  resolution      String?

  uploadedAt      DateTime @default(now())

  project  VideoMixProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  group    VideoGroup? @relation(fields: [groupId], references: [id], onDelete: SetNull)

  @@index([projectId])
  @@index([groupId])
  @@map("videomix_files")
}

model VideoGroup {
  id        String   @id @default(cuid())
  projectId String

  name      String
  order     Int

  createdAt DateTime @default(now())

  project VideoMixProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  videos  VideoFile[]

  @@index([projectId])
  @@map("videomix_groups")
}

model ProcessingJob {
  id          String   @id @default(cuid())
  projectId   String

  status      JobStatus @default(PENDING)
  progress    Int       @default(0)

  creditsUsed Int
  settings    Json

  startedAt    DateTime?
  completedAt  DateTime?
  errorMessage String?

  transactionId String?  // Reference to CreditTransaction

  createdAt    DateTime @default(now())

  project VideoMixProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  outputs VideoOutput[]

  @@index([projectId])
  @@index([status])
  @@map("videomix_jobs")
}

enum JobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

model VideoOutput {
  id       String   @id @default(cuid())
  jobId    String

  filename String
  path     String
  size     Int
  duration Float

  metadata Json?

  createdAt DateTime @default(now())

  job ProcessingJob @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@index([jobId])
  @@map("videomix_outputs")
}

// ==================== CAROUSEL TOOL ====================

model CarouselProject {
  id          String   @id @default(cuid())
  userId      String

  title       String
  type        CarouselType

  content     Json     // Full carousel document
  creditsUsed Int      @default(0)

  status      ProjectStatus @default(DRAFT)
  slideCount  Int      @default(0)

  outputs     Json?    // Output file paths
  metadata    Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([type])
  @@index([status])
  @@map("carousel_projects")
}

enum CarouselType {
  SINGLE
  BULK
  AI_GENERATED
}
```

### 9.2 Database Migrations

```bash
# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Apply migrations (production)
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed database
npx prisma db seed

# Open Prisma Studio (GUI)
npx prisma studio
```

### 9.3 Database Seeding

```typescript
// prisma/seed.ts

import { PrismaClient, TransactionType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lumiku.com' },
    update: {},
    create: {
      email: 'admin@lumiku.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      credits: 10000
    }
  })

  console.log('✅ Created admin user:', admin.email)

  // Create demo user
  const demoPassword = await bcrypt.hash('Demo123!', 10)
  const demo = await prisma.user.upsert({
    where: { email: 'demo@lumiku.com' },
    update: {},
    create: {
      email: 'demo@lumiku.com',
      password: demoPassword,
      name: 'Demo User',
      role: 'user',
      credits: 0
    }
  })

  // Give demo user welcome bonus
  await prisma.creditTransaction.create({
    data: {
      userId: demo.id,
      amount: 100,
      balance: 100,
      type: TransactionType.BONUS,
      description: 'Welcome bonus - 100 free credits'
    }
  })

  // Update demo user credits
  await prisma.user.update({
    where: { id: demo.id },
    data: { credits: 100 }
  })

  console.log('✅ Created demo user:', demo.email)

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## 10. File Structure

### 10.1 Complete Monorepo Structure

```
lumiku-suite/
├── frontend/                       # React SPA
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── tools/
│   │   │   ├── registry.ts
│   │   │   ├── types.ts
│   │   │   ├── video-mix/
│   │   │   └── carousel/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── shared/
│   │   │   └── providers/
│   │   ├── stores/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                        # Bun + Hono API
│   ├── src/
│   │   ├── index.ts
│   │   ├── app.ts
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── tools/
│   │   │   ├── registry.ts
│   │   │   ├── types.ts
│   │   │   ├── video-mix/
│   │   │   └── carousel/
│   │   ├── db/
│   │   ├── lib/
│   │   └── types/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── uploads/
│   ├── outputs/
│   ├── .env
│   ├── tsconfig.json
│   └── package.json
│
├── packages/                       # Shared packages (optional)
│   ├── shared-types/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── tool.types.ts
│   │   │   └── api.types.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── ui-components/              # Shared UI (if needed)
│       ├── src/
│       ├── tsconfig.json
│       └── package.json
│
├── docs/                           # Documentation
│   ├── ARCHITECTURE.md
│   ├── UNIFIED_ARCHITECTURE.md     # This file
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── ADDING_TOOLS.md
│
├── scripts/                        # Build & deployment scripts
│   ├── build.sh
│   ├── deploy.sh
│   └── seed-db.sh
│
├── .github/                        # CI/CD
│   └── workflows/
│       ├── test.yml
│       └── deploy.yml
│
├── docker/                         # Docker configuration
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
│
├── .gitignore
├── .env.example
├── package.json                    # Root package.json (workspaces)
├── bun.lockb
└── README.md
```

### 10.2 Root Package.json (Workspaces)

```json
{
  "name": "lumiku-suite",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "packages/*"
  ],
  "scripts": {
    "dev": "bun run dev:backend & bun run dev:frontend",
    "dev:frontend": "cd frontend && bun run dev",
    "dev:backend": "cd backend && bun run dev",
    "build": "bun run build:frontend && bun run build:backend",
    "build:frontend": "cd frontend && bun run build",
    "build:backend": "cd backend && bun run build",
    "prisma:generate": "cd backend && bun prisma generate",
    "prisma:migrate": "cd backend && bun prisma migrate dev",
    "prisma:studio": "cd backend && bun prisma studio",
    "seed": "cd backend && bun prisma db seed",
    "test": "bun test",
    "clean": "rm -rf node_modules frontend/node_modules backend/node_modules"
  },
  "devDependencies": {
    "@types/bun": "^1.0.0",
    "typescript": "^5.3.0"
  }
}
```

---

## 11. Development Workflow

### 11.1 Initial Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd lumiku-suite

# 2. Install dependencies
bun install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Generate Prisma client
bun prisma:generate

# 5. Run migrations
bun prisma:migrate

# 6. Seed database
bun seed

# 7. Start development servers
bun dev
```

### 11.2 Environment Variables

```bash
# .env

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lumiku"
# Or for development:
# DATABASE_URL="file:./prisma/dev.db"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Payment Gateway (Duitku)
DUITKU_MERCHANT_CODE="your-merchant-code"
DUITKU_API_KEY="your-api-key"
DUITKU_ENV="sandbox"  # or "production"
DUITKU_CALLBACK_URL="http://localhost:3000/api/payments/callback"
DUITKU_RETURN_URL="http://localhost:3000/payments/status"

# AI Services
ANTHROPIC_API_KEY="your-anthropic-api-key"

# File Storage
UPLOAD_PATH="./uploads"
OUTPUT_PATH="./outputs"
MAX_FILE_SIZE=524288000  # 500MB in bytes

# FFmpeg (for Video Mix tool)
FFMPEG_PATH="/usr/bin/ffmpeg"
FFPROBE_PATH="/usr/bin/ffprobe"

# CORS
CORS_ORIGIN="http://localhost:5173"  # Vite dev server

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### 11.3 Development Commands

```bash
# Frontend development
cd frontend
bun dev                 # Start Vite dev server (http://localhost:5173)
bun build              # Build for production
bun preview            # Preview production build

# Backend development
cd backend
bun dev                # Start Bun server with watch mode
bun start              # Start production server
bun prisma studio      # Open database GUI

# Database
bun prisma:generate    # Generate Prisma client
bun prisma:migrate     # Create and run migration
bun prisma:studio      # Open Prisma Studio
bun seed               # Seed database

# Testing
bun test               # Run all tests
bun test:watch         # Run tests in watch mode
bun test:coverage      # Generate coverage report

# Linting
bun lint               # Lint code
bun lint:fix           # Fix linting issues

# Type checking
bun typecheck          # Check TypeScript types
```

### 11.4 Git Workflow

```bash
# Feature development
git checkout -b feature/new-tool
# Make changes
git add .
git commit -m "feat: add new tool"
git push origin feature/new-tool
# Create pull request

# Commit message convention (Conventional Commits)
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # Code style changes
refactor: # Code refactoring
test:     # Adding tests
chore:    # Maintenance tasks
```

---

## 12. Deployment Strategy

### 12.1 Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure PostgreSQL database
- [ ] Set up SSL certificates
- [ ] Configure production Duitku credentials
- [ ] Set up file storage (AWS S3 or similar)
- [ ] Configure CDN for static assets
- [ ] Set up logging and monitoring (Sentry)
- [ ] Configure automated backups
- [ ] Set up CI/CD pipeline
- [ ] Configure rate limiting
- [ ] Set up health check endpoints
- [ ] Review and update CORS settings
- [ ] Enable database connection pooling
- [ ] Set up staging environment
- [ ] Load testing
- [ ] Security audit

### 12.2 Docker Deployment

```dockerfile
# docker/Dockerfile.backend

FROM oven/bun:1 AS base

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
COPY backend/package.json ./backend/
RUN bun install --frozen-lockfile

# Copy source
COPY backend ./backend
COPY packages ./packages

# Generate Prisma client
WORKDIR /app/backend
RUN bun prisma generate

# Build
RUN bun run build

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Install FFmpeg (for video processing)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy from build stage
COPY --from=base /app/backend/dist ./dist
COPY --from=base /app/backend/node_modules ./node_modules
COPY --from=base /app/backend/prisma ./prisma
COPY --from=base /app/backend/package.json ./

# Create directories
RUN mkdir -p uploads outputs

EXPOSE 3000

CMD ["bun", "run", "start"]
```

```dockerfile
# docker/Dockerfile.frontend

FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
RUN npm ci

# Copy source
COPY frontend ./frontend
COPY packages ./packages

# Build
WORKDIR /app/frontend
RUN npm run build

# Production stage - Nginx
FROM nginx:alpine

# Copy build
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker/docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: lumiku
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: lumiku_production
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lumiku"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    environment:
      DATABASE_URL: postgresql://lumiku:${DB_PASSWORD}@postgres:5432/lumiku_production
      JWT_SECRET: ${JWT_SECRET}
      DUITKU_MERCHANT_CODE: ${DUITKU_MERCHANT_CODE}
      DUITKU_API_KEY: ${DUITKU_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      NODE_ENV: production
      PORT: 3000
    volumes:
      - uploads:/app/uploads
      - outputs:/app/outputs
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  uploads:
  outputs:
```

### 12.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bun typecheck

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: .
          file: docker/Dockerfile.backend
          push: true
          tags: lumiku/backend:latest

      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: .
          file: docker/Dockerfile.frontend
          push: true
          tags: lumiku/frontend:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/lumiku-suite
            docker-compose pull
            docker-compose up -d
            docker-compose exec backend bun prisma migrate deploy
```

---

## 13. Adding New Tools - Step by Step

### 13.1 Quick Start Template

When adding a new tool, follow this checklist:

**Frontend**:
1. Create tool directory in `frontend/src/tools/`
2. Implement tool plugin interface
3. Create tool components
4. Register tool in registry
5. Add routes (automatic via registry)

**Backend**:
1. Create tool directory in `backend/src/tools/`
2. Implement backend plugin interface
3. Create Hono routes
4. Create service with business logic
5. Add credit calculator
6. Register tool in registry
7. Add Prisma models (if needed)
8. Run migration

### 13.2 Example: Adding "Image Upscaler" Tool

#### Step 1: Frontend Tool Plugin

```typescript
// frontend/src/tools/image-upscaler/index.tsx

import { ToolPlugin } from '../types'
import { ImageUpIcon } from '@/components/icons'
import ImageUpscalerTool from './ImageUpscalerTool'

const imageUpscalerTool: ToolPlugin = {
  id: 'image-upscaler',
  name: 'Image Upscaler',
  description: 'Enhance images to 4K with AI',
  icon: ImageUpIcon,
  category: 'image',
  path: '/tools/image-upscaler',
  Component: ImageUpscalerTool,

  config: {
    showInGrid: true,
    featured: true,
    layoutType: 'canvas',
    showSettingsPanel: true,

    creditCost: {
      base: 2,
      calculator: (params) => {
        const { scale } = params
        return Math.ceil(2 * scale)
      }
    },

    features: {
      upload: true,
      download: true,
      history: true,
      favorites: false
    }
  }
}

export default imageUpscalerTool
```

```typescript
// frontend/src/tools/image-upscaler/ImageUpscalerTool.tsx

import { useState } from 'react'
import { useUpscaleImage } from './hooks/useUpscaleImage'
import SettingsPanel from './components/SettingsPanel'
import ImageCanvas from './components/ImageCanvas'

export default function ImageUpscalerTool() {
  const [image, setImage] = useState<File | null>(null)
  const [scale, setScale] = useState(2)
  const { mutate: upscale, isLoading, data } = useUpscaleImage()

  const handleUpscale = () => {
    if (image) {
      upscale({ image, scale })
    }
  }

  return (
    <div className="flex h-full">
      <SettingsPanel scale={scale} onScaleChange={setScale} />

      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6">
          <ImageCanvas
            original={image}
            upscaled={data?.result}
            onImageSelect={setImage}
          />
        </div>

        <div className="border-t p-4">
          <button
            onClick={handleUpscale}
            disabled={isLoading || !image}
            className="btn-primary w-full"
          >
            {isLoading ? 'Upscaling...' : 'Upscale Image'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

```typescript
// frontend/src/tools/image-upscaler/hooks/useUpscaleImage.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useCreditStore } from '@/stores/creditStore'

export function useUpscaleImage() {
  const queryClient = useQueryClient()
  const { deductCredits } = useCreditStore()

  return useMutation({
    mutationFn: async ({ image, scale }: { image: File; scale: number }) => {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('scale', scale.toString())

      const res = await api.post('/api/tools/image-upscaler/upscale', formData)
      return res.data
    },
    onSuccess: (data) => {
      deductCredits(data.creditsUsed)
      queryClient.invalidateQueries(['credits'])
    }
  })
}
```

#### Step 2: Register Frontend Tool

```typescript
// frontend/src/tools/registry.ts

import imageUpscalerTool from './image-upscaler'

// Add to registry
toolRegistry.register(imageUpscalerTool)
```

#### Step 3: Backend Tool Plugin

```typescript
// backend/src/tools/image-upscaler/index.ts

import { Hono } from 'hono'
import { BackendToolPlugin } from '../types'
import imageUpscalerRoutes from './routes'
import ImageUpscalerService from './service'

const imageUpscalerTool: BackendToolPlugin = {
  id: 'image-upscaler',
  name: 'Image Upscaler',
  version: '1.0.0',
  basePath: '/api/tools/image-upscaler',
  routes: imageUpscalerRoutes,
  service: new ImageUpscalerService(),

  config: {
    useDatabase: true,
    tablePrefix: 'upscaler_',
    allowUploads: true,
    uploadPath: 'uploads/image-upscaler',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['.jpg', '.jpeg', '.png', '.webp'],
    asyncProcessing: true,
    creditConfig: {
      deductOnStart: true,
      refundOnError: true
    }
  }
}

export default imageUpscalerTool
```

```typescript
// backend/src/tools/image-upscaler/routes.ts

import { Hono } from 'hono'
import { authMiddleware } from '@/middleware/auth.middleware'
import ImageUpscalerService from './service'

const imageUpscalerRoutes = new Hono()
const service = new ImageUpscalerService()

imageUpscalerRoutes.post('/upscale', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const formData = await c.req.formData()

  const image = formData.get('image') as File
  const scale = parseInt(formData.get('scale') as string)

  // Calculate credits
  const creditsRequired = service.calculateCredits({ scale })

  // Check and deduct credits
  const creditService = c.get('creditService')
  await creditService.checkAndDeduct(userId, creditsRequired, {
    description: `Image upscaling ${scale}x`,
    referenceType: 'image_upscaler'
  })

  // Process
  const result = await service.upscaleImage(userId, image, scale)

  return c.json(result)
})

export default imageUpscalerRoutes
```

```typescript
// backend/src/tools/image-upscaler/service.ts

import { ToolService } from '../types'
import sharp from 'sharp'
import path from 'path'
import { prisma } from '@/db/client'

class ImageUpscalerService implements ToolService {
  async create(userId: string, data: any) {
    // Implementation
    return {}
  }

  async get(id: string) {
    return {}
  }

  async update(id: string, data: any) {
    return {}
  }

  async delete(id: string) {}

  async list(userId: string) {
    return []
  }

  calculateCredits(params: { scale: number }): number {
    return Math.ceil(2 * params.scale)
  }

  async upscaleImage(userId: string, image: File, scale: number) {
    // Save original
    const uploadPath = path.join('uploads/image-upscaler', userId)
    const originalPath = path.join(uploadPath, image.name)
    await Bun.write(originalPath, await image.arrayBuffer())

    // Upscale with Sharp
    const outputPath = path.join('outputs/image-upscaler', userId, `upscaled-${scale}x-${image.name}`)

    await sharp(originalPath)
      .resize({
        width: null,
        height: null,
        fit: 'inside',
        kernel: 'lanczos3'
      })
      .scale(scale)
      .toFile(outputPath)

    // Get file info
    const metadata = await sharp(outputPath).metadata()

    return {
      success: true,
      creditsUsed: this.calculateCredits({ scale }),
      result: {
        url: `/api/outputs/${outputPath}`,
        width: metadata.width,
        height: metadata.height,
        size: (await Bun.file(outputPath).size)
      }
    }
  }
}

export default ImageUpscalerService
```

#### Step 4: Register Backend Tool

```typescript
// backend/src/index.ts

import imageUpscalerTool from './tools/image-upscaler'

// Register tool
await toolRegistry.register(imageUpscalerTool)
```

#### Step 5: Add Database Schema (Optional)

```prisma
// prisma/schema.prisma

model UpscalerJob {
  id          String   @id @default(cuid())
  userId      String

  originalPath String
  outputPath   String
  scale        Int

  creditsUsed  Int
  status       JobStatus @default(COMPLETED)

  createdAt    DateTime @default(now())

  @@index([userId])
  @@map("upscaler_jobs")
}
```

```bash
# Create migration
npx prisma migrate dev --name add_upscaler_tool
```

#### Step 6: Test the Tool

```bash
# Start dev server
bun dev

# Navigate to http://localhost:5173/tools/image-upscaler
# Upload an image and test upscaling
```

### 13.3 Tool Development Checklist

**Frontend**:
- [ ] Create tool directory
- [ ] Implement ToolPlugin interface
- [ ] Create main component
- [ ] Create settings panel (if needed)
- [ ] Create canvas/workspace component
- [ ] Implement API hooks (React Query)
- [ ] Add Zustand store (if complex state)
- [ ] Register in tool registry
- [ ] Add tool icon
- [ ] Test navigation
- [ ] Test credit deduction

**Backend**:
- [ ] Create tool directory
- [ ] Implement BackendToolPlugin interface
- [ ] Create Hono routes
- [ ] Implement ToolService interface
- [ ] Add credit calculator
- [ ] Add input validation (Zod schemas)
- [ ] Handle file uploads (if needed)
- [ ] Implement business logic
- [ ] Add error handling
- [ ] Register in tool registry
- [ ] Add database models (if needed)
- [ ] Run migration
- [ ] Test API endpoints
- [ ] Test credit flow

**Documentation**:
- [ ] Add tool description to README
- [ ] Document API endpoints
- [ ] Document credit pricing
- [ ] Add usage examples

---

## Conclusion

This architecture provides a solid foundation for building a unified AI tools platform with UX patterns adapted from Freepik AI Suite. The key strengths:

1. **Modularity**: Tools are plugins that can be added/removed independently
2. **Unified UX**: Single SPA with smooth navigation between tools
3. **Centralized Billing**: One credit system, atomic transactions
4. **Scalability**: Stateless design, horizontal scaling ready
5. **Developer Experience**: Adding new tools takes minimal time with clear patterns
6. **Focused Navigation**: Simplified sidebar focused on AI tools workflow

### What We Adapted from Freepik (Not Copy-Paste)

**✅ Adopted Patterns**:
- Persistent left sidebar with collapsible tool navigation
- Top bar with breadcrumb navigation and credit display
- Tools grid with category filter tabs
- Tool interface with settings panel + canvas layout
- Card-based tool presentation with thumbnails
- Collapsible settings panel in tool view
- Instant client-side navigation (SPA)
- Responsive breakpoints and mobile-first approach

**❌ Removed/Simplified**:
- ~~Stock page~~ → Removed (not needed for AI tools focus)
- ~~Community page~~ → Removed (can add later if needed)
- ~~Social features~~ → Simplified to focus on tool creation
- ~~Inspiration tab~~ → Optional feature, not core
- Complex multi-level navigation → Simplified to Home + AI Tools

**🔧 Customized for Lumiku**:
- Branding: "Lumiku Suite" instead of "Freepik"
- Sidebar items: Home, AI Tools, Pinned (All tools, My work, Credits, Profile)
- Navigation focus: AI creation tools only
- Simpler information architecture
- Credit-focused UX (always visible)

### Routing Structure

```
/                    → Landing page
/login               → Login
/register            → Register (100 free credits)
/dashboard           → Tools grid (main page after login)
/tools               → Tools grid (same as dashboard)
/tools/video-mix     → Video Mix Pro interface
/tools/carousel      → Carousel Generator interface
/my-work             → User's created content
/credits             → Credit management & purchase
/profile             → User profile settings
/pricing             → Pricing plans
```

**Next Steps**:
1. Set up monorepo structure with Bun workspaces
2. Implement core authentication and credit system
3. Build RootLayout, TopBar, and Sidebar components
4. Create ToolsGrid page with filter tabs
5. Build first tool plugin (Video Mix or Carousel)
6. Test plugin registration and dynamic routing
7. Add ToolInterfaceLayout with settings panel
8. Deploy to staging and test UX flow
9. Iterate based on user feedback

**Key Files to Create First**:
1. **Backend**: `src/index.ts`, `src/services/credit.service.ts`, `src/tools/registry.ts`
2. **Frontend**: `src/App.tsx`, `src/layouts/RootLayout.tsx`, `src/tools/registry.ts`
3. **Database**: `prisma/schema.prisma`
4. **Config**: `.env`, `package.json` (workspaces)

This documentation serves as your single source of truth. Refer to it when implementing features, onboarding developers, or making architectural decisions.

---

**Document Status**: Complete and ready for implementation
**Architecture Pattern**: Freepik-inspired, adapted for AI tools focus
**Maintainer**: Development Team
**Version**: 1.0
**Last Updated**: 2025-09-30