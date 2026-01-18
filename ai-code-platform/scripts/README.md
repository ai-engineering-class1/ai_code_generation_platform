# Deployment Scripts

This directory contains automated scripts for deploying and managing the AI Code Generation Platform.

**Available in both PowerShell (Windows) and Bash (Linux/Ubuntu).**

## Scripts

### `deploy.ps1` / `deploy.sh`
Automated deployment script with version control and rollback support.

**Usage (Windows - PowerShell):**
```powershell
# Deploy new version with automatic backup
.\scripts\deploy.ps1 -Version "v1.2.3"

# Deploy without building (use existing images)
.\scripts\deploy.ps1 -Version "v1.2.3" -SkipBuild

# Deploy without creating backup (not recommended)
.\scripts\deploy.ps1 -Version "v1.2.3" -SkipBackup
```

**Usage (Linux/Ubuntu - Bash):**
```bash
# Make script executable (first time only)
chmod +x scripts/deploy.sh

# Deploy new version with automatic backup
./scripts/deploy.sh -v v1.2.3

# Deploy without building (use existing images)
./scripts/deploy.sh -v v1.2.3 --skip-build

# Deploy without creating backup (not recommended)
./scripts/deploy.sh -v v1.2.3 --skip-backup
```

**Features:**
- ✅ Automatic backup of current version
- ✅ Version tagging
- ✅ Build verification
- ✅ Deployment verification
- ✅ Auto-rollback on failure
- ✅ Detailed logging

### `rollback.ps1` / `rollback.sh`
Automated rollback script for reverting to previous versions.

**Usage (Windows - PowerShell):**
```powershell
# Interactive mode (recommended)
.\scripts\rollback.ps1

# Rollback to specific version
.\scripts\rollback.ps1 -Version "v1.2.2"

# Rollback to specific backup
.\scripts\rollback.ps1 -BackupTag "backup-20260118-095200"
```

**Usage (Linux/Ubuntu - Bash):**
```bash
# Make script executable (first time only)
chmod +x scripts/rollback.sh

# Interactive mode (recommended)
./scripts/rollback.sh

# Rollback to specific version
./scripts/rollback.sh -v v1.2.2

# Rollback to specific backup
./scripts/rollback.sh -b backup-20260118-095200
```

**Features:**
- ✅ Interactive version selection
- ✅ Safety backup before rollback
- ✅ Verification of image existence
- ✅ Deployment verification
- ✅ Detailed logging

## Prerequisites

- PowerShell 5.1 or higher
- Docker Desktop running
- Docker Compose installed
- Proper permissions to run Docker commands

## Quick Start

1. **Tag your current version:**
   ```powershell
   docker tag lee-ai-code-platform-backend:latest lee-ai-code-platform-backend:v1.0.0
   docker tag lee-ai-code-platform-frontend:latest lee-ai-code-platform-frontend:v1.0.0
   ```

2. **Deploy new version:**
   ```powershell
   .\scripts\deploy.ps1 -Version "v1.1.0"
   ```

3. **If needed, rollback:**
   ```powershell
   .\scripts\rollback.ps1 -Version "v1.0.0"
   ```

## Documentation

For more information, see:
- **[DEPLOYMENT_COMMANDS.md](../docs/DEPLOYMENT_COMMANDS.md)** - Complete deployment guide with rollback support
- **[QUICK_REFERENCE.md](../docs/QUICK_REFERENCE.md)** - Quick command reference
