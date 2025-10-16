# Lumiku 2025 Design Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the new 2025 mobile-first design for the Lumiku application. The redesign focuses on modern visual language, improved scalability, and exceptional mobile UX.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Migration Strategy](#migration-strategy)
3. [Component Implementation](#component-implementation)
4. [Layout System](#layout-system)
5. [Dark Mode](#dark-mode)
6. [Animations & Transitions](#animations--transitions)
7. [Responsive Breakpoints](#responsive-breakpoints)
8. [Performance Optimization](#performance-optimization)
9. [Accessibility](#accessibility)
10. [Testing Checklist](#testing-checklist)

---

## Quick Start

### 1. Review Documentation

Before starting implementation:
- Read `MOBILE_DESIGN_TRENDS_2025_RESEARCH.md` (understand the why)
- Study `DESIGN_SYSTEM_2025_UPDATED.md` (know the specifications)
- Test `lumiku-mobile-first-2025.html` (see it in action)

### 2. Install Dependencies

No new dependencies required! The design uses:
- Existing React + TypeScript stack
- Existing Tailwind CSS
- Existing Lucide React icons

### 3. Preview the Prototype

Open `lumiku-mobile-first-2025.html` in your browser:
```bash
# Using Python
python -m http.server 8000

# Using Node
npx serve

# Then open: http://localhost:8000/lumiku-mobile-first-2025.html
```

Test on:
- Mobile (375px - iPhone SE)
- Tablet (768px - iPad)
- Desktop (1440px - MacBook)

---

## Migration Strategy

### Phase 1: Foundation (Week 1)

**Goal**: Set up design tokens and base styles without breaking existing functionality

#### Step 1.1: Create Design Tokens File

Create `frontend/src/styles/design-tokens.css`:

```css
:root {
  /* Colors - Light Mode */
  --color-background: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-text-primary: #0A0A0A;
  --color-text-secondary: #525252;
  --color-text-tertiary: #A3A3A3;
  --color-border: rgba(0, 0, 0, 0.08);
  --color-border-strong: rgba(0, 0, 0, 0.12);

  /* Primary Color */
  --color-primary-500: #6366F1;
  --color-primary-600: #4F46E5;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;

  /* Typography */
  --font-size-h1: 24px;
  --font-size-h2: 20px;
  --font-size-body: 15px;
  --font-size-body-sm: 14px;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08);

  /* Animation */
  --duration-normal: 200ms;
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark Mode */
[data-theme="dark"] {
  --color-background: #0A0A0A;
  --color-surface: #171717;
  --color-text-primary: #FAFAFA;
  --color-text-secondary: #A3A3A3;
  --color-text-tertiary: #525252;
  --color-border: rgba(255, 255, 255, 0.1);
  --color-border-strong: rgba(255, 255, 255, 0.15);
  --color-primary-500: #818CF8;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-background: #0A0A0A;
    --color-surface: #171717;
    --color-text-primary: #FAFAFA;
    --color-text-secondary: #A3A3A3;
    --color-border: rgba(255, 255, 255, 0.1);
  }
}
```

#### Step 1.2: Import Design Tokens

Update `frontend/src/index.css`:

```css
@import './styles/design-tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--color-background);
  color: var(--color-text-primary);
  transition: background 200ms ease, color 200ms ease;
}
```

#### Step 1.3: Update Tailwind Config

Update `frontend/tailwind.config.js`:

```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#6366F1',
          600: '#4F46E5',
        },
        background: '#FAFAFA',
        surface: '#FFFFFF',
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
        'md': '0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
```

#### Step 1.4: Test Foundation

- Verify existing pages still work
- Check no visual regressions
- Ensure colors and spacing are consistent

---

### Phase 2: Component Updates (Week 2)

**Goal**: Update existing components to match new design system

#### Step 2.1: Update Button Component

Update `frontend/src/components/ui/Button.tsx`:

```typescript
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 active:scale-[0.98]';

  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md',
    secondary: 'bg-surface border border-border text-text-primary hover:bg-background hover:border-border-strong',
    ghost: 'bg-transparent text-text-secondary hover:bg-background hover:text-text-primary',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

#### Step 2.2: Update Card Component

Update `frontend/src/components/ui/Card.tsx`:

```typescript
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  const baseStyles = 'bg-surface border border-border rounded-lg p-5 transition-all duration-200';
  const hoverStyles = hoverable ? 'hover:border-primary-500 hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
```

#### Step 2.3: Create AppCard Component

Create `frontend/src/components/ui/AppCard.tsx`:

```typescript
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AppCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  badge?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  name,
  description,
  icon: Icon,
  color,
  badge,
  disabled = false,
  onClick,
}) => {
  return (
    <div
      className={`
        relative bg-surface border border-border rounded-lg p-5
        flex flex-col items-center text-center
        transition-all duration-200
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary-500 hover:shadow-md hover:-translate-y-0.5'}
      `}
      onClick={disabled ? undefined : onClick}
    >
      {badge && (
        <span className="absolute top-3 right-3 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
          {badge}
        </span>
      )}

      <div
        className="w-14 h-14 rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <Icon size={28} strokeWidth={2} />
      </div>

      <h3 className="text-base font-semibold text-text-primary mb-2">
        {name}
      </h3>

      <p className="text-sm text-text-secondary leading-relaxed hidden md:block">
        {description}
      </p>
    </div>
  );
};
```

#### Step 2.4: Create SearchBar Component

Create `frontend/src/components/ui/SearchBar.tsx`:

```typescript
import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
}) => {
  return (
    <div className="relative w-full">
      <Search
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full pl-11 pr-4 py-3
          bg-surface border border-border rounded-lg
          text-base text-text-primary placeholder:text-text-tertiary
          outline-none transition-all duration-200
          focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]
        "
      />
    </div>
  );
};
```

---

### Phase 3: Layout Updates (Week 2-3)

**Goal**: Implement new dashboard layout with mobile-first approach

#### Step 3.1: Create BottomNavigation Component

Create `frontend/src/components/BottomNavigation.tsx`:

```typescript
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Briefcase, User, Plus } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'explore', label: 'Explore', icon: Compass, path: '/explore' },
    { id: 'create', label: 'Create', icon: Plus, path: '/create', isFab: true },
    { id: 'mywork', label: 'My Work', icon: Briefcase, path: '/my-work' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 h-16 z-50
      bg-white/80 dark:bg-surface/80 backdrop-blur-xl
      border-t border-border
      flex items-center justify-around
      pb-[env(safe-area-inset-bottom)]
      md:hidden
    ">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);

        if (item.isFab) {
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="
                w-14 h-14 -mt-8
                bg-primary-500 rounded-full
                flex items-center justify-center
                text-white shadow-lg
                transition-all duration-200
                hover:bg-primary-600 hover:scale-105
                active:scale-95
                border-4 border-background
              "
              aria-label={item.label}
            >
              <Icon size={24} strokeWidth={2} />
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`
              flex flex-col items-center gap-1 px-4 py-2
              transition-colors duration-200
              ${active ? 'text-primary-500' : 'text-text-tertiary'}
            `}
            aria-label={item.label}
          >
            <Icon size={24} strokeWidth={2} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
```

#### Step 3.2: Update Dashboard Page

Update `frontend/src/pages/Dashboard.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Coins, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { creditsService, dashboardService } from '../services';
import { AppCard } from '../components/ui/AppCard';
import { SearchBar } from '../components/ui/SearchBar';
import { BottomNavigation } from '../components/BottomNavigation';
import { appsList } from '../data/apps'; // You'll need to create this

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [creditBalance, setCreditBalance] = useState(user?.creditBalance || 0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Fetch credit balance
    creditsService.getBalance().then(data => {
      setCreditBalance(data.balance);
    });

    // Check system theme preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, [isAuthenticated, navigate]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const categories = [
    { id: 'all', label: 'All Apps' },
    { id: 'image', label: 'Image Tools' },
    { id: 'video', label: 'Video Tools' },
    { id: 'avatar', label: 'Avatar Tools' },
    { id: 'text', label: 'Text Tools' },
    { id: 'utility', label: 'Utilities' },
  ];

  const filteredApps = appsList.filter(app => {
    const matchesCategory = activeCategory === 'all' || app.category === activeCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredApps = appsList.filter(app => app.featured);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-text-secondary">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2">
              <Coins size={18} className="text-primary-500" />
              <span className="font-medium">{creditBalance.toLocaleString()}</span>
            </div>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center border border-border rounded-lg hover:bg-background transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 py-5 space-y-8">
        {/* Search */}
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search apps and tools..."
        />

        {/* Featured Apps */}
        {!searchTerm && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Featured</h2>
              <button className="text-sm text-primary-500 font-medium">View All</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4">
              {featuredApps.map(app => (
                <div key={app.id} className="flex-none w-[280px] snap-start">
                  <AppCard {...app} onClick={() => navigate(`/apps/${app.id}`)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex-none px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-200 whitespace-nowrap
                ${activeCategory === cat.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface border border-border text-text-secondary hover:bg-background'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Apps Grid */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredApps.map(app => (
              <AppCard
                key={app.id}
                {...app}
                onClick={() => navigate(`/apps/${app.id}`)}
              />
            ))}
          </div>

          {filteredApps.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-secondary">No apps found</p>
            </div>
          )}
        </section>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNavigation />
    </div>
  );
}
```

#### Step 3.3: Create Apps Data File

Create `frontend/src/data/apps.ts`:

```typescript
import {
  User, Activity, Film, Image, Layers, Type, Mic,
  Scissors, Palette, Video, Repeat, Layout, Droplet,
  Smartphone, Zap, LucideIcon
} from 'lucide-react';

export interface App {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: 'image' | 'video' | 'avatar' | 'text' | 'audio' | 'utility';
  color: string;
  featured?: boolean;
  badge?: string;
  disabled?: boolean;
}

export const appsList: App[] = [
  {
    id: 'avatar-creator',
    name: 'Avatar Creator',
    description: 'Create stunning AI-powered avatars from photos',
    icon: User,
    category: 'avatar',
    color: '#3B82F6',
    featured: true,
    badge: 'Popular',
  },
  {
    id: 'pose-generator',
    name: 'Pose Generator',
    description: 'Generate realistic human poses for your projects',
    icon: Activity,
    category: 'avatar',
    color: '#8B5CF6',
    featured: true,
    badge: 'New',
  },
  // Add more apps...
];
```

---

### Phase 4: Dark Mode Implementation

#### Step 4.1: Create Theme Context

Create `frontend/src/contexts/ThemeContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') as Theme | null;

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

#### Step 4.2: Wrap App with ThemeProvider

Update `frontend/src/main.tsx`:

```typescript
import { ThemeProvider } from './contexts/ThemeContext';

// ...

<ThemeProvider>
  <App />
</ThemeProvider>
```

---

### Phase 5: Animations & Polish (Week 3)

#### Step 5.1: Add Framer Motion (Optional)

```bash
npm install framer-motion
```

#### Step 5.2: Create Animated Card

```typescript
import { motion } from 'framer-motion';

export const AnimatedAppCard = ({ children, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    whileHover={{ scale: 1.02, y: -4 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);
```

#### Step 5.3: Add Page Transitions

```typescript
import { motion, AnimatePresence } from 'framer-motion';

export const PageTransition = ({ children }) => (
  <AnimatePresence mode="wait">
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);
```

---

## Performance Optimization

### 1. Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

const AvatarCreator = lazy(() => import('./apps/AvatarCreator'));

<Suspense fallback={<LoadingSpinner />}>
  <AvatarCreator />
</Suspense>
```

### 2. Virtual Scrolling (for 50+ apps)

```bash
npm install react-window
```

```typescript
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={2}
  columnWidth={180}
  height={600}
  rowCount={Math.ceil(apps.length / 2)}
  rowHeight={200}
  width={400}
>
  {({ columnIndex, rowIndex, style }) => (
    <div style={style}>
      <AppCard {...apps[rowIndex * 2 + columnIndex]} />
    </div>
  )}
</FixedSizeGrid>
```

### 3. Image Optimization

```typescript
// Use next-gen formats with fallback
<picture>
  <source srcSet="/image.webp" type="image/webp" />
  <source srcSet="/image.jpg" type="image/jpeg" />
  <img src="/image.jpg" alt="..." loading="lazy" />
</picture>
```

### 4. Skeleton Loading

```typescript
export const SkeletonCard = () => (
  <div className="bg-surface border border-border rounded-lg p-5 animate-pulse">
    <div className="w-14 h-14 bg-background rounded-lg mb-3"></div>
    <div className="h-4 bg-background rounded mb-2"></div>
    <div className="h-3 bg-background rounded w-2/3"></div>
  </div>
);
```

---

## Accessibility

### 1. Keyboard Navigation

```typescript
// Ensure all interactive elements are keyboard accessible
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</button>
```

### 2. Screen Reader Support

```typescript
<button aria-label="Toggle theme">
  <Moon />
</button>

<nav aria-label="Main navigation">
  {/* nav items */}
</nav>
```

### 3. Focus Indicators

```css
.interactive:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### 4. Color Contrast

Ensure all text meets WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum

---

## Testing Checklist

### Visual Testing

- [ ] Test on iPhone SE (375px width)
- [ ] Test on iPad (768px width)
- [ ] Test on Desktop (1440px width)
- [ ] Test light mode
- [ ] Test dark mode
- [ ] Test with long app names
- [ ] Test with 10, 50, 100+ apps
- [ ] Test empty states
- [ ] Test loading states

### Functional Testing

- [ ] Search works and filters correctly
- [ ] Category filters work
- [ ] Bottom navigation navigates correctly
- [ ] FAB button works
- [ ] Theme toggle persists
- [ ] Credit balance updates
- [ ] App cards are clickable
- [ ] Hover states work on desktop
- [ ] Touch feedback works on mobile

### Performance Testing

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No layout shifts (CLS < 0.1)
- [ ] Smooth scrolling (60fps)
- [ ] No jank during animations

### Accessibility Testing

- [ ] All interactive elements keyboard accessible
- [ ] Screen reader announces correctly
- [ ] Color contrast passes WCAG AA
- [ ] Focus indicators visible
- [ ] Skip navigation link present
- [ ] ARIA labels present

### Browser Testing

- [ ] Chrome (latest)
- [ ] Safari (iOS and macOS)
- [ ] Firefox (latest)
- [ ] Edge (latest)

---

## Troubleshooting

### Issue: Tailwind classes not working

**Solution**: Ensure `design-tokens.css` is imported before Tailwind directives:

```css
@import './styles/design-tokens.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Issue: Dark mode not switching

**Solution**: Check that `data-theme` attribute is set on `<html>` element:

```typescript
document.documentElement.setAttribute('data-theme', theme);
```

### Issue: Bottom nav overlapping content

**Solution**: Add padding-bottom to body:

```css
body {
  padding-bottom: 80px; /* Height of bottom nav + safe area */
}

@media (min-width: 768px) {
  body {
    padding-bottom: 0; /* Remove on desktop */
  }
}
```

### Issue: Animations causing performance issues

**Solution**: Use CSS `will-change` property and GPU-accelerated properties:

```css
.animated-card {
  will-change: transform;
  transform: translateZ(0); /* Force GPU acceleration */
}
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] Performance metrics meet targets
- [ ] Accessibility audit complete
- [ ] Browser testing complete
- [ ] Mobile testing complete
- [ ] Design tokens documented
- [ ] Component library documented
- [ ] Error boundaries implemented
- [ ] Analytics events added
- [ ] SEO meta tags added

---

## Support & Resources

### Internal Resources
- Design System: `DESIGN_SYSTEM_2025_UPDATED.md`
- Research: `MOBILE_DESIGN_TRENDS_2025_RESEARCH.md`
- Prototype: `lumiku-mobile-first-2025.html`

### External Resources
- Tailwind CSS: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev
- Framer Motion: https://www.framer.com/motion/
- React Window: https://react-window.vercel.app

### Design Inspiration
- Linear: https://linear.app
- Notion: https://notion.so
- Vercel: https://vercel.com
- Figma: https://figma.com

---

## Maintenance

### Regular Tasks

**Weekly**:
- Check for visual regressions
- Review performance metrics
- Update dependency versions

**Monthly**:
- Accessibility audit
- Design system review
- User feedback analysis

**Quarterly**:
- Major design review
- Competitor analysis
- Trend evaluation

---

## Conclusion

This implementation guide provides a structured approach to migrating Lumiku to the 2025 mobile-first design. Follow the phases sequentially to minimize risk and ensure a smooth transition.

**Key Success Factors**:
1. Test early and often
2. Prioritize mobile experience
3. Maintain performance standards
4. Ensure accessibility compliance
5. Gather user feedback

**Timeline Summary**:
- Week 1: Foundation (design tokens, base styles)
- Week 2: Components (buttons, cards, navigation)
- Week 3: Layout (dashboard, responsive)
- Week 4: Polish (animations, optimization)

**Next Steps**:
1. Review this guide with the team
2. Set up development environment
3. Begin Phase 1 implementation
4. Schedule regular check-ins
5. Gather user feedback throughout

Good luck with the implementation! The new design will make Lumiku feel modern, premium, and delightful to use in 2025 and beyond.
