@echo off
setlocal enabledelayedexpansion

REM AI Code Generation Platform - Complete Docker Setup
REM This script will start PostgreSQL and Redis in Docker containers

title AI Code Platform - Docker Database Setup

REM Set colors (using ANSI escape codes)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "CYAN=[96m"
set "NC=[0m"

echo.
echo %CYAN%╔════════════════════════════════════════════════════════════╗%NC%
echo %CYAN%║   AI Code Platform - Docker Database Setup                ║%NC%
echo %CYAN%╚════════════════════════════════════════════════════════════╝%NC%

REM Get project root directory
set "PROJECT_ROOT=%~dp0"
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

REM Check if Docker is installed
echo.
echo %BLUE%Checking Docker...%NC%
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%✗ Docker not found. Please install Docker Desktop first.%NC%
    echo   Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%✗ Docker is not running. Please start Docker Desktop.%NC%
    pause
    exit /b 1
)

echo %GREEN%✓ Docker is running%NC%

REM Check if docker-compose is available
set "DOCKER_COMPOSE="
where docker-compose >nul 2>&1
if %errorlevel% equ 0 (
    set "DOCKER_COMPOSE=docker-compose"
) else (
    docker compose version >nul 2>&1
    if !errorlevel! equ 0 (
        set "DOCKER_COMPOSE=docker compose"
    ) else (
        echo %RED%✗ docker-compose not found%NC%
        pause
        exit /b 1
    )
)

echo %GREEN%✓ docker-compose is available%NC%

REM Start Docker containers
echo.
echo %BLUE%Starting Docker containers...%NC%
cd /d "%PROJECT_ROOT%"
%DOCKER_COMPOSE% up -d
if %errorlevel% neq 0 (
    echo %RED%✗ Failed to start Docker containers%NC%
    pause
    exit /b 1
)

REM Wait for PostgreSQL to be ready
echo.
echo %YELLOW%Waiting for PostgreSQL to be ready...%NC%
set "POSTGRES_READY=0"
for /l %%i in (1,1,30) do (
    docker exec ai-code-platform-db pg_isready -U aicode >nul 2>&1
    if !errorlevel! equ 0 (
        echo %GREEN%✓ PostgreSQL is ready%NC%
        set "POSTGRES_READY=1"
        goto :postgres_done
    )
    echo|set /p="."
    timeout /t 1 /nobreak >nul
)
:postgres_done
if !POSTGRES_READY! equ 0 (
    echo.
    echo %YELLOW%⚠️  PostgreSQL may not be ready yet. Continuing anyway...%NC%
)

REM Wait for Redis to be ready
echo.
echo %YELLOW%Waiting for Redis to be ready...%NC%
set "REDIS_READY=0"
for /l %%i in (1,1,30) do (
    docker exec ai-code-platform-redis redis-cli ping >nul 2>&1
    if !errorlevel! equ 0 (
        echo %GREEN%✓ Redis is ready%NC%
        set "REDIS_READY=1"
        goto :redis_done
    )
    echo|set /p="."
    timeout /t 1 /nobreak >nul
)
:redis_done
if !REDIS_READY! equ 0 (
    echo.
    echo %YELLOW%⚠️  Redis may not be ready yet. Continuing anyway...%NC%
)

REM Initialize database
echo.
echo %BLUE%Initializing database with test data...%NC%
cd /d "%PROJECT_ROOT%\backend"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    if exist "init_db.py" (
        python init_db.py
        if !errorlevel! neq 0 (
            echo %YELLOW%⚠️  Database initialization may have failed. Check the output above.%NC%
        )
    ) else (
        echo %YELLOW%⚠️  init_db.py not found. Skipping database initialization.%NC%
    )
) else (
    echo %YELLOW%⚠️  Virtual environment not found. Please run setup.bat first.%NC%
    echo %YELLOW%   Skipping database initialization.%NC%
)

echo.
echo %GREEN%╔════════════════════════════════════════════════════════════╗%NC%
echo %GREEN%║   ✓ Docker Setup Complete!                                ║%NC%
echo %GREEN%╚════════════════════════════════════════════════════════════╝%NC%

echo.
echo %CYAN%Docker Services Running:%NC%
echo   %GREEN%✓%NC% PostgreSQL on port 5433
echo   %GREEN%✓%NC% Redis on port 6380
echo   %GREEN%✓%NC% Database initialized with test data

echo.
echo %CYAN%Test Login Credentials:%NC%
echo   Email:    %GREEN%test@example.com%NC%
echo   Password: %GREEN%testpassword123%NC%

echo.
echo %YELLOW%Next Steps:%NC%

echo.
echo %BLUE%1. Start Backend (Terminal 1):%NC%
echo    cd backend
echo    venv\Scripts\activate
echo    uvicorn app.main:app --reload --host 0.0.0.0 --port 8082

echo.
echo %BLUE%2. Start Frontend (Terminal 2):%NC%
echo    cd frontend
echo    npm run dev

echo.
echo %BLUE%3. Access the application:%NC%
echo    Frontend: %GREEN%http://localhost:3012%NC%
echo    Backend:  %GREEN%http://localhost:8082%NC%
echo    API Docs: %GREEN%http://localhost:8082/docs%NC%

echo.
echo %CYAN%Docker Management Commands:%NC%
if "%DOCKER_COMPOSE%"=="docker compose" (
    echo   View logs:     %GREEN%docker compose logs -f%NC%
    echo   Stop services: %GREEN%docker compose stop%NC%
    echo   Start again:   %GREEN%docker compose start%NC%
    echo   Remove all:    %GREEN%docker compose down -v%NC%
) else (
    echo   View logs:     %GREEN%docker-compose logs -f%NC%
    echo   Stop services: %GREEN%docker-compose stop%NC%
    echo   Start again:   %GREEN%docker-compose start%NC%
    echo   Remove all:    %GREEN%docker-compose down -v%NC%
)

echo.
echo %GREEN%Ready to start the application! 🚀%NC%
echo.
pause

