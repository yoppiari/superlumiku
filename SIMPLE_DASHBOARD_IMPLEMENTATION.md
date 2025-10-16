# Lumiku Simple Dashboard - Implementation Guide

**Version:** 2.0
**Date:** October 2025
**Target:** Pin-First Dashboard with Simplified UX

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [API Endpoints](#api-endpoints)
7. [Migration Guide](#migration-guide)
8. [Testing](#testing)

---

## Overview

### What's New

**Key Changes from Previous Design:**
1. **Dashboard shows ONLY pinned apps** (3-6 max) instead of all 30+ apps
2. **All Apps live in a modal** with search and filters
3. **Larger, more spacious cards** (200px+ height on mobile)
4. **Generous spacing** (20-24px padding instead of 16px)
5. **Simplified stats** (horizontal scroll on mobile)
6. **Pin/star system** for app management

### User Flow

```
Login
  ↓
Dashboard (Pinned Apps Only)
  ├─ Quick Stats (Credits, Projects, Works)
  ├─ Pinned Apps (3-6 cards)
  │   └─ Click star → Unpin
  ├─ "Browse All Apps" button
  │   └─ Opens modal with all apps
  │       ├─ Search
  │       ├─ Category filters
  │       └─ Pin/unpin any app
  └─ Recent Work (3-5 items)
```

---

## Architecture

### System Components

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
├─────────────────────────────────────────┤
│ Pages:                                  │
│  • Dashboard (/)                        │
│  • All Apps Modal (component)          │
│                                         │
│ Components:                             │
│  • PinnedAppCard                       │
│  • AllAppsModal                        │
│  • AppCard                             │
│  • StatCard                            │
│  • RecentWorkItem                      │
└─────────────────────────────────────────┘
              ↕ API
┌─────────────────────────────────────────┐
│          Backend (Hono)                 │
├─────────────────────────────────────────┤
│ Services:                               │
│  • userPreferenceService               │
│  • dashboardService                    │
│  • pluginRegistry                      │
│                                         │
│ Routes:                                 │
│  • GET /api/dashboard/apps             │
│  • GET /api/dashboard/pinned           │
│  • POST /api/dashboard/pin/:appId      │
│  • DELETE /api/dashboard/pin/:appId    │
└─────────────────────────────────────────┘
              ↕
┌─────────────────────────────────────────┐
│        Database (PostgreSQL)            │
├─────────────────────────────────────────┤
│ Tables:                                 │
│  • user_app_pins                       │
│  • users                               │
│  • ... (existing tables)               │
└─────────────────────────────────────────┘
```

---

## Database Schema

### New Table: `user_app_pins`

```sql
CREATE TABLE user_app_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id VARCHAR(100) NOT NULL,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pin_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, app_id)
);

-- Indexes
CREATE INDEX idx_user_app_pins_user_id ON user_app_pins(user_id);
CREATE INDEX idx_user_app_pins_order ON user_app_pins(user_id, pin_order);

-- Constraint: Max 6 pinned apps per user
CREATE OR REPLACE FUNCTION check_max_pins()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM user_app_pins
    WHERE user_id = NEW.user_id
  ) >= 6 THEN
    RAISE EXCEPTION 'User cannot pin more than 6 apps';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_max_pins_trigger
BEFORE INSERT ON user_app_pins
FOR EACH ROW
EXECUTE FUNCTION check_max_pins();
```

### Migration SQL

**File:** `backend/migrations/XXXX_add_user_app_pins.sql`

```sql
-- Migration: Add user app pins table
-- Created: 2025-10-14

BEGIN;

-- Create table
CREATE TABLE IF NOT EXISTS user_app_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id VARCHAR(100) NOT NULL,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pin_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

-- Indexes
CREATE INDEX idx_user_app_pins_user_id ON user_app_pins(user_id);
CREATE INDEX idx_user_app_pins_order ON user_app_pins(user_id, pin_order);

-- Max 6 pins constraint
CREATE OR REPLACE FUNCTION check_max_pins()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM user_app_pins
    WHERE user_id = NEW.user_id
  ) >= 6 THEN
    RAISE EXCEPTION 'User cannot pin more than 6 apps';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_max_pins_trigger
BEFORE INSERT ON user_app_pins
FOR EACH ROW
EXECUTE FUNCTION check_max_pins();

