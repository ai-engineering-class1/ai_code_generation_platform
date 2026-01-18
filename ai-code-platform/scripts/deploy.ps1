#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated deployment script with rollback support for AI Code Generation Platform

.DESCRIPTION
    This script handles versioned deployments with automatic backup tagging,
    allowing easy rollbacks to previous versions.

.PARAMETER Version
    Version tag for the new deployment (e.g., "v1.2.3")

.PARAMETER ComposeFile
    Docker compose file to use (default: "docker-compose.prod.yml")

.PARAMETER SkipBackup
    Skip creating backup tags (not recommended for production)

.PARAMETER SkipBuild
    Skip building new images (use existing images with the specified version)

.EXAMPLE
    .\deploy.ps1 -Version "v1.2.3"
    Deploy version v1.2.3 with automatic backup using docker-compose.prod.yml

.EXAMPLE
    .\deploy.ps1 -Version "v1.2.3" -ComposeFile "docker-compose.yml"
    Deploy using the standard docker-compose.yml file

.EXAMPLE
    .\deploy.ps1 -Version "v1.2.3" -SkipBuild
    Deploy existing v1.2.3 images without rebuilding
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Version,
    
    [Parameter(Mandatory = $false)]
    [string]$ComposeFile = "docker-compose.prod.yml",
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipBackup,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipBuild
)

# Configuration
$PROJECT_NAME = "aicode"
$BACKEND_IMAGE = "lee-ai-code-platform-backend"
$FRONTEND_IMAGE = "lee-ai-code-platform-frontend"
$ENV_FILE = "backend/.env"

# Check if compose file exists
if (-not (Test-Path $ComposeFile)) {
    Write-Host "Error: Compose file '$ComposeFile' not found!" -ForegroundColor Red
    Write-Host "Available compose files:" -ForegroundColor Yellow
    Get-ChildItem "docker-compose*.yml" | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Cyan }
    exit 1
}

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "=========================================="
Write-Info "AI Code Platform Deployment Script"
Write-Info "=========================================="
Write-Info "Version: $Version"
Write-Info "Compose File: $ComposeFile"
Write-Info "Project: $PROJECT_NAME"
Write-Info ""

# Step 1: Create backup tags
if (-not $SkipBackup) {
    Write-Info "[Step 1/5] Creating backup tags..."
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupTag = "backup-$timestamp"
    
    # Check if latest images exist
    $backendExists = docker images -q "${BACKEND_IMAGE}:latest" 2>$null
    $frontendExists = docker images -q "${FRONTEND_IMAGE}:latest" 2>$null
    
    if ($backendExists) {
        docker tag "${BACKEND_IMAGE}:latest" "${BACKEND_IMAGE}:${backupTag}" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✓ Created backup: ${BACKEND_IMAGE}:${backupTag}"
        }
        else {
            Write-Warning "⚠ Could not create backend backup (image may not exist)"
        }
    }
    else {
        Write-Warning "⚠ No existing backend:latest image to backup"
    }
    
    if ($frontendExists) {
        docker tag "${FRONTEND_IMAGE}:latest" "${FRONTEND_IMAGE}:${backupTag}" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "✓ Created backup: ${FRONTEND_IMAGE}:${backupTag}"
        }
        else {
            Write-Warning "⚠ Could not create frontend backup (image may not exist)"
        }
    }
    else {
        Write-Warning "⚠ No existing frontend:latest image to backup"
    }
    Write-Info ""
}
else {
    Write-Warning "[Step 1/5] Skipping backup creation (not recommended!)"
    Write-Info ""
}

