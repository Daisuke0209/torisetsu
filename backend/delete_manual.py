import requests
import json

# ログイン
login_data = {
    "username": "testuser",
    "password": "testpass123"
}

response = requests.post("http://localhost:8000/api/auth/login", data=login_data)
print(f"Login response: {response.status_code}")

if response.status_code == 200:
    token = response.json()["access_token"]
    print(f"Token obtained: {token[:20]}...")
    
    # マニュアル削除
    headers = {"Authorization": f"Bearer {token}"}
    manual_id = "607516bd-8e31-4e09-b58f-75d741fd1ce9"
    
    delete_response = requests.delete(
        f"http://localhost:8000/api/manuals/{manual_id}",
        headers=headers
    )
    
    print(f"\nDelete response: {delete_response.status_code}")
    if delete_response.status_code == 200:
        print("Manual deleted successfully")
    else:
        print(f"Delete failed: {delete_response.text}")
else:
    print(f"Login failed: {response.text}")