-- Seed default pins for existing users
-- Pin the 4 most popular apps by default
INSERT INTO user_app_pins (user_id, app_id, pin_order)
SELECT
  u.id,
  app_id,
  row_number
FROM users u
CROSS JOIN (
  VALUES
    ('avatar-creator', 1),
    ('pose-generator', 2),
    ('carousel-mix', 3),
    ('looping-flow', 4)
) AS default_apps(app_id, row_number)
ON CONFLICT (user_id, app_id) DO NOTHING;

COMMIT;
```

---

## Backend Implementation

### 1. User Preference Service

**File:** `backend/src/services/userPreference.service.ts`

```typescript
import { db } from '../config/database'
import { AppError } from '../core/errors'

export interface UserAppPin {
  id: string
  userId: string
  appId: string
  pinnedAt: Date
  pinOrder: number
}

export const userPreferenceService = {
  /**
   * Get user's pinned apps
   */
  async getPinnedApps(userId: string): Promise<string[]> {
    try {
      const result = await db.query(
        `SELECT app_id
         FROM user_app_pins
         WHERE user_id = $1
         ORDER BY pin_order ASC, pinned_at ASC`,
        [userId]
      )

      return result.rows.map(row => row.app_id)
    } catch (error) {
      throw new AppError('Failed to get pinned apps', 500, error)
    }
  },

  /**
   * Pin an app for a user
   */
  async pinApp(userId: string, appId: string): Promise<UserAppPin> {
    try {
      // Check if already pinned
      const existing = await db.query(
        'SELECT id FROM user_app_pins WHERE user_id = $1 AND app_id = $2',
        [userId, appId]
      )

      if (existing.rows.length > 0) {
        throw new AppError('App already pinned', 400)
      }

      // Get current pin count
      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM user_app_pins WHERE user_id = $1',
        [userId]
      )

      const currentCount = parseInt(countResult.rows[0].count)

      if (currentCount >= 6) {
        throw new AppError('Cannot pin more than 6 apps', 400)
      }

      // Insert pin
      const result = await db.query(
        `INSERT INTO user_app_pins (user_id, app_id, pin_order)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, appId, currentCount]
      )

      return {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        appId: result.rows[0].app_id,
        pinnedAt: result.rows[0].pinned_at,
        pinOrder: result.rows[0].pin_order,
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('Failed to pin app', 500, error)
    }
  },

  /**
   * Unpin an app for a user
   */
  async unpinApp(userId: string, appId: string): Promise<void> {
    try {
      const result = await db.query(
        'DELETE FROM user_app_pins WHERE user_id = $1 AND app_id = $2 RETURNING id',
        [userId, appId]
      )

      if (result.rows.length === 0) {
        throw new AppError('App not pinned', 404)
      }

      // Reorder remaining pins
      await db.query(
        `UPDATE user_app_pins
         SET pin_order = new_order.row_num - 1
         FROM (
           SELECT id, ROW_NUMBER() OVER (ORDER BY pin_order) as row_num
           FROM user_app_pins
           WHERE user_id = $1
         ) as new_order
         WHERE user_app_pins.id = new_order.id`,
        [userId]
      )
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('Failed to unpin app', 500, error)
    }
  },

  /**
   * Reorder pinned apps
   */
  async reorderPins(userId: string, appIds: string[]): Promise<void> {
    try {
      if (appIds.length > 6) {
        throw new AppError('Cannot have more than 6 pinned apps', 400)
      }

      // Update order for each app
      for (let i = 0; i < appIds.length; i++) {
        await db.query(
          `UPDATE user_app_pins
           SET pin_order = $1
           WHERE user_id = $2 AND app_id = $3`,
          [i, userId, appIds[i]]
        )
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('Failed to reorder pins', 500, error)
    }
  },
}
```

### 2. Dashboard Service Updates

**File:** `backend/src/services/dashboard.service.ts`

```typescript
import { pluginRegistry } from '../plugins/registry'
import { userPreferenceService } from './userPreference.service'
import { PluginConfig } from '../plugins/types'

export interface DashboardApp extends PluginConfig {
  pinned: boolean
}

export const dashboardService = {
  /**
   * Get all available apps with pinned status
   */
  async getApps(userId: string): Promise<{ apps: DashboardApp[] }> {
    try {
      const allApps = pluginRegistry.getDashboardApps()
      const pinnedAppIds = await userPreferenceService.getPinnedApps(userId)

      const apps: DashboardApp[] = allApps.map(app => ({
        ...app,
        pinned: pinnedAppIds.includes(app.appId),
      }))

      return { apps }
    } catch (error) {
      throw new AppError('Failed to get apps', 500, error)
    }
  },

  /**
   * Get only pinned apps (for dashboard view)
   */
  async getPinnedApps(userId: string): Promise<{ apps: DashboardApp[] }> {
    try {
      const allApps = pluginRegistry.getDashboardApps()
      const pinnedAppIds = await userPreferenceService.getPinnedApps(userId)

      // Return apps in pinned order
      const apps: DashboardApp[] = pinnedAppIds
        .map(appId => {
          const app = allApps.find(a => a.appId === appId)
          if (!app) return null
          return { ...app, pinned: true }
        })
        .filter(app => app !== null) as DashboardApp[]

      return { apps }
    } catch (error) {
      throw new AppError('Failed to get pinned apps', 500, error)
    }
  },

  // ... existing methods (getStats, etc.)
}
```

### 3. Dashboard Routes

**File:** `backend/src/routes/dashboard.routes.ts`

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../core/middleware/auth.middleware'
import { dashboardService } from '../services/dashboard.service'
import { userPreferenceService } from '../services/userPreference.service'
import { handleApiError } from '../lib/errorHandler'

const dashboardRouter = new Hono()

// Get all apps (with pinned status)
dashboardRouter.get('/apps', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const result = await dashboardService.getApps(userId)
    return c.json(result)
  } catch (error) {
    return handleApiError(c, error)
  }
})

// Get pinned apps only
dashboardRouter.get('/pinned', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const result = await dashboardService.getPinnedApps(userId)
    return c.json(result)
  } catch (error) {
    return handleApiError(c, error)
  }
})

