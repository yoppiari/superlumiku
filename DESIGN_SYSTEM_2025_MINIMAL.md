# Lumiku 2025 Minimalist Design System

## Overview

This document outlines the complete design system for Lumiku's minimalist 2025 redesign. The focus is on **clarity, scalability, and timeless aesthetics** that prioritize function over decoration.

---

## Core Design Principles

### 1. Generous Whitespace
- Breathing room between all elements
- Minimum 24px spacing between major sections
- 12-16px spacing within components
- No cramped layouts or cluttered interfaces

### 2. Monochromatic Foundation
- Primary colors: Black (#000), White (#FFF), and grays
- Minimal color accents (only for CTAs and active states)
- No decorative gradients or colorful backgrounds
- Focus on contrast and hierarchy through typography

### 3. Typography-First Hierarchy
- Large, bold headings (32-48px) with tight letter spacing
- Medium body text (14-16px) in gray-600
- Small labels (12-14px) for metadata
- Clear visual hierarchy through size, weight, and color

### 4. Subtle Interactions
- Fast transitions (150ms)
- Minimal hover effects (opacity, slight lift)
- No distracting animations or effects
- Focus on responsiveness and feedback

### 5. Scalable Architecture
- Grid-based layouts that adapt to content
- Components designed for dozens (or hundreds) of items
- Efficient use of space without sacrificing readability
- Progressive disclosure for complex features

---

## Color Palette

### Primary Colors
```css
--color-black: #000000;       /* Primary text, borders on hover */
--color-white: #FFFFFF;       /* Backgrounds, cards */
```

### Gray Scale
```css
--color-gray-50:  #F9FAFB;    /* Hover backgrounds, subtle fills */
--color-gray-100: #F3F4F6;    /* Icon backgrounds, disabled states */
--color-gray-200: #E5E7EB;    /* Borders, dividers */
--color-gray-400: #9CA3AF;    /* Placeholder text, secondary info */
--color-gray-500: #6B7280;    /* Labels, metadata */
--color-gray-600: #4B5563;    /* Body text */
--color-gray-700: #374151;    /* Icons, secondary text */
--color-gray-900: #111827;    /* Headings, primary text */
```

### Accent Colors (Minimal Use)
```css
--color-blue-600: #3B82F6;    /* CTAs, links, active states */
--color-green-50: #F0FDF4;    /* Success background */
--color-green-700: #15803D;   /* Success text */
--color-yellow-50: #FEFCE8;   /* Warning background */
--color-yellow-700: #A16207;  /* Warning text */
--color-red-50: #FEF2F2;      /* Error background */
--color-red-700: #B91C1C;     /* Error text */
```

### Usage Guidelines
- **Primary actions**: Use black backgrounds with white text
- **Secondary actions**: Use gray-200 borders with gray-700 text
- **Destructive actions**: Use red-700 text only (no backgrounds)
- **Success states**: Use green-50 background with green-700 text
- **Borders**: Default to gray-200, hover to black for emphasis
- **Backgrounds**: White for cards, #FAFAFA for page background

---

## Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```

**Why Inter?**
- Clean, modern, professional
- Excellent readability at all sizes
- Wide character set and language support
- Free and open-source
- System font fallbacks ensure fast loading

### Type Scale

#### Display (Page Titles)
```css
font-size: 36-48px;
font-weight: 600 (Semibold);
letter-spacing: -0.03em;
line-height: 1.2;
color: gray-900;
```

#### Heading 2 (Section Titles)
```css
font-size: 24-32px;
font-weight: 600 (Semibold);
letter-spacing: -0.03em;
line-height: 1.3;
color: gray-900;
```

#### Heading 3 (Card Titles)
```css
font-size: 14-16px;
font-weight: 500 (Medium);
letter-spacing: -0.01em;
line-height: 1.4;
color: gray-900;
```

#### Body Text
```css
font-size: 14-16px;
font-weight: 400 (Regular);
letter-spacing: 0;
line-height: 1.6;
color: gray-600;
```

#### Small Text (Metadata, Labels)
```css
font-size: 12-14px;
font-weight: 400 (Regular);
letter-spacing: 0;
line-height: 1.5;
color: gray-500;
```

#### Button Text
```css
font-size: 14px;
font-weight: 500 (Medium);
letter-spacing: 0;
line-height: 1;
```

### Usage Guidelines
- **Never use decorative fonts** - stick to Inter for everything
- **Use size and weight** to create hierarchy, not color
- **Negative letter spacing** (-0.03em) for large headings only
- **Tight line-height** (1.2-1.4) for headings
- **Comfortable line-height** (1.6) for body text

---

## Spacing System

### Spacing Scale
```css
--space-1:  4px;   /* Tiny gaps, badge padding */
--space-2:  8px;   /* Small gaps between related items */
--space-3:  12px;  /* Default gap within components */
--space-4:  16px;  /* Gap between components */
--space-5:  20px;  /* Medium section spacing */
--space-6:  24px;  /* Large section spacing */
--space-8:  32px;  /* Extra large section spacing */
--space-10: 40px;  /* Section breaks */
--space-12: 48px;  /* Major section breaks */
--space-16: 64px;  /* Page section breaks */
```

### Application
- **Component padding**: 16-24px (space-4 to space-6)
- **Card gaps in grid**: 16px (space-4)
- **Section spacing**: 48-64px (space-12 to space-16)
- **Between related items**: 8-12px (space-2 to space-3)
- **Within groups**: 4-8px (space-1 to space-2)

---

## Components

### 1. App Card (Grid View)

**Dimensions:**
- Min width: 160px (mobile)
- Max width: 200px (desktop)
- Aspect ratio: ~1:1.2 (portrait)
- Padding: 20px

**Structure:**
```html
<div class="app-card">
  <div class="icon"><!-- 40x40px gray-100 background --></div>
  <h3>App Name</h3>
  <p>Short description</p>
  <span class="badge">Beta/Soon</span> <!-- Optional -->
</div>
```

**States:**
- **Default**: White background, gray-200 border
- **Hover**: Lift 2px, border becomes black, subtle shadow
- **Disabled**: 50% opacity, no hover effect

**Visual Style:**
- Border: 1px solid gray-200
- Border radius: 12px
- Icon size: 40x40px with gray-100 background
- Badge position: Absolute top-right

### 2. App Card (List View)

**Structure:**
```html
<div class="app-card-list">
  <div class="icon"><!-- 40x40px --></div>
  <div class="info">
    <h3>App Name</h3>
    <p>Category</p>
  </div>
  <button>Open</button>
</div>
```

**States:**
- **Default**: White background, gray-200 border
- **Hover**: Gray-50 background, border becomes black

**Visual Style:**
- Border: 1px solid gray-200
- Border radius: 12px
- Padding: 16px
- Flex layout with gap: 16px

### 3. Navigation Item

**Structure:**
```html
<a href="#" class="nav-item">
  <svg class="icon">...</svg>
  <span>Dashboard</span>
</a>
```

**States:**
- **Default**: Transparent, gray-600 text
- **Hover**: Gray-50 background
- **Active**: Black background, white text

**Visual Style:**
- Border radius: 8px
- Padding: 12px 16px
- Icon size: 20x20px
- Gap: 12px between icon and text

### 4. Button

#### Primary Button
```html
<button class="btn-primary">Action</button>
```
- Background: Black
- Text: White
- Border: None
- Padding: 10px 16px
- Border radius: 8px
- Hover: Slight opacity (0.9)

#### Secondary Button
```html
<button class="btn-secondary">Action</button>
```
- Background: Transparent
- Text: Gray-700
- Border: 1px solid gray-200
- Padding: 10px 16px
- Border radius: 8px
- Hover: Gray-50 background

### 5. Input Field

```html
<input type="text" class="input" placeholder="Search...">
```

**Visual Style:**
- Border: 1px solid gray-200
- Border radius: 8px
- Padding: 10px 16px
- Font size: 14px
- Focus: Border becomes black (no blue outline)

### 6. Badge

```html
<span class="badge">Beta</span>
<span class="badge badge-gray">Coming Soon</span>
```

**Visual Style:**
- Font size: 10px
- Font weight: 500
- Text transform: Uppercase
- Letter spacing: 0.05em
- Padding: 4px 8px
- Border radius: 4px

**Variants:**
- **Beta**: Black background, white text
- **Coming Soon**: Gray-200 background, gray-600 text
- **Success**: Green-50 background, green-700 text
- **Warning**: Yellow-50 background, yellow-700 text

### 7. Stats Display (Horizontal)

```html
<div class="stat">
  <div class="stat-label">Total Spending</div>
  <div class="stat-value">1,240 <span>credits</span></div>
</div>
```

**Visual Style:**
- Label: 14px, gray-500
- Value: 32px, gray-900, semibold
- Suffix: 16px, gray-400, regular
- No background, no borders
- Gap: 4px between label and value

---

## Layout Architecture

### Grid System

#### Desktop (1024px+)
- **Sidebar**: Fixed 224px (14rem)
- **Main content**: Remaining space with max-width 1600px
- **Content padding**: 48px horizontal
- **App grid**: 4-5 columns

#### Tablet (768-1023px)
- **No sidebar** (hamburger menu)
- **Main content**: Full width with max-width 1200px
- **Content padding**: 32px horizontal
- **App grid**: 3 columns

#### Mobile (< 768px)
- **No sidebar** (hamburger menu)
- **Main content**: Full width
- **Content padding**: 24px horizontal
- **App grid**: 2 columns

### Section Structure

```
Header (sticky)
  ├── Logo / Menu Button
  ├── Search Bar (desktop only)
  └── Actions (credits, profile)

Main Content
  ├── Page Title (48px bottom margin)
  ├── Stats Bar (64px bottom margin)
  ├── Apps Section (64px bottom margin)
  │   ├── Section Header
  │   ├── Category Tabs
  │   ├── Search & View Toggle
  │   ├── Apps Grid/List
  │   └── Pagination
  └── Recent Activity
```

---

## Interactions & Animations

### Transition Speeds
- **Fast**: 150ms - Hover states, toggles
- **Medium**: 200ms - Menu slides, overlays
- **Slow**: 300ms - Page transitions (avoid if possible)

### Easing
```css
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
```
- Smooth, natural feel
- Not too bouncy or elastic
- Consistent across all interactions

### Hover Effects

#### Cards
```css
transform: translateY(-2px);
border-color: #000;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
```

#### Buttons
```css
background: #F3F4F6; /* For secondary */
opacity: 0.9; /* For primary */
```

#### Navigation Items
```css
background: #F3F4F6;
```

### Focus States
- **Keyboard focus**: 2px solid black outline with 2px offset
- **No blue outlines** - always use black
- **Visible and clear** for accessibility

---

## Accessibility Guidelines

### Color Contrast
- **Body text (gray-600) on white**: 7:1 ratio (AAA)
- **Headings (gray-900) on white**: 16:1 ratio (AAA)
- **Small text minimum**: 4.5:1 ratio (AA)

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Clear focus states with visible outlines
- Logical tab order (top to bottom, left to right)

### Screen Readers
- Proper semantic HTML (nav, main, section, article)
- Alt text for all icons that convey meaning
- ARIA labels for icon-only buttons
- Skip navigation links for long pages

### Motion
- Respect `prefers-reduced-motion` media query
- Disable animations for users who prefer reduced motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Scalability Features

### Handling Many Apps (50+)

1. **Category Filtering**
   - Tabs for major categories (Video, Image, Audio, Design, AI)
   - Updates URL for bookmarkable filtered views
   - Shows count per category

2. **Search Functionality**
   - Live search with instant filtering
   - Searches both app names and descriptions
   - Highlights matching results
   - Shows "no results" state

3. **View Toggle**
   - **Grid view**: Visual browsing (default)
   - **List view**: Dense, scannable list for power users
   - Preference saved to localStorage

4. **Pagination**
   - Show 30 apps per page (default)
   - Numbered pagination with ellipsis (1, 2, 3, ..., 10)
   - Next/Previous buttons
   - Shows "X of Y apps" counter

5. **Lazy Loading** (Future)
   - Load apps as user scrolls
   - Improves initial page load time
   - Seamless infinite scroll option

6. **Sorting Options** (Future)
   - Most used
   - Recently added
   - Alphabetical
   - Category

---

## Responsive Behavior

### Header
- **Desktop**: Logo, search bar, credits, profile
- **Tablet**: Hamburger, logo, search (smaller), profile
- **Mobile**: Hamburger, logo, profile only

### Stats Bar
- **Desktop**: Horizontal scroll with all stats visible
- **Tablet**: 2x2 grid
- **Mobile**: Vertical stack or horizontal scroll

### App Grid
- **Desktop**: 4-5 columns (depending on screen size)
- **Tablet**: 3 columns
- **Mobile**: 2 columns

### Sidebar
- **Desktop**: Fixed sidebar (224px)
- **Tablet/Mobile**: Slide-in overlay menu

---

## Implementation Notes

### CSS Architecture

Use Tailwind CSS for rapid development with custom configuration:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.03em',
      },
    },
  },
}
```

### Performance Optimization

1. **Lazy load images** for app icons
2. **Virtual scrolling** for very long lists (100+ apps)
3. **Debounce search** input (300ms delay)
4. **Cache API responses** for faster navigation
5. **Preload critical fonts** (Inter)
6. **Minimize JavaScript** - prefer CSS for interactions

### Testing Checklist

- [ ] Test with 10, 50, 100+ apps
- [ ] Test all category filters
- [ ] Test search with various queries
- [ ] Test grid vs list view
- [ ] Test pagination
- [ ] Test on mobile, tablet, desktop
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Test in low bandwidth conditions
- [ ] Test with animations disabled

---

## Migration Strategy

### Phase 1: Core Redesign (Week 1-2)
1. Update color palette and CSS variables
2. Redesign header and navigation
3. Implement new stats bar
4. Update app card design

### Phase 2: Scalability (Week 3)
1. Add category filtering
2. Implement search functionality
3. Add grid/list view toggle
4. Implement pagination

### Phase 3: Polish (Week 4)
1. Add micro-interactions
2. Optimize performance
3. Test accessibility
4. Refine responsive behavior

### Phase 4: Launch (Week 5)
1. User testing
2. Gather feedback
3. Fix bugs
4. Deploy to production

---

## Design Files

### HTML Mockup
- **File**: `design-mockup-2025-minimal.html`
- **Purpose**: Complete working prototype
- **Features**: All components, interactions, responsive design
- **Usage**: Open in browser to test and review

### Figma Prototype (Future)
- Complete design system
- Component library
- Responsive layouts
- Interactive prototype

---

## Conclusion

This design system prioritizes:
- ✅ Clarity and readability
- ✅ Scalability for dozens/hundreds of apps
- ✅ Performance and accessibility
- ✅ Timeless, professional aesthetic
- ✅ Fast development with Tailwind CSS

The result is a clean, modern interface that feels premium yet understated, efficient yet delightful. It's designed to scale with Lumiku's growth while maintaining visual consistency and usability.

---

**Last Updated**: 2025-10-14
**Version**: 1.0
**Status**: Ready for Implementation