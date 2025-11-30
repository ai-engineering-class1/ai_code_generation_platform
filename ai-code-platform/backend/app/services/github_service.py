import httpx
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.integration import GitHubConfiguration
from app.models.task import Task
from app.models.workflow import Specification, CodeGeneration


class GitHubService:
    def __init__(self, config: GitHubConfiguration):
        self.config = config
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {config.access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
    
    async def test_connection(self) -> bool:
        """Test GitHub API connection"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/user",
                    headers=self.headers
                )
                return response.status_code == 200
        except Exception as e:
            print(f"GitHub connection test failed: {e}")
            return False
    
    async def create_branch(self, branch_name: str, base_branch: str = "main") -> bool:
        """Create a new branch"""
        try:
            async with httpx.AsyncClient() as client:
                # Get base branch SHA
                base_response = await client.get(
                    f"{self.base_url}/repos/{self.config.repo_owner}/{self.config.repo_name}/git/refs/heads/{base_branch}",
                    headers=self.headers
                )
                
                if base_response.status_code != 200:
                    return False
                
                base_sha = base_response.json()["object"]["sha"]
                
                # Create new branch
                create_response = await client.post(
                    f"{self.base_url}/repos/{self.config.repo_owner}/{self.config.repo_name}/git/refs",
                    headers=self.headers,
                    json={
                        "ref": f"refs/heads/{branch_name}",
                        "sha": base_sha
                    }
                )
                
                return create_response.status_code == 201
        except Exception as e:
            print(f"Error creating branch: {e}")
            return False
    
    async def create_file(self, file_path: str, content: str, branch: str, message: str) -> bool:
        """Create or update a file in repository"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.base_url}/repos/{self.config.repo_owner}/{self.config.repo_name}/contents/{file_path}",
                    headers=self.headers,
                    json={
                        "message": message,
                        "content": content,  # Base64 encoded
                        "branch": branch
                    }
                )
                
                return response.status_code in [200, 201]
        except Exception as e:
            print(f"Error creating file: {e}")
            return False
    
    async def create_pull_request(
        self,
        title: str,
        body: str,
        head_branch: str,
        base_branch: str = "main"
    ) -> Optional[Dict[str, Any]]:
        """Create a pull request"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/repos/{self.config.repo_owner}/{self.config.repo_name}/pulls",
                    headers=self.headers,
                    json={
                        "title": title,
                        "body": body,
                        "head": head_branch,
                        "base": base_branch,
                        "draft": True
                    }
                )
                
                if response.status_code == 201:
                    return response.json()
                else:
                    print(f"Failed to create PR: {response.status_code}")
                    return None
        except Exception as e:
            print(f"Error creating pull request: {e}")
            return None
    
    async def trigger_workflow(
        self,
        workflow_file: str,
        branch: str,
        inputs: Dict[str, Any]
    ) -> bool:
        """Trigger a GitHub Actions workflow"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/repos/{self.config.repo_owner}/{self.config.repo_name}/actions/workflows/{workflow_file}/dispatches",
                    headers=self.headers,
                    json={
                        "ref": branch,
                        "inputs": inputs
                    }
                )
                
                return response.status_code == 204
        except Exception as e:
            print(f"Error triggering workflow: {e}")
            return False

