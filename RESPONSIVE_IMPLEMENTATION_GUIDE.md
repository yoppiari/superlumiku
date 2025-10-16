# Responsive Implementation Guide

Step-by-step guide to implement the Lumiku hybrid responsive design in your React/TypeScript application.

## Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Responsive Layout Structure](#responsive-layout-structure)
3. [Component Implementation](#component-implementation)
4. [Responsive Hooks](#responsive-hooks)
5. [Mobile-Specific Optimizations](#mobile-specific-optimizations)
6. [Performance Optimization](#performance-optimization)
7. [Testing Guidelines](#testing-guidelines)

---

## Setup & Configuration

### 1. Install Dependencies

```bash
npm install --save-dev @types/react @types/react-dom
npm install framer-motion # For smooth animations (optional)
```

### 2. Create Design Tokens

Create `src/styles/tokens.css`:

```css
:root {
  /* Colors */
  --color-white: #ffffff;
  --color-background: #F8F9FA;
  --color-surface: #FFFFFF;
  --color-sidebar: #0F172A;

  --color-text-primary: #1E293B;
  --color-text-secondary: #64748B;
  --color-text-tertiary: #94A3B8;

  --color-accent-primary: #3B82F6;
  --color-accent-hover: #2563EB;
  --color-accent-light: #DBEAFE;

  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  /* Category Colors */
  --color-video: #8B5CF6;
  --color-image: #EC4899;
  --color-audio: #10B981;
  --color-text: #F59E0B;
  --color-ai: #3B82F6;

  /* Borders */
  --color-border-light: #E2E8F0;
  --color-border-medium: #CBD5E1;

  /* Spacing */
  --space-desktop-container: 32px;
  --space-desktop-card: 24px;
  --space-desktop-gap: 24px;

  --space-mobile-container: 16px;
  --space-mobile-card: 16px;
  --space-mobile-gap: 16px;

  /* Layout */
  --sidebar-width: 240px;
  --header-height-desktop: 64px;
  --header-height-mobile: 56px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
  --shadow-md: 0 2px 8px 0 rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 4px 16px 0 rgba(15, 23, 42, 0.10);
  --shadow-xl: 0 8px 24px 0 rgba(15, 23, 42, 0.12);

  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;
}
```

### 3. Configure Tailwind CSS (Optional)

If using Tailwind, extend the config in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        accent: {
          primary: '#3B82F6',
          hover: '#2563EB',
          light: '#DBEAFE',
        },
        // ... other colors
      },
      spacing: {
        'desktop-container': '32px',
        'mobile-container': '16px',
      },
      screens: {
        'mobile': {'max': '767px'},
        'tablet': {'min': '768px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
      },
    },
  },
}
```

---

## Responsive Layout Structure

### 1. Main App Container

Create `src/components/layout/AppContainer.tsx`:

```typescript
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface AppContainerProps {
  children: React.ReactNode;
}

export const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={closeMobileSidebar}
        />
      )}

      {/* App Container */}
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={closeMobileSidebar}
          isMobile={isMobile}
        />

        {/* Main Content */}
        <div className="flex-1 ml-0 lg:ml-[240px] transition-all duration-200">
          <Header
            onMenuClick={toggleMobileSidebar}
            isMobile={isMobile}
          />

          <main className="p-4 lg:p-8 max-w-[1400px] mx-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
};
```

### 2. Responsive Sidebar

Create `src/components/layout/Sidebar.tsx`:

```typescript
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/apps', icon: 'apps', label: 'Apps & Tools' },
  { href: '/projects', icon: 'folder', label: 'Projects' },
  { href: '/mywork', icon: 'work', label: 'My Work' },
  { href: '/credits', icon: 'credits', label: 'Credits' },
  { href: '/settings', icon: 'settings', label: 'Settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile }) => {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen w-[240px] bg-sidebar z-50",
        "flex flex-col",
        "transition-transform duration-200",
        isMobile && !isOpen && "-translate-x-full"
      )}
    >
      {/* Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
        <a href="/" className="flex items-center gap-3 text-white">
          <div className="w-9 h-9 bg-gradient-to-br from-accent-primary to-accent-hover rounded-lg flex items-center justify-center font-bold text-lg">
            L
          </div>
          <span className="text-xl font-semibold">Lumiku</span>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1",
              "text-sm font-medium transition-colors",
              isActive
                ? "bg-accent-primary text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon name={item.icon} className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
          <div className="w-9 h-9 bg-accent-primary rounded-lg flex items-center justify-center text-white font-semibold text-sm">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              John Doe
            </div>
            <div className="text-xs text-white/60 truncate">
              john@example.com
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
```

### 3. Responsive Header

Create `src/components/layout/Header.tsx`:

```typescript
import React, { useState } from 'react';
import { SearchBar } from './SearchBar';
import { CommandPalette } from './CommandPalette';

interface HeaderProps {
  onMenuClick: () => void;
  isMobile: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, isMobile }) => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 h-14 lg:h-16 bg-surface border-b border-border-light px-4 lg:px-8 flex items-center gap-3 lg:gap-6">
        {/* Mobile Menu Toggle */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center w-10 h-10 -ml-2"
            aria-label="Toggle menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        )}

        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <SearchBar
            onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
          />
        </div>

        {/* Credits Badge */}
        <a
          href="/credits"
          className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-background border border-border-light rounded-lg text-sm font-medium hover:bg-surface hover:border-border-medium transition-colors"
        >
          <CreditIcon className="w-4 h-4" />
          <span className="hidden sm:inline">2,450</span>
        </a>
      </header>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
};
```

---

## Component Implementation

### 1. Responsive App Card

Create `src/components/apps/AppCard.tsx`:

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface AppCardProps {
  name: string;
  description: string;
  icon: string;
  category: 'video' | 'image' | 'audio' | 'text' | 'ai';
  badge?: 'beta' | 'new';
  onClick: () => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  name,
  description,
  icon,
  category,
  badge,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full bg-surface border border-border-light rounded-xl",
        "p-4 lg:p-6 text-center",
        "transition-all duration-200",
        "hover:border-border-medium hover:shadow-md hover:-translate-y-1",
        "active:-translate-y-0.5"
      )}
    >
      {/* Badge */}
      {badge && (
        <span
          className={cn(
            "absolute top-2 lg:top-3 right-2 lg:right-3",
            "px-2 py-1 rounded-md text-[9px] lg:text-[10px] font-semibold uppercase tracking-wide",
            badge === 'beta' && "bg-warning/10 text-warning border border-warning/20",
            badge === 'new' && "bg-success/10 text-success border border-success/20"
          )}
        >
          {badge}
        </span>
      )}

      {/* Icon */}
      <div
        className={cn(
          "w-12 h-12 lg:w-16 lg:h-16",
          "mx-auto mb-3 lg:mb-4",
          "rounded-xl flex items-center justify-center",
          "text-2xl lg:text-[32px]",
          "transition-transform duration-150",
          "group-hover:scale-105",
          category === 'video' && "bg-video/10",
          category === 'image' && "bg-image/10",
          category === 'audio' && "bg-audio/10",
          category === 'text' && "bg-text/10",
          category === 'ai' && "bg-ai/10"
        )}
      >
        {icon}
      </div>

      {/* Name */}
      <h3 className="text-sm lg:text-base font-semibold text-text-primary mb-1 lg:mb-2">
        {name}
      </h3>

      {/* Description - Hidden on mobile */}
      <p className="hidden lg:block text-sm text-text-secondary leading-relaxed">
        {description}
      </p>
    </button>
  );
};
```

