from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str
    role_id: UUID

class UserResponse(UserBase):
    id: UUID
    role_id: UUID
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    permissions: List[str]

class RoleResponse(RoleBase):
    id: UUID
    class Config:
        from_attributes = True

class CredentialBase(BaseModel):
    title: str
    client_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    credential_type: str
    tags: Optional[str] = None

class CredentialCreate(CredentialBase):
    data: Dict[str, Any]

class CredentialUpdate(CredentialBase):
    data: Optional[Dict[str, Any]] = None

class CredentialResponse(CredentialBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    data: Optional[Dict[str, Any]] = None
    class Config:
        from_attributes = True

class ClientBase(BaseModel):
    name: str
    description: Optional[str] = None

class ClientResponse(ClientBase):
    id: UUID
    created_at: datetime
    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    is_default: bool = False

class CategoryResponse(CategoryBase):
    id: UUID
    created_at: datetime
    class Config:
        from_attributes = True

class ActivityLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    action: str
    credential_id: Optional[UUID] = None
    credential_title: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class DashboardStatsResponse(BaseModel):
    total_credentials: int
    company_credentials: int
    client_credentials: int
    categories: int
    shared_credentials: int
    recently_updated_credentials: List[CredentialResponse]
