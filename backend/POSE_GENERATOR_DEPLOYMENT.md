# Pose Generator - Production Deployment Guide

## Overview

This guide covers the complete deployment process for the Lumiku Pose Generator, including:
- WebSocket integration for real-time updates
- Worker process management for background jobs
- Health monitoring and observability
- Multiple deployment options (PM2, Docker, systemd)

## Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/Vue)    │
└────────┬────────┘
         │ HTTP + WebSocket
         ▼
┌─────────────────┐         ┌─────────────┐
│   API Server    │◄────────►│   Redis     │
│  (Hono + WS)    │         │ (Queue+Pub) │
└────────┬────────┘         └──────┬──────┘
         │                          │
         │ Database                 │ Jobs
         ▼                          ▼
┌─────────────────┐         ┌─────────────┐
│   PostgreSQL    │         │   Workers   │
│    (Prisma)     │         │  (BullMQ)   │
└─────────────────┘         └─────────────┘
```

## Prerequisites

### Required Software
- **Bun** v1.0+ (JavaScript runtime)
- **PostgreSQL** 15+ (Database)
- **Redis** 7+ (Queue and Pub/Sub)
- **Node.js** 18+ (if using PM2)

### Required API Keys
- **Hugging Face API Key** - For AI model inference
  - Get it from: https://huggingface.co/settings/tokens
  - Required permissions: Read access to models

### System Requirements

#### Minimum (Development)
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB

#### Recommended (Production)
- CPU: 4+ cores
- RAM: 8GB+ (2GB per worker)
- Storage: 100GB+ (for generated images)

## Environment Variables

Create `.env` file in backend directory:

```bash
# ========================================
# Application
# ========================================
NODE_ENV=production
PORT=3000

# ========================================
# Database
# ========================================
DATABASE_URL=postgresql://user:password@localhost:5432/lumiku_production

# ========================================
# Redis (Required for Production)
# ========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password

# ========================================
# Security
# ========================================
JWT_SECRET=your_jwt_secret_key_at_least_32_characters
CORS_ORIGIN=https://yourdomain.com

# ========================================
# External APIs
# ========================================
HUGGINGFACE_API_KEY=hf_your_api_key_here

# ========================================
# Worker Configuration
# ========================================
WORKER_CONCURRENCY=5
WORKER_NAME=pose-generator-worker-1

# ========================================
# Storage (Optional)
# ========================================
STORAGE_TYPE=local
UPLOAD_DIR=./uploads

# ========================================
# Rate Limiting
# ========================================
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

## Deployment Methods

### Method 1: PM2 (Recommended for VPS/Dedicated Servers)

PM2 is a production-grade process manager for Node.js applications.

#### Installation

```bash
# Install PM2 globally
npm install -g pm2

# Or with Bun
bun add -g pm2
```

#### Setup

```bash
cd backend

# Install dependencies
bun install

# Generate Prisma client
bun run prisma:generate

# Run database migrations
bun run prisma:migrate:deploy

# Seed pose library (first time only)
bun run seed:pose-generator
```

#### Start Services

```bash
# Development
npm run pm2:start

# Production
npm run pm2:start:prod

# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Interactive monitoring
npm run pm2:monit
```

#### PM2 Commands

```bash
# Stop all services
npm run pm2:stop

# Restart all services
npm run pm2:restart

# Reload services (zero-downtime)
npm run pm2:reload

# Delete all services
npm run pm2:delete

# View specific service logs
pm2 logs lumiku-api
pm2 logs pose-generator-worker

# Clear logs
npm run pm2:flush
```

#### Enable Auto-Start on System Boot

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save

# To disable auto-start
pm2 unstartup
```

#### Scaling Workers

Edit `ecosystem.config.js`:

```javascript
{
  name: 'pose-generator-worker',
  instances: 3,  // Run 3 worker instances
  exec_mode: 'cluster',
  // ... other config
}
```

Then reload:
```bash
pm2 reload ecosystem.config.js
```

### Method 2: Docker Compose (Recommended for Containerized Deployments)

Docker Compose simplifies multi-container deployments.

#### Installation

```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Setup

Create `.env` file with all required variables (see section above).

```bash
cd backend

# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f pose-worker
```

#### Database Migration

```bash
# Run migrations
docker-compose exec api bun run prisma:migrate:deploy

# Seed pose library (first time only)
docker-compose exec api bun run seed:pose-generator
```

#### Docker Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ DATA LOSS)
docker-compose down -v

# Restart specific service
docker-compose restart pose-worker

# Scale workers
docker-compose up -d --scale pose-worker=3

# View resource usage
docker stats

# Access container shell
docker-compose exec api sh
docker-compose exec pose-worker sh
```

#### Production Optimization

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  pose-worker:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 3G
        reservations:
          cpus: '1'
          memory: 2G
```

Deploy with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Method 3: Systemd (Linux Servers)

Systemd is the standard init system for modern Linux distributions.

#### Create Service Files

**API Service**: `/etc/systemd/system/lumiku-api.service`

