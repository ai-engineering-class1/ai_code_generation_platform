@echo off
setlocal enabledelayedexpansion

REM AI Code Generation Platform - Backend Setup Script

echo.
echo 🚀 Setting up AI Code Generation Platform - Backend
echo ==================================================
echo.

REM Check Python version
echo Checking Python version...
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Please install Python 3.11+
    exit /b 1
)
python --version
echo.

REM Create virtual environment
echo Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    echo ✓ Virtual environment created
) else (
    echo ✓ Virtual environment already exists
)
echo.

REM Activate virtual environment
echo Activating virtual environment...
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else if exist "venv\Scripts\activate" (
    call venv\Scripts\activate
) else (
    echo Error: Could not activate virtual environment
    exit /b 1
)
echo.

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip
echo.

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo Error: Failed to install dependencies
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Install dev dependencies
if exist "requirements-dev.txt" (
    echo Installing development dependencies...
    pip install -r requirements-dev.txt
    if errorlevel 1 (
        echo Warning: Failed to install dev dependencies
    ) else (
        echo ✓ Dev dependencies installed
    )
    echo.
)

REM Create .env file if it doesn't exist
echo Setting up environment file...
if not exist ".env" (
    (
        echo # Database
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_code_platform
        echo.
        echo # Server
        echo HOST=0.0.0.0
        echo PORT=8000
        echo.
        echo # Security
        echo SECRET_KEY=test-secret-key-for-development-only-change-in-production
        echo ALGORITHM=HS256
        echo ACCESS_TOKEN_EXPIRE_MINUTES=30
        echo.
        echo # Redis
        echo REDIS_URL=redis://localhost:6379/0
        echo.
        echo # CORS - Allow frontend to access API
        echo CORS_ORIGINS=["http://localhost:3000"]
        echo.
        echo # Debug
        echo DEBUG=True
        echo.
        echo # Optional API Keys (add your own for full functionality)
        echo ANTHROPIC_API_KEY=
        echo GITHUB_TOKEN=
        echo JIRA_API_TOKEN=
    ) > .env
    echo ✓ .env file created with PORT=8000
    echo ⚠️  Please edit .env to add your API keys for full functionality
) else (
    echo ✓ .env file already exists
    REM Check if PORT is set in .env
    findstr /b /c:"PORT=" .env >nul 2>&1
    if errorlevel 1 (
        echo PORT=8000 >> .env
        echo ✓ Added PORT=8000 to .env
    )
)
echo.

REM Check PostgreSQL
echo Checking PostgreSQL...
where psql >nul 2>&1
if errorlevel 1 (
    echo ✗ PostgreSQL not found. Please install PostgreSQL 14+
    echo   Windows: Download from https://www.postgresql.org/download/windows/
) else (
    echo ✓ PostgreSQL is installed
    echo.
    set /p create_db="Do you want to create the database now? (y/n) "
    if /i "!create_db!"=="y" (
        set /p dbname="Enter database name (default: ai_code_platform): "
        if "!dbname!"=="" set dbname=ai_code_platform
        set /p dbuser="Enter database user (default: postgres): "
        if "!dbuser!"=="" set dbuser=postgres
        echo Creating database...
        createdb -U "!dbuser!" "!dbname!" 2>nul
        if errorlevel 1 (
            echo Database might already exist
        ) else (
            echo ✓ Database created
        )
    )
)
echo.

REM Check Redis
echo Checking Redis...
where redis-cli >nul 2>&1
if errorlevel 1 (
    echo ✗ Redis not found. Please install Redis 7+
    echo   Windows: Download from https://github.com/microsoftarchive/redis/releases
) else (
    redis-cli ping >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Redis is installed but not running
        echo   Start it with: redis-server
    ) else (
        echo ✓ Redis is running
    )
)
echo.

REM Initialize database
set /p init_db="Do you want to initialize the database tables now? (y/n) "
if /i "!init_db!"=="y" (
    echo Initializing database...
    python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
    if errorlevel 1 (
        echo ✗ Failed to create database tables. Check your database configuration.
    ) else (
        echo ✓ Database tables created
    )
    
    REM Update schema - add any missing columns
    echo Updating database schema...
    python update_db_schema.py
    if errorlevel 1 (
        echo ⚠️  Schema update had issues. Check the output above.
    ) else (
        echo ✓ Database schema updated
    )
)
echo.

echo ==================================================
echo ✓ Backend setup complete!
echo ==================================================
echo.
echo Next steps:
echo 1. Edit .env file with your configuration:
echo    - DATABASE_URL
echo    - SECRET_KEY (generate a secure random key)
echo    - ANTHROPIC_API_KEY
echo    - GITHUB_TOKEN
echo    - JIRA_API_TOKEN (optional)
echo.
echo 2. Start Redis if not running:
echo    redis-server
echo.
echo 3. Run the server on port 8000:
echo    venv\Scripts\activate
echo    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.
echo 4. Access the API:
echo    http://localhost:8000
echo    http://localhost:8000/docs (API documentation)
echo.