// Pin an app
dashboardRouter.post('/pin/:appId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { appId } = c.req.param()

    const result = await userPreferenceService.pinApp(userId, appId)
    return c.json({
      success: true,
      message: 'App pinned successfully',
      data: result,
    })
  } catch (error) {
    return handleApiError(c, error)
  }
})

// Unpin an app
dashboardRouter.delete('/pin/:appId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { appId } = c.req.param()

    await userPreferenceService.unpinApp(userId, appId)
    return c.json({
      success: true,
      message: 'App unpinned successfully',
    })
  } catch (error) {
    return handleApiError(c, error)
  }
})

// Reorder pins
dashboardRouter.put('/pins/reorder', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { appIds } = await c.req.json()

    if (!Array.isArray(appIds)) {
      return c.json({ error: 'appIds must be an array' }, 400)
    }

    await userPreferenceService.reorderPins(userId, appIds)
    return c.json({
      success: true,
      message: 'Pins reordered successfully',
    })
  } catch (error) {
    return handleApiError(c, error)
  }
})

// Get dashboard stats
dashboardRouter.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const stats = await dashboardService.getStats(userId)
    return c.json(stats)
  } catch (error) {
    return handleApiError(c, error)
  }
})

export default dashboardRouter
```

### 4. Register Routes in App

**File:** `backend/src/app.ts`

```typescript
import dashboardRouter from './routes/dashboard.routes'

// ... existing code

app.route('/api/dashboard', dashboardRouter)
```

---

## Frontend Implementation

### 1. Dashboard Service

**File:** `frontend/src/services/dashboardService.ts`

```typescript
import api from './api'

export interface DashboardApp {
  appId: string
  name: string
  description: string
  icon: string
  color: string
  order: number
  beta: boolean
  comingSoon: boolean
  pinned: boolean
  credits: Record<string, number>
}

export interface DashboardStats {
  totalSpending: number
  totalWorks: number
  totalProjects: number
  lastLogin: string
}

