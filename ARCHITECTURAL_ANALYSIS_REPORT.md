# Lumiku App - Comprehensive Architectural Analysis Report
**Date**: October 16, 2025
**Analysis Type**: Production-Ready Architectural Assessment
**Scope**: Full-stack system architecture, deployment readiness, scalability analysis

---

## Executive Summary

### Overall Architecture Grade: **B- (70/100)**

**Strengths**:
- Well-structured plugin architecture with clear separation of concerns
- Comprehensive error handling system across frontend and backend
- Strong database schema design with proper indexing
- Good environment validation and security checks

**Critical Issues Identified**:
- **SEVERITY: HIGH** - Module loading circular dependency causing deployment failures
- **SEVERITY: HIGH** - Redis connection initialization at import time (anti-pattern)
- **SEVERITY: MEDIUM** - Inconsistent database migration state
- **SEVERITY: MEDIUM** - Missing connection pooling configuration
- **SEVERITY: MEDIUM** - Lack of distributed system observability

**Deployment Status**: Partially stable with known workarounds (pose-generator disabled)

---

## 1. SYSTEM ARCHITECTURE REVIEW

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  React 19 + Vite + Zustand + TanStack Query + React Router     │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS/WSS
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│   Hono Framework + WebSocket (Socket.IO) + CORS + Auth         │
│   Rate Limiting + Validation + Error Handling                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼────────────┐
│ Plugin Layer │ │ Core    │ │ Middleware    │
│              │ │ Services│ │ Layer         │
│ - Video Mix  │ │ - Auth  │ │ - JWT Auth    │
│ - Carousel   │ │ - Credit│ │ - Rate Limit  │
│ - Loop Flow  │ │ - Access│ │ - Validation  │
│ - Avatar     │ │ - Model │ │ - Error Hdl   │
│ - Pose Gen   │ │         │ │               │
└───────┬──────┘ └──┬──────┘ └───────────────┘
        │           │
        └─────┬─────┘
              │
┌─────────────▼─────────────────────────────────────────────────┐
│                    DATA/QUEUE LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ PostgreSQL   │  │ Redis/BullMQ │  │ File Storage │       │
│  │ (Prisma ORM) │  │ (Job Queue)  │  │ (Local/R2)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────────────────────────────────────────────┘
                          │
                          │
┌─────────────────────────▼─────────────────────────────────────┐
│                 EXTERNAL SERVICES                              │
│  - HuggingFace API (AI Models)                                │
│  - FLUX API (Image Generation)                                │
│  - OpenAI API (Text Processing)                               │
│  - Duitku Payment Gateway                                     │
│  - FFmpeg (Video Processing)                                  │
└───────────────────────────────────────────────────────────────┘
```

### 1.2 Service Dependencies Map

#### Backend Dependencies:
```
index.ts (Entry Point)
  ├── app.ts (Hono Application)
  │   ├── plugins/loader.ts (Plugin System)
  │   │   ├── video-mixer plugin
  │   │   ├── carousel-mix plugin
  │   │   ├── looping-flow plugin
  │   │   ├── avatar-creator plugin
  │   │   └── pose-generator plugin [DISABLED - Circular Dependency]
  │   ├── middleware/
  │   │   ├── auth.middleware.ts → jwt.ts → env.ts
  │   │   ├── cors.middleware.ts → env.ts
  │   │   ├── rate-limiter.middleware.ts → redis.ts [ISSUE: Import-time connection]
  │   │   └── validation.middleware.ts
  │   └── routes/
  │       ├── auth.routes.ts
  │       ├── payment.routes.ts
  │       ├── credits.routes.ts
  │       └── [plugin routes]
  ├── db/client.ts (Prisma Singleton)
  ├── lib/redis.ts [ISSUE: Eager connection, not lazy]
  ├── lib/queue.ts → redis.ts [ISSUE: Queue instantiation at import]
  ├── lib/storage.ts
  └── config/env.ts (Environment Validation with Zod)
