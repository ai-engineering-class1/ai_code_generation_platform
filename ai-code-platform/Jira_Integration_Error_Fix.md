# Jira Integration Error Fix Documentation

## Overview
This document describes the fixes applied to resolve Jira integration errors and database schema issues in the AI Code Generation Platform.

## Issues Identified

### 1. Jira API Authentication Error
**Problem**: The Jira service was using `Bearer` token authentication, but Jira API requires `Basic` authentication with `email:api_token` format.

**Error**: Jira API calls were failing with authentication errors.

### 2. Missing Database Column
**Problem**: The `jira_configurations` table was missing the `jira_email` column that was added to the model.

**Error**: SQL queries were failing because the column didn't exist in the database.

### 3. Reserved Attribute Name Conflict
**Problem**: The `TaskWorkflowHistory` model had a column named `metadata`, which conflicts with SQLAlchemy's reserved `metadata` attribute.

**Error**: `AttributeError: 'property' object has no attribute 'schema'`

## Fixes Applied

### Fix 1: Jira Authentication Method

**File**: `ai-code-platform/backend/app/services/jira_service.py`

**Changes**:
- Changed from `Bearer` token authentication to `Basic` authentication
- Added email field to JiraConfiguration model
- Implemented Base64 encoding for `email:api_token` credentials

**Before**:
```python
self.headers = {
    "Authorization": f"Bearer {config.access_token}",
    "Content-Type": "application/json"
}
```

**After**:
```python
import base64

# Jira uses Basic auth with email:api_token
credentials = f"{config.jira_email}:{config.access_token}"
encoded_credentials = base64.b64encode(credentials.encode()).decode()
self.headers = {
    "Authorization": f"Basic {encoded_credentials}",
    "Content-Type": "application/json",
    "Accept": "application/json"
}
```

### Fix 2: Database Model Updates

**File**: `ai-code-platform/backend/app/models/integration.py`

**Changes**:
- Added `jira_email` column to `JiraConfiguration` model

**Before**:
```python
class JiraConfiguration(Base):
    # ... other fields ...
    jira_project_key = Column(String(50), nullable=False)
    access_token = Column(Text)
```

**After**:
```python
class JiraConfiguration(Base):
    # ... other fields ...
    jira_project_key = Column(String(50), nullable=False)
    jira_email = Column(String(255), nullable=False)  # Email for Basic auth
    access_token = Column(Text)  # API token
```

### Fix 3: Schema Updates

**File**: `ai-code-platform/backend/app/schemas/integration.py`

**Changes**:
- Added `jira_email` field to `JiraConfigBase`, `JiraConfigCreate`, and `JiraConfigUpdate` schemas
- Added field aliases for camelCase support

**After**:
```python
class JiraConfigBase(CamelCaseModel):
    jira_url: str = Field(..., alias="jiraUrl")
    jira_project_key: str = Field(..., alias="jiraProjectKey")
    jira_email: str = Field(..., alias="jiraEmail")
    sync_enabled: Optional[bool] = Field(True, alias="syncEnabled")
```

### Fix 4: Frontend Updates

**File**: `ai-code-platform/frontend/src/app/(dashboard)/projects/[projectId]/settings/page.tsx`

**Changes**:
- Added `jiraEmail` field to the form state
- Added email input field in the Jira configuration form
- Updated form validation to require email
- Fixed field name mapping (`project_id` → `projectId`)
- Added error handling for API calls

**Key Changes**:
```typescript
const [jiraData, setJiraData] = useState({
  jiraUrl: '',
  jiraProjectKey: '',
  jiraEmail: '',  // Added
  accessToken: '',
  syncEnabled: true,
})

// Validation
if (!jiraData.jiraUrl || !jiraData.jiraProjectKey || !jiraData.jiraEmail) {
  alert('Please fill in all required fields: Jira URL, Project Key, and Email')
  return
}
```

### Fix 5: TypeScript Type Updates

**File**: `ai-code-platform/frontend/src/types/index.ts`

**Changes**:
- Added `jiraEmail` to `JiraConfiguration` interface
- Added `jiraEmail` to `ConfigureJiraData` interface

