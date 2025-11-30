import httpx
from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.integration import JiraConfiguration
from app.models.task import Task, TaskType, TaskPriority


class JiraService:
    def __init__(self, config: JiraConfiguration):
        self.config = config
        self.base_url = config.jira_url
        self.headers = {
            "Authorization": f"Bearer {config.access_token}",
            "Content-Type": "application/json"
        }
    
    async def test_connection(self) -> bool:
        """Test Jira API connection"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/rest/api/3/myself",
                    headers=self.headers
                )
                return response.status_code == 200
        except Exception as e:
            print(f"Jira connection test failed: {e}")
            return False
    
    async def fetch_issues(self, jql: str = None) -> List[Dict[str, Any]]:
        """Fetch issues from Jira"""
        if jql is None:
            jql = f"project={self.config.jira_project_key}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/rest/api/3/search",
                    headers=self.headers,
                    params={
                        "jql": jql,
                        "maxResults": 100,
                        "fields": "summary,description,status,priority,assignee,created,updated"
                    }
                )
                
                if response.status_code == 200:
                    return response.json().get("issues", [])
                else:
                    print(f"Failed to fetch Jira issues: {response.status_code}")
                    return []
        except Exception as e:
            print(f"Error fetching Jira issues: {e}")
            return []
    
    def parse_issue_type(self, jira_issue: Dict[str, Any]) -> TaskType:
        """Parse Jira issue type to TaskType"""
        issue_type = jira_issue.get("fields", {}).get("issuetype", {}).get("name", "").lower()
        
        if "bug" in issue_type:
            return TaskType.BUGFIX
        elif "story" in issue_type or "feature" in issue_type:
            return TaskType.FEATURE
        else:
            return TaskType.SERVICE
    
    def parse_priority(self, jira_issue: Dict[str, Any]) -> TaskPriority:
        """Parse Jira priority to TaskPriority"""
        priority = jira_issue.get("fields", {}).get("priority", {}).get("name", "").lower()
        
        if "critical" in priority or "highest" in priority:
            return TaskPriority.CRITICAL
        elif "high" in priority:
            return TaskPriority.HIGH
        elif "low" in priority or "lowest" in priority:
            return TaskPriority.LOW
        else:
            return TaskPriority.MEDIUM
    
    async def sync_issues(self, db: Session, project_id: str):
        """Sync Jira issues to database"""
        issues = await self.fetch_issues()
        
        for jira_issue in issues:
            issue_key = jira_issue.get("key")
            fields = jira_issue.get("fields", {})
            
            # Check if task already exists
            existing_task = db.query(Task).filter(
                Task.jira_issue_key == issue_key
            ).first()
            
            if not existing_task:
                # Create new task
                new_task = Task(
                    project_id=project_id,
                    jira_issue_key=issue_key,
                    title=fields.get("summary", ""),
                    description=fields.get("description", ""),
                    type=self.parse_issue_type(jira_issue),
                    priority=self.parse_priority(jira_issue)
                )
                db.add(new_task)
        
        db.commit()
        
        # Update last sync time
        self.config.last_sync_at = datetime.utcnow()
        db.commit()