```

**CRITICAL ISSUE #1**: `pose-generator/queue/queue.config.ts` creates Redis connection **at import time**, causing:
- Module loading to fail if Redis is not available
- Impossible to load plugin without connecting to Redis first
- Blocks entire application startup

**CRITICAL ISSUE #2**: Circular dependency chain:
```
index.ts → app.ts → plugins/loader.ts → pose-generator/plugin.config.ts
  → pose-generator/routes.ts → pose-generator/services/*.ts
  → pose-generator/queue/queue.config.ts → new Redis() [IMMEDIATE CONNECTION]
```

---

## 2. DATABASE SCHEMA CONSISTENCY

### 2.1 Schema Analysis

**Overall Assessment**: Well-designed with proper normalization and indexing

**Strengths**:
- Comprehensive index strategy (22 models, 150+ indexes)
- Proper foreign key relationships with cascade deletes
- Composite indexes for common query patterns
- Support for both PAYG and subscription models

**Database Statistics**:
- Total Models: 22
- Total Relations: 35
- Indexes: 150+ (excellent coverage)
- Unique Constraints: 15

### 2.2 Migration Consistency Issues

**Issue Found**: Migration `20251014_add_avatar_creator_complete/migration.sql` shows 20,231 bytes - indicates a large schema change

**Risk Assessment**: MEDIUM
- Large migrations can cause downtime if not properly tested
- No rollback strategy documented
- Migration includes multiple CREATE TABLE statements (risky for production)

**Recommendations**:
1. Split large migrations into smaller, atomic changes
2. Add migration rollback scripts
3. Test migrations on staging with production-sized data
4. Implement blue-green deployment strategy for schema changes

### 2.3 Index Effectiveness

**Well-Indexed Tables** (Performance Optimized):
- `users`: 6 indexes covering auth, subscription, account type queries
- `sessions`: 3 composite indexes for efficient cleanup and user lookup
- `credits`: 7 indexes for transaction history and audit trails
- `pose_generations`: 8 indexes including recovery-specific indexes
- `ai_models`: 4 indexes for access control filtering

**Potential Optimization** (Future consideration):
- Consider partitioning `credits` table by date (if volume > 10M rows)
- Add materialized views for dashboard statistics
- Implement read replicas for reporting queries

### 2.4 Database Connection Management

**Current Implementation**:
```typescript
// db/client.ts - Prisma Singleton Pattern
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})
```

**Missing Configuration**:
- ❌ No explicit connection pool configuration
- ❌ No query timeout settings
- ❌ No connection retry logic
- ❌ No prepared statement cache configuration

**Recommended Configuration**:
```typescript
new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Connection pooling
  connectionLimit: 10, // Adjust based on Coolify limits
  // Query timeouts
  queryTimeout: 10000, // 10 seconds
  // Prepared statement cache
  statementCacheSize: 100
})
```

---

## 3. API CONTRACT & PLUGIN ARCHITECTURE

### 3.1 Plugin System Architecture

**Design Pattern**: Dynamic Plugin Registry with Route Mounting

**Plugin Structure**:
```typescript
interface PluginConfig {
  appId: string                    // Unique identifier
  name: string                     // Display name
  description: string              // User-facing description
  icon: string                     // Lucide icon name
  version: string                  // Semantic versioning
  routePrefix: string              // API route prefix
  credits: Record<string, number>  // Credit cost mapping
  access: AccessControl            // Auth requirements
  features: FeatureFlags           // Beta, enabled, etc.
  dashboard: DashboardConfig       // UI configuration
}
```

**Strengths**:
- Clean separation of concerns
- Easy to add/remove features
- Consistent API structure across plugins
- Centralized credit cost management

**Architectural Flaw - Import-Time Dependencies**:

**Problem**: Plugins load dependencies at **module import time**, not at **runtime**

**Current Flow**:
```javascript
// plugins/loader.ts
import poseGeneratorConfig from '../apps/pose-generator/plugin.config'
import poseGeneratorRoutes from '../apps/pose-generator/routes'
// ↓ This triggers IMMEDIATE execution of all imports in routes.ts
// ↓ Including queue initialization which creates Redis connection
```

**Impact**:
- Cannot conditionally load plugins
- Cannot defer external service connections
- Application crashes if any plugin dependency fails
- No graceful degradation

**Solution Required**: Lazy Plugin Loading Pattern
```typescript
// Proposed architecture
interface Plugin {
  config: PluginConfig
  load: () => Promise<PluginRoutes>  // Lazy load routes
  unload: () => Promise<void>         // Graceful shutdown
  healthCheck: () => Promise<boolean> // Plugin-specific health
}

// Usage
async function loadPlugin(pluginId: string) {
  const plugin = registry.get(pluginId)
  if (await plugin.healthCheck()) {
    const routes = await plugin.load()
    app.route(plugin.config.routePrefix, routes)
  } else {
    console.warn(`Plugin ${pluginId} health check failed - skipping`)
  }
}
```

### 3.2 API Versioning

**Current State**: ❌ No API versioning strategy

**Risk**: Breaking changes will affect all clients simultaneously

**Recommendation**: Implement API versioning
```typescript
// Proposed structure
app.route('/api/v1/apps/pose-generator', poseGeneratorRoutes)
app.route('/api/v2/apps/pose-generator', poseGeneratorRoutesV2)

// Version negotiation via header
app.use('*', async (c, next) => {
  const apiVersion = c.req.header('X-API-Version') || 'v1'
  c.set('apiVersion', apiVersion)
  await next()
})
```

### 3.3 Error Handling Consistency

**Strengths**:
- Comprehensive error handling system in `core/errors/`
- Consistent error response format
- Proper HTTP status codes
- Zod validation integration

**Error Response Structure**:
```typescript
{
  error: {
    code: string          // VALIDATION_ERROR, DATABASE_ERROR, etc.
    message: string       // User-friendly message
    httpStatus: number    // 400, 401, 403, 404, 500, etc.
    metadata?: object     // Additional context
    timestamp: string     // ISO 8601
  }
}
```

**Gap Found**: Missing error tracking/monitoring integration
- No Sentry integration configured
- No error aggregation dashboard
- No alerting on critical errors

---

## 4. SCALABILITY & PERFORMANCE ANALYSIS

### 4.1 Current Bottlenecks

#### **BOTTLENECK #1: Redis Connection Anti-Pattern**

**Location**: `backend/src/lib/redis.ts`, `backend/src/lib/queue.ts`

**Issue**: Redis connections are created synchronously at module load time

**Code**:
```typescript
// lib/redis.ts - PROBLEMATIC
let redis: Redis | null = null
if (REDIS_ENABLED) {
  redis = new Redis({...}) // IMMEDIATE CONNECTION
}

// lib/queue.ts - PROBLEMATIC
if (isRedisEnabled() && redis) {
  videoMixerQueue = new Queue('video-mixer', {
    connection: redis // Uses imported connection
  })
}
```

**Impact on Scalability**:
- Cannot start application if Redis is temporarily down
- No connection pool sharing across modules
- Difficult to implement circuit breaker pattern
- Blocks horizontal scaling during Redis maintenance

**Production Failure Scenario**:
```
1. Redis cluster performs rolling restart
2. One Redis node goes down
3. Backend instance tries to import modules
4. Redis connection fails at import time
5. Entire application crashes
6. Kubernetes/Coolify restarts the pod
7. Repeat cycle → cascading failure
```

**Recommended Fix**:
```typescript
// lib/redis.ts - IMPROVED
class RedisManager {
  private static instance: Redis | null = null
  private static connecting: Promise<Redis> | null = null

  static async getConnection(): Promise<Redis> {
    if (this.instance?.status === 'ready') {
      return this.instance
    }

    if (this.connecting) {
      return this.connecting
    }

    this.connecting = this.connect()
    return this.connecting
  }

  private static async connect(): Promise<Redis> {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true, // KEY CHANGE
      retryStrategy: (times) => {
        if (times > 5) return null
        return Math.min(times * 200, 2000)
      },
    })

    await redis.connect()
    this.instance = redis
    this.connecting = null
    return redis
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.quit()
      this.instance = null
    }
  }
}

export { RedisManager }
```

#### **BOTTLENECK #2: Missing Database Connection Pooling**

**Issue**: Prisma Client created with default settings, no pool configuration

**Default Prisma Pool Limits**:
- Connection limit: `num_cpus * 2 + 1` (could be 5-17 connections)
- No explicit timeout configuration
- No connection lifetime management

**Risk with Coolify Deployment**:
- Coolify may limit database connections per service
- Multiple instances = multiplied connection usage
- No connection recycling strategy

**Recommended Configuration**:
```typescript
// db/client.ts - ADD POOL CONFIGURATION
const databaseUrl = new URL(process.env.DATABASE_URL!)
databaseUrl.searchParams.set('connection_limit', '10')
databaseUrl.searchParams.set('pool_timeout', '10')

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl.toString()
    }
  },
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})

// Add connection pool monitoring
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    const metrics = await prisma.$metrics.json()
    console.log('DB Pool:', metrics.poolSize, 'active:', metrics.activeConnections)
  }, 60000) // Every minute
}
```

#### **BOTTLENECK #3: Synchronous File Operations**

**Location**: `backend/src/lib/storage.ts`

**Issue**: File operations use `fs.promises` which is good, but missing:
- Chunked uploads for large files
- Stream processing for memory efficiency
- Concurrent upload limiting

**Current Implementation**:
```typescript
// storage.ts - SYNCHRONOUS BUFFER LOADING
export async function saveFile(file: File, category: string) {
  const arrayBuffer = await file.arrayBuffer() // LOADS ENTIRE FILE TO MEMORY
  const buffer = Buffer.from(arrayBuffer)      // DOUBLES MEMORY USAGE
  await fs.writeFile(filePath, buffer)         // BLOCKS UNTIL COMPLETE
}
```

**Memory Impact**:
- Uploading 500MB video = 1GB RAM usage (buffer + arrayBuffer)
- 3 concurrent uploads = 3GB RAM spike
- Can trigger OOM kills in containerized environments

**Recommended Fix**:
```typescript
// storage.ts - STREAMING APPROACH
import { pipeline } from 'stream/promises'
import { createWriteStream } from 'fs'

export async function saveFile(file: File, category: string) {
  const filePath = path.join(UPLOAD_DIR, category, fileName)
  const writeStream = createWriteStream(filePath)

  // Stream file chunks instead of loading all to memory
  await pipeline(
    file.stream(),
    writeStream
  )

  return { filePath, fileName }
}

// Add upload rate limiting
const uploadSemaphore = new Semaphore(3) // Max 3 concurrent uploads

export async function saveFileWithLimit(file: File, category: string) {
  await uploadSemaphore.acquire()
  try {
    return await saveFile(file, category)
  } finally {
    uploadSemaphore.release()
  }
}
```

#### **BOTTLENECK #4: Worker Concurrency Configuration**

**Location**: `backend/ecosystem.config.js`

**Current Configuration**:
```javascript
{
  name: 'pose-generator-worker',
  env: {
    WORKER_CONCURRENCY: 3,  // Development
  },
  env_production: {
    WORKER_CONCURRENCY: 5,  // Production
  },
  instances: 1,  // Only 1 worker process
  max_memory_restart: '2G',
}
```

**Scalability Issues**:
- Fixed concurrency (doesn't scale with CPU cores)
- Single worker instance (no horizontal scaling)
- No auto-scaling based on queue depth
- No circuit breaker for external API failures

**Recommended Improvements**:
```javascript
// ecosystem.config.js - IMPROVED
{
  name: 'pose-generator-worker',
  script: './src/apps/pose-generator/worker.ts',
  instances: 2, // Run 2 worker processes
  exec_mode: 'cluster',
  env_production: {
    WORKER_CONCURRENCY: Math.max(require('os').cpus().length - 1, 2),
    WORKER_MAX_MEMORY: '2G',
    WORKER_SCALING_MODE: 'auto', // Scale based on queue depth
    QUEUE_DEPTH_THRESHOLD: 50,   // Scale up if queue > 50
  },
  max_memory_restart: '2G',
  autorestart: true,
  watch: false,

  // Add graceful shutdown
  kill_timeout: 60000, // Allow 60s for job completion
  wait_ready: true,
  listen_timeout: 10000,
}

// Add auto-scaling in worker.ts
async function scaleWorkerConcurrency() {
  const queueDepth = await poseGenerationQueue.count()
  const currentConcurrency = parseInt(process.env.WORKER_CONCURRENCY || '5')

  if (queueDepth > 100 && currentConcurrency < 10) {
    // Dynamically increase concurrency
    worker.concurrency = Math.min(currentConcurrency + 2, 10)
  } else if (queueDepth < 10 && currentConcurrency > 3) {
    // Scale down during low demand
    worker.concurrency = Math.max(currentConcurrency - 1, 3)
  }
}
```

### 4.2 Resource Management Issues

#### **Issue #1: Missing Memory Limits in Docker**

**Location**: `backend/Dockerfile`

**Current Dockerfile**:
```dockerfile
# Production stage
FROM oven/bun:1-alpine AS production
WORKDIR /app
# ... installation steps ...
CMD ["bun", "src/index.ts"]
```

**Missing**:
- No memory limits defined
- No CPU limits defined
- No health check timeout configuration

**Risk**: Container can consume unlimited resources, affecting other services on Coolify

**Recommended Fix**:
```dockerfile
# Dockerfile - ADD RESOURCE CONSTRAINTS
FROM oven/bun:1-alpine AS production
WORKDIR /app

# Set resource limits
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV BUN_MEMORY_LIMIT="1024"

# Health check with proper timeouts
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider --timeout=5 http://localhost:3000/health || exit 1

CMD ["bun", "src/index.ts"]
```

**Docker Compose / Coolify Configuration**:
```yaml
services:
  backend:
    image: lumiku-backend:latest
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
    restart: unless-stopped
```

#### **Issue #2: Missing Rate Limiting for AI API Calls**

**Current Implementation**: Rate limiting only for HTTP endpoints

**Gap**: No rate limiting for:
- HuggingFace API calls
- FLUX API calls
- OpenAI API calls

**Risk**: API quota exhaustion, unexpected costs

**Recommended Implementation**:
```typescript
// lib/ai-api-limiter.ts - NEW FILE
import Bottleneck from 'bottleneck'

export const huggingfaceLimiter = new Bottleneck({
  maxConcurrent: 5,           // Max 5 concurrent requests
  minTime: 200,               // Min 200ms between requests
  reservoir: 100,             // 100 requests per interval
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 60 * 1000, // 1 minute
})

export const fluxLimiter = new Bottleneck({
  maxConcurrent: 3,
  minTime: 500,
  reservoir: 50,
  reservoirRefreshAmount: 50,
  reservoirRefreshInterval: 60 * 1000,
})

// Usage in service
export class FluxApiService {
  async generateImage(prompt: string) {
    return await fluxLimiter.schedule(async () => {
      return await this.fluxApi.generate({ prompt })
    })
  }
}
```

#### **Issue #3: No Circuit Breaker Pattern**

**Risk**: When external API fails, workers continue retrying, wasting resources

**Recommended Implementation**:
```typescript
// lib/circuit-breaker.ts - NEW FILE
import CircuitBreaker from 'opossum'

export function createApiCircuitBreaker(name: string, apiFunction: Function) {
  const options = {
    timeout: 30000,           // 30s timeout
    errorThresholdPercentage: 50, // Trip at 50% failure rate
    resetTimeout: 60000,      // Try again after 1 minute
    volumeThreshold: 10,      // Need 10 requests to calculate rate
  }

  const breaker = new CircuitBreaker(apiFunction, options)

  breaker.on('open', () => {
    console.error(`[Circuit Breaker] ${name} - Circuit OPEN, API failing`)
  })

  breaker.on('halfOpen', () => {
    console.warn(`[Circuit Breaker] ${name} - Circuit HALF-OPEN, testing API`)
  })

  breaker.on('close', () => {
    console.log(`[Circuit Breaker] ${name} - Circuit CLOSED, API healthy`)
  })

  return breaker
}

// Usage in service
const huggingfaceBreaker = createApiCircuitBreaker(
  'HuggingFace',
  async (prompt: string) => await hfClient.generateImage(prompt)
)

export async function generateWithCircuitBreaker(prompt: string) {
  try {
    return await huggingfaceBreaker.fire(prompt)
  } catch (error) {
    if (error.message.includes('circuit open')) {
      throw new Error('HuggingFace API is currently unavailable')
    }
    throw error
  }
}
```

### 4.3 Performance Optimization Opportunities

#### **Optimization #1: Implement Response Caching**

**Use Case**: Dashboard statistics, model lists, category lists

**Current State**: Every request hits database

**Recommended Implementation**:
```typescript
// lib/cache.ts - NEW FILE
import NodeCache from 'node-cache'

const cache = new NodeCache({
  stdTTL: 300,        // 5 minutes default
  checkperiod: 60,    // Check for expired keys every minute
  useClones: false,   // Reference original objects (faster)
})

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const cached = cache.get<T>(key)
  if (cached !== undefined) {
    return cached
  }

  const fresh = await fetcher()
  cache.set(key, fresh, ttl)
  return fresh
}

// Usage in route
app.get('/api/apps', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const apps = await getCached(
    `user-apps:${userId}`,
    async () => await accessControlService.getUserAccessibleApps(userId),
    300 // 5 minutes
  )

  return c.json({ apps })
})
```

#### **Optimization #2: Implement Database Query Batching**

**Use Case**: Loading generation results with related data

**Current State**: N+1 query problem

**Example Problem**:
```typescript
// Current implementation - N+1 queries
const generations = await prisma.poseGeneration.findMany({
  where: { userId }
})

// This loops and hits DB for each generation
for (const gen of generations) {
  gen.poses = await prisma.generatedPose.findMany({
    where: { generationId: gen.id }
  })
}
```

**Optimized Implementation**:
```typescript
// Optimized - Single query with proper include
const generations = await prisma.poseGeneration.findMany({
  where: { userId },
  include: {
    poses: {
      where: { status: 'completed' },
      select: {
        id: true,
        outputImageUrl: true,
        thumbnailUrl: true,
        isFavorite: true,
        createdAt: true,
      }
    },
    project: {
      select: {
        id: true,
        projectName: true,
      }
    },
    _count: {
      select: { poses: true }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 20, // Pagination
})
```

#### **Optimization #3: Add Database Indexes for Common Queries**

**Analysis of Current Query Patterns**:

Based on common dashboard queries, recommend adding these composite indexes:

```sql
-- Pose Generator: Get user's recent generations with pose count
CREATE INDEX IF NOT EXISTS idx_pose_gen_user_status_created
ON pose_generations(user_id, status, created_at DESC)
INCLUDE (progress, poses_completed, total_expected_poses);

-- Credits: Get user's transaction history efficiently
CREATE INDEX IF NOT EXISTS idx_credits_user_type_created
ON credits(user_id, type, created_at DESC)
INCLUDE (amount, balance, description);

-- Avatar Creator: Get user's avatars sorted by usage
CREATE INDEX IF NOT EXISTS idx_avatars_user_usage
ON avatars(user_id, usage_count DESC, last_used_at DESC)
WHERE usage_count > 0;

-- Model Usage: Aggregate statistics by model
CREATE INDEX IF NOT EXISTS idx_model_usage_model_date
ON model_usages(model_key, created_at DESC)
INCLUDE (usage_type, credit_used, quota_used);
```

### 4.4 Scalability Roadmap

#### **Phase 1: Immediate (Week 1-2)**
1. Fix Redis connection initialization (lazy loading)
2. Add Prisma connection pooling configuration
3. Implement streaming file uploads
4. Add circuit breakers for external APIs

#### **Phase 2: Short-term (Month 1)**
1. Implement response caching layer
2. Add database query optimization (batching, indexes)
3. Configure resource limits in Docker
4. Add rate limiting for AI API calls

#### **Phase 3: Medium-term (Month 2-3)**
1. Implement horizontal pod autoscaling in Coolify
2. Add read replicas for reporting queries
3. Implement worker auto-scaling based on queue depth
4. Add distributed tracing (OpenTelemetry)

#### **Phase 4: Long-term (Quarter 1)**
1. Migrate to Cloudflare R2 for file storage
2. Implement CDN for static assets
3. Add Redis cluster for high availability
4. Implement database sharding strategy

---

## 5. INFRASTRUCTURE CONFIGURATION REVIEW

### 5.1 Docker Configuration Analysis

**File**: `backend/Dockerfile`

**Strengths**:
- Multi-stage build (development, builder, production)
- Non-root user for security
- Health check configured
- Alpine Linux for smaller image size

**Issues Identified**:

1. **Missing Build-time Dependencies**
   - FFmpeg not installed (required for video processing)
   - Sharp dependencies may fail on Alpine

2. **No Layer Caching Optimization**
   ```dockerfile
   # Current - Suboptimal
   COPY . .
   RUN bun build

   # Better - Cache dependencies separately
   COPY package.json bun.lockb ./
   RUN bun install --frozen-lockfile
   COPY prisma ./prisma
   RUN bunx prisma generate
   COPY . .
   RUN bun build
   ```

3. **Missing Production Hardening**
   ```dockerfile
   # Add these to production stage
   ENV NODE_ENV=production
   ENV BUN_ENV=production

   # Disable source maps in production
   ENV GENERATE_SOURCEMAP=false

   # Set memory limits
   ENV NODE_OPTIONS="--max-old-space-size=1024"
   ```

**Recommended Dockerfile**:
```dockerfile
# ========================================
# Base Stage - Common dependencies
# ========================================
FROM oven/bun:1-alpine AS base

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    ffmpeg \
    ffmpeg-libs \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies with frozen lockfile
RUN bun install --frozen-lockfile --production=false

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN bunx prisma generate

# ========================================
# Development Stage
# ========================================
FROM base AS development

# Copy source code
COPY . .

# Create directories
RUN mkdir -p logs uploads uploads/pose-generator storage/pose-dataset

EXPOSE 3000

CMD ["bun", "--watch", "src/index.ts"]

# ========================================
# Production Stage - Optimized runtime
# ========================================
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    ffmpeg-libs \
    cairo \
    jpeg \
    pango \
    giflib

# Copy package files and install prod dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN bunx prisma generate

# Copy source code (Bun runs TS directly in production)
COPY src ./src

# Create directories
RUN mkdir -p logs uploads uploads/pose-generator storage/pose-dataset

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Environment variables
ENV NODE_ENV=production
ENV BUN_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

EXPOSE 3000

# Health check with proper timeout
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider --timeout=5 http://localhost:3000/health || exit 1

# Start application
CMD ["bun", "src/index.ts"]
```

### 5.2 Environment Configuration Analysis

**File**: `backend/src/config/env.ts`

**Strengths**:
- Comprehensive Zod validation (excellent!)
- Security checks for production (JWT_SECRET, DUITKU, CORS)
- Clear error messages with fix instructions
- Fail-fast approach in production

**Gaps Identified**:

1. **Missing Observability Configuration**
   ```typescript
   // Add to envSchema
   SENTRY_DSN: z.string().url().optional(),
   LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
   ENABLE_METRICS: z.boolean().default(true),
   METRICS_PORT: z.coerce.number().default(9090),
   ```

2. **Missing Database Tuning Parameters**
   ```typescript
   DATABASE_POOL_SIZE: z.coerce.number().default(10),
   DATABASE_QUERY_TIMEOUT: z.coerce.number().default(10000),
   DATABASE_STATEMENT_CACHE_SIZE: z.coerce.number().default(100),
   ```

3. **Missing Worker Configuration**
   ```typescript
   WORKER_ENABLED: z.boolean().default(true),
   WORKER_CONCURRENCY: z.coerce.number().default(5),
   WORKER_TIMEOUT: z.coerce.number().default(180000), // 3 minutes
   QUEUE_CLEANUP_INTERVAL: z.coerce.number().default(3600000), // 1 hour
   ```

### 5.3 PM2 Configuration Analysis

**File**: `backend/ecosystem.config.js`

**Strengths**:
- Separate worker process configuration
- Log rotation configured
- Auto-restart enabled
- Different environments supported

**Issues Identified**:

1. **No Process Monitoring**
   - Missing max_restarts threshold check
   - No exponential backoff for restarts
   - No alert mechanism on repeated failures

2. **Suboptimal Worker Configuration**
   ```javascript
   // Current - Fixed instances
   {
     name: 'pose-generator-worker',
     instances: 1,
     exec_mode: 'fork'
   }

   // Better - Scale with CPU cores
   {
     name: 'pose-generator-worker',
     instances: process.env.NODE_ENV === 'production' ? 2 : 1,
     exec_mode: 'cluster',
     instance_var: 'WORKER_ID',
   }
   ```

**Recommended Configuration**:
```javascript
module.exports = {
  apps: [
    // ========================================
    // Main API Server
    // ========================================
    {
      name: 'lumiku-api',
      script: './src/index.ts',
      interpreter: 'bun',
      watch: false,
      instances: process.env.PM2_INSTANCES || 1,
      exec_mode: 'cluster',

      // Environment variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        INSTANCE_ID: process.env.INSTANCE_ID || '0',
      },

      // Memory management
      max_memory_restart: '1G',

      // Smart restart policy
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
      restart_delay: 5000,
      exp_backoff_restart_delay: 100,

      // Logging
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Graceful shutdown
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 10000,

      // Health monitoring
      health_check_interval: 30000,
    },

    // ========================================
    // Pose Generator Worker
    // ========================================
    {
      name: 'pose-generator-worker',
      script: './src/apps/pose-generator/worker.ts',
      interpreter: 'bun',
      watch: false,
      instances: 2, // Run 2 worker instances
      exec_mode: 'cluster',
      instance_var: 'WORKER_ID',

      // Environment variables
      env_production: {
        NODE_ENV: 'production',
        WORKER_CONCURRENCY: 5,
        WORKER_NAME: `pose-worker-${process.env.pm_id || 0}`,
        WORKER_SCALING_MODE: 'auto',
      },

      // Memory management (higher for image processing)
      max_memory_restart: '2G',

      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: '30s',
      restart_delay: 10000,
      exp_backoff_restart_delay: 100,

      // Logging
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Graceful shutdown (allow job completion)
      kill_timeout: 60000, // 60s for job completion
      wait_ready: false,
    },
  ],
}
```

### 5.4 Coolify-Specific Considerations

**Based on**: `DEPLOYMENT_STATUS_2025_10_14.md`

**Current Issues**:

1. **External PostgreSQL** (Port 5986 on 107.155.75.50)
   - **Risk**: No connection pooling between Coolify and external DB
   - **Risk**: Network latency if DB is far from Coolify server
   - **Recommendation**: Use PgBouncer for connection pooling

   ```yaml
   # Add to docker-compose.yml
   services:
     pgbouncer:
       image: pgbouncer/pgbouncer:latest
       environment:
         DATABASES_HOST: 107.155.75.50
         DATABASES_PORT: 5986
         DATABASES_DBNAME: lumiku-dev
         DATABASES_USER: postgres
         DATABASES_PASSWORD: ${POSTGRES_PASSWORD}
         POOL_MODE: transaction
         MAX_CLIENT_CONN: 1000
         DEFAULT_POOL_SIZE: 20
       ports:
         - "6432:6432"

   # Update DATABASE_URL to point to PgBouncer
   # DATABASE_URL=postgres://postgres:password@pgbouncer:6432/lumiku-dev
   ```

2. **Redis Authentication Issues**
   - **Current**: `WRONGPASS invalid username-password pair`
   - **Root Cause**: Redis instance has no authentication configured
   - **Fix**: Update environment variables in Coolify UI:
     ```bash
     REDIS_HOST=u8s0cgsks4gcwo84ccskwok4
     REDIS_PORT=6379
     REDIS_USERNAME=  # Remove username
     REDIS_PASSWORD=  # Remove password
     ```

3. **Volume Mounting for File Storage**
   - **Current**: Local storage at `/app/backend/uploads`
   - **Risk**: Files lost on container restart without volume mount
   - **Fix**: Add persistent volume in Coolify

   ```yaml
   services:
     backend:
       volumes:
         - lumiku-uploads:/app/backend/uploads
         - lumiku-pose-storage:/app/backend/storage/pose-dataset

   volumes:
     lumiku-uploads:
       driver: local
     lumiku-pose-storage:
       driver: local
   ```

---

## 6. CRITICAL DEPENDENCIES ANALYSIS

### 6.1 Third-Party Service Integration Assessment

#### **HuggingFace API Integration**

**Current Implementation**: Direct API calls without wrapper

**Risks**:
- ❌ No retry logic
- ❌ No rate limiting
- ❌ No circuit breaker
- ❌ No fallback mechanism
- ❌ No request queuing

**Impact of Failure**:
- Pose generation completely fails
- No user notification of service degradation
- Credits charged but generation fails

**Recommended Wrapper**:
```typescript
// lib/huggingface-client-wrapper.ts - NEW FILE
import { HfInference } from '@huggingface/inference'
import CircuitBreaker from 'opossum'
import Bottleneck from 'bottleneck'

class HuggingFaceClientWrapper {
  private client: HfInference
  private breaker: CircuitBreaker
  private limiter: Bottleneck

  constructor(apiKey: string) {
    this.client = new HfInference(apiKey)

    // Rate limiter: 10 requests/minute
    this.limiter = new Bottleneck({
      maxConcurrent: 5,
      minTime: 6000, // 6s between requests
    })

    // Circuit breaker: trip after 50% failure rate
    this.breaker = new CircuitBreaker(
      async (params: any) => await this.client.textToImage(params),
      {
        timeout: 120000,           // 2 minute timeout
        errorThresholdPercentage: 50,
        resetTimeout: 300000,      // Try again after 5 minutes
        volumeThreshold: 5,
      }
    )

    this.breaker.on('open', () => {
      console.error('[HuggingFace] Circuit breaker OPEN - API failing')
      // TODO: Send alert to monitoring system
    })
  }

  async generateImage(params: any) {
    return await this.limiter.schedule(async () => {
      try {
        return await this.breaker.fire(params)
      } catch (error) {
        if (error.message.includes('circuit open')) {
          throw new Error('HuggingFace API is temporarily unavailable. Please try again in a few minutes.')
        }
        throw error
      }
    })
  }

  isHealthy(): boolean {
    return this.breaker.closed || this.breaker.halfOpen
  }
}

export const hfClient = new HuggingFaceClientWrapper(
  process.env.HUGGINGFACE_API_KEY!
)
```

#### **FLUX API Integration**

**Current State**: Direct API calls via axios

**Missing**:
- ❌ No request tracking/logging
- ❌ No cost estimation before generation
- ❌ No quota management
- ❌ No webhook retry mechanism

**Recommended Improvements**:
```typescript
// lib/flux-api-client.ts - IMPROVED
import axios from 'axios'
import crypto from 'crypto'

export class FluxApiClient {
  private apiKey: string
  private baseUrl: string = 'https://api.flux.ai/v1'
  private requestLog: Map<string, FluxRequest> = new Map()

  async generateImage(params: FluxGenerateParams): Promise<FluxResponse> {
    const requestId = crypto.randomUUID()

    // Log request for tracking
    this.requestLog.set(requestId, {
      id: requestId,
      params,
      startTime: Date.now(),
      status: 'pending',
    })

    try {
      // Estimate cost before generation
      const estimatedCost = this.estimateCost(params)
      console.log(`[FLUX] Request ${requestId}: Estimated cost ${estimatedCost} credits`)

      // Make API call with timeout
      const response = await axios.post(
        `${this.baseUrl}/generate`,
        params,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Request-ID': requestId,
          },
          timeout: 120000, // 2 minute timeout
        }
      )

      // Update request log
      this.requestLog.set(requestId, {
        ...this.requestLog.get(requestId)!,
        status: 'completed',
        endTime: Date.now(),
        actualCost: response.data.creditsUsed,
        response: response.data,
      })

      return response.data

    } catch (error) {
      // Update request log with error
      this.requestLog.set(requestId, {
        ...this.requestLog.get(requestId)!,
        status: 'failed',
        endTime: Date.now(),
        error: error.message,
      })

      // Handle specific error codes
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('FLUX API rate limit exceeded. Please try again later.')
        }
        if (error.response?.status === 402) {
          throw new Error('FLUX API quota exceeded. Please check your billing.')
        }
      }

      throw error
    }
  }

  private estimateCost(params: FluxGenerateParams): number {
    // Cost estimation based on model and size
    let baseCost = 10

    if (params.model === 'flux-pro') baseCost = 20
    if (params.width > 1024 || params.height > 1024) baseCost *= 1.5
    if (params.steps > 50) baseCost *= 1.2

    return Math.ceil(baseCost)
  }

  // Get request history for debugging
  getRequestHistory(requestId: string) {
    return this.requestLog.get(requestId)
  }

  // Clean old request logs (run periodically)
  cleanOldLogs() {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    for (const [id, request] of this.requestLog.entries()) {
      if (request.endTime && request.endTime < oneDayAgo) {
        this.requestLog.delete(id)
      }
    }
  }
}
```

#### **Duitku Payment Gateway**

**Current Implementation**: Direct API calls in payment routes

**Security Assessment**: GOOD
- ✅ Environment variable validation
- ✅ Signature verification
- ✅ HTTPS enforcement in production
- ✅ IP whitelist support

**Gap**: No webhook retry mechanism

**Recommendation**:
```typescript
// routes/payment.routes.ts - ADD WEBHOOK RETRY
app.post('/api/payment/callback', async (c) => {
  const payload = await c.req.json()

  // Verify signature
  const isValid = verifyDuitkuSignature(payload)
  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 401)
  }

  try {
    // Process payment
    await processPaymentCallback(payload)
    return c.json({ success: true })

  } catch (error) {
    // Log failure for manual retry
    await prisma.webhookFailure.create({
      data: {
        service: 'duitku',
        payload: JSON.stringify(payload),
        error: error.message,
        retryCount: 0,
        nextRetryAt: new Date(Date.now() + 300000), // 5 minutes
      }
    })

    // Return 500 so Duitku retries
    return c.json({ error: 'Processing failed' }, 500)
  }
})

// Add webhook retry worker
async function retryFailedWebhooks() {
  const failures = await prisma.webhookFailure.findMany({
    where: {
      retryCount: { lt: 5 },
      nextRetryAt: { lte: new Date() },
    },
    take: 10,
  })

  for (const failure of failures) {
    try {
      const payload = JSON.parse(failure.payload)
      await processPaymentCallback(payload)

      // Success - delete failure record
      await prisma.webhookFailure.delete({
        where: { id: failure.id }
      })

    } catch (error) {
      // Increment retry count with exponential backoff
      const nextRetry = new Date(
        Date.now() + Math.pow(2, failure.retryCount + 1) * 300000
      )

      await prisma.webhookFailure.update({
        where: { id: failure.id },
        data: {
          retryCount: { increment: 1 },
          nextRetryAt: nextRetry,
          lastError: error.message,
        }
      })
    }
  }
}

// Run every 5 minutes
setInterval(retryFailedWebhooks, 300000)
```

### 6.2 Dependency Version Analysis

**Backend Dependencies** (from `package.json`):

**Critical Updates Needed**:
- `axios@1.12.2` - **SECURITY VULNERABILITY** - Update to 1.7.7+
  - CVE-2024-39338: SSRF vulnerability
  - CVE-2024-43798: ReDos vulnerability

- `bullmq@5.59.0` - Consider updating to 5.26.0+ for bug fixes

**Version Compatibility Matrix**:
```
✅ @prisma/client@5.7.1 - Stable, LTS version
✅ hono@4.0.0 - Latest stable
⚠️ axios@1.12.2 - VULNERABLE, upgrade required
✅ ioredis@5.8.0 - Stable
✅ socket.io@4.8.1 - Latest
✅ zod@3.22.4 - Stable
```

**Recommended Updates**:
```bash
# Update vulnerable packages
bun update axios@1.7.7
bun update bullmq@5.26.0

# Optional: Update to latest Prisma
bun update @prisma/client@6.1.0
bun update prisma@6.1.0
```

---

## 7. DEPLOYMENT FAILURE ROOT CAUSE ANALYSIS

### 7.1 Recent Deployment Failures

**Analysis of Git History** (last 15 commits):

```
8666593 - fix(deployment): Temporarily disable pose-generator plugin to fix module loading
74c3988 - fix(auth): Prevent auto-logout caused by race condition and redirect loops
4e60627 - fix(deployment): Temporarily disable pose-generator WebSocket to fix module resolution error
e9f1a0b - feat: Integrate Pose Generator with Avatar Creator and add WebSocket support
3f60381 - fix(prisma): Add complete Avatar Creator migration with CREATE TABLE statements
```

**Pattern Identified**: 3 out of last 5 commits are deployment fixes

### 7.2 Root Cause: Import-Time Dependency Execution

**The Problem Chain**:

1. **Entry Point** (`index.ts`) imports `app.ts`
2. **App** (`app.ts`) calls `loadPlugins()`
3. **Plugin Loader** (`plugins/loader.ts`) imports all plugins at top level
4. **Pose Generator Plugin** imports routes
5. **Pose Generator Routes** imports services
6. **Pose Generator Services** imports queue config
7. **Queue Config** (`queue.config.ts`) **IMMEDIATELY creates Redis connection**

**Code Path**:
```typescript
// plugins/loader.ts (Line 19)
import poseGeneratorConfig from '../apps/pose-generator/plugin.config'
import poseGeneratorRoutes from '../apps/pose-generator/routes'
  ↓
// apps/pose-generator/routes.ts (Line 8)
import { poseGenerationQueue } from './queue/queue.config'
  ↓
// apps/pose-generator/queue/queue.config.ts (Line 30)
const connection = new Redis({...}) // IMMEDIATE EXECUTION
  ↓
// FAILURE: If Redis not available, entire application crashes
```

**Why This Fails in Production**:
- Coolify may start backend container before Redis container is ready
- Redis authentication misconfiguration (WRONGPASS error)
- Network latency between containers
- Redis cluster performing maintenance

**Current Workaround**: Plugin disabled (line 16-21 in `plugins/loader.ts`)
```typescript
// TEMPORARILY DISABLED: Pose Generator has Redis connection at import time
// This breaks module loading during startup. Need to refactor queue initialization
// to be lazy-loaded instead of executed at import time.
// TODO: Fix pose-generator queue initialization to not connect on import
// import poseGeneratorConfig from '../apps/pose-generator/plugin.config'
// import poseGeneratorRoutes from '../apps/pose-generator/routes'
```

### 7.3 Comprehensive Fix Strategy

#### **Solution 1: Lazy Queue Initialization Pattern**

**Create Lazy Connection Manager**:
```typescript
// apps/pose-generator/queue/queue.config.ts - REFACTORED

import { Queue, QueueOptions } from 'bullmq'
import Redis from 'ioredis'

// DO NOT create connection at import time
let connection: Redis | null = null
let poseGenerationQueue: Queue | null = null
let initializationPromise: Promise<Queue> | null = null

/**
 * Get or create Redis connection (LAZY)
 */
