from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task, TaskStage, TaskStatus
from app.models.integration import GitHubConfiguration
from app.models.workflow import Specification, CodeGeneration, CodeGenerationStatus, PipelineExecution, PipelineType, PipelineStatus
from app.schemas.integration import GitHubConfigCreate, GitHubConfigUpdate, GitHubConfigResponse
from app.services.github_service import GitHubService
from app.services.claude_service import ClaudeService
from app.services.notification_service import create_notification
from app.services.activity_log_service import ActivityLogService
from app.models.notification import NotificationType
from app.models.task import ActivityStatus
from app.models.user import User
from datetime import datetime
import hmac
import hashlib
import re
import httpx
import gzip
import tarfile
import io
import logging
import sys
import platform

logger = logging.getLogger(__name__)

# For popup dialog on Windows (commented out; uncomment if needed for testing)
# def show_webhook_popup(event_type: str, action: str, repo: str = ""):
#     """Show a popup dialog when webhook is received (for testing)"""
#     try:
#         logger.info(f"[POPUP] Attempting to show popup: event_type={event_type}, action={action}, repo={repo}")
#         if platform.system() == "Windows":
#             import ctypes
#             message = f"GitHub Webhook Received!\n\nEvent Type: {event_type}\nAction: {action}"
#             if repo:
#                 message += f"\nRepository: {repo}"
#             logger.info(f"[POPUP] Showing Windows message box...")
#             # Use MB_SYSTEMMODAL (0x1000) to bring window to front
#             result = ctypes.windll.user32.MessageBoxW(0, message, "GitHub Webhook Alert", 0x1000 | 0x40 | 0x1)  # MB_SYSTEMMODAL | MB_ICONINFORMATION | MB_OK
#             logger.info(f"[POPUP] Message box shown, result: {result}")
#         else:
#             # For non-Windows, use print (could use tkinter if needed)
#             print(f"\n{'='*60}")
#             print(f"WEBHOOK RECEIVED - Event: {event_type}, Action: {action}")
#             if repo:
#                 print(f"Repository: {repo}")
#             print(f"{'='*60}\n")
#             logger.info(f"[POPUP] Non-Windows system, printed to console")
#     except Exception as e:
#         # Don't fail webhook processing if popup fails
#         logger.error(f"[POPUP] Could not show webhook popup: {e}", exc_info=True)

router = APIRouter()


def find_project_by_repository(db: Session, repo_full_name: str):
    """Find project(s) by matching GitHub repository URL"""
    # Normalize repo name (handle different URL formats)
    repo_name = repo_full_name.lower().strip()
    print(f"[FIND PROJECT] Searching for repository: {repo_full_name} (normalized: {repo_name})")
    
    # Try multiple matching strategies
    # 1. Try matching full_name directly (e.g., "owner/repo")
    projects = db.query(Project).filter(
        Project.github_repo_url.ilike(f"%{repo_name}%")
    ).all()
    
    if projects:
        print(f"[FIND PROJECT] Found {len(projects)} project(s) using direct match")
        return projects
    
    # 2. Try matching without .git suffix
    repo_name_no_git = repo_name.replace(".git", "")
    projects = db.query(Project).filter(
        Project.github_repo_url.ilike(f"%{repo_name_no_git}%")
    ).all()
    
    if projects:
        print(f"[FIND PROJECT] Found {len(projects)} project(s) using match without .git")
        return projects
    
    # 3. Try matching with https://github.com/ prefix
    repo_with_https = f"https://github.com/{repo_name}"
    projects = db.query(Project).filter(
        Project.github_repo_url.ilike(f"%{repo_with_https}%")
    ).all()
    
    if projects:
        print(f"[FIND PROJECT] Found {len(projects)} project(s) using https://github.com/ prefix")
        return projects
    
    # 4. Try matching with .git suffix
    repo_with_git = f"{repo_name}.git"
    projects = db.query(Project).filter(
        Project.github_repo_url.ilike(f"%{repo_with_git}%")
    ).all()
    
    if projects:
        print(f"[FIND PROJECT] Found {len(projects)} project(s) using .git suffix")
        return projects
    
    print(f"[FIND PROJECT] No projects found for repository: {repo_full_name}")
    return []


def find_tasks_for_project(db: Session, project_id: str):
    """Find all tasks for a project"""
    return db.query(Task).filter(Task.project_id == project_id).all()


def extract_webhook_branch_and_pr(event_type: str, payload: dict) -> tuple[list[str], list[int]]:
    """Extract branch name(s) and PR number(s) from webhook payload for matching tasks.
    Returns (list of branch names, list of PR numbers)."""
    branches: list[str] = []
    pr_numbers: list[int] = []
    if event_type == "workflow_run":
        wr = payload.get("workflow_run") or {}
        head_branch = wr.get("head_branch")
        if head_branch:
            branches.append(head_branch)
        for pr in wr.get("pull_requests") or []:
            num = pr.get("number")
            if num is not None:
                pr_numbers.append(int(num))
    elif event_type == "pull_request":
        pr = payload.get("pull_request") or {}
        head = pr.get("head") or {}
        ref = head.get("ref")
        if ref:
            branches.append(ref)
        num = pr.get("number")
        if num is not None:
            pr_numbers.append(int(num))
    elif event_type == "push":
        ref = payload.get("ref", "")
        if ref.startswith("refs/heads/"):
            branches.append(ref.replace("refs/heads/", "", 1))
        elif ref:
            branches.append(ref)
    return (branches, pr_numbers)


def _normalize_branch_or_title(s: str) -> str:
    """Normalize for comparison: lowercase, collapse spaces/dashes to a single form."""
    if not s:
        return ""
    s = s.lower().strip()
    # Replace spaces and underscores with dash, then collapse repeated dashes
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def find_tasks_by_branch_title_match(db: Session, project_id: str, branches: list[str]) -> list:
    """Find tasks in project whose title matches one of the branch names (e.g. branch 2026-01-18-New-Project -> task '2026-01-18-New Project')."""
    if not branches:
        return []
    normalized_branches = {_normalize_branch_or_title(b) for b in branches}
    if not normalized_branches:
        return []
    all_tasks = db.query(Task).filter(Task.project_id == project_id).all()
    matched = []
    for t in all_tasks:
        title_norm = _normalize_branch_or_title(t.title or "")
        if title_norm and title_norm in normalized_branches:
            matched.append(t)
    return matched


