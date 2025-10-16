# Lumiku 2025 Design - Quick Reference

## 🎯 One-Page Cheat Sheet

### Core Philosophy
**Refined Minimalism**: Clean interfaces with purposeful details. Not flat, not busy—just right.

---

## 🎨 Colors

### Light Mode
```css
Background: #FAFAFA
Surface:    #FFFFFF
Primary:    #6366F1 (Indigo)
Text:       #0A0A0A / #525252 / #A3A3A3
Border:     rgba(0,0,0,0.08)
```

### Dark Mode
```css
Background: #0A0A0A
Surface:    #171717
Primary:    #818CF8 (Lighter Indigo)
Text:       #FAFAFA / #A3A3A3 / #525252
Border:     rgba(255,255,255,0.1)
```

---

## 📏 Typography

### Font
**Primary**: Inter (variable weight)
**Fallback**: -apple-system, BlinkMacSystemFont, Segoe UI

### Scale (Mobile)
```
H1:      24px / 600 / -0.01em
H2:      20px / 600 / -0.01em
H3:      18px / 600
Body:    15px / 400
Caption: 12px / 500 / +0.01em
```

### Weights
- 400: Body text
- 500: UI elements, captions
- 600: Headings
- 700: Display text

---

## 📐 Spacing

### Scale (Base: 4px)
```
1:  4px    (tight)
2:  8px    (elements)
3:  12px   (buttons)
4:  16px   (standard)
5:  20px   (cards)
6:  24px   (sections)
8:  32px   (large gaps)
12: 48px   (major sections)
```

### Common Usage
- Button padding: 12px 20px
- Card padding: 16px (mobile), 20px (desktop)
- Input padding: 12px 16px
- Page margins: 16px (mobile), 24px (desktop)

---

## 🔲 Border Radius

```css
sm:  6px   (buttons, chips)
md:  8px   (inputs)
lg:  12px  (cards, modals)
xl:  16px  (large panels)
full: 9999px (pills, circles)
```

---

## 🌑 Shadows

### Light Mode
```css
sm: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)
md: 0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.08)
lg: 0 4px 8px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.1)
```

### Dark Mode
```css
sm: 0 1px 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.3)
md: 0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)
```

---

## ⚡ Animation

### Duration
```css
fast:   150ms  (micro-interactions)
normal: 200ms  (default)
slow:   300ms  (page transitions)
```

### Easing
```css
standard: cubic-bezier(0.4, 0, 0.2, 1)
```

### Common Patterns
```css
/* Hover lift */
transition: transform 200ms ease, box-shadow 200ms ease;
hover: transform: translateY(-2px); box-shadow: md;

/* Button press */
active: transform: scale(0.98);

/* Fade in */
opacity: 0 → 1, transition: 200ms ease;
```

---

## 📱 Layout

### Breakpoints
```
sm:  640px   (mobile landscape)
md:  768px   (tablet)
lg:  1024px  (small desktop)
xl:  1280px  (desktop)
2xl: 1536px  (large desktop)
```

### Grid Columns
```
< 768px:   2 columns
768-1024:  3 columns
1024-1280: 4 columns
> 1280px:  5 columns
```

### Container
```css
max-width: 1400px
margin: 0 auto
padding: 16px (mobile), 24px (desktop)
```

---

## 🧩 Component Quick Reference

### Button (Primary)
```css
bg: #6366F1
color: white
padding: 12px 20px
border-radius: 8px
font-size: 15px
font-weight: 500
shadow: sm
hover: shadow: md, transform: translateY(-1px)
active: transform: scale(0.98)
```

### Card
```css
bg: surface
border: 1px solid border
border-radius: 12px
padding: 20px
shadow: sm
hover: border-color: primary, shadow: md, transform: translateY(-2px)
```

### App Card
```css
Same as Card +
icon: 56x56px, border-radius: 12px
icon-bg: color with 20% opacity
title: 16px semibold
description: 14px (hidden on mobile)
text-align: center
```

### Search Bar
```css
width: 100%
padding: 12px 16px 12px 44px (left space for icon)
border-radius: 12px
focus: border-color: primary, shadow: 0 0 0 3px rgba(99,102,241,0.1)
```

### Bottom Navigation
```css
position: fixed bottom
height: 64px + safe-area
background: rgba(255,255,255,0.8)
backdrop-filter: blur(20px)
border-top: 1px solid border
5 items: Home, Explore, Create (FAB), My Work, Profile
hidden: > 768px
```

---

## 🎯 Key Interactions

### Hover (Desktop)
- Cards: lift 2px, enhance shadow, change border color
- Buttons: darken background, enhance shadow
- Links: opacity 0.8

### Active (Touch)
- All interactive: scale(0.98)
- Provides immediate feedback

### Focus (Keyboard)
- Outline: 2px solid primary
- Outline-offset: 2px

---

## ♿ Accessibility

### Color Contrast
- Text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

### Touch Targets
- Minimum: 44x44px (iOS) / 48x48px (Android)

### Focus Indicators
- Always visible
- 2px solid outline

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🚀 Performance

### Loading States
- Use skeleton screens (not spinners)
- Match layout of content
- Subtle animation (1.5s ease-in-out)

### Images
- Lazy load (loading="lazy")
- Use WebP with fallback
- Blur placeholder technique

### Animations
- Use transform and opacity (GPU-accelerated)
- Avoid animating width, height, top, left
- Add will-change for complex animations

---

## 📋 Common Patterns

