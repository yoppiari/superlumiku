# Lumiku App - Quickstart Guide

Get up and running with Lumiku App in under 10 minutes.

## Prerequisites Check

Before starting, ensure you have these installed:

```bash
# Check Bun
bun --version  # Should be 1.0+

# Check Node.js
node --version  # Should be 18+

# Check FFmpeg (for video processing)
ffmpeg -version  # Should be 4.4+

# Optional: Check Redis (required for production)
redis-cli --version  # Should be 6+
```

If any are missing:
- **Bun**: https://bun.sh
- **Node.js**: https://nodejs.org
- **FFmpeg**: https://ffmpeg.org/download.html
  - Windows: Download and add to PATH
  - Mac: `brew install ffmpeg`
  - Linux: `apt-get install ffmpeg`
- **Redis**: https://redis.io/download (development optional)

---

## Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/yoppiari/superlumiku.git

# Navigate to project directory
cd lumiku-app

# Check you're in the right place
ls
# Should see: backend/  frontend/  docs/  package.json
```

---

## Step 2: Install Dependencies

```bash
# Install all dependencies (root, backend, frontend)
bun install

# This may take 1-2 minutes
```

Expected output:
```
✓ Installed dependencies for workspace root
✓ Installed dependencies for backend
✓ Installed dependencies for frontend
```

---

## Step 3: Setup Environment Variables

### 3.1 Copy Example Environment File

```bash
# Copy example file
cp .env.example .env

# Copy backend environment file
cp backend/.env.example backend/.env
```

### 3.2 Generate JWT Secret

```bash
# Generate a secure JWT secret (must be 32+ characters)
openssl rand -base64 32

# Copy the output
```

### 3.3 Configure Environment

Edit `backend/.env` with your values:

```bash
# Minimum required for development:

# Database (SQLite for development)
DATABASE_URL="file:./prisma/dev.db"

# Security (paste your generated secret)
JWT_SECRET="<paste-your-generated-secret-here>"
JWT_EXPIRES_IN="7d"

# CORS (must match frontend URL)
CORS_ORIGIN="http://localhost:5173"

# Server
NODE_ENV="development"
PORT="3000"

# Payment Gateway (Duitku Sandbox for development)
DUITKU_MERCHANT_CODE="D12345"
DUITKU_API_KEY="your-sandbox-api-key"
DUITKU_ENV="sandbox"
DUITKU_CALLBACK_URL="http://localhost:3000/api/payment/callback"
DUITKU_RETURN_URL="http://localhost:5173/dashboard"

# Storage
UPLOAD_PATH="./uploads"
OUTPUT_PATH="./outputs"
MAX_FILE_SIZE="524288000"

# FFmpeg
FFMPEG_PATH="ffmpeg"
FFPROBE_PATH="ffprobe"

# Redis (optional for development)
# REDIS_HOST="localhost"
# REDIS_PORT="6379"

# AI Services (optional - only if using AI features)
# ANTHROPIC_API_KEY="sk-ant-..."
# MODELSLAB_API_KEY="..."
# EDENAI_API_KEY="..."
```

**Important**:
- Replace `<paste-your-generated-secret-here>` with your actual JWT secret
- Ensure `JWT_SECRET` is at least 32 characters
- For Duitku, use sandbox credentials for development
- Get Duitku sandbox credentials from https://passport.duitku.com

---

## Step 4: Setup Database

### 4.1 Generate Prisma Client

```bash
# Generate Prisma Client from schema
bun prisma:generate
```

Expected output:
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

### 4.2 Run Migrations

```bash
# Run all database migrations
bun prisma:migrate
```

Expected output:
```
✔ Applied 15 migrations
```

The following migrations will be applied:
- User management
- Credit system
- Payment transactions
- Subscription system
- Quota management
- AI model registry
- Video Mixer app models
- Carousel Mix app models
- Looping Flow app models
- Avatar Creator app models

### 4.3 Seed Database

```bash
# Seed database with test data
bun seed
```

Expected output:
```
✅ Seeded test user: test@lumiku.com (password: password123)
✅ Seeded 100 initial credits
✅ Seeded 5 subscription plans (Free, Basic, Pro, Enterprise)
✅ Seeded 15+ AI models
✅ Database seeding complete!
```

**Test User Created:**
```
Email: test@lumiku.com
Password: password123
Initial Credits: 100
Account Type: PAYG (Pay-as-you-go)
```

---

## Step 5: Start Development Servers

### Option 1: Start Both Servers (Recommended)

```bash
# Start both backend and frontend with one command
bun dev
```

This will:
- Start backend on http://localhost:3000
- Start frontend on http://localhost:5173
- Show logs from both servers

### Option 2: Start Separately

```bash
# Terminal 1 - Start backend
bun dev:backend

# Terminal 2 - Start frontend (in a new terminal)
bun dev:frontend
```

**Expected Output:**

Backend (Terminal 1):
```
✅ Environment variables validated successfully
✅ Database connected successfully
⚠️  WARNING: Running without Redis
⚠️  Rate limiting uses in-memory store
🚀 Server running on http://localhost:3000
📝 Environment: development
🔗 CORS Origin: http://localhost:5173
```

Frontend (Terminal 2):
```
  VITE v7.1.7  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## Step 6: Verify Installation

