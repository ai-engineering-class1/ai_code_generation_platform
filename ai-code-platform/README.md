# AI Code Generation Platform

An intelligent SaaS platform that automates software development by integrating Jira requirements with AI-powered code generation through GitHub Actions and Claude API.

## Project Structure

```
ai-code-platform/
├── frontend/          # Next.js frontend application
├── backend/           # Python FastAPI backend service
└── shared/            # Shared types and configurations
```

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **API Client**: Axios + React Query
- **Real-time**: Socket.IO Client

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database**: PostgreSQL + SQLAlchemy
- **Cache**: Redis
- **Task Queue**: Celery
- **WebSocket**: Socket.IO
- **Authentication**: JWT + OAuth2

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Redis 7+

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Features

- 🎯 Project Management Dashboard
- 🔗 Jira Integration & Sync
- 🐙 GitHub Repository Management
- 🤖 AI-Powered Code Generation (Claude)
- 📊 Real-time Progress Tracking
- 🔔 Multi-channel Notifications
- ✅ Automated CI/CD Pipeline
- 👥 Team Collaboration Tools

## Documentation

See [PROJECT_PLAN.md](../PROJECT_PLAN.md) for detailed project planning and architecture.

## License

MIT

