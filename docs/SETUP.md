# Lumiku AI Suite - Local Development Setup Guide

## Prerequisites

Sebelum memulai, pastikan tools berikut sudah terinstal:

- **Bun** (v1.0+) - Runtime untuk backend dan package manager
  ```bash
  # Install Bun (Windows)
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
- **Node.js** (v18+) - Alternative untuk development
- **FFmpeg** - Untuk video processing (Video Mix tool)
- **Git** - Version control
- **Code Editor** - VS Code recommended

## Project Structure

```
lumiku-suite/
├── frontend/           # React + Vite + TypeScript
├── backend/            # Bun + Hono + Prisma
├── packages/           # Shared packages (optional)
├── docs/               # Documentation (ARCHITECTURE.md, dll)
├── scripts/            # Build & deployment scripts
├── .env                # Environment variables
├── package.json        # Root workspace config
└── README.md
```

## Step-by-Step Setup

### 1. Initialize Root Workspace

```bash
# Buat package.json root untuk workspace
bun init -y

# Edit package.json untuk menambahkan workspaces
```

Root `package.json`:
```json
{
  "name": "lumiku-suite",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "packages/*"
  ],
  "scripts": {
    "dev": "bun run dev:backend & bun run dev:frontend",
    "dev:frontend": "cd frontend && bun run dev",
    "dev:backend": "cd backend && bun run dev",
    "build": "bun run build:frontend && bun run build:backend",
    "build:frontend": "cd frontend && bun run build",
    "build:backend": "cd backend && bun run build",
    "prisma:generate": "cd backend && bun prisma generate",
    "prisma:migrate": "cd backend && bun prisma migrate dev",
    "prisma:studio": "cd backend && bun prisma studio",
    "seed": "cd backend && bun prisma db seed",
    "test": "bun test",
    "clean": "rm -rf node_modules frontend/node_modules backend/node_modules"
  },
  "devDependencies": {
    "@types/bun": "^1.0.0",
    "typescript": "^5.3.0"
  }
}
```

### 2. Setup Frontend (React + Vite)

```bash
# Create frontend dengan Vite
bun create vite frontend -- --template react-ts

cd frontend

# Install dependencies
bun install

# Install additional libraries
bun add react-router-dom zustand @tanstack/react-query axios
bun add -D @types/react-router-dom

# Install UI libraries
bun add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
bun add @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip
bun add tailwindcss postcss autoprefixer clsx tailwind-merge
bun add lucide-react

# Install TailwindCSS
bunx tailwindcss init -p
```

Frontend `package.json`:
```json
{
  "name": "@lumiku/frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.14.2",
    "axios": "^1.6.2",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "tailwindcss": "^3.3.6",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

### 3. Setup Backend (Bun + Hono + Prisma)

```bash
# Buat direktori backend
mkdir backend
cd backend

# Initialize package.json
bun init -y

# Install dependencies
bun add hono @hono/node-server
bun add @prisma/client bcrypt jsonwebtoken zod
bun add -D prisma @types/bcrypt @types/jsonwebtoken

# Initialize Prisma
bunx prisma init
```

Backend `package.json`:
```json
{
  "name": "@lumiku/backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "bun prisma/seed.ts"
  },
  "dependencies": {
    "hono": "^3.11.7",
    "@hono/node-server": "^1.6.0",
    "@prisma/client": "^5.7.1",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bun": "^1.0.0",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "prisma": "^5.7.1",
    "typescript": "^5.3.3"
  }
}
```

### 4. Configure Environment Variables

Buat file `.env` di root dan di backend:

Root `.env.example`:
```bash
# Database
DATABASE_URL="file:./backend/prisma/dev.db"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"

# CORS
CORS_ORIGIN="http://localhost:5173"
```

Backend `.env`:
```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET="lumiku-dev-secret-key-change-in-production-min-32-characters"
JWT_EXPIRES_IN="7d"

# Payment Gateway (Duitku)
DUITKU_MERCHANT_CODE="your-merchant-code"
DUITKU_API_KEY="your-api-key"
DUITKU_ENV="sandbox"
DUITKU_CALLBACK_URL="http://localhost:3000/api/payments/callback"
DUITKU_RETURN_URL="http://localhost:5173/payments/status"

# AI Services
ANTHROPIC_API_KEY="your-anthropic-api-key"

# File Storage
UPLOAD_PATH="./uploads"
OUTPUT_PATH="./outputs"
MAX_FILE_SIZE=524288000

# FFmpeg
FFMPEG_PATH="ffmpeg"
FFPROBE_PATH="ffprobe"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5. Configure Prisma Schema

File `backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// User Management
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("user") // user, admin

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  credits   Credit[]
  sessions  Session[]

  @@map("users")
}

// Session Management
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime

  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// Credit System
