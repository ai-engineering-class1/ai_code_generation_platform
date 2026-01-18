import httpx
import time
import calendar
import jwt
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.integration import GitHubConfiguration
from app.models.task import Task
from app.models.workflow import Specification, CodeGeneration


class GitHubService:
    def __init__(self, config: GitHubConfiguration):
        self.config = config
        self.base_url = "https://api.github.com"
        self._installation_token: Optional[str] = None
        self._installation_token_exp: Optional[int] = None

    async def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        auth_method = (getattr(self.config, "auth_method", None) or "token").strip().lower()
        if auth_method == "app":
            token = await self._get_installation_token()
            headers["Authorization"] = f"token {token}"
            return headers

        # Default: token
        if not self.config.access_token:
            raise ValueError("GitHub access token is not configured for this project")
        headers["Authorization"] = f"token {self.config.access_token}"
        return headers

    async def _get_installation_token(self) -> str:
        """
        Create/refresh a GitHub App installation access token.
        Requires: github_app_id, github_app_installation_id, github_app_private_key (PEM).
        """
        # Reuse cached token if still valid (with some buffer)
        now = int(time.time())
        if self._installation_token and self._installation_token_exp and (now + 30) < self._installation_token_exp:
            return self._installation_token

        app_id = (self.config.github_app_id or "").strip()
        installation_id = (self.config.github_app_installation_id or "").strip()
        private_key = self.config.github_app_private_key
        if not app_id or not installation_id or not private_key:
            raise ValueError("GitHub App credentials are not fully configured for this project")

        # GitHub requires exp <= 10 minutes
        jwt_payload = {
            "iat": now - 60,
            "exp": now + 9 * 60,
            "iss": app_id,
        }
        app_jwt = jwt.encode(jwt_payload, private_key, algorithm="RS256")

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/app/installations/{installation_id}/access_tokens",
                headers={
                    "Authorization": f"Bearer {app_jwt}",
                    "Accept": "application/vnd.github.v3+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )
            if resp.status_code not in (200, 201):
                raise ValueError(f"Failed to mint GitHub App installation token: {resp.status_code} {resp.text}")

            data = resp.json()
            token = data.get("token")
            expires_at = data.get("expires_at")  # ISO8601 string
            if not token:
                raise ValueError("GitHub App installation token response missing token")

            # Best-effort parse expires_at; if parsing fails, keep short TTL.
            exp_ts = now + 8 * 60
            try:
                # '2021-01-01T00:00:00Z'
                if isinstance(expires_at, str) and expires_at.endswith("Z"):
                    exp_ts = int(calendar.timegm(time.strptime(expires_at, "%Y-%m-%dT%H:%M:%SZ")))
            except Exception:
                pass

            self._installation_token = token
            self._installation_token_exp = exp_ts
            return token
    
    async def test_connection(self) -> bool:
        """Test GitHub API connection"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/user",
                    headers=await self._get_headers()
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
                    headers=await self._get_headers()
                )
                
                if base_response.status_code != 200:
                    return False
                
                base_sha = base_response.json()["object"]["sha"]
                
                # Create new branch
                create_response = await client.post(
                    f"{self.base_url}/repos/{self.config.repo_owner}/{self.config.repo_name}/git/refs",
                    headers=await self._get_headers(),
                    json={
                        "ref": f"refs/heads/{branch_name}",
                        "sha": base_sha
                    }
                )
                
                return create_response.status_code == 201
        except Exception as e:
            print(f"Error creating branch: {e}")
            return False
    async def get_workflow_run_jobs(self, run_id: int) -> Optional[Dict[str, Any]]:
        """Fetch detailed job information for a workflow run"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/repos/{self.config.repo_owner}/{self.config.repo_name}/actions/runs/{run_id}/jobs",
                    headers=self.headers
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"Failed to fetch workflow jobs: {response.status_code}")
                    return None
        except Exception as e:
            print(f"Error fetching workflow jobs: {e}")
            return None

    async def get_workflow_run_details(self, run_id: int) -> Optional[Dict[str, Any]]:
        """Fetch detailed workflow run information"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/repos/{self.config.repo_owner}/{self.config.repo_name}/actions/runs/{run_id}",
                    headers=self.headers
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"Failed to fetch workflow run details: {response.status_code}")
                    return None
        except Exception as e:
            print(f"Error fetching workflow run details: {e}")
            return None
            
    async def create_file(self, file_path: str, content: str, branch: str, message: str) -> bool:
        """Create or update a file in repository"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.base_url}/repos/{self.config.repo_owner}/{self.config.repo_name}/contents/{file_path}",
                    headers=await self._get_headers(),
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
                    headers=await self._get_headers(),
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
                    headers=await self._get_headers(),
                    json={
                        "ref": branch,
                        "inputs": inputs
                    }
                )
                
                return response.status_code == 204
        except Exception as e:
            print(f"Error triggering workflow: {e}")
            return False