def find_tasks_by_branch_prefix_task_id(db: Session, project_id: str, branches: list[str]) -> list:
    """Find tasks when branch name is created by API as prefix/task_id (e.g. ai-generated/abc-123-uuid).
    Uses project's GitHubConfiguration.branch_prefix. Handles both app-created and third-party branches using same convention."""
    if not branches:
        return []
    github_config = db.query(GitHubConfiguration).filter(
        GitHubConfiguration.project_id == project_id
    ).first()
    if not github_config or not (github_config.branch_prefix or "").strip():
        return []
    prefix = (github_config.branch_prefix or "").strip().lower()
    if not prefix:
        return []
    # Branch format: "prefix/task_id" (task_id can be UUID or slug)
    prefix_slash = prefix + "/"
    task_ids_from_branches = []
    for b in branches:
        if not b:
            continue
        b_lower = b.lower()
        if b_lower.startswith(prefix_slash):
            rest = b[len(prefix_slash):].strip()
            if rest:
                task_ids_from_branches.append(rest)
    if not task_ids_from_branches:
        return []
    # Resolve task_id: branch suffix must equal Task.id in this project
    all_tasks = db.query(Task).filter(Task.project_id == project_id).all()
    matched = [t for t in all_tasks if t.id and t.id in task_ids_from_branches]
    return list({t.id: t for t in matched}.values())


def find_tasks_related_to_webhook(
    db: Session, project_id: str, event_type: str, payload: dict
) -> list:
    """Find tasks that are related to this webhook (have a code generation matching branch or PR).
    Only returns tasks that have at least one CodeGeneration with matching github_branch or github_pr_number."""
    branches, pr_numbers = extract_webhook_branch_and_pr(event_type, payload)
    if not branches and not pr_numbers:
        return []
    # Tasks in this project that have a CodeGeneration matching branch or PR
    q = (
        db.query(Task)
        .join(CodeGeneration, CodeGeneration.task_id == Task.id)
        .filter(Task.project_id == project_id)
    )
    conditions = []
    if branches:
        conditions.append(CodeGeneration.github_branch.in_(branches))
    if pr_numbers:
        conditions.append(CodeGeneration.github_pr_number.in_(pr_numbers))
    if conditions:
        q = q.filter(or_(*conditions))
    # Distinct tasks (a task might match via multiple code generations)
    return list({t.id: t for t in q.all()}.values())


