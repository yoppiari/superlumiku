# Lumiku Platform - Architecture Documentation

This directory contains comprehensive architecture documentation for the Lumiku platform and its applications.

## Navigation

### Platform Architecture
- **[Platform Overview](./overview.md)** - High-level platform architecture, plugin system, and core infrastructure
- **[Subscription System](./subscription-system.md)** - Dual user system (PAYG vs Subscription), quotas, and model access control

### Application-Specific Architecture

#### Avatar Creator (October 2025 Review)
- **[Executive Summary](./AVATAR_CREATOR_EXECUTIVE_SUMMARY.md)** - Quick overview, key findings, and action plan (15-minute read)
- **[Full Architecture Review](./AVATAR_CREATOR_ARCHITECTURE_REVIEW.md)** - Comprehensive 13-section analysis (45-minute read)
- **[Architecture Diagrams](./AVATAR_CREATOR_DIAGRAMS.md)** - Visual representations, sequence diagrams, and system flows

---

## Avatar Creator - Quick Reference

### Health Score: 7.5/10
**Status:** Production-ready for < 500 users, needs optimization for scale

### Critical Issues
1. **Frontend polling bottleneck** (400 req/s at 1K users)
2. **Worker concurrency too low** (only 2 concurrent generations)
3. **Credit system disabled** (business requirement incomplete)

### Architecture Strengths
- Clean layered architecture (Routes → Service → Repository → DB)
- Type-safe TypeScript throughout
- Background worker pattern with BullMQ
- Comprehensive database indexing (40+ indexes)
- Good separation of concerns

### Immediate Action Required
**Sprint 1 (Weeks 1-2):**
- Replace polling with WebSockets/SSE
- Enable credit system
- Scale workers to 3+ instances
- Add rate limiting

**Estimated Effort:** 8-9 developer-days
**Expected Outcome:** Ready for 1,000+ concurrent users

---

## Document Structure

### Executive Summary
- **Target Audience:** Product managers, tech leads, stakeholders
- **Reading Time:** 10-15 minutes
- **Content:** Key findings, critical issues, ROI analysis, action plan

### Full Architecture Review
- **Target Audience:** Senior developers, architects, technical leadership
- **Reading Time:** 45-60 minutes
- **Content:**
  - System architecture analysis
  - Database design assessment
  - Scalability evaluation
  - Integration patterns
  - Technical debt inventory
  - Refactoring recommendations
  - Performance benchmarks
  - Risk assessment

### Architecture Diagrams
- **Target Audience:** All technical team members
- **Reading Time:** 30 minutes
- **Content:**
  - High-level system architecture
  - Sequence diagrams (request flows)
  - Database ERD
  - Component breakdown
  - State management
  - File storage architecture
  - Scalability bottleneck visualizations
  - Security layers

---

## Key Metrics & Targets

### Current Performance
| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Max concurrent users | ~500 | 1,000+ | 2x improvement needed |
| Avatar generation time | 30-60s | < 30s | 2x improvement needed |
| API response time | 200ms | < 100ms | 2x improvement needed |
| Worker throughput | 4 gen/min | 40+ gen/min | 10x improvement needed |

### After Priority Fixes
| Metric | Phase 1 | Phase 2 | Phase 3 |
|--------|---------|---------|---------|
| Concurrent users | 5,000 | 50,000 | 100,000+ |
| Generations/min | 40 | 400 | 4,000+ |
| API req/s | 2,000 | 10,000 | 50,000+ |

---

## Architecture Patterns Used

### Backend Patterns
- **Layered Architecture:** Routes → Services → Repository → Database
- **Repository Pattern:** Data access abstraction with Prisma
- **Service Layer Pattern:** Business logic orchestration
- **Provider Pattern:** AI provider abstraction (FLUX)
- **Background Worker Pattern:** BullMQ for async processing
- **Plugin Architecture:** In-memory registry for modular apps

### Frontend Patterns
- **State Management:** Zustand with Immer middleware
- **Component Composition:** React functional components
- **Custom Hooks:** Reusable logic extraction
- **Modal Pattern:** Overlay UI components
- **Polling Pattern:** (⚠️ Needs replacement with push-based)

### Database Patterns
- **Cascade Deletes:** Automatic cleanup of dependent records
- **Soft Deletes:** (Not implemented, but recommended)
- **Audit Trails:** Usage history tracking
- **Denormalization:** Preset fields for query performance
- **JSON Fields:** Flexible metadata storage

---

## Technology Stack

### Backend
- **Runtime:** Bun (JavaScript runtime)
- **Framework:** Hono (lightweight web framework)
- **Database:** PostgreSQL with Prisma ORM
- **Queue:** BullMQ (Redis-backed job queue)
- **Cache:** Redis (for queues, not yet for caching)
- **File Processing:** Sharp (image manipulation)
- **AI:** Hugging Face API (FLUX.1-dev model)

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

### Infrastructure
- **Database:** PostgreSQL 15+
- **Cache/Queue:** Redis 7+
- **Storage:** Local filesystem (⚠️ Needs S3 migration)
- **Deployment:** (To be documented)

---

## Security Considerations

### Implemented ✅
- JWT authentication on all endpoints
- User ownership verification in service layer
- File type and size validation
- User-isolated file storage directories
- SQL injection protection (via Prisma)

### Missing ⚠️
- Rate limiting (per user, per IP)
- Input validation with schemas (Zod recommended)
- NSFW content detection
- Virus scanning for uploads
- Credit system enforcement

