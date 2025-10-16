# Phase 3 Installation Guide

## Quick Start (5 minutes)

### 1. Install Socket.IO

```bash
cd backend
bun add socket.io
```

### 2. Configure Environment

Add to `.env`:

```bash
# Required
HUGGINGFACE_API_KEY=hf_your_api_key_here

# Optional (defaults shown)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
WORKER_CONCURRENCY=5
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 --name lumiku-redis redis:latest

# Verify
redis-cli ping  # Should return: PONG
```

### 4. Integrate WebSocket

Add to your main server file (e.g., `backend/src/index.ts`):

```typescript
import { setupPoseWebSocket } from './apps/pose-generator/websocket/pose-websocket'
import { createServer } from 'http'

// Existing Hono app
const app = new Hono()

// Create HTTP server from Hono app
const httpServer = createServer((req, res) => {
  // Pass requests to Hono
  app.fetch(req).then((response) => {
    res.writeHead(response.status, response.statusText)
    response.body?.pipeTo(new WritableStream({
      write(chunk) { res.write(chunk) }
    }))
    res.end()
  })
})

// Setup WebSocket
setupPoseWebSocket(httpServer)

// Start server
httpServer.listen(4000, () => {
  console.log('Server running on http://localhost:4000')
})
```

**OR** if using `@hono/node-server`:

```typescript
import { serve } from '@hono/node-server'
import { setupPoseWebSocket } from './apps/pose-generator/websocket/pose-websocket'

const app = new Hono()

// Create server
const server = serve({
  fetch: app.fetch,
  port: 4000,
})

// Setup WebSocket
setupPoseWebSocket(server)

console.log('Server running on http://localhost:4000')
```

### 5. Run System

**Terminal 1 - API Server:**
```bash
cd backend
bun run dev
```

**Terminal 2 - Worker:**
```bash
cd backend
bun run worker:pose-generator:dev
```

### 6. Test It Works

```bash
# 1. Health check
curl http://localhost:4000/api/apps/pose-generator/health

# 2. Queue metrics (via Redis CLI)
redis-cli
> LLEN bull:pose-generation:wait  # Should return 0
> exit

# 3. Check worker logs
# Look for: "Pose generation worker started successfully"
```

---

## Production Deployment

### Option 1: PM2

```bash
# Install PM2
npm install -g pm2

# Start API
pm2 start bun --name "lumiku-api" -- run start

# Start workers (3 instances)
pm2 start bun --name "lumiku-worker" --instances 3 -- run worker:pose-generator

# Monitor
pm2 monit

# Save config
pm2 save

# Auto-restart on reboot
pm2 startup
```

### Option 2: Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  api:
    build: ./backend
    command: bun run start
    environment:
      - REDIS_HOST=redis
      - DATABASE_URL=${DATABASE_URL}
      - HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "4000:4000"
    depends_on:
      - redis
      - postgres

  worker:
    build: ./backend
    command: bun run worker:pose-generator
    environment:
      - REDIS_HOST=redis
      - DATABASE_URL=${DATABASE_URL}
      - HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}
      - WORKER_CONCURRENCY=5
    deploy:
      replicas: 3
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=lumiku
      - POSTGRES_USER=lumiku
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

Start:
```bash
docker-compose up -d
docker-compose logs -f worker  # Monitor workers
```

---

## Troubleshooting

### Worker Not Starting

**Check Redis connection:**
```bash
redis-cli -h localhost -p 6379 ping
```

**Check HUGGINGFACE_API_KEY:**
```bash
echo $HUGGINGFACE_API_KEY
curl -H "Authorization: Bearer $HUGGINGFACE_API_KEY" \
  https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev
```

**Check logs:**
```bash
# If using PM2
pm2 logs lumiku-worker

# If using Docker
docker-compose logs worker
```

### WebSocket Not Connecting

**Check CORS:**
- Ensure `CORS_ORIGIN` includes your frontend URL
- Check browser console for CORS errors

**Verify Socket.IO installed:**
```bash
cd backend
bun pm ls | grep socket.io
```

**Test WebSocket manually:**
```javascript
// In browser console
const socket = io('http://localhost:4000/pose-generator', {
  auth: { token: 'your-jwt-token' },
  transports: ['websocket']
})

socket.on('connected', (data) => console.log('Connected:', data))
socket.on('connect_error', (err) => console.error('Error:', err))
```

### Queue Not Processing

**Check queue depth:**
```bash
redis-cli
> LLEN bull:pose-generation:wait
> ZCARD bull:pose-generation:active
> LLEN bull:pose-generation:completed
> LLEN bull:pose-generation:failed
```

**Manually add test job:**
```typescript
import { enqueuePoseGeneration } from './queue/queue.config'

await enqueuePoseGeneration({
  generationId: 'test-gen-123',
  userId: 'test-user',
  projectId: 'test-project',
  generationType: 'TEXT_DESCRIPTION',
  textPrompt: 'test prompt',
  batchSize: 1,
  totalExpectedPoses: 1,
  useBackgroundChanger: false,
  creditCharged: 30,
})
```

---

## Verification Checklist

- [ ] Socket.IO installed
- [ ] Environment variables set
- [ ] Redis running and accessible
- [ ] API server starts without errors
- [ ] Worker starts and shows "listening for jobs"
- [ ] Health endpoint returns 200
- [ ] WebSocket connects successfully
- [ ] Test generation completes end-to-end

---

## Next Steps

1. ✅ Complete installation
2. 🧪 Run integration tests
3. 📊 Monitor queue metrics
4. 🚀 Deploy to staging
5. 🎯 Phase 4: Cloudflare R2 + ControlNet

---

**Support:** See `backend/src/apps/pose-generator/README.md` for detailed documentation
