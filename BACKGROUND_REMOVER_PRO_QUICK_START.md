# Background Remover Pro - Quick Start Guide

## Overview

Complete implementation specification for Background Remover Pro - an enterprise-grade AI-powered background removal service for Lumiku Platform.

## Key Features

1. **4 Quality Tiers**
   - Basic: 3 credits (RMBG-1.4 HuggingFace)
   - Standard: 8 credits (RMBG-2.0 HuggingFace)
   - Professional: 15 credits (BiRefNet-General Segmind)
   - Industry: 25 credits (BiRefNet-Portrait Segmind)

2. **Batch Processing**
   - 2-500 images per batch
   - Volume discounts: 5-20%
   - BullMQ + Redis queue system

3. **Hybrid Pricing Model**
   - Subscription: Rp 99K (Starter) or Rp 299K (Pro) per month
   - Credit-based: Pay per image as fallback
   - 92-95% profit margins

4. **Cross-App Integration**
   - Avatar Creator batch processing
   - Pose Generator auto-remove
   - Image Upscaler Pro pipeline
   - Carousel Mix integration

## Documentation Files

1. **BACKGROUND_REMOVER_PRO_IMPLEMENTATION_SPEC.md** (Main spec - 12 sections)
   - Complete database schema (4 Prisma models)
   - Plugin configuration
   - API routes & endpoints (16+ endpoints)
   - Service layer architecture (Pricing, AI Provider, Subscription)
   - Queue worker implementation (BullMQ)
   - Frontend components & Zustand store
   - Integration endpoints for other apps
   - Credit pricing logic & decision tree
   - Environment variables
   - Deployment checklist
   - Performance targets

2. **BACKGROUND_REMOVER_PRO_DOCUMENTATION_INDEX.md** (Original docs)
   - Overview and architecture
   - 6,000+ lines of documentation
   - Implementation guide references

3. **BACKGROUND_REMOVER_API_DOCUMENTATION.md**
   - Complete REST API reference
   - 16+ endpoints with examples
   - Error handling and rate limiting

4. **BACKGROUND_REMOVER_PRICING_LOGIC.md**
   - Tier pricing breakdown
   - Volume discount formulas
   - Subscription model details
   - Break-even analysis

5. **BACKGROUND_REMOVER_QUEUE_DEPLOYMENT_TESTING_INTEGRATION_FRONTEND_RISK.md**
   - Queue system (BullMQ)
   - Deployment guide (Docker, Coolify)
   - Testing strategy
   - Integration patterns
   - Frontend components
   - Risk mitigation

## Implementation Steps

### Quick Setup (For lumiku-app-builder agent)

```bash
# 1. Copy main specification
cat BACKGROUND_REMOVER_PRO_IMPLEMENTATION_SPEC.md

# 2. Follow 8-phase implementation:
#    Phase 1: Database (Prisma migrations)
#    Phase 2: Backend (Services, handlers, routes)
#    Phase 3: Queue System (BullMQ worker)
#    Phase 4: Frontend (React components, Zustand store)
#    Phase 5: Integration (Cross-app endpoints)
#    Phase 6: Testing (Unit, integration, load tests)
#    Phase 7: Deployment (Production setup)
#    Phase 8: Monitoring (Health checks, alerts)

# 3. Follow deployment checklist in spec (40+ checkboxes)
```

## Technology Stack

**Backend**:
- Hono.js (Express alternative)
- Prisma ORM + PostgreSQL
- BullMQ + Redis (queue)
- HuggingFace + Segmind (AI APIs)
- Sharp (image processing)

**Frontend**:
- React + TypeScript
- Zustand (state management)
- TailwindCSS
- Lucide icons

**Infrastructure**:
- Coolify (deployment)
- PM2 (process management)
- Sentry (monitoring)

## Key Files to Create

### Backend
```
backend/src/plugins/background-remover/
├── plugin.config.ts                    # Plugin registration
├── routes.ts                           # API routes
├── services/
│   ├── pricing.service.ts             # Volume discounts
│   ├── ai-provider.service.ts         # HuggingFace + Segmind
│   ├── subscription.service.ts        # Quota tracking
│   └── storage.service.ts             # File management
├── handlers/
│   ├── removal.handlers.ts            # Single + batch removal
│   ├── subscription.handlers.ts       # Subscribe/cancel
│   ├── integration.handlers.ts        # Cross-app endpoints
│   └── stats.handlers.ts              # Analytics
└── queue/
    ├── config.ts                       # Redis connection
    └── worker.ts                       # Batch processor
```

