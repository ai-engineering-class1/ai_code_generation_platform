# 🐳 Docker Setup Guide - AI Code Generation Platform

This guide uses Docker to run PostgreSQL and Redis, completely separate from any existing databases on your system.

## 📦 What's Included

- **PostgreSQL 14** on port **5433** (not 5432, so no conflicts!)
- **Redis 7** on port **6380** (not 6379, so no conflicts!)
- Data persistence with Docker volumes
- Health checks for both services

## 🚀 Quick Start (One Command!)

```bash
cd /Volumes/ExtNVMe/ai_engineering_class1/ai_code_generation_platform/ai-code-platform
./start-docker.sh
```

This will:
1. ✅ Start PostgreSQL in Docker (port 5433)
2. ✅ Start Redis in Docker (port 6380)
3. ✅ Wait for services to be ready
4. ✅ Initialize database with test data
5. ✅ Create test user and sample project

---

## 📋 Manual Setup (Step by Step)

### Prerequisites

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Start Docker Desktop application

2. **Verify Docker is Running**
   ```bash
   docker --version
   docker ps
   ```

### Step 1: Start Docker Services

```bash
cd /Volumes/ExtNVMe/ai_engineering_class1/ai_code_generation_platform/ai-code-platform
docker-compose up -d
```

**You should see:**
```
✔ Container ai-code-platform-db     Started
✔ Container ai-code-platform-redis  Started
```

### Step 2: Verify Services are Running

```bash
# Check containers are running
docker ps

# Check PostgreSQL
docker exec ai-code-platform-db pg_isready -U aicode

# Check Redis
docker exec ai-code-platform-redis redis-cli ping
```

### Step 3: Initialize Database

```bash
cd backend
source venv/bin/activate
python init_db.py
```

**You should see:**
```
Initializing database...
✓ Database tables created
✓ Test user created
✓ Test project created
✓ Created 4 test tasks
```

---

## 🎮 Start the Application

### Terminal 1 - Backend (Port 8000)

```bash
cd /Volumes/ExtNVMe/ai_engineering_class1/ai_code_generation_platform/ai-code-platform/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend (Port 3012)

```bash
cd /Volumes/ExtNVMe/ai_engineering_class1/ai_code_generation_platform/ai-code-platform/frontend
npm run dev
```

### Open Browser

Go to: **http://localhost:3012**

Login with:
- Email: `test@example.com`
- Password: `testpassword123`

---

## 📊 Port Configuration

| Service | Docker Port | Host Port | URL |
|---------|------------|-----------|-----|
| PostgreSQL | 5432 | **5433** | localhost:5433 |
| Redis | 6379 | **6380** | localhost:6380 |
| Backend API | - | **8000** | http://localhost:8000 |
| Frontend | - | **3012** | http://localhost:3012 |

---

## 🔧 Docker Management

### View Logs

```bash
# All services
docker-compose logs -f

# Just PostgreSQL
docker-compose logs -f postgres

# Just Redis
docker-compose logs -f redis
```

### Stop Services

```bash
# Stop (data is preserved)
docker-compose stop

# Start again
docker-compose start

# Restart
docker-compose restart
```

### Remove Everything

```bash
# Stop and remove containers (keeps data volumes)
docker-compose down

# Remove everything including data
docker-compose down -v
```

### Access Database Directly

```bash
# Connect to PostgreSQL
docker exec -it ai-code-platform-db psql -U aicode -d ai_code_platform

# Once inside, you can run SQL:
\dt          # List tables
\d users     # Describe users table
SELECT * FROM users;
\q           # Quit
```

### Access Redis Directly

```bash
# Connect to Redis
docker exec -it ai-code-platform-redis redis-cli

# Once inside:
PING         # Should return PONG
KEYS *       # List all keys
INFO         # Redis info
EXIT         # Quit
```

---

## 🔄 Restart Everything Fresh

If you want to start completely fresh:

```bash
cd /Volumes/ExtNVMe/ai_engineering_class1/ai_code_generation_platform/ai-code-platform

# Remove everything
docker-compose down -v

# Start fresh
./start-docker.sh
```

---

## 🐛 Troubleshooting

### Problem: Docker not running

**Solution:**
```bash
# Open Docker Desktop application
# Wait for it to start (you'll see the Docker icon in menu bar)
```

### Problem: Port 5433 already in use

**Solution:**
Edit `docker-compose.yml` and change the port mapping:
```yaml
ports:
  - "5434:5432"  # Use 5434 instead
```

Then update `backend/.env`:
```
DATABASE_URL=postgresql://aicode:aicode123@localhost:5434/ai_code_platform
```

### Problem: Cannot connect to database

**Solution:**
```bash
# Check if container is running
docker ps | grep postgres

# Check logs
docker-compose logs postgres

# Restart services
docker-compose restart
```

### Problem: Init database fails

**Solution:**
```bash
# Wait a bit longer for PostgreSQL to start
sleep 5

# Try again
cd backend
source venv/bin/activate
python init_db.py
```

---

## 📝 Database Credentials

```yaml
Database:  ai_code_platform
Username:  aicode
Password:  aicode123
Host:      localhost
Port:      5433
```

**Connection String:**
```
postgresql://aicode:aicode123@localhost:5433/ai_code_platform
```

---

## ✅ Advantages of Docker Setup

✅ **No conflicts** with existing PostgreSQL/Redis  
✅ **Easy cleanup** - just `docker-compose down -v`  
✅ **Consistent environment** across different machines  
✅ **Quick reset** - start fresh anytime  
✅ **Isolated data** - won't affect other projects  
✅ **Easy backup** - Docker volumes can be backed up  

---

## 🎯 Complete Startup Checklist

- [ ] Docker Desktop installed and running
- [ ] Run `./start-docker.sh`
- [ ] Wait for "✓ Docker Setup Complete!"
- [ ] Start backend in Terminal 1
- [ ] Start frontend in Terminal 2
- [ ] Open http://localhost:3012
- [ ] Login with test credentials
- [ ] ✨ Start using the platform!

---

## 🆘 Need Help?

**Check Docker status:**
```bash
docker ps
docker-compose ps
```

**View all logs:**
```bash
docker-compose logs -f
```

**Restart from scratch:**
```bash
docker-compose down -v
./start-docker.sh
```

---

**That's it! Your PostgreSQL and Redis are now running in Docker, completely isolated from any other services.** 🎉

