#!/bin/bash
#
# Automated deployment script with rollback support for AI Code Generation Platform
#
# Usage:
#   ./scripts/deploy.sh -v v1.2.3              # Deploy version v1.2.3 with automatic backup
#   ./scripts/deploy.sh -v v1.2.3 --skip-build # Deploy existing v1.2.3 images without rebuilding
#   ./scripts/deploy.sh -v v1.2.3 --skip-backup # Deploy without creating backup (not recommended)
#

set -e  # Exit on error

# Configuration
PROJECT_NAME="aicode"
BACKEND_IMAGE="lee-ai-code-platform-backend"
FRONTEND_IMAGE="lee-ai-code-platform-frontend"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE="backend/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions for colored output
print_success() { echo -e "${GREEN}$1${NC}"; }
print_info() { echo -e "${CYAN}$1${NC}"; }
print_warning() { echo -e "${YELLOW}$1${NC}"; }
print_error() { echo -e "${RED}$1${NC}"; }

# Parse command line arguments
VERSION=""
SKIP_BACKUP=false
SKIP_BUILD=false
COMPOSE_FILE_OVERRIDE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -f|--file)
            COMPOSE_FILE_OVERRIDE="$2"
            shift 2
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 -v VERSION [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -v, --version VERSION    Version tag for the new deployment (required)"
            echo "  -f, --file FILE          Docker compose file to use (default: docker-compose.prod.yml)"
            echo "  --skip-backup            Skip creating backup tags (not recommended)"
            echo "  --skip-build             Skip building new images (use existing images)"
            echo "  -h, --help               Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 -v v1.2.3"
            echo "  $0 -v v1.2.3 --skip-build"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Validate version parameter
if [ -z "$VERSION" ]; then
    print_error "Error: Version parameter is required!"
    echo "Usage: $0 -v VERSION"
    echo "Example: $0 -v v1.2.3"
    exit 1
fi

# Override compose file if specified
if [ -n "$COMPOSE_FILE_OVERRIDE" ]; then
    COMPOSE_FILE="$COMPOSE_FILE_OVERRIDE"
fi

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "Error: Compose file '$COMPOSE_FILE' not found!"
    print_warning "Available compose files:"
    ls -1 docker-compose*.yml 2>/dev/null | while read file; do
        print_info "  - $file"
    done
    exit 1
fi

print_info "=========================================="
print_info "AI Code Platform Deployment Script"
print_info "=========================================="
print_info "Version: $VERSION"
print_info "Compose File: $COMPOSE_FILE"
print_info "Project: $PROJECT_NAME"
echo ""

# Step 1: Create backup tags
if [ "$SKIP_BACKUP" = false ]; then
    print_info "[Step 1/5] Creating backup tags..."
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    BACKUP_TAG="backup-$TIMESTAMP"
    
    # Check if latest images exist
    if docker images -q "${BACKEND_IMAGE}:latest" > /dev/null 2>&1; then
        docker tag "${BACKEND_IMAGE}:latest" "${BACKEND_IMAGE}:${BACKUP_TAG}"
        print_success "✓ Created backup: ${BACKEND_IMAGE}:${BACKUP_TAG}"
    else
        print_warning "⚠ No existing backend:latest image to backup"
    fi
    
    if docker images -q "${FRONTEND_IMAGE}:latest" > /dev/null 2>&1; then
        docker tag "${FRONTEND_IMAGE}:latest" "${FRONTEND_IMAGE}:${BACKUP_TAG}"
        print_success "✓ Created backup: ${FRONTEND_IMAGE}:${BACKUP_TAG}"
    else
        print_warning "⚠ No existing frontend:latest image to backup"
    fi
    echo ""
else
    print_warning "[Step 1/5] Skipping backup creation (not recommended!)"
    echo ""
fi

# Step 2: Build new images
if [ "$SKIP_BUILD" = false ]; then
    print_info "[Step 2/5] Building new images..."
    
    print_info "Building backend..."
    if docker build -t "${BACKEND_IMAGE}:${VERSION}" -t "${BACKEND_IMAGE}:latest" ./backend; then
        print_success "✓ Backend built successfully"
    else
        print_error "✗ Backend build failed!"
        exit 1
    fi
    
    print_info "Building frontend..."
    if docker build -t "${FRONTEND_IMAGE}:${VERSION}" -t "${FRONTEND_IMAGE}:latest" \
        --build-arg NEXT_PUBLIC_API_URL=https://aicodegen.easiiodev.ai \
        ./frontend; then
        print_success "✓ Frontend built successfully"
    else
        print_error "✗ Frontend build failed!"
        exit 1
    fi
    echo ""
else
    print_info "[Step 2/5] Skipping build..."
    
    # Re-tag existing version as latest
    docker tag "${BACKEND_IMAGE}:${VERSION}" "${BACKEND_IMAGE}:latest"
    docker tag "${FRONTEND_IMAGE}:${VERSION}" "${FRONTEND_IMAGE}:latest"
    print_success "✓ Tagged ${VERSION} as latest"
    echo ""
fi

# Step 3: Stop current containers
print_info "[Step 3/5] Stopping current containers..."
if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME" down; then
    print_success "✓ Containers stopped"
else
    print_warning "⚠ Warning: docker-compose down had issues (may be normal if no containers running)"
fi
echo ""

# Step 4: Start new containers
print_info "[Step 4/5] Starting new containers..."
if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME" up -d; then
    print_success "✓ Containers started"
else
    print_error "✗ Failed to start containers!"
    
    if [ "$SKIP_BACKUP" = false ]; then
        print_error "Attempting rollback..."
        # Rollback to backup
        docker tag "${BACKEND_IMAGE}:${BACKUP_TAG}" "${BACKEND_IMAGE}:latest"
        docker tag "${FRONTEND_IMAGE}:${BACKUP_TAG}" "${FRONTEND_IMAGE}:latest"
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME" up -d
        print_warning "⚠ Rolled back to previous version"
    fi
    exit 1
fi
echo ""

# Step 5: Verify deployment
print_info "[Step 5/5] Verifying deployment..."
sleep 3

ALL_RUNNING=true
CONTAINER_STATUS=$(docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps --format json 2>/dev/null || echo "[]")

# Check if containers are running
if docker ps --filter "name=Lee-ai-code-platform-backend" --format "{{.Status}}" | grep -q "Up"; then
    print_success "✓ Lee-ai-code-platform-backend is running"
else
    print_error "✗ Lee-ai-code-platform-backend is not running"
    ALL_RUNNING=false
fi

if docker ps --filter "name=Lee-ai-code-platform-frontend" --format "{{.Status}}" | grep -q "Up"; then
    print_success "✓ Lee-ai-code-platform-frontend is running"
else
    print_error "✗ Lee-ai-code-platform-frontend is not running"
    ALL_RUNNING=false
fi

echo ""
if [ "$ALL_RUNNING" = true ]; then
    print_success "=========================================="
    print_success "Deployment Successful!"
    print_success "=========================================="
    print_info "Version: $VERSION"
    print_info "Backend: http://localhost:4531"
    print_info "Frontend: http://localhost:4530"
    echo ""
    print_info "To view logs:"
    print_info "  docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f"
    echo ""
    if [ "$SKIP_BACKUP" = false ]; then
        print_info "To rollback:"
        print_info "  ./scripts/rollback.sh -b $BACKUP_TAG"
    fi
else
    print_error "=========================================="
    print_error "Deployment Failed!"
    print_error "=========================================="
    print_info "Check logs with:"
    print_info "  docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs"
    exit 1
fi

# Show recent logs
echo ""
print_info "Recent logs (last 20 lines):"
print_info "----------------------------------------"
docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs --tail=20
