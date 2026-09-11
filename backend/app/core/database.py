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

def init_db():
    from app.models.models import (
        Role, User, Client, Category, Credential,
        SharedAccess, ActivityLog, CredentialHistory
    )
    from app.core.security import get_password_hash
    Base.metadata.create_all(bind=engine)
    
    # Seed default admin if it doesn't exist
    db = SessionLocal()
    try:
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin", permissions={"all": True})
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
            
        admin_user = db.query(User).filter(User.email == os.getenv("ADMIN_EMAIL", "admin@passwordmanager.com")).first()
        if not admin_user:
            admin_user = User(
                email=os.getenv("ADMIN_EMAIL", "admin@passwordmanager.com"),
                hashed_password=get_password_hash(os.getenv("ADMIN_PASSWORD", "Admin@123!")),
                role_id=admin_role.id,
                name="System Admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()
