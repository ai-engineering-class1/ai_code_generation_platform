# Quick Start Guide - Testing Setup

This guide will help you set up the platform for testing in the fastest way possible.

## Prerequisites Check

Before starting, make sure you have:
- [ ] Python 3.11+ installed (`python3 --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 14+ installed and running
- [ ] Redis installed and running

## Quick Setup (5 minutes)

### 1. Backend Setup

```bash
cd backend

# Run the automated setup script
chmod +x setup.sh
./setup.sh

# Or manual setup:
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

Create `backend/.env` file:

```bash
# Minimum required configuration for testing
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_code_platform
SECRET_KEY=test-secret-key-change-in-production-$(openssl rand -hex 32)
ANTHROPIC_API_KEY=your-claude-api-key-here
GITHUB_TOKEN=your-github-token-here
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=["http://localhost:3000"]
DEBUG=True
```

**Note:** You can test basic features without API keys, but you'll need them for:
- `ANTHROPIC_API_KEY` - For AI spec/code generation
- `GITHUB_TOKEN` - For GitHub integration features
- `JIRA_API_TOKEN` - For Jira integration (optional)

### 3. Initialize Database

```bash
cd backend
source venv/bin/activate

# Create database
createdb ai_code_platform

# Initialize tables and create test data
python init_db.py
```

This will create:
- Database tables
- Test user (email: test@example.com, password: testpassword123)
- Sample project with tasks

### 4. Start Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Backend will run at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 5. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Run the automated setup script
chmod +x setup.sh
./setup.sh

# Or manual setup:
npm install
```

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 6. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run at: http://localhost:3000

## Test the Platform

### 1. Login
- Go to http://localhost:3000
- Login with:
  - Email: `test@example.com`
  - Password: `testpassword123`

### 2. Explore the Dashboard
- View the test project "AI Code Platform Demo"
- Check the 4 sample tasks with different statuses

### 3. Test Core Features

#### Create a New Project
1. Click "New Project" on dashboard
2. Fill in project details
3. Save and view project page

#### Create a Task
1. Open a project
2. Click "New Task"
3. Fill in task details (title, description, type, priority)
4. Create task

#### Configure Integrations (Optional - requires API keys)
1. Go to Project → Settings
2. Configure Jira integration
3. Configure GitHub integration
4. Test sync functionality

#### Generate Specification (requires ANTHROPIC_API_KEY)
1. Open a task
2. Click "Generate Specification"
3. Review generated spec
4. Approve specification

#### Trigger Code Generation (requires ANTHROPIC_API_KEY and GITHUB_TOKEN)
1. After spec is approved
2. Click "Generate Code"
3. Monitor progress

## Troubleshooting

### Database Connection Error
```bash
# Make sure PostgreSQL is running
pg_isready

# Check if database exists
psql -l | grep ai_code_platform

# Create database if missing
createdb ai_code_platform
```

### Redis Connection Error
```bash
# Check if Redis is running
redis-cli ping  # Should return PONG

# Start Redis
redis-server
```

### Port Already in Use
```bash
# Backend (port 8000)
lsof -ti:8000 | xargs kill -9

# Frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

### Module Import Errors
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend Build Errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## API Testing with curl

### Register a new user
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "password": "password123",
    "role": "developer"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### List Projects (use token from login)
```bash
curl -X GET http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## What to Test

### Basic Features (No API keys needed)
- ✅ User registration and login
- ✅ Project creation and management
- ✅ Task creation and management
- ✅ Project settings page
- ✅ Task status updates
- ✅ Dashboard statistics

### Integration Features (API keys required)
- ✅ Jira issue sync (needs JIRA_API_TOKEN)
- ✅ GitHub repository connection (needs GITHUB_TOKEN)
- ✅ AI specification generation (needs ANTHROPIC_API_KEY)
- ✅ AI code generation (needs ANTHROPIC_API_KEY + GITHUB_TOKEN)
- ✅ Webhook handling

## Testing Checklist

- [ ] Backend running at http://localhost:8000
- [ ] Frontend running at http://localhost:3000
- [ ] Can login with test credentials
- [ ] Can view dashboard with test project
- [ ] Can create new project
- [ ] Can create new task
- [ ] Can view task details
- [ ] Can update task status
- [ ] Can access project settings
- [ ] API documentation accessible at /docs

## Next Steps

Once testing is complete:
1. Review the API documentation at http://localhost:8000/docs
2. Check the IMPLEMENTATION_SUMMARY.md for all features
3. See DEVELOPMENT.md for detailed development info
4. Configure real API keys for full functionality

## Getting Help

- Check logs in terminal for errors
- Review API responses in browser DevTools
- Check PostgreSQL and Redis are running
- Verify environment variables in .env files
- Review backend logs for detailed error messages

## Stop the Services

```bash
# Stop backend: Ctrl+C in backend terminal
# Stop frontend: Ctrl+C in frontend terminal

# Stop Redis (if started manually)
redis-cli shutdown

# Stop PostgreSQL (if needed)
brew services stop postgresql  # macOS
sudo systemctl stop postgresql  # Linux
```

