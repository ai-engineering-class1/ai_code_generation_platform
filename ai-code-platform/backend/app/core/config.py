from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI Code Generation Platform"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    
    # Terminal / web shell
    TERMINAL_GUARD_ENABLED: bool = True

    API_V1_PREFIX: str = "/api/v1"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    RBAC_CACHE_TTL_SECONDS: int = 600 # 10 minutes default configurable TTL
    
    # Jira
    JIRA_API_URL: str = ""
    JIRA_API_TOKEN: str = ""
    
    # GitHub
    GITHUB_API_URL: str = "https://api.github.com"
    GITHUB_TOKEN: str = ""
    
    # Claude/Anthropic
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    # Claude Code CLI
    ANTHROPIC_AUTH_TOKEN: str = ""
    ANTHROPIC_BASE_URL: str = ""
    API_TIMEOUT_MS: int = 600000
    CLAUDE_EXECUTABLE_PATH: str = "claude"
    
    # Claude Web API (Remote Agent)
    CLAUDE_WEB_API_URL: str = "http://103.98.213.149:8520"
    CLAUDE_WEB_API_TOKEN: str = "sk-placeholder"
    REMOTE_AGENT_TIMEOUT_SEC: int = 600
    CODEGEN_API_URL: str = "http://103.98.213.149:8510"
    
    # Terminal
    TERMINAL_SAFE_MODE: bool = True
    WORKSPACE_ROOT: str = "./temp"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3012", "http://localhost:3000", "http://127.0.0.1:3012"]
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
