@echo off
REM Start backend server on port 8000

cd /d "%~dp0"

echo Starting AI Code Generation Platform Backend on port 8000...

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
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