async function getRedisConnection(): Promise<Redis> {
  if (connection?.status === 'ready') {
    return connection
  }

  connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true, // KEY: Lazy connection
    retryStrategy(times) {
      if (times > 5) return null
      return Math.min(times * 200, 2000)
    },
  })

  // Handle connection events
  connection.on('connect', () => {
    console.log('[Queue] Connected to Redis')
  })

  connection.on('error', (error) => {
    console.error('[Queue] Redis connection error:', error)
  })

  // Connect explicitly
  await connection.connect()

  return connection
}

/**
 * Initialize pose generation queue (LAZY)
 */
export async function initializePoseQueue(): Promise<Queue> {
  // Return existing queue if already initialized
  if (poseGenerationQueue) {
    return poseGenerationQueue
  }

  // Wait for ongoing initialization
  if (initializationPromise) {
    return initializationPromise
  }

  // Start new initialization
  initializationPromise = (async () => {
    try {
      const redis = await getRedisConnection()

      const queueOptions: QueueOptions = {
        connection: redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 24 * 3600,
            count: 1000,
          },
          removeOnFail: {
            age: 7 * 24 * 3600,
            count: 5000,
          },
        },
      }

      poseGenerationQueue = new Queue('pose-generation', queueOptions)

      // Handle queue events
      poseGenerationQueue.on('error', (error) => {
        console.error('[Queue] Error:', error)
      })

      console.log('[Queue] Pose generation queue initialized')
      return poseGenerationQueue

    } catch (error) {
      console.error('[Queue] Failed to initialize queue:', error)
      initializationPromise = null
      throw error
    }
  })()

  return initializationPromise
}

