@echo off
title Avatar Creator Fix Verification
color 0B

echo ========================================
echo   AVATAR CREATOR FIX VERIFICATION
echo ========================================
echo.

echo This script will verify that the fix is working.
echo.
echo Tests:
echo   1. Database connection
echo   2. API health check
echo   3. Create project test
echo.

pause

echo.
echo [TEST 1/3] Checking database connection...
echo.
curl -s http://localhost:3000/api/health
echo.
if errorlevel 1 (
    echo.
    echo ❌ Backend is not running!
    echo    Please start backend with: cd backend ^&^& bun run dev
    pause
    exit /b 1
)

echo.
echo.
echo [TEST 2/3] Checking database schema...
echo.
curl -s http://localhost:3000/health/database
echo.

echo.
echo.
echo [TEST 3/3] Running comprehensive diagnostic...
echo.
cd backend
echo Running test-create-project-debug.ts...
echo.
bun run src/test-create-project-debug.ts

echo.
echo ========================================
echo   VERIFICATION COMPLETE
echo ========================================
echo.
echo If all tests passed, you can now:
echo   1. Open http://localhost:5173
echo   2. Go to Avatar Creator
echo   3. Create a new project
echo.
echo Expected: ✅ Success! Project created
echo.
pause
