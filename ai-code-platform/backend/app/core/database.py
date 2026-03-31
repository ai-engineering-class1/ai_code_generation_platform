from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings


def get_sync_database_url(url: str) -> str:
    """
    Convert async database URL to sync URL.
    asyncpg (async) -> psycopg (sync, uses psycopg3)
    """
    if "+asyncpg" in url:
        return url.replace("+asyncpg", "+psycopg")
    return url


# Use sync URL for the synchronous engine
sync_database_url = get_sync_database_url(settings.DATABASE_URL)

engine = create_engine(
    sync_database_url,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=settings.DATABASE_POOL_RECYCLE_SECONDS,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

