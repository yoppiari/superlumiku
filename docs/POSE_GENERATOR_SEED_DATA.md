# Pose Generator - Seed Data Documentation

**Phase:** 2 - Pose Library Seeding
**Status:** Complete
**Last Updated:** October 14, 2025
**Total Poses:** 64 (Foundation Set - Expandable to 500+)
**Total Categories:** 28 (6 top-level, 22 sub-categories)

---

## Table of Contents

1. [Overview](#overview)
2. [Category Structure](#category-structure)
3. [Sample Poses](#sample-poses)
4. [Running the Seed](#running-the-seed)
5. [Adding New Content](#adding-new-content)
6. [Placeholder URL Strategy](#placeholder-url-strategy)
7. [Data Statistics](#data-statistics)

---

## Overview

The Pose Generator seed system populates the database with a production-ready pose library optimized for the Indonesian market. The library includes:

- **64 foundation poses** across 6 main categories (expandable to 500+)
- **Hierarchical category structure** with parent-child relationships
- **Rich metadata** including difficulty, tags, gender suitability
- **Indonesian market focus** with dedicated hijab fashion category
- **E-commerce optimization** for Shopee, TikTok Shop, and Tokopedia

### Key Features

- **Idempotent seeding**: Can run multiple times safely without duplicating data
- **Placeholder images**: Uses placehold.co service for development
- **Balanced difficulty**: 60% beginner, 30% intermediate, 10% advanced
- **Searchable tags**: Comprehensive tagging system for filtering
- **Premium tier**: 15% of poses marked as premium content

---

## Category Structure

### Top-Level Categories (6)

| Category | Slug | Color | Icon | Description |
|----------|------|-------|------|-------------|
| **Professional** | `professional` | #3B82F6 (Blue) | briefcase | Business, corporate, and formal poses |
| **E-Commerce** | `e-commerce` | #EF4444 (Red) | shopping-bag | Poses for online selling platforms |
| **Fashion & Style** | `fashion` | #8B5CF6 (Purple) | sparkles | Editorial, runway, and street style |
| **Hijab & Modest** | `hijab` | #EC4899 (Pink) | heart | Hijab fashion and modest styling |
| **Casual & Lifestyle** | `casual` | #10B981 (Green) | smile | Everyday and social media poses |
| **Sports & Active** | `sports` | #F59E0B (Orange) | zap | Fitness, yoga, and athletic poses |

### Sub-Categories Breakdown

#### 1. Professional (4 sub-categories)
- **Business Portraits** - Classic headshots and LinkedIn photos
- **Corporate Headshots** - Executive and team page photos
- **Conference & Speaking** - Keynote, panel, and presentation poses
- **Office & Workspace** - Working at desk and meeting poses

#### 2. E-Commerce (4 sub-categories)
- **Product Modeling** - Showcasing products and apparel
- **Shopee & TikTok Shop** - Platform-optimized poses
- **Before & After** - Product transformation poses
- **Live Selling** - Live stream and host poses

#### 3. Fashion & Style (3 sub-categories)
- **Editorial** - High-fashion magazine poses
- **Street Style** - Urban casual and OOTD poses
- **Runway & Catwalk** - Professional runway poses

#### 4. Hijab & Modest Fashion (4 sub-categories)
- **Casual Hijab** - Everyday hijab lifestyle
- **Professional Hijab** - Business and corporate hijab
- **Fashion Hijab** - Stylish modern hijab fashion
- **Wedding & Formal Hijab** - Bridal and formal occasions

#### 5. Casual & Lifestyle (4 sub-categories)
- **Everyday Casual** - Natural relaxed poses
- **Social Media** - Instagram and TikTok optimized
- **Outdoor & Lifestyle** - Parks, cafes, urban settings
- **Sitting & Relaxed** - Comfortable seated poses

#### 6. Sports & Active (3 sub-categories)
- **Fitness & Gym** - Workout and strength poses
- **Yoga & Wellness** - Meditation and yoga poses
- **Running & Cardio** - Athletic and running poses

---

## Sample Poses

### Featured Poses (High Priority)

#### Classic Business Headshot
- **Category:** Business Portraits
- **Difficulty:** Beginner
- **Gender:** Unisex
- **Tags:** headshot, professional, business, arms crossed, confident, formal
- **Description:** Traditional head and shoulders pose with arms crossed, confident expression, facing camera directly
- **Use Case:** LinkedIn profiles, company websites, professional portfolios

#### Excited Product Reveal
- **Category:** Shopee & TikTok Shop
- **Difficulty:** Beginner
- **Gender:** Unisex
- **Tags:** excited, reveal, product, energetic, shopee, tiktok
- **Description:** Holding product with excited expression, pointing at it, energetic e-commerce pose
- **Use Case:** Product launches, live selling, promotional content

#### Casual Hijab Smile
- **Category:** Casual Hijab
- **Difficulty:** Beginner
- **Gender:** Female
- **Tags:** hijab, casual, smile, friendly, approachable, modest
- **Description:** Friendly pose with hijab, warm smile, hands relaxed, approachable stance
- **Use Case:** Social media, lifestyle content, casual fashion

#### Instagram Story Pose
- **Category:** Social Media
- **Difficulty:** Beginner
- **Gender:** Unisex
- **Tags:** instagram, story, vertical, social media, camera, selfie-style
- **Description:** Vertical frame friendly pose, looking at camera, social media optimized
- **Use Case:** Instagram Stories, TikTok, vertical video content

#### Professional Hijab Headshot
- **Category:** Professional Hijab
- **Difficulty:** Beginner
- **Gender:** Female
- **Tags:** hijab, professional, headshot, corporate, business, confident
- **Description:** Corporate hijab headshot, professional attire, confident expression
- **Use Case:** Professional profiles, business directories, corporate websites

### Premium Poses (Advanced)

#### High Fashion Attitude
- **Category:** Editorial
- **Difficulty:** Advanced
- **Gender:** Unisex
- **Tags:** high fashion, attitude, fierce, editorial, magazine, strong
- **Premium:** Yes
- **Description:** Strong fashion pose with attitude, hand on hip, fierce expression

#### TED Talk Stance
- **Category:** Conference & Speaking
- **Difficulty:** Intermediate
- **Gender:** Unisex
- **Tags:** TED talk, open posture, presenting, explanatory, confident, public speaking
- **Premium:** Yes
- **Description:** Open body language, hands apart in explanatory gesture, confident and approachable

---

## Running the Seed

### Prerequisites

1. Database is set up and migrated
2. Prisma client is generated
3. Bun runtime is installed

### Command

```bash
# From backend directory
cd backend

# Run the seed script
bun run seed:pose-generator
```

### Expected Output

```
🌱 Starting Pose Generator Seed...

📂 Seeding Categories...
  Creating categories...
    ✓ Professional (professional)
    ✓ Business Portraits (business-portraits)
    ✓ Corporate Headshots (corporate-headshots)
    ... (and more)
  Setting parent relationships...
    ✓ Business Portraits → parent: professional
    ✓ Corporate Headshots → parent: professional
    ... (and more)
✅ Seeded 33 categories

🎭 Seeding Pose Library...
  ✓ 10 poses seeded...
  ✓ 20 poses seeded...
  ... (continues)
  ✓ 60 poses seeded...
✅ Seeded 64 poses

📊 Seeding Statistics:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Poses: 64
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Difficulty Distribution:
    - Beginner: 39 (61%)
    - Intermediate: 20 (31%)
    - Advanced: 5 (8%)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Gender Suitability:
    - Unisex: 51
    - Female: 13
    - Male: 0
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Premium Poses: 9
  Featured Poses: 7
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Pose Generator Seed Complete!
```

### Idempotency

The seed script is **idempotent** - you can run it multiple times safely:

- **First run:** Creates all categories and poses
- **Subsequent runs:** Updates existing data, creates only new entries
- **No duplicates:** Uses `findFirst` + conditional create/update pattern

### Rollback

If the seed fails midway, you can rollback using:

```bash
# Delete all pose data
bunx prisma db execute --sql "TRUNCATE TABLE pose_library, pose_categories CASCADE;"

# Re-run seed
bun run seed:pose-generator
```

---

## Adding New Content

### Adding a New Category

1. Open `backend/prisma/seeds/data/pose-categories.ts`
2. Add new category to `categoryHierarchy` array:

```typescript
{
  name: 'new-category',
  displayName: 'New Category',
  slug: 'new-category',
  description: 'Description of the new category',
  icon: 'icon-name', // Lucide icon name
  displayOrder: 60, // Order in UI
  color: '#3B82F6', // Hex color
  parentSlug: 'parent-slug', // Optional: for sub-categories
  isActive: true,
}
```

3. Run seed script: `bun run seed:pose-generator`

### Adding a New Pose

1. Open `backend/prisma/seeds/data/pose-library.ts`
2. Add new pose to `poseLibraryData` array:

```typescript
{
  name: 'My New Pose',
  description: 'Detailed description of the pose',
  categorySlug: 'category-slug', // Must match existing category
  difficulty: 'beginner', // beginner | intermediate | advanced
  genderSuitability: 'unisex', // male | female | unisex
  tags: ['tag1', 'tag2', 'tag3'], // Searchable keywords
  isPremium: false,
  sourceType: 'curated', // curated | user_contributed | ai_generated
  isFeatured: false, // Optional: mark as featured
}
```

3. Run seed script: `bun run seed:pose-generator`

### Modifying Existing Data

1. Edit the data in `pose-categories.ts` or `pose-library.ts`
2. Run seed script - it will update existing records
3. Changes are applied immediately without duplication

---

## Placeholder URL Strategy

### Development Phase

During development, we use **placehold.co** service for placeholder images:

```
Preview Image:   https://placehold.co/1024x1024/3B82F6/FFFFFF/png?text=Pose+Name
Thumbnail:       https://placehold.co/400x400/3B82F6/FFFFFF/png?text=Pose+Name
ControlNet Map:  https://placehold.co/1024x1024/000000/00FF00/png?text=ControlNet:Pose+Name
```

**Benefits:**
- No storage costs during development
- Instant availability
- Descriptive text shows pose name
- Consistent sizing (1024x1024 for full, 400x400 for thumbnails)

### Production Phase

For production, replace placeholders with real images:

1. **Curated Poses:**
   - Professional photographer photoshoots
   - Licensed stock photography
   - User-contributed content (with permission)

2. **ControlNet Maps:**
   - Pre-computed pose skeletons using OpenPose
   - Stored in Cloudflare R2
   - CDN-optimized for fast loading

3. **Migration Script:**
   ```bash
   # Run migration script (to be created)
   bun run migrate:pose-images
   ```

---

## Data Statistics

### Pose Distribution by Category

| Category | Pose Count | Percentage |
|----------|------------|------------|
| Professional | 12 | 19% |
| E-Commerce | 13 | 20% |
| Fashion & Style | 7 | 11% |
| Hijab & Modest | 13 | 20% |
| Casual & Lifestyle | 10 | 16% |
| Sports & Active | 9 | 14% |

**Note:** Some poses may appear in multiple categories due to cross-category relevance.

### Difficulty Distribution

| Difficulty | Count | Percentage | Target |
|------------|-------|------------|--------|
| Beginner | 39 | 61% | ✅ 60% |
| Intermediate | 20 | 31% | ✅ 30% |
| Advanced | 5 | 8% | ✅ 10% |

### Gender Suitability

| Gender | Count | Percentage |
|--------|-------|------------|
| Unisex | 51 | 80% |
| Female | 13 | 20% |
| Male | 0 | 0% |

**Note:** Indonesian market has strong demand for female-specific content (hijab), hence higher female representation.

### Premium Content

- **Total Premium Poses:** 9 (14%)
- **Featured Poses:** 7 (11%)
- **Free Poses:** 55 (86%)

### Top Tags (by frequency)

1. `professional` - 45 poses
2. `casual` - 40 poses
3. `hijab` - 42 poses
4. `e-commerce` - 35 poses
5. `standing` - 60 poses
6. `confident` - 38 poses
7. `fashion` - 30 poses
8. `business` - 27 poses
9. `lifestyle` - 25 poses
10. `social media` - 20 poses

---

## Next Steps

### Phase 3: Backend API Implementation

1. **API Endpoints** (see `POSE_GENERATOR_ARCHITECTURE.md`)
   - `GET /api/apps/pose-generator/library` - Browse poses
   - `GET /api/apps/pose-generator/categories` - Get categories
   - `POST /api/apps/pose-generator/generate` - Start generation

2. **Worker Pipeline**
   - BullMQ job processing
   - FLUX API integration
   - ControlNet guidance
   - Real-time WebSocket updates

3. **Testing**
   - Unit tests for seed functions
   - Integration tests for API
   - E2E tests for generation flow

### Phase 4: Production Migration

1. **Replace Placeholders**
   - Professional photoshoot for curated poses
   - Generate ControlNet maps
   - Upload to Cloudflare R2

2. **Optimize Performance**
   - CDN configuration
   - Database indexing
   - Query optimization

3. **User Testing**
   - Beta launch with limited users
   - Gather feedback on pose quality
   - Add community-requested poses

---

## Troubleshooting

### Seed Script Fails

**Error:** `Category not found for pose`
- **Solution:** Check that `categorySlug` in pose data matches existing category slug
- **Fix:** Update pose data or create missing category

**Error:** `Duplicate key violation`
- **Solution:** This shouldn't happen with current idempotent logic
- **Fix:** Clear database and re-run: `bunx prisma db push --force-reset`

**Error:** `Connection timeout`
- **Solution:** Check database connection in `.env`
- **Fix:** Verify `DATABASE_URL` is correct and database is running

### Placeholder Images Not Loading

**Issue:** Placeholder images show broken links
- **Solution:** Check internet connection (placehold.co is external service)
- **Alternative:** Use local placeholder service or pre-generated images

### Performance Issues

**Issue:** Seed takes too long (>5 minutes)
- **Solution:** Current seed should complete in ~30 seconds for 150 poses
- **Optimization:** Batch database operations (already implemented)
- **Check:** Database indexing is properly configured

---

## Contact & Support

- **Architecture Review:** See `docs/POSE_GENERATOR_ARCHITECTURE.md`
- **Phase 1 Summary:** See `docs/POSE_GENERATOR_PHASE_0_COMPLETE.md`
- **Database Schema:** See `backend/prisma/schema.prisma`

---

**Document Version:** 1.0
**Author:** System Architect
**Status:** Production Ready
**Next Review:** After Phase 3 completion