```ini
[Unit]
Description=Lumiku API Server
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=lumiku
Group=lumiku
WorkingDirectory=/opt/lumiku/backend
EnvironmentFile=/opt/lumiku/backend/.env
ExecStart=/usr/bin/bun run src/index.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lumiku-api

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/lumiku/backend/uploads /opt/lumiku/backend/logs

[Install]
WantedBy=multi-user.target
```

**Worker Service**: `/etc/systemd/system/pose-generator-worker.service`

```ini
[Unit]
Description=Pose Generator Worker
After=network.target postgresql.service redis.service lumiku-api.service
Wants=postgresql.service redis.service lumiku-api.service

[Service]
Type=simple
User=lumiku
Group=lumiku
WorkingDirectory=/opt/lumiku/backend
EnvironmentFile=/opt/lumiku/backend/.env
ExecStart=/usr/bin/bun run src/apps/pose-generator/worker.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=pose-worker

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/lumiku/backend/uploads /opt/lumiku/backend/logs

[Install]
WantedBy=multi-user.target
```

#### Setup and Start

```bash
# Create user
sudo useradd -r -s /bin/false lumiku

# Set permissions
sudo chown -R lumiku:lumiku /opt/lumiku

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable lumiku-api
sudo systemctl enable pose-generator-worker

# Start services
sudo systemctl start lumiku-api
sudo systemctl start pose-generator-worker

# Check status
sudo systemctl status lumiku-api
sudo systemctl status pose-generator-worker

# View logs
sudo journalctl -u lumiku-api -f
sudo journalctl -u pose-generator-worker -f
```

## Health Monitoring

### Health Check Endpoints

#### Basic API Health
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "service": "lumiku-backend",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2025-10-14T12:00:00.000Z"
}
```

#### Database Health
```bash
curl http://localhost:3000/api/health
```

#### Pose Generator Health (Comprehensive)
```bash
curl http://localhost:3000/api/apps/pose-generator/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-14T12:00:00.000Z",
  "app": "pose-generator",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "connected"
    },
    "redis": {
      "status": "connected"
    },
    "queue": {
      "status": "operational",
      "counts": {
        "waiting": 5,
        "active": 2,
        "completed": 1234,
        "failed": 3,
        "delayed": 0
      }
    }
  },
  "phase": "Production Ready"
}
```

### Monitoring Setup

#### Using PM2

PM2 provides built-in monitoring:

```bash
# Dashboard
pm2 monit

# Web dashboard (requires pm2-web)
pm2 web

# Metrics
pm2 describe lumiku-api
pm2 describe pose-generator-worker
```

#### Using Docker

```bash
# Resource usage
docker stats

# Health checks
docker inspect --format='{{json .State.Health}}' lumiku-api
```

#### External Monitoring Tools

**Uptime Kuma** (Self-hosted)
```bash
# Health check monitor
Monitor Type: HTTP(s)
URL: http://localhost:3000/api/apps/pose-generator/health
Interval: 60 seconds
```

**Prometheus + Grafana**

Add metrics endpoint to your app:
```typescript
app.get('/metrics', async (c) => {
  // Expose metrics in Prometheus format
})
```

## Testing the Integration

### 1. Start Services

**PM2:**
```bash
npm run pm2:start
npm run pm2:status
```

**Docker:**
```bash
docker-compose up -d
docker-compose ps
```

### 2. Verify Health

```bash
# Check API
curl http://localhost:3000/health

# Check Pose Generator
curl http://localhost:3000/api/apps/pose-generator/health
```

### 3. Test WebSocket Connection

Create `test-websocket.js`:

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000/pose-generator', {
  path: '/pose-generator-ws',
  auth: {
    token: 'YOUR_JWT_TOKEN_HERE'
  }
})

socket.on('connect', () => {
  console.log('✅ WebSocket connected:', socket.id)
})

socket.on('connected', (data) => {
  console.log('✅ Authenticated:', data)
})

socket.on('pose-generation-update', (event) => {
  console.log('📦 Update received:', event)
})

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason)
})

socket.on('error', (error) => {
  console.error('❌ Error:', error)
})

// Test ping-pong
setInterval(() => {
  socket.emit('ping')
}, 5000)

socket.on('pong', (data) => {
  console.log('🏓 Pong:', data)
})
```

Run:
```bash
bun test-websocket.js
```

### 4. Test Generation Flow