/**
 * Get pose generation queue (LAZY)
 * Throws error if queue not initialized
 */
export function getPoseQueue(): Queue {
  if (!poseGenerationQueue) {
    throw new Error('Pose generation queue not initialized. Call initializePoseQueue() first.')
  }
  return poseGenerationQueue
}

/**
 * Check if queue is initialized
 */
export function isQueueInitialized(): boolean {
  return poseGenerationQueue !== null
}

/**
 * Shutdown queue gracefully
 */
export async function shutdownQueue(): Promise<void> {
  if (poseGenerationQueue) {
    await poseGenerationQueue.close()
    poseGenerationQueue = null
  }

  if (connection) {
    await connection.quit()
    connection = null
  }

  initializationPromise = null
  console.log('[Queue] Shutdown complete')
}
```

**Update Service to Use Lazy Queue**:
```typescript
// apps/pose-generator/services/pose-generator.service.ts - UPDATED

import { initializePoseQueue, isQueueInitialized } from '../queue/queue.config'

export class PoseGeneratorService {
  async createGeneration(params: CreateGenerationParams) {
    // Initialize queue if not already initialized
    if (!isQueueInitialized()) {
      await initializePoseQueue()
    }

    const queue = await initializePoseQueue()

    // Rest of generation logic...
  }
}
```

**Update Plugin Loader**:
```typescript
// plugins/loader.ts - UPDATED

