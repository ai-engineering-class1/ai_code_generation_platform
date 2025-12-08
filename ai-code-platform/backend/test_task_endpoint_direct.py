#!/usr/bin/env python3
"""
Test the specific task endpoint that's failing
"""
import requests
import sys

BACKEND_URL = "http://127.0.0.1:8000"
PROJECT_ID = "2de6763a-e1f5-4f2e-9251-bda3bf2f0f0d"
TASK_ID = "1816efb7-e5da-4d51-abd1-9bbce01327d4"

def test_task_endpoint():
    print(f"Testing task endpoint...")
    print(f"  Project ID: {PROJECT_ID}")
    print(f"  Task ID: {TASK_ID}")
    print()
    
    # First, try without auth (should fail with 401)
    print("1. Testing without authentication:")
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/v1/projects/{PROJECT_ID}/tasks/{TASK_ID}",
            headers={"Origin": "http://localhost:3012"},
            timeout=5
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ✅ Correctly requires authentication")
        else:
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    print("2. Testing with dummy token (should fail with 401 or 403):")
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/v1/projects/{PROJECT_ID}/tasks/{TASK_ID}",
            headers={
                "Origin": "http://localhost:3012",
                "Authorization": "Bearer dummy-token"
            },
            timeout=5
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    print("3. Checking CORS headers:")
    try:
        response = requests.options(
            f"{BACKEND_URL}/api/v1/projects/{PROJECT_ID}/tasks/{TASK_ID}",
            headers={
                "Origin": "http://localhost:3012",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
            timeout=5
        )
        print(f"   Status: {response.status_code}")
        print(f"   Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
        print(f"   Access-Control-Allow-Methods: {response.headers.get('Access-Control-Allow-Methods', 'NOT SET')}")
        print(f"   Access-Control-Allow-Headers: {response.headers.get('Access-Control-Allow-Headers', 'NOT SET')}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_task_endpoint()