export const dashboardService = {
  /**
   * Get all apps (with pinned status)
   */
  async getApps(): Promise<{ apps: DashboardApp[] }> {
    const response = await api.get('/api/dashboard/apps')
    return response.data
  },

  /**
   * Get pinned apps only
   */
  async getPinnedApps(): Promise<{ apps: DashboardApp[] }> {
    const response = await api.get('/api/dashboard/pinned')
    return response.data
  },

  /**
   * Pin an app
   */
  async pinApp(appId: string): Promise<void> {
    await api.post(`/api/dashboard/pin/${appId}`)
  },

  /**
   * Unpin an app
   */
  async unpinApp(appId: string): Promise<void> {
    await api.delete(`/api/dashboard/pin/${appId}`)
  },

  /**
   * Reorder pinned apps
   */
  async reorderPins(appIds: string[]): Promise<void> {
    await api.put('/api/dashboard/pins/reorder', { appIds })
  },

  /**
   * Get dashboard stats
   */
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/api/dashboard/stats')
    return response.data
  },
}
```

### 2. Updated Dashboard Page

**File:** `frontend/src/pages/Dashboard.tsx`

```typescript
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { creditsService, dashboardService } from '../services'
import { handleApiError } from '../lib/errorHandler'
import ProfileDropdown from '../components/ProfileDropdown'
import PinnedAppCard from '../components/dashboard/PinnedAppCard'
import AllAppsModal from '../components/dashboard/AllAppsModal'
import StatCard from '../components/dashboard/StatCard'
import RecentWorkSection from '../components/dashboard/RecentWorkSection'
import type { DashboardApp, DashboardStats } from '../services/dashboardService'
import { Coins, Briefcase, FolderKanban, LogIn } from 'lucide-react'

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [creditBalance, setCreditBalance] = useState(user?.creditBalance || 0)
  const [pinnedApps, setPinnedApps] = useState<DashboardApp[]>([])
  const [loadingPinnedApps, setLoadingPinnedApps] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [showAllAppsModal, setShowAllAppsModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchDashboardData = async () => {
      try {
        // Fetch credit balance
        const balanceData = await creditsService.getBalance()
        setCreditBalance(balanceData?.balance ?? 0)
      } catch (err) {
        handleApiError(err, 'Fetch credit balance')
      }

      try {
        // Fetch pinned apps
        const { apps } = await dashboardService.getPinnedApps()
        setPinnedApps(apps)
      } catch (err) {
        handleApiError(err, 'Fetch pinned apps')
      } finally {
        setLoadingPinnedApps(false)
      }

      try {
        // Fetch stats
        const statsData = await dashboardService.getStats()
        setStats(statsData)
      } catch (err) {
        handleApiError(err, 'Fetch dashboard stats')
      } finally {
        setLoadingStats(false)
      }
    }

    fetchDashboardData()
  }, [isAuthenticated])

  const handleUnpinApp = async (appId: string) => {
    try {
      await dashboardService.unpinApp(appId)
      setPinnedApps(prev => prev.filter(app => app.appId !== appId))
      // Show toast notification
      alert('App unpinned from dashboard')
    } catch (err) {
      handleApiError(err, 'Unpin app')
    }
  }

  const handleAppClick = (appId: string) => {
    navigate(`/apps/${appId}`)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-5 md:py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button className="md:hidden w-12 h-12 flex items-center justify-center rounded-lg hover:bg-slate-50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Lumiku</h1>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-400 px-3 md:px-4 py-2.5 rounded-lg min-h-[48px]">
                <Coins className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-sm md:text-base">{creditBalance.toLocaleString()}</span>
              </div>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-5 md:px-10 py-5 md:py-10">
        {/* Quick Stats */}
        <section className="mb-10 md:mb-14">
          <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
            <StatCard
              icon={Coins}
              value={creditBalance.toLocaleString()}
              label="Credits Available"
              color="purple"
              featured
              action={{ label: '+ Buy Credits', onClick: () => alert('Buy credits') }}
            />
            <StatCard
              icon={FolderKanban}
              value={stats?.totalProjects?.toString() || '0'}
              label="Projects"
              color="blue"
            />
            <StatCard
              icon={Briefcase}
              value={stats?.totalWorks?.toString() || '0'}
              label="Total Works"
              color="green"
            />
          </div>
        </section>

        {/* Pinned Apps */}
        <section className="mb-10 md:mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <span>Pinned Apps</span>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-semibold">
                {pinnedApps.length}
              </span>
            </h2>
            <button
              onClick={() => setShowAllAppsModal(true)}
              className="px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 min-h-[48px]"
            >
              Manage
            </button>
          </div>

          {loadingPinnedApps ? (
            <div className="text-center py-12 text-slate-600">Loading apps...</div>
          ) : pinnedApps.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-600 mb-4">No pinned apps yet</p>
              <button
                onClick={() => setShowAllAppsModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Browse All Apps
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {pinnedApps.map(app => (
                <PinnedAppCard
                  key={app.appId}
                  app={app}
                  onClick={() => handleAppClick(app.appId)}
                  onUnpin={() => handleUnpinApp(app.appId)}
                />
              ))}

              {/* View All Apps Card */}
              <div
                onClick={() => setShowAllAppsModal(true)}
                className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 md:p-8 rounded-2xl min-h-[200px] md:min-h-[240px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <div className="text-xl md:text-2xl font-bold">Browse All Apps</div>
                <div className="text-sm opacity-90">30 apps available</div>
              </div>
            </div>
          )}
        </section>

        {/* Recent Work */}
        <RecentWorkSection />
      </main>

      {/* All Apps Modal */}
      {showAllAppsModal && (
        <AllAppsModal
          onClose={() => setShowAllAppsModal(false)}
          onAppClick={handleAppClick}
          pinnedApps={pinnedApps}
          onPinToggle={(appId, isPinned) => {
            if (isPinned) {
              handleUnpinApp(appId)
            } else {
              // Refresh pinned apps after pinning
              dashboardService.getPinnedApps().then(({ apps }) => {
                setPinnedApps(apps)
              })
            }
          }}
        />
      )}
    </div>
  )
}
```

### 3. Pinned App Card Component

**File:** `frontend/src/components/dashboard/PinnedAppCard.tsx`

```typescript
import { Star } from 'lucide-react'
import type { DashboardApp } from '../../services/dashboardService'

