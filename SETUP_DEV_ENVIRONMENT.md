# Setup Development Environment (dev.lumiku.com)

Dokumentasi ini menjelaskan cara setup environment development terpisah dari production di Coolify.

## 🎯 Overview

- **Production**: `app.lumiku.com` (branch: `main`)
- **Development**: `dev.lumiku.com` (branch: `development`)

## 📋 Langkah Setup di Coolify

### 1. Push Branch Development ke GitHub

```bash
git add .
git commit -m "Setup development environment configuration"
git push -u origin development
```

### 2. Buat Application Baru di Coolify

1. Login ke Coolify dashboard di `https://cf.avolut.com`
2. Buat **New Application** dengan konfigurasi:
   - **Name**: `Lumiku Development`
   - **Repository**: `https://github.com/yoppiari/superlumiku.git`
   - **Branch**: `development` (penting!)
   - **Build Pack**: Docker Compose
   - **Docker Compose File**: `docker-compose.dev.yml`

### 3. Konfigurasi Domain

Di Coolify Application Settings:
- **Domain**: `dev.lumiku.com`
- **SSL**: Enable (Let's Encrypt otomatis)

### 4. Setup Environment Variables

Di Coolify, masukkan environment variables berikut:

#### Database Configuration
```env
POSTGRES_USER=lumiku_dev
POSTGRES_PASSWORD=<generate-strong-password>
POSTGRES_DB=lumiku_development
DATABASE_URL=postgresql://lumiku_dev:<password>@postgres:5432/lumiku_development?schema=public
```

#### Server Configuration
```env
NODE_ENV=development
PORT=3000
```

#### JWT Configuration
```env
JWT_SECRET=<generate-random-32-char-string>
JWT_EXPIRES_IN=7d
```

#### Payment Gateway (Duitku Sandbox)
```env
DUITKU_MERCHANT_CODE=DS25180
DUITKU_API_KEY=55e33f1d71cc5ed5ce8b5abab54fc7ae
DUITKU_ENV=sandbox
DUITKU_CALLBACK_URL=https://dev.lumiku.com/api/mainapp/payment/callback
DUITKU_RETURN_URL=https://dev.lumiku.com
```

#### AI Services
```env
ANTHROPIC_API_KEY=<your-api-key>
MODELSLAB_API_KEY=LUQAR899Uwep23PdtlokPOmge7qLGI9UQtNRk3BfPlBHZM5NxIUXxiUJgbwS
EDENAI_API_KEY=
```

#### File Storage
```env
UPLOAD_PATH=./uploads
OUTPUT_PATH=./outputs
MAX_FILE_SIZE=524288000
UPLOAD_DIR=./uploads
OUTPUT_DIR=./uploads/outputs
```

#### FFmpeg
```env
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
```

#### CORS
```env
CORS_ORIGIN=https://dev.lumiku.com
```

#### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Redis Configuration
```env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 5. Setup Persistent Volumes

Coolify akan otomatis create volumes untuk:
- `postgres_dev_data` - Database development
- `redis_dev_data` - Redis data
- `uploads_dev_data` - User uploads
- `outputs_dev_data` - Generated outputs

### 6. Deploy Application

1. Klik tombol **Deploy** di Coolify
2. Monitor deployment logs
3. Tunggu hingga semua services healthy

## 🔄 Workflow Development

### Update Development Environment

```bash
# Bekerja di branch development
git checkout development

# Buat perubahan
git add .
git commit -m "Feature: description"
git push origin development

# Coolify akan auto-deploy ke dev.lumiku.com
```

### Merge ke Production

```bash
# Test di dev.lumiku.com terlebih dahulu
# Jika sudah OK, merge ke main

git checkout main
git merge development
git push origin main

# Coolify akan auto-deploy ke app.lumiku.com
```

## 🗄️ Database Management

### Akses Database Development

```bash
# Via Coolify terminal atau SSH
docker exec -it lumiku-dev-postgres psql -U lumiku_dev -d lumiku_development
```

### Run Migrations

```bash
# Via Coolify terminal
docker exec -it lumiku-dev-app bun run migrate:dev
```

### Reset Database (jika perlu)

```bash
# Via Coolify terminal
docker exec -it lumiku-dev-app bunx prisma migrate reset
```

## 📊 Monitoring

### Check Logs

```bash
# Application logs
docker logs -f lumiku-dev-app

# Database logs
docker logs -f lumiku-dev-postgres

# Redis logs
docker logs -f lumiku-dev-redis
```

### Health Checks

- Application: `https://dev.lumiku.com/health`
- Database: Port 5433 (dari server Coolify)
- Redis: Port 6380 (dari server Coolify)

## 🔐 Security Notes

1. **Database**: Development menggunakan database terpisah dengan credentials berbeda
2. **Redis**: Instance Redis terpisah untuk development
3. **Payment Gateway**: Menggunakan Duitku Sandbox mode
4. **Ports**: Development menggunakan port berbeda untuk avoid conflicts:
   - PostgreSQL: 5433 (production: 5432)
   - Redis: 6380 (production: 6379)

## 🚨 Troubleshooting

### Database Connection Error

```bash
# Check database status
docker exec lumiku-dev-postgres pg_isready -U lumiku_dev

# Check connection
docker exec lumiku-dev-app bun run prisma db pull
```

### Redis Connection Error

```bash
# Check Redis
docker exec lumiku-dev-redis redis-cli ping
```

### Application Won't Start

```bash
# Check logs
docker logs lumiku-dev-app

# Restart services
docker-compose -f docker-compose.dev.yml restart
```

## 📝 Important Files

- `.env.development` - Development environment variables
- `docker-compose.dev.yml` - Development Docker Compose config
- `docker-compose.prod.yml` - Production Docker Compose config

## 🎉 Done!

Setelah setup selesai:
- ✅ Development: `https://dev.lumiku.com`
- ✅ Production: `https://app.lumiku.com`
- ✅ Separate databases dan Redis instances
- ✅ Auto-deploy dari GitHub branches
