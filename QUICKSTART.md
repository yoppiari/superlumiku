# Lumiku AI Suite - Quick Start Guide

## ✅ Setup Completed!

Your Lumiku AI Suite development environment is ready. Here's everything you need to know.

## 🎯 What's Been Set Up

### ✅ Project Structure
```
lumiku-suite/
├── frontend/          ✅ React + Vite + TypeScript + TailwindCSS
├── backend/           ✅ Bun + Hono + Prisma + SQLite
├── docs/              ✅ Complete documentation
├── package.json       ✅ Monorepo workspace configuration
└── README.md          ✅ Project documentation
```

### ✅ Backend (Port 3000)
- ✅ Hono API server running on Bun
- ✅ Prisma ORM with SQLite database
- ✅ JWT authentication system
- ✅ Credit management system
- ✅ Database seeded with test user

### ✅ Frontend (Port 5173)
- ✅ React 18 with TypeScript
- ✅ Vite dev server configured
- ✅ React Router for navigation
- ✅ Zustand for state management
- ✅ TailwindCSS + Radix UI components
- ✅ Axios API client with interceptors

### ✅ Database
- ✅ SQLite database created at `backend/prisma/dev.db`
- ✅ Initial migration applied
- ✅ Test user created with 100 credits

## 🚀 Start Development

### Option 1: Start Both (Recommended)
```bash
# From root directory
bun dev
```

### Option 2: Start Separately
```bash
# Terminal 1 - Backend
cd backend
bun run dev

# Terminal 2 - Frontend
cd frontend
bun run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health
- **Prisma Studio**: `bun prisma:studio` (http://localhost:5555)

## 🔐 Test Credentials

Use these credentials to test the application:

**Email**: test@lumiku.com
**Password**: password123
**Initial Credits**: 100

## 🧪 Test the Setup

### 1. Test Backend API

```bash
# Health check
curl http://localhost:3000/health

# Login test
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lumiku.com","password":"password123"}'
```

**Expected Response**: User data with JWT token and 100 credits

### 2. Test Frontend

1. Open http://localhost:5173 in your browser
2. Click "Get Started" or "Dashboard"
3. Login with test credentials
4. You should see the dashboard with 100 credits

## 📚 Available API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name"
  }
  ```

- `POST /api/auth/login` - Login
  ```json
  {
    "email": "test@lumiku.com",
    "password": "password123"
  }
  ```

- `GET /api/auth/profile` - Get profile (requires auth token)
  ```
  Headers: Authorization: Bearer <token>
  ```

### Credits
- `GET /api/credits/balance` - Get credit balance (requires auth)
- `GET /api/credits/history` - Get transaction history (requires auth)

## 🛠️ Useful Commands

```bash
# Development
bun dev                 # Start both frontend & backend
bun dev:frontend       # Frontend only
bun dev:backend        # Backend only

# Database
bun prisma:generate    # Generate Prisma client
bun prisma:migrate     # Run migrations
bun prisma:studio      # Open database GUI
bun seed               # Seed database

# Build
bun build              # Build both
bun build:frontend     # Frontend production build
bun build:backend      # Backend production build

# Clean
bun clean              # Remove all node_modules
```

## 📂 Project Files

### Documentation
- **[SETUP.md](docs/SETUP.md)** - Complete setup guide with troubleshooting
- **[UNIFIED_ARCHITECTURE.md](docs/UNIFIED_ARCHITECTURE.md)** - Full system architecture
- **[README.md](README.md)** - Project overview

### Configuration Files
- `.env.example` - Environment variables template
- `backend/.env` - Backend environment variables
- `frontend/.env` - Frontend environment variables
- `package.json` - Root workspace configuration
- `backend/package.json` - Backend dependencies
- `frontend/package.json` - Frontend dependencies

### Database
- `backend/prisma/schema.prisma` - Database schema
- `backend/prisma/dev.db` - SQLite database file
- `backend/prisma/seed.ts` - Database seeder

## 🎨 Frontend Pages

1. **Home** (`/`) - Landing page with overview
2. **Login** (`/login`) - Authentication page
3. **Dashboard** (`/dashboard`) - Main dashboard with tools

## 🔧 Next Steps

### Immediate Tasks
1. ✅ Start backend: `cd backend && bun run dev`
2. ✅ Start frontend: `cd frontend && bun run dev`
3. ✅ Open http://localhost:5173
4. ✅ Login with test credentials
5. ✅ Verify dashboard and credit balance

### Development Tasks
1. 🔄 Add Video Mix Pro tool
2. 🔄 Add Carousel Generator tool
3. 🔄 Implement plugin system
4. 🔄 Add payment integration (Duitku)
5. 🔄 Add tool-specific routes and components

### Architecture Components to Implement
Based on UNIFIED_ARCHITECTURE.md:
- [ ] Tool Plugin System (frontend & backend)
- [ ] Tool Registry
- [ ] File Upload System
- [ ] Credit Deduction Flow
- [ ] Payment Gateway Integration
- [ ] Tool-specific Components

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Regenerate Prisma client
cd backend && bun prisma generate

# Check environment variables
cat backend/.env
```

### Frontend won't start
```bash
# Check if port 5173 is in use
netstat -ano | findstr :5173

# Reinstall dependencies
cd frontend && rm -rf node_modules && bun install

# Check Vite config
cat frontend/vite.config.ts
```

### Database issues
```bash
# Reset database
cd backend
bun prisma migrate reset

# Reseed
bun run prisma:seed
```

### CORS errors
Check that `CORS_ORIGIN` in `backend/.env` matches your frontend URL:
```
CORS_ORIGIN="http://localhost:5173"
```

## 📊 Current Status

### Completed ✅
- ✅ Monorepo structure
- ✅ Backend API with authentication
- ✅ Frontend with routing
- ✅ Database with migrations
- ✅ Test user with credits
- ✅ Basic UI pages (Home, Login, Dashboard)
- ✅ State management (Zustand)
- ✅ API client (Axios)

### In Progress 🔄
- 🔄 Tool plugin system
- 🔄 Video Mix Pro tool
- 🔄 Carousel Generator tool

### Planned 📋
- 📋 Payment integration (Duitku)
- 📋 File upload system
- 📋 Tool-specific components
- 📋 Admin panel
- 📋 Analytics dashboard

## 📞 Support

If you encounter any issues:

1. Check [SETUP.md](docs/SETUP.md) for detailed setup instructions
2. Check [UNIFIED_ARCHITECTURE.md](docs/UNIFIED_ARCHITECTURE.md) for architecture details
3. Review backend logs in terminal
4. Check browser console for frontend errors
5. Verify environment variables in `.env` files

## 🎉 Success Criteria

Your setup is successful if:
- ✅ Backend starts without errors on port 3000
- ✅ Frontend starts without errors on port 5173
- ✅ Health endpoint returns `{"status":"ok"}`
- ✅ Login API returns user data and token
- ✅ Frontend login works with test credentials
- ✅ Dashboard shows 100 credits

---

**All systems ready! Start developing your AI tools platform! 🚀**