#!/usr/bin/env python3
"""
Test CORS configuration
"""
import requests

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_ORIGIN = "http://localhost:3012"

def test_cors():
    print(f"Testing CORS from {FRONTEND_ORIGIN} to {BACKEND_URL}...")
    
    # Simulate a browser request with Origin header
    headers = {
        "Origin": FRONTEND_ORIGIN,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization,content-type",
    }
    
    # Test OPTIONS preflight
    try:
        response = requests.options(
            f"{BACKEND_URL}/api/v1/projects/test/tasks/test",
            headers=headers,
            timeout=5
        )
        print(f"\nOPTIONS Preflight:")
        print(f"  Status: {response.status_code}")
        print(f"  Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
        print(f"  Access-Control-Allow-Methods: {response.headers.get('Access-Control-Allow-Methods', 'NOT SET')}")
        print(f"  Access-Control-Allow-Headers: {response.headers.get('Access-Control-Allow-Headers', 'NOT SET')}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test actual GET request
    try:
        response = requests.get(
            f"{BACKEND_URL}/health",
            headers={"Origin": FRONTEND_ORIGIN},
            timeout=5
        )
        print(f"\nGET Request:")
        print(f"  Status: {response.status_code}")
        print(f"  Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
        print(f"  Response: {response.json()}")
    except Exception as e:
        print(f"  Error: {e}")

if __name__ == "__main__":
    test_cors()

