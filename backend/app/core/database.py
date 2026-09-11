import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Import all models so their tables are registered with Base.metadata,
# then create any missing tables (including the new credential_history table).
def init_db():
    from app.models.models import (  # noqa: F401
        Role, User, Client, Category, Credential,
        SharedAccess, ActivityLog, CredentialHistory
    )
    Base.metadata.create_all(bind=engine)
