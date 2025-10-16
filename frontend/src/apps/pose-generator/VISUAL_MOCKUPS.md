# Pose Generator Visual Mockups

## ASCII Art Screen Designs

These mockups show the premium UI layout and component placement.

---

## 1. Pose Library Grid View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 Search poses by category, tags, difficulty...        [≡ Filters]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📱 Social Media  👗 Fashion  🏢 Professional  🎨 Creative  [All ▼]        │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────┐        │
│  │  12 / 50 poses selected                    250 poses available│        │
│  └───────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐             │
│  │ ⭐ FEA │  │        │  │   ✓    │  │        │  │        │             │
│  │  TURED │  │  IMG   │  │  IMG   │  │  IMG   │  │  IMG   │             │
│  │        │  │        │  │SELECTED│  │        │  │        │             │
│  │Standing│  │Sitting │  │Walking │  │Running │  │Dancing │             │
│  │BEGINNER│  │INTERMED│  │BEGINNER│  │ADVANCED│  │ EXPERT │             │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘             │
│    ↑ hover     ↑ hover      ↑ selected    ↑ hover    ↑ hover             │
│   lift+glow    lift+glow     ring glow    lift+glow   lift+glow          │
│                                                                             │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐             │
│  │        │  │   ✓    │  │        │  │        │  │        │             │
│  │  IMG   │  │  IMG   │  │  IMG   │  │  IMG   │  │  IMG   │             │
│  │        │  │SELECTED│  │        │  │        │  │        │             │
│  │ Yoga   │  │ Jump   │  │ Kneel  │  │  Wave  │  │  Pose  │             │
│  │BEGINNER│  │ADVANCED│  │INTERMED│  │BEGINNER│  │ADVANCED│             │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘             │
│                                                                             │
│  [Staggered fade-in animation: 50ms delay per item]                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    QUICK ACTION BAR (floating)                              │
│  ┌───────────────────────────────────────────────────────┐                 │
│  │  [ 12 ]  Poses Selected      │  Clear All  │  Next →  │                 │
│  │  gradient   Ready to generate                          │                 │
│  └───────────────────────────────────────────────────────┘                 │
│         ↑ animate-fadeInUp                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Generation Progress View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      GENERATION IN PROGRESS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────┐          ┌─────────────────────────────┐           │
│   │                  │          │  ┌───────────────┐           │           │
│   │   * * * * *      │          │  │ 📷  50        │ Total     │           │
│   │  *         *     │          │  │               │ Poses     │           │
│   │ *           *    │          │  └───────────────┘           │           │
│   │ *    68%    *    │          │  ┌───────────────┐           │           │
│   │ *           *    │          │  │ ✓  34         │ Completed │           │
│   │  *         *     │          │  │               │           │           │
│   │   * * * * *      │          │  └───────────────┘           │           │
│   │  Processing...   │          │  ┌───────────────┐           │           │
│   │    ⚡ particles  │          │  │ ⏰  2m 30s    │ Est. Time │           │
│   │                  │          │  │               │           │           │
│   └──────────────────┘          │  └───────────────┘           │           │
│    ↑ Circular SVG ring          │                              │           │
│      with gradient               │  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░         │           │
│      & glow effect               │  68% Progress                │           │
│                                  │                              │           │
│                                  │  ✨ Processing your poses... │           │
│                                  └─────────────────────────────┘           │
│                                                                             │
│   Recent Completions:                                                      │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                                     │
│   │ ✓  │ │ ✓  │ │ ✓  │ │ ✓  │ │ ✓  │  ← Horizontal scroll                │
│   │IMG │ │IMG │ │IMG │ │IMG │ │IMG │     with momentum                   │
│   └────┘ └────┘ └────┘ └────┘ └────┘     hover: scale up                 │
│                                                                             │
│   [Shimmer effect on progress bar]                                         │
│   [Particles animate outward from ring center]                             │
│   [Counter animates upward with cubic ease-out]                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

