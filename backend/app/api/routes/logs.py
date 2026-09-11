from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import ActivityLog, User
from app.schemas.schemas import ActivityLogResponse
from app.api.dependencies import get_current_active_user

router = APIRouter(prefix="/api/logs", tags=["logs"])

@router.get("", response_model=List[ActivityLogResponse])
def get_activity_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    action: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view activity logs")

    query = db.query(ActivityLog)
    if action:
        query = query.filter(ActivityLog.action == action)
    logs = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs
