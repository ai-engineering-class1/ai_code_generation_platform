#!/bin/bash

# AI Code Generation Platform - Frontend Setup Script

set -e  # Exit on error

echo "🚀 Setting up AI Code Generation Platform - Frontend"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "\n${YELLOW}Checking Node.js version...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    echo "Node.js version: $(node -v)"
    
    if [ "$NODE_VERSION" -ge 18 ]; then
        echo -e "${GREEN}✓ Node.js version is sufficient${NC}"
    else
        echo -e "${RED}✗ Node.js version 18+ required${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

# Check npm
echo -e "\n${YELLOW}Checking npm...${NC}"
npm --version || { echo -e "${RED}npm not found${NC}"; exit 1; }
echo -e "${GREEN}✓ npm is installed${NC}"

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create .env.local file if it doesn't exist
echo -e "\n${YELLOW}Setting up environment file...${NC}"
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# Frontend Environment Configuration

# Backend API URL - Updated to port 8082
NEXT_PUBLIC_API_URL=http://localhost:8082

# App Configuration
NEXT_PUBLIC_APP_NAME="AI Code Generation Platform"
NEXT_PUBLIC_APP_VERSION="0.1.0"
EOF
    echo -e "${GREEN}✓ .env.local file created with API URL: http://localhost:8082${NC}"
else
    echo -e "${GREEN}✓ .env.local file already exists${NC}"
    # Check if API URL is set correctly
    if grep -q "NEXT_PUBLIC_API_URL=http://localhost:8000" .env.local; then
        sed -i.bak 's|NEXT_PUBLIC_API_URL=http://localhost:8000|NEXT_PUBLIC_API_URL=http://localhost:8082|g' .env.local
        echo -e "${GREEN}✓ Updated API URL to port 8082${NC}"
    fi
fi

echo -e "\n${GREEN}=================================================="
echo "✓ Frontend setup complete!"
echo "==================================================${NC}"
echo -e "\nNext steps:"
echo "1. Make sure the backend is running on http://localhost:8082"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Access the application:"
echo "   http://localhost:3000"
echo ""
echo "4. Create an account and start testing!"
