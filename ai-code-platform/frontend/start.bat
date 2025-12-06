@echo off
REM Start frontend server on port 3012

cd /d "%~dp0"

echo Starting AI Code Generation Platform Frontend on port 3012...

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        exit /b 1
    )
)

REM Start development server on port 3012
npm run dev