model Credit {
  id          String   @id @default(cuid())
  userId      String
  amount      Int      // Positive for addition, negative for deduction
  balance     Int      // Running balance after this transaction
  type        String   // purchase, bonus, usage, refund
  description String?

  // Reference to what used the credits
  referenceId   String?
  referenceType String?  // video_mix_project, carousel_generation, etc.

  // Payment reference (for purchases)
  paymentId String?

  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("credits")
}

// Payment Transactions (Duitku)
model Payment {
  id              String   @id @default(cuid())
  userId          String
  merchantOrderId String   @unique
  reference       String   @unique // Duitku reference

  amount          Float
  creditAmount    Int      // Credits purchased

  status          String   // pending, success, failed, expired
  paymentMethod   String?
  paymentUrl      String?

  // Duitku specific
  duitkuData      String?  // JSON string of Duitku response

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("payments")
}

// Tool Registry (optional - could be code-based)
model ToolConfig {
  id          String   @id @default(cuid())
  toolId      String   @unique
  name        String
  enabled     Boolean  @default(true)
  config      String   // JSON config

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("tool_configs")
}
```

### 6. Generate Prisma Client & Run Migrations

```bash
cd backend

# Generate Prisma Client
bun prisma generate

# Create and run migration
bun prisma migrate dev --name init

# (Optional) Open Prisma Studio untuk melihat database
bun prisma studio
```

### 7. Create Basic Backend Structure

Struktur minimal backend:

```
backend/src/
├── index.ts              # Entry point
├── app.ts                # Hono app setup
├── config/
│   └── env.ts           # Environment config
├── db/
│   └── client.ts        # Prisma client singleton
├── middleware/
│   ├── auth.middleware.ts
│   └── cors.middleware.ts
├── routes/
│   ├── auth.routes.ts
│   └── credit.routes.ts
├── services/
│   ├── auth.service.ts
│   └── credit.service.ts
└── lib/
    ├── jwt.ts
    └── bcrypt.ts
```

### 8. Create Basic Frontend Structure

Struktur minimal frontend:

```
frontend/src/
├── main.tsx             # Entry point
├── App.tsx              # Root component
├── routes/
│   └── index.tsx       # Route configuration
├── layouts/
│   ├── RootLayout.tsx
│   └── TopBar.tsx
├── pages/
│   ├── Home.tsx
│   └── Dashboard.tsx
├── lib/
│   ├── api.ts          # Axios instance
│   └── utils.ts
└── types/
    └── index.ts
```

### 9. Configure Vite

File `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### 10. Configure TailwindCSS

File `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

File `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 11. Create Seed Data (Optional)

File `backend/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10)

  const user = await prisma.user.create({
    data: {
      email: 'test@lumiku.com',
      password: hashedPassword,
      name: 'Test User',
      credits: {
        create: {
          amount: 100,
          balance: 100,
          type: 'bonus',
          description: 'Welcome bonus'
        }
      }
    }
  })

  console.log('Created user:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## Running the Application

### Development Mode

```bash
# Terminal 1 - Backend
cd backend
bun run dev

# Terminal 2 - Frontend
cd frontend
bun run dev

# Atau dari root (parallel)
bun run dev
```

Frontend akan berjalan di: http://localhost:5173
Backend akan berjalan di: http://localhost:3000

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Prisma Studio**: `bun prisma:studio` (http://localhost:5555)

## Testing Setup

### Test Login
- Email: test@lumiku.com
- Password: password123
- Credits: 100

### Test API Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lumiku.com","password":"password123"}'
```

## Troubleshooting

### Bun Installation Issues
```bash
# Windows: Run as Administrator
powershell -c "irm bun.sh/install.ps1 | iex"

# Add to PATH if needed
```

### Prisma Issues
```bash
# Regenerate client
cd backend
bun prisma generate

# Reset database
bun prisma migrate reset
```

### Port Already in Use
```bash
# Windows - Kill process on port
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### CORS Issues
- Pastikan CORS_ORIGIN di .env sesuai dengan frontend URL
- Cek middleware CORS di backend

## Next Steps

1. ✅ Setup project structure
2. ✅ Configure database
3. ✅ Create basic auth system
4. 🔄 Implement credit system
5. 🔄 Add first tool (Video Mix or Carousel)
6. 🔄 Implement plugin system
7. 🔄 Add payment integration (Duitku)
8. 🔄 Deploy to production

## References

- UNIFIED_ARCHITECTURE.md - Complete system architecture
- ARCHITECTURE.md - Original architecture document
- Bun docs: https://bun.sh/docs
- Hono docs: https://hono.dev
- Prisma docs: https://www.prisma.io/docs
- Vite docs: https://vitejs.dev
- React Router: https://reactrouter.com

## Support

Jika ada error atau pertanyaan:
1. Cek SETUP.md ini
2. Lihat UNIFIED_ARCHITECTURE.md untuk detail arsitektur
3. Cek logs di terminal backend/frontend
4. Review .env configuration