async def log_webhook_to_activity(
    db: Session,
    event_type: str,
    action: str,
    payload: dict,
    repository: dict
):
    """Create Activity Log entries for webhook events"""
    try:
        repo_full_name = repository.get("full_name", "") if isinstance(repository, dict) else ""
        print(f"[WEBHOOK ACTIVITY LOG] Processing webhook: {event_type} - {action} for repository: {repo_full_name}")
        
        if not repo_full_name:
            print(f"[WEBHOOK ACTIVITY LOG] No repository full_name found in payload")
            return
        
        # Find matching project(s)
        projects = find_project_by_repository(db, repo_full_name)
        print(f"[WEBHOOK ACTIVITY LOG] Found {len(projects)} project(s) for repository: {repo_full_name}")
        
        if not projects:
            print(f"[WEBHOOK ACTIVITY LOG] No project found for repository: {repo_full_name}")
            # Debug: List all projects with github_repo_url
            all_projects = db.query(Project).filter(Project.github_repo_url.isnot(None)).all()
            print(f"[WEBHOOK ACTIVITY LOG] Available projects with GitHub URLs:")
            for p in all_projects:
                print(f"  - Project: {p.name}, GitHub URL: {p.github_repo_url}")
            return
        
        activity_service = ActivityLogService()
        total_activities_created = 0
        
        # Process each project: create activity only for tasks that match webhook (by CodeGeneration branch/PR or by branch name -> task title)
        for project in projects:
            print(f"[WEBHOOK ACTIVITY LOG] Processing project: {project.name} (ID: {project.id})")
            tasks = find_tasks_related_to_webhook(db, project.id, event_type, payload)
            if not tasks:
                branches, _ = extract_webhook_branch_and_pr(event_type, payload)
                # Try matching branch name to task title (e.g. branch 2026-01-18-New-Project -> task "2026-01-18-New Project")
                tasks = find_tasks_by_branch_title_match(db, project.id, branches)
                if tasks:
                    print(f"[WEBHOOK ACTIVITY LOG] Matched {len(tasks)} task(s) by branch/title for project {project.name}")
                else:
                    # Try prefix/task_id convention (e.g. ai-generated/<task_id> from app or third-party API)
                    tasks = find_tasks_by_branch_prefix_task_id(db, project.id, branches)
                    if tasks:
                        print(f"[WEBHOOK ACTIVITY LOG] Matched {len(tasks)} task(s) by branch prefix/task_id for project {project.name}")
                    else:
                        # Fallback: create activity on all tasks in project so webhook events still show somewhere
                        tasks = find_tasks_for_project(db, project.id)
                        if tasks:
                            print(f"[WEBHOOK ACTIVITY LOG] No branch/PR, branch-title, or prefix/task_id match; using all {len(tasks)} task(s) in project {project.name} (fallback)")
                        else:
                            print(f"[WEBHOOK ACTIVITY LOG] No tasks in project {project.name}, skipping")
            else:
                print(f"[WEBHOOK ACTIVITY LOG] Found {len(tasks)} task(s) related to webhook (branch/PR match) for project {project.name}")
            
            if not tasks:
                print(f"[WEBHOOK ACTIVITY LOG] Project {project.name} has no tasks, skipping")
                continue
            
            # Create activity for these tasks
            for task in tasks:
                print(f"[WEBHOOK ACTIVITY LOG] Creating activity log for task: {task.id} - {task.title}")
                try:
                    # Build descriptive title based on event type and status
                    activity_title = build_webhook_activity_title(event_type, action, payload)
                    
                    # Determine activity status based on event type and conclusion
                    activity_status = ActivityStatus.COMPLETED
                    result_message = f"Webhook event processed: {event_type} - {action}"
                    should_end_activity = True  # By default, end activities immediately
                    
                    # For workflow_run events, check conclusion to set proper status
                    if event_type == "workflow_run":
                        workflow_run = payload.get("workflow_run", {})
                        conclusion = workflow_run.get("conclusion")
                        workflow_name = workflow_run.get("name", "Workflow")
                        workflow_url = workflow_run.get("html_url", "")
                        run_id = workflow_run.get("id", "N/A")
                        head_branch = workflow_run.get("head_branch", "N/A")
                        
                        if conclusion == "failure":
                            # For failed workflows, create an ACTIVE activity requiring user attention
                            activity_status = ActivityStatus.PENDING_USER_INPUT
                            should_end_activity = False  # Keep activity active so user can see it
                            
                            result_message = (
                                f"⚠️ Workflow '{workflow_name}' failed and requires your attention.\n\n"
                                f"View details: {workflow_url}\n\n"
                                f"After reviewing the error, you can mark this activity as resolved."
                            )
                        elif conclusion == "success":
                            activity_status = ActivityStatus.COMPLETED
                            result_message = (
                                f"✅ Workflow '{workflow_name}' completed successfully.\n"
                                f"Branch: {head_branch}\n"
                                f"Run ID: {run_id}\n"
                                f"View details: {workflow_url}"
                            )
                        else:
                            activity_status = ActivityStatus.COMPLETED
                            result_message = (
                                f"Workflow '{workflow_name}' {action}.\n"
                                f"Status: {conclusion}\n"
                                f"Branch: {head_branch}\n"
                                f"Run ID: {run_id}\n"
                                f"View details: {workflow_url}"
                            )
                    
                    activity = activity_service.start_activity(
                        db=db,
                        task_id=task.id,
                        title=activity_title,
                        operator_id="github-webhook",
                        activity_type="webhook_event",
                        situation=f"Received {event_type} webhook event from repository {repo_full_name} for task '{task.title}'",
                        task_role=f"Track GitHub repository events related to task implementation from Local Test"
                    )
                    print(f"[WEBHOOK ACTIVITY LOG] Activity created with ID: {activity.id}")
                    
                    # Build action description
                    action_desc = build_webhook_action_description(event_type, action, payload)
                    
                    # Add workflow conclusion to metadata for workflow_run events
                    metadata = {
                        "event_type": event_type,
                        "action": action,
                        "repository": repo_full_name,
                        "project_id": project.id,
                        "project_name": project.name
                    }
                    if event_type == "workflow_run":
                        workflow_run = payload.get("workflow_run", {})
                        metadata["workflow_conclusion"] = workflow_run.get("conclusion")
                        metadata["workflow_status"] = workflow_run.get("status")
                        metadata["workflow_name"] = workflow_run.get("name")
                        metadata["workflow_url"] = workflow_run.get("html_url")
                        
                        # Set prompts (error_summary) for failed workflows so every failed-workflow activity shows Prompts
                        if workflow_run.get("conclusion") == "failure":
                            run_id = workflow_run.get("id")
                            repository = workflow_run.get("repository") or payload.get("repository") or {}
                            error_details = await fetch_workflow_error_details(repository, run_id)
                            if error_details and error_details.get("error_summary"):
                                metadata["error_summary"] = error_details["error_summary"]
                                metadata["failed_jobs_count"] = error_details.get("failed_count", 0)
                            else:
                                # Ensure Prompts section still appears: minimal summary with link to logs
                                workflow_url = workflow_run.get("html_url") or ""
                                metadata["error_summary"] = (
                                    f"Workflow failed. View full logs: {workflow_url}" if workflow_url
                                    else "Workflow failed. View logs in GitHub Actions."
                                )
                    
                    activity = activity_service.update_activity(
                        db=db,
                        activity_id=activity.id,
                        action=action_desc,
                        metadata=metadata
                    )
                    print(f"[WEBHOOK ACTIVITY LOG] Activity updated with action")
                    
                    # For failed workflows, keep activity active (don't end it) so user can see it
                    # For other events, end the activity normally
                    if should_end_activity:
                        from datetime import datetime
                        before_end = datetime.utcnow()
                        print(f"[WEBHOOK ACTIVITY LOG] About to end activity {activity.id} (type: {activity.activity_type}) for task {task.id} at {before_end.isoformat()}")
                        activity = activity_service.end_activity(
                            db=db,
                            activity_id=activity.id,
                            result=result_message,
                            status=activity_status
                        )
                        after_end = datetime.utcnow()
                        print(f"[WEBHOOK ACTIVITY LOG] Activity ended with status {activity_status.value}. Activity ID: {activity.id}, Task ID: {task.id} at {after_end.isoformat()}")
                    else:
                        # Update activity with result but keep it active (pending user input)
                        activity = activity_service.update_activity(
                            db=db,
                            activity_id=activity.id,
                            action=action_desc + f"\n\n{result_message}",
                            metadata=metadata
                        )
                        # Manually update status to PENDING_USER_INPUT without ending
                        activity.status = activity_status.value
                        db.commit()
                        db.refresh(activity)
                        print(f"[WEBHOOK ACTIVITY LOG] Activity kept ACTIVE with status {activity_status.value} (pending user input). Activity ID: {activity.id}, Task ID: {task.id}")
                    total_activities_created += 1
                except Exception as task_error:
                    print(f"[WEBHOOK ACTIVITY LOG] Error creating activity for task {task.id}: {task_error}")
                    import traceback
                    traceback.print_exc()
                    db.rollback()
                    continue
        
        print(f"[WEBHOOK ACTIVITY LOG] ✅ Successfully created {total_activities_created} activity log entries for {len(projects)} project(s) for webhook: {event_type} - {action}")
        
        if total_activities_created == 0:
            print(f"[WEBHOOK ACTIVITY LOG] ⚠️  WARNING: No activity logs were created. This might mean:")
            print(f"   - No projects matched the repository: {repo_full_name}")
            print(f"   - No tasks in matched projects have a code generation (branch/PR) related to this webhook")
            print(f"   - Activity creation failed for all related tasks")
        
    except Exception as e:
        print(f"[WEBHOOK ACTIVITY LOG] ❌ ERROR creating webhook activity log: {e}")
        import traceback
        traceback.print_exc()
        # Try to commit any successful activities before rolling back
        try:
            db.commit()
        except:
            db.rollback()
        # Re-raise to let caller know it failed
        raise