### Fix 6: Reserved Attribute Name Conflict

**File**: `ai-code-platform/backend/app/models/notification.py`

**Problem**: SQLAlchemy reserves the `metadata` attribute name.

**Solution**: Renamed the database column attribute while keeping the database column name.

**Before**:
```python
metadata = Column(JSON)
```

**After**:
```python
workflow_metadata = Column("metadata", JSON)  # Column name in DB is 'metadata', but attribute is 'workflow_metadata'
```

**Schema Update**: `ai-code-platform/backend/app/schemas/task.py`
```python
metadata: Optional[dict] = Field(None, alias="workflow_metadata")
```

## Database Schema Update

### Problem
The database tables were created before the model changes, so they were missing:
1. `jira_email` column in `jira_configurations` table
2. `workflow_metadata` column (was named `metadata`) in `task_workflow_history` table

### Solution: Database Migration Script

**File**: `ai-code-platform/backend/update_db_schema.py`

Created a migration script that:
1. Checks if columns exist
2. Adds missing columns if they don't exist
3. Renames columns if needed

**Script Contents**:
```python
def update_schema():
    """Add missing columns to existing tables"""
    with engine.connect() as conn:
        # Add jira_email column
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='jira_configurations' AND column_name='jira_email'
        """))
        if result.fetchone() is None:
            conn.execute(text("""
                ALTER TABLE jira_configurations 
                ADD COLUMN jira_email VARCHAR(255) NOT NULL DEFAULT ''
            """))
            conn.commit()
        
        # Rename metadata to workflow_metadata
        # ... similar logic for task_workflow_history table
```

### How to Run the Migration

**Option 1: Run the migration script**
```bash
cd ai-code-platform/backend
python update_db_schema.py
```

**Option 2: Recreate all tables** (⚠️ This will delete existing data)
```bash
cd ai-code-platform/backend
python -c "from app.core.database import Base, engine; from app.models import user, project, task, integration, workflow, notification; Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine)"
```

**Option 3: Manual SQL** (if you prefer)
```sql
-- Add jira_email column
ALTER TABLE jira_configurations 
ADD COLUMN jira_email VARCHAR(255) NOT NULL DEFAULT '';

-- Rename metadata column (if it exists)
ALTER TABLE task_workflow_history 
RENAME COLUMN metadata TO workflow_metadata;
```

## API Endpoint Updates

### File: `ai-code-platform/backend/app/api/v1/endpoints/jira.py`

**Changes**:
- Updated create endpoint to handle updates (upsert pattern)
- Improved error handling
- Fixed field name mapping

**Key Update**:
```python
if existing_config:
    # Update existing config
    config_dict = config_data.model_dump(exclude_unset=True)
    # Don't update access_token if not provided
    if 'access_token' not in config_dict or not config_dict['access_token']:
        config_dict.pop('access_token', None)
    
    for field, value in config_dict.items():
        setattr(existing_config, field, value)
    
    db.commit()
    db.refresh(existing_config)
    return existing_config
else:
    # Create new config
    new_config = JiraConfiguration(**config_data.model_dump())
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return new_config
```

## Testing the Fixes

### 1. Verify Database Schema
```bash
# Connect to your database and check columns
psql -U your_user -d ai_code_platform -c "\d jira_configurations"
```

You should see:
- `jira_email` column (VARCHAR(255))

### 2. Test Jira Configuration
1. Navigate to Project Settings → Jira Integration
2. Fill in:
   - Jira URL: `https://your-domain.atlassian.net`
   - Jira Email: Your Jira account email
   - Jira Project Key: Your project key (e.g., "PROJ")
   - Jira API Token: Your API token from https://console.anthropic.com/
3. Click "Save Configuration"
4. You should see a success message

### 3. Verify API Authentication
Check the backend logs when making Jira API calls. You should see:
- `Authorization: Basic <base64_encoded_credentials>`
- Successful API responses (status 200)

## How to Get Jira API Token

