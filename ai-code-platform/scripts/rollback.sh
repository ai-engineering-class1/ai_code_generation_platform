#!/bin/bash
#
# Rollback script for AI Code Generation Platform
#
# Usage:
#   ./scripts/rollback.sh                      # Interactive mode
#   ./scripts/rollback.sh -b backup-20260118-095200  # Rollback to specific backup
#   ./scripts/rollback.sh -v v1.2.2            # Rollback to version v1.2.2
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
BACKUP_TAG=""
VERSION=""
COMPOSE_FILE_OVERRIDE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--backup)
            BACKUP_TAG="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -f|--file)
            COMPOSE_FILE_OVERRIDE="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -b, --backup TAG    Backup tag to rollback to (e.g., backup-20260118-095200)"
            echo "  -v, --version VER   Version number to rollback to (e.g., v1.2.2)"
            echo "  -f, --file FILE     Docker compose file to use (default: docker-compose.prod.yml)"
            echo "  -h, --help          Show this help message"
            echo ""
            echo "If no options provided, runs in interactive mode."
            echo ""
            echo "Examples:"
            echo "  $0                                    # Interactive mode"
            echo "  $0 -b backup-20260118-095200          # Rollback to backup"
            echo "  $0 -v v1.2.2                          # Rollback to version"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

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

print_warning "=========================================="
print_warning "AI Code Platform Rollback Script"
print_warning "=========================================="
echo ""

# Interactive mode if no parameters provided
if [ -z "$BACKUP_TAG" ] && [ -z "$VERSION" ]; then
    print_info "Available versions:"
    echo ""
    
    print_info "Backend images:"
    docker images "$BACKEND_IMAGE" --format "table {{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | head -n 11
    echo ""
    
    print_info "Frontend images:"
    docker images "$FRONTEND_IMAGE" --format "table {{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | head -n 11
    echo ""
    
    read -p "Enter backup tag or version to rollback to (or 'cancel' to abort): " choice
    
    if [ "$choice" = "cancel" ] || [ -z "$choice" ]; then
        print_info "Rollback cancelled"
        exit 0
    fi
    
    if [[ "$choice" =~ ^backup- ]]; then
        BACKUP_TAG="$choice"
    else
        VERSION="$choice"
    fi
fi

# Determine which tag to use
if [ -n "$BACKUP_TAG" ]; then
    TARGET_TAG="$BACKUP_TAG"
    print_warning "Rolling back to backup: $BACKUP_TAG"
elif [ -n "$VERSION" ]; then
    TARGET_TAG="$VERSION"
    print_warning "Rolling back to version: $VERSION"
else
    print_error "No backup tag or version specified!"
    exit 1
fi

echo ""

# Verify images exist
print_info "Verifying images exist..."
BACKEND_EXISTS=$(docker images -q "${BACKEND_IMAGE}:${TARGET_TAG}")
FRONTEND_EXISTS=$(docker images -q "${FRONTEND_IMAGE}:${TARGET_TAG}")

if [ -z "$BACKEND_EXISTS" ]; then
    print_error "✗ Backend image not found: ${BACKEND_IMAGE}:${TARGET_TAG}"
    print_info "Available backend tags:"
    docker images "$BACKEND_IMAGE" --format "{{.Tag}}"
    exit 1
fi

if [ -z "$FRONTEND_EXISTS" ]; then
    print_error "✗ Frontend image not found: ${FRONTEND_IMAGE}:${TARGET_TAG}"
    print_info "Available frontend tags:"
    docker images "$FRONTEND_IMAGE" --format "{{.Tag}}"
    exit 1
fi

print_success "✓ Images found"
echo ""

# Confirm rollback
print_warning "This will:"
print_warning "  1. Stop current containers"
print_warning "  2. Re-tag ${TARGET_TAG} as 'latest'"
print_warning "  3. Restart containers with rollback version"
echo ""

read -p "Continue with rollback? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    print_info "Rollback cancelled"
    exit 0
fi

echo ""

# Step 1: Create safety backup of current latest
print_info "[Step 1/4] Creating safety backup of current version..."
SAFETY_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SAFETY_TAG="pre-rollback-$SAFETY_TIMESTAMP"

docker tag "${BACKEND_IMAGE}:latest" "${BACKEND_IMAGE}:${SAFETY_TAG}" 2>/dev/null || true
docker tag "${FRONTEND_IMAGE}:latest" "${FRONTEND_IMAGE}:${SAFETY_TAG}" 2>/dev/null || true
print_success "✓ Safety backup created: $SAFETY_TAG"
echo ""

# Step 2: Re-tag rollback version as latest
print_info "[Step 2/4] Re-tagging ${TARGET_TAG} as latest..."
docker tag "${BACKEND_IMAGE}:${TARGET_TAG}" "${BACKEND_IMAGE}:latest"
docker tag "${FRONTEND_IMAGE}:${TARGET_TAG}" "${FRONTEND_IMAGE}:latest"
print_success "✓ Re-tagged successfully"
echo ""

# Step 3: Stop current containers
print_info "[Step 3/4] Stopping current containers..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME" down
print_success "✓ Containers stopped"
echo ""

# Step 4: Start containers with rollback version
print_info "[Step 4/4] Starting containers with rollback version..."
if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" -p "$PROJECT_NAME" up -d; then
    print_success "✓ Containers started"
else
    print_error "✗ Failed to start containers!"
    exit 1
fi
echo ""

# Verify deployment
print_info "Verifying rollback..."
sleep 3

ALL_RUNNING=true

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
    print_success "Rollback Successful!"
    print_success "=========================================="
    print_info "Rolled back to: $TARGET_TAG"
    print_info "Safety backup: $SAFETY_TAG"
    echo ""
    print_info "Backend: http://localhost:4531"
    print_info "Frontend: http://localhost:4530"
    echo ""
    print_info "To view logs:"
    print_info "  docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f"
    echo ""
    print_info "To undo this rollback:"
    print_info "  ./scripts/rollback.sh -b $SAFETY_TAG"
else
    print_error "=========================================="
    print_error "Rollback Failed!"
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
