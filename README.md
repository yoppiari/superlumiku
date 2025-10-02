# Lumiku AI Suite

Unified SaaS platform for AI-powered content creation tools with modular plugin architecture.

## 🚀 Quick Start

### Prerequisites

- **Bun** (v1.0+) - [Install Bun](https://bun.sh)
- **Node.js** (v18+)
- **FFmpeg** (for video processing)

### Installation

```bash
# Install dependencies
bun install

# Generate Prisma client
bun prisma:generate

# Run database migrations
bun prisma:migrate

# Seed database with test user
bun seed
```

### Development

```bash
# Start both backend and frontend
bun dev

# Or start separately:
bun dev:backend  # Backend on http://localhost:3000
bun dev:frontend # Frontend on http://localhost:5173
```

## 📚 Documentation

- **[SETUP.md](docs/SETUP.md)** - Detailed setup instructions
- **[UNIFIED_ARCHITECTURE.md](docs/UNIFIED_ARCHITECTURE.md)** - Complete system architecture
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Original architecture document

## 🧪 Test Credentials

**Email:** test@lumiku.com
**Password:** password123
**Credits:** 100 (free welcome bonus)

## 🛠️ Tech Stack

### Frontend
- React 18+ with TypeScript
- Vite (build tool)
- React Router 6 (routing)
- Zustand (state management)
- TailwindCSS + Radix UI (design system)
- React Query (server state)

### Backend
- Bun runtime
- Hono framework
- Prisma ORM
- SQLite (development) / PostgreSQL (production)
- JWT authentication
- bcrypt password hashing

## 📁 Project Structure

```
lumiku-suite/
├── frontend/          # React SPA
├── backend/           # Bun + Hono API
├── packages/          # Shared packages
├── docs/              # Documentation
└── scripts/           # Build scripts
```

## 🔧 Available Commands

```bash
# Development
bun dev                 # Start both frontend & backend
bun dev:frontend       # Start frontend only
bun dev:backend        # Start backend only

# Build
bun build              # Build both
bun build:frontend     # Build frontend
bun build:backend      # Build backend

# Database
bun prisma:generate    # Generate Prisma client
bun prisma:migrate     # Run migrations
bun prisma:studio      # Open Prisma Studio (GUI)
bun seed               # Seed database

# Utilities
bun test               # Run tests
bun clean              # Clean node_modules
```

## 🎯 Features

- ✅ User authentication (register/login)
- ✅ Credit-based billing system
- ✅ Unified dashboard
- ✅ Plugin architecture for tools
- 🔄 Video Mix Pro (in development)
- 🔄 Carousel Generator (in development)
- 🔄 Payment integration (Duitku)

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile (protected)

### Credits
- `GET /api/credits/balance` - Get credit balance (protected)
- `GET /api/credits/history` - Get transaction history (protected)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a pull request

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For issues or questions, please check:
1. [SETUP.md](docs/SETUP.md) for setup help
2. [UNIFIED_ARCHITECTURE.md](docs/UNIFIED_ARCHITECTURE.md) for architecture details
3. Backend logs in terminal
4. Frontend console in browser DevTools

---

Built with ❤️ by Lumiku Team