import anthropic
import httpx
import json
import re
from uuid import uuid4
from typing import Dict, Any, List
from app.core.config import settings


class ClaudeService:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def _should_include_wp_auto_pages(self, task_title: str, task_description: str) -> bool:
        """
        Heuristic: include WordPress auto-pages.json requirement when task is about creating a webpage/page
        in a WordPress context.
        """
        text = f"{task_title}\n{task_description}".lower()
        wp_signals = [
            "wordpress",
            "wp ",
            "wp-",
            "wp-content",
            "gutenberg",
            "theme",
            "wp plugin",
        ]
        page_signals = [
            "webpage",
            "web page",
            "landing page",
            "new page",
            "create page",
            "page template",
        ]
        return any(s in text for s in wp_signals) and any(s in text for s in page_signals)

    def _wp_auto_pages_requirement_block(self) -> str:
        # Keep this block copy/pasteable and very explicit so it makes it into the spec.
        return r"""
### WordPress auto-synced pages (required)

If this task creates or modifies a WordPress webpage/page (especially inside a theme), the implementation **MUST** create or append:

- `wp-content/themes/<THEME_NAME>/auto-pages.json`

Rules:
- If the file already exists, **add one example page entry only** (do not add multiple).
- Ensure the plugin can discover the page by keeping `auto_detect` enabled and including the paths below.

Use this minimal structure:

```json
{
  "version": 1,
  "resync": true,
  "resync_interval": 60,
  "auto_detect": true,
  "auto_detect_paths": ["pages", "generate-page"],
  "pages": [
    {
      "slug": "<page-slug>",
      "title": "<Page Title>",
      "template": "pages/page-<page-slug>.php",
      "menu": {
        "section": "<menu-section>",
        "label": "<Menu Label>",
        "icon": "<icon-class>",
        "order": 10
      }
    }
  ]
}
```
"""
    
    async def generate_specification(
        self,
        task_title: str,
        task_description: str,
        task_type: str
    ) -> str:
        """Generate technical specification using Claude"""
        wp_block = self._wp_auto_pages_requirement_block() if self._should_include_wp_auto_pages(task_title, task_description) else ""
        prompt = f"""
You are a senior software architect. Generate a comprehensive technical specification for the following requirement:

**Task Type**: {task_type}
**Title**: {task_title}
**Description**: {task_description}

Please provide a detailed technical specification that includes:

1. **Overview**: Brief summary of what needs to be built
2. **Requirements**: Functional and non-functional requirements
3. **Architecture**: High-level design and component structure
4. **Data Models**: Database schemas or data structures needed
5. **API Endpoints**: If applicable, list all REST/GraphQL endpoints
6. **Error Handling**: How errors should be handled
7. **Testing Strategy**: Unit tests, integration tests needed
8. **Security Considerations**: Authentication, authorization, data protection
9. **Performance Considerations**: Scalability, optimization needs
10. **Dependencies**: External libraries or services needed

Format the specification in clear Markdown format suitable for a GitHub repository.

{wp_block}
"""
        
        try:
            # Check if API key is configured
            if not settings.ANTHROPIC_API_KEY:
                raise ValueError("ANTHROPIC_API_KEY is not configured. Please set it in your .env file.")
            
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            if not message.content or len(message.content) == 0:
                raise ValueError("Claude API returned empty response")
            
            return message.content[0].text
        except ValueError as e:
            print(f"Configuration error generating specification: {e}")
            raise  # Re-raise ValueError to be caught by the endpoint
        except Exception as e:
            print(f"Error generating specification: {e}")
            raise Exception(f"Claude API error: {str(e)}")
    
    async def generate_code(
        self,
        specification: str,
        language: str = "python",
        framework: str = ""
    ) -> Dict[str, str]:
        """Generate code based on specification"""
        prompt = f"""
You are an expert {language} developer. Based on the following technical specification, 
generate production-ready code.

**Language**: {language}
**Framework**: {framework}
**Specification**:
{specification}

Please generate:
1. All necessary source code files
2. Unit tests
3. Requirements/dependencies file
4. README with setup instructions

Format your response as a JSON object with file paths as keys and file contents as values.
Example:
{{
  "src/main.py": "# Main application code...",
  "tests/test_main.py": "# Test code...",
  "requirements.txt": "# Dependencies...",
  "README.md": "# Setup instructions..."
}}
"""
        
        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=8000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # TODO: Parse response and extract file structure
            # This is a simplified version
            return {"generated_code": message.content[0].text}
        except Exception as e:
            print(f"Error generating code: {e}")
            return {}
    
    async def review_code(
        self,
        code: str,
        language: str = "python"
    ) -> Dict[str, Any]:
        """Perform AI code review"""
        prompt = f"""
You are an expert code reviewer. Review the following {language} code and provide:

1. **Code Quality Issues**: Style, naming conventions, organization
2. **Potential Bugs**: Logic errors, edge cases not handled
3. **Security Issues**: Vulnerabilities, unsafe practices
4. **Performance Issues**: Inefficiencies, optimization opportunities
5. **Best Practices**: Suggestions for improvement
6. **Overall Assessment**: Grade from A to F

**Code to Review**:
```{language}
{code}
```

Provide your review in a structured format.
"""
        
        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            return {
                "review": message.content[0].text,
                "approved": True  # TODO: Parse review and determine approval
            }
        except Exception as e:
            print(f"Error reviewing code: {e}")
            return {"review": "", "approved": False}
    
    async def assign_to_agent(self, repo_url: str) -> Dict[str, Any]:
        """
        Assign task to remote Claude Web API agent.
        
        Args:
            repo_url: URL of the repository to work on.
        """
        CLAUDE_WEB_API_URL = settings.CLAUDE_WEB_API_URL
        
        # In future, we might use token: headers={"Authorization": f"Bearer {settings.CLAUDE_WEB_API_TOKEN}"}
        
        payload = {
            "taskType": "feature-implementation",
            "repoUrl": repo_url,
            "prompt": "Please implement the OpenSpec change under openspec/changes",
            "maxTurns": 25
        }
        
        try:
            async with httpx.AsyncClient(timeout=float(settings.REMOTE_AGENT_TIMEOUT_SEC)) as client:
                response = await client.post(f"{CLAUDE_WEB_API_URL}/tasks", json=payload)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Error assigning to agent: {e}")
            raise Exception(f"Failed to assign to agent: {str(e)}")
    
    async def assign_to_agent_ci(self, repo_url: str, prompts: str) -> Dict[str, Any]:
        """
        Assign task to remote Claude Web API agent with custom prompts.
        
        Args:
            repo_url: URL of the repository to work on.
            prompts: Custom prompt text to send to the agent.
        """
        CLAUDE_WEB_API_URL = settings.CLAUDE_WEB_API_URL

        # In future, we might use token: headers={"Authorization": f"Bearer {settings.CLAUDE_WEB_API_TOKEN}"}

        payload = {
            "taskType": "feature-implementation",
            "repoUrl": repo_url,
            "prompt": prompts,
            "maxTurns": 25
        }

        try:
            async with httpx.AsyncClient(timeout=float(settings.REMOTE_AGENT_TIMEOUT_SEC)) as client:
                response = await client.post(f"{CLAUDE_WEB_API_URL}/tasks", json=payload)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Error assigning to agent: {e}")
            raise Exception(f"Failed to assign to agent: {str(e)}")
    
    async def get_agent_task(self, task_id: str) -> Dict[str, Any]:
        """Get task status from remote Claude Web API agent"""
        CLAUDE_WEB_API_URL = settings.CLAUDE_WEB_API_URL
        
        try:
            async with httpx.AsyncClient(timeout=float(settings.REMOTE_AGENT_TIMEOUT_SEC)) as client:
                response = await client.get(f"{CLAUDE_WEB_API_URL}/tasks/{task_id}")
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                # If remote task not found, it might be a local test ID.
                # Check if it looks like a standard UUID (len 36)
                if len(task_id) == 36:
                     print(f"Agent task {task_id} not found remotely. Returning mock data for local testing.")
                     return {
                         "taskId": task_id,
                         "status": "running",
                         "result": {
                             "type": "agent-execution",
                             "subtype": "in-progress"
                         },
                         "executionMetrics": {
                             "durationMs": 15000,
                             "numTurns": 5,
                             "totalCostUsd": 0.05
                         },
                         "startedAt": "2025-12-14T12:00:00Z"
                     }
            print(f"Error getting agent task: {e}")
            raise Exception(f"Failed to get agent task: {str(e)}")
        except Exception as e:
            print(f"Error getting agent task: {e}")
            raise Exception(f"Failed to get agent task: {str(e)}")

    async def generate_suggestions(
        self,
        spec_content: str,
        project_name: str = ""
    ) -> List[Dict[str, str]]:
        """Generate AI suggestions for a specification"""
        try:
            # Check if API key is configured
            if not settings.ANTHROPIC_API_KEY:
                # Mock response if no key (or raise error)
                print("Warning: ANTHROPIC_API_KEY not found, returning mock suggestions")
                return [
                    {
                        "id": str(uuid4()),
                        "content": "Consider adding more specific acceptance criteria. (Mock Suggestion)"
                    }
                ]

            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                messages=[
                    {
                        "role": "user",
                        "content": f"""You are an expert software architect reviewing an OpenSpec specification.

Please analyze this specification and provide 2-3 specific suggestions to improve it. Focus on:
1. Clarity and completeness
2. Testability
3. Edge cases that should be considered
4. Potential implementation challenges

Specification content:
{spec_content}

Respond with a JSON array of suggestions, each with "id" and "content" fields."""
                    }
                ]
            )
            
            # Parse the response
            response_text = message.content[0].text
            
            # Try to extract JSON from the response
            json_match = re.search(r'\[[\s\S]*\]', response_text)
            if json_match:
                suggestions = json.loads(json_match.group(0))
                # Ensure each suggestion has an ID
                for suggestion in suggestions:
                    if 'id' not in suggestion:
                        suggestion['id'] = str(uuid4())
                return suggestions
            
            # Fallback: create suggestions from the text
            return [
                {
                    "id": str(uuid4()),
                    "content": response_text
                }
            ]
            
        except Exception as e:
            print(f"Error calling Claude API: {e}")
            # Return placeholder suggestions if API fails
            return [
                {
                    "id": str(uuid4()),
                    "content": "Consider adding more specific acceptance criteria for this feature."
                },
                {
                    "id": str(uuid4()),
                    "content": "Add error handling scenarios to make the specification more robust."
                }
            ]


