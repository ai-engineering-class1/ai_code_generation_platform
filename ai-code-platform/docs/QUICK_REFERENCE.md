# Quick Deployment Reference Card

## 🚀 Deploy New Version

**Windows:**
```powershell
.\scripts\deploy.ps1 -Version "v1.2.3"
```

**Linux/Ubuntu:**
```bash
./scripts/deploy.sh -v v1.2.3
```

**What it does:**
- ✅ Automatically backs up current version
- ✅ Builds new Docker images with version tags
- ✅ Deploys new version
- ✅ Verifies deployment success
- ✅ Auto-rollback on failure

---

## ⏮️ Rollback to Previous Version

### Interactive (Recommended)

**Windows:**
```powershell
.\scripts\rollback.ps1
```

**Linux/Ubuntu:**
```bash
./scripts/rollback.sh
```

Shows all available versions and lets you choose.

### Specific Backup

**Windows:**
```powershell
.\scripts\rollback.ps1 -BackupTag "backup-20260118-095200"
```

**Linux/Ubuntu:**
```bash
./scripts/rollback.sh -b backup-20260118-095200
```

### Specific Version

**Windows:**
```powershell
.\scripts\rollback.ps1 -Version "v1.2.2"
```

**Linux/Ubuntu:**
```bash
./scripts/rollback.sh -v v1.2.2
```

---

## 📋 Common Commands

### View Logs
```bash
docker-compose -p aicode logs -f
```

### Check Status
```bash
docker-compose -p aicode ps
```

### Restart Services
```bash
docker-compose -p aicode restart
```

### Stop Everything
```bash
docker-compose -p aicode down
```

---

## 🔍 List Available Versions

```powershell
# Backend versions
docker images lee-ai-code-platform-backend

# Frontend versions
docker images lee-ai-code-platform-frontend
```

---

## 🆘 Emergency Rollback

If something goes wrong:

1. **Find last good version:**
   ```bash
   docker images lee-ai-code-platform-backend
   ```

2. **Rollback:**
   
   **Windows:**
   ```powershell
   .\scripts\rollback.ps1 -Version "v1.2.2"
   ```
   
   **Linux/Ubuntu:**
   ```bash
   ./scripts/rollback.sh -v v1.2.2
   ```

3. **Verify:**
   ```bash
   docker-compose -p aicode ps
   curl http://localhost:4531/health
   ```

---

## 📚 Full Documentation

- **[DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md)** - Complete deployment guide
- **[DEPLOYMENT_COMMANDS.md](./DEPLOYMENT_COMMANDS.md)** - All available commands
