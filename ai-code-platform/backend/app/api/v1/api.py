from fastapi import APIRouter
from app.api.v1.endpoints import auth, projects, tasks, jira, github, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(tasks.router, prefix="/projects", tags=["tasks"])
api_router.include_router(jira.router, prefix="/jira", tags=["jira"])
api_router.include_router(github.router, prefix="/github", tags=["github"])
api_router.include_router(notifications.router, tags=["notifications"])