### 6.1 Test Backend Health

Open browser or use curl:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-14T12:00:00.000Z"
}
```

### 6.2 Test Database Connection

```bash
# Check database connection
curl http://localhost:3000/api/health/db
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "tables": 25
}
```

### 6.3 Open Frontend

1. Open browser: http://localhost:5173
2. You should see the Lumiku login page
3. No errors in browser console

---

## Step 7: Login and Test

### 7.1 Login

1. Go to http://localhost:5173
2. Click "Login" or "Get Started"
3. Enter credentials:
   - Email: `test@lumiku.com`
   - Password: `password123`
4. Click "Login"

### 7.2 Verify Dashboard

After login, you should see:
- Dashboard with all available apps
- Credit balance: 100 credits (top right)
- Apps displayed: Video Mixer, Carousel Mix, Looping Flow, Avatar Creator, Avatar Generator

### 7.3 Test an App

**Test Video Mixer:**
1. Click on "Video Mixer" card
2. Click "Create New Project"
3. Enter project name (e.g., "Test Project")
4. Click "Create"
5. You should be redirected to project page

**Test Avatar Creator:**
1. Go back to dashboard
2. Click on "Avatar Creator"
3. Click "Create New Project"
4. Project should be created successfully

---

## Step 8: Verify Database (Optional)

### Open Prisma Studio

```bash
# Open Prisma Studio GUI
bun prisma:studio
```

This opens http://localhost:5555 where you can:
- Browse all database tables
- View seeded data
- Inspect test user
- Check credit balance
- View subscription plans
- Inspect AI models

**Tables to Check:**
- `users` - Should have 1 test user
- `credits` - Should have initial credit entry
- `subscription_plans` - Should have 5 plans
- `ai_models` - Should have 15+ models

---

## Available Commands Reference

### Root Level Commands

```bash
# Development
bun dev                  # Start both backend and frontend
bun dev:backend          # Start backend only (port 3000)
bun dev:frontend         # Start frontend only (port 5173)

# Build
bun build                # Build both for production
bun build:backend        # Build backend only
bun build:frontend       # Build frontend only

# Database
bun prisma:generate      # Generate Prisma Client
bun prisma:migrate       # Run migrations (creates/applies)
bun prisma:studio        # Open Prisma Studio GUI
bun seed                 # Seed database with test data

# Utilities
bun clean                # Remove all node_modules
```

### Backend Commands (cd backend first)

```bash
# Development
bun run dev              # Start backend with hot reload
bun run start            # Start production build

# Database
bun prisma generate      # Generate Prisma Client
bun prisma migrate dev   # Create new migration
bun prisma migrate deploy # Apply migrations (production)
bun prisma migrate reset  # Reset database (DESTRUCTIVE!)
bun prisma studio        # Open Prisma Studio
bun prisma db seed       # Run seeder script

# Build
bun run build            # Build for production
```

### Frontend Commands (cd frontend first)

```bash
# Development
bun run dev              # Start Vite dev server
bun run build            # Build for production
bun run preview          # Preview production build
```

---

## Common Development Tasks

### Reset Database

**Warning**: This deletes all data!

```bash
# Reset and reapply all migrations
bun prisma migrate reset

# Reseed database
bun seed
```

### Create New Migration

```bash
# 1. Edit backend/prisma/schema.prisma
# 2. Create and apply migration
bun prisma:migrate --name your-migration-name

# Example:
bun prisma:migrate --name add-user-avatar-field
```

### Add New Test Data

Edit `backend/prisma/seed.ts`, then:

```bash
bun seed
```

### Check Database Schema

```bash
# Pull current database schema
bun prisma db pull

# Validate schema against database
bun prisma validate
```

### Format Prisma Schema

```bash
cd backend
bun prisma format
```

---

## Troubleshooting

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### JWT Secret Too Short

**Problem**: `JWT_SECRET: String must contain at least 32 character(s)`

**Solution**:
```bash
# Generate new secret
openssl rand -base64 32

# Update backend/.env with new secret
```

### Database Connection Error

**Problem**: `Error: Can't reach database server`

**Solution**:
```bash
# For SQLite (development)
# Ensure DATABASE_URL is correct:
DATABASE_URL="file:./prisma/dev.db"

# For PostgreSQL (production)
# Check connection string format:
DATABASE_URL="postgresql://user:password@host:5432/database"

# Test connection
cd backend
bun prisma db pull
```

### Prisma Client Not Generated

**Problem**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
# Regenerate Prisma Client
bun prisma:generate

# If still failing, clean and regenerate
rm -rf backend/node_modules/.prisma
bun prisma:generate
```

### CORS Errors in Browser

**Problem**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
```bash
# 1. Check backend/.env has correct frontend URL
CORS_ORIGIN="http://localhost:5173"