1. Visit: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name (e.g., "AI Code Platform")
4. Copy the generated token (shown only once)
5. Use your Jira account email + this token for authentication

## Summary of Changes

### Backend Changes
1. ✅ Updated `JiraService` to use Basic authentication
2. ✅ Added `jira_email` field to `JiraConfiguration` model
3. ✅ Updated schemas to include `jira_email`
4. ✅ Fixed endpoint to handle updates (upsert)
5. ✅ Renamed `metadata` to `workflow_metadata` to avoid SQLAlchemy conflict
6. ✅ Created database migration script

### Frontend Changes
1. ✅ Added `jiraEmail` input field
2. ✅ Updated form validation
3. ✅ Fixed API field name mapping
4. ✅ Added error handling
5. ✅ Updated TypeScript types

### Database Changes
1. ✅ Added `jira_email` column to `jira_configurations` table
2. ✅ Renamed `metadata` to `workflow_metadata` in `task_workflow_history` table

## Files Modified

### Backend
- `app/models/integration.py` - Added jira_email field
- `app/schemas/integration.py` - Added jira_email to schemas
- `app/services/jira_service.py` - Changed to Basic auth
- `app/api/v1/endpoints/jira.py` - Updated endpoint logic
- `app/models/notification.py` - Renamed metadata column
- `app/schemas/task.py` - Updated schema alias
- `update_db_schema.py` - Created migration script

### Frontend
- `src/app/(dashboard)/projects/[projectId]/settings/page.tsx` - Added email field and validation
- `src/types/index.ts` - Updated TypeScript interfaces

## Notes

- The database migration script is idempotent - it's safe to run multiple times
- Existing Jira configurations will need to be updated with the email field
- The `jira_email` field is required for new configurations
- When updating existing configurations, you can leave the access token empty to keep the existing one

## Troubleshooting

### Error: "Network Error"
- Check if backend server is running
- Verify API URL in frontend `.env` file
- Check browser console for CORS errors

### Error: "Failed to generate specification"
- Verify `ANTHROPIC_API_KEY` is set in backend `.env`
- Check backend logs for detailed error messages

### Error: Column doesn't exist
- Run the migration script: `python update_db_schema.py`
- Or recreate tables (⚠️ deletes data)

### Error: Authentication failed
- Verify Jira email and API token are correct
- Check that the API token hasn't expired
- Ensure the email matches your Jira account

## Recent Fixes (December 2024)

### Fix 7: Jira API Endpoint Migration

**Problem**: Jira Cloud deprecated the `/rest/api/3/search` endpoint and now requires `/rest/api/3/search/jql`.

**Error**: `410 Gone - The requested API has been removed. Please migrate to the /rest/api/3/search/jql API.`

**File**: `ai-code-platform/backend/app/services/jira_service.py`

**Solution**: Updated to use the new endpoint with POST method and JSON body.

**Before**:
```python
api_url = f"{self.base_url}/rest/api/3/search"
response = await client.get(api_url, params={"jql": jql, ...})
```

**After**:
```python
api_url = f"{self.base_url}/rest/api/3/search/jql"
response = await client.post(api_url, json={"jql": jql, "maxResults": 100, ...})
```

### Fix 8: URL Normalization

**Problem**: Jira URLs in database might include extra paths (e.g., `/wiki/home`, `/jira/core`) causing API calls to fail.

**File**: `ai-code-platform/backend/app/services/jira_service.py`

**Solution**: Extract only the base domain from Jira URL.

**Changes**:
```python
# Extract just the domain (remove any existing paths)
from urllib.parse import urlparse
parsed = urlparse(base_url)
self.base_url = f"{parsed.scheme}://{parsed.netloc}"  # e.g., https://joygu2022.atlassian.net
```

### Fix 9: ADF Description Format Handling

**Problem**: Jira returns descriptions in ADF (Atlassian Document Format) - a complex JSON structure. Storing this directly caused SQL errors when fetching tasks.

**Error**: SQL parameter binding errors when querying tasks with ADF descriptions.

**Files**: 
- `ai-code-platform/backend/app/services/jira_service.py`
- `ai-code-platform/backend/app/schemas/task.py`

