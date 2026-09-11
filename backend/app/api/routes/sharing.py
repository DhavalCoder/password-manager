from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.models.models import SharedAccess, Credential, User, ActivityLog
from app.api.dependencies import get_current_active_user

router = APIRouter(prefix="/api/credentials", tags=["sharing"])

class ShareRequest(BaseModel):
    email: str
    access_level: str = "view_only"
    expires_at: Optional[datetime] = None

def log_activity(db: Session, user_id: UUID, action: str, cred_id: UUID, cred_title: str):
    log = ActivityLog(user_id=user_id, action=action, credential_id=cred_id, credential_title=cred_title)
    db.add(log)

@router.post("/{cred_id}/share")
def share_credential(
    cred_id: UUID,
    req: ShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cred = db.query(Credential).filter(Credential.id == cred_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")

    if "share_credentials" not in current_user.role.permissions and current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to share credentials")
        
    target_user = db.query(User).filter(User.email == req.email).first()
    
    shared = SharedAccess(
        credential_id=cred_id,
        shared_with_user_id=target_user.id if target_user else None,
        shared_by_email=req.email if not target_user else None,
        access_level=req.access_level,
        expires_at=req.expires_at
    )
    db.add(shared)
    
    log_activity(db, current_user.id, "credential_shared", cred_id, cred.title)
    db.commit()
    return {"message": "Shared successfully"}

@router.get("/{cred_id}/shares")
def get_shares(
    cred_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cred = db.query(Credential).filter(Credential.id == cred_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    if "share_credentials" not in current_user.role.permissions and current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to view shares")
        
    shares = db.query(SharedAccess).filter(SharedAccess.credential_id == cred_id).all()
    
    result = []
    for s in shares:
        email = s.shared_by_email
        if s.shared_with_user_id:
            u = db.query(User).filter(User.id == s.shared_with_user_id).first()
            if u:
                email = u.email
        result.append({
            "id": s.id,
            "email": email,
            "access_level": s.access_level,
            "expires_at": s.expires_at,
            "created_at": s.created_at
        })
    return result

@router.delete("/{cred_id}/share/{share_id}")
def revoke_share(
    cred_id: UUID,
    share_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cred = db.query(Credential).filter(Credential.id == cred_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    if "share_credentials" not in current_user.role.permissions and current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to revoke credentials")

    shared = db.query(SharedAccess).filter(SharedAccess.id == share_id, SharedAccess.credential_id == cred_id).first()
    if not shared:
        raise HTTPException(status_code=404, detail="Share record not found")

    db.delete(shared)
    
    log_activity(db, current_user.id, "shared_access_revoked", cred_id, cred.title)
    db.commit()
    return {"message": "Shared access revoked successfully"}
