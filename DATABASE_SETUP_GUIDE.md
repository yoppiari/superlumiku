# Lumiku Database Setup Guide

## Issue Summary

**Problem**: The Lumiku backend cannot connect to the PostgreSQL database at `ycwc4s4ookos40k44gc8oooc:5432`, blocking the settings API and other features.

**Root Cause**: The `.env` file is configured to use a remote production database that is not accessible from the local development environment. Additionally, Docker and PostgreSQL are not installed locally.

## Current Status

### Checked:
- Remote PostgreSQL database at `ycwc4s4ookos40k44gc8oooc:5432` - NOT REACHABLE
- Local Docker installation - NOT AVAILABLE
- Local PostgreSQL installation - NOT INSTALLED
- Prisma schema - CONFIGURED FOR POSTGRESQL

### What Works:
- Prisma schema is complete with all 11 user settings fields
- Schema includes all required models for the Lumiku platform
- Backend code is ready to run once database is available

## Solutions (Choose One)

### Option 1: Local PostgreSQL with Docker (RECOMMENDED for Development)

Install Docker Desktop and start a local PostgreSQL database:

```bash
# 1. Install Docker Desktop for Windows
# Download from: https://www.docker.com/products/docker-desktop

# 2. Navigate to backend directory
cd "C:\Users\yoppi\Downloads\Lumiku App\backend"

# 3. Start PostgreSQL and Redis with docker-compose
docker-compose up -d postgres redis

# 4. Update .env to use local database
# Replace DATABASE_URL with:
DATABASE_URL="postgresql://lumiku:your-password@localhost:5432/lumiku_production"

# 5. Run migrations
npx prisma migrate deploy

# 6. Generate Prisma client
npx prisma generate

# 7. Seed database (optional)
bun run prisma db seed
```

**Advantages**:
- Full PostgreSQL feature set
- Matches production environment
- Easy to reset/restart
- Includes Redis for queue system

### Option 2: Install PostgreSQL Locally (Alternative)

Install PostgreSQL directly on Windows:

```bash
# 1. Download PostgreSQL for Windows
# https://www.postgresql.org/download/windows/

# 2. Install and create database
createdb lumiku_development

# 3. Update .env
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/lumiku_development"

# 4. Run migrations
cd backend
npx prisma migrate deploy
npx prisma generate
```

**Advantages**:
- No Docker required
- Direct database access
- Better for Windows development

### Option 3: Use Production Database (NOT RECOMMENDED)

Connect directly to the production database:

```bash
# ONLY if you have network access to ycwc4s4ookos40k44gc8oooc

# 1. Verify network connectivity
ping ycwc4s4ookos40k44gc8oooc

# 2. If reachable, run migrations
cd backend
npx prisma migrate deploy
npx prisma generate
```

**WARNINGS**:
- Can affect production data
- Network dependency
- Security risk
- NOT RECOMMENDED for local development

### Option 4: SQLite for Quick Development (Temporary Solution)

For quick local testing without PostgreSQL:

**NOTE**: This requires modifying the Prisma schema and will have feature limitations.

```bash
# 1. Update backend/prisma/schema.prisma
# Change line 6 from:
#   provider = "postgresql"
# To:
#   provider = "sqlite"

# 2. Remove PostgreSQL-specific features:
#   - Remove all @db.Text annotations
#   - Remove GIN indexes (@@index([tags], type: Gin))

# 3. Update .env
DATABASE_URL="file:./dev.db"

# 4. Run migrations
npx prisma migrate dev --name init_sqlite

# 5. Generate client
npx prisma generate
```

**LIMITATIONS**:
- Array fields may have issues
- JSON fields less performant
- No advanced PostgreSQL features
- Must convert back for production

## Recommended Setup (Step-by-Step)

For the best development experience, follow these steps:

### 1. Install Docker Desktop

```
Download and install Docker Desktop for Windows:
https://www.docker.com/products/docker-desktop
```

### 2. Start Database Services

```bash
cd "C:\Users\yoppi\Downloads\Lumiku App\backend"
docker-compose up -d postgres redis
```

### 3. Wait for Services to Start

```bash
# Check if PostgreSQL is ready
docker logs lumiku-postgres

# Should see: "database system is ready to accept connections"
```

### 4. Run Database Migrations

```bash
# Apply all migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 5. Seed Database (Optional)

```bash
# Populate with initial data
bun run prisma db seed
```

### 6. Verify Connection

```bash
# Test database connection
npx prisma db pull
```

### 7. Start Backend

```bash
# Run development server
bun run dev
```

## Environment Variables

Your `.env` file should contain:

```env
# Local Development
DATABASE_URL="postgresql://lumiku:your-password@localhost:5432/lumiku_production"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Other settings remain the same
```

## Database Schema

The User model includes all 11 settings fields:

```prisma
model User {
  // User Settings (11 fields)
  emailNotifications Boolean   @default(true)
  pushNotifications  Boolean   @default(false)
  marketingEmails    Boolean   @default(false)
  projectUpdates     Boolean   @default(true)
  creditAlerts       Boolean   @default(true)
  theme              String    @default("light")
  language           String    @default("id")
  profileVisibility  String    @default("public")
  showEmail          Boolean   @default(false)
  analyticsTracking  Boolean   @default(true)
  settingsUpdatedAt  DateTime  @default(now()) @updatedAt
}
```

## Troubleshooting

### "Port 5432 already in use"

```bash
# Check what's using port 5432
netstat -ano | findstr :5432

# Stop the process or change the port in docker-compose.yml
```

### "Cannot connect to Docker daemon"

```bash
# Make sure Docker Desktop is running
# Check system tray for Docker icon
# Restart Docker Desktop if needed
```

### "Migration failed"

```bash
# Reset database (DEVELOPMENT ONLY!)
docker-compose down -v
docker-compose up -d postgres redis

# Wait for database to start, then:
npx prisma migrate deploy
```

### "Prisma client not generated"

```bash
# Regenerate Prisma client
npx prisma generate

# If still failing, delete and regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

## Next Steps

After database is set up:

1. Test Settings API:
   ```bash
   curl http://localhost:3000/api/mainapp/user/settings \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. Update user settings:
   ```bash
   curl -X PATCH http://localhost:3000/api/mainapp/user/settings \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"theme": "dark", "emailNotifications": false}'
   ```

3. Verify in database:
   ```bash
   npx prisma studio
   # Opens GUI at http://localhost:5555
   ```

## Production Deployment

For production deployment on Coolify:

1. Database is automatically provisioned by Coolify
2. Environment variables are set in Coolify UI
3. Migrations run automatically during Docker build
4. No manual setup required

## Support

If you encounter issues:

1. Check Docker logs: `docker logs lumiku-postgres`
2. Check backend logs: `bun run dev`
3. Verify .env configuration
4. Ensure all ports are available
5. Try the troubleshooting steps above

---

**Last Updated**: 2025-10-18
**Status**: Database connection blocked - awaiting setup
