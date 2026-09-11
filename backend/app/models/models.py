import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.types import Uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Role(Base):
    __tablename__ = "roles"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True)
    permissions = Column(JSON, default=list)

class User(Base):
    __tablename__ = "users"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    password_hash = Column(String)
    role_id = Column(Uuid(as_uuid=True), ForeignKey("roles.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    role = relationship("Role")

class Client(Base):
    __tablename__ = "clients"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Category(Base):
    __tablename__ = "categories"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Credential(Base):
    __tablename__ = "credentials"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, index=True)
    client_id = Column(Uuid(as_uuid=True), ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(Uuid(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    credential_type = Column(String, default="standard")
    encrypted_data = Column(Text)
    encryption_iv = Column(String)
    tags = Column(String, nullable=True)
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("Client")
    category = relationship("Category")
    creator = relationship("User")

class SharedAccess(Base):
    __tablename__ = "shared_access"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    credential_id = Column(Uuid(as_uuid=True), ForeignKey("credentials.id"))
    shared_with_user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    shared_by_email = Column(String, nullable=True)
    access_level = Column(String, default="view_only")
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    credential = relationship("Credential")
    shared_with_user = relationship("User")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"))
    action = Column(String)
    credential_id = Column(Uuid(as_uuid=True), ForeignKey("credentials.id"), nullable=True)
    credential_title = Column(String, nullable=True)
    metadata_info = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    credential = relationship("Credential")

class CredentialHistory(Base):
    __tablename__ = 'credential_history'
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    credential_id = Column(Uuid(as_uuid=True), ForeignKey('credentials.id', ondelete='CASCADE'))
    changed_by = Column(Uuid(as_uuid=True), ForeignKey('users.id'))
    encrypted_data = Column(Text)
    encryption_iv = Column(String)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    credential = relationship("Credential")
    changed_by_user = relationship("User", foreign_keys=[changed_by])