### Frontend
```
frontend/src/
├── stores/
│   └── background-remover.store.ts    # Zustand store
└── pages/apps/background-remover/
    ├── BackgroundRemoverPro.tsx       # Main component
    └── components/
        ├── TierSelector.tsx           # Quality tier picker
        ├── FileUploader.tsx           # Drag-drop (500 files)
        ├── PricingCalculator.tsx      # Real-time cost
        ├── ProgressTracker.tsx        # Batch progress
        └── SubscriptionCard.tsx       # Quota display
```

### Database
```prisma
// Add to backend/prisma/schema.prisma
BackgroundRemovalJob              // Individual jobs
BackgroundRemovalBatch            // Batch container
BackgroundRemoverSubscription     // Subscription plans
BackgroundRemoverSubscriptionUsage // Daily quota tracking
```

## Environment Variables

```bash
# Add to backend/.env
HUGGINGFACE_API_KEY=hf_xxxxx
SEGMIND_API_KEY=SG_xxxxx
REDIS_HOST=localhost
REDIS_PORT=6379
STORAGE_DIR=./storage
MAX_FILE_SIZE_MB=10
MAX_BATCH_SIZE_GB=2
```

## Testing Requirements

1. **Unit Tests** (80% coverage)
   - Pricing service (20+ test cases)
   - Subscription quota logic
   - Volume discount calculations

2. **Integration Tests** (15% coverage)
   - API endpoints
   - Credit deduction race conditions
   - Subscription quota reset

3. **Load Tests** (5% coverage)
   - 500-image batch processing
   - Concurrent API requests
   - Worker performance

## Performance Targets

- Single image: 2-5 seconds (tier-dependent)
- Batch (100 images): 10-15 minutes
- Batch (500 images): 45-60 minutes
- Success rate: 98%+
- Profit margin: 92-95%
- Uptime: 99.5%+

## Pricing Examples

**Single Image**:
- Basic: 3 credits = Rp 300
- Standard: 8 credits = Rp 800
- Professional: 15 credits = Rp 1,500
- Industry: 25 credits = Rp 2,500

**Batch Pricing (100 images @ Standard)**:
- Base: 100 × 8 = 800 credits
- Discount: 10% (51-100 range) = -80 credits
- Final: 720 credits = Rp 72,000 (7.2 credits per image)

**Subscription ROI**:
- Starter (Rp 99K): Break-even at 124 Standard images/month (4.1/day)
- Pro (Rp 299K): Break-even at 199 Professional images/month (6.6/day)

## Integration Use Cases

1. **Avatar Creator**: Remove backgrounds from all 12 avatars in project
   - Cost: 12 × 15 = 180 credits (no discount < 20 images)

2. **Pose Generator**: Auto-remove after pose generation
   - Cost: 8 credits (Standard tier)

3. **Image Upscaler**: Pipeline processing (remove → upscale)
   - Cost: 15 (remove) + upscale cost

4. **Carousel Mix**: Remove from 8 carousel slides
   - Cost: 8 × 8 = 64 credits (no discount)

## Next Steps

### For Developers
1. Read `BACKGROUND_REMOVER_PRO_IMPLEMENTATION_SPEC.md` (complete spec)
2. Follow 8-phase implementation guide
3. Use deployment checklist (40+ items)
4. Run test suite
5. Deploy to production

### For lumiku-app-builder Agent
```
Pass this command:
"Build Background Remover Pro following the complete specification in BACKGROUND_REMOVER_PRO_IMPLEMENTATION_SPEC.md. Follow all 8 phases, implement all 4 database models, create all services, handlers, and frontend components as specified."
```

## Support Resources

**Documentation**:
- Main Spec: `BACKGROUND_REMOVER_PRO_IMPLEMENTATION_SPEC.md`
- API Reference: `BACKGROUND_REMOVER_API_DOCUMENTATION.md`
- Pricing Logic: `BACKGROUND_REMOVER_PRICING_LOGIC.md`
- Queue & Deployment: `BACKGROUND_REMOVER_QUEUE_DEPLOYMENT_TESTING_INTEGRATION_FRONTEND_RISK.md`

**External APIs**:
- HuggingFace: https://huggingface.co/docs/api-inference
- Segmind: https://docs.segmind.com/
- BullMQ: https://docs.bullmq.io/

**Status**: ✅ Ready for Implementation

**Estimated Implementation Time**: 2-3 weeks (2 developers)

---

Last Updated: January 2025
Version: 1.0.0