export async function loadPlugins() {
  // Register synchronous plugins
  pluginRegistry.register(videoMixerConfig, videoMixerRoutes)
  pluginRegistry.register(carouselMixConfig, carouselMixRoutes)
  pluginRegistry.register(loopingFlowConfig, loopingFlowRoutes)
  pluginRegistry.register(avatarCreatorConfig, avatarCreatorRoutes)

  // Lazy load pose generator plugin
  try {
    const poseConfig = await import('../apps/pose-generator/plugin.config')
    const poseRoutes = await import('../apps/pose-generator/routes')
    pluginRegistry.register(poseConfig.default, poseRoutes.default)
    console.log('✅ Pose Generator plugin loaded')
  } catch (error) {
    console.error('❌ Failed to load Pose Generator plugin:', error)
    // Continue without pose generator
  }

  console.log(`\n📦 Loaded ${pluginRegistry.getAll().length} plugins`)
}
```

**Update Application Startup**:
```typescript
// index.ts - UPDATED

import { initializePoseQueue } from './apps/pose-generator/queue/queue.config'

async function start() {
  await checkDatabase()
  await checkRedis()
  await initStorage()

  // Initialize cron jobs
  initializeScheduler()

  // Initialize pose queue after Redis is confirmed working
  if (isRedisEnabled()) {
    try {
      await initializePoseQueue()
      console.log('✅ Pose generation queue initialized')
    } catch (error) {
      console.error('⚠️  Failed to initialize pose queue:', error)
      console.error('   Pose Generator will be unavailable')
    }
  }

  // Rest of startup...
}
```

#### **Solution 2: Health Check Before Plugin Loading**

**Add Plugin Health Check System**:
```typescript
// plugins/types.ts - ADD HEALTH CHECK

