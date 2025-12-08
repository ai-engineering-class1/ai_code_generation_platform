#!/usr/bin/env python3
"""
Test script to verify webhook endpoint is accessible
"""
import requests
import json
import sys

def test_webhook(url):
    """Test webhook endpoint with a sample payload"""
    
    payload = {
        "webhookEvent": "jira:issue_created",
        "issue": {
            "key": "CAP-999",
            "fields": {
                "summary": "Test Issue from Script",
                "description": "This is a test issue created by the test script",
                "issuetype": {"name": "Story"},
                "priority": {"name": "Medium"}
            }
        }
    }
    
    print(f"Testing webhook endpoint: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print()
    
    try:
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Webhook endpoint is accessible and working!")
            return True
        else:
            print(f"❌ Webhook returned error: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to {url}")
        print("   Make sure:")
        print("   1. Backend is running")
        print("   2. URL is correct")
        print("   3. If using tunnel, tunnel is running")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_webhook_endpoint.py <webhook-url>")
        print("Example: python test_webhook_endpoint.py http://localhost:8000/api/v1/jira/webhook")
        print("Example: python test_webhook_endpoint.py https://abc123.ngrok.io/api/v1/jira/webhook")
        sys.exit(1)
    
    url = sys.argv[1]
    success = test_webhook(url)
    sys.exit(0 if success else 1)

