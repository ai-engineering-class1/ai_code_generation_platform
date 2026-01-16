from typing import List
from sqlalchemy.orm import Session
from app.models.subscription import Subscription
from app.models.organization import Organization, UserRoleAssignment
from app.models.user import User

class SubscriptionService:
    
    @staticmethod
    def create_subscription(db: Session, source_type: str, source_id: str, recipient_type: str, recipient_id: str, is_mandatory: bool = False) -> Subscription:
        sub = Subscription(
            source_type=source_type,
            source_id=source_id,
            recipient_type=recipient_type,
            recipient_id=recipient_id,
            is_mandatory=is_mandatory
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
        return sub

    @staticmethod
    def get_subscribers(db: Session, source_type: str, source_id: str) -> List[User]:
        """
        Get all users who should receive notification for this source.
        Resolves Groups/Organizations recursively.
        """
        subscriptions = db.query(Subscription).filter(
            Subscription.source_type == source_type,
            Subscription.source_id == source_id
        ).all()
        
        recipients = []
        seen_user_ids = set()
        
        for sub in subscriptions:
            if sub.recipient_type == 'user':
                user = db.query(User).filter(User.id == sub.recipient_id).first()
                if user and user.id not in seen_user_ids:
                    recipients.append(user)
                    seen_user_ids.add(user.id)
            
            elif sub.recipient_type == 'group':
                # Fetch all users assigned to this Group (Organization)
                # In a real expanded RBAC, we might filter by specific 'Viewer' role
                assignments = db.query(UserRoleAssignment).filter(
                    UserRoleAssignment.scope_org_id == sub.recipient_id
                ).all()
                
                for assign in assignments:
                    if assign.user and assign.user.id not in seen_user_ids:
                        recipients.append(assign.user)
                        seen_user_ids.add(assign.user.id)
                        
        return recipients