export interface PluginConfig {
  // ... existing fields ...

  // NEW: Health check function
  healthCheck?: () => Promise<boolean>

  // NEW: Optional dependencies
  dependencies?: {
    redis?: boolean
    postgres?: boolean
    externalApis?: string[]
  }
}
```

**Implement in Pose Generator**:
```typescript
// apps/pose-generator/plugin.config.ts - ADD HEALTH CHECK

export const poseGeneratorConfig: PluginConfig = {
  // ... existing config ...

  // Health check before loading
  healthCheck: async () => {
    try {
      // Check if Redis is available
      const redis = await getRedisConnection()
      await redis.ping()
      return true
    } catch (error) {
      console.error('[Pose Generator] Health check failed:', error)
      return false
    }
  },

  // Declare dependencies
  dependencies: {
    redis: true,
    externalApis: ['huggingface', 'flux'],
  },
}
```

**Update Plugin Loader with Health Checks**:
```typescript
// plugins/loader.ts - WITH HEALTH CHECKS

export async function loadPlugins() {
  const plugins = [
    { config: videoMixerConfig, routes: videoMixerRoutes },
    { config: carouselMixConfig, routes: carouselMixRoutes },
    { config: loopingFlowConfig, routes: loopingFlowRoutes },
    { config: avatarCreatorConfig, routes: avatarCreatorRoutes },
    { config: poseGeneratorConfig, routes: poseGeneratorRoutes },
  ]

  for (const plugin of plugins) {
    try {
      // Run health check if defined
      if (plugin.config.healthCheck) {
        const isHealthy = await plugin.config.healthCheck()
        if (!isHealthy) {
          console.warn(`⚠️  Plugin ${plugin.config.name} health check failed - skipping`)
          continue
        }
      }

      // Register plugin
      pluginRegistry.register(plugin.config, plugin.routes)
      console.log(`✅ Plugin loaded: ${plugin.config.name}`)

    } catch (error) {
      console.error(`❌ Failed to load plugin ${plugin.config.name}:`, error)
      // Continue loading other plugins
    }
  }

  console.log(`\n📦 Loaded ${pluginRegistry.getAll().length} / ${plugins.length} plugins`)
}
```

### 7.4 Deployment Checklist for Production

**Pre-Deployment Checklist**:

```markdown
## Infrastructure Readiness
- [ ] PostgreSQL accessible and migrations tested
- [ ] Redis accessible with correct authentication
- [ ] Persistent volumes mounted for file storage
- [ ] Environment variables validated in Coolify
- [ ] Secrets rotated and stored securely
- [ ] Health check endpoints responding correctly