def build_webhook_activity_title(event_type: str, action: str, payload: dict) -> str:
    """Build a descriptive title for webhook activity logs"""
    if event_type == "pull_request":
        pr = payload.get("pull_request", {})
        pr_number = pr.get("number", "N/A")
        pr_title = pr.get("title", "Untitled")
        if action == "opened":
            return f"Pull Request Opened: #{pr_number} - {pr_title}"
        elif action == "closed":
            merged = pr.get("merged", False)
            if merged:
                return f"Pull Request Merged: #{pr_number} - {pr_title}"
            else:
                return f"Pull Request Closed: #{pr_number} - {pr_title}"
        else:
            return f"Pull Request {action.title()}: #{pr_number} - {pr_title}"
    
    elif event_type == "workflow_run":
        workflow_run = payload.get("workflow_run", {})
        workflow_name = workflow_run.get("name", "Unknown Workflow")
        conclusion = workflow_run.get("conclusion", "unknown")
        status = workflow_run.get("status", "unknown")
        
        # Create descriptive title based on conclusion
        if conclusion == "failure":
            return f"❌ Workflow Failed: {workflow_name}"
        elif conclusion == "success":
            return f"✅ Workflow Succeeded: {workflow_name}"
        elif conclusion == "cancelled":
            return f"⚠️ Workflow Cancelled: {workflow_name}"
        else:
            return f"Workflow {action.title()}: {workflow_name} ({status})"
    
    elif event_type == "push":
        ref = payload.get("ref", "")
        branch = ref.replace("refs/heads/", "") if ref.startswith("refs/heads/") else ref
        commits = payload.get("commits", [])
        commit_count = len(commits)
        return f"Push to {branch} ({commit_count} commit(s))"
    
    else:
        return f"GitHub Webhook: {event_type} ({action})"


def build_webhook_action_description(event_type: str, action: str, payload: dict) -> str:
    """Build a descriptive action string for webhook events"""
    if event_type == "pull_request":
        pr = payload.get("pull_request", {})
        pr_number = pr.get("number", "N/A")
        pr_title = pr.get("title", "Untitled")
        pr_url = pr.get("html_url", "")
        
        if action == "opened":
            return f"Pull Request #{pr_number} opened: {pr_title}\nURL: {pr_url}"
        elif action == "closed":
            merged = pr.get("merged", False)
            if merged:
                return f"Pull Request #{pr_number} merged: {pr_title}\nURL: {pr_url}"
            else:
                return f"Pull Request #{pr_number} closed: {pr_title}\nURL: {pr_url}"
        else:
            return f"Pull Request #{pr_number} {action}: {pr_title}\nURL: {pr_url}"
    
    elif event_type == "workflow_run":
        workflow_run = payload.get("workflow_run", {})
        workflow_name = workflow_run.get("name", "Unknown Workflow")
        conclusion = workflow_run.get("conclusion", "unknown")
        status = workflow_run.get("status", "unknown")
        workflow_url = workflow_run.get("html_url", "")
        run_id = workflow_run.get("id", "N/A")
        head_branch = workflow_run.get("head_branch", "N/A")
        head_sha = workflow_run.get("head_sha", "N/A")[:7] if workflow_run.get("head_sha") else "N/A"
        
        # Get repository info to build branch URL
        repository = workflow_run.get("repository") or payload.get("repository") or {}
        repo_full_name = repository.get("full_name", "") if isinstance(repository, dict) else ""
        branch_url = ""
        if repo_full_name and head_branch != "N/A":
            branch_url = f"https://github.com/{repo_full_name}/tree/{head_branch}"
        
        # Build detailed description with prominent clickable URL
        description = f"Workflow: {workflow_name}\n"
        description += f"Status: {status}\n"
        description += f"Conclusion: {conclusion}\n"
        description += f"Branch: {head_branch}\n"
        description += f"Commit: {head_sha}\n"
        description += f"Run ID: {run_id}\n"
        
        if workflow_url:
            if conclusion == "failure":
                description += f"\n🔗 VIEW ERRORS IN GITHUB ACTIONS:\n{workflow_url}\n"
                if branch_url:
                    description += f"🔗 Branch: {branch_url}\n"
                description += "\n⚠️ To identify which step failed:\n"
                description += "1. Click the URL above to open GitHub Actions\n"
                description += "2. Click on the failed job (red ❌ icon)\n"
                description += "3. Expand each step to see detailed error messages\n"
                description += "4. Look for error indicators (red X) next to step names"
            else:
                description += f"\n🔗 View workflow details:\n{workflow_url}\n"
                if branch_url:
                    description += f"🔗 Branch: {branch_url}"
        
        return description
    
    elif event_type == "push":
        ref = payload.get("ref", "")
        commits = payload.get("commits", [])
        branch = ref.replace("refs/heads/", "") if ref.startswith("refs/heads/") else ref
        commit_count = len(commits)
        
        commit_messages = []
        for commit in commits[:5]:  # Limit to first 5 commits
            msg = commit.get("message", "No message")
            commit_messages.append(f"  - {msg[:80]}")
        
        commits_text = "\n".join(commit_messages)
        if commit_count > 5:
            commits_text += f"\n  ... and {commit_count - 5} more commit(s)"
        
        return f"Push to branch '{branch}': {commit_count} commit(s)\n{commits_text}"
    
    else:
        return f"GitHub webhook event: {event_type} (action: {action})"


