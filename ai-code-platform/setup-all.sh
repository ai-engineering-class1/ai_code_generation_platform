#!/bin/bash

# AI Code Generation Platform - Complete Setup Script
# This script sets up both backend and frontend for testing
# Backend will run on port 8082

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   AI Code Generation Platform - Complete Setup            ║"
echo "║   Backend Port: 8000                                       ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check prerequisites
echo -e "\n${BLUE}Checking prerequisites...${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found. Please install Python 3.11+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 found: $(python3 --version)${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL not found. Please install PostgreSQL 14+${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL found${NC}"
fi

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}⚠️  Redis not found. Please install Redis 7+${NC}"
else
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis is installed but not running. Start it with: redis-server${NC}"
    fi
fi

# Setup Backend
echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Setting up Backend (Port 8000)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

cd backend

# Create venv
if [ ! -d "venv" ]; then
    echo -e "\n${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate venv
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Install dependencies
echo -e "${YELLOW}Installing Python dependencies...${NC}"
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_code_platform

# Server - Running on port 8000
HOST=0.0.0.0
PORT=8000

# Security
SECRET_KEY=test-secret-key-for-development-only-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS - Allow frontend to access API
CORS_ORIGINS=["http://localhost:3000"]

# Debug
DEBUG=True

# Optional API Keys (add your own)
ANTHROPIC_API_KEY=
GITHUB_TOKEN=
JIRA_API_TOKEN=
EOF
    echo -e "${GREEN}✓ .env file created with PORT=8000${NC}"
    echo -e "${YELLOW}⚠️  Edit backend/.env to add your API keys for full functionality${NC}"
else
    # Update existing .env to use port 8000
    if ! grep -q "^PORT=" .env; then
        echo "PORT=8000" >> .env
        echo -e "${GREEN}✓ Added PORT=8000 to .env${NC}"
    elif grep -q "^PORT=8082" .env; then
        sed -i.bak 's/^PORT=8082/PORT=8000/g' .env
        echo -e "${GREEN}✓ Updated PORT to 8000 in .env${NC}"
    else
        echo -e "${GREEN}✓ .env file already exists${NC}"
    fi
fi

# Setup Frontend
echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Setting up Frontend${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

cd ../frontend

echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
npm install -q
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Create .env.local if not exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local file...${NC}"
    cat > .env.local << 'EOF'
# Backend API URL - Port 8000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="AI Code Generation Platform"
EOF
    echo -e "${GREEN}✓ .env.local file created with API URL: http://localhost:8000${NC}"
else
    # Update existing .env.local to use port 8000
    if grep -q "localhost:8082" .env.local; then
        sed -i.bak 's|localhost:8082|localhost:8000|g' .env.local
        echo -e "${GREEN}✓ Updated API URL to port 8000 in .env.local${NC}"
    else
        echo -e "${GREEN}✓ .env.local file already exists${NC}"
    fi
fi

cd ..

# Summary
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Setup Complete!                                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "\n${YELLOW}1. Create the database:${NC}"
echo -e "   createdb ai_code_platform"

echo -e "\n${YELLOW}2. Initialize database with test data:${NC}"
echo -e "   cd backend"
echo -e "   source venv/bin/activate"
echo -e "   python init_db.py"

echo -e "\n${YELLOW}3. Start Redis (if not running):${NC}"
echo -e "   redis-server"

echo -e "\n${YELLOW}4. Start the backend on port 8000 (in a new terminal):${NC}"
echo -e "   cd backend"
echo -e "   source venv/bin/activate"
echo -e "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo -e "\n${YELLOW}5. Start the frontend (in another terminal):${NC}"
echo -e "   cd frontend"
echo -e "   npm run dev"

echo -e "\n${YELLOW}6. Access the application:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "   API Docs: ${GREEN}http://localhost:8000/docs${NC}"

echo -e "\n${YELLOW}7. Login with test credentials:${NC}"
echo -e "   Email: ${GREEN}test@example.com${NC}"
echo -e "   Password: ${GREEN}testpassword123${NC}"

echo -e "\n${BLUE}For detailed instructions, see QUICK_START.md${NC}\n"
