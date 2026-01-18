#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Rollback script for AI Code Generation Platform

.DESCRIPTION
    Quickly rollback to a previous version using backup tags or version numbers

.PARAMETER BackupTag
    Backup tag to rollback to (e.g., "backup-20260118-095200")

.PARAMETER Version
    Version number to rollback to (e.g., "v1.2.2")

.PARAMETER ComposeFile
    Docker compose file to use (default: "docker-compose.prod.yml")

.EXAMPLE
    .\rollback.ps1 -BackupTag "backup-20260118-095200"
    Rollback to a specific backup

.EXAMPLE
    .\rollback.ps1 -Version "v1.2.2"
    Rollback to version v1.2.2

.EXAMPLE
    .\rollback.ps1
    Interactive mode - shows available versions and lets you choose
#>

param(
    [Parameter(Mandatory = $false)]
    [string]$BackupTag,
    
    [Parameter(Mandatory = $false)]
    [string]$Version,
    
    [Parameter(Mandatory = $false)]
    [string]$ComposeFile = "docker-compose.prod.yml"
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

Write-Warning "=========================================="
Write-Warning "AI Code Platform Rollback Script"
Write-Warning "=========================================="
Write-Info ""

# Interactive mode if no parameters provided
if (-not $BackupTag -and -not $Version) {
    Write-Info "Available versions:"
    Write-Info ""
    
    Write-Info "Backend images:"
    docker images $BACKEND_IMAGE --format "table {{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | Select-Object -First 10
    Write-Info ""
    
    Write-Info "Frontend images:"
    docker images $FRONTEND_IMAGE --format "table {{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | Select-Object -First 10
    Write-Info ""
    
    $choice = Read-Host "Enter backup tag or version to rollback to (or 'cancel' to abort)"
    
    if ($choice -eq "cancel" -or $choice -eq "") {
        Write-Info "Rollback cancelled"
        exit 0
    }
    
    if ($choice -match "^backup-") {
        $BackupTag = $choice
    }
    else {
        $Version = $choice
    }
}

# Determine which tag to use
if ($BackupTag) {
    $targetTag = $BackupTag
    Write-Warning "Rolling back to backup: $BackupTag"
}
elseif ($Version) {
    $targetTag = $Version
    Write-Warning "Rolling back to version: $Version"
}
else {
    Write-Error "No backup tag or version specified!"
    exit 1
}

Write-Info ""

# Verify images exist
Write-Info "Verifying images exist..."
$backendExists = docker images -q "${BACKEND_IMAGE}:${targetTag}"
$frontendExists = docker images -q "${FRONTEND_IMAGE}:${targetTag}"

if (-not $backendExists) {
    Write-Error "✗ Backend image not found: ${BACKEND_IMAGE}:${targetTag}"
    Write-Info "Available backend tags:"
    docker images $BACKEND_IMAGE --format "{{.Tag}}"
    exit 1
}

if (-not $frontendExists) {
    Write-Error "✗ Frontend image not found: ${FRONTEND_IMAGE}:${targetTag}"
    Write-Info "Available frontend tags:"
    docker images $FRONTEND_IMAGE --format "{{.Tag}}"
    exit 1
}

Write-Success "✓ Images found"
Write-Info ""

# Confirm rollback
Write-Warning "This will:"
Write-Warning "  1. Stop current containers"
Write-Warning "  2. Re-tag ${targetTag} as 'latest'"
Write-Warning "  3. Restart containers with rollback version"
Write-Info ""

$confirm = Read-Host "Continue with rollback? (yes/no)"
if ($confirm -ne "yes") {
    Write-Info "Rollback cancelled"
    exit 0
}

Write-Info ""

# Step 1: Create safety backup of current latest
Write-Info "[Step 1/4] Creating safety backup of current version..."
$safetyTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$safetyTag = "pre-rollback-$safetyTimestamp"

docker tag "${BACKEND_IMAGE}:latest" "${BACKEND_IMAGE}:${safetyTag}"
docker tag "${FRONTEND_IMAGE}:latest" "${FRONTEND_IMAGE}:${safetyTag}"
Write-Success "✓ Safety backup created: $safetyTag"
Write-Info ""

# Step 2: Re-tag rollback version as latest
Write-Info "[Step 2/4] Re-tagging ${targetTag} as latest..."
docker tag "${BACKEND_IMAGE}:${targetTag}" "${BACKEND_IMAGE}:latest"
docker tag "${FRONTEND_IMAGE}:${targetTag}" "${FRONTEND_IMAGE}:latest"
Write-Success "✓ Re-tagged successfully"
Write-Info ""

# Step 3: Stop current containers
Write-Info "[Step 3/4] Stopping current containers..."
docker-compose -f $ComposeFile --env-file $ENV_FILE -p $PROJECT_NAME down
Write-Success "✓ Containers stopped"
Write-Info ""

# Step 4: Start containers with rollback version
Write-Info "[Step 4/4] Starting containers with rollback version..."
docker-compose -f $ComposeFile --env-file $ENV_FILE -p $PROJECT_NAME up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "✗ Failed to start containers!"
    exit 1
}
Write-Success "✓ Containers started"
Write-Info ""

# Verify deployment
Write-Info "Verifying rollback..."
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
    Write-Success "Rollback Successful!"
    Write-Success "=========================================="
    Write-Info "Rolled back to: $targetTag"
    Write-Info "Safety backup: $safetyTag"
    Write-Info ""
    Write-Info "Backend: http://localhost:4531"
    Write-Info "Frontend: http://localhost:4530"
    Write-Info ""
    Write-Info "To view logs:"
    Write-Info "  docker-compose -f $ComposeFile -p $PROJECT_NAME logs -f"
    Write-Info ""
    Write-Info "To undo this rollback:"
    Write-Info "  .\scripts\rollback.ps1 -BackupTag $safetyTag"
}
else {
    Write-Error "=========================================="
    Write-Error "Rollback Failed!"
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
