import uuid
import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, Integer, Enum
from sqlalchemy.orm import relationship, backref
from app.core.database import Base

class PermissionType(str, enum.Enum):
    MENU = "menu"
    BUTTON = "button"
    API = "api"

class Permission(Base):
    __tablename__ = "permissions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String, unique=True, nullable=False, index=True) # e.g. "sys:user:view"
    name = Column(String, nullable=False) # Human readable name
    description = Column(String, nullable=True)
    type = Column(Enum(PermissionType), default=PermissionType.MENU, nullable=False)
    
    # Hierarchy for UI Menus
    parent_id = Column(String, ForeignKey("permissions.id"), nullable=True)
    
    # UI Metadata
    path = Column(String, nullable=True) # e.g. "/users"
    icon = Column(String, nullable=True) # e.g. "users"
    sort_order = Column(Integer, default=0)
    
    # Recursion for fetching children
    children = relationship("Permission", 
                          backref=backref("parent", remote_side=[id]),
                          foreign_keys=[parent_id])

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False) # e.g. "System Admin"
    description = Column(String, nullable=True)
    is_system_role = Column(Boolean, default=False) # If true, protected/default role
    
    permissions = relationship("Permission", secondary="role_permissions")

class RolePermission(Base):
    __tablename__ = "role_permissions"
    
    role_id = Column(String, ForeignKey("roles.id"), primary_key=True)
    permission_id = Column(String, ForeignKey("permissions.id"), primary_key=True)
