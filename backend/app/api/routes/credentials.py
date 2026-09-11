from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.models.models import Credential, User, ActivityLog, SharedAccess, CredentialHistory
from app.schemas.schemas import CredentialCreate, CredentialUpdate, CredentialResponse
from app.api.dependencies import get_current_active_user, RequirePermission
from app.core.encryption import encrypt_data, decrypt_data


router = APIRouter(prefix="/api/credentials", tags=["credentials"])

def log_activity(db: Session, user_id: UUID, action: str, cred_id: UUID, cred_title: str):
    log = ActivityLog(user_id=user_id, action=action, credential_id=cred_id, credential_title=cred_title)
    db.add(log)

@router.post("", response_model=CredentialResponse, status_code=201)
def create_credential(
    cred_in: CredentialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if "edit_credentials" not in current_user.role.permissions and "manage_company_credentials" not in current_user.role.permissions:
        raise HTTPException(status_code=403, detail="You do not have the required permission")
    
    enc_data_b64, iv_b64 = encrypt_data(cred_in.data)
    
    new_cred = Credential(
        title=cred_in.title,
        client_id=cred_in.client_id,
        category_id=cred_in.category_id,
        credential_type=cred_in.credential_type,
        tags=cred_in.tags,
        encrypted_data=enc_data_b64,
        encryption_iv=iv_b64,
        created_by=current_user.id
    )
    db.add(new_cred)
    db.commit()
    db.refresh(new_cred)
    
    log_activity(db, current_user.id, "credential_created", new_cred.id, new_cred.title)
    db.commit()
    
    # Decrypt to return
    response = CredentialResponse.model_validate(new_cred)
    response.data = cred_in.data
    return response

@router.get("", response_model=List[CredentialResponse])
def get_credentials(
    search: Optional[str] = None,
    client_id: Optional[UUID] = None,
    category_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Base query for what the user can see
    if current_user.role.name == "admin":
        query = db.query(Credential)
    elif current_user.role.name == "team_member":
        if "view_credentials" in current_user.role.permissions:
            query = db.query(Credential)
        else:
            # Fallback to only shared
            query = db.query(Credential).join(SharedAccess).filter(
                SharedAccess.shared_with_user_id == current_user.id,
                or_(SharedAccess.expires_at == None, SharedAccess.expires_at > func.now())
            )
    else:
        # Client role
        query = db.query(Credential).join(SharedAccess).filter(
            SharedAccess.shared_with_user_id == current_user.id,
            or_(SharedAccess.expires_at == None, SharedAccess.expires_at > func.now())
        )

    if client_id:
        query = query.filter(Credential.client_id == client_id)
    if category_id:
        query = query.filter(Credential.category_id == category_id)

    creds = query.all()
    results = []
    for c in creds:
        resp = CredentialResponse.model_validate(c)
        try:
            resp.data = decrypt_data(c.encrypted_data, c.encryption_iv)
        except Exception:
            resp.data = {"error": "decryption failed"}
            
        if search:
            search_lower = search.lower()
            title_match = c.title and search_lower in c.title.lower()
            tags_match = c.tags and search_lower in c.tags.lower()
            data_match = False
            if isinstance(resp.data, dict):
                data_str = " ".join(str(v) for v in resp.data.values()).lower()
                if search_lower in data_str:
                    data_match = True
                    
            if not (title_match or tags_match or data_match):
                continue
            
        results.append(resp)
        
    return results
# Export: GET /api/credentials/export
# ---------------------------------------------------------------------------

@router.get("/export")
def export_credentials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return a JSON array of all decrypted credentials visible to the current user."""
    if current_user.role.name == "admin":
        creds = db.query(Credential).all()
    elif current_user.role.name == "team_member" and "view_credentials" in current_user.role.permissions:
        creds = db.query(Credential).all()
    else:
        # Only credentials explicitly shared with this user
        shared_ids = (
            db.query(SharedAccess.credential_id)
            .filter(
                SharedAccess.shared_with_user_id == current_user.id,
                or_(SharedAccess.expires_at == None, SharedAccess.expires_at > func.now()),
            )
            .subquery()
        )
        creds = db.query(Credential).filter(Credential.id.in_(shared_ids)).all()

    result = []
    for c in creds:
        try:
            data = decrypt_data(c.encrypted_data, c.encryption_iv)
        except Exception:
            data = {}
        result.append(
            {
                "title": c.title,
                "credential_type": c.credential_type,
                "tags": c.tags,
                "client_id": str(c.client_id) if c.client_id else None,
                "category_id": str(c.category_id) if c.category_id else None,
                "data": data,
            }
        )

    log_activity(db, current_user.id, "credentials_exported", None, f"{len(result)} credentials")
    db.commit()
    return result


# ---------------------------------------------------------------------------
# Import: POST /api/credentials/import
# ---------------------------------------------------------------------------

from pydantic import BaseModel as _BaseModel  # local alias to avoid polluting namespace

class ImportBody(_BaseModel):
    credentials: List[CredentialCreate]

@router.post("/import")
def import_credentials(
    body: ImportBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Bulk-import credentials. Returns the count of successfully created records."""
    if "edit_credentials" not in current_user.role.permissions and "manage_company_credentials" not in current_user.role.permissions:
        raise HTTPException(status_code=403, detail="You do not have the required permission")

    imported = 0
    for cred_in in body.credentials:
        try:
            enc_data_b64, iv_b64 = encrypt_data(cred_in.data)
            new_cred = Credential(
                title=cred_in.title,
                client_id=cred_in.client_id,
                category_id=cred_in.category_id,
                credential_type=cred_in.credential_type,
                tags=cred_in.tags,
                encrypted_data=enc_data_b64,
                encryption_iv=iv_b64,
                created_by=current_user.id,
            )
            db.add(new_cred)
            db.flush()  # get the new ID before logging
            log_activity(db, current_user.id, "credential_imported", new_cred.id, new_cred.title)
            imported += 1
        except Exception:
            db.rollback()
            continue

    db.commit()
    return {"imported": imported}


# ---------------------------------------------------------------------------

@router.get("/{cred_id}", response_model=CredentialResponse)
def get_credential(
    cred_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    c = db.query(Credential).filter(Credential.id == cred_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    # Check access here...
    if current_user.role.name != "admin":
        if current_user.role.name == "team_member" and "view_credentials" in current_user.role.permissions:
            pass
        else:
            shared = db.query(SharedAccess).filter(
                SharedAccess.credential_id == cred_id, 
                SharedAccess.shared_with_user_id == current_user.id,
                or_(SharedAccess.expires_at == None, SharedAccess.expires_at > func.now())
            ).first()
            if not shared:
                raise HTTPException(status_code=403, detail="Not authorized to access this credential or access expired")
    
    resp = CredentialResponse.model_validate(c)
    resp.data = decrypt_data(c.encrypted_data, c.encryption_iv)
    return resp

@router.put("/{cred_id}", response_model=CredentialResponse)
def update_credential(
    cred_id: UUID,
    cred_in: CredentialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    c = db.query(Credential).filter(Credential.id == cred_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    if "edit_credentials" not in current_user.role.permissions and "manage_company_credentials" not in current_user.role.permissions:
        raise HTTPException(status_code=403, detail="You do not have the required permission")

    # Enforce view_only share access level
    if current_user.role.name != "admin":
        shared = db.query(SharedAccess).filter(
            SharedAccess.credential_id == cred_id,
            SharedAccess.shared_with_user_id == current_user.id
        ).first()
        if shared and shared.access_level == "view_only":
            raise HTTPException(status_code=403, detail="You only have view access to this credential")

    # --- Save the OLD data into history BEFORE overwriting ---
    history_entry = CredentialHistory(
        credential_id=c.id,
        changed_by=current_user.id,
        encrypted_data=c.encrypted_data,
        encryption_iv=c.encryption_iv,
    )
    db.add(history_entry)

    c.title = cred_in.title
    c.client_id = cred_in.client_id
    c.category_id = cred_in.category_id
    c.credential_type = cred_in.credential_type
    c.tags = cred_in.tags

    if cred_in.data is not None:
        enc_data_b64, iv_b64 = encrypt_data(cred_in.data)
        c.encrypted_data = enc_data_b64
        c.encryption_iv = iv_b64

    db.commit()
    db.refresh(c)
    
    log_activity(db, current_user.id, "credential_updated", c.id, c.title)
    db.commit()

    resp = CredentialResponse.model_validate(c)
    resp.data = decrypt_data(c.encrypted_data, c.encryption_iv)
    return resp


@router.delete("/{cred_id}")
def delete_credential(
    cred_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    c = db.query(Credential).filter(Credential.id == cred_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Credential not found")

    if "edit_credentials" not in current_user.role.permissions and "manage_company_credentials" not in current_user.role.permissions:
        raise HTTPException(status_code=403, detail="You do not have the required permission")

    # Enforce view_only share access level
    if current_user.role.name != "admin":
        shared = db.query(SharedAccess).filter(
            SharedAccess.credential_id == cred_id,
            SharedAccess.shared_with_user_id == current_user.id
        ).first()
        if shared and shared.access_level == "view_only":
            raise HTTPException(status_code=403, detail="You only have view access to this credential")

    title = c.title
    db.delete(c)
    db.commit()

    log_activity(db, current_user.id, "credential_deleted", cred_id, title)
    db.commit()
    return {"detail": "Credential deleted successfully"}


# ---------------------------------------------------------------------------
# History: GET /api/credentials/{cred_id}/history  (admin only)
# ---------------------------------------------------------------------------

@router.get("/{cred_id}/history")
def get_credential_history(
    cred_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return all historical versions of a credential (admin only)."""
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    c = db.query(Credential).filter(Credential.id == cred_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Credential not found")

    history = (
        db.query(CredentialHistory)
        .filter(CredentialHistory.credential_id == cred_id)
        .order_by(CredentialHistory.changed_at.desc())
        .all()
    )

    result = []
    for h in history:
        # Resolve the editor's email
        changed_by_email = None
        if h.changed_by:
            editor = db.query(User).filter(User.id == h.changed_by).first()
            if editor:
                changed_by_email = editor.email

        try:
            data = decrypt_data(h.encrypted_data, h.encryption_iv)
        except Exception:
            data = {"error": "decryption failed"}

        result.append(
            {
                "id": str(h.id),
                "changed_at": h.changed_at,
                "changed_by": changed_by_email,
                "data": data,
            }
        )

    return result
