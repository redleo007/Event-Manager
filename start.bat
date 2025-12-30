@echo off
REM Development startup script for TechNexus (Windows)

echo.
echo 🚀 Starting TechNexus Development Environment
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% detected
echo.

REM Start backend
echo 📦 Starting backend server...
cd backend
call npm install --silent
start npm run dev
echo ✅ Backend running on http://localhost:5000
echo.

REM Start frontend
cd ..
echo 🎨 Starting frontend development server...
cd frontend
call npm install --silent
start npm run dev
echo ✅ Frontend running on http://localhost:3000
echo.

echo ═══════════════════════════════════════════════════════════
echo 🎉 TechNexus is running!
echo ═══════════════════════════════════════════════════════════
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Press Ctrl+C to stop all services
echo.

pause
