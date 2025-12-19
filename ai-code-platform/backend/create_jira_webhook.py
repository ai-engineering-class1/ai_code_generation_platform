#!/usr/bin/env python3
"""
Script to help create and test Jira webhooks via command line.
Note: Jira Cloud doesn't have a public API for creating webhooks,
but this script helps with testing and provides the exact URL to use.
"""
import requests
import base64
import json
import sys
from getpass import getpass

def test_webhook_endpoint(webhook_url: str) -> bool:
    """Test if webhook endpoint is accessible"""
    print("=" * 50)
    print("Testing Webhook Endpoint")
    print("=" * 50)
    print(f"URL: {webhook_url}")
    
    try:
        response = requests.get(webhook_url, timeout=10)
        if response.status_code == 200:
            print("✓ Webhook endpoint is accessible")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"✗ Webhook endpoint returned: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error testing webhook: {e}")
        return False

def test_jira_api(jira_url: str, email: str, api_token: str) -> bool:
    """Test Jira API connection"""
    print("\n" + "=" * 50)
    print("Testing Jira API Connection")
    print("=" * 50)
    
    # Create Basic auth header
    credentials = f"{email}:{api_token}"
    encoded_credentials = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
    
    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Accept": "application/json"
    }
    
    try:
        response = requests.get(
            f"{jira_url}/rest/api/3/myself",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            user_info = response.json()
            print("✓ Jira API connection successful")
            print(f"Connected as: {user_info.get('displayName')} ({user_info.get('emailAddress')})")
            return True
        else:
            print(f"✗ Jira API connection failed: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False
    except Exception as e:
        print(f"✗ Error connecting to Jira: {e}")
        return False

def print_webhook_instructions(webhook_url: str, jira_url: str):
    """Print instructions for creating webhook in Jira UI"""
    print("\n" + "=" * 50)
    print("Webhook Configuration for Jira UI")
    print("=" * 50)
    print("\nSince Jira Cloud doesn't have a public API for creating webhooks,")
    print("you need to create it manually in the Jira UI:\n")
    print(f"1. Go to: {jira_url}/plugins/servlet/webhooks")
    print("   OR")
    print("   Go to your project → Project Settings → Webhooks\n")
    print("2. Click 'Create a webhook' or 'Add webhook'\n")
    print("3. Use these settings:")
    print("   Name: AI Code Platform Webhook")
    print(f"   URL: {webhook_url}")
    print("   Status: Enabled")
    print("   Events:")
    print("     ✓ Issue created")
    print("     ✓ Issue updated")
    print("     ✓ Issue deleted\n")
    print("4. Click 'Create' or 'Save'\n")
    
    print("=" * 50)
    print("Testing Webhook (after creation)")
    print("=" * 50)
    print("\nAfter creating the webhook in Jira, test it with:\n")
    test_payload = {
        "webhookEvent": "jira:issue_created",
        "issue": {"key": "TEST-1"}
    }
    print(f"curl -X POST '{webhook_url}' \\")
    print("  -H 'Content-Type: application/json' \\")
    print(f"  -d '{json.dumps(test_payload)}'")
    print()

def main():
    print("=" * 50)
    print("Jira Webhook Setup Helper")
    print("=" * 50)
    print()
    
    # Get inputs
    jira_url = input("Enter your Jira URL (e.g., https://your-domain.atlassian.net): ").strip()
    jira_email = input("Enter your Jira email: ").strip()
    jira_token = getpass("Enter your Jira API token: ")
    webhook_url = input("Enter your webhook URL (e.g., https://abc123.ngrok.io/api/v1/jira/webhook): ").strip()
    
    # Test webhook endpoint
    webhook_ok = test_webhook_endpoint(webhook_url)
    
    # Test Jira API
    jira_ok = test_jira_api(jira_url, jira_email, jira_token)
    
    # Print instructions
    print_webhook_instructions(webhook_url, jira_url)
    
    # Summary
    print("=" * 50)
    print("Summary")
    print("=" * 50)
    if webhook_ok and jira_ok:
        print("✓ All tests passed! You can now create the webhook in Jira UI.")
    elif webhook_ok:
        print("⚠ Webhook endpoint is accessible, but Jira API connection failed.")
        print("  Check your Jira credentials and API token.")
    elif jira_ok:
        print("⚠ Jira API connection works, but webhook endpoint is not accessible.")
        print("  Make sure your backend is running and ngrok is active.")
    else:
        print("✗ Both tests failed. Please check:")
        print("  1. Backend is running on port 8000")
        print("  2. ngrok is running and forwarding to port 8000")
        print("  3. Jira credentials are correct")
        print("  4. Jira API token is valid")
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        sys.exit(1)

