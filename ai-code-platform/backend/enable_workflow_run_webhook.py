#!/usr/bin/env python3
"""
Quick script to enable workflow_run events on an existing GitHub webhook.
"""
import requests
import os
import sys

GITHUB_API_BASE = "https://api.github.com"

def load_env_var(key: str) -> str:
    """Load a variable from .env file"""
    env_file = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_file):
        try:
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith(f'{key}='):
                        return line.split('=', 1)[1].strip().strip('"').strip("'")
        except Exception as e:
            print(f"Error reading .env file: {e}")
    return None

def get_webhooks(owner: str, repo: str, token: str):
    """Get all webhooks for the repository"""
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
            return response.json()
        else:
            print(f"[ERROR] Failed to get webhooks: {response.status_code}")
            return []
    except Exception as e:
        print(f"[ERROR] Error getting webhooks: {e}")
        return []

def update_webhook_events(owner: str, repo: str, hook_id: int, token: str, events: list):
    """Update webhook events"""
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    payload = {
        "events": events
    }
    
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

def main():
    print("=" * 60)
    print("Enable workflow_run Events on GitHub Webhook")
    print("=" * 60)
    print()
    
    # Load GitHub token from .env
    github_token = load_env_var("GITHUB_TOKEN")
    if not github_token:
        print("[ERROR] GITHUB_TOKEN not found in .env file")
        print("Please add GITHUB_TOKEN=your_token to your .env file")
        sys.exit(1)
    
    # Get repository from .env or prompt
    repo = load_env_var("GITHUB_REPO") or "SueSong/DR_LIN_CLASS_EXERCISES"
    
    if '/' not in repo:
        print(f"[ERROR] Invalid repository format: {repo}")
        print("Please use format: owner/repo")
        sys.exit(1)
    
    owner, repo_name = repo.split('/', 1)
    
    print(f"[INFO] Repository: {owner}/{repo_name}")
    print()
    
    # Get webhooks
    print("Finding webhooks...")
    webhooks = get_webhooks(owner, repo_name, github_token)
    
    if not webhooks:
        print("[ERROR] No webhooks found for this repository")
        print("Please create a webhook first using create_github_webhook.py")
        sys.exit(1)
    
    print(f"\nFound {len(webhooks)} webhook(s):")
    for i, hook in enumerate(webhooks, 1):
        hook_url = hook['config'].get('url', 'N/A')
        events = hook.get('events', [])
        print(f"  {i}. ID: {hook['id']}, URL: {hook_url}")
        print(f"     Current events: {', '.join(events) if events else 'All events'}")
        
        if 'workflow_run' in events:
            print(f"     ✓ workflow_run is already enabled!")
        else:
            print(f"     ⚠️  workflow_run is NOT enabled")
    
    # If only one webhook, update it automatically
    if len(webhooks) == 1:
        hook = webhooks[0]
        hook_id = hook['id']
        current_events = hook.get('events', [])
        
        if 'workflow_run' in current_events:
            print("\n✓ workflow_run events are already enabled!")
            sys.exit(0)
        
        # Add workflow_run to events if not present
        new_events = list(current_events) if current_events else []
        if 'workflow_run' not in new_events:
            new_events.append('workflow_run')
        
        print(f"\nUpdating webhook {hook_id} to enable workflow_run events...")
        print(f"New events: {', '.join(new_events)}")
        
        result = update_webhook_events(owner, repo_name, hook_id, github_token, new_events)
        if result:
            print("\n✅ Success! workflow_run events are now enabled.")
            print("\nNext steps:")
            print("1. Wait for a workflow to run (or trigger one)")
            print("2. Check your backend logs for workflow_run webhook events")
            print("3. Check the Activity Log page for workflow failure entries")
        else:
            print("\n❌ Failed to update webhook. Please check the error above.")
    else:
        # Multiple webhooks - ask which one to update
        hook_id_input = input(f"\nEnter webhook ID to update (1-{len(webhooks)}): ").strip()
        try:
            hook_index = int(hook_id_input) - 1
            if hook_index < 0 or hook_index >= len(webhooks):
                print("Invalid webhook number")
                sys.exit(1)
            
            hook = webhooks[hook_index]
            hook_id = hook['id']
            current_events = hook.get('events', [])
            
            if 'workflow_run' in current_events:
                print("\n✓ workflow_run events are already enabled for this webhook!")
                sys.exit(0)
            
            # Add workflow_run to events if not present
            new_events = list(current_events) if current_events else []
            if 'workflow_run' not in new_events:
                new_events.append('workflow_run')
            
            print(f"\nUpdating webhook {hook_id} to enable workflow_run events...")
            print(f"New events: {', '.join(new_events)}")
            
            result = update_webhook_events(owner, repo_name, hook_id, github_token, new_events)
            if result:
                print("\n✅ Success! workflow_run events are now enabled.")
                print("\nNext steps:")
                print("1. Wait for a workflow to run (or trigger one)")
                print("2. Check your backend logs for workflow_run webhook events")
                print("3. Check the Activity Log page for workflow failure entries")
            else:
                print("\n❌ Failed to update webhook. Please check the error above.")
        except ValueError:
            print("Invalid input. Please enter a number.")
            sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        sys.exit(1)

