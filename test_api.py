#!/usr/bin/env python3
"""Test script to check what users are in the database"""

import requests
import json

def test_users_api():
    base_url = "http://127.0.0.1:8001/api"
    
    try:
        # Test getting all users
        print("Fetching all users...")
        response = requests.get(f"{base_url}/users/list")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            users = data.get('users', [])
            print(f"Number of users: {len(users)}")
            for i, user in enumerate(users):
                print(f"User {i+1}:")
                print(f"  ID: {user.get('id', 'N/A')}")
                print(f"  Username: {user.get('username', 'N/A')}")
                print(f"  Full Name: {user.get('full_name', 'N/A')}")
                print(f"  Email: {user.get('email', 'N/A')}")
                print()
        else:
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the backend server. Make sure it's running on port 8001.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_users_api()