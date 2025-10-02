# Redis Setup Guide for Video Processing

Redis is required for the background queue system that processes video generation jobs.

---

## 📋 Quick Start

You have **3 options** to setup Redis:

1. **Cloud Redis (Easiest)** - Upstash free tier (recommended for Windows)
2. **Docker** - If you have Docker installed
3. **Local Installation** - Native Redis server

---

## Option 1: Cloud Redis (Upstash) - Recommended ✅

**Pros:** No installation, works on all OS, free tier available
**Cons:** Requires internet connection

### Steps:

1. **Sign up for Upstash**
   - Visit: https://upstash.com/
   - Click "Get Started" → Sign up with Google/GitHub
   - Free tier includes: 10,000 commands/day

2. **Create Redis Database**
   - Click "Create Database"
   - Choose region closest to you
   - Select "Free" plan
   - Click "Create"

3. **Get Connection Details**
   - Click on your database
   - Scroll to "REST API" section
   - Copy these values:
     ```
     UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
     UPSTASH_REDIS_REST_TOKEN=xxx
     ```

4. **Update .env file**
   ```bash
   # backend/.env
   REDIS_HOST="your-db-name.upstash.io"
   REDIS_PORT="6379"
   REDIS_PASSWORD="your-password-from-upstash"
   ```

5. **Test Connection**
   ```bash
   cd backend
   bun run test-redis
   ```

---

## Option 2: Docker (Linux/Mac/Windows with Docker)

**Pros:** Isolated, easy to manage
**Cons:** Requires Docker Desktop

### Steps:

1. **Install Docker Desktop**
   - Windows/Mac: https://www.docker.com/products/docker-desktop
   - Linux: https://docs.docker.com/engine/install/

2. **Run Redis Container**
   ```bash
   docker run -d \
     --name redis-lumiku \
     -p 6379:6379 \
     redis:alpine
   ```

3. **Verify Redis is Running**
   ```bash
   docker ps | grep redis
   ```

4. **Update .env file**
   ```bash
   # backend/.env
   REDIS_HOST="localhost"
   REDIS_PORT="6379"
   REDIS_PASSWORD=""
   ```

5. **Test Connection**
   ```bash
   cd backend
   bun run test-redis
   ```

### Docker Management Commands:

```bash
# Start Redis
docker start redis-lumiku

# Stop Redis
docker stop redis-lumiku

# View logs
docker logs redis-lumiku

# Remove container
docker rm redis-lumiku
```

---

## Option 3: Native Installation

### Windows (via Memurai)

Redis doesn't officially support Windows, but Memurai is a Redis-compatible fork:

1. **Download Memurai**
   - Visit: https://www.memurai.com/get-memurai
   - Download Memurai Developer Edition (Free)

2. **Install**
   - Run installer
   - Keep default port 6379
   - Start Memurai service

3. **Update .env**
   ```bash
   REDIS_HOST="localhost"
   REDIS_PORT="6379"
   REDIS_PASSWORD=""
   ```

### Mac (via Homebrew)

```bash
# Install
brew install redis

# Start Redis
brew services start redis

# Stop Redis
brew services stop redis

# Check status
brew services list | grep redis
```

### Linux (Ubuntu/Debian)

```bash
# Install
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server

# Enable auto-start
sudo systemctl enable redis-server

# Check status
sudo systemctl status redis-server
```

---

## 🧪 Testing Redis Connection

Create this test file:

```typescript
// backend/test-redis.ts
import { redis } from './src/lib/redis'

async function testRedis() {
  try {
    console.log('Testing Redis connection...')

    // Test SET
    await redis.set('test-key', 'Hello Redis!')
    console.log('✅ SET operation successful')

    // Test GET
    const value = await redis.get('test-key')
    console.log('✅ GET operation successful:', value)

    // Test DELETE
    await redis.del('test-key')
    console.log('✅ DEL operation successful')

    console.log('\n🎉 Redis connection is working!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    process.exit(1)
  }
}

testRedis()
```

Run test:
```bash
cd backend
bun test-redis.ts
```

Expected output:
```
Testing Redis connection...
✅ Redis connected
✅ Redis ready
✅ SET operation successful
✅ GET operation successful
✅ DEL operation successful

🎉 Redis connection is working!
```

---

## 🚀 Running the Application

Once Redis is setup, you can run the full stack:

```bash
# Terminal 1: Backend API
cd backend
bun run dev

# Terminal 2: Worker Process
cd backend
bun src/workers/video-mixer.worker.ts

# Terminal 3: Frontend
cd frontend
bun run dev
```

Or use the combined command (requires package.json script):
```bash
bun run dev:all
```

---

## 🔧 Troubleshooting

### Error: "Connection refused"

**Cause:** Redis is not running
**Solution:**
- Docker: `docker start redis-lumiku`
- Mac: `brew services start redis`
- Linux: `sudo systemctl start redis-server`
- Windows Memurai: Check Windows Services

### Error: "ECONNREFUSED ::1:6379"

**Cause:** Redis binding to IPv6 instead of IPv4
**Solution:** Use `127.0.0.1` instead of `localhost`:
```bash
REDIS_HOST="127.0.0.1"
```

### Error: "NOAUTH Authentication required"

**Cause:** Redis has password protection enabled
**Solution:** Add password to .env:
```bash
REDIS_PASSWORD="your-redis-password"
```

### Worker not processing jobs

**Checklist:**
1. ✅ Redis is running (`redis-cli ping` should return `PONG`)
2. ✅ Worker process is running
3. ✅ Check worker logs for errors
4. ✅ Verify queue name matches ("video-mixer")

### Jobs stuck in pending

**Possible causes:**
- Worker crashed → Restart worker
- FFmpeg not installed → Install FFmpeg
- Video files missing → Check upload directory
- Insufficient memory → Check system resources

---

## 📊 Monitoring Queue

Optional: Install Bull Board for visual queue monitoring

```bash
cd backend
bun add @bull-board/api @bull-board/hono
```

Add to your backend:
```typescript
// backend/src/index.ts
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { HonoAdapter } from '@bull-board/hono'
import { videoMixerQueue } from './lib/queue'

const serverAdapter = new HonoAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [new BullMQAdapter(videoMixerQueue)],
  serverAdapter,
})

app.route('/admin/queues', serverAdapter.registerPlugin())
```

Access dashboard: http://localhost:3000/admin/queues

---

## 🔒 Production Considerations

### Security
- [ ] Use strong Redis password
- [ ] Enable TLS/SSL for Redis connection
- [ ] Restrict Redis to localhost or private network
- [ ] Use Redis ACL for user permissions

### Performance
- [ ] Set appropriate `maxmemory` policy
- [ ] Enable RDB or AOF persistence
- [ ] Monitor memory usage
- [ ] Use Redis Cluster for high availability

### Scaling
- [ ] Run multiple worker processes
- [ ] Use Redis Sentinel for failover
- [ ] Consider Redis Cloud for managed service
- [ ] Implement rate limiting

---

## 📚 Additional Resources

- **Redis Docs:** https://redis.io/docs/
- **BullMQ Docs:** https://docs.bullmq.io/
- **Upstash:** https://docs.upstash.com/redis
- **Bull Board:** https://github.com/felixmosh/bull-board

---

**Need Help?**
- Check backend logs: `bun run dev` output
- Check worker logs: Worker terminal output
- Test Redis: `redis-cli ping`
- Verify FFmpeg: `ffmpeg -version`
