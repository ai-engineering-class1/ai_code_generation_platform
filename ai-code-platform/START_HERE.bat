@echo off
setlocal enabledelayedexpansion

REM Complete Startup Guide for AI Code Generation Platform
REM This script will help you start everything step by step

title AI Code Generation Platform - Startup Guide

REM Set colors (using echo with special formatting)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "CYAN=[96m"
set "NC=[0m"

echo.
echo %CYAN%╔════════════════════════════════════════════════════════════╗%NC%
echo %CYAN%║   AI Code Generation Platform - Startup Guide             ║%NC%
echo %CYAN%╚════════════════════════════════════════════════════════════╝%NC%

REM Get project root directory (directory where this script is located)
set "PROJECT_ROOT=%~dp0"
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

REM Step 1: Check Prerequisites
echo.
echo %BLUE%Step 1: Checking Prerequisites...%NC%

REM Check Python
where python >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
    echo %GREEN%✓ Python found: !PYTHON_VERSION!%NC%
) else (
    where python3 >nul 2>&1
    if !errorlevel! equ 0 (
        for /f "tokens=*" %%i in ('python3 --version 2^>^&1') do set PYTHON_VERSION=%%i
        echo %GREEN%✓ Python 3 found: !PYTHON_VERSION!%NC%
    ) else (
        echo %RED%✗ Python not found%NC%
        echo Please install Python 3 from https://www.python.org/
        pause
        exit /b 1
    )
)

REM Check Node.js
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version 2^>^&1') do set NODE_VERSION=%%i
    echo %GREEN%✓ Node.js found: !NODE_VERSION!%NC%
) else (
    echo %RED%✗ Node.js not found%NC%
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check Redis (Windows - check if Redis service is running or redis-server.exe exists)
where redis-cli >nul 2>&1
if %errorlevel% equ 0 (
    redis-cli ping >nul 2>&1
    if !errorlevel! equ 0 (
        echo %GREEN%✓ Redis is running%NC%
    ) else (
        echo %YELLOW%⚠️  Redis is not running%NC%
        echo %YELLOW%   Please start Redis manually or install Redis for Windows%NC%
    )
) else (
    echo %YELLOW%⚠️  Redis CLI not found (optional - Redis may be running as a service)%NC%
)

REM Check PostgreSQL
where psql >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ PostgreSQL found%NC%
    REM Try to connect (may require password)
    psql -U postgres -d postgres -c "SELECT 1" >nul 2>&1
    if !errorlevel! equ 0 (
        echo %GREEN%✓ PostgreSQL is accessible%NC%
    ) else (
        echo %YELLOW%⚠️  PostgreSQL might not be running or requires password%NC%
    )
) else (
    echo %YELLOW%⚠️  PostgreSQL not found (optional if using SQLite)%NC%
)

REM Step 2: Check if setup has been done
echo.
echo %BLUE%Step 2: Checking Setup Status...%NC%

if not exist "%PROJECT_ROOT%\backend\venv" (
    echo %YELLOW%⚠️  Backend not set up yet%NC%
    set /p SETUP_BACKEND="Do you want to run the setup now? (y/n): "
    if /i "!SETUP_BACKEND!"=="y" (
        cd /d "%PROJECT_ROOT%"
        if exist "setup-all.bat" (
            call setup-all.bat
        ) else if exist "setup-all.sh" (
            echo %YELLOW%Note: setup-all.sh found but this is Windows. Please run setup.bat in backend and frontend folders.%NC%
        ) else (
            echo %YELLOW%Running backend setup...%NC%
            cd /d "%PROJECT_ROOT%\backend"
            if exist "setup.bat" (
                call setup.bat
            ) else (
                echo %RED%Setup script not found. Please run setup.bat in backend folder.%NC%
                pause
                exit /b 1
            )
        )
    ) else (
        echo %RED%Setup required. Please run: cd backend ^&^& setup.bat%NC%
        pause
        exit /b 1
    )
) else (
    echo %GREEN%✓ Backend virtual environment exists%NC%
)

if not exist "%PROJECT_ROOT%\frontend\node_modules" (
    echo %YELLOW%⚠️  Frontend dependencies not installed%NC%
    set /p SETUP_FRONTEND="Do you want to install them now? (y/n): "
    if /i "!SETUP_FRONTEND!"=="y" (
        cd /d "%PROJECT_ROOT%\frontend"
        call npm install
        if !errorlevel! neq 0 (
            echo %RED%Failed to install frontend dependencies%NC%
            pause
            exit /b 1
        )
    ) else (
        echo %RED%Please run: cd frontend ^&^& npm install%NC%
        pause
        exit /b 1
    )
) else (
    echo %GREEN%✓ Frontend dependencies installed%NC%
)

REM Step 3: Check database
echo.
echo %BLUE%Step 3: Checking Database...%NC%

