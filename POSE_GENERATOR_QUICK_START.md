# Pose Generator - Quick Start Guide

**For:** Developers implementing Pose Generator
**Status:** Phase 2 Complete - Ready for Phase 3

---

## 🚀 Quick Commands

```bash
# Navigate to backend
cd backend

# Validate seed data (no database required)
bun run validate:pose-seed

# Run seed script (requires database)
bun run seed:pose-generator

# Generate Prisma client
bun run prisma:generate

# Open Prisma Studio
bun run prisma:studio
```

---

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma                    # Database schema
│   └── seeds/
│       ├── pose-generator.seed.ts       # Main seed script
│       ├── validate-seed-data.ts        # Validation (no DB)
│       └── data/
│           ├── pose-categories.ts       # 28 categories
│           └── pose-library.ts          # 64 poses
docs/
├── POSE_GENERATOR_ARCHITECTURE.md       # Full architecture
├── POSE_GENERATOR_SEED_DATA.md          # Seed documentation
├── POSE_GENERATOR_PHASE_2_COMPLETE.md   # Phase 2 summary
└── POSE_GENERATOR_QUICK_START.md        # This file
```

---

## 📊 Current Status

### ✅ Phase 1: Backend Foundation (Complete)
- Database schema designed
- Prisma models created
- Architecture documented

### ✅ Phase 2: Pose Library Seeding (Complete)
- 28 categories (6 top-level, 22 sub-categories)
- 64 foundation poses
- Seed scripts created
- Documentation written

### 🚧 Phase 3: Backend API (Next)
- API endpoints
- BullMQ worker pipeline
- FLUX integration
- WebSocket real-time updates

### 📅 Phase 4: Production (Future)
- Real photography
- ControlNet maps
- CDN setup
- Beta testing

---

## 🎯 Key Metrics

| Metric | Value |
|--------|-------|
| Categories | 28 |
| Top-level categories | 6 |
| Sub-categories | 22 |
| Total poses | 64 |
| Beginner poses | 39 (61%) |
| Intermediate poses | 20 (31%) |
| Advanced poses | 5 (8%) |
| Premium poses | 9 (14%) |
| Featured poses | 7 (11%) |

---

## 🏗️ Category Structure

1. **Professional** (Blue #3B82F6)
   - Business Portraits
   - Corporate Headshots
   - Conference & Speaking
   - Office & Workspace

2. **E-Commerce** (Red #EF4444)
   - Product Modeling
   - Shopee & TikTok Shop
   - Before & After
   - Live Selling

3. **Fashion & Style** (Purple #8B5CF6)
   - Editorial
   - Street Style
   - Runway & Catwalk

4. **Hijab & Modest** (Pink #EC4899)
   - Casual Hijab
   - Professional Hijab
   - Fashion Hijab
   - Wedding & Formal Hijab

5. **Casual & Lifestyle** (Green #10B981)
   - Everyday Casual
   - Social Media
   - Outdoor & Lifestyle
   - Sitting & Relaxed

6. **Sports & Active** (Orange #F59E0B)
   - Fitness & Gym
   - Yoga & Wellness
   - Running & Cardio

---

## 🔧 Adding New Content

### Add a Category

```typescript
// Edit: backend/prisma/seeds/data/pose-categories.ts
{
  name: 'new-category',
  displayName: 'New Category',
  slug: 'new-category',
  description: 'Description here',
  icon: 'lucide-icon-name',
  displayOrder: 60,
  color: '#3B82F6',
  parentSlug: 'parent-slug', // Optional
  isActive: true,
}
```

### Add a Pose

```typescript
// Edit: backend/prisma/seeds/data/pose-library.ts
{
  name: 'My Awesome Pose',
  description: 'Detailed description',
  categorySlug: 'category-slug',
  difficulty: 'beginner', // or intermediate, advanced
  genderSuitability: 'unisex', // or male, female
  tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
  isPremium: false,
  sourceType: 'curated',
  isFeatured: false,
}
```

### Run Updated Seed

```bash
bun run validate:pose-seed  # Check for errors first
bun run seed:pose-generator # Then seed
```

---

## 🌐 Placeholder URLs

**Development Phase:**
```
Preview:    https://placehold.co/1024x1024/3B82F6/FFFFFF/png?text=Pose+Name
Thumbnail:  https://placehold.co/400x400/3B82F6/FFFFFF/png?text=Pose+Name
ControlNet: https://placehold.co/1024x1024/000000/00FF00/png?text=ControlNet:Pose
```

**Production Phase:** Replace with Cloudflare R2 URLs

---

## 📚 Documentation

- **Architecture:** `docs/POSE_GENERATOR_ARCHITECTURE.md`
- **Seed Guide:** `docs/POSE_GENERATOR_SEED_DATA.md`
- **Phase 2 Summary:** `docs/POSE_GENERATOR_PHASE_2_COMPLETE.md`
- **This Guide:** `POSE_GENERATOR_QUICK_START.md`

---

## 🐛 Troubleshooting

### Validation Fails
```bash
# Check error message
bun run validate:pose-seed

# Common issues:
# - Duplicate category slugs → Make slugs unique
# - Invalid parent reference → Check parentSlug exists
# - Missing tags → Add at least 3 tags per pose
```

### Seed Fails
```bash
# Database not running
# → Start PostgreSQL on port 5433

# Prisma client not generated
bun run prisma:generate

# Connection error
# → Check DATABASE_URL in .env
```

### Need to Reset
```bash
# Clear all pose data
bunx prisma db execute --sql "TRUNCATE TABLE pose_library, pose_categories CASCADE;"

# Re-run seed
bun run seed:pose-generator
```

---

## 🎯 Next Steps (Phase 3)

### Week 1-2: API Endpoints
- [ ] `GET /api/apps/pose-generator/categories`
- [ ] `GET /api/apps/pose-generator/library`
- [ ] `POST /api/apps/pose-generator/projects`
- [ ] `POST /api/apps/pose-generator/generate`

### Week 3-4: Worker Pipeline
- [ ] BullMQ queue setup
- [ ] FLUX API integration
- [ ] ControlNet processing
- [ ] Background changer

### Week 5-6: Real-time Features
- [ ] WebSocket server
- [ ] Redis Pub/Sub
- [ ] Progress tracking
- [ ] Frontend integration

---

## 📞 Support

- **Architecture Questions:** See `docs/POSE_GENERATOR_ARCHITECTURE.md`
- **Seed Issues:** See `docs/POSE_GENERATOR_SEED_DATA.md`
- **Database Schema:** See `backend/prisma/schema.prisma`

---

**Last Updated:** October 14, 2025
**Version:** 1.0
**Status:** Phase 2 Complete ✅
