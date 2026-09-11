from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# SQLite database file for pharmacy service
SQLALCHEMY_DATABASE_URL = "sqlite:///./pharmacy.db"

# Create engine with SQLite-specific settings
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Base class for ORM models
Base = declarative_base()


def get_db():
    """Dependency injection function for FastAPI endpoints to get database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