AT 100% COMPLETION:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│              🎊 🎉 🎊 🎉 CONFETTI ANIMATION 🎉 🎊 🎉 🎊                   │
│                                                                             │
│   ┌──────────────────┐                                                     │
│   │                  │       All poses generated successfully!             │
│   │   ┌────────┐     │                                                     │
│   │   │   ✓    │     │       [ View Results → ]                           │
│   │   │  DONE  │     │                                                     │
│   │   └────────┘     │                                                     │
│   │   Complete!      │                                                     │
│   └──────────────────┘                                                     │
│    ↑ Green checkmark                                                       │
│      with heartbeat animation                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Export Format Selector

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Export Formats                                   [⬇ Export (3)]           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✓ 3 formats selected                                     Clear all        │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐    │
│  │  📱 Social Media                                              [▼] │    │
│  ├───────────────────────────────────────────────────────────────────┤    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │ ⭐ Popular│  │          │  │  ✓ SEL   │  │          │        │    │
│  │  │  ┌────┐  │  │  ┌────┐  │  │  ┌────┐  │  │  ┌────┐  │        │    │
│  │  │  │ 1:1│  │  │  │9:16│  │  │  │9:16│  │  │  │16:9│  │        │    │
│  │  │  └────┘  │  │  └────┘  │  │  └────┘  │  │  └────┘  │        │    │
│  │  │    📷    │  │    📱    │  │    🎵    │  │    🐦    │        │    │
│  │  │ IG POST  │  │ IG STORY │  │  TIKTOK  │  │  TWITTER │        │    │
│  │  │   1:1    │  │   9:16   │  │   9:16   │  │   16:9   │        │    │
│  │  │1080x1080 │  │1080x1920 │  │1080x1920 │  │1200x675  │        │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │    │
│  │   ↑ hover       ↑ hover       ↑ selected     ↑ hover           │    │
│  │  lift+glow     lift+glow       ring+scale    lift+glow          │    │
│  └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐    │
│  │  🛒 E-Commerce                                            [▼]     │    │
│  ├───────────────────────────────────────────────────────────────────┤    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │ ⭐ Popular│  │  ✓ SEL   │  │          │  │          │        │    │
│  │  │  ┌────┐  │  │  ┌────┐  │  │  ┌────┐  │  │  ┌────┐  │        │    │
│  │  │  │ 1:1│  │  │  │ 1:1│  │  │  │ 1:1│  │  │  │ 1:1│  │        │    │
│  │  │  └────┘  │  │  └────┘  │  │  └────┘  │  │  └────┘  │        │    │
│  │  │   🛍️    │  │   🛒    │  │   🏪    │  │   📦    │        │    │
│  │  │  SHOPIFY │  │  SHOPEE  │  │ TOKOPEDIA│  │  AMAZON  │        │    │
│  │  │   1:1    │  │   1:1    │  │   1:1    │  │   1:1    │        │    │
│  │  │2048x2048 │  │1024x1024 │  │1200x1200 │  │2000x2000 │        │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │    │
│  └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  💡 Pro Tip: Select multiple formats to export simultaneously              │
│                                          [ Select Popular ⭐ ]              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Generation Wizard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GENERATION WIZARD                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────┐ ────── ┌──────────┐ ────── ┌──────────┐ ────── ┌────────┐ │
│   │  ✓ DONE  │ ████░░ │  ACTIVE  │ ░░░░░░ │  PENDING │ ░░░░░░ │ PENDING│ │
│   │    👤    │        │    🎨    │        │    ⚙️    │        │   ✨   │ │
│   │  Select  │        │  Choose  │        │Configure │        │Generate│ │
│   │  Avatar  │        │  Poses   │        │ Settings │        │        │ │
│   └──────────┘        └──────────┘        └──────────┘        └────────┘ │
│    ↑ green check      ↑ blue gradient     ↑ gray               ↑ gray    │
│      scale(1)           pulsing ring        scale(0.95)          disabled │
│                         scale(1.1)                                         │
│                                                                             │
│   Overall Progress                                     Step 2 of 4         │
│   ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░                                   │
│   [Gradient: blue → purple → pink with shimmer effect]                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                      [STEP CONTENT AREA]                                   │
│                                                                             │
│   {Current step content slides in/out with fade transition}               │
│   {Validation errors shake the content area}                               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [← Back]          Cost: 💰 250 credits              [Next Step →]        │
│   ↑ disabled        ↑ gradient bg                    ↑ gradient bg        │
│    on step 1          yellow border                    blue→purple         │
│                                                          hover: shine       │
│                                                                             │
│  Complete this step to continue                              [→] to continue│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

