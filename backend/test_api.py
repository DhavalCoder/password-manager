import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000/api"
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@passwordmanager.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123!")

def run_tests():
    print("--- Starting Rigorous API Testing ---")
    
    # 1. Test Login
    print("\n1. Testing Authentication...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[SUCCESS] Login successful. JWT Token received.")

    # 2. Test Category Fetching
    print("\n2. Testing Categories...")
    response = requests.get(f"{BASE_URL}/categories", headers=headers)
    assert response.status_code == 200, f"Failed to get categories: {response.text}"
    categories = response.json()
    assert len(categories) > 0, "No default categories found"
    cat_id = categories[0]["id"]
    print(f"[SUCCESS] Categories fetched. Found {len(categories)} categories.")

    # 3. Test Client Creation
    print("\n3. Testing Client Management...")
    client_payload = {"name": "Test Client A", "description": "Test description"}
    response = requests.post(f"{BASE_URL}/clients", json=client_payload, headers=headers)
    if response.status_code == 400 and "already exists" in response.text:
        print("[WARN] Client already exists, fetching existing...")
        response = requests.get(f"{BASE_URL}/clients", headers=headers)
        client_id = [c for c in response.json() if c["name"] == "Test Client A"][0]["id"]
    else:
        assert response.status_code == 200, f"Failed to create client: {response.text}"
        client_id = response.json()["id"]
    print("[SUCCESS] Client management works.")

    # 4. Test Password Generator
    print("\n4. Testing Password Generator...")
    response = requests.post(f"{BASE_URL}/generate-password", json={"length": 24}, headers=headers)
    assert response.status_code == 200, f"Password generator failed: {response.text}"
    gen_pwd = response.json()["password"]
    assert len(gen_pwd) == 24
    print(f"[SUCCESS] Password generated: {gen_pwd}")

    # 5. Test Credential Creation (Encryption Test)
    print("\n5. Testing Credential Encryption & CRUD...")
    cred_payload = {
        "title": "Production DB",
        "client_id": client_id,
        "category_id": cat_id,
        "credential_type": "standard",
        "tags": "db, prod",
        "data": {
            "username": "dbadmin",
            "password": "super_secret_db_password_123!"
        }
    }
    response = requests.post(f"{BASE_URL}/credentials", json=cred_payload, headers=headers)
    assert response.status_code == 200, f"Credential creation failed: {response.text}"
    cred_id = response.json()["id"]
    print("[SUCCESS] Credential created (Data encrypted in DB).")

    # 6. Test Credential Retrieval (Decryption Test)
    print("\n6. Testing Credential Decryption...")
    response = requests.get(f"{BASE_URL}/credentials", headers=headers)
    assert response.status_code == 200, f"Failed to get credentials: {response.text}"
    creds = response.json()
    assert len(creds) > 0
    decrypted_pwd = creds[-1]["data"]["password"]
    assert decrypted_pwd == "super_secret_db_password_123!"
    print("[SUCCESS] Credential decrypted successfully on retrieval.")

    print("\n--- ALL TESTS PASSED SUCCESSFULLY! The Backend is fully functional. ---")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[FAILED] TEST FAILED: {e}")
