import uuid
from sqlalchemy import Column, String, Boolean
from app.core.database import Base

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # The "Topic" or Source of the event
    # e.g. source_type="workflow", source_id="123"
    # e.g. source_type="project", source_id="abc"
    source_type = Column(String, nullable=False, index=True) 
    source_id = Column(String, nullable=False, index=True)
    
    # The Recipient
    # recipient_type="user" or "group" (Organization)
    recipient_type = Column(String, nullable=False) 
    recipient_id = Column(String, nullable=False, index=True)
    
    # Configuration
    is_mandatory = Column(Boolean, default=False) # True = Actions required, cannot unsubscribe
    notification_channel = Column(String, default="in_app") # e.g. 'email', 'slack', 'in_app'
