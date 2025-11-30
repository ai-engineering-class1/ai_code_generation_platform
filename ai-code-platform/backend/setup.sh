#!/bin/bash

# AI Code Generation Platform - Backend Setup Script

set -e  # Exit on error

echo "🚀 Setting up AI Code Generation Platform - Backend"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python version
echo -e "\n${YELLOW}Checking Python version...${NC}"
python3 --version || { echo -e "${RED}Python 3 not found. Please install Python 3.11+${NC}"; exit 1; }

# Create virtual environment
echo -e "\n${YELLOW}Creating virtual environment...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo -e "\n${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Upgrade pip
echo -e "\n${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
pip install -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Install dev dependencies
if [ -f "requirements-dev.txt" ]; then
    echo -e "\n${YELLOW}Installing development dependencies...${NC}"
    pip install -r requirements-dev.txt
    echo -e "${GREEN}✓ Dev dependencies installed${NC}"
fi

# Create .env file if it doesn't exist
echo -e "\n${YELLOW}Setting up environment file...${NC}"
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_code_platform

# Server
HOST=0.0.0.0
PORT=8082

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

# Optional API Keys (add your own for full functionality)
ANTHROPIC_API_KEY=
GITHUB_TOKEN=
JIRA_API_TOKEN=
EOF
    echo -e "${GREEN}✓ .env file created with PORT=8082${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env to add your API keys for full functionality${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
    # Check if PORT is set in .env
    if ! grep -q "^PORT=" .env; then
        echo "PORT=8082" >> .env
        echo -e "${GREEN}✓ Added PORT=8082 to .env${NC}"
    fi
fi

# Check PostgreSQL
echo -e "\n${YELLOW}Checking PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
    
    # Prompt for database setup
    read -p "Do you want to create the database now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter database name (default: ai_code_platform): " dbname
        dbname=${dbname:-ai_code_platform}
        
        read -p "Enter database user (default: postgres): " dbuser
        dbuser=${dbuser:-postgres}
        
        echo -e "${YELLOW}Creating database...${NC}"
        createdb -U "$dbuser" "$dbname" 2>/dev/null && echo -e "${GREEN}✓ Database created${NC}" || echo -e "${YELLOW}Database might already exist${NC}"
    fi
else
    echo -e "${RED}✗ PostgreSQL not found. Please install PostgreSQL 14+${NC}"
    echo "  macOS: brew install postgresql@14"
    echo "  Ubuntu: sudo apt-get install postgresql-14"
fi

# Check Redis
echo -e "\n${YELLOW}Checking Redis...${NC}"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis is installed but not running${NC}"
        echo "  Start it with: redis-server"
    fi
else
    echo -e "${RED}✗ Redis not found. Please install Redis 7+${NC}"
    echo "  macOS: brew install redis"
    echo "  Ubuntu: sudo apt-get install redis-server"
fi

# Initialize database
echo -e "\n${YELLOW}Do you want to initialize the database tables now?${NC}"
read -p "(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Initializing database...${NC}"
    python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)" && \
        echo -e "${GREEN}✓ Database tables created${NC}" || \
        echo -e "${RED}✗ Failed to create database tables. Check your database configuration.${NC}"
fi

echo -e "\n${GREEN}=================================================="
echo "✓ Backend setup complete!"
echo "==================================================${NC}"
echo -e "\nNext steps:"
echo "1. Edit .env file with your configuration:"
echo "   - DATABASE_URL"
echo "   - SECRET_KEY (generate a secure random key)"
echo "   - ANTHROPIC_API_KEY"
echo "   - GITHUB_TOKEN"
echo "   - JIRA_API_TOKEN (optional)"
echo ""
echo "2. Start Redis if not running:"
echo "   redis-server"
echo ""
echo "3. Run the server on port 8082:"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8082"
echo ""
echo "4. Access the API:"
echo "   http://localhost:8082"
echo "   http://localhost:8082/docs (API documentation)"