async def fetch_workflow_error_details(repository: dict, run_id: int):
    """Fetch detailed error information for a failed workflow run using GitHub API"""
    try:
        from app.core.config import settings
        
        if not settings.GITHUB_TOKEN:
            print("[WORKFLOW_ERROR_DETAILS] No GITHUB_TOKEN configured, skipping detailed error fetch")
            return None
        
        repo_full_name = repository.get("full_name", "") if isinstance(repository, dict) else ""
        if not repo_full_name:
            print("[WORKFLOW_ERROR_DETAILS] No repository full_name found")
            return None
        
        owner, repo = repo_full_name.split("/", 1)
        
        headers = {
            "Authorization": f"token {settings.GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Fetch jobs for this workflow run
            jobs_response = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
                headers=headers
            )
            
            if jobs_response.status_code != 200:
                print(f"[WORKFLOW_ERROR_DETAILS] Failed to fetch jobs: {jobs_response.status_code}")
                return None
            
            jobs_data = jobs_response.json()
            jobs = jobs_data.get("jobs", [])
            
            # Find failed jobs and their steps, extract error details
            failed_jobs = []
            error_summary_lines = []
            
            for job in jobs:
                if job.get("conclusion") == "failure":
                    steps = job.get("steps", [])
                    failed_steps = [step for step in steps if step.get("conclusion") == "failure"]
                    job_detail_lines = []  # optional lines from log parsing; failed steps + link go first
                    job_name = job.get("name", "Unknown Job")
                    job_id = job.get("id")
                    
                    # Fetch job logs to get detailed error descriptions
                    try:
                        logs_response = await client.get(
                            f"https://api.github.com/repos/{owner}/{repo}/actions/jobs/{job_id}/logs",
                            headers={**headers, "Accept": "application/vnd.github.v3+json"},
                            follow_redirects=True,
                            timeout=15.0
                        )
                        
                        if logs_response.status_code == 200:
                            logs_content = ""
                            
                            # GitHub Actions logs are returned as a gzipped tarball
                            try:
                                # Try to decompress and extract logs
                                gzip_data = gzip.decompress(logs_response.content)
                                tar = tarfile.open(fileobj=io.BytesIO(gzip_data), mode='r:gz')
                                
                                # Extract all log files and combine their content
                                log_files = []
                                for member in tar.getmembers():
                                    if member.isfile() and member.name.endswith('.txt'):
                                        file_content = tar.extractfile(member)
                                        if file_content:
                                            log_files.append(file_content.read().decode('utf-8', errors='ignore'))
                                
                                logs_content = "\n".join(log_files)
                                tar.close()
                            except Exception as extract_error:
                                # If extraction fails, try to read as plain text
                                print(f"[WORKFLOW_ERROR_DETAILS] Could not extract tarball, trying plain text: {extract_error}")
                                try:
                                    logs_content = logs_response.text
                                except:
                                    logs_content = logs_response.content.decode('utf-8', errors='ignore')
                            
                            # Try to extract meaningful error messages from logs
                            
                            # Extract structured error information for Claude
                            error_messages = set()  # Use set to avoid duplicates
                            file_paths = set()
                            line_numbers = []
                            
                            # Pattern 1: File paths with line numbers (common in compilation/test errors)
                            file_pattern = r'([^\s]+\.(py|js|ts|java|cpp|c|h|go|rs|rb|php|tsx|jsx)):(\d+):?\d*'
                            file_matches = re.finditer(file_pattern, logs_content, re.IGNORECASE)
                            for match in file_matches:
                                file_path = match.group(1)
                                line_num = match.group(3)
                                file_paths.add(f"{file_path}:{line_num}")
                                if len(file_paths) >= 10:
                                    break
                            
                            # Pattern 2: Error messages with context
                            error_patterns = [
                                # Python errors
                                r"(?i)(File\s+[\"']?[^\"'\s]+[\"']?,\s+line\s+\d+.*?Error:.*?)(?:\n|$)",
                                r"(?i)(Traceback.*?\n.*?Error:.*?)(?:\n|$)",
                                # JavaScript/TypeScript errors
                                r"(?i)(Error:\s+.*?at\s+.*?\(.*?:\d+:\d+\))(?:\n|$)",
                                # General errors
                                r"(?i)(Error:\s*.+?)(?:\n|$)",
                                r"(?i)(ERROR:\s*.+?)(?:\n|$)",
                                r"(?i)(Failed:\s*.+?)(?:\n|$)",
                                r"(?i)(FAILED:\s*.+?)(?:\n|$)",
                                r"(?i)(Exception:\s*.+?)(?:\n|$)",
                                # Exit codes with context
                                r"(?i)(Process completed with exit code\s+\d+.*?)(?:\n.*?){0,2}",
                                # Test failures
                                r"(?i)(FAIL\s+.*?)(?:\n|$)",
                                r"(?i)(AssertionError:.*?)(?:\n|$)",
                            ]
                            
                            for pattern in error_patterns:
                                matches = re.finditer(pattern, logs_content, re.MULTILINE | re.DOTALL)
                                for match in matches:
                                    error_text = match.group(1) if match.groups() else match.group(0)
                                    error_text = error_text.strip()
                                    # Clean up: remove excessive whitespace but preserve structure
                                    error_text = re.sub(r'[ \t]+', ' ', error_text)
                                    error_text = re.sub(r'\n{3,}', '\n\n', error_text)
                                    if len(error_text) > 30 and len(error_text) < 800:  # Reasonable length
                                        error_messages.add(error_text[:600])  # Limit to 600 chars
                                    
                                    if len(error_messages) >= 12:  # Limit total messages
                                        break
                                if len(error_messages) >= 12:
                                    break
                            
                            # Pattern 3: Look for command outputs that failed
                            if len(error_messages) < 8:
                                lines = logs_content.split('\n')
                                for i, line in enumerate(lines):
                                    line_lower = line.lower()
                                    # Look for error indicators with context
                                    if any(keyword in line_lower for keyword in ['error', 'failed', 'exception', 'fatal', 'cannot', 'unable', 'missing', 'not found']):
                                        # Include a few lines of context
                                        context_start = max(0, i - 1)
                                        context_end = min(len(lines), i + 2)
                                        context = '\n'.join(lines[context_start:context_end]).strip()
                                        if len(context) > 30 and len(context) < 400:
                                            error_messages.add(context)
                                        if len(error_messages) >= 12:
                                            break
                            
                            # Keep for this job: we'll add failed steps + link first, then these details
                            job_detail_lines = []
                            if file_paths:
                                for fp in list(file_paths)[:10]:
                                    job_detail_lines.append(f"File: {fp}")
                            if error_messages:
                                for msg in list(error_messages)[:20]:
                                    job_detail_lines.append(msg)
                    except Exception as log_error:
                        print(f"[WORKFLOW_ERROR_DETAILS] Error fetching logs for job {job_id}: {log_error}")
                        job_detail_lines = []
                    
                    # Per-job: add failed steps and log link first so the prompt shows actionable info at top
                    if failed_steps:
                        step_names = [f"Step {step.get('number', '?')}: {step.get('name', 'Unknown')}" for step in failed_steps]
                        error_summary_lines.append(f"Failed steps: {', '.join(step_names)}")
                    job_url = job.get("html_url", "")
                    if job_url:
                        error_summary_lines.append(f"View full logs: {job_url}")
                    error_summary_lines.extend(job_detail_lines)
                    
                    failed_jobs.append({
                        "name": job_name,
                        "id": job_id,
                        "html_url": job.get("html_url", ""),
                        "failed_steps": [
                            {
                                "name": step.get("name", "Unknown Step"),
                                "number": step.get("number"),
                                "conclusion": step.get("conclusion"),
                                "started_at": step.get("started_at"),
                                "completed_at": step.get("completed_at"),
                            }
                            for step in failed_steps
                        ]
                    })
            
            error_summary = "\n".join(error_summary_lines) if error_summary_lines else "No detailed error information available."
            
            return {
                "failed_jobs": failed_jobs,
                "total_jobs": len(jobs),
                "failed_count": len(failed_jobs),
                "error_summary": error_summary
            }
            
    except Exception as e:
        print(f"[WORKFLOW_ERROR_DETAILS] Error fetching error details: {e}")
        import traceback
        traceback.print_exc()
        return None


