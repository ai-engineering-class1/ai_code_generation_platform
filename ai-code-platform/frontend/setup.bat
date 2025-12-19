@echo off
setlocal enabledelayedexpansion

REM AI Code Generation Platform - Frontend Setup Script

echo.
echo 🚀 Setting up AI Code Generation Platform - Frontend
echo ==================================================
echo.

REM Check Node.js version
echo Checking Node.js version...
where node >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js not found. Please install Node.js 18+
    exit /b 1
)
node --version
for /f "tokens=1 delims=v" %%a in ('node --version') do set NODE_VERSION=%%a
for /f "tokens=1 delims=." %%a in ("!NODE_VERSION!") do set NODE_MAJOR=%%a
if !NODE_MAJOR! LSS 18 (
    echo ✗ Node.js version 18+ required
    exit /b 1
)
echo ✓ Node.js version is sufficient
echo.

REM Check npm
echo Checking npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo ✗ npm not found
    exit /b 1
)
npm --version
echo ✓ npm is installed
echo.

REM Install dependencies
echo Installing dependencies...
npm install
if errorlevel 1 (
    echo ✗ Failed to install dependencies
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Create .env.local file if it doesn't exist
echo Setting up environment file...
if not exist ".env.local" (
    (
        echo # Frontend Environment Configuration
        echo.
        echo # Backend API URL - Updated to port 8000
        echo NEXT_PUBLIC_API_URL=http://localhost:8000
        echo.
        echo # App Configuration
        echo NEXT_PUBLIC_APP_NAME="AI Code Generation Platform"
        echo NEXT_PUBLIC_APP_VERSION="0.1.0"
    ) > .env.local
    echo ✓ .env.local file created with API URL: http://localhost:8000
) else (
    echo ✓ .env.local file already exists
    REM Check if API URL needs updating
    findstr /c:"NEXT_PUBLIC_API_URL=http://localhost:8082" .env.local >nul 2>&1
    if not errorlevel 1 (
        powershell -Command "(Get-Content .env.local) -replace 'NEXT_PUBLIC_API_URL=http://localhost:8082', 'NEXT_PUBLIC_API_URL=http://localhost:8000' | Set-Content .env.local"
        echo ✓ Updated API URL to port 8000
    )
)
echo.

echo ==================================================
echo ✓ Frontend setup complete!
echo ==================================================
echo.
echo Next steps:
echo 1. Make sure the backend is running on http://localhost:8000
echo.
echo 2. Start the development server:
echo    npm run dev
echo.
echo 3. Access the application:
echo    http://localhost:3000
echo.
echo 4. Create an account and start testing!
echo.

