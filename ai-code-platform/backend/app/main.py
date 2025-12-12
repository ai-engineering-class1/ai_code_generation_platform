import sys
import asyncio

# Force ProactorEventLoopPolicy on Windows for subprocess support
# This must coincide with Uvicorn's import of the app
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import Base, engine

# Import all models to ensure relationships are properly configured
# This ensures SQLAlchemy can resolve string references in relationships
from app.models import user, project, task, integration, workflow, notification
from app.models.user import User  # Explicitly import User for Task relationship
from app.models.project import Project  # Explicitly import Project for Task relationship
from app.models.notification import TaskWorkflowHistory  # Explicitly import for relationship resolution
from app.models.workflow import Specification, CodeGeneration  # Explicitly import for relationship resolution

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
)

# Configure CORS - Allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3012",
        "http://localhost:3000",
        "http://127.0.0.1:3012",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Code Generation Platform API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