async def notify_webhook_event(db: Session, event_type: str, action: str, payload: dict):
    """Create notifications for all users when webhook events are received"""
    try:
        logger.info(f"[WEBHOOK NOTIFICATION] Processing webhook event: event_type={event_type}, action={action}")
        
        # Get all active users to notify them
        users = db.query(User).filter(User.is_active == True).all()
        logger.info(f"[WEBHOOK NOTIFICATION] Found {len(users)} active user(s) to notify")
        
        # Determine notification details based on event type
        if event_type == "pull_request":
            pull_request = payload.get("pull_request", {})
            pr_number = pull_request.get("number")
            pr_title = pull_request.get("title", "Untitled PR")
            pr_url = pull_request.get("html_url", "")
            repository = payload.get("repository", {})
            repo_name = repository.get("full_name", "Unknown")
            
            if action == "opened":
                title = f"New Pull Request: #{pr_number}"
                message = f"Pull request opened in {repo_name}: {pr_title}"
            elif action == "closed":
                if pull_request.get("merged"):
                    title = f"Pull Request Merged: #{pr_number}"
                    message = f"Pull request #{pr_number} was merged in {repo_name}"
                else:
                    title = f"Pull Request Closed: #{pr_number}"
                    message = f"Pull request #{pr_number} was closed in {repo_name}"
            else:
                title = f"Pull Request Updated: #{pr_number}"
                message = f"Pull request #{pr_number} was {action} in {repo_name}"
            
            notification_type = NotificationType.INFO
            action_url = pr_url if pr_url else None
            logger.info(f"[WEBHOOK NOTIFICATION] Pull request event: PR #{pr_number} in {repo_name}, action={action}")
            
        elif event_type == "workflow_run":
            workflow_run = payload.get("workflow_run", {})
            workflow_name = workflow_run.get("name", "Workflow")
            conclusion = workflow_run.get("conclusion", "unknown")
            repository = payload.get("repository", {})
            repo_name = repository.get("full_name", "Unknown")
            
            if conclusion == "success":
                title = f"Workflow Succeeded: {workflow_name}"
                message = f"Workflow '{workflow_name}' completed successfully in {repo_name}"
                notification_type = NotificationType.INFO
            elif conclusion == "failure":
                title = f"Workflow Failed: {workflow_name}"
                message = f"Workflow '{workflow_name}' failed in {repo_name}"
                notification_type = NotificationType.ERROR
            else:
                title = f"Workflow {action}: {workflow_name}"
                message = f"Workflow '{workflow_name}' {action} in {repo_name}"
                notification_type = NotificationType.INFO
            
            action_url = workflow_run.get("html_url", "")
            logger.info(f"[WEBHOOK NOTIFICATION] Workflow run event: {workflow_name} in {repo_name}, conclusion={conclusion}")
            
        elif event_type == "push":
            ref = payload.get("ref", "")
            commits = payload.get("commits", [])
            repository = payload.get("repository", {})
            repo_name = repository.get("full_name", "Unknown")
            branch = ref.replace("refs/heads/", "") if ref.startswith("refs/heads/") else ref
            
            commit_count = len(commits)
            if commit_count > 0:
                last_commit = commits[0]
                commit_message = last_commit.get("message", "No message")
                title = f"Push to {branch}"
                message = f"{commit_count} commit(s) pushed to {branch} in {repo_name}: {commit_message[:50]}"
            else:
                title = f"Push to {branch}"
                message = f"Push event to {branch} in {repo_name}"
            
            notification_type = NotificationType.INFO
            action_url = repository.get("html_url", "")
            logger.info(f"[WEBHOOK NOTIFICATION] Push event: {commit_count} commit(s) to {branch} in {repo_name}")
            
        else:
            # Generic webhook event
            title = f"GitHub Webhook: {event_type}"
            message = f"Received {event_type} event" + (f" (action: {action})" if action else "")
            notification_type = NotificationType.INFO
            action_url = None
            logger.info(f"[WEBHOOK NOTIFICATION] Generic webhook event: {event_type}, action={action}")
        
        # Create notification for each active user
        notifications_created = 0
        for user in users:
            notification = create_notification(
                db=db,
                user_id=user.id,
                notification_type=notification_type,
                title=title,
                message=message,
                action_url=action_url
            )
            notifications_created += 1
            logger.info(f"[WEBHOOK NOTIFICATION] Created notification for user: user_id={user.id}, notification_id={notification.id}, title='{title}'")
        
        db.commit()
        logger.info(f"[WEBHOOK NOTIFICATION] Successfully created {notifications_created} notification(s) for webhook event: event_type={event_type}, action={action}")
        
    except Exception as e:
        logger.error(f"[WEBHOOK NOTIFICATION] Error creating webhook notification: {e}", exc_info=True)
        db.rollback()


@router.post("/config", response_model=GitHubConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_github_config(
    config_data: GitHubConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Configure GitHub integration for a project"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == config_data.project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if config already exists - update if it does, create if it doesn't
    existing_config = db.query(GitHubConfiguration).filter(
        GitHubConfiguration.project_id == config_data.project_id
    ).first()
    
    incoming = config_data.model_dump(exclude_unset=True)

    # Normalize auth method
    auth_method = (incoming.get("auth_method") or "token").strip().lower()
    if auth_method not in {"token", "app"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="authMethod must be either 'token' or 'app'"
        )
    incoming["auth_method"] = auth_method

    def _has_token_payload(payload: dict) -> bool:
        token = payload.get("access_token")
        return bool(token and str(token).strip())

    def _has_app_payload(payload: dict) -> bool:
        return bool(
            (payload.get("github_app_id") and str(payload.get("github_app_id")).strip())
            and (payload.get("github_app_installation_id") and str(payload.get("github_app_installation_id")).strip())
            and (payload.get("github_app_private_key") and str(payload.get("github_app_private_key")).strip())
        )

    if existing_config:
        # Update existing config
        # Don't overwrite secrets unless provided
        if not _has_token_payload(incoming):
            incoming.pop("access_token", None)
        if not (incoming.get("github_app_id") and str(incoming.get("github_app_id")).strip()):
            incoming.pop("github_app_id", None)
        if not (incoming.get("github_app_installation_id") and str(incoming.get("github_app_installation_id")).strip()):
            incoming.pop("github_app_installation_id", None)
        if not (incoming.get("github_app_private_key") and str(incoming.get("github_app_private_key")).strip()):
            incoming.pop("github_app_private_key", None)

        for field, value in incoming.items():
            setattr(existing_config, field, value)

        # Validate resulting config (after update)
        if existing_config.auth_method == "token" and not existing_config.access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub token auth selected but no access token is set"
            )
        if existing_config.auth_method == "app":
            missing = []
            if not existing_config.github_app_id:
                missing.append("githubAppId")
            if not existing_config.github_app_installation_id:
                missing.append("githubAppInstallationId")
            if not existing_config.github_app_private_key:
                missing.append("githubAppPrivateKey")
            if missing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"GitHub App auth selected but missing: {', '.join(missing)}"
                )

        db.commit()
        db.refresh(existing_config)
        return existing_config

    # Creating new config: must provide either token or full app creds
    if auth_method == "token" and not _has_token_payload(incoming):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="accessToken is required when authMethod is 'token'"
        )
    if auth_method == "app" and not _has_app_payload(incoming):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="githubAppId, githubAppInstallationId, and githubAppPrivateKey are required when authMethod is 'app'"
        )

    new_config = GitHubConfiguration(**incoming)
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return new_config


