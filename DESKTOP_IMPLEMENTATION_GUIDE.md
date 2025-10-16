# Lumiku Desktop Implementation Guide
## Migrating to the New Desktop-Optimized Design

**Target**: Upgrade existing Lumiku dashboard to professional desktop-optimized SaaS design
**Tech Stack**: React + TypeScript + Tailwind CSS
**Timeline**: 2-3 development sprints

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Design Tokens & Base Components](#phase-1-design-tokens--base-components)
3. [Phase 2: Layout Structure](#phase-2-layout-structure)
4. [Phase 3: Dashboard Features](#phase-3-dashboard-features)
5. [Phase 4: Advanced Features](#phase-4-advanced-features)
6. [Phase 5: Polish & Testing](#phase-5-polish--testing)
7. [Migration Strategy](#migration-strategy)
8. [Code Examples](#code-examples)

---

## Overview

### Current State Analysis

**Existing Dashboard** (`C:\Users\yoppi\Downloads\Lumiku App\frontend\src\pages\Dashboard.tsx`):

**Strengths**:
- Already desktop-first
- Good component structure
- TypeScript typed
- API integration working
- Tailwind CSS configured

**Needs Improvement**:
- No sidebar navigation
- Limited app scalability (handles 5-10 apps, needs to scale to 50+)
- Basic search functionality
- No keyboard shortcuts
- Stats cards could be more polished
- Missing command palette (power user feature)

### Target State

**New Dashboard**:
- Sidebar navigation with collapse functionality
- Command palette (Cmd/Ctrl+K) for quick access
- Scalable app grid with category filtering
- Enhanced search with fuzzy matching
- Polished micro-interactions
- Professional SaaS aesthetic
- Handles 50+ apps gracefully

---

## Phase 1: Design Tokens & Base Components

### 1.1 Update Tailwind Config

**File**: `C:\Users\yoppi\Downloads\Lumiku App\frontend\tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Enhanced gray scale
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Primary brand color (adjust to your brand)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        'soft-md': '0 2px 8px 0 rgba(15, 23, 42, 0.08)',
        'soft-lg': '0 4px 16px 0 rgba(15, 23, 42, 0.10)',
        'soft-xl': '0 8px 24px 0 rgba(15, 23, 42, 0.12)',
        'soft-2xl': '0 16px 40px 0 rgba(15, 23, 42, 0.16)',
      },
      letterSpacing: {
        tighter: '-0.02em',
      },
      transitionDuration: {
        '150': '150ms',
      },
    },
  },
  plugins: [],
}
```

### 1.2 Create Design Token CSS File

**File**: `C:\Users\yoppi\Downloads\Lumiku App\frontend\src\styles\tokens.css`

```css
:root {
  /* Layout */
  --sidebar-width: 240px;
  --sidebar-collapsed: 64px;
  --header-height: 64px;
  --max-content-width: 1400px;

  /* Transitions */
  --transition-fast: 0.1s;
  --transition-normal: 0.15s;
  --transition-slow: 0.2s;
  --ease-smooth: cubic-bezier(0.4, 0, 0.6, 1);
}
```

Import in your main CSS file (`index.css`):

```css
@import './tokens.css';
```

### 1.3 Update Base Components

#### Button Component Enhancement

**File**: `C:\Users\yoppi\Downloads\Lumiku App\frontend\src\components\ui\Button.tsx`

```typescript
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-soft hover:-translate-y-0.5 active:translate-y-0',
      secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-soft hover:-translate-y-0.5 active:translate-y-0',
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm h-9',
      md: 'px-6 py-3 text-sm h-11',
      lg: 'px-8 py-4 text-base h-13',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

#### Badge Component

**File**: `C:\Users\yoppi\Downloads\Lumiku App\frontend\src\components\ui\Badge.tsx` (already exists, enhance if needed)

```typescript
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'beta' | 'new' | 'soon'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-700',
      success: 'bg-green-50 text-green-700 border border-green-200',
      warning: 'bg-amber-50 text-amber-700 border border-amber-200',
      error: 'bg-red-50 text-red-700 border border-red-200',
      info: 'bg-blue-50 text-blue-700 border border-blue-200',
      beta: 'bg-amber-50 text-amber-700 border border-amber-200',
      new: 'bg-green-50 text-green-700 border border-green-200',
      soon: 'bg-gray-100 text-gray-600 border border-gray-200',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
```

---

## Phase 2: Layout Structure

### 2.1 Create Sidebar Component

**File**: `C:\Users\yoppi\Downloads\Lumiku App\frontend\src\components\Sidebar.tsx`

```typescript
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutGrid,
  AppWindow,
  FolderKanban,
  FileText,
  Coins,
  Settings,
  HelpCircle,
  ChevronLeft,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { name: 'Apps & Tools', href: '/apps', icon: AppWindow },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'My Work', href: '/my-work', icon: FileText },
  { name: 'Credits', href: '/credits', icon: Coins },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const footerItems: NavItem[] = [
  { name: 'Help Center', href: '/help', icon: HelpCircle },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-150 z-50 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Header */}
      <div className="h-16 border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            L
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-gray-900 tracking-tight">
              Lumiku
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {footerItems.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
```

### 2.2 Create Top Header Component

**File**: `C:\Users\yoppi\Downloads\Lumiku App\frontend\src\components\Header.tsx`

```typescript
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, User, LogOut, CreditCard, Settings } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

interface HeaderProps {
  onSearchClick: () => void
  creditBalance: number
}

export default function Header({ onSearchClick, creditBalance }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="h-full px-6 flex items-center gap-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search apps, projects, or press Ctrl+K..."
            className="w-full h-10 pl-10 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-3 focus:ring-primary-50 transition-all"
            onClick={onSearchClick}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                onSearchClick()
              }
            }}
            readOnly
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-medium text-gray-600 pointer-events-none">
            ⌘K
          </kbd>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white" />
          </button>

          {/* Credits */}
          <button
            onClick={() => navigate('/credits')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100 hover:border-gray-300 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
            </svg>
            <span>{creditBalance.toLocaleString()} Credits</span>
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 px-1.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center text-white text-sm font-semibold">
                {initials}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-soft-xl py-2">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="font-medium text-gray-900">{user?.name || 'User'}</div>
                  <div className="text-sm text-gray-600">{user?.email}</div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate('/profile')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/settings')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/credits')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Buy Credits</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
```

### 2.3 Create Main Layout Component

**File**: `C:\Users\yoppi\Downloads\Lumiku App\frontend\src\components\Layout.tsx`

```typescript
import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import CommandPalette from './CommandPalette'
import { useAuthStore } from '../stores/authStore'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const { user } = useAuthStore()
  const creditBalance = user?.creditBalance || 0

  // Global keyboard shortcut
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 ml-60">
        <Header
          onSearchClick={() => setShowCommandPalette(true)}
          creditBalance={creditBalance}
        />

        <main className="p-8 max-w-[1400px] mx-auto">
          {children}
        </main>
      </div>

      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </div>
  )
}
```

---

## Phase 3: Dashboard Features

### 3.1 Create App Card Component

**File**: `C:\Users\yoppi\Downloads\Lumiku App\frontend\src\components\AppCard.tsx`

```typescript
import { Badge } from './ui/Badge'

interface AppCardProps {
  app: {
    appId: string
    name: string
    description: string
    icon: string
    color: string
    category: string
    beta?: boolean
    new?: boolean
    comingSoon?: boolean
  }
  onClick: (appId: string) => void
}

const iconMap: Record<string, string> = {
  'file-text': '📄',
  'video': '🎬',
  'film': '🎥',
  'layers': '🎨',
  'user-circle': '👤',
  'image': '🖼️',
  'audio': '🎵',
  'text': '✍️',
}

const categoryColors: Record<string, string> = {
  video: 'bg-purple-100 text-purple-700',
  image: 'bg-pink-100 text-pink-700',
  audio: 'bg-teal-100 text-teal-700',
  text: 'bg-amber-100 text-amber-700',
  ai: 'bg-blue-100 text-blue-700',
}

export default function AppCard({ app, onClick }: AppCardProps) {
  const icon = iconMap[app.icon] || '🎯'
  const colorClass = categoryColors[app.category] || 'bg-gray-100 text-gray-700'

  return (
    <div
      onClick={() => !app.comingSoon && onClick(app.appId)}
      className={`relative bg-white border border-gray-200 rounded-xl p-6 text-center transition-all duration-200 ${
        app.comingSoon
          ? 'opacity-60 cursor-not-allowed'
          : 'cursor-pointer hover:border-gray-300 hover:shadow-soft-md hover:-translate-y-0.5 active:translate-y-0'
      }`}
    >
      {/* Badges */}
      {app.beta && (
        <div className="absolute top-3 right-3">
          <Badge variant="beta">Beta</Badge>
        </div>
      )}
      {app.new && (
        <div className="absolute top-3 right-3">
          <Badge variant="new">New</Badge>
        </div>
      )}
      {app.comingSoon && (
        <div className="absolute top-3 right-3">
          <Badge variant="soon">Soon</Badge>
        </div>
      )}

      {/* Icon */}
      <div className={`w-16 h-16 mx-auto mb-4 rounded-xl ${colorClass} flex items-center justify-center text-3xl`}>
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-gray-900 mb-2">{app.name}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{app.description}</p>
    </div>
  )
}
```

### 3.2 Update Dashboard Page

**File**: `C:\Users\yoppi\Downloads\Lumiku App\frontend\src\pages\Dashboard.tsx` (Major refactor)

```typescript
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { creditsService, dashboardService, generationService } from '../services'
import { handleApiError } from '../lib/errorHandler'
import Layout from '../components/Layout'
import AppCard from '../components/AppCard'
import { Button } from '../components/ui/Button'
import {
  Coins,
  Briefcase,
  FolderKanban,
  Clock,
} from 'lucide-react'
import type { GenerationItem } from '../types/generation'

interface AppData {
  appId: string
  name: string
  description: string
  icon: string
  color: string
  category: string
  order: number
  beta: boolean
  new: boolean
  comingSoon: boolean
}

interface DashboardStats {
  totalSpending: number
  totalWorks: number
  totalProjects: number
  lastLogin: string
}

export default function Dashboard() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  // State
  const [apps, setApps] = useState<AppData[]>([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [recentGenerations, setRecentGenerations] = useState<GenerationItem[]>([])
  const [loadingGenerations, setLoadingGenerations] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalSpending: 0,
    totalWorks: 0,
    totalProjects: 0,
    lastLogin: new Date().toISOString(),
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  // Fetch data
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchData = async () => {
      try {
        const [appsData, generationsData, statsData] = await Promise.all([
          dashboardService.getApps(),
          generationService.getRecentGenerations(5),
          dashboardService.getStats(),
        ])

        setApps(appsData.apps || [])
        setRecentGenerations(generationsData.generations || [])
        setStats(statsData)
      } catch (err) {
        handleApiError(err, 'Fetch dashboard data')
      } finally {
        setLoadingApps(false)
        setLoadingGenerations(false)
        setLoadingStats(false)
      }
    }

    fetchData()
  }, [isAuthenticated])

  // Filter apps by category
  const filteredApps = activeCategory === 'all'
    ? apps
    : apps.filter((app) => app.category === activeCategory)

  // Category counts
  const categoryCounts = apps.reduce((acc, app) => {
    acc[app.category] = (acc[app.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const categories = [
    { id: 'all', name: 'All Apps', count: apps.length },
    { id: 'video', name: '🎬 Video', count: categoryCounts.video || 0 },
    { id: 'image', name: '🎨 Image', count: categoryCounts.image || 0 },
    { id: 'audio', name: '🎵 Audio', count: categoryCounts.audio || 0 },
    { id: 'text', name: '📝 Text', count: categoryCounts.text || 0 },
  ]

  const handleAppClick = (appId: string) => {
    navigate(`/apps/${appId}`)
  }

  const formatLastLogin = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  if (!isAuthenticated) return null

  return (
    <Layout>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          icon={Coins}
          value={loadingStats ? '...' : stats.totalSpending.toLocaleString()}
          label="Credits Spent (This Month)"
          iconColor="bg-purple-100 text-purple-700"
        />
        <StatCard
          icon={Briefcase}
          value={loadingStats ? '...' : stats.totalWorks.toString()}
          label="Total Works Generated"
          iconColor="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={FolderKanban}
          value={loadingStats ? '...' : stats.totalProjects.toString()}
          label="Active Projects"
          iconColor="bg-green-100 text-green-700"
        />
        <StatCard
          icon={Clock}
          value={loadingStats ? '...' : formatLastLogin(stats.lastLogin)}
          label="Last Active"
          iconColor="bg-orange-100 text-orange-700"
        />
      </div>

      {/* Apps & Tools Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Apps & Tools</h2>
          <Button variant="secondary" onClick={() => navigate('/apps')}>
            View All
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === category.id
                  ? 'bg-primary-50 border-primary-500 text-primary-700 border'
                  : 'bg-white border-gray-200 text-gray-600 border hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {category.name}
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  activeCategory === category.id
                    ? 'bg-primary-200 text-primary-800'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {category.count}
              </span>
            </button>
          ))}
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loadingApps ? (
            <div className="col-span-full text-center py-12 text-gray-600">
              Loading apps...
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-600">
              No apps in this category yet
            </div>
          ) : (
            filteredApps.map((app) => (
              <AppCard key={app.appId} app={app} onClick={handleAppClick} />
            ))
          )}
        </div>
      </section>

      {/* Recent Work Section */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Recent Work</h2>
          <Button variant="secondary" onClick={() => navigate('/my-work')}>
            View All
          </Button>
        </div>

        {loadingGenerations ? (
          <div className="text-center py-8 text-gray-600">Loading recent work...</div>
        ) : recentGenerations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">No recent work yet</p>
            <p className="text-sm text-gray-500">Start creating with the apps above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentGenerations.map((generation) => (
              <WorkItem key={generation.id} generation={generation} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  )
}

// Helper Components
function StatCard({ icon: Icon, value, label, iconColor }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-soft transition-all">
      <div className={`w-12 h-12 rounded-lg ${iconColor} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-3xl font-semibold text-gray-900 tracking-tight mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

function WorkItem({ generation }: { generation: GenerationItem }) {
  // Implement work item display
  return (
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer">
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0" />

      {/* Info */}
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-gray-900 mb-1">
          {generation.projectName || 'Untitled'}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>{generation.appName}</span>
          <span>•</span>
          <span>{new Date(generation.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Action */}
      <Button variant="secondary" size="sm">
        Download
      </Button>
    </div>
  )
}
```

---

## Phase 4: Advanced Features

### 4.1 Command Palette Component

**File**: `C:\Users\yoppi\Downloads\Lumiku App\frontend\src\components\CommandPalette.tsx`

```typescript
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

interface CommandItem {
  id: string
  name: string
  description: string
  category: string
  icon: string
  action: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Sample commands (in real app, fetch from API)
  const allCommands: CommandItem[] = [
    {
      id: 'video-mixer',
      name: 'Video Mixer',
      description: 'Mix and generate video variations',
      category: 'Apps',
      icon: '🎬',
      action: () => navigate('/apps/video-mixer'),
    },
    {
      id: 'avatar-creator',
      name: 'Avatar Creator',
      description: 'Generate AI avatars',
      category: 'Apps',
      icon: '👤',
      action: () => navigate('/apps/avatar-creator'),
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Go to dashboard',
      category: 'Pages',
      icon: '📊',
      action: () => navigate('/dashboard'),
    },
    // Add more commands...
  ]

  // Filter commands based on query
  const filteredCommands = query
    ? allCommands.filter((cmd) =>
        cmd.name.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands

  // Focus input when opened
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      setQuery('')
      setSelected(0)
    }
  }, [open])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const command = filteredCommands[selected]
        if (command) {
          command.action()
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, selected, filteredCommands, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[999] flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-soft-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative border-b border-gray-200">
          <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for apps, projects, or commands..."
            className="w-full h-14 pl-12 pr-4 text-base focus:outline-none"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(0)
            }}
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No results found</p>
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                key={command.id}
                onClick={() => {
                  command.action()
                  onClose()
                }}
                onMouseEnter={() => setSelected(index)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                  index === selected ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                  {command.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{command.name}</div>
                  <div className="text-sm text-gray-600">{command.description}</div>
                </div>
                <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                  {command.category}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 5: Polish & Testing

### 5.1 Add Loading States

Use skeleton loaders for better UX:

```typescript
// Skeleton components
export function AppCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
      <div className="w-16 h-16 bg-gray-200 rounded-xl mx-auto mb-4" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
      <div className="h-3 bg-gray-200 rounded w-full mb-1" />
      <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto" />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
      <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-32" />
    </div>
  )
}
```

### 5.2 Responsive Adjustments

Add responsive breakpoints to your components:

```typescript
// Example: App grid responsive classes
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {apps.map(...)}
</div>

// Sidebar mobile overlay
<div className="lg:hidden fixed inset-0 bg-gray-900/50 z-40" onClick={closeSidebar} />
```

### 5.3 Accessibility Improvements

- Add ARIA labels to interactive elements
- Ensure keyboard navigation works
- Test with screen readers
- Verify color contrast ratios

```typescript
// Example
<button
  aria-label="Open command palette"
  aria-keyshortcuts="Control+K"
  onClick={openCommandPalette}
>
  <Search className="w-5 h-5" />
</button>
```

---

## Migration Strategy

### Step-by-Step Migration Plan

**Week 1: Foundation**
1. Update Tailwind config
2. Create design token CSS file
3. Update Button and Badge components
4. Test existing pages still work

**Week 2: Layout**
1. Create Sidebar component
2. Create Header component
3. Create Layout wrapper
4. Test navigation flow

**Week 3: Dashboard**
1. Refactor Dashboard page
2. Create AppCard component
3. Add category filtering
4. Test with real API data

**Week 4: Advanced Features**
1. Implement Command Palette
2. Add keyboard shortcuts
3. Polish animations and transitions
4. Final testing and bug fixes

### Rollout Strategy

**Option 1: Big Bang (Not Recommended)**
- Deploy everything at once
- High risk

**Option 2: Phased Rollout (Recommended)**
1. Deploy new layout components first
2. Gradually migrate pages one by one
3. Run A/B test with users
4. Full rollout after validation

**Option 3: Feature Flag**
- Use feature flag to toggle between old/new design
- Safe rollback option
- Gradual user migration

```typescript
// Example feature flag
const NEW_DASHBOARD = import.meta.env.VITE_NEW_DASHBOARD === 'true'

function Dashboard() {
  if (NEW_DASHBOARD) {
    return <NewDashboard />
  }
  return <OldDashboard />
}
```

---

## Testing Checklist

### Functional Testing
- [ ] All navigation links work
- [ ] App cards are clickable
- [ ] Category filtering works
- [ ] Search/command palette opens with Ctrl+K
- [ ] User menu dropdown works
- [ ] Logout functionality works
- [ ] Credit balance displays correctly
- [ ] Stats load and display correctly

### Visual Testing
- [ ] Layout looks good on 1920px desktop
- [ ] Layout looks good on 1440px desktop
- [ ] Layout looks good on 1280px desktop
- [ ] Sidebar collapses properly
- [ ] Hover states work smoothly
- [ ] Animations are smooth (60fps)
- [ ] No layout shift on load

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Alt text on images

### Performance Testing
- [ ] Page loads in < 2 seconds
- [ ] Smooth scrolling
- [ ] No janky animations
- [ ] Images optimized

---

## Troubleshooting

### Common Issues

**Issue: Sidebar overlaps content**
- Solution: Check `ml-60` class on main content
- Ensure sidebar has `fixed` position

**Issue: Command palette doesn't open**
- Solution: Check keyboard event listener
- Verify z-index is high enough (999+)

**Issue: Tailwind classes not working**
- Solution: Run `npm run build` to regenerate CSS
- Check content paths in `tailwind.config.js`

**Issue: Icons not showing**
- Solution: Install lucide-react: `npm install lucide-react`
- Import icons properly

---

## Performance Optimization

### Code Splitting

```typescript
// Lazy load heavy components
const CommandPalette = lazy(() => import('./components/CommandPalette'))

// Use Suspense
<Suspense fallback={<LoadingSpinner />}>
  <CommandPalette />
</Suspense>
```

### Image Optimization

```typescript
// Use next-gen formats
<img
  src="/images/avatar.webp"
  alt="Avatar"
  loading="lazy"
  decoding="async"
/>
```

### Memoization

```typescript
// Memoize expensive computations
const filteredApps = useMemo(() => {
  return apps.filter(app => app.category === activeCategory)
}, [apps, activeCategory])

// Memoize components
const AppCard = memo(({ app, onClick }: AppCardProps) => {
  // ...
})
```

---

## Next Steps

After completing this implementation:

1. **User Testing**: Get feedback from 5-10 users
2. **Analytics**: Track engagement metrics
3. **Iteration**: Refine based on data
4. **Documentation**: Update user guides
5. **Onboarding**: Create tooltips for new features

---

## Support

For questions or issues:
- Internal Wiki: [Link]
- Slack Channel: #lumiku-redesign
- Design Team: design@lumiku.com

---

**Good luck with the implementation!** 🚀
