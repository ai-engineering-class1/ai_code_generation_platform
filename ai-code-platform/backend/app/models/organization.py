import uuid
import enum
from sqlalchemy import Column, String, ForeignKey, Enum
from sqlalchemy.orm import relationship, backref
from app.core.database import Base

class OrganizationType(str, enum.Enum):
    CORPORATION = "corporation"
    DEPARTMENT = "department"
    GROUP = "group"
    BOARD = "board"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    type = Column(Enum(OrganizationType), nullable=False)
    
    # Hierarchy
    parent_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    
    # Billing Hierarchy (defaults to parent_id if null, allows overriding)
    billing_parent_id = Column(String, ForeignKey("organizations.id"), nullable=True)

    # Relationships
    children = relationship("Organization", 
                          backref=backref("parent", remote_side=[id]),
                          foreign_keys=[parent_id])
    
    # For convenient access to members (though accessed mainly via UserRoleAssignment)
    role_assignments = relationship("UserRoleAssignment", back_populates="organization")

class UserRoleAssignment(Base):
    __tablename__ = "user_role_assignments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    role_id = Column(String, ForeignKey("roles.id"), nullable=False)
    
    # scope_id is NULL for Global Roles, or an Organization ID for scoped roles
    scope_org_id = Column(String, ForeignKey("organizations.id"), nullable=True, index=True)
    
    user = relationship("User", back_populates="role_assignments")
    role = relationship("Role")
    organization = relationship("Organization", back_populates="role_assignments")

class OrganizationPolicy(Base):
    """
    Defines cross-organization permissions.
    e.g. "Requests from Org A must be approved by Org B"
    """
    __tablename__ = "organization_policies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    requester_org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    approver_org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    
    # The action that requires approval/permission
    action_type = Column(String, nullable=False)  # e.g., "approve_requirements"
