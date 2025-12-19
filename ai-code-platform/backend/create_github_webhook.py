#!/usr/bin/env python3
"""
Script to create, list, update, and manage GitHub webhooks via GitHub API.
"""
import requests
import json
import sys
import os
from getpass import getpass
from typing import Optional, Dict, List

GITHUB_API_BASE = "https://api.github.com"

def load_github_token_from_env() -> Optional[str]:
    """Try to load GitHub token from .env file"""
    env_file = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_file):
        try:
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('GITHUB_TOKEN='):
                        token = line.split('=', 1)[1].strip()
                        if token:
                            return token
        except Exception:
            pass
    return None

def test_webhook_endpoint(webhook_url: str) -> bool:
    """Test if webhook endpoint is accessible"""
    print("=" * 50)
    print("Testing Webhook Endpoint")
    print("=" * 50)
    print(f"URL: {webhook_url}")
    
    try:
        # Test with a simple GET request
        response = requests.get(webhook_url, timeout=10)
        if response.status_code in [200, 404, 405]:  # 405 is OK (method not allowed for GET)
            print("✓ Webhook endpoint is accessible")
            return True
        else:
            print(f"⚠ Webhook endpoint returned: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error testing webhook: {e}")
        return False

def test_github_api(token: str) -> Optional[Dict]:
    """Test GitHub API connection and return user info"""
    print("\n" + "=" * 50)
    print("Testing GitHub API Connection")
    print("=" * 50)
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    try:
        response = requests.get(
            f"{GITHUB_API_BASE}/user",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            user_info = response.json()
            print("✓ GitHub API connection successful")
            print(f"Connected as: {user_info.get('login')} ({user_info.get('name', 'N/A')})")
            return user_info
        else:
            print(f"✗ GitHub API connection failed: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return None
    except Exception as e:
        print(f"✗ Error connecting to GitHub: {e}")
        return None

def list_webhooks(owner: str, repo: str, token: str) -> List[Dict]:
    """List all webhooks for a repository"""
    print("\n" + "=" * 50)
    print("Listing Existing Webhooks")
    print("=" * 50)
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    try:
        response = requests.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/hooks",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            webhooks = response.json()
            if webhooks:
                print(f"Found {len(webhooks)} webhook(s):\n")
                for i, hook in enumerate(webhooks, 1):
                    print(f"{i}. ID: {hook['id']}")
                    print(f"   URL: {hook['config'].get('url', 'N/A')}")
                    print(f"   Active: {hook['active']}")
                    print(f"   Events: {', '.join(hook.get('events', []))}")
                    print(f"   Created: {hook.get('created_at', 'N/A')}")
                    print()
            else:
                print("No webhooks found.")
            return webhooks
        else:
            print(f"✗ Failed to list webhooks: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return []
    except Exception as e:
        print(f"✗ Error listing webhooks: {e}")
        return []

def create_webhook(owner: str, repo: str, token: str, webhook_url: str, 
                   events: List[str] = None, secret: str = None) -> Optional[Dict]:
    """Create a new webhook"""
    print("\n" + "=" * 50)
    print("Creating GitHub Webhook")
    print("=" * 50)
    
    if events is None:
        events = ["pull_request", "workflow_run", "push"]
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    payload = {
        "name": "web",
        "active": True,
        "events": events,
        "config": {
            "url": webhook_url,
            "content_type": "json"
        }
    }
    
    if secret:
        payload["config"]["secret"] = secret
    
    try:
        response = requests.post(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/hooks",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 201:
            webhook = response.json()
            print("✓ Webhook created successfully!")
            print(f"   ID: {webhook['id']}")
            print(f"   URL: {webhook['config']['url']}")
            print(f"   Events: {', '.join(webhook['events'])}")
            return webhook
        else:
            print(f"✗ Failed to create webhook: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"✗ Error creating webhook: {e}")
        return None

def update_webhook(owner: str, repo: str, token: str, hook_id: int, 
                   webhook_url: str = None, events: List[str] = None,
                   active: bool = None) -> Optional[Dict]:
    """Update an existing webhook"""
    print("\n" + "=" * 50)
    print("Updating GitHub Webhook")
    print("=" * 50)
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    payload = {}
    
    if webhook_url:
        payload["config"] = {"url": webhook_url, "content_type": "json"}
    if events:
        payload["events"] = events
    if active is not None:
        payload["active"] = active
    
    try:
        response = requests.patch(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/hooks/{hook_id}",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            webhook = response.json()
            print("✓ Webhook updated successfully!")
            print(f"   ID: {webhook['id']}")
            print(f"   URL: {webhook['config']['url']}")
            print(f"   Events: {', '.join(webhook['events'])}")
            return webhook
        else:
            print(f"✗ Failed to update webhook: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"✗ Error updating webhook: {e}")
        return None

def delete_webhook(owner: str, repo: str, token: str, hook_id: int) -> bool:
    """Delete a webhook"""
    print("\n" + "=" * 50)
    print("Deleting GitHub Webhook")
    print("=" * 50)
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    try:
        response = requests.delete(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/hooks/{hook_id}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 204:
            print(f"✓ Webhook {hook_id} deleted successfully!")
            return True
        else:
            print(f"✗ Failed to delete webhook: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error deleting webhook: {e}")
        return False

def check_repo_access(owner: str, repo: str, token: str) -> bool:
    """Check if user has access to the repository"""
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    try:
        response = requests.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            repo_info = response.json()
            permissions = repo_info.get('permissions', {})
            if permissions.get('admin', False):
                print(f"✓ You have admin access to {owner}/{repo}")
                return True
            elif permissions.get('push', False):
                print(f"⚠ You have push access to {owner}/{repo}, but admin access is required for webhooks")
                return False
            else:
                print(f"✗ You don't have sufficient permissions for {owner}/{repo}")
                return False
        else:
            print(f"✗ Repository not found or no access: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error checking repository access: {e}")
        return False

def main():
    print("=" * 50)
    print("GitHub Webhook Management Script")
    print("=" * 50)
    print()
    
    # Get GitHub token - try .env first, then prompt
    github_token = load_github_token_from_env()
    if github_token:
        print("✓ Found GitHub token in .env file")
    else:
        github_token = getpass("Enter your GitHub Personal Access Token: ").strip()
    
    if not github_token:
        print("✗ GitHub token is required")
        sys.exit(1)
    
    # Test GitHub API
    user_info = test_github_api(github_token)
    if not user_info:
        print("\n✗ Failed to connect to GitHub. Please check your token.")
        sys.exit(1)
    
    # Get repository info
    repo_input = input("\nEnter repository (format: owner/repo, e.g., lee-liao/ai_agent_exercises): ").strip()
    if '/' not in repo_input:
        print("✗ Invalid format. Use owner/repo")
        sys.exit(1)
    
    owner, repo = repo_input.split('/', 1)
    
    # Check repository access
    if not check_repo_access(owner, repo, github_token):
        print("\n✗ You need admin access to manage webhooks")
        sys.exit(1)
    
    # Get webhook URL
    webhook_url = input("\nEnter your webhook URL (e.g., https://abc123.ngrok.io/api/v1/github/webhook): ").strip()
    if not webhook_url:
        print("✗ Webhook URL is required")
        sys.exit(1)
    
    # Test webhook endpoint
    test_webhook_endpoint(webhook_url)
    
    # List existing webhooks
    webhooks = list_webhooks(owner, repo, github_token)
    
    # Ask what to do
    print("\n" + "=" * 50)
    print("What would you like to do?")
    print("=" * 50)
    print("1. Create a new webhook")
    print("2. Update an existing webhook")
    print("3. Delete a webhook")
    print("4. Just list webhooks (already done)")
    
    choice = input("\nEnter your choice (1-4): ").strip()
    
    if choice == "1":
        # Create webhook
        events_input = input("\nEnter events (comma-separated, default: pull_request,workflow_run,push): ").strip()
        events = [e.strip() for e in events_input.split(',')] if events_input else ["pull_request", "workflow_run", "push"]
        
        secret = getpass("Enter webhook secret (optional, press Enter to skip): ").strip() or None
        
        create_webhook(owner, repo, github_token, webhook_url, events, secret)
        
    elif choice == "2":
        # Update webhook
        if not webhooks:
            print("\n✗ No webhooks to update")
            sys.exit(1)
        
        hook_id = input(f"\nEnter webhook ID to update (found {len(webhooks)} webhook(s)): ").strip()
        try:
            hook_id = int(hook_id)
        except ValueError:
            print("✗ Invalid webhook ID")
            sys.exit(1)
        
        events_input = input("Enter new events (comma-separated, press Enter to keep current): ").strip()
        events = [e.strip() for e in events_input.split(',')] if events_input else None
        
        new_url = input("Enter new webhook URL (press Enter to keep current): ").strip() or None
        
        update_webhook(owner, repo, github_token, hook_id, new_url, events)
        
    elif choice == "3":
        # Delete webhook
        if not webhooks:
            print("\n✗ No webhooks to delete")
            sys.exit(1)
        
        hook_id = input(f"\nEnter webhook ID to delete (found {len(webhooks)} webhook(s)): ").strip()
        try:
            hook_id = int(hook_id)
        except ValueError:
            print("✗ Invalid webhook ID")
            sys.exit(1)
        
        confirm = input(f"Are you sure you want to delete webhook {hook_id}? (yes/no): ").strip().lower()
        if confirm == "yes":
            delete_webhook(owner, repo, github_token, hook_id)
        else:
            print("Cancelled.")
    
    elif choice == "4":
        print("\n✓ Webhooks listed above")
    
    else:
        print("\n✗ Invalid choice")
        sys.exit(1)
    
    # Summary
    print("\n" + "=" * 50)
    print("Summary")
    print("=" * 50)
    print(f"Repository: {owner}/{repo}")
    print(f"Webhook URL: {webhook_url}")
    print("\nTo test the webhook, you can:")
    print("1. Create a pull request in the repository")
    print("2. Push code to trigger a push event")
    print("3. Check your backend logs for webhook events")
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        sys.exit(1)
