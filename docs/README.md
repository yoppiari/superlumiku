# Lumiku App Documentation Hub

Welcome to the Lumiku App documentation! This is your central hub for all technical documentation.

## Quick Navigation

### By Role

**For Developers:**
- [Getting Started](../README.md#getting-started)
- [Development Guide](./development/development-guide.md)
- [Architecture Overview](./architecture/overview.md)
- [API Reference](./api/README.md)
- [Database Schema](./architecture/database-schema.md)

**For DevOps/Operations:**
- [Production Deployment Guide](./deployment/production-deployment.md)
- [Environment Variables](./deployment/environment-variables.md)
- [Security Overview](./security/security-overview.md)
- [Monitoring & Troubleshooting](./troubleshooting/common-issues.md)

**For Product/Business:**
- [Subscription System](./architecture/subscription-system.md)
- [App Documentation](./apps/README.md)
- [Pricing & Credits](./architecture/subscription-system.md#pricing)

### By Topic

## Architecture & Design

- **[Architecture Overview](./architecture/overview.md)** - Complete system architecture with all 8 apps
- **[Subscription System](./architecture/subscription-system.md)** - PAYG vs Subscription models, quotas, and tiers
- **[Database Schema](./architecture/database-schema.md)** - Complete database documentation (35+ models)
- **[Plugin System](./PLUGIN_ARCHITECTURE.md)** - How apps are structured and registered
- **[Authentication & Authorization](./security/authorization-system.md)** - JWT and role-based access

## Applications (8 Apps)

**Content Creation:**
- **[Video Mixer](./apps/video-mixer.md)** - Mix multiple videos with anti-fingerprinting features
- **[Carousel Mix](./apps/carousel-mix.md)** - Generate carousel posts automatically
- **[Looping Flow](./apps/looping-flow.md)** - Create seamless video loops with audio layers
- **[Video Generator](./apps/video-generator.md)** - AI-powered video generation
- **[Poster Editor](./apps/poster-editor.md)** - AI-powered image editing and inpainting

**Avatar & Character:**
- **[Avatar Creator](./apps/avatar-creator.md)** - Create AI avatars with full persona system
- **[Avatar Generator](./apps/avatar-generator.md)** - Generate avatar variations
- **[Pose Generator](./apps/pose-generator.md)** - Generate avatar poses

## API Documentation

- **[API Overview](./api/README.md)** - Complete API reference
- **[Authentication API](./api/authentication.md)** - Auth endpoints
- **[Subscription API](./api/subscriptions.md)** - Subscription management
- **[Credits API](./api/credits.md)** - Credit system for PAYG users
- **[Quotas API](./api/quotas.md)** - Quota system for subscription users
- **[Payments API](./api/payments.md)** - Duitku payment integration
- **[Admin API](./api/admin.md)** - Administrative endpoints
- **[Stats API](./api/stats.md)** - Usage statistics and analytics

## Development

- **[Development Guide](./development/development-guide.md)** - Setup and workflow
- **[Adding New Apps](./ADD_NEW_APP_PROMPT.md)** - How to add new apps
- **[Database Migrations](./development/database-migrations.md)** - Migration workflow
- **[UI Standards](./UI_STANDARDS.md)** - Frontend conventions
- **[Testing Guide](./development/testing.md)** - Testing strategies

## Deployment

- **[Production Deployment](./deployment/production-deployment.md)** - Complete deployment guide
- **[Environment Variables](./deployment/environment-variables.md)** - All 80+ environment variables
- **[Secrets Management](./deployment/secrets-management.md)** - Managing sensitive data
- **[Coolify Setup](./deployment/coolify-setup.md)** - Coolify-specific instructions
- **[Redis Setup](./deployment/redis-setup.md)** - Redis configuration

## Security

- **[Security Overview](./security/security-overview.md)** - Security architecture
- **[Authorization System](./AUTHORIZATION_SYSTEM.md)** - Role-based access control
- **[Payment Security](./PAYMENT_SECURITY.md)** - Payment gateway security
- **[Rate Limiting](./RATE_LIMITING.md)** - API rate limiting configuration

## Reference

- **[Environment Variables](./ENVIRONMENT_VARIABLES.md)** - Complete variable reference
- **[Database Models](./architecture/database-schema.md)** - All Prisma models
- **[Error Codes](./reference/error-codes.md)** - API error reference
- **[Component Library](./reference/component-library.md)** - Reusable UI components

## Troubleshooting

- **[Common Issues](./troubleshooting/common-issues.md)** - Frequently encountered problems
- **[Debugging Guide](./troubleshooting/debugging-guide.md)** - How to debug issues
- **[FAQ](./troubleshooting/faq.md)** - Frequently asked questions

## Archive

- **[October 2025 Archive](./archive/2025-10/)** - Historical documentation and reports
  - [Implementation Reports](./archive/2025-10/implementation-reports/)
  - [Deployment Reports](./archive/2025-10/deployment-reports/)
  - [Weekly Progress](./archive/2025-10/weekly-progress/)

---

## Documentation Standards

All documentation follows these standards:

### File Naming
- Use lowercase with hyphens: `database-schema.md`
- Exceptions: `README.md`, `CHANGELOG.md` (industry standards)

### Frontmatter
All documentation files should include:
```markdown
---
title: Document Title
description: Brief description
last_updated: 2025-10-14
version: 1.0.0
status: current
---
```

### Organization
- **Architecture**: System design and technical architecture
- **API**: Endpoint documentation and API guides
- **Apps**: Individual app documentation
- **Deployment**: Production and deployment guides
- **Development**: Development workflow and guides
- **Security**: Security documentation
- **Reference**: Quick reference materials
- **Troubleshooting**: Problem-solving guides
- **Archive**: Historical documentation

## Need Help?

**Can't find what you're looking for?**
1. Check the section most relevant to your role (above)
2. Use your editor's search (Ctrl+Shift+F or Cmd+Shift+F)
3. Check the [Archive](./archive/2025-10/) for older documentation
4. Ask in team chat or create an issue

**Found outdated documentation?**
1. Update the documentation
2. Update the `last_updated` field in frontmatter
3. Create a PR with your changes

**Missing documentation?**
1. Create an issue with the "documentation" label
2. Or contribute! See [Development Guide](./development/development-guide.md)

---

**Documentation Status:** Reorganized 2025-10-14
**Next Review:** 2025-11-14
**Maintainer:** Technical Team
