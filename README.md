# Lumiku App

Modern AI-powered content creation platform with credit and subscription-based access control.

## Overview

Lumiku App is a full-stack SaaS platform that provides multiple AI-powered applications for content creation. The platform supports both pay-as-you-go (credit-based) and subscription-based user models, with granular access control to AI models based on subscription tiers.

## Key Features

- **Dual User System**: Pay-as-you-go (PAYG) and Subscription-based access
- **Multi-Tier Subscriptions**: Free, Basic, Pro, Enterprise tiers with different model access
- **AI Model Registry**: Centralized management of AI models across all apps
- **Quota Management**: Daily quota tracking with automatic reset for subscription users
- **Credit System**: Flexible credit-based billing for PAYG users
- **Background Jobs**: Automated quota resets and subscription management
- **Production-Ready Security**: Comprehensive rate limiting, input validation, and authentication

## Applications

### Video Mixer
Mix and generate multiple video variations with anti-fingerprinting capabilities.
- Upload multiple videos and organize into groups
- Configure mixing strategies (shuffle, fixed start, group mixing)
- Quality settings (resolution, bitrate, frame rate, aspect ratio)
- Speed variations and metadata customization
- Bulk video generation with background processing

### Carousel Mix
Generate Instagram/social media carousel variations with images and text.
- Position-based image and text management
- Advanced text styling (font, size, color, positioning)
- Multiple text variations per position
- Batch generation of carousel sets
- ZIP export with all variations

### Looping Flow
Create seamless looping videos with crossfade and multi-layer audio.
- Perfect seamless loops with crossfade
- Multi-layer audio mixing (up to 4 layers)
- Boomerang and simple loop styles
- Audio fade in/out controls
- Target duration configuration

### Avatar Creator
Generate and manage AI avatars with persona information.
- Text-to-image avatar generation
- Upload custom avatar images
- Persona management (age, personality, background)
- Visual attribute tracking
- Usage history across apps

### Avatar Generator (Flux)
Quick AI avatar generation using Flux models.
- Simple prompt-based generation
- Multiple Flux model options
- Fast generation times

## Technology Stack

### Backend
- **Runtime**: Bun (v1.0+)
- **Framework**: Hono (lightweight web framework)
- **Database**: PostgreSQL with Prisma ORM
- **Queue System**: BullMQ with Redis
- **Authentication**: JWT-based auth with bcrypt
- **Video Processing**: FFmpeg
- **AI Services**: Anthropic Claude, ModelsLab, Eden AI
- **Payment Gateway**: Duitku (Indonesian payment processor)

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router 7
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Prerequisites

