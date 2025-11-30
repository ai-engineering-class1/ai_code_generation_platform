# 🚀 QUICK START GUIDE - AI Code Generation Platform

## ✅ Current Setup Status

✅ Backend dependencies installed  
✅ Frontend dependencies installed  
✅ Configuration files created  
✅ **Frontend configured to run on port 3012**
✅ **Backend configured to run on port 8082**
⚠️ Need to configure PostgreSQL  

---

## 📋 Step-by-Step Instructions

### Step 1: Start PostgreSQL

First, check if PostgreSQL is running:
```bash
psql --version
```

If PostgreSQL is not running, start it:
```bash
# macOS (using Homebrew)
brew services start postgresql

# Or check if it's already running
ps aux | grep postgres
```

### Step 2: Configure Database Connection

We need to update the database URL with the correct credentials.

**Find your PostgreSQL username:**
```bash
whoami
```

**Edit the backend .env file:**
```bash
cd /Volumes/ExtNVMe/ai_engineering_class1/ai_code_generation_platform/ai-code-platform/backend
nano .env
```

**Update the DATABASE_URL line to match one of these:**

Option 1 - If using your macOS user (most common):
```
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/ai_code_platform
```

Option 2 - If using postgres user without password:
```
DATABASE_URL=postgresql://postgres@localhost:5432/ai_code_platform
```

Option 3 - If you set a password for postgres:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_code_platform
```

Replace `YOUR_USERNAME` with your actual macOS username (from `whoami` command).

### Step 3: Create Database

Create the database using your PostgreSQL credentials:

```bash
# Try with your macOS user
createdb ai_code_platform

# OR if that doesn't work, try:
psql postgres -c "CREATE DATABASE ai_code_platform;"
```

### Step 4: Initialize Database with Test Data

```bash
cd /Volumes/ExtNVMe/ai_engineering_class1/ai_code_generation_platform/ai-code-platform/backend
source venv/bin/activate
python init_db.py
```

This will create:
- All database tables
- A test user (test@example.com / testpassword123)
- A sample project with 4 tasks

---

## 🎮 START THE SERVERS

### 🔧 Terminal 1 - Start Backend (Port 8082)

```bash
cd /Volumes/ExtNVMe/ai_engineering_class1/ai_code_generation_platform/ai-code-platform/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8082
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8082 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

✅ Backend is now running at: **http://localhost:8082**  
✅ API Docs at: **http://localhost:8082/docs**

---

### 🎨 Terminal 2 - Start Frontend (Port 3012)

Open a **NEW terminal window** and run:

```bash
cd /Volumes/ExtNVMe/ai_engineering_class1/ai_code_generation_platform/ai-code-platform/frontend
npm run dev
```

**Or use the start script:**
```bash
cd /Volumes/ExtNVMe/ai_engineering_class1/ai_code_generation_platform/ai-code-platform/frontend
./start.sh
```

**You should see:**
```
- Local:        http://localhost:3012
- Network:      http://192.168.x.x:3012
```

✅ Frontend is now running at: **http://localhost:3012**

---

## 🌐 ACCESS THE APPLICATION

1. Open your browser and go to: **http://localhost:3012**

2. **Login with test credentials:**
   - Email: `test@example.com`
   - Password: `testpassword123`

3. **Explore the platform:**
   - View the demo project "AI Code Platform Demo"
   - See 4 sample tasks with different statuses
   - Try creating a new project
   - Try creating a new task

---

## 🔧 Troubleshooting

### Problem: PostgreSQL Connection Error

**Solution 1 - Check PostgreSQL Status:**
```bash
psql --version
ps aux | grep postgres
```

**Solution 2 - Start PostgreSQL:**
```bash
brew services start postgresql
```

**Solution 3 - Test Connection:**
```bash
psql -l
```
This should list all databases. If it asks for a password and you don't know it, you might need to reset it.

**Solution 4 - Find Correct DATABASE_URL:**
```bash
# Try connecting without password
psql -d postgres

# If that works, your DATABASE_URL should be:
# DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/ai_code_platform
```

### Problem: Port 8082 Already in Use

```bash
# Kill process on port 8082
lsof -ti:8082 | xargs kill -9

# Then restart the backend
```

### Problem: Port 3012 Already in Use

```bash
# Kill process on port 3012
lsof -ti:3012 | xargs kill -9

# Then restart the frontend
```

### Problem: Redis Not Running

```bash
# Check Redis
redis-cli ping

# If not running, start it
redis-server
```

### Problem: CORS Error

If you see CORS errors in the browser console, verify that the backend `.env` file has:
```
CORS_ORIGINS=["http://localhost:3012"]
```

---

## 📊 What You Get

After logging in, you'll see:

**Demo Project: "AI Code Platform Demo"**
- Task 1: "Implement User Authentication API" (✅ Completed)
- Task 2: "Build Dashboard UI" (🔄 In Progress)
- Task 3: "Fix Authentication Bug" (⏳ Pending - Critical)
- Task 4: "AI Code Review Agent" (📝 New)

**Features to Test:**
- ✅ Create new projects
- ✅ Create new tasks
- ✅ View task details
- ✅ Update task status
- ✅ View project settings
- ✅ Dashboard statistics

---

## 🎯 Quick Test Commands

**Test Backend Health:**
```bash
curl http://localhost:8082/health
# Should return: {"status":"healthy"}
```

**Test API Documentation:**
Open in browser: http://localhost:8082/docs

**Create Test User (if needed):**
```bash
curl -X POST http://localhost:8082/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "password": "password123",
    "role": "developer"
  }'
```

---

## 📝 Summary of URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3012 |
| **Backend API** | http://localhost:8082 |
| **API Docs** | http://localhost:8082/docs |
| **Health Check** | http://localhost:8082/health |

---

## ⚡ Quick Commands Reference

**Start Backend:**
```bash
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8082
```

**Start Frontend:**
```bash
cd frontend && npm run dev
```

**Stop Servers:**
- Press `Ctrl+C` in each terminal

---

## 🆘 Still Having Issues?

1. **Check the logs** in your terminal windows for detailed error messages
2. **Verify PostgreSQL is running:** `ps aux | grep postgres`
3. **Verify Redis is running:** `redis-cli ping`
4. **Check .env file** in backend directory has correct DATABASE_URL
5. **Check backend .env has:** `CORS_ORIGINS=["http://localhost:3012"]`
6. **Try restarting** PostgreSQL: `brew services restart postgresql`

---

## 🎉 Next Steps After Successful Login

1. Create your own project
2. Add tasks to your project
3. Explore project settings
4. Try the integration features (requires API keys)

**For full AI features**, add these to `backend/.env`:
- `ANTHROPIC_API_KEY` - For AI spec/code generation
- `GITHUB_TOKEN` - For GitHub integration
- `JIRA_API_TOKEN` - For Jira integration (optional)

---

**Good luck! 🚀**

If you see the login page at http://localhost:3012, you're all set!