@router.get("/config/{project_id}", response_model=GitHubConfigResponse)
async def get_github_config(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get GitHub configuration for a project"""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    config = db.query(GitHubConfiguration).filter(
        GitHubConfiguration.project_id == project_id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GitHub configuration not found"
        )
    
    return config


@router.post("/generate-spec/{task_id}")
async def generate_specification(
    task_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate technical specification for a task using Claude"""
    # Get task
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == task.project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Generate specification using Claude
    try:
        claude_service = ClaudeService()
        # Handle task.type - it might be an enum or a string
        task_type = task.type.value if hasattr(task.type, 'value') else str(task.type)
        spec_content = await claude_service.generate_specification(
            task.title,
            task.description or "",
            task_type
        )
        
        if not spec_content:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate specification: Claude API returned empty response"
            )
    except ValueError as e:
        # Configuration error (e.g., missing API key)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Configuration error: {str(e)}"
        )
    except Exception as e:
        # Other errors from Claude service
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate specification: {str(e)}"
        )
    
    # Create specification
    new_spec = Specification(
        task_id=task_id,
        content=spec_content,
        version=1
    )
    
    db.add(new_spec)
    
    # Update task status
    task.current_stage = TaskStage.SPEC_REVIEW
    task.status = TaskStatus.IN_PROGRESS
    
    db.commit()
    db.refresh(new_spec)
    
    return {
        "message": "Specification generated successfully",
        "task_id": task_id,
        "specification_id": new_spec.id
    }


@router.post("/generate-code/{task_id}")
async def trigger_code_generation(
    task_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Trigger GitHub Actions workflow to generate code"""
    # Get task with specification
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == task.project_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check if specification exists and is approved
    if not task.specification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specification not found. Generate specification first."
        )
    
    if not task.specification.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specification not approved. Approve specification first."
        )
    
    # Get GitHub configuration
    github_config = db.query(GitHubConfiguration).filter(
        GitHubConfiguration.project_id == task.project_id
    ).first()
    
    if not github_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub not configured for this project"
        )
    
    # Create code generation record
    branch_name = f"{github_config.branch_prefix}/{task_id}"
    new_code_gen = CodeGeneration(
        task_id=task_id,
        specification_id=task.specification.id,
        github_branch=branch_name,
        status=CodeGenerationStatus.GENERATING
    )
    
    db.add(new_code_gen)
    
    # Update task status
    task.current_stage = TaskStage.CODE_GENERATION
    
    db.commit()
    db.refresh(new_code_gen)
    
    # Trigger GitHub Actions workflow (in background)
    github_service = GitHubService(github_config)
    background_tasks.add_task(
        trigger_github_workflow,
        github_service,
        task_id,
        task.specification.id,
        branch_name
    )
    
    return {
        "message": "Code generation triggered",
        "task_id": task_id,
        "code_generation_id": new_code_gen.id,
        "branch": branch_name
    }


@router.post("/register-branch/{task_id}")
def register_branch_for_task(
    task_id: str,
    body: dict = Body(default=dict),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Register a branch name to a task so webhook events (push/PR/workflow) are attributed to this task.
    Use when a branch is created by a third-party API with an arbitrary name; call this after creating the branch.
    Body: { \"branch\": \"feature/xyz-123\" } or { \"branch_name\": \"...\" }."""
    branch_name = (body.get("branch") or body.get("branch_name") or "").strip()
    if not branch_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request body must include 'branch' or 'branch_name' (the GitHub branch name)."
        )
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Project not found")
    spec = db.query(Specification).filter(Specification.task_id == task_id).order_by(Specification.version.desc()).first()
    if not spec:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task has no specification. Create and approve a specification first, or use branch name in form <branch_prefix>/<task_id> so webhooks can match by prefix/task_id."
        )
    existing = db.query(CodeGeneration).filter(
        CodeGeneration.task_id == task_id,
        CodeGeneration.github_branch == branch_name
    ).first()
    if existing:
        return {"message": "Branch already registered to this task", "task_id": task_id, "branch": branch_name}
    # Update existing CodeGeneration for this task to use this branch, or create one
    code_gen = db.query(CodeGeneration).filter(CodeGeneration.task_id == task_id).order_by(CodeGeneration.created_at.desc()).first()
    if code_gen:
        code_gen.github_branch = branch_name
        db.commit()
        db.refresh(code_gen)
        return {"message": "Branch registered to existing code generation", "task_id": task_id, "branch": branch_name, "code_generation_id": code_gen.id}
    new_code_gen = CodeGeneration(
        task_id=task_id,
        specification_id=spec.id,
        github_branch=branch_name,
        status=CodeGenerationStatus.GENERATING
    )
    db.add(new_code_gen)
    db.commit()
    db.refresh(new_code_gen)
    return {"message": "Branch registered to task", "task_id": task_id, "branch": branch_name, "code_generation_id": new_code_gen.id}


async def trigger_github_workflow(
    github_service: GitHubService,
    task_id: str,
    spec_id: str,
    branch_name: str
):
    """Helper function to trigger GitHub Actions workflow"""
    await github_service.trigger_workflow(
        "ai-code-generation.yml",
        "main",
        {
            "task_id": task_id,
            "spec_id": spec_id,
            "branch_name": branch_name
        }
    )


