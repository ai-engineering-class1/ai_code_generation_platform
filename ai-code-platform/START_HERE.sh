#!/bin/bash

# Complete Startup Guide for AI Code Generation Platform
# This script will help you start everything step by step

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   AI Code Generation Platform - Startup Guide             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Step 1: Check Prerequisites
echo -e "\n${BLUE}Step 1: Checking Prerequisites...${NC}"

# Check Python
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✓ Python 3 found: $(python3 --version)${NC}"
else
    echo -e "${RED}✗ Python 3 not found${NC}"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    exit 1
fi

# Check Redis
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${YELLOW}⚠️  Redis is not running${NC}"
    echo -e "${YELLOW}   Starting Redis...${NC}"
    redis-server --daemonize yes &> /dev/null && echo -e "${GREEN}✓ Redis started${NC}" || echo -e "${RED}✗ Failed to start Redis${NC}"
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL found${NC}"
    
    # Try to connect
    if psql -U postgres -d postgres -c "SELECT 1" &> /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL might not be running or requires password${NC}"
    fi
else
    echo -e "${RED}✗ PostgreSQL not found${NC}"
fi

# Step 2: Check if setup has been done
echo -e "\n${BLUE}Step 2: Checking Setup Status...${NC}"

if [ ! -d "$PROJECT_ROOT/backend/venv" ]; then
    echo -e "${YELLOW}⚠️  Backend not set up yet${NC}"
    read -p "Do you want to run the setup now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$PROJECT_ROOT"
        ./setup-all.sh
    else
        echo -e "${RED}Setup required. Please run: ./setup-all.sh${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Backend virtual environment exists${NC}"
fi

if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not installed${NC}"
    read -p "Do you want to install them now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$PROJECT_ROOT/frontend"
        npm install
    else
        echo -e "${RED}Please run: cd frontend && npm install${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
fi

# Step 3: Check database
echo -e "\n${BLUE}Step 3: Checking Database...${NC}"

if psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw ai_code_platform; then
    echo -e "${GREEN}✓ Database 'ai_code_platform' exists${NC}"
else
    echo -e "${YELLOW}⚠️  Database 'ai_code_platform' does not exist${NC}"
    read -p "Do you want to create it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        createdb ai_code_platform 2>/dev/null && echo -e "${GREEN}✓ Database created${NC}" || echo -e "${YELLOW}Note: You may need to create it manually${NC}"
        
        # Initialize database
        echo -e "${YELLOW}Initializing database with test data...${NC}"
        cd "$PROJECT_ROOT/backend"
        source venv/bin/activate
        python init_db.py
    fi
fi

# Step 4: Instructions to start servers
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Ready to Start!                                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${CYAN}You need to open ${YELLOW}3 terminal windows${CYAN}:${NC}\n"

echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Terminal 1 - Backend (Port 8082)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "Run these commands:"
echo -e "${GREEN}cd $PROJECT_ROOT/backend${NC}"
echo -e "${GREEN}source venv/bin/activate${NC}"
echo -e "${GREEN}uvicorn app.main:app --reload --host 0.0.0.0 --port 8082${NC}"
echo -e "\nOr simply:"
echo -e "${GREEN}cd $PROJECT_ROOT/backend && ./start.sh${NC}"

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Terminal 2 - Frontend (Port 3000)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "Run these commands:"
echo -e "${GREEN}cd $PROJECT_ROOT/frontend${NC}"
echo -e "${GREEN}npm run dev${NC}"

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Terminal 3 - This Guide (keep open for reference)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${CYAN}After starting both servers:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:8082${NC}"
echo -e "  API Docs: ${GREEN}http://localhost:8082/docs${NC}"

echo -e "\n${CYAN}Login Credentials:${NC}"
echo -e "  Email:    ${GREEN}test@example.com${NC}"
echo -e "  Password: ${GREEN}testpassword123${NC}"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
read -p "Press Enter to open the terminal commands above in detail..."

echo -e "\n${CYAN}Detailed Steps:${NC}\n"

echo -e "${BLUE}1.${NC} Open a new terminal and run:"
echo -e "   ${GREEN}cd $PROJECT_ROOT/backend${NC}"
echo -e "   ${GREEN}source venv/bin/activate${NC}"
echo -e "   ${GREEN}uvicorn app.main:app --reload --host 0.0.0.0 --port 8082${NC}"

echo -e "\n${BLUE}2.${NC} Open another terminal and run:"
echo -e "   ${GREEN}cd $PROJECT_ROOT/frontend${NC}"
echo -e "   ${GREEN}npm run dev${NC}"

echo -e "\n${BLUE}3.${NC} Wait for both servers to start (about 5-10 seconds)"

echo -e "\n${BLUE}4.${NC} Open your browser and go to:"
echo -e "   ${GREEN}http://localhost:3000${NC}"

echo -e "\n${BLUE}5.${NC} Login with:"
echo -e "   Email: ${GREEN}test@example.com${NC}"
echo -e "   Password: ${GREEN}testpassword123${NC}"

echo -e "\n${CYAN}Troubleshooting:${NC}"
echo -e "  - If port 8082 is in use: ${GREEN}lsof -ti:8082 | xargs kill -9${NC}"
echo -e "  - If port 3000 is in use: ${GREEN}lsof -ti:3000 | xargs kill -9${NC}"
echo -e "  - Check backend logs for errors in Terminal 1"
echo -e "  - Check frontend logs for errors in Terminal 2"

echo -e "\n${GREEN}Good luck! 🚀${NC}\n"

