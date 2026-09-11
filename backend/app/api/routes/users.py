from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.models import User, Role
from app.schemas.schemas import UserCreate, UserResponse, RoleResponse
from app.api.dependencies import RequireRole, get_current_active_user
from app.core.security import get_password_hash

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/roles", response_model=List[RoleResponse])
def get_roles(db: Session = Depends(get_db), current_user: User = Depends(RequireRole(["admin"]))):
    return db.query(Role).all()

@router.get("", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(RequireRole(["admin"]))):
    return db.query(User).all()

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.post("", response_model=UserResponse, status_code=201)
def create_user(user_in: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(RequireRole(["admin"]))):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    role = db.query(Role).filter(Role.id == user_in.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    new_user = User(
        email=user_in.email,
        name=user_in.name,
        password_hash=get_password_hash(user_in.password),
        role_id=user_in.role_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.delete("/{user_id}")
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"]))
):
    # Prevent self-deletion
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

from pydantic import BaseModel
from typing import Optional, List
from app.models.models import SharedAccess, Credential, ActivityLog

class BulkShareRequest(BaseModel):
    category_id: Optional[UUID] = None
    share_all: bool = False
    access_level: str = "view_only"

@router.post("/{user_id}/bulk-share")
def bulk_share_credentials(
    user_id: UUID,
    req: BulkShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"]))
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    query = db.query(Credential)
    if not req.share_all:
        if req.category_id:
            query = query.filter(Credential.category_id == req.category_id)
        else:
            raise HTTPException(status_code=400, detail="Must provide category_id or share_all=True")
            
    credentials_to_share = query.all()
    count = 0
    
    for cred in credentials_to_share:
        # Check if already shared
        existing = db.query(SharedAccess).filter(
            SharedAccess.credential_id == cred.id,
            SharedAccess.shared_with_user_id == user_id
        ).first()
        
        if not existing:
            shared = SharedAccess(
                credential_id=cred.id,
                shared_with_user_id=target_user.id,
                access_level=req.access_level
            )
            db.add(shared)
            
            # Log
            log = ActivityLog(user_id=current_user.id, action="credential_shared", credential_id=cred.id, credential_title=cred.title)
            db.add(log)
            count += 1
            
    db.commit()
    return {"message": f"Successfully shared {count} credentials with {target_user.email}"}

class ResetPasswordRequest(BaseModel):
    new_password: str

@router.put("/{user_id}/reset-password")
def reset_password(
    user_id: UUID,
    req: ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"]))
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    target_user.password_hash = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password reset successfully"}

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role_id: Optional[UUID] = None
    is_active: Optional[bool] = None

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"]))
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.name is not None:
        target_user.name = user_in.name
    if user_in.email is not None:
        existing = db.query(User).filter(User.email == user_in.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        target_user.email = user_in.email
    if user_in.role_id is not None:
        role = db.query(Role).filter(Role.id == user_in.role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        target_user.role_id = user_in.role_id
    if user_in.is_active is not None:
        target_user.is_active = user_in.is_active

    db.commit()
    db.refresh(target_user)
    return target_user