```bash
# Get JWT token (login first)
TOKEN="your_jwt_token"

# Create a project
curl -X POST http://localhost:3000/api/apps/pose-generator/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Test Project",
    "avatarImageUrl": "https://example.com/avatar.jpg",
    "avatarSource": "UPLOAD"
  }'

# Start generation
curl -X POST http://localhost:3000/api/apps/pose-generator/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "generationType": "GALLERY_REFERENCE",
    "selectedPoseIds": ["pose-id-1", "pose-id-2"]
  }'

# Check generation status
curl http://localhost:3000/api/apps/pose-generator/generations/GENERATION_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Monitor Logs

**PM2:**
```bash
pm2 logs lumiku-api
pm2 logs pose-generator-worker
```

**Docker:**
```bash
docker-compose logs -f api
docker-compose logs -f pose-worker
```

**Systemd:**
```bash
sudo journalctl -u lumiku-api -f
sudo journalctl -u pose-generator-worker -f
```

## Troubleshooting

### Worker Not Processing Jobs

**Check 1: Worker is running**
```bash
pm2 list                           # PM2
docker-compose ps                  # Docker
sudo systemctl status pose-worker  # Systemd
```

**Check 2: Redis connection**
```bash
redis-cli -h localhost -p 6379 -a YOUR_PASSWORD ping
```

**Check 3: Queue status**
```bash
curl http://localhost:3000/api/apps/pose-generator/health
```

**Check 4: Worker logs**
```bash
pm2 logs pose-generator-worker --lines 100
```

### WebSocket Connection Fails

**Check 1: Server is running**
```bash
curl http://localhost:3000/health
```

**Check 2: CORS configuration**
```bash
# In .env
CORS_ORIGIN=https://yourdomain.com
```

**Check 3: JWT token is valid**
```bash
# Decode JWT at https://jwt.io
```

**Check 4: WebSocket path is correct**
```javascript
// Frontend
const socket = io('http://localhost:3000/pose-generator', {
  path: '/pose-generator-ws',  // Important!
  auth: { token: 'YOUR_TOKEN' }
})
```

### High Memory Usage

**Check 1: Worker concurrency**
```bash
# Reduce in .env
WORKER_CONCURRENCY=3
```

**Check 2: PM2 memory restart**
```javascript
// ecosystem.config.js
max_memory_restart: '1G'
```

**Check 3: Docker memory limits**
```yaml
# docker-compose.yml
services:
  pose-worker:
    deploy:
      resources:
        limits:
          memory: 2G
```

### Database Connection Issues

**Check 1: PostgreSQL is running**
```bash
sudo systemctl status postgresql
```

**Check 2: Connection string**
```bash
# Test connection
psql $DATABASE_URL
```

**Check 3: Firewall rules**
```bash
sudo ufw allow 5432/tcp
```

### Redis Connection Issues

**Check 1: Redis is running**
```bash
redis-cli ping
```

**Check 2: Authentication**
```bash
redis-cli -a YOUR_PASSWORD ping
```

**Check 3: Check .env variables**
```bash
echo $REDIS_HOST
echo $REDIS_PORT
echo $REDIS_PASSWORD
```

## Performance Optimization

### Worker Scaling

**Vertical Scaling** (More powerful workers)
```bash
# Increase worker concurrency
WORKER_CONCURRENCY=10
```

**Horizontal Scaling** (More worker instances)
```bash
# PM2
pm2 scale pose-generator-worker +2

# Docker
docker-compose up -d --scale pose-worker=5
```

### Database Optimization

```sql
-- Add indexes for frequent queries
CREATE INDEX idx_pose_generations_user_id ON pose_generations(user_id);
CREATE INDEX idx_pose_generations_status ON pose_generations(status);
CREATE INDEX idx_generated_poses_generation_id ON generated_poses(generation_id);
```

### Redis Optimization

```bash
# Increase max memory
redis-cli CONFIG SET maxmemory 1gb

# Set eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Backup and Recovery

### Database Backups

```bash
# Automated daily backup
cat > /etc/cron.daily/lumiku-backup << 'EOF'
#!/bin/bash
pg_dump $DATABASE_URL | gzip > /backups/lumiku-$(date +%Y%m%d).sql.gz
# Keep last 30 days
find /backups -name "lumiku-*.sql.gz" -mtime +30 -delete
EOF

chmod +x /etc/cron.daily/lumiku-backup
```

### File Storage Backups

```bash
# Rsync uploads to backup location
rsync -avz /opt/lumiku/backend/uploads/ /backups/uploads/
```

### Redis Persistence

Redis is configured with AOF (Append Only File):

```bash
# Manual save
redis-cli BGSAVE

# Backup AOF file
cp /var/lib/redis/appendonly.aof /backups/redis-backup.aof
```

## Security Checklist

- [ ] Strong JWT_SECRET (32+ characters)
- [ ] Redis password authentication enabled
- [ ] PostgreSQL password authentication
- [ ] CORS_ORIGIN restricted to your domain
- [ ] Firewall rules configured
- [ ] SSL/TLS certificates installed
- [ ] Regular security updates applied
- [ ] Non-root user for services
- [ ] File permissions properly set
- [ ] Rate limiting enabled
- [ ] Log monitoring in place
- [ ] Backup strategy implemented

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Pose library seeded
- [ ] Health checks passing
- [ ] Workers running and processing jobs
- [ ] WebSocket connections working
- [ ] Monitoring configured
- [ ] Logs being collected
- [ ] Backups scheduled
- [ ] Auto-restart on failure enabled
- [ ] SSL certificates valid
- [ ] Performance benchmarks met

## Support and Resources

- **Documentation**: `/docs` directory
- **Health Endpoint**: `GET /api/apps/pose-generator/health`
- **Architecture**: `docs/POSE_GENERATOR_ARCHITECTURE.md`
- **API Reference**: See routes.ts for all endpoints

## Version History

- **v1.0.0** (2025-10-14) - Production release with WebSocket integration
