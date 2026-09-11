from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Credential, Category, SharedAccess, User
from app.schemas.schemas import DashboardStatsResponse, CredentialResponse
from app.api.dependencies import get_current_active_user
from app.core.encryption import decrypt_data

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role.name == "admin":
        base_query = db.query(Credential)
    elif current_user.role.name == "team_member":
        if "view_credentials" in current_user.role.permissions:
            base_query = db.query(Credential)
        else:
            base_query = db.query(Credential).join(SharedAccess).filter(SharedAccess.shared_with_user_id == current_user.id)
    else:
        base_query = db.query(Credential).join(SharedAccess).filter(SharedAccess.shared_with_user_id == current_user.id)

    total_credentials = base_query.count()
    company_credentials = base_query.filter(Credential.client_id == None).count()
    client_credentials = base_query.filter(Credential.client_id != None).count()
    categories_count = db.query(Category).count()
    
    if current_user.role.name == "admin":
        shared_credentials = db.query(SharedAccess).count()
    else:
        shared_credentials = db.query(SharedAccess).filter(SharedAccess.shared_with_user_id == current_user.id).count()
        
    recent = base_query.order_by(Credential.updated_at.desc().nulls_last(), Credential.created_at.desc()).limit(5).all()
    
    recent_responses = []
    for c in recent:
        resp = CredentialResponse.model_validate(c)
        try:
            resp.data = decrypt_data(c.encrypted_data, c.encryption_iv)
        except Exception:
            resp.data = {"error": "decryption failed"}
        recent_responses.append(resp)

    return {
        "total_credentials": total_credentials,
        "company_credentials": company_credentials,
        "client_credentials": client_credentials,
        "categories": categories_count,
        "shared_credentials": shared_credentials,
        "recently_updated_credentials": recent_responses
    }
