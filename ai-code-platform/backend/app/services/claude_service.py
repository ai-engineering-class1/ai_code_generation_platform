import anthropic
import httpx
from typing import Dict, Any
from app.core.config import settings


class ClaudeService:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    async def generate_specification(
        self,
        task_title: str,
        task_description: str,
        task_type: str
    ) -> str:
        """Generate technical specification using Claude"""
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
    
    async def assign_to_agent(self) -> Dict[str, Any]:
        """Assign task to remote Claude Web API agent - quick demo"""
        CLAUDE_WEB_API_URL = "http://103.98.213.149:8520"
        
        payload = {
            "taskType": "feature-implementation",
            "repoUrl": "https://github.com/DrLinAITeam2/simplest-repo",
            "prompt": "Please implement the OpenSpec change under openspec/changes",
            "maxTurns": 25
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(f"{CLAUDE_WEB_API_URL}/tasks", json=payload)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Error assigning to agent: {e}")
            raise Exception(f"Failed to assign to agent: {str(e)}")
    
    async def get_agent_task(self, task_id: str) -> Dict[str, Any]:
        """Get task status from remote Claude Web API agent"""
        CLAUDE_WEB_API_URL = "http://103.98.213.149:8520"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{CLAUDE_WEB_API_URL}/tasks/{task_id}")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Error getting agent task: {e}")
            raise Exception(f"Failed to get agent task: {str(e)}")