### 2. Responsive Stats Card

Create `src/components/dashboard/StatCard.tsx`:

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  variant: 'projects' | 'works' | 'folders' | 'time';
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  variant,
}) => {
  return (
    <div
      className={cn(
        "bg-surface border border-border-light rounded-xl",
        "p-4 lg:p-6",
        "transition-all duration-150",
        "hover:border-border-medium hover:shadow-sm hover:-translate-y-0.5"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-10 h-10 lg:w-12 lg:h-12",
          "rounded-lg flex items-center justify-center",
          "mb-3 lg:mb-4",
          "text-xl lg:text-2xl",
          variant === 'projects' && "bg-video/10",
          variant === 'works' && "bg-ai/10",
          variant === 'folders' && "bg-success/10",
          variant === 'time' && "bg-warning/10"
        )}
      >
        {icon}
      </div>

      {/* Value */}
      <div className="text-2xl lg:text-[32px] font-semibold text-text-primary leading-none mb-1">
        {value}
      </div>

      {/* Label */}
      <div className="text-[13px] lg:text-sm text-text-secondary">
        {label}
      </div>
    </div>
  );
};
```

### 3. Responsive App Grid

Create `src/components/apps/AppGrid.tsx`:

```typescript
import React from 'react';
import { AppCard } from './AppCard';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'video' | 'image' | 'audio' | 'text' | 'ai';
  badge?: 'beta' | 'new';
}

interface AppGridProps {
  apps: App[];
  onAppClick: (appId: string) => void;
}

export const AppGrid: React.FC<AppGridProps> = ({ apps, onAppClick }) => {
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {apps.map((app) => (
        <AppCard
          key={app.id}
          name={app.name}
          description={app.description}
          icon={app.icon}
          category={app.category}
          badge={app.badge}
          onClick={() => onAppClick(app.id)}
        />
      ))}
    </div>
  );
};
```

---

## Responsive Hooks

### 1. useMediaQuery Hook

Create `src/hooks/useMediaQuery.ts`:

```typescript
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create listener
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}
```

### 2. useBreakpoint Hook

Create `src/hooks/useBreakpoint.ts`:

```typescript
import { useMediaQuery } from './useMediaQuery';

type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'large-desktop';

export function useBreakpoint(): Breakpoint {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)');

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  if (isDesktop) return 'desktop';
  if (isLargeDesktop) return 'large-desktop';

  return 'desktop'; // Fallback
}
```

### 3. useScrollLock Hook

Create `src/hooks/useScrollLock.ts`:

```typescript
import { useEffect } from 'react';