@router.post("/webhook")
async def github_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle GitHub webhooks"""
    try:
        # Get payload
        payload = await request.json()
        action = payload.get("action")
        
        # Handle different event types based on headers
        event_type = request.headers.get("X-GitHub-Event")
        
        print(f"🔔 GitHub Webhook Received: event_type={event_type}, action={action}")
        print(f"   Payload keys: {list(payload.keys())[:10]}...")  # Show first 10 keys
        
        # Get repository info - GitHub webhook payload structure varies by event type
        repository = payload.get("repository", {})
        # For workflow_run events, repository is nested inside workflow_run
        if event_type == "workflow_run":
            workflow_run = payload.get("workflow_run", {})
            if workflow_run:
                # workflow_run events have repository nested inside workflow_run
                repository = workflow_run.get("repository", {}) or payload.get("repository", {})
                print(f"   [DEBUG] workflow_run event - extracted repository from workflow_run")
        
        # Show popup dialog for testing (commented out; uncomment if needed)
        # repo_name = repository.get("full_name", "") if isinstance(repository, dict) else ""
        # show_webhook_popup(event_type or "unknown", action or "unknown", repo_name)
        
        # Create Activity Log entries for webhook events (this creates activities for all tasks in matching projects)
        print("\n[WEBHOOK] Creating activity log entries...")
        try:
            await log_webhook_to_activity(db, event_type, action, payload, repository or {})
            print("[WEBHOOK] ✅ Activity log creation completed")
        except Exception as activity_error:
            print(f"[WEBHOOK] ❌ ERROR creating activity log: {activity_error}")
            import traceback
            traceback.print_exc()
            # Don't fail the webhook if activity log fails - notifications are more important
            # But log the error so we can debug
        
        # Create notification for webhook event
        try:
            logger.info(f"[WEBHOOK] Creating notifications for webhook event: event_type={event_type}, action={action}")
            await notify_webhook_event(db, event_type, action, payload)
            logger.info(f"[WEBHOOK] ✅ Notification creation completed for event: event_type={event_type}, action={action}")
        except Exception as notify_error:
            logger.error(f"[WEBHOOK] ❌ ERROR creating notification: {notify_error}", exc_info=True)
            # Continue processing even if notification fails
        
        # Handle specific event types (for updating PipelineExecution, CodeGeneration, etc.)
        if event_type == "pull_request":
            print(f"📋 Processing pull_request event...")
            await handle_pull_request_event(payload, db)
        elif event_type == "workflow_run":
            print(f"⚙️ Processing workflow_run event...")
            await handle_workflow_run_event(payload, db)
        elif event_type == "push":
            print(f"📤 Processing push event...")
            await handle_push_event(payload, db)
        else:
            print(f"⚠️ Unknown event type: {event_type}, skipping handler")
        
        return {
            "message": "Webhook processed",
            "event_type": event_type,
            "action": action
        }
    except Exception as e:
        print(f"❌ Error processing GitHub webhook: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing webhook"
        )


async def handle_pull_request_event(payload: dict, db: Session):
    """Handle GitHub pull request events"""
    action = payload.get("action")
    pull_request = payload.get("pull_request", {})
    pr_number = pull_request.get("number")
    pr_url = pull_request.get("html_url")
    branch = pull_request.get("head", {}).get("ref")
    
    # Find code generation by branch
    code_gen = db.query(CodeGeneration).filter(
        CodeGeneration.github_branch == branch
    ).first()
    
    if not code_gen:
        print(f"No code generation found for branch {branch}")
        return
    
    # Update based on action
    if action == "opened":
        code_gen.github_pr_number = pr_number
        code_gen.github_pr_url = pr_url
        code_gen.status = CodeGenerationStatus.REVIEW
        
        # Update task
        task = db.query(Task).filter(Task.id == code_gen.task_id).first()
        if task:
            task.current_stage = TaskStage.CODE_REVIEW
        
        print(f"PR #{pr_number} opened for task {code_gen.task_id}")
    
    elif action == "closed" and pull_request.get("merged"):
        code_gen.status = CodeGenerationStatus.MERGED
        
        # Update task
        task = db.query(Task).filter(Task.id == code_gen.task_id).first()
        if task:
            task.current_stage = TaskStage.CD_STAGING
            task.status = TaskStatus.COMPLETED
        
        print(f"PR #{pr_number} merged for task {code_gen.task_id}")
    
    db.commit()


async def handle_workflow_run_event(payload: dict, db: Session):
    """Handle GitHub workflow run events - updates PipelineExecution status"""
    action = payload.get("action")
    workflow_run = payload.get("workflow_run", {})
    run_id = workflow_run.get("id")
    status = workflow_run.get("status")
    conclusion = workflow_run.get("conclusion")
    branch = workflow_run.get("head_branch")
    workflow_name = workflow_run.get("name", "Workflow")
    html_url = workflow_run.get("html_url", "")
    repository = workflow_run.get("repository", {}) or payload.get("repository", {})
    
    print(f"[WORKFLOW_RUN HANDLER] Workflow: {workflow_name}")
    print(f"[WORKFLOW_RUN HANDLER] Run ID: {run_id}")
    print(f"[WORKFLOW_RUN HANDLER] Status: {status}, Conclusion: {conclusion}")
    print(f"[WORKFLOW_RUN HANDLER] Branch: {branch}, Commit: {workflow_run.get('head_sha', 'N/A')[:7] if workflow_run.get('head_sha') else 'N/A'}")
    print(f"[WORKFLOW_RUN HANDLER] URL: {html_url}")
    
    # Update PipelineExecution status if found
    from app.models.workflow import PipelineExecution, PipelineStatus
    
    pipeline_exec = db.query(PipelineExecution).filter(
        PipelineExecution.github_run_id == str(run_id)
    ).first()
    
    if pipeline_exec:
        print(f"[WORKFLOW_RUN HANDLER] ✅ Found PipelineExecution: id={pipeline_exec.id}")
        # Update pipeline execution status
        if conclusion == "success":
            pipeline_exec.status = PipelineStatus.SUCCESS
        elif conclusion == "failure":
            pipeline_exec.status = PipelineStatus.FAILED
        else:
            pipeline_exec.status = PipelineStatus.FAILED  # Default for other conclusions
        pipeline_exec.completed_at = datetime.utcnow()
        db.commit()
        print(f"[WORKFLOW_RUN HANDLER] ✅ Updated PipelineExecution status to {pipeline_exec.status}")
    else:
        print(f"[WORKFLOW_RUN HANDLER] ⚠️  No PipelineExecution found with run_id={run_id}")
    
    # Note: Activity logs are created by log_webhook_to_activity() which is called before this handler
    # This handler only updates PipelineExecution status for workflow tracking


async def handle_push_event(payload: dict, db: Session):
    """Handle GitHub push events"""
    ref = payload.get("ref")
    commits = payload.get("commits", [])
    
    print(f"Push to {ref} with {len(commits)} commits")