interface PinnedAppCardProps {
  app: DashboardApp
  onClick: () => void
  onUnpin: () => void
}

const iconMap: Record<string, any> = {
  // ... your icon mapping
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  purple: 'bg-purple-50 text-purple-700',
  orange: 'bg-orange-50 text-orange-700',
  red: 'bg-red-50 text-red-700',
}

export default function PinnedAppCard({ app, onClick, onUnpin }: PinnedAppCardProps) {
  const Icon = iconMap[app.icon] || iconMap['default']
  const colorClass = colorClasses[app.color as keyof typeof colorClasses] || colorClasses.blue

  return (
    <div
      onClick={onClick}
      className="relative bg-white border-2 border-slate-200 rounded-2xl p-6 md:p-8 min-h-[200px] md:min-h-[240px] flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-900 hover:shadow-xl hover:translate-y-[-4px] transition-all group"
    >
      {/* Star Badge */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onUnpin()
        }}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Unpin"
      >
        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
      </button>

      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Icon */}
      <div className={`w-18 h-18 rounded-xl ${colorClass} flex items-center justify-center mb-5 transition-transform group-hover:scale-110`}>
        <Icon className="w-10 h-10" />
      </div>

      {/* Content */}
      <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">{app.name}</h3>
      <p className="text-sm text-slate-600 mb-4">{app.description}</p>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        {app.beta && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-semibold">Beta</span>
        )}
        <span>{Object.values(app.credits)[0] || 0} credits/use</span>
      </div>
    </div>
  )
}
```

### 4. All Apps Modal Component

**File:** `frontend/src/components/dashboard/AllAppsModal.tsx`

```typescript
import { useState, useEffect } from 'react'
import { X, Search, Star } from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'
import type { DashboardApp } from '../../services/dashboardService'

interface AllAppsModalProps {
  onClose: () => void
  onAppClick: (appId: string) => void
  pinnedApps: DashboardApp[]
  onPinToggle: (appId: string, isPinned: boolean) => void
}

