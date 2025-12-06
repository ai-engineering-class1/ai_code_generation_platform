import httpx
import base64
from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.integration import JiraConfiguration
from app.models.task import Task, TaskType, TaskPriority


class JiraService:
    def __init__(self, config: JiraConfiguration):
        self.config = config
        # Clean up the Jira URL - extract just the base domain
        base_url = config.jira_url.strip()
        # Remove trailing slash
        base_url = base_url.rstrip('/')
        
        # Extract just the domain (remove any existing paths)
        try:
            from urllib.parse import urlparse
            parsed = urlparse(base_url)
            # Keep only protocol and hostname (e.g., https://joygu2022.atlassian.net)
            self.base_url = f"{parsed.scheme}://{parsed.netloc}"
        except Exception:
            # Fallback: try to extract domain manually
            import re
            match = re.match(r'(https?://[^/]+)', base_url)
            if match:
                self.base_url = match.group(1)
            else:
                self.base_url = base_url
        
        # Jira uses Basic auth with email:api_token
        credentials = f"{config.jira_email}:{config.access_token}"
        encoded_credentials = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
        self.headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Debug: Log authentication details (without exposing token)
        print(f"Authentication setup:")
        print(f"  Email: {config.jira_email}")
        print(f"  Token length: {len(config.access_token) if config.access_token else 0} characters")
        print(f"  Token starts with: {config.access_token[:4] if config.access_token and len(config.access_token) >= 4 else 'N/A'}...")
        print(f"  Authorization header length: {len(self.headers['Authorization'])} characters")
    
    async def test_connection(self) -> bool:
        """Test Jira API connection"""
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                # Test 1: Check if we can access user info
                print(f"Testing connection to: {self.base_url}/rest/api/3/myself")
                response = await client.get(
                    f"{self.base_url}/rest/api/3/myself",
                    headers=self.headers
                )
                print(f"User info response status: {response.status_code}")
                
                if response.status_code != 200:
                    print(f"❌ Failed to get user info: {response.status_code}")
                    print(f"Response: {response.text[:500]}")
                    if response.status_code == 401:
                        print(f"Authentication failed. Check:")
                        print(f"  1. Email: {self.config.jira_email}")
                        print(f"  2. API token is correct")
                        print(f"  3. API token hasn't been revoked")
                    return False
                
                user_info = response.json()
                print(f"✓ Connected as user: {user_info.get('displayName', 'Unknown')} ({user_info.get('emailAddress', 'Unknown')})")
                
                # Test 2: Try to get project info
                print(f"Testing project access: {self.config.jira_project_key}")
                project_response = await client.get(
                    f"{self.base_url}/rest/api/3/project/{self.config.jira_project_key}",
                    headers=self.headers
                )
                print(f"Project access response status: {project_response.status_code}")
                
                if project_response.status_code == 200:
                    project_info = project_response.json()
                    print(f"✓ Can access project: {project_info.get('name', 'Unknown')} ({project_info.get('key', 'Unknown')})")
                    return True
                else:
                    print(f"⚠️ Cannot access project {self.config.jira_project_key}: {project_response.status_code}")
                    print(f"Response: {project_response.text[:500]}")
                    if project_response.status_code == 404:
                        print(f"Project not found. Verify project key is correct.")
                    elif project_response.status_code == 403:
                        print(f"Permission denied. API token needs 'Browse Projects' permission.")
                    return False
        except Exception as e:
            print(f"❌ Jira connection test failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def fetch_issues(self, jql: str = None) -> List[Dict[str, Any]]:
        """Fetch issues from Jira"""
        if jql is None:
            # Use a more inclusive JQL query to get all issues from the project
            # Try multiple JQL formats to ensure we get results
            project_key = self.config.jira_project_key
            # Format 1: project = "CAP" (with quotes and spaces)
            jql = f'project = "{project_key}" ORDER BY created DESC'
            print(f"Using JQL query: {jql}")
            print(f"Project key: {project_key}")
        
        # Must use /rest/api/3/search/jql endpoint (required by Jira Cloud)
        api_url = f"{self.base_url}/rest/api/3/search/jql"
        print(f"Fetching Jira issues from: {api_url}")
        print(f"JQL query: {jql}")
        
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                # The new /search/jql endpoint uses POST with JQL in the request body
                request_body = {
                    "jql": jql,
                    "maxResults": 100,
                    "fields": ["summary", "description", "status", "priority", "assignee", "created", "updated"]
                }
                print(f"Request body: {request_body}")
                print(f"Request headers: {dict(self.headers)}")
                
                response = await client.post(
                    api_url,
                    headers=self.headers,
                    json=request_body
                )
                
                print(f"Jira API response status: {response.status_code}")
                print(f"Jira API response URL: {response.url}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"Jira API response data keys: {list(data.keys())}")
                    print(f"Full Jira API response: {data}")
                    issues = data.get("issues", [])
                    print(f"Successfully fetched {len(issues)} issues from Jira")
                    
                    if not issues:
                        print(f"⚠️ WARNING: No issues found with JQL: {jql}")
                        print(f"Project key used: {self.config.jira_project_key}")
                        print(f"Jira URL: {self.base_url}")
                        print(f"")
                        print(f"Troubleshooting steps:")
                        print(f"  1. Verify issues exist in Jira project '{self.config.jira_project_key}'")
                        print(f"  2. Check API token has 'Browse Projects' and 'View Issues' permissions")
                        print(f"  3. Verify the project key is correct (case-sensitive)")
                        print(f"  4. Try testing connection with test_connection() method")
                        
                        # Try a simpler query to test permissions
                        print(f"")
                        print(f"Testing with simpler JQL query...")
                        simple_jql = f'project = {self.config.jira_project_key}'
                        simple_response = await client.post(
                            api_url,
                            headers=self.headers,
                            json={"jql": simple_jql, "maxResults": 10}
                        )
                        if simple_response.status_code == 200:
                            simple_data = simple_response.json()
                            simple_issues = simple_data.get("issues", [])
                            print(f"Simple query returned {len(simple_issues)} issues")
                        else:
                            print(f"Simple query failed: {simple_response.status_code} - {simple_response.text[:200]}")
                    
                    if issues:
                        print(f"✓ First issue: {issues[0].get('key')} - {issues[0].get('fields', {}).get('summary', 'No summary')}")
                    return issues
                elif response.status_code == 302:
                    print(f"Redirect detected. Final URL: {response.url}")
                    print(f"Response headers: {dict(response.headers)}")
                    # Try to follow the redirect manually
                    redirect_url = response.headers.get("Location")
                    if redirect_url:
                        print(f"Following redirect to: {redirect_url}")
                        redirect_response = await client.get(redirect_url, headers=self.headers)
                        if redirect_response.status_code == 200:
                            data = redirect_response.json()
                            return data.get("issues", [])
                else:
                    error_text = response.text[:500] if hasattr(response, 'text') else "No error details"
                    print(f"Failed to fetch Jira issues: {response.status_code}")
                    print(f"Error response: {error_text}")
                    return []
        except httpx.HTTPStatusError as e:
            print(f"HTTP error fetching Jira issues: {e}")
            print(f"Response: {e.response.text[:500] if e.response else 'No response'}")
            return []
        except Exception as e:
            print(f"Error fetching Jira issues: {e}")
            import traceback
            traceback.print_exc()
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
    
    def parse_description(self, jira_issue: Dict[str, Any]) -> str:
        """Parse Jira description from ADF format to plain text"""
        description = jira_issue.get("fields", {}).get("description")
        
        if not description:
            return ""
        
        # If it's already a string, return it
        if isinstance(description, str):
            return description
        
        # If it's ADF format (dict with 'type' and 'content'), convert to text
        if isinstance(description, dict):
            def extract_text_from_adf(node):
                """Recursively extract text from ADF structure"""
                text_parts = []
                
                if isinstance(node, dict):
                    # Extract text from text nodes
                    if node.get("type") == "text":
                        text_parts.append(node.get("text", ""))
                    
                    # Recursively process content arrays
                    if "content" in node and isinstance(node["content"], list):
                        for item in node["content"]:
                            text_parts.extend(extract_text_from_adf(item))
                
                elif isinstance(node, list):
                    for item in node:
                        text_parts.extend(extract_text_from_adf(item))
                
                return text_parts
            
            text_parts = extract_text_from_adf(description)
            return "\n".join(text_parts)
        
        # Fallback: convert to string
        return str(description)
    
    async def sync_issues(self, db: Session, project_id: str):
        """Sync Jira issues to database"""
        print(f"=== Starting Jira sync for project {project_id} ===")
        
        # First test the connection and permissions
        print("Testing Jira API connection and permissions...")
        connection_ok = await self.test_connection()
        if not connection_ok:
            print("❌ Connection test failed. Please check your API token and permissions.")
            return
        
        issues = await self.fetch_issues()
        print(f"Fetched {len(issues)} issues from Jira")
        
        if not issues:
            print("⚠️ WARNING: No issues returned from Jira API.")
            print("This could be due to:")
            print("  1. API token lacks 'Browse Projects' or 'View Issues' permissions")
            print("  2. Issues don't exist in the project")
            print("  3. Project key mismatch")
            return
        
        created_count = 0
        skipped_count = 0
        
        for jira_issue in issues:
            issue_key = jira_issue.get("key")
            fields = jira_issue.get("fields", {})
            summary = fields.get("summary", "")
            
            print(f"Processing issue: {issue_key} - {summary}")
            
            # Check if task already exists
            existing_task = db.query(Task).filter(
                Task.jira_issue_key == issue_key
            ).first()
            
            if not existing_task:
                # Create new task
                new_task = Task(
                    project_id=project_id,
                    jira_issue_key=issue_key,
                    title=summary,
                    description=self.parse_description(jira_issue),
                    type=self.parse_issue_type(jira_issue),
                    priority=self.parse_priority(jira_issue)
                )
                db.add(new_task)
                created_count += 1
                print(f"✓ Created task for Jira issue: {issue_key}")
            else:
                skipped_count += 1
                print(f"⊘ Skipped existing task for Jira issue: {issue_key}")
        
        try:
            db.commit()
            print(f"Committed {created_count} new tasks to database")
        except Exception as e:
            print(f"Error committing tasks: {e}")
            db.rollback()
            raise
        
        # Update last sync time
        try:
            # Query the config fresh from the current session to avoid session issues
            from app.models.integration import JiraConfiguration
            config = db.query(JiraConfiguration).filter(
                JiraConfiguration.id == self.config.id
            ).first()
            if config:
                config.last_sync_at = datetime.utcnow()
                db.commit()
                print(f"Updated last_sync_at for Jira configuration")
        except Exception as e:
            print(f"Error updating last_sync_at: {e}")
            # Don't rollback here as tasks are already committed
        
        print(f"Jira sync completed: {created_count} created, {skipped_count} skipped")