**Solution**: Added ADF to plain text converter.

**In JiraService**:
```python
def parse_description(self, jira_issue: Dict[str, Any]) -> str:
    """Parse Jira description from ADF format to plain text"""
    description = jira_issue.get("fields", {}).get("description")
    
    if isinstance(description, dict):
        # Recursively extract text from ADF structure
        def extract_text_from_adf(node):
            text_parts = []
            if isinstance(node, dict):
                if node.get("type") == "text":
                    text_parts.append(node.get("text", ""))
                if "content" in node:
                    for item in node["content"]:
                        text_parts.extend(extract_text_from_adf(item))
            return text_parts
        
        text_parts = extract_text_from_adf(description)
        return "\n".join(text_parts)
    
    return description or ""
```

**In Task Schema**:
```python
@field_validator('description', mode='before')
@classmethod
def process_description(cls, v):
    """Convert ADF format to plain text"""
    if isinstance(v, dict):
        # Convert ADF to text (same logic as above)
        ...
    return v
```

### Fix 10: Enhanced Error Logging and Debugging

**File**: `ai-code-platform/backend/app/services/jira_service.py`

**Changes**:
- Added detailed logging for API calls
- Added connection testing before sync
- Added project access verification
- Added request/response logging

**Key Additions**:
```python
async def test_connection(self) -> bool:
    """Test Jira API connection and permissions"""
    # Test user info access
    # Test project access
    # Detailed error messages for 401, 403, 404 errors
```

### Fix 11: Frontend Improvements

**File**: `ai-code-platform/frontend/src/app/(dashboard)/projects/[projectId]/settings/page.tsx`

**Changes**:
1. **Added Jira Quick Links**:
   - "Create Task in Jira" button - Opens Jira create issue page
   - "View Tasks in Jira" button - Opens Jira project task list
   - URL format detection for Jira Core vs Jira Software

2. **Better Error Handling**:
   - Console logging for debugging
   - Detailed error messages
   - Client-side validation

3. **Token Security Indicator**:
   - Green indicator showing "Token is saved (hidden for security)"
   - Clear messaging about token visibility

**URL Helper Function**:
```typescript
const getJiraUrls = (jiraUrl: string, projectKey: string) => {
  // Extract base domain
  // Generate correct URLs for Jira Core/Software
  return {
    createIssue: `${baseUrl}/secure/CreateIssue!default.jspa?project=${projectKey}`,
    projectList: `${baseUrl}/jira/core/projects/${projectKey}/list?jql=...`
  }
}
```

### Fix 12: Background Task Database Session Handling

**Problem**: Background tasks were using database sessions that could be closed, causing errors.

**File**: `ai-code-platform/backend/app/api/v1/endpoints/jira.py`

**Solution**: Background tasks now create their own database sessions.

**Before**:
```python
background_tasks.add_task(jira_service.sync_issues, db, project_id)
```

**After**:
```python
async def sync_task():
    db_session = SessionLocal()
    try:
        await jira_service.sync_issues(db_session, project_id)
    finally:
        db_session.close()

background_tasks.add_task(sync_task)
```

## Summary of Recent Fixes

### Backend
1. ✅ Migrated to `/rest/api/3/search/jql` endpoint
2. ✅ Added URL normalization for Jira base URL
3. ✅ Added ADF to plain text converter for descriptions
4. ✅ Enhanced error logging and debugging
5. ✅ Added connection testing before sync
6. ✅ Fixed background task database session handling

### Frontend
1. ✅ Added "Create Task in Jira" button
2. ✅ Added "View Tasks in Jira" button
3. ✅ Added token security indicator
4. ✅ Improved error handling and logging
5. ✅ Better user feedback for sync operations

### Key Improvements
- **API Compatibility**: Now works with latest Jira Cloud API
- **Data Format**: Descriptions stored as plain text (no ADF format issues)
- **User Experience**: Quick access to Jira from platform
- **Debugging**: Comprehensive logging for troubleshooting
- **Reliability**: Better error handling and session management