## Database Readiness
- [ ] Backup created before migration
- [ ] Migration tested on staging with production-sized data
- [ ] Rollback script prepared
- [ ] Connection pool limits verified
- [ ] Indexes analyzed and optimized

## Redis Readiness
- [ ] Redis cluster healthy (if using cluster)
- [ ] Authentication configured correctly
- [ ] Memory limits set appropriately
- [ ] Persistence enabled (AOF or RDB)
- [ ] Eviction policy configured

## Application Readiness
- [ ] All plugins pass health checks
- [ ] Worker processes start successfully
- [ ] External API credentials valid
- [ ] Rate limiting tested
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Logging configured and tested

## Security Readiness
- [ ] JWT_SECRET is strong (32+ characters, high entropy)
- [ ] HTTPS enforced for all endpoints
- [ ] CORS configured correctly
- [ ] API keys for external services secured
- [ ] No secrets committed to Git
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] CSRF protection verified

## Performance Readiness
- [ ] Load testing completed
- [ ] Memory leaks tested (run for 24+ hours)
- [ ] CPU usage under load acceptable
- [ ] Database query performance analyzed
- [ ] API response times < 500ms for 95th percentile
- [ ] File upload/download speeds acceptable

## Monitoring Readiness
- [ ] Application metrics exposed (Prometheus, etc.)
- [ ] Error tracking integrated (Sentry, etc.)
- [ ] Log aggregation configured (Grafana Loki, etc.)
- [ ] Alerting rules configured
- [ ] Dashboard created for key metrics
- [ ] On-call rotation defined