VALIDATION ERROR STATE:
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠️ Please fix the following errors:                                       │
│  • No avatar selected                                                      │
│  • Please select at least one pose                                         │
│  [Animate: fadeInDown + red border]                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Dashboard Stats Widget

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║  ┌────┐                                                          [→]  ║ │
│  ║  │ ✨ │  Pose Generator                                               ║ │
│  ║  └────┘  AI-powered pose creation                                     ║ │
│  ║                                                                        ║ │
│  ║  ┌────────────────────────┐         ╱╲                               ║ │
│  ║  │        1,250           │        ╱  ╲      ← Sparkline             ║ │
│  ║  │   Total Poses          │       ╱    ╲╱╲                           ║ │
│  ║  │   Generated            │      ╱           ╲                        ║ │
│  ║  └────────────────────────┘                                           ║ │
│  ║   ↑ Animated counter (counting up effect)                            ║ │
│  ║                                                                        ║ │
│  ║  ┌──────────────┐  ┌──────────────┐                                 ║ │
│  ║  │ 📷  50       │  │ 📈  28       │                                 ║ │
│  ║  │ Generations  │  │ This Week    │                                 ║ │
│  ║  └──────────────┘  └──────────────┘                                 ║ │
│  ║                                                                        ║ │
│  ║  Recent Creations                                                     ║ │
│  ║  [img][img][img][img][+6]  ← Horizontal scroll                       ║ │
│  ║                                                                        ║ │
│  ║  ┌──────────────────────────────────────────────────────────┐       ║ │
│  ║  │  ✨ Generate New Poses                                   │       ║ │
│  ║  │  [Gradient background with hover shine effect]           │       ║ │
│  ║  └──────────────────────────────────────────────────────────┘       ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│  ↑ Gradient background: blue → purple → pink                               │
│    Glass morphism overlay with grid pattern                                │
│    Hover: lift effect + shine animation                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Recent Generations Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Recent Generations                                        View All →      │
│  Track your pose generation history                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    │                                                                        │
│    ●───  Generation #a1b2c3d4          [completed]                    [→]  │
│    │     ⏰ 2h ago  •  50 poses  •  48 successful                          │
│    │     [img] [img] [img] [img] [img] [+43]  ← Thumbnails                │
│    │     ▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂  ← Gradient underline on hover    │
│    │                                                                        │
│    ●───  Generation #e5f6g7h8          [processing]                   [→]  │
│    │     ⏰ 5m ago  •  30 poses                                            │
│    │     Progress                                                  68%     │
│    │     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░                                     │
│    │     [Shimmer effect on progress bar]                                  │
│    │                                                                        │
│    ●───  Generation #i9j0k1l2          [completed]                    [→]  │
│    │     ⏰ 1d ago  •  25 poses  •  25 successful                          │
│    │     [img] [img] [img] [img] [img] [+20]                              │
│    │                                                                        │
│    ●───  Generation #m3n4o5p6          [failed]                       [→]  │
│    │     ⏰ 2d ago  •  10 poses  •  0 successful                           │
│    │     ● 0 successful  ● 10 failed                                       │
│    │                                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Start New Generation ]                                                  │
│   ↑ White background, hover: slight lift + blue border                     │
└─────────────────────────────────────────────────────────────────────────────┘