- **Bun** v1.0+ ([Install Bun](https://bun.sh))
- **Node.js** v18+ (for some dependencies)
- **PostgreSQL** 14+ (production) or SQLite (development)
- **Redis** 6+ (required for production)
- **FFmpeg** 4.4+ (for video processing)

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/yoppiari/superlumiku.git
cd lumiku-app
```

### 2. Install Dependencies

```bash
# Install root dependencies
bun install

# Dependencies are automatically installed for backend and frontend (workspaces)
```

### 3. Setup Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# Minimum required:
# - DATABASE_URL
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - CORS_ORIGIN
```

See [ENVIRONMENT_VARIABLES.md](C:\Users\yoppi\Downloads\Lumiku App\docs\ENVIRONMENT_VARIABLES.md) for complete reference.

### 4. Setup Database

```bash
# Generate Prisma Client
bun prisma:generate

# Run database migrations
bun prisma:migrate

# Seed database with test data
bun seed
```

### 5. Start Development Servers

```bash
# Start both backend and frontend
bun dev

# Or start separately:
bun dev:backend   # Backend on http://localhost:3000
bun dev:frontend  # Frontend on http://localhost:5173
```

### 6. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health
- **Prisma Studio**: `bun prisma:studio` (http://localhost:5555)

### Test Credentials

After running `bun seed`, use these credentials:

```
Email: test@lumiku.com
Password: password123
Initial Credits: 100
```

## Project Structure

```
lumiku-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── migrations/            # Migration history
│   │   └── seed.ts                # Database seeding
│   ├── src/
│   │   ├── app.ts                 # Hono app setup
│   │   ├── index.ts               # Server entry point
│   │   ├── config/
│   │   │   └── env.ts             # Environment validation (Zod)
│   │   ├── core/
│   │   │   ├── auth/              # Authentication logic
│   │   │   ├── middleware/        # Auth, rate limiting, CORS
│   │   │   └── validation/        # Zod schemas
│   │   ├── routes/
│   │   │   ├── auth.routes.ts     # Authentication endpoints
│   │   │   ├── credit.routes.ts   # Credit management
│   │   │   ├── subscription.routes.ts  # Subscription management
│   │   │   ├── quota.routes.ts    # Quota tracking
│   │   │   ├── payment.routes.ts  # Payment processing
│   │   │   └── admin.routes.ts    # Admin endpoints
│   │   ├── apps/
│   │   │   ├── video-mixer/       # Video Mixer app
│   │   │   ├── carousel-mix/      # Carousel Mix app
│   │   │   ├── looping-flow/      # Looping Flow app
│   │   │   └── avatar-creator/    # Avatar Creator app
│   │   ├── services/              # Business logic
│   │   ├── workers/               # Background job processors
│   │   ├── jobs/                  # Cron jobs (quota reset, etc.)
│   │   ├── lib/                   # Utilities (redis, storage, ffmpeg)
│   │   └── db/                    # Prisma client
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Page components
│   │   │   ├── Dashboard.tsx      # Main dashboard
│   │   │   ├── Login.tsx          # Authentication
│   │   │   └── Settings.tsx       # User settings
│   │   ├── apps/                  # App-specific UIs
│   │   │   ├── VideoMixer.tsx     # Video Mixer UI
│   │   │   ├── CarouselMix.tsx    # Carousel Mix UI
│   │   │   ├── LoopingFlow.tsx    # Looping Flow UI
│   │   │   └── AvatarCreator.tsx  # Avatar Creator UI
│   │   ├── components/            # Reusable components
│   │   ├── lib/
│   │   │   └── api.ts             # API client (axios)
│   │   ├── stores/                # Zustand stores
│   │   │   └── authStore.ts       # Auth state management
│   │   ├── App.tsx                # Root component with routing
│   │   └── main.tsx               # Entry point
│   └── package.json
├── docs/                          # Documentation
│   ├── DEVELOPMENT_GUIDE.md       # Development workflow
│   ├── ENVIRONMENT_VARIABLES.md   # Env var reference
│   ├── KNOWN_ISSUES.md            # Known bugs and issues
│   ├── TEST_CHECKLIST.md          # Testing procedures
│   ├── api/                       # API documentation
│   └── apps/                      # App-specific docs
└── package.json                   # Workspace root
```

## Available Commands

### Root Level

```bash
# Development
bun dev                  # Start both backend and frontend
bun dev:backend          # Start backend only (port 3000)
bun dev:frontend         # Start frontend only (port 5173)

# Build
bun build                # Build both backend and frontend
bun build:backend        # Build backend only
bun build:frontend       # Build frontend for production

# Database
bun prisma:generate      # Generate Prisma Client
bun prisma:migrate       # Run database migrations (dev)
bun prisma:studio        # Open Prisma Studio GUI
bun seed                 # Seed database with test data

# Utilities
bun clean                # Remove all node_modules
```

### Backend Commands

```bash
cd backend

# Development
bun run dev              # Start with hot reload

# Database
bun prisma generate      # Generate Prisma Client
bun prisma migrate dev   # Create and apply migration
bun prisma migrate deploy # Apply migrations (production)
bun prisma studio        # Open Prisma Studio
bun prisma db seed       # Run seeding

# Build
bun run build            # Build for production
bun run start            # Start production build
```

### Frontend Commands

```bash
cd frontend

# Development
bun run dev              # Start Vite dev server

# Build
bun run build            # Build for production
bun run preview          # Preview production build
```

## Database Schema

The application uses PostgreSQL with the following main models:

### User Management
- **User**: User accounts with role and account type
- **Session**: JWT session tracking
- **Device**: Device management for multi-device support

### Billing & Access Control
- **Credit**: Credit transaction ledger
- **Payment**: Payment transactions (Duitku)
- **Subscription**: User subscriptions
- **SubscriptionPlan**: Subscription tier definitions
- **QuotaUsage**: Daily/monthly quota tracking
- **AIModel**: Centralized AI model registry
- **ModelUsage**: Model usage analytics

### Applications
- **VideoMixerProject**, **VideoMixerVideo**, **VideoMixerGeneration**
- **CarouselProject**, **CarouselSlide**, **CarouselText**, **CarouselGeneration**
- **LoopingFlowProject**, **LoopingFlowVideo**, **LoopingFlowGeneration**
- **AvatarProject**, **Avatar**, **AvatarGeneration**

### Common
- **App**: App registry for stats
- **AppUsage**: Cross-app usage tracking

## Environment Variables

Critical environment variables (see [ENVIRONMENT_VARIABLES.md](C:\Users\yoppi\Downloads\Lumiku App\docs\ENVIRONMENT_VARIABLES.md) for complete list):

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lumiku"

# Security
JWT_SECRET="<generated-secret-min-32-chars>"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"

# Payment (Duitku)
DUITKU_MERCHANT_CODE="<your-merchant-code>"
DUITKU_API_KEY="<your-api-key>"
DUITKU_ENV="sandbox"  # or "production"
DUITKU_CALLBACK_URL="http://localhost:3000/api/payment/callback"
DUITKU_RETURN_URL="http://localhost:5173/dashboard"

# Redis (required in production)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# AI Services (optional)
ANTHROPIC_API_KEY="<your-key>"
MODELSLAB_API_KEY="<your-key>"
EDENAI_API_KEY="<your-key>"

# Storage
UPLOAD_PATH="./uploads"
OUTPUT_PATH="./outputs"
MAX_FILE_SIZE="524288000"  # 500MB

# FFmpeg
FFMPEG_PATH="ffmpeg"
FFPROBE_PATH="ffprobe"
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Credits & Payments
- `GET /api/credits/balance` - Get credit balance (protected)
- `GET /api/credits/history` - Get credit history (protected)
- `POST /api/payment/create` - Create payment transaction
- `POST /api/payment/callback` - Payment callback (Duitku webhook)

### Subscriptions & Quotas
- `GET /api/subscription/plans` - Get available subscription plans
- `GET /api/subscription/status` - Get user subscription status (protected)
- `POST /api/subscription/subscribe` - Subscribe to plan (protected)
- `GET /api/quota/status` - Get quota usage (protected)
- `GET /api/quota/history` - Get quota history (protected)

### Apps
Each app has its own route prefix under `/api/apps/{app-name}`:
- `/api/apps/video-mixer/*`
- `/api/apps/carousel-mix/*`
- `/api/apps/looping-flow/*`
- `/api/apps/avatar-creator/*`

See [API_REFERENCE.md](C:\Users\yoppi\Downloads\Lumiku App\docs\api\README.md) for complete API documentation.

## Development Workflow

### Adding a New Feature

1. **Create Database Migration** (if needed)
   ```bash
   # Edit backend/prisma/schema.prisma
   bun prisma:migrate --name add-feature-x
   ```

2. **Create Backend Route**
   ```typescript
   // backend/src/routes/feature.routes.ts
   import { Hono } from 'hono'
   import { authMiddleware } from '../core/middleware/auth.middleware'

   const routes = new Hono()

   routes.get('/feature', authMiddleware, async (c) => {
     // Implementation
   })

   export default routes
   ```

3. **Register Route in App**
   ```typescript
   // backend/src/app.ts
   import featureRoutes from './routes/feature.routes'
   app.route('/api/feature', featureRoutes)
   ```

4. **Create Frontend Component**
   ```tsx
   // frontend/src/pages/Feature.tsx
   export default function Feature() {
     // Implementation
   }
   ```

5. **Add Route**
   ```tsx
   // frontend/src/App.tsx
   <Route path="/feature" element={<Feature />} />
   ```

### Testing

```bash
# Backend tests
cd backend
bun test

# Frontend tests (if configured)
cd frontend
bun test

# E2E tests (if configured)
bun test:e2e
```

### Code Quality

```bash
# Lint
bun run lint

# Format
bun run format

# Type check
bun run type-check
```

## Deployment

See [PRODUCTION_DEPLOYMENT_GUIDE.md](C:\Users\yoppi\Downloads\Lumiku App\PRODUCTION_DEPLOYMENT_GUIDE.md) for complete deployment instructions.

### Quick Deployment Checklist

- [ ] Set all required environment variables
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS for all URLs (CORS_ORIGIN, DUITKU URLs)
- [ ] Configure Redis for production
- [ ] Run database migrations
- [ ] Seed subscription plans and AI models
- [ ] Test payment flow with Duitku sandbox
- [ ] Setup monitoring and logging
- [ ] Configure backups
- [ ] Enable rate limiting
- [ ] Setup SSL certificates

## Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check environment variables
cat backend/.env

# Regenerate Prisma client
cd backend && bun prisma generate

# Check database connection
bun prisma db pull
```

**Frontend won't connect to API**
```bash
# Verify CORS_ORIGIN in backend/.env matches frontend URL
# Check backend is running on port 3000
# Check browser console for CORS errors
```

**Database migration errors**
```bash
# Reset database (development only - DESTRUCTIVE!)
bun prisma migrate reset

# Reseed database
bun seed
```

**Redis connection errors**
```bash
# Check Redis is running
redis-cli ping

# Verify REDIS_HOST and REDIS_PORT in .env
# In development, Redis is optional (uses in-memory store)
```

**FFmpeg errors**
```bash
# Check FFmpeg is installed
ffmpeg -version

# On Windows: Add FFmpeg to PATH
# On Mac: brew install ffmpeg
# On Linux: apt-get install ffmpeg
```

See [KNOWN_ISSUES.md](C:\Users\yoppi\Downloads\Lumiku App\docs\KNOWN_ISSUES.md) for detailed troubleshooting.

## Documentation

- **[QUICKSTART.md](C:\Users\yoppi\Downloads\Lumiku App\QUICKSTART.md)** - Quick setup guide
- **[DEVELOPMENT_GUIDE.md](C:\Users\yoppi\Downloads\Lumiku App\docs\DEVELOPMENT_GUIDE.md)** - Development workflow and best practices
- **[API_REFERENCE.md](C:\Users\yoppi\Downloads\Lumiku App\docs\api\README.md)** - Complete API documentation
- **[ENVIRONMENT_VARIABLES.md](C:\Users\yoppi\Downloads\Lumiku App\docs\ENVIRONMENT_VARIABLES.md)** - Environment configuration reference
- **[PRODUCTION_DEPLOYMENT_GUIDE.md](C:\Users\yoppi\Downloads\Lumiku App\PRODUCTION_DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[KNOWN_ISSUES.md](C:\Users\yoppi\Downloads\Lumiku App\docs\KNOWN_ISSUES.md)** - Known bugs and workarounds
- **[TEST_CHECKLIST.md](C:\Users\yoppi\Downloads\Lumiku App\docs\TEST_CHECKLIST.md)** - Testing procedures

## Security

- JWT-based authentication with bcrypt password hashing
- Comprehensive rate limiting on all auth endpoints
- Input validation using Zod schemas
- SQL injection protection via Prisma ORM
- CORS configuration for production
- Payment callback IP whitelisting
- Secure file upload validation
- Environment variable validation at startup

For security concerns, please refer to [KNOWN_ISSUES.md](C:\Users\yoppi\Downloads\Lumiku App\docs\KNOWN_ISSUES.md).

## Performance

- Efficient database queries with Prisma
- Indexed database fields for common queries
- Redis-based rate limiting and caching
- Background job processing with BullMQ
- Optimized video processing with FFmpeg
- Frontend code splitting and lazy loading
- React Query for data caching

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Test thoroughly
4. Commit with conventional commits: `feat: Add new feature`
5. Push and create a pull request

## License

Proprietary - All rights reserved

## Support

For questions or issues:
1. Check documentation in `docs/` directory
2. Review [KNOWN_ISSUES.md](C:\Users\yoppi\Downloads\Lumiku App\docs\KNOWN_ISSUES.md)
3. Check backend logs: `docker logs lumiku-backend`
4. Check frontend console in browser DevTools

---

**Version**: 1.0.0
**Last Updated**: 2025-10-14
**Maintained By**: Lumiku Team