export default function AllAppsModal({
  onClose,
  onAppClick,
  pinnedApps,
  onPinToggle,
}: AllAppsModalProps) {
  const [allApps, setAllApps] = useState<DashboardApp[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllApps()
  }, [])

  const fetchAllApps = async () => {
    try {
      const { apps } = await dashboardService.getApps()
      setAllApps(apps)
    } catch (error) {
      console.error('Failed to fetch apps:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredApps = allApps.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())

    // Add category filter logic based on your app categories
    const matchesFilter = activeFilter === 'all' // Implement category filtering

    return matchesSearch && matchesFilter
  })

  const handlePinToggle = async (app: DashboardApp) => {
    try {
      if (app.pinned) {
        await dashboardService.unpinApp(app.appId)
      } else {
        if (pinnedApps.length >= 6) {
          alert('You can only pin up to 6 apps')
          return
        }
        await dashboardService.pinApp(app.appId)
      }

      onPinToggle(app.appId, app.pinned)

      // Update local state
      setAllApps(prev =>
        prev.map(a =>
          a.appId === app.appId ? { ...a, pinned: !a.pinned } : a
        )
      )
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">All Apps</h2>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-lg hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="search"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b flex gap-2 overflow-x-auto">
          {['all', 'content', 'design', 'video', 'productivity'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">Loading apps...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredApps.map(app => (
                <div
                  key={app.appId}
                  onClick={() => onAppClick(app.appId)}
                  className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all ${
                    app.pinned
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePinToggle(app)
                    }}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      app.pinned
                        ? 'bg-amber-100'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        app.pinned ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  <div className="text-center">
                    <div className="text-4xl mb-4">📱</div>
                    <h3 className="font-bold mb-2">{app.name}</h3>
                    <p className="text-sm text-slate-600 mb-3">{app.description}</p>
                    <div className="text-xs text-slate-500">
                      {Object.values(app.credits)[0] || 0} credits/use
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
```

---

## API Endpoints

### Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/apps` | Get all apps with pinned status | Yes |
| GET | `/api/dashboard/pinned` | Get pinned apps only | Yes |
| POST | `/api/dashboard/pin/:appId` | Pin an app | Yes |
| DELETE | `/api/dashboard/pin/:appId` | Unpin an app | Yes |
| PUT | `/api/dashboard/pins/reorder` | Reorder pinned apps | Yes |
| GET | `/api/dashboard/stats` | Get dashboard stats | Yes |

---

## Migration Guide

### Step 1: Database Migration

```bash
# Run migration
cd backend
npm run migrate

# Or manually
psql $DATABASE_URL -f migrations/XXXX_add_user_app_pins.sql
```

### Step 2: Seed Default Pins

```bash
# Default pins are auto-seeded in migration
# Or run manually:
psql $DATABASE_URL -c "
INSERT INTO user_app_pins (user_id, app_id, pin_order)
SELECT u.id, 'avatar-creator', 1 FROM users u
ON CONFLICT DO NOTHING;
"
```

### Step 3: Update Backend

```bash
# Install dependencies (if any new ones)
cd backend
npm install

# Build
npm run build

# Restart server
npm run start
```

### Step 4: Update Frontend

```bash
cd frontend
npm install
npm run build
```

### Step 5: Deploy

```bash
# Deploy to production
./deploy-production.sh
```

---

## Testing

### Backend Tests

**File:** `backend/src/services/__tests__/userPreference.service.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { userPreferenceService } from '../userPreference.service'

describe('User Preference Service', () => {
  const testUserId = 'test-user-id'

  beforeEach(async () => {
    // Clean up test data
    await db.query('DELETE FROM user_app_pins WHERE user_id = $1', [testUserId])
  })

  it('should pin an app', async () => {
    const result = await userPreferenceService.pinApp(testUserId, 'avatar-creator')
    expect(result.appId).toBe('avatar-creator')
    expect(result.userId).toBe(testUserId)
  })

  it('should not allow pinning more than 6 apps', async () => {
    // Pin 6 apps
    for (let i = 0; i < 6; i++) {
      await userPreferenceService.pinApp(testUserId, `app-${i}`)
    }

    // Try to pin 7th app
    await expect(
      userPreferenceService.pinApp(testUserId, 'app-7')
    ).rejects.toThrow('Cannot pin more than 6 apps')
  })

  it('should unpin an app', async () => {
    await userPreferenceService.pinApp(testUserId, 'avatar-creator')
    await userPreferenceService.unpinApp(testUserId, 'avatar-creator')

    const pinnedApps = await userPreferenceService.getPinnedApps(testUserId)
    expect(pinnedApps).not.toContain('avatar-creator')
  })

  it('should maintain pin order', async () => {
    await userPreferenceService.pinApp(testUserId, 'app-1')
    await userPreferenceService.pinApp(testUserId, 'app-2')
    await userPreferenceService.pinApp(testUserId, 'app-3')

    const pinnedApps = await userPreferenceService.getPinnedApps(testUserId)
    expect(pinnedApps).toEqual(['app-1', 'app-2', 'app-3'])
  })
})
```

### Frontend Tests

**File:** `frontend/src/components/dashboard/__tests__/PinnedAppCard.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PinnedAppCard from '../PinnedAppCard'

describe('PinnedAppCard', () => {
  const mockApp = {
    appId: 'avatar-creator',
    name: 'Avatar Creator',
    description: 'Create stunning avatars',
    icon: 'user-circle',
    color: 'purple',
    order: 1,
    beta: true,
    comingSoon: false,
    pinned: true,
    credits: { generate: 10 },
  }

  it('should render app information', () => {
    render(
      <PinnedAppCard
        app={mockApp}
        onClick={() => {}}
        onUnpin={() => {}}
      />
    )

    expect(screen.getByText('Avatar Creator')).toBeInTheDocument()
    expect(screen.getByText('Create stunning avatars')).toBeInTheDocument()
  })

  it('should call onClick when card is clicked', () => {
    const handleClick = vi.fn()
    render(
      <PinnedAppCard
        app={mockApp}
        onClick={handleClick}
        onUnpin={() => {}}
      />
    )

    fireEvent.click(screen.getByText('Avatar Creator'))
    expect(handleClick).toHaveBeenCalled()
  })

  it('should call onUnpin when star is clicked', () => {
    const handleUnpin = vi.fn()
    render(
      <PinnedAppCard
        app={mockApp}
        onClick={() => {}}
        onUnpin={handleUnpin}
      />
    )

    fireEvent.click(screen.getByLabelText('Unpin'))
    expect(handleUnpin).toHaveBeenCalled()
  })
})
```

### E2E Tests

```typescript
// Cypress or Playwright test
describe('Dashboard Pin System', () => {
  it('should show only pinned apps on dashboard', () => {
    cy.login()
    cy.visit('/')

    // Should show pinned apps section
    cy.contains('Pinned Apps').should('be.visible')

    // Should show pin count badge
    cy.contains(/\d+/).should('be.visible')

    // Should show at least 1 pinned app
    cy.get('[data-testid="pinned-app-card"]').should('have.length.at.least', 1)
  })

  it('should allow unpinning an app', () => {
    cy.login()
    cy.visit('/')

    // Click star on first pinned app
    cy.get('[data-testid="pinned-app-card"]').first().find('[aria-label="Unpin"]').click()

    // Should show confirmation
    cy.contains('App unpinned').should('be.visible')

    // App should be removed from dashboard
    // (verify count decreased)
  })

  it('should open all apps modal', () => {
    cy.login()
    cy.visit('/')

    // Click "Browse All Apps"
    cy.contains('Browse All Apps').click()

    // Modal should open
    cy.get('[role="dialog"]').should('be.visible')
    cy.contains('All Apps').should('be.visible')

    // Should show search input
    cy.get('input[type="search"]').should('be.visible')
  })

  it('should not allow pinning more than 6 apps', () => {
    cy.login()
    cy.visit('/')

    // Open modal
    cy.contains('Browse All Apps').click()

    // Try to pin 7th app (assuming 6 already pinned)
    // Should show error message
  })
})
```

---

## Performance Considerations

### 1. Caching
```typescript
// Cache pinned apps in localStorage
const cachedPinnedApps = localStorage.getItem('pinnedApps')
if (cachedPinnedApps) {
  setPinnedApps(JSON.parse(cachedPinnedApps))
}

// Update cache when pinned apps change
useEffect(() => {
  localStorage.setItem('pinnedApps', JSON.stringify(pinnedApps))
}, [pinnedApps])
```

### 2. Optimistic Updates
```typescript
const handleUnpinApp = async (appId: string) => {
  // Optimistically update UI
  setPinnedApps(prev => prev.filter(app => app.appId !== appId))

  try {
    await dashboardService.unpinApp(appId)
  } catch (err) {
    // Revert on error
    setPinnedApps(prev => [...prev, /* find and add back */])
    handleApiError(err, 'Unpin app')
  }
}
```

### 3. Database Indexes
```sql
-- Already created in migration
CREATE INDEX idx_user_app_pins_user_id ON user_app_pins(user_id);
CREATE INDEX idx_user_app_pins_order ON user_app_pins(user_id, pin_order);
```

---

## Deployment Checklist

- [ ] Run database migration
- [ ] Verify default pins are seeded
- [ ] Test pin/unpin functionality
- [ ] Test max 6 pins constraint
- [ ] Verify mobile responsive design
- [ ] Test modal animations
- [ ] Check accessibility (keyboard navigation)
- [ ] Performance test (loading times)
- [ ] Browser compatibility test
- [ ] Mobile device testing

---

**Last Updated:** October 14, 2025
**Version:** 2.0 - Pin-First Dashboard Implementation
