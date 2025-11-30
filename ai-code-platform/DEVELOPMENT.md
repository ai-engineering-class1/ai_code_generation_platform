# AI Code Generation Platform - Development Guide

## Overview

This guide provides comprehensive instructions for setting up and running the AI Code Generation Platform on your local development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** 14+
- **Redis** 7+
- **Git**

## Project Structure

```
ai-code-platform/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── core/     # Core configuration
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   └── services/ # Business logic services
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/         # Next.js frontend
    ├── src/
    │   ├── app/      # Next.js app router pages
    │   ├── components/ # Reusable components
    │   ├── lib/      # Utilities
    │   └── types/    # TypeScript types
    ├── package.json
    └── .env.example
```

## Backend Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Development dependencies
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure your settings:

```env
# Database
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/ai_code_platform

# Security - Generate a secure secret key
SECRET_KEY=your-super-secret-key-change-this

# API Keys
ANTHROPIC_API_KEY=your-claude-api-key
GITHUB_TOKEN=your-github-token
JIRA_API_TOKEN=your-jira-token

# Redis
REDIS_URL=redis://localhost:6379/0
```

### 4. Set Up Database

```bash
# Create database
createdb ai_code_platform

# Run migrations (create tables)
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 5. Start the Backend Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the start script
chmod +x start.sh
./start.sh
```

The API will be available at:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- OpenAPI JSON: http://localhost:8000/api/v1/openapi.json

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start the Development Server

```bash
npm run dev

# Or use the start script
chmod +x start.sh
./start.sh
```

The frontend will be available at: http://localhost:3000

## Database Setup

### PostgreSQL

1. **Install PostgreSQL**

```bash
# macOS (using Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql-14
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

2. **Create Database and User**

```sql
CREATE DATABASE ai_code_platform;
CREATE USER ai_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_code_platform TO ai_user;
```

### Redis

1. **Install Redis**

```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows
# Download from https://github.com/microsoftarchive/redis/releases
```

2. **Verify Redis is Running**

```bash
redis-cli ping
# Should return: PONG
```

## API Keys Setup

### 1. Anthropic Claude API

1. Sign up at https://www.anthropic.com
2. Navigate to API keys section
3. Create a new API key
4. Add to `.env`: `ANTHROPIC_API_KEY=your-key-here`

### 2. GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `workflow`, `admin:repo_hook`
4. Add to `.env`: `GITHUB_TOKEN=your-token-here`

### 3. Jira API Token

1. Log in to your Jira account
2. Go to Account Settings → Security → API tokens
3. Create API token
4. Add to `.env`: `JIRA_API_TOKEN=your-token-here`

## Development Workflow

### Running Both Services

You can run both backend and frontend simultaneously:

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Testing the Setup

1. **Backend Health Check**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status": "healthy"}
   ```

2. **Create a Test User**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "name": "Test User",
       "password": "testpassword123",
       "role": "developer"
     }'
   ```

3. **Login**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "testpassword123"
     }'
   ```

4. **Open Frontend**
   Navigate to http://localhost:3000 and register/login

## Common Issues and Solutions

### Issue: Database Connection Error

**Solution:**
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env`
- Ensure database exists: `psql -l`

### Issue: Redis Connection Error

**Solution:**
- Verify Redis is running: `redis-cli ping`
- Check REDIS_URL in `.env`

### Issue: Module Import Errors (Backend)

**Solution:**
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

### Issue: API Key Errors

**Solution:**
- Verify all API keys are properly set in `.env`
- Check for trailing spaces or newlines in `.env`
- Restart the backend after updating `.env`

### Issue: CORS Errors

**Solution:**
- Verify CORS_ORIGINS in backend `.env` includes frontend URL
- Default should be: `CORS_ORIGINS=["http://localhost:3000"]`

## Project Features

### Implemented Features

✅ User Authentication (Register, Login, JWT tokens)
✅ Project Management (CRUD operations)
✅ Task Management (Create, Update, Track)
✅ Jira Integration (Sync issues, Webhooks)
✅ GitHub Integration (Repository management, Webhooks)
✅ Claude AI Integration (Spec generation, Code generation)
✅ Real-time Progress Tracking
✅ Workflow Management
✅ Notification System

### In Progress

🔄 WebSocket real-time updates
🔄 Email notifications
🔄 Advanced analytics dashboard
🔄 CI/CD pipeline integration

## API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Next Steps

1. Configure Jira integration in project settings
2. Configure GitHub integration in project settings
3. Create your first project
4. Add tasks manually or sync from Jira
5. Generate specifications using Claude AI
6. Trigger code generation workflows

## Support

For issues or questions:
- Check the [PROJECT_PLAN.md](../PROJECT_PLAN.md) for detailed architecture
- Review API documentation at http://localhost:8000/docs
- Check backend logs for error details

## License

MIT

