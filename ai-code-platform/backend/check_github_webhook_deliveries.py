#!/usr/bin/env python3
"""
Script to check GitHub webhook delivery logs via API.
"""
import requests
import os
import sys
import json
from datetime import datetime

GITHUB_API_BASE = "https://api.github.com"
REPO = "SueSong/DR_LIN_CLASS_EXERCISES"

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

def get_webhook_deliveries(owner: str, repo: str, hook_id: int, token: str, limit: int = 10):
    """Get recent webhook deliveries"""
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    try:
        response = requests.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/hooks/{hook_id}/deliveries?per_page={limit}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"[ERROR] Failed to get deliveries: {response.status_code}")
            print(f"Response: {response.text}")
            return []
    except Exception as e:
        print(f"[ERROR] Error getting deliveries: {e}")
        return []

def format_timestamp(timestamp: str) -> str:
    """Format ISO timestamp to readable format"""
    try:
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        return dt.strftime("%Y-%m-%d %H:%M:%S UTC")
    except:
        return timestamp

def print_delivery_summary(delivery: dict):
    """Print a summary of a webhook delivery"""
    delivery_id = delivery.get('id', 'N/A')
    status_code = delivery.get('status_code', 'N/A')
    
    # Handle event field - can be string or dict
    event_data = delivery.get('event', {})
    if isinstance(event_data, dict):
        event = event_data.get('type', 'N/A')
    else:
        event = str(event_data) if event_data else 'N/A'
    
    action = delivery.get('action', 'N/A')
    delivered_at = format_timestamp(delivery.get('delivered_at', ''))
    
    # Status indicator
    if status_code == 200:
        status_icon = "[OK]"
    elif status_code and 400 <= status_code < 500:
        status_icon = "[CLIENT ERROR]"
    elif status_code and status_code >= 500:
        status_icon = "[SERVER ERROR]"
    else:
        status_icon = "[PENDING]"
    
    print(f"\n{status_icon} Delivery ID: {delivery_id}")
    print(f"  Event: {event} (action: {action})")
    print(f"  Status Code: {status_code}")
    print(f"  Delivered At: {delivered_at}")
    
    # Response info
    response = delivery.get('response', {})
    if response:
        response_status = response.get('status_code', 'N/A')
        response_time = response.get('headers', {}).get('x-runtime', 'N/A')
        print(f"  Response Status: {response_status}")
        if response_time != 'N/A':
            print(f"  Response Time: {response_time}ms")

def main():
    print("=" * 60)
    print("GitHub Webhook Delivery Logs")
    print("=" * 60)
    print()
    
    # Load GitHub token from .env
    github_token = load_env_var("GITHUB_TOKEN")
    if not github_token:
        print("[ERROR] GITHUB_TOKEN not found in .env file")
        sys.exit(1)
    
    # Parse repository
    if '/' not in REPO:
        print(f"[ERROR] Invalid repository format: {REPO}")
        sys.exit(1)
    
    owner, repo = REPO.split('/', 1)
    
    print(f"[INFO] Repository: {REPO}")
    print()
    
    # Get webhooks
    print("=" * 60)
    print("Finding Webhooks")
    print("=" * 60)
    webhooks = get_webhooks(owner, repo, github_token)
    
    if not webhooks:
        print("[INFO] No webhooks found for this repository")
        sys.exit(0)
    
    print(f"\nFound {len(webhooks)} webhook(s):")
    for i, hook in enumerate(webhooks, 1):
        hook_url = hook['config'].get('url', 'N/A')
        print(f"  {i}. ID: {hook['id']}, URL: {hook_url}")
    
    # Get deliveries for each webhook
    print("\n" + "=" * 60)
    print("Recent Deliveries (Last 10)")
    print("=" * 60)
    
    for hook in webhooks:
        hook_id = hook['id']
        hook_url = hook['config'].get('url', 'N/A')
        
        print(f"\n--- Webhook ID: {hook_id} ---")
        print(f"URL: {hook_url}")
        
        deliveries = get_webhook_deliveries(owner, repo, hook_id, github_token, limit=10)
        
        if not deliveries:
            print("  No deliveries found (webhook may not have been triggered yet)")
        else:
            print(f"\n  Found {len(deliveries)} recent delivery(ies):")
            for delivery in deliveries:
                print_delivery_summary(delivery)
    
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print("\nTo view more details in GitHub:")
    print(f"  https://github.com/{REPO}/settings/hooks")
    print("\nClick on a webhook to see:")
    print("  - Full request/response payloads")
    print("  - Response headers")
    print("  - Redelivery options")
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        sys.exit(1)