# Step 2: Build new images
if (-not $SkipBuild) {
    Write-Info "[Step 2/5] Building new images..."
    
    Write-Info "Building backend..."
    docker build -t "${BACKEND_IMAGE}:${Version}" -t "${BACKEND_IMAGE}:latest" ./backend
    if ($LASTEXITCODE -ne 0) {
        Write-Error "✗ Backend build failed!"
        exit 1
    }
    Write-Success "✓ Backend built successfully"
    
    Write-Info "Building frontend..."
    docker build -t "${FRONTEND_IMAGE}:${Version}" -t "${FRONTEND_IMAGE}:latest" `
        --build-arg NEXT_PUBLIC_API_URL=https://aicodegen.easiiodev.ai `
        ./frontend
    if ($LASTEXITCODE -ne 0) {
        Write-Error "✗ Frontend build failed!"
        exit 1
    }
    Write-Success "✓ Frontend built successfully"
    Write-Info ""
}
else {
    Write-Info "[Step 2/5] Skipping build..."
    
    # Re-tag existing version as latest
    docker tag "${BACKEND_IMAGE}:${Version}" "${BACKEND_IMAGE}:latest"
    docker tag "${FRONTEND_IMAGE}:${Version}" "${FRONTEND_IMAGE}:latest"
    Write-Success "✓ Tagged ${Version} as latest"
    Write-Info ""
}

# Step 3: Stop current containers
Write-Info "[Step 3/5] Stopping current containers..."
docker-compose -f $ComposeFile --env-file $ENV_FILE -p $PROJECT_NAME down
if ($LASTEXITCODE -ne 0) {
    Write-Warning "⚠ Warning: docker-compose down had issues (may be normal if no containers running)"
}
Write-Success "✓ Containers stopped"
Write-Info ""

# Step 4: Start new containers
Write-Info "[Step 4/5] Starting new containers..."
docker-compose -f $ComposeFile --env-file $ENV_FILE -p $PROJECT_NAME up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "✗ Failed to start containers!"
    Write-Error "Attempting rollback..."
    
    if (-not $SkipBackup) {
        # Rollback to backup
        docker tag "${BACKEND_IMAGE}:${backupTag}" "${BACKEND_IMAGE}:latest"
        docker tag "${FRONTEND_IMAGE}:${backupTag}" "${FRONTEND_IMAGE}:latest"
        docker-compose -f $ComposeFile --env-file $ENV_FILE -p $PROJECT_NAME up -d
        Write-Warning "⚠ Rolled back to previous version"
    }
    exit 1
}
Write-Success "✓ Containers started"
Write-Info ""

# Step 5: Verify deployment
Write-Info "[Step 5/5] Verifying deployment..."
Start-Sleep -Seconds 3

$containers = docker-compose -f $ComposeFile -p $PROJECT_NAME ps --format json | ConvertFrom-Json
$allRunning = $true

foreach ($container in $containers) {
    if ($container.State -eq "running") {
        Write-Success "✓ $($container.Name) is running"
    }
    else {
        Write-Error "✗ $($container.Name) is $($container.State)"
        $allRunning = $false
    }
}

Write-Info ""
if ($allRunning) {
    Write-Success "=========================================="
    Write-Success "Deployment Successful!"
    Write-Success "=========================================="
    Write-Info "Version: $Version"
    Write-Info "Backend: http://localhost:4531"
    Write-Info "Frontend: http://localhost:4530"
    Write-Info ""
    Write-Info "To view logs:"
    Write-Info "  docker-compose -f $ComposeFile -p $PROJECT_NAME logs -f"
    Write-Info ""
    Write-Info "To rollback:"
    Write-Info "  .\scripts\rollback.ps1 -BackupTag $backupTag"
}
else {
    Write-Error "=========================================="
    Write-Error "Deployment Failed!"
    Write-Error "=========================================="
    Write-Info "Check logs with:"
    Write-Info "  docker-compose -f $ComposeFile -p $PROJECT_NAME logs"
    exit 1
}

# Show recent logs
Write-Info ""
Write-Info "Recent logs (last 20 lines):"
Write-Info "----------------------------------------"
docker-compose -f $ComposeFile -p $PROJECT_NAME logs --tail=20
