#!/bin/bash
# Start backend server on port 8082

cd "$(dirname "$0")"

echo "Starting AI Code Generation Platform Backend on port 8082..."

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Error: Virtual environment not found. Run setup.sh first."
    exit 1
fi

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8082
