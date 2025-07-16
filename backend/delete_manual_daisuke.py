import requests
import json

# ログイン (daisukeユーザーで試す)
login_data = {
    "username": "daisuke",
    "password": "test123",
    "grant_type": "password"
}

response = requests.post("http://localhost:8000/api/auth/token", data=login_data)
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
        print(f"Response: {delete_response.json()}")
    else:
        print(f"Delete failed: {delete_response.text}")
else:
    print(f"Login failed: {response.text}")
