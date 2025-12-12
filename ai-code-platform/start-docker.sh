#!/bin/bash

# AI Code Generation Platform - Complete Docker Setup
# This script will start PostgreSQL and Redis in Docker containers

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   AI Code Platform - Docker Database Setup                ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Docker is installed
echo -e "\n${BLUE}Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install Docker Desktop first.${NC}"
    echo "  Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}✗ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ docker-compose not found${NC}"
    exit 1
fi

# Use docker compose or docker-compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}✓ docker-compose is available${NC}"

# Start Docker containers
echo -e "\n${BLUE}Starting Docker containers...${NC}"
$DOCKER_COMPOSE up -d

# Wait for PostgreSQL to be ready
echo -e "\n${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
for i in {1..30}; do
    if docker exec ai-code-platform-db pg_isready -U aicode &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Wait for Redis to be ready
echo -e "\n${YELLOW}Waiting for Redis to be ready...${NC}"
for i in {1..30}; do
    if docker exec ai-code-platform-redis redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis is ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Initialize database
echo -e "\n${BLUE}Initializing database with test data...${NC}"
cd backend
source venv/bin/activate
python init_db.py

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Docker Setup Complete!                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${CYAN}Docker Services Running:${NC}"
echo -e "  ${GREEN}✓${NC} PostgreSQL on port 5433"
echo -e "  ${GREEN}✓${NC} Redis on port 6380"
echo -e "  ${GREEN}✓${NC} Database initialized with test data"

echo -e "\n${CYAN}Test Login Credentials:${NC}"
echo -e "  Email:    ${GREEN}test@example.com${NC}"
echo -e "  Password: ${GREEN}testpassword123${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "\n${BLUE}1. Start Backend (Terminal 1):${NC}"
echo -e "   cd backend"
echo -e "   source venv/bin/activate"
echo -e "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo -e "\n${BLUE}2. Start Frontend (Terminal 2):${NC}"
echo -e "   cd frontend"
echo -e "   npm run dev"

echo -e "\n${BLUE}3. Access the application:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3012${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:8000${NC}"
echo -e "   API Docs: ${GREEN}http://localhost:8000/docs${NC}"

echo -e "\n${CYAN}Docker Management Commands:${NC}"
echo -e "  View logs:     ${GREEN}docker-compose logs -f${NC}"
echo -e "  Stop services: ${GREEN}docker-compose stop${NC}"
echo -e "  Start again:   ${GREEN}docker-compose start${NC}"
echo -e "  Remove all:    ${GREEN}docker-compose down -v${NC}"

echo -e "\n${GREEN}Ready to start the application! 🚀${NC}\n"