# 2. Restart backend
bun dev:backend

# 3. Clear browser cache
# 4. Try in incognito mode
```

### FFmpeg Not Found

**Problem**: `Error: FFmpeg not found`

**Solution**:
```bash
# Check FFmpeg is installed
ffmpeg -version

# Windows: Add to PATH or update .env
FFMPEG_PATH="C:\\path\\to\\ffmpeg.exe"

# Mac: Install via Homebrew
brew install ffmpeg

# Linux: Install via apt
sudo apt-get install ffmpeg
```

### Migration Failed

**Problem**: `Error: Migration failed to apply`

**Solution**:
```bash
# Option 1: Reset database (development only)
bun prisma migrate reset
bun seed

# Option 2: Manually fix and reapply
cd backend
bun prisma migrate resolve --applied <migration-name>
bun prisma migrate deploy
```

### Seed Script Errors

**Problem**: `Error during seeding`

**Solution**:
```bash
# Check if migrations are applied
bun prisma migrate status

# If behind, apply migrations first
bun prisma:migrate

# Then reseed
bun seed
```

### Frontend Build Errors

**Problem**: TypeScript errors during build

**Solution**:
```bash
cd frontend

# Check for type errors
bun run type-check

# Clear cache and rebuild
rm -rf node_modules/.vite
rm -rf dist
bun install
bun run build
```

---

## Next Steps

### Development
1. Read [DEVELOPMENT_GUIDE.md](C:\Users\yoppi\Downloads\Lumiku App\docs\DEVELOPMENT_GUIDE.md) for detailed development workflow
2. Check [API_REFERENCE.md](C:\Users\yoppi\Downloads\Lumiku App\docs\api\README.md) for API documentation
3. Review [ENVIRONMENT_VARIABLES.md](C:\Users\yoppi\Downloads\Lumiku App\docs\ENVIRONMENT_VARIABLES.md) for configuration options

### Testing Features
1. **Video Mixer**:
   - Create project
   - Upload videos (MP4, MOV, AVI)
   - Configure mixing settings
   - Generate videos

2. **Carousel Mix**:
   - Create project
   - Upload images for each position
   - Add text variations
   - Generate carousel sets

3. **Looping Flow**:
   - Create project
   - Upload video
   - Configure loop settings
   - Generate seamless loop

4. **Avatar Creator**:
   - Create project
   - Upload avatar image or generate with AI
   - Set persona information
   - Use avatar in other apps

### Production Deployment
1. Read [PRODUCTION_DEPLOYMENT_GUIDE.md](C:\Users\yoppi\Downloads\Lumiku App\PRODUCTION_DEPLOYMENT_GUIDE.md)
2. Setup PostgreSQL database
3. Configure Redis
4. Get production Duitku credentials
5. Setup domain and SSL
6. Configure environment variables for production
7. Deploy to Coolify or your preferred platform

---

## Getting Help

If you encounter issues:

1. **Check Documentation**:
   - [DEVELOPMENT_GUIDE.md](C:\Users\yoppi\Downloads\Lumiku App\docs\DEVELOPMENT_GUIDE.md)
   - [KNOWN_ISSUES.md](C:\Users\yoppi\Downloads\Lumiku App\docs\KNOWN_ISSUES.md)
   - [ENVIRONMENT_VARIABLES.md](C:\Users\yoppi\Downloads\Lumiku App\docs\ENVIRONMENT_VARIABLES.md)

2. **Check Logs**:
   ```bash
   # Backend logs (in terminal where you ran bun dev:backend)
   # Look for errors, warnings, or stack traces

   # Frontend logs (browser DevTools console)
   # Press F12 → Console tab
   ```

3. **Verify Setup**:
   ```bash
   # Check all prerequisites are installed
   bun --version
   node --version
   ffmpeg -version

   # Check environment variables
   cat backend/.env

   # Check database
   bun prisma:studio
   ```

4. **Common Commands to Fix Issues**:
   ```bash
   # Regenerate everything
   bun prisma:generate
   bun clean
   bun install
   bun prisma:migrate
   bun seed

   # Start fresh
   bun dev
   ```

---

## Success Checklist

Verify everything is working:

- [ ] Bun, Node.js, FFmpeg installed
- [ ] Repository cloned
- [ ] Dependencies installed (`bun install`)
- [ ] Environment variables configured
- [ ] JWT_SECRET generated (32+ characters)
- [ ] Prisma Client generated
- [ ] Migrations applied
- [ ] Database seeded
- [ ] Backend starts without errors (port 3000)
- [ ] Frontend starts without errors (port 5173)
- [ ] Health check returns OK
- [ ] Frontend loads in browser
- [ ] Login with test user successful
- [ ] Dashboard displays all apps
- [ ] Credit balance shows 100
- [ ] Can create projects in any app
- [ ] Prisma Studio accessible

---

**Congratulations!** You're now ready to develop with Lumiku App.

**Version**: 1.0.0
**Last Updated**: 2025-10-14
**Estimated Setup Time**: 10 minutes
