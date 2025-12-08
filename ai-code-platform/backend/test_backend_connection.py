#!/usr/bin/env python3
"""
Quick test to check if backend is running and responding
"""
import requests
import sys

BACKEND_URL = "http://127.0.0.1:8000"

def test_backend():
    print(f"Testing backend at {BACKEND_URL}...")
    
    # Test 1: Health check
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ Health check passed: {response.json()}")
        else:
            print(f"❌ Health check failed: Status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to backend at {BACKEND_URL}")
        print("   Backend is not running or not accessible")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ Backend timeout - server is not responding")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test 2: Root endpoint
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=5)
        if response.status_code == 200:
            print(f"✅ Root endpoint works: {response.json()}")
        else:
            print(f"⚠️  Root endpoint returned: {response.status_code}")
    except Exception as e:
        print(f"⚠️  Root endpoint error: {e}")
    
    # Test 3: API docs
    try:
        response = requests.get(f"{BACKEND_URL}/docs", timeout=5)
        if response.status_code == 200:
            print(f"✅ API docs accessible")
        else:
            print(f"⚠️  API docs returned: {response.status_code}")
    except Exception as e:
        print(f"⚠️  API docs error: {e}")
    
    print("\n✅ Backend is running and responding!")
    return True

if __name__ == "__main__":
    success = test_backend()
    sys.exit(0 if success else 1)

