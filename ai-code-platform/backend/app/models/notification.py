from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Boolean, Enum, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class NotificationType(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    APPROVAL_REQUIRED = "approval_required"


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"))
    task_id = Column(String, ForeignKey("tasks.id"))
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text)
    read = Column(Boolean, default=False)
    action_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Severity 1=info/success, 2=warning, 3=error, 4=critical (routing + email policy)
    severity = Column(Integer, nullable=False, server_default="1")
    event_code = Column(String(100), nullable=True, index=True)
    email_sent = Column(Boolean, nullable=False, server_default="false")
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    project = relationship("Project", back_populates="notifications")




class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    project_id = Column(String, ForeignKey("projects.id"))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(String)
    old_value = Column(JSON)
    new_value = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

