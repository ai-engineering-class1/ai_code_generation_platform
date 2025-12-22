#!/usr/bin/env python3
"""
Automated script to create GitHub webhook using values from .env file.
"""
import requests
import os
import sys

GITHUB_API_BASE = "https://api.github.com"
WEBHOOK_URL = "https://nonrationalized-merri-hydroponically.ngrok-free.dev/api/v1/github/webhook"
REPO = "SueSong/DR_LIN_CLASS_EXERCISES"  # Change this if needed

def load_env_var(key: str) -> str:
    """Load a variable from .env file"""
    env_file = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_file):
        try:
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith(f'{key}='):
                        return line.split('=', 1)[1].strip()
        except Exception as e:
            print(f"Error reading .env file: {e}")
    return None

def test_github_api(token: str) -> bool:
    """Test GitHub API connection"""
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    try:
        response = requests.get(f"{GITHUB_API_BASE}/user", headers=headers, timeout=10)
        if response.status_code == 200:
            user_info = response.json()
            print(f"[OK] Connected to GitHub as: {user_info.get('login')}")
            return True
        else:
            print(f"[ERROR] GitHub API connection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"[ERROR] Error connecting to GitHub: {e}")
        return False

def list_webhooks(owner: str, repo: str, token: str):
    """List existing webhooks"""
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
            return webhooks
        else:
            print(f"[ERROR] Failed to list webhooks: {response.status_code}")
            return []
    except Exception as e:
        print(f"[ERROR] Error listing webhooks: {e}")
        return []

def create_webhook(owner: str, repo: str, token: str, webhook_url: str):
    """Create a new webhook"""
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    payload = {
        "name": "web",
        "active": True,
        "events": ["pull_request", "workflow_run", "push"],
        "config": {
            "url": webhook_url,
            "content_type": "json"
        }
    }
    
    try:
        response = requests.post(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/hooks",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 201:
            webhook = response.json()
            print(f"[SUCCESS] Webhook created successfully!")
            print(f"  ID: {webhook['id']}")
            print(f"  URL: {webhook['config']['url']}")
            print(f"  Events: {', '.join(webhook['events'])}")
            return webhook
        else:
            print(f"[ERROR] Failed to create webhook: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"[ERROR] Error creating webhook: {e}")
        return None

def main():
    print("=" * 60)
    print("Automated GitHub Webhook Creation")
    print("=" * 60)
    print()
    
    # Load GitHub token from .env
    github_token = load_env_var("GITHUB_TOKEN")
    if not github_token:
        print("[ERROR] GITHUB_TOKEN not found in .env file")
        sys.exit(1)
    
    print(f"[INFO] Loaded GitHub token from .env")
    print(f"[INFO] Repository: {REPO}")
    print(f"[INFO] Webhook URL: {WEBHOOK_URL}")
    print()
    
    # Test GitHub API
    if not test_github_api(github_token):
        print("\n[ERROR] Failed to connect to GitHub")
        sys.exit(1)
    
    # Parse repository
    if '/' not in REPO:
        print(f"[ERROR] Invalid repository format: {REPO}")
        sys.exit(1)
    
    owner, repo = REPO.split('/', 1)
    
    # List existing webhooks
    print("\n" + "=" * 60)
    print("Checking Existing Webhooks")
    print("=" * 60)
    webhooks = list_webhooks(owner, repo, github_token)
    
    if webhooks:
        print(f"\nFound {len(webhooks)} existing webhook(s):")
        for i, hook in enumerate(webhooks, 1):
            hook_url = hook['config'].get('url', 'N/A')
            is_same = hook_url == WEBHOOK_URL
            status = "[MATCH]" if is_same else "[DIFFERENT]"
            print(f"  {i}. ID: {hook['id']}, URL: {hook_url} {status}")
        
        # Check if webhook with same URL already exists
        existing = next((h for h in webhooks if h['config'].get('url') == WEBHOOK_URL), None)
        if existing:
            print(f"\n[INFO] Webhook with this URL already exists (ID: {existing['id']})")
            print("[INFO] No action needed.")
            return
    
    # Create webhook
    print("\n" + "=" * 60)
    print("Creating New Webhook")
    print("=" * 60)
    result = create_webhook(owner, repo, github_token, WEBHOOK_URL)
    
    if result:
        print("\n" + "=" * 60)
        print("Summary")
        print("=" * 60)
        print(f"Repository: {REPO}")
        print(f"Webhook URL: {WEBHOOK_URL}")
        print("\n[SUCCESS] Webhook is now set up!")
        print("\nNext steps:")
        print("1. Create a PR or push code to test the webhook")
        print("2. Check your backend logs for webhook events")
        print("3. Check GitHub webhook delivery logs:")
        print(f"   https://github.com/{REPO}/settings/hooks")
    else:
        print("\n[ERROR] Failed to create webhook")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        sys.exit(1)
