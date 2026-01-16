from sqlalchemy.orm import Session
from app.models.organization import Organization, OrganizationType
import uuid

class OrganizationService:
    
    @staticmethod
    def create_organization(db: Session, name: str, org_type: OrganizationType, parent_id: str = None) -> Organization:
        org = Organization(
            name=name,
            type=org_type,
            parent_id=parent_id,
            billing_parent_id=parent_id # Default to parent
        )
        db.add(org)
        db.commit()
        db.refresh(org)
        return org

    @staticmethod
    def get_billing_root(db: Session, org_id: str) -> Organization:
        """
        Traverse up to find the root billing organization (e.g. Corporation)
        """
        current_org = db.query(Organization).filter(Organization.id == org_id).first()
        while current_org and current_org.billing_parent_id:
             # This is a simplified traversal. For deep trees, use recursive CTE.
             # If billing_parent_id points to itself or loop, break.
             parent = db.query(Organization).filter(Organization.id == current_org.billing_parent_id).first()
             if not parent or parent.id == current_org.id:
                 break
             current_org = parent
             
        return current_org
