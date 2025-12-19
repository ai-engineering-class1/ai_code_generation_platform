#!/bin/bash
# Start backend server on port 8000

cd "$(dirname "$0")"

echo "Starting AI Code Generation Platform Backend on port 8000..."

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Error: Virtual environment not found. Run setup.sh first."
    exit 1
fi

# Update database schema (add any missing columns)
echo "Updating database schema..."
python update_db_schema.py
echo ""

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
