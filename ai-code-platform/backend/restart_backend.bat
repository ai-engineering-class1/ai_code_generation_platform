@echo off
REM Kill any existing backend processes on port 8000
echo Stopping any existing backend processes...

REM Find and kill processes using port 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
echo.

cd /d "%~dp0"

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else if exist "venv\Scripts\activate" (
    call venv\Scripts\activate
) else (
    echo Error: Virtual environment not found. Run setup.bat first.
    exit /b 1
)

REM Update database schema (add any missing columns)
echo Updating database schema...
python update_db_schema.py
echo.

REM Start server
echo Backend starting on http://127.0.0.1:8000
echo Press Ctrl+C to stop
echo.
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