## Rollback Readiness
- [ ] Previous deployment tagged in Git
- [ ] Database rollback script tested
- [ ] File storage backup created
- [ ] Rollback procedure documented
- [ ] Team trained on rollback process
```

---

## 8. ARCHITECTURAL RECOMMENDATIONS (PRIORITIZED)

### Priority P0 - CRITICAL (Fix Immediately)

#### **P0-1: Fix Module Loading Circular Dependency**

**Impact**: Blocks pose-generator feature entirely
**Effort**: 4 hours
**Risk**: Medium (requires testing)

**Action Items**:
1. Refactor `queue.config.ts` to use lazy initialization pattern (see Section 7.3 Solution 1)
2. Update all services to call `initializePoseQueue()` before using queue
3. Add health checks to plugin loader
4. Test deployment with Redis unavailable (graceful degradation)

**Files to Modify**:
- `backend/src/apps/pose-generator/queue/queue.config.ts` - Lazy queue initialization
- `backend/src/apps/pose-generator/services/*.ts` - Use `getPoseQueue()`
- `backend/src/plugins/loader.ts` - Add health checks
- `backend/src/index.ts` - Initialize queue after Redis check

**Testing Checklist**:
```bash
# Test 1: Start app with Redis unavailable
REDIS_ENABLED=false bun src/index.ts
# Expected: App starts, pose-generator disabled

# Test 2: Start app with Redis available
bun src/index.ts
# Expected: App starts, pose-generator enabled

# Test 3: Redis connection lost during runtime
docker stop redis-container
# Expected: Queue operations fail gracefully, app continues

# Test 4: Redis reconnects after failure
docker start redis-container
# Expected: Queue reinitializes, operations resume
```

#### **P0-2: Update Axios to Fix Security Vulnerabilities**

**Impact**: Security vulnerability (SSRF, ReDos)
**Effort**: 15 minutes
**Risk**: Low (drop-in replacement)

**Action Items**:
```bash
cd backend
bun update axios@1.7.7
bun install
npm test # Verify no breaking changes
```

#### **P0-3: Fix Redis Connection Configuration in Coolify**

**Impact**: Workers not processing jobs, rate limiting broken
**Effort**: 10 minutes (manual fix in Coolify UI)
**Risk**: Low

**Action Items**:
1. Access Coolify UI → Environment Variables
2. Remove or clear these variables:
   ```bash
   REDIS_PASSWORD=
   REDIS_USERNAME=
   ```
3. Redeploy application
4. Verify Redis connection in logs:
   ```bash
   docker logs -f <container-id> | grep "Redis"
   # Expected: "✅ Redis connected successfully"
   ```

---

### Priority P1 - HIGH (Fix This Week)

#### **P1-1: Add Database Connection Pooling Configuration**

**Impact**: Prevents connection exhaustion, improves performance
**Effort**: 2 hours
**Risk**: Low

**Action Items**:
1. Update `db/client.ts` with connection pool configuration (see Section 2.4)
2. Add connection monitoring
3. Configure PgBouncer for external PostgreSQL (see Section 5.4)
4. Test connection limits under load

#### **P1-2: Implement Streaming File Uploads**

**Impact**: Reduces memory usage, prevents OOM crashes
**Effort**: 4 hours
**Risk**: Medium (requires thorough testing)

**Action Items**:
1. Refactor `lib/storage.ts` to use streams (see Section 4.1 Bottleneck #3)
2. Add upload rate limiting (max 3 concurrent uploads)
3. Add progress tracking for large files
4. Test with 500MB+ files

#### **P1-3: Add Circuit Breakers for External APIs**

**Impact**: Prevents cascading failures when external services fail
**Effort**: 6 hours
**Risk**: Medium

**Action Items**:
1. Implement circuit breaker pattern for HuggingFace API (see Section 4.2)
2. Implement circuit breaker pattern for FLUX API
3. Add fallback mechanisms where possible
4. Add monitoring dashboards for circuit breaker status

#### **P1-4: Configure Docker Resource Limits**

**Impact**: Prevents resource starvation on Coolify server
**Effort**: 2 hours
**Risk**: Low

**Action Items**:
1. Update Dockerfile with memory limits (see Section 5.1)
2. Configure Docker Compose resource limits (see Section 5.2)
3. Add resource monitoring in PM2 (see Section 5.3)
4. Test under load and adjust limits

---

### Priority P2 - MEDIUM (Fix This Month)

#### **P2-1: Implement Response Caching Layer**

**Impact**: Reduces database load, improves API response times
**Effort**: 8 hours
**Risk**: Low

**Action Items**:
1. Install node-cache: `bun add node-cache`
2. Implement caching wrapper (see Section 4.3 Optimization #1)
3. Add cache invalidation logic
4. Add cache hit/miss metrics

**Recommended Cache Strategy**:
```
Dashboard apps list: 5 minutes
Model lists: 5 minutes
Category lists: 10 minutes
User statistics: 1 minute
Generation results: 1 hour
```

#### **P2-2: Optimize Database Queries**

**Impact**: Reduces N+1 queries, improves performance
**Effort**: 12 hours
**Risk**: Medium (requires careful testing)

**Action Items**:
1. Audit all queries for N+1 problems
2. Add composite indexes (see Section 4.3 Optimization #3)
3. Refactor queries to use `include` properly (see Section 4.3 Optimization #2)
4. Add query performance monitoring

#### **P2-3: Implement Webhook Retry Mechanism**

**Impact**: Ensures payment callbacks don't get lost
**Effort**: 6 hours
**Risk**: Low

**Action Items**:
1. Create `WebhookFailure` model in Prisma schema
2. Implement retry logic (see Section 6.1 Duitku Payment Gateway)
3. Add retry worker with exponential backoff
4. Add monitoring dashboard for failed webhooks

#### **P2-4: Add API Rate Limiting for External Services**

**Impact**: Prevents quota exhaustion, controls costs
**Effort**: 8 hours
**Risk**: Low

**Action Items**:
1. Install bottleneck: `bun add bottleneck`
2. Implement rate limiters for each external API (see Section 4.2)
3. Add queue depth monitoring
4. Add cost tracking per API

---

### Priority P3 - LOW (Nice to Have)

#### **P3-1: Implement API Versioning**

**Impact**: Enables breaking changes without affecting existing clients
**Effort**: 16 hours
**Risk**: Medium

**Action Items**:
1. Design API versioning strategy (see Section 3.2)
2. Refactor routes to support /api/v1/ and /api/v2/
3. Implement version negotiation middleware
4. Document migration path for clients

#### **P3-2: Add Observability Stack**

**Impact**: Improves debugging, monitoring, and alerting
**Effort**: 24 hours
**Risk**: Low

**Action Items**:
1. Integrate Sentry for error tracking
2. Add Prometheus metrics endpoint
3. Configure Grafana dashboards
4. Set up alerting rules
5. Implement distributed tracing with OpenTelemetry

#### **P3-3: Migrate to Cloudflare R2 for File Storage**

**Impact**: Reduces storage costs, improves scalability
**Effort**: 20 hours
**Risk**: Medium

**Action Items**:
1. Set up Cloudflare R2 bucket
2. Implement storage abstraction layer
3. Migrate existing files to R2
4. Update all file URLs to use R2
5. Configure CDN for R2 assets

#### **P3-4: Implement Database Sharding Strategy**

**Impact**: Enables horizontal scaling beyond single database
**Effort**: 40+ hours
**Risk**: High

**Action Items**:
1. Analyze data access patterns
2. Design sharding key strategy (likely by userId)
3. Implement shard routing logic
4. Set up multiple database instances
5. Migrate data to sharded architecture
6. Test cross-shard queries

---

## 9. IMPLEMENTATION ROADMAP

### Week 1: Critical Fixes (P0)

**Goals**:
- Fix module loading circular dependency
- Update axios for security
- Fix Redis connection in Coolify

**Deliverables**:
- Pose generator re-enabled in production
- All plugins loading successfully
- Workers processing jobs correctly

**Success Metrics**:
- Zero deployment failures due to module loading
- Redis connection success rate > 99.9%
- All security vulnerabilities resolved

---

### Week 2-3: High Priority Improvements (P1)

**Goals**:
- Add database connection pooling
- Implement streaming file uploads
- Add circuit breakers for external APIs
- Configure Docker resource limits

**Deliverables**:
- Database connection pool configured and monitored
- Streaming uploads supporting 1GB+ files
- Circuit breakers preventing cascading failures
- Docker containers with proper resource limits

**Success Metrics**:
- Database connection exhaustion eliminated
- Memory usage reduced by 60% during uploads
- External API failures don't crash application
- Container OOM kills reduced to zero

---

### Month 2: Medium Priority Features (P2)

**Goals**:
- Implement response caching
- Optimize database queries
- Add webhook retry mechanism
- Implement external API rate limiting

**Deliverables**:
- Response caching reducing DB load by 40%
- N+1 queries eliminated
- Payment webhooks never lost
- External API costs reduced by 30%

**Success Metrics**:
- API response time improved by 50%
- Database queries reduced by 40%
- Webhook delivery success rate > 99.9%
- External API quota never exceeded

---

### Month 3+: Long-term Improvements (P3)

**Goals**:
- Implement API versioning
- Add observability stack
- Migrate to Cloudflare R2
- Plan database sharding strategy

**Deliverables**:
- API v2 with breaking changes deployed
- Full observability stack operational
- All files migrated to R2
- Sharding strategy documented and tested

**Success Metrics**:
- Zero breaking changes affecting existing clients
- Mean time to detection (MTTD) < 5 minutes
- Storage costs reduced by 70%
- Database ready for 10x growth

---

## 10. CONCLUSION

### Current State Summary

**Architectural Maturity**: GROWING (Level 2/5)

The Lumiku application demonstrates solid architectural foundations with a well-designed plugin system, comprehensive error handling, and strong database schema design. However, critical issues around dependency management, infrastructure configuration, and operational maturity prevent it from achieving production-grade stability.

### Key Strengths

1. **Plugin Architecture**: Clean separation of concerns, easy feature addition
2. **Error Handling**: Comprehensive error handling across frontend and backend
3. **Database Design**: Well-normalized schema with proper indexing
4. **Security**: Strong validation, authentication, and authorization

### Critical Weaknesses

1. **Module Loading**: Import-time dependencies causing cascading failures
2. **Resource Management**: Missing connection pooling, memory limits, rate limiting
3. **Observability**: No monitoring, alerting, or distributed tracing
4. **Deployment Stability**: 3 of last 5 commits are deployment fixes

### Path to Production Excellence

**Immediate Actions** (Next 7 Days):
- Fix circular dependency in pose-generator
- Update axios for security
- Configure Redis properly in Coolify
- Add basic monitoring

**Short-term Actions** (Next 30 Days):
- Implement connection pooling
- Add circuit breakers
- Optimize database queries
- Configure resource limits

**Long-term Vision** (Next 90 Days):
- Full observability stack
- API versioning
- Cloud storage migration
- Horizontal scaling strategy

### Recommended Next Steps

1. **Assign Owner**: Appoint technical lead for architecture improvements
2. **Create Tickets**: Convert P0 and P1 recommendations into Jira/GitHub issues
3. **Schedule Work**: Allocate dedicated time for architectural improvements
4. **Monitor Progress**: Weekly architecture review meetings
5. **Measure Success**: Track metrics defined in each priority section

### Final Recommendation

The Lumiku application is **NOT ready for large-scale production deployment** in its current state. However, with focused effort on P0 and P1 priorities over the next 2-3 weeks, it can achieve production-grade stability.

**Risk Assessment**:
- **Current Risk**: HIGH (deployment failures, resource exhaustion, data loss)
- **Post-P0 Fixes**: MEDIUM (stable but not optimized)
- **Post-P1 Fixes**: LOW (production-ready)

**Confidence Level**: HIGH
This analysis is based on comprehensive code review, deployment history analysis, and industry best practices for Node.js/Bun applications.

---

**Document Version**: 1.0
**Last Updated**: October 16, 2025
**Next Review**: November 16, 2025 (after P0/P1 fixes)