REM Check if PostgreSQL database exists (if psql is available)
where psql >nul 2>&1
if %errorlevel% equ 0 (
    psql -U postgres -lqt 2>nul | findstr /i "ai_code_platform" >nul
    if !errorlevel! equ 0 (
        echo %GREEN%✓ Database 'ai_code_platform' exists%NC%
    ) else (
        echo %YELLOW%⚠️  Database 'ai_code_platform' does not exist%NC%
        set /p CREATE_DB="Do you want to create it now? (y/n): "
        if /i "!CREATE_DB!"=="y" (
            psql -U postgres -c "CREATE DATABASE ai_code_platform;" 2>nul
            if !errorlevel! equ 0 (
                echo %GREEN%✓ Database created%NC%
                
                REM Initialize database
                echo %YELLOW%Initializing database with test data...%NC%
                cd /d "%PROJECT_ROOT%\backend"
                if exist "venv\Scripts\activate.bat" (
                    call venv\Scripts\activate.bat
                    if exist "init_db.py" (
                        python init_db.py
                    ) else (
                        echo %YELLOW%Note: init_db.py not found. Database created but not initialized.%NC%
                    )
                ) else (
                    echo %YELLOW%Note: Virtual environment not found. Please activate it manually.%NC%
                )
            ) else (
                echo %YELLOW%Note: You may need to create it manually or provide password%NC%
            )
        )
    )
) else (
    echo %YELLOW%⚠️  PostgreSQL not found - using SQLite (default)%NC%
)

REM Step 4: Instructions to start servers
echo.
echo %GREEN%╔════════════════════════════════════════════════════════════╗%NC%
echo %GREEN%║   Ready to Start!                                         ║%NC%
echo %GREEN%╚════════════════════════════════════════════════════════════╝%NC%

echo.
echo %CYAN%You need to open %YELLOW%3 terminal windows%CYAN%:%NC%
echo.

echo %YELLOW%═══════════════════════════════════════════════════════════%NC%
echo %YELLOW%Terminal 1 - Backend (Port 8000)%NC%
echo %YELLOW%═══════════════════════════════════════════════════════════%NC%
echo Run these commands:
echo %GREEN%cd %PROJECT_ROOT%\backend%NC%
echo %GREEN%venv\Scripts\activate%NC%
echo %GREEN%uvicorn app.main:app --reload --host 0.0.0.0 --port 8000%NC%
echo.
echo Or simply:
echo %GREEN%cd %PROJECT_ROOT%\backend ^&^& start.bat%NC%

echo.
echo %YELLOW%═══════════════════════════════════════════════════════════%NC%
echo %YELLOW%Terminal 2 - Frontend (Port 3000)%NC%
echo %YELLOW%═══════════════════════════════════════════════════════════%NC%
echo Run these commands:
echo %GREEN%cd %PROJECT_ROOT%\frontend%NC%
echo %GREEN%npm run dev%NC%

echo.
echo %YELLOW%═══════════════════════════════════════════════════════════%NC%
echo %YELLOW%Terminal 3 - This Guide (keep open for reference)%NC%
echo %YELLOW%═══════════════════════════════════════════════════════════%NC%

echo.
echo %CYAN%After starting both servers:%NC%
echo   Frontend: %GREEN%http://localhost:3000%NC%
echo   Backend:  %GREEN%http://localhost:8000%NC%
echo   API Docs: %GREEN%http://localhost:8000/docs%NC%

echo.
echo %CYAN%Login Credentials:%NC%
echo   Email:    %GREEN%test@example.com%NC%
echo   Password: %GREEN%testpassword123%NC%

echo.
echo %BLUE%═══════════════════════════════════════════════════════════%NC%
set /p CONTINUE="Press Enter to see detailed steps..."
echo.

echo %CYAN%Detailed Steps:%NC%
echo.

echo %BLUE%1.%NC% Open a new terminal and run:
echo    %GREEN%cd %PROJECT_ROOT%\backend%NC%
echo    %GREEN%venv\Scripts\activate%NC%
echo    %GREEN%uvicorn app.main:app --reload --host 0.0.0.0 --port 8000%NC%

echo.
echo %BLUE%2.%NC% Open another terminal and run:
echo    %GREEN%cd %PROJECT_ROOT%\frontend%NC%
echo    %GREEN%npm run dev%NC%

echo.
echo %BLUE%3.%NC% Wait for both servers to start (about 5-10 seconds)

echo.
echo %BLUE%4.%NC% Open your browser and go to:
echo    %GREEN%http://localhost:3000%NC%

echo.
echo %BLUE%5.%NC% Login with:
echo    Email: %GREEN%test@example.com%NC%
echo    Password: %GREEN%testpassword123%NC%

echo.
echo %CYAN%Troubleshooting:%NC%
echo   - If port 8000 is in use: %GREEN%netstat -ano ^| findstr :8000%NC% (then kill the PID)
echo   - If port 3000 is in use: %GREEN%netstat -ano ^| findstr :3000%NC% (then kill the PID)
echo   - Check backend logs for errors in Terminal 1
echo   - Check frontend logs for errors in Terminal 2
echo   - To kill a process: %GREEN%taskkill /PID ^<pid^> /F%NC%

echo.
echo %GREEN%Good luck! 🚀%NC%
echo.
pause

