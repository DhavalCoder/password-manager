from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.models import Client, User
from app.schemas.schemas import ClientBase, ClientResponse
from app.api.dependencies import get_current_active_user, RequireRole

router = APIRouter(prefix="/api/clients", tags=["clients"])

@router.get("", response_model=List[ClientResponse])
def get_clients(db: Session = Depends(get_db), current_user: User = Depends(RequireRole(["admin", "team_member"]))):
    return db.query(Client).all()

@router.post("", response_model=ClientResponse, status_code=201)
def create_client(
    client_in: ClientBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"]))
):
    existing = db.query(Client).filter(Client.name == client_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Client already exists")
    
    new_client = Client(name=client_in.name, description=client_in.description)
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

@router.delete("/{client_id}")
def delete_client(
    client_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"]))
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db.delete(client)
    db.commit()
    return {"message": "Client deleted successfully"}

@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: UUID,
    client_in: ClientBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole(["admin"]))
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    existing = db.query(Client).filter(Client.name == client_in.name, Client.id != client_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Client name already in use")
    client.name = client_in.name
    client.description = client_in.description
    db.commit()
    db.refresh(client)
    return client
