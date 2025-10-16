# Pose Generator - Quick Start Guide

## 5-Minute Setup (PM2)

### 1. Prerequisites
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install PM2
npm install -g pm2

# Install PostgreSQL
# Ubuntu/Debian: sudo apt install postgresql
# macOS: brew install postgresql

# Install Redis
# Ubuntu/Debian: sudo apt install redis-server
# macOS: brew install redis
```

### 2. Configuration
```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env - Set these REQUIRED variables:
# - DATABASE_URL (PostgreSQL connection string)
# - REDIS_PASSWORD (secure password)
# - JWT_SECRET (32+ character secret)
# - HUGGINGFACE_API_KEY (from huggingface.co)
```

### 3. Database Setup
```bash
# Install dependencies
bun install

# Generate Prisma client
bun run prisma:generate

# Run migrations
bun run prisma:migrate:deploy

# Seed pose library
bun run seed:pose-generator
```

### 4. Start Services
```bash
# Start API + Worker
npm run pm2:start:prod

# Check status
npm run pm2:status

# View logs
npm run pm2:logs
```

### 5. Verify
```bash
# Health check
curl http://localhost:3000/api/apps/pose-generator/health

# Expected: {"status":"healthy",...}
```

Done! API running on http://localhost:3000

## 5-Minute Setup (Docker)

### 1. Prerequisites
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Configuration
```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env - Set these REQUIRED variables:
# - DB_PASSWORD
# - REDIS_PASSWORD
# - JWT_SECRET
# - HUGGINGFACE_API_KEY
```

### 3. Start Everything
```bash
# Build and start all services
docker-compose up -d

# Wait for services to be healthy (30 seconds)
sleep 30

# Run migrations
docker-compose exec api bun run prisma:migrate:deploy

# Seed pose library
docker-compose exec api bun run seed:pose-generator
```

### 4. Verify
```bash
# Check services
docker-compose ps

# Health check
curl http://localhost:3000/api/apps/pose-generator/health
```

Done! All services running in Docker.

## Testing Generation Flow

### 1. Get Authentication Token
```bash
# Register/Login via API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Copy the JWT token from response
TOKEN="eyJhbGc..."
```

### 2. Create a Project
```bash
curl -X POST http://localhost:3000/api/apps/pose-generator/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "My First Project",
    "avatarImageUrl": "https://example.com/avatar.jpg",
    "avatarSource": "UPLOAD"
  }'

# Copy the project ID from response
PROJECT_ID="..."
```

### 3. Browse Pose Library
```bash
curl http://localhost:3000/api/apps/pose-generator/library \
  -H "Authorization: Bearer $TOKEN"

# Copy some pose IDs
```

### 4. Start Generation
```bash
curl -X POST http://localhost:3000/api/apps/pose-generator/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "generationType": "GALLERY_REFERENCE",
    "selectedPoseIds": ["pose-id-1", "pose-id-2"]
  }'

# Copy the generation ID
GENERATION_ID="..."
```

### 5. Check Progress
```bash
# Poll status
curl http://localhost:3000/api/apps/pose-generator/generations/$GENERATION_ID \
  -H "Authorization: Bearer $TOKEN"

# Wait for status: "completed"
```

### 6. Get Results
```bash
curl http://localhost:3000/api/apps/pose-generator/generations/$GENERATION_ID/results \
  -H "Authorization: Bearer $TOKEN"

# Download generated images from URLs
```

## WebSocket Real-Time Updates

### JavaScript/TypeScript Client
```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000/pose-generator', {
  path: '/pose-generator-ws',
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
})

socket.on('connected', (data) => {
  console.log('Connected:', data)
})

socket.on('pose-generation-update', (event) => {
  console.log('Update:', event)
  // event.type: 'started' | 'progress' | 'completed' | 'failed'
})
```

### React Hook Example
```typescript
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export function usePoseGenerationUpdates(token: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [updates, setUpdates] = useState<any[]>([])

  useEffect(() => {
    const s = io('http://localhost:3000/pose-generator', {
      path: '/pose-generator-ws',
      auth: { token }
    })

    s.on('pose-generation-update', (event) => {
      setUpdates(prev => [...prev, event])
    })

    setSocket(s)

    return () => {
      s.disconnect()
    }
  }, [token])

  return { socket, updates }
}
```

## Common Commands

### PM2
```bash
# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Monitor
pm2 monit

# Status
pm2 status
```

### Docker
```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Status
docker-compose ps

# Scale workers
docker-compose up -d --scale pose-worker=3
```

### Database
```bash
# Connect to database (PM2)
psql $DATABASE_URL

# Connect to database (Docker)
docker-compose exec postgres psql -U lumiku -d lumiku_production

# View generations
SELECT id, status, poses_completed, total_expected_poses
FROM pose_generations
ORDER BY created_at DESC
LIMIT 10;
```

### Redis
```bash
# Check queue (PM2)
redis-cli -a $REDIS_PASSWORD
> KEYS pose-generation:*
> LLEN bull:pose-generation:wait

# Check queue (Docker)
docker-compose exec redis redis-cli -a $REDIS_PASSWORD
> KEYS pose-generation:*
```

## Troubleshooting

### Services won't start
```bash
# Check environment variables
cat .env | grep -v '^#' | grep -v '^$'

# Check logs
pm2 logs --lines 50
# or
docker-compose logs --tail 50
```

### Worker not processing
```bash
# Check worker is running
pm2 list | grep worker
# or
docker-compose ps pose-worker

# Check Redis connection
redis-cli -a $REDIS_PASSWORD ping

# Restart worker
pm2 restart pose-generator-worker
# or
docker-compose restart pose-worker
```

### WebSocket won't connect
```bash
# Check API is running
curl http://localhost:3000/health

# Check JWT token is valid
# Decode at https://jwt.io

# Check CORS origin
# In .env: CORS_ORIGIN=http://localhost:5173
```

### Out of credits
```bash
# Add credits via API
curl -X POST http://localhost:3000/api/admin/credits/add \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","amount":1000,"reason":"Testing"}'
```

## Next Steps

- Read full deployment guide: `POSE_GENERATOR_DEPLOYMENT.md`
- Review architecture: `docs/POSE_GENERATOR_ARCHITECTURE.md`
- Configure monitoring and backups
- Set up SSL/TLS certificates
- Configure firewall rules
- Optimize for production traffic

## Support

For detailed documentation, see:
- `/docs/POSE_GENERATOR_ARCHITECTURE.md` - System architecture
- `POSE_GENERATOR_DEPLOYMENT.md` - Complete deployment guide
- `src/apps/pose-generator/routes.ts` - API endpoints
