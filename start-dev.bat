@echo off
title Lumiku Dev Environment Starter
color 0A

echo ========================================
echo   LUMIKU DEVELOPMENT ENVIRONMENT
echo ========================================
echo.

echo [1/5] Checking Docker Desktop...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker not found! Please install Docker Desktop first.
    echo    Download: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo ✅ Docker found

echo.
echo [2/5] Starting PostgreSQL and Redis containers...
docker-compose -f docker-compose.dev.yml up -d postgres redis
if errorlevel 1 (
    echo ❌ Failed to start containers!
    echo    Make sure Docker Desktop is running.
    pause
    exit /b 1
)
echo ✅ Containers started

echo.
echo [3/5] Waiting for database to be ready...
timeout /t 5 /nobreak >nul
echo ✅ Database should be ready

echo.
echo [4/5] Starting Backend Server...
start "Lumiku Backend" cmd /k "cd backend && echo Starting Backend Server... && bun run dev"
timeout /t 2 /nobreak >nul
echo ✅ Backend server starting...

echo.
echo [5/5] Starting Frontend Server...
start "Lumiku Frontend" cmd /k "cd frontend && echo Starting Frontend Server... && npm run dev"
timeout /t 2 /nobreak >nul
echo ✅ Frontend server starting...

echo.
echo ========================================
echo   ✅ ALL SERVICES STARTED!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Check the opened terminal windows for server status.
echo.
echo Press any key to exit this window...
pause >nul