export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (isLocked) {
      // Save current scroll position
      const scrollY = window.scrollY;

      // Lock scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Unlock scroll
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';

      // Restore scroll position
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    return () => {
      // Cleanup on unmount
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isLocked]);
}
```

---

## Mobile-Specific Optimizations

### 1. Touch Event Handling

```typescript
import React, { useState, useRef, TouchEvent } from 'react';

interface SwipeableProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  children: React.ReactNode;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  onSwipeLeft,
  onSwipeRight,
  children,
}) => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
};
```

### 2. Intersection Observer for Lazy Loading

```typescript
import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
}

export function useIntersectionObserver({
  threshold = 0,
  rootMargin = '0px',
}: UseIntersectionObserverProps = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [threshold, rootMargin]);

  return { targetRef, isIntersecting };
}
```

### 3. Virtual Scrolling for Large Lists

```typescript
import React, { useState, useEffect, useRef } from 'react';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);
  const visibleItems = items.slice(visibleStart, visibleEnd);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${visibleStart * itemHeight}px)` }}>
          {visibleItems.map((item, index) =>
            renderItem(item, visibleStart + index)
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Performance Optimization

### 1. Code Splitting by Route

```typescript
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load route components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Apps = lazy(() => import('./pages/Apps'));
const Projects = lazy(() => import('./pages/Projects'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/apps" element={<Apps />} />
          <Route path="/projects" element={<Projects />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### 2. Image Optimization

```typescript
interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  sizes = '100vw',
  className,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Actual image */}
      <img
        src={src}
        srcSet={`
          ${src.replace('.jpg', '-400.jpg')} 400w,
          ${src.replace('.jpg', '-800.jpg')} 800w,
          ${src.replace('.jpg', '-1200.jpg')} 1200w
        `}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};
```

### 3. Debounce Search Input

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Perform search
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

---

## Testing Guidelines

### 1. Responsive Testing Checklist

Test on the following breakpoints:

- **Small Mobile**: 320px, 360px, 375px
- **Mobile**: 414px, 428px
- **Tablet**: 768px, 834px, 1024px
- **Desktop**: 1280px, 1440px, 1920px

### 2. Device Testing

Physical devices to test:

- **iPhone SE** (375px) - Smallest modern iPhone
- **iPhone 14 Pro** (393px) - Current standard
- **iPad** (768px) - Tablet portrait
- **Desktop** (1440px+) - Standard desktop

### 3. Browser Testing

Test on:

- Chrome (Desktop & Mobile)
- Safari (Desktop & iOS)
- Firefox (Desktop)
- Edge (Desktop)

### 4. Automated Testing

Create visual regression tests using Playwright:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Responsive Layout', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    test(`should display correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard');

      // Take screenshot
      await expect(page).toHaveScreenshot(`dashboard-${viewport.name}.png`);

      // Test interactions
      if (viewport.name === 'mobile') {
        // Test mobile menu
        await page.click('[aria-label="Toggle menu"]');
        await expect(page.locator('.sidebar')).toBeVisible();
      }
    });
  }
});
```

### 5. Accessibility Testing

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

---

## Best Practices Summary

### Do's

1. Use CSS custom properties for theming
2. Implement proper touch targets (44px minimum on mobile)
3. Use semantic HTML elements
4. Optimize images with responsive srcset
5. Lazy load components and images
6. Test on real devices
7. Use proper ARIA labels
8. Implement keyboard navigation
9. Provide loading states
10. Use CSS transforms for animations (GPU-accelerated)

### Don'ts

1. Don't use fixed pixel values for spacing
2. Don't forget to test on small mobile devices (320px)
3. Don't use hover-only interactions on mobile
4. Don't block body scroll without cleanup
5. Don't animate expensive properties (width, height, margin)
6. Don't forget to handle offline states
7. Don't use absolute positioning for responsive layouts
8. Don't ignore accessibility
9. Don't use tiny touch targets
10. Don't forget to test keyboard navigation

---

## Deployment Checklist

Before deploying to production:

- [ ] Test on all major breakpoints
- [ ] Test on real mobile devices
- [ ] Run Lighthouse audit (aim for 90+ on all metrics)
- [ ] Check Core Web Vitals (LCP, FID, CLS)
- [ ] Test with slow 3G network throttling
- [ ] Verify all images are optimized
- [ ] Check bundle size (aim for < 200KB initial)
- [ ] Test keyboard navigation
- [ ] Run accessibility audit
- [ ] Test with screen reader
- [ ] Verify meta tags for mobile (viewport, theme-color)
- [ ] Test pull-to-refresh behavior
- [ ] Verify iOS safe areas are respected
- [ ] Test landscape orientation on mobile

---

## Resources

- [MDN Responsive Design Guide](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://m3.material.io/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Can I Use](https://caniuse.com/) - Browser compatibility
- [Responsive Image Breakpoints Generator](https://www.responsivebreakpoints.com/)

---

This guide provides a complete foundation for implementing responsive design in the Lumiku application. Follow these patterns consistently across all new features and components for a cohesive user experience on all devices.