### Recommended
- Add rate limiting middleware
- Implement Zod validation schemas
- Add content moderation service
- Enable credit checks before generation
- Add audit logging for sensitive operations

---

## Scalability Roadmap

### Phase 1: Foundation (Weeks 1-4)
**Goal:** Handle 1,000 concurrent users
- Replace polling with WebSockets
- Horizontal worker scaling (3 instances)
- Enable credit system
- Add rate limiting
- Implement caching layer

**Infrastructure:**
- 3 worker instances
- 1 primary database
- Redis (cache + queue)
- Local file storage

### Phase 2: Optimization (Months 2-3)
**Goal:** Handle 10,000 concurrent users
- Object storage migration (S3)
- Database read replicas (2x)
- Frontend component refactoring
- Query optimization
- CDN integration

**Infrastructure:**
- 10 worker instances
- 1 primary + 2 read replicas
- Multi-region Redis
- S3 + CloudFront CDN

### Phase 3: Enterprise Scale (Months 4-6)
**Goal:** Handle 100,000 concurrent users
- Database sharding
- Multi-region deployment
- Advanced caching (edge)
- Priority queues
- Multi-provider AI (fallback)

**Infrastructure:**
- 50+ worker instances
- Sharded database cluster
- Global CDN
- Multi-region Redis
- Load balancers

---

## Testing Strategy

### Current State ⚠️
- No unit tests visible
- No integration tests
- No E2E tests
- Manual testing only

### Recommended
**Unit Tests:**
- Service layer functions (business logic)
- Repository queries
- Prompt builder
- File processing utilities

**Integration Tests:**
- API endpoints
- Database operations
- Queue job processing
- File upload/download

**E2E Tests:**
- User flows (create project → upload → generate)
- Cross-app integration (avatar → pose generator)
- Error scenarios

**Performance Tests:**
- Load testing (concurrent users)
- Stress testing (peak load)
- Endurance testing (sustained load)

---

## Monitoring & Observability

### Current State ⚠️
- Basic console logging
- No metrics collection
- No alerting
- No APM (Application Performance Monitoring)

### Recommended Implementation

**Logging:**
- Structured logging (JSON format)
- Log levels (DEBUG, INFO, WARN, ERROR)
- Request correlation IDs
- Centralized log aggregation

**Metrics:**
- Generation success/failure rate
- Average generation time
- Queue depth
- Database connection pool usage
- API response times
- Worker utilization

**Alerting:**
- Failed generation rate > 5%
- Queue depth > 100
- API error rate > 1%
- Database connection pool > 80%

**Tools:**
- Prometheus (metrics collection)
- Grafana (dashboards)
- Sentry (error tracking)
- Datadog/New Relic (APM)

---

## Cost Optimization

### Current Costs (Estimated)
- **FLUX API:** $0.05-0.10 per generation
- **Database:** $50-100/month (single instance)
- **Storage:** ~$10/month (100 GB local)
- **Redis:** $20/month
- **Compute:** Variable (workers)

### Optimization Opportunities
1. **Batch generations:** Reduce API calls
2. **Image compression:** Reduce storage costs
3. **Smart caching:** Reduce redundant generations
4. **Read replicas:** Distribute read load
5. **Auto-scaling:** Scale workers based on demand

### Cost Projections
| Load | Users | Gen/Month | FLUX Cost | Infra Cost | Total |
|------|-------|-----------|-----------|------------|-------|
| Small | 1,000 | 30,000 | $1,500 | $300 | $1,800 |
| Medium | 10,000 | 300,000 | $15,000 | $1,500 | $16,500 |
| Large | 100,000 | 3,000,000 | $150,000 | $10,000 | $160,000 |

---

## Related Documentation

### API Documentation
- [API Reference](../api/README.md) - Complete API endpoint documentation

### Development Guides
- [Development Setup](../DEVELOPMENT_SETUP.md) - Local development environment
- [Development Guide](../DEVELOPMENT_GUIDE.md) - Best practices and workflows
- [Coding Standards](../CODING_STANDARDS.md) - Code style and conventions

### Application Documentation
- [Avatar Creator Docs](../../backend/src/apps/avatar-creator/README.md) - Application-specific documentation

### Testing
- [Test Checklist](../TEST_CHECKLIST.md) - Manual testing procedures

---

## Contact & Contribution

### Architecture Review Team
- **Last Review:** October 14, 2025
- **Next Review:** January 2026 (post-optimization)
- **Reviewer:** Claude Architecture Review System v1.0

### Contributing
- Request architecture review for new features
- Document significant architectural decisions
- Update diagrams when system changes
- Follow established patterns

### Questions?
- Technical architecture: [Architecture team]
- Application-specific: [Development team]
- Infrastructure: [DevOps team]

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Oct 14, 2025 | Initial Avatar Creator architecture review | Claude |
| - | - | Platform overview documentation | Previous |
| - | - | Subscription system documentation | Previous |

---

## Quick Links

- [Back to Docs Home](../README.md)
- [Avatar Creator Executive Summary](./AVATAR_CREATOR_EXECUTIVE_SUMMARY.md)
- [Avatar Creator Full Review](./AVATAR_CREATOR_ARCHITECTURE_REVIEW.md)
- [Avatar Creator Diagrams](./AVATAR_CREATOR_DIAGRAMS.md)
- [Platform Overview](./overview.md)
- [Subscription System](./subscription-system.md)
