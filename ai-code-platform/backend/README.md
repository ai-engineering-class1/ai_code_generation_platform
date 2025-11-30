# AI Code Generation Platform - Backend

FastAPI backend service for the AI Code Generation Platform.

## Features

- ✅ RESTful API with FastAPI
- ✅ JWT Authentication
- ✅ PostgreSQL Database with SQLAlchemy ORM
- ✅ Jira Integration
- ✅ GitHub Integration
- ✅ Claude AI Integration
- ✅ Background Tasks with Celery
- ✅ WebSocket Support
- ✅ API Documentation (Swagger/OpenAPI)

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/     # API endpoints
│   │       │   ├── auth.py
│   │       │   ├── projects.py
│   │       │   ├── tasks.py
│   │       │   ├── jira.py
│   │       │   └── github.py
│   │       └── api.py        # API router
│   ├── core/                 # Core functionality
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Database connection
│   │   └── security.py      # Authentication & security
│   ├── models/              # Database models
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── task.py
│   │   ├── integration.py
│   │   ├── workflow.py
│   │   └── notification.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── user.py
│   │   ├── project.py
│   │   └── integration.py
│   ├── services/            # Business logic services
│   │   ├── jira_service.py
│   │   ├── github_service.py
│   │   └── claude_service.py
│   └── main.py             # Application entry point
├── requirements.txt        # Python dependencies
├── requirements-dev.txt   # Development dependencies
├── .env.example          # Environment variables template
└── start.sh             # Startup script
```

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis 7+

### Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt  # For development
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up database:
```bash
# Create PostgreSQL database
createdb ai_code_platform

# Run migrations (if using Alembic)
# alembic upgrade head
```

### Running the Application

#### Development Mode

```bash
# Using the start script
chmod +x start.sh
./start.sh

# Or manually
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once the server is running, access the API documentation at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get token
- `GET /api/v1/auth/me` - Get current user

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/{id}` - Get project
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

### Tasks
- `GET /api/v1/projects/{id}/tasks` - List tasks
- `POST /api/v1/projects/{id}/tasks` - Create task
- `GET /api/v1/projects/tasks/{id}` - Get task
- `PUT /api/v1/projects/tasks/{id}` - Update task

### Jira Integration
- `POST /api/v1/jira/config` - Configure Jira
- `GET /api/v1/jira/config/{project_id}` - Get Jira config
- `POST /api/v1/jira/sync/{project_id}` - Sync Jira issues
- `POST /api/v1/jira/webhook` - Jira webhook endpoint

### GitHub Integration
- `POST /api/v1/github/config` - Configure GitHub
- `GET /api/v1/github/config/{project_id}` - Get GitHub config
- `POST /api/v1/github/generate-spec/{task_id}` - Generate specification
- `POST /api/v1/github/generate-code/{task_id}` - Trigger code generation
- `POST /api/v1/github/webhook` - GitHub webhook endpoint

## Testing

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

## Development

### Code Formatting

```bash
# Format code with black
black app/

# Sort imports
isort app/

# Lint with flake8
flake8 app/
```

### Type Checking

```bash
mypy app/
```

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key
- `ANTHROPIC_API_KEY` - Claude API key
- `JIRA_API_TOKEN` - Jira API token (optional)
- `GITHUB_TOKEN` - GitHub personal access token (optional)

## Deployment

### Docker

```bash
# Build image
docker build -t ai-code-platform-backend .

# Run container
docker run -p 8000:8000 --env-file .env ai-code-platform-backend
```

### Using Docker Compose

```bash
docker-compose up -d
```

## License

MIT