### Featured Section
```html
<section>
  <header>
    <h2>Featured</h2>
    <button>View All</button>
  </header>
  <div class="horizontal-scroll">
    <!-- Cards (280px wide) -->
  </div>
</section>
```

### Category Filters
```html
<div class="chips-container">
  <button class="chip active">All Apps</button>
  <button class="chip">Images</button>
  <!-- More chips -->
</div>
```

### App Grid
```html
<div class="grid">
  <!-- 2 cols mobile, 3-5 cols desktop -->
  <div class="app-card">...</div>
  <div class="app-card">...</div>
  <!-- More cards -->
</div>
```

### Empty State
```html
<div class="empty-state">
  <svg class="icon">...</svg>
  <h3>No items found</h3>
  <p>Description or action</p>
</div>
```

---

## 🛠️ Implementation Checklist

### Foundation
- [ ] Install design tokens CSS
- [ ] Update Tailwind config
- [ ] Test with existing components
- [ ] Verify no regressions

### Components
- [ ] Update Button
- [ ] Update Card
- [ ] Create AppCard
- [ ] Create SearchBar
- [ ] Create BottomNavigation

### Layout
- [ ] Update Dashboard page
- [ ] Add search functionality
- [ ] Add category filters
- [ ] Add featured section
- [ ] Implement bottom nav

### Polish
- [ ] Add hover animations
- [ ] Add loading states
- [ ] Add empty states
- [ ] Optimize performance
- [ ] Accessibility audit

---

## 📂 File Structure

```
frontend/
├── src/
│   ├── styles/
│   │   ├── design-tokens.css    ← Design system variables
│   │   └── index.css             ← Global styles
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── AppCard.tsx
│   │   │   └── SearchBar.tsx
│   │   └── BottomNavigation.tsx
│   ├── pages/
│   │   └── Dashboard.tsx
│   └── data/
│       └── apps.ts                ← App definitions
```

---

## 🔗 Quick Links

### Documentation
- Full Research: `MOBILE_DESIGN_TRENDS_2025_RESEARCH.md`
- Design System: `DESIGN_SYSTEM_2025_UPDATED.md`
- Implementation: `IMPLEMENTATION_GUIDE_2025.md`
- Summary: `REDESIGN_2025_SUMMARY.md`

### Prototype
- Interactive Demo: `lumiku-mobile-first-2025.html`

### Testing
1. Open prototype in browser
2. Test responsive (375px, 768px, 1440px)
3. Test dark mode toggle
4. Test search and filters
5. Test all interactions

---

## 💡 Pro Tips

### DO
✅ Start with mobile design (375px)
✅ Use design tokens (CSS variables)
✅ Test on real devices
✅ Respect system preferences (dark mode)
✅ Optimize for touch (44x44px targets)
✅ Use semantic HTML
✅ Add loading states
✅ Test with 50+ apps

### DON'T
❌ Design desktop-first
❌ Hardcode colors/spacing
❌ Use spinners (use skeletons)
❌ Ignore accessibility
❌ Make touch targets too small
❌ Use generic empty states
❌ Animate expensive properties

---

## 🆘 Common Issues

### Colors not updating?
→ Check `data-theme` attribute on `<html>`

### Tailwind classes not working?
→ Ensure design-tokens.css imported before Tailwind

### Bottom nav overlapping content?
→ Add padding-bottom: 80px to body (mobile only)

### Animations janky?
→ Use transform/opacity only, add will-change

### Dark mode not auto-switching?
→ Check @media (prefers-color-scheme: dark)

---

## 📊 Success Criteria

### User Experience
- ⏱️ Find any app in < 3 seconds
- 🚀 Perceived load time < 2 seconds
- 📱 Native feel on mobile
- 🖥️ Beautiful on desktop
- 🔍 Search returns results instantly

### Technical
- 💯 Lighthouse score > 90
- ⚡ First Contentful Paint < 1.5s
- 🎯 Time to Interactive < 3s
- 📏 Cumulative Layout Shift < 0.1
- 🎬 60fps animations

### Accessibility
- ♿ WCAG AA compliant
- ⌨️ Full keyboard navigation
- 📢 Screen reader compatible
- 🎨 Color contrast meets standards
- 👁️ Focus indicators visible

---

## 🎨 Color Variables (Copy-Paste)

```css
/* Light Mode */
--color-background: #FAFAFA;
--color-surface: #FFFFFF;
--color-text-primary: #0A0A0A;
--color-text-secondary: #525252;
--color-text-tertiary: #A3A3A3;
--color-border: rgba(0, 0, 0, 0.08);
--color-primary: #6366F1;

/* Dark Mode */
--color-background: #0A0A0A;
--color-surface: #171717;
--color-text-primary: #FAFAFA;
--color-text-secondary: #A3A3A3;
--color-text-tertiary: #525252;
--color-border: rgba(255, 255, 255, 0.1);
--color-primary: #818CF8;
```

---

## 🎯 Key Measurements (Memorize These)

- Page padding: **16px** (mobile), **24px** (desktop)
- Card padding: **20px**
- Button padding: **12px 20px**
- Input padding: **12px 16px**
- Border radius: **12px** (cards), **8px** (buttons)
- Shadow: **sm** (default), **md** (hover)
- Icon size: **24px** (nav), **28px** (cards)
- Grid gap: **16px** (mobile), **24px** (desktop)
- Animation: **200ms** (default)
- Bottom nav: **64px** height
- Touch target: **44x44px** minimum

---

**Keep this document handy during implementation!** 📌

Print it, bookmark it, refer to it often. It contains all the essential specs you need to build the Lumiku 2025 design.