INTERACTION STATES:
- Hover: Thumbnails stagger-scale up (50ms delay per image)
- Hover: Gradient underline slides in from left
- Click: Navigate to generation details
- Active ring indicator pulses for processing items
```

---

## 7. Mobile Responsive Layout

```
MOBILE (375px):
┌─────────────────────────┐
│ ☰  Pose Generator    ✕  │
├─────────────────────────┤
│                         │
│ ①──②──③──④             │
│ ●  ○  ○  ○             │
│ Avatar Poses Conf Gen  │
│                         │
│ ▓▓▓▓░░░░░░░░░░          │
│ Step 1 of 4             │
│                         │
├─────────────────────────┤
│ SELECT AVATAR           │
│                         │
│ ┌────┐ ┌────┐          │
│ │✓IMG│ │ IMG│          │
│ └────┘ └────┘          │
│ ┌────┐ ┌────┐          │
│ │ IMG│ │ IMG│          │
│ └────┘ └────┘          │
│                         │
│ [← Back]   [Next →]    │
│                         │
└─────────────────────────┘

TABLET (768px):
┌─────────────────────────────────────┐
│  ☰  Pose Generator              ✕   │
├─────────────────────────────────────┤
│                                     │
│ ①───────②───────③───────④          │
│ 👤      🎨      ⚙️      ✨         │
│ Select  Choose  Config  Generate    │
│ Avatar  Poses   Settings            │
│                                     │
│ ▓▓▓▓▓▓▓▓▓░░░░░░░░░  Step 2 of 4    │
│                                     │
├─────────────────────────────────────┤
│ CHOOSE POSES (12/50)    [Filters]  │
│                                     │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│ │ ✓ │ │IMG│ │IMG│ │IMG│           │
│ └───┘ └───┘ └───┘ └───┘           │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│ │IMG│ │IMG│ │ ✓ │ │IMG│           │
│ └───┘ └───┘ └───┘ └───┘           │
│                                     │
│ [← Back]          [Next Step →]    │
│                                     │
└─────────────────────────────────────┘
```

---

## Animation Specifications

### On Load:
1. **Step indicators**: Fade in with stagger (100ms delay)
2. **Progress bar**: Animate from 0 to current width (500ms)
3. **Content area**: Fade in up (400ms delay)

### Step Transition:
1. **Current content**: Fade out + translate left (300ms)
2. **Wait**: 100ms
3. **New content**: Fade in + translate from right (300ms)
4. **Progress bar**: Smooth width transition (700ms)

### Hover Effects:
- **Cards**: Lift -4px + shadow increase (200ms spring)
- **Buttons**: Scale 1.02 + glow ring (200ms)
- **Images**: Scale 1.05 + border color change (200ms)

### Success State:
1. **Progress ring**: Fill to 100% (1s ease-out)
2. **Checkmark**: Scale in (300ms spring)
3. **Confetti**: Trigger 100 particles (3s duration)
4. **Stats counter**: Count up animation (2s ease-out)

---

## Color Usage

```
PRIMARY ACTIONS:
  Background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)
  Hover: Shift gradient + glow
  Active: Darker gradient

SECONDARY ACTIONS:
  Background: white
  Border: slate-300
  Hover: slate-100 bg + blue-300 border

SUCCESS STATES:
  Green (#10b981)
  Checkmark, completed badges

ERROR STATES:
  Red (#ef4444)
  Error messages, failed badges, shake animation

PROCESSING STATES:
  Blue (#3b82f6)
  Spinning loaders, progress bars, pulsing rings

DISABLED STATES:
  Gray (#64748b)
  50% opacity, cursor-not-allowed
```

---

## Spacing Guidelines

```
Card Padding:        24px (lg)
Card Margin:         24px (lg)
Section Spacing:     32px (xl)
Element Spacing:     16px (md)
Button Padding:      12px 24px
Input Padding:       10px 16px
Border Radius Card:  12px (lg)
Border Radius Button: 8px (md)
Border Radius Pill:  9999px (full)
```

---

These mockups demonstrate the premium feel through:
- **Generous whitespace** around all elements
- **Multi-layer shadows** for depth perception
- **Smooth animations** on all interactions
- **Obvious actions** with gradient backgrounds
- **Instant feedback** via hover effects
- **Delight moments** like confetti and shine effects
