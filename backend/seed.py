import os
import asyncio
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import Role, Category, User
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed():
    db = SessionLocal()
    
    # 1. Seed Roles
    roles = [
        {"name": "admin", "permissions": ["manage_users", "manage_company_credentials", "manage_client_credentials", "share_credentials", "view_activity", "edit_credentials"]},
        {"name": "team_member", "permissions": ["view_credentials", "edit_credentials", "share_credentials"]},
        {"name": "client", "permissions": ["view_shared_credentials"]}
    ]
    
    role_objs = {}
    for r in roles:
        role = db.query(Role).filter(Role.name == r["name"]).first()
        if not role:
            role = Role(name=r["name"], permissions=r["permissions"])
            db.add(role)
            db.commit()
            db.refresh(role)
        role_objs[r["name"]] = role
    
    # 2. Seed Admin User
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    
    if admin_email and admin_password:
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            hashed_pw = pwd_context.hash(admin_password)
            admin = User(
                email=admin_email,
                name="System Admin",
                password_hash=hashed_pw,
                role_id=role_objs["admin"].id
            )
            db.add(admin)
            db.commit()

    # 3. Seed Default Categories
    categories = [
        "Website", "Hosting", "Domain", "Email", "Database", 
        "Cloud", "Server", "API", "Social Media", "Payment Gateway", "Other"
    ]
    
    for c in categories:
        cat = db.query(Category).filter(Category.name == c).first()
        if not cat:
            cat = Category(name=c, is_default=True)
            db.add(cat)
    db.commit()
    
    db.close()
    print("Database seeded successfully.")

if __name__ == "__main__":
    seed()
