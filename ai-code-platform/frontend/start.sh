#!/bin/bash
# Start frontend server on port 3012

cd "$(dirname "$0")"

echo "Starting AI Code Generation Platform Frontend on port 3012..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start development server on port 3012
npm run dev
