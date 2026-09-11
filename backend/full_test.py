import requests, json

BASE = 'http://localhost:8000'
results = []

def test(name, method, url, expected_status, **kwargs):
    try:
        r = getattr(requests, method)(url, **kwargs)
        ok = r.status_code == expected_status
        results.append((name, ok, r.status_code, expected_status, r.text[:200] if not ok else ''))
        return r
    except Exception as e:
        results.append((name, False, 0, expected_status, str(e)[:200]))
        return None

# 1. Health
test('Health Check', 'get', f'{BASE}/health', 200)

# 2. Login
r = test('Login (admin)', 'post', f'{BASE}/api/auth/login', 200,
    data={'username': 'admin@passwordmanager.com', 'password': 'Admin@123!'},
    headers={'Content-Type': 'application/x-www-form-urlencoded'})
token = r.json().get('access_token') if r and r.status_code == 200 else None
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'} if token else {}

# 3. Wrong password
test('Login (wrong pass)', 'post', f'{BASE}/api/auth/login', 401,
    data={'username': 'admin@passwordmanager.com', 'password': 'wrong'},
    headers={'Content-Type': 'application/x-www-form-urlencoded'})

# 4. /me
test('GET /users/me', 'get', f'{BASE}/api/users/me', 200, headers=headers)

# 5. Users
test('GET /users', 'get', f'{BASE}/api/users', 200, headers=headers)

# 6. Roles
test('GET /users/roles', 'get', f'{BASE}/api/users/roles', 200, headers=headers)

# 7. Dashboard
test('GET /dashboard', 'get', f'{BASE}/api/dashboard', 200, headers=headers)

# 8. Categories
r = test('GET /categories', 'get', f'{BASE}/api/categories', 200, headers=headers)
cat_id = r.json()[0]['id'] if r and r.status_code == 200 and r.json() else None

# 9. Create category
test('POST /categories', 'post', f'{BASE}/api/categories', 200,
    json={'name': 'TestCat', 'description': 'test'}, headers=headers)

# 10. Clients
r = test('GET /clients', 'get', f'{BASE}/api/clients', 200, headers=headers)

# 11. Create client
test('POST /clients', 'post', f'{BASE}/api/clients', 200,
    json={'name': 'Test Client', 'email': 'testclient@test.com'}, headers=headers)

# 12. Credentials
r = test('GET /credentials', 'get', f'{BASE}/api/credentials', 200, headers=headers)

# 13. Create credential
r = test('POST /credentials', 'post', f'{BASE}/api/credentials', 200,
    json={'title': 'Test Cred', 'credential_type': 'login', 'data': {'username': 'u1', 'password': 'p1'}, 'tags': 'test'},
    headers=headers)
new_id = r.json().get('id') if r and r.status_code == 200 else None

# 14. Get single
if new_id:
    test('GET /credentials/{id}', 'get', f'{BASE}/api/credentials/{new_id}', 200, headers=headers)

# 15. Update
if new_id:
    test('PUT /credentials/{id}', 'put', f'{BASE}/api/credentials/{new_id}', 200,
        json={'title': 'Updated', 'credential_type': 'login', 'data': {'username': 'u2', 'password': 'p2'}, 'tags': 'up'},
        headers=headers)

# 16. Export
test('GET /credentials/export', 'get', f'{BASE}/api/credentials/export', 200, headers=headers)

# 17. Import
test('POST /credentials/import', 'post', f'{BASE}/api/credentials/import', 200,
    json={'credentials': [{'title': 'Imported', 'credential_type': 'api_key', 'data': {'api_key': 'abc'}, 'tags': 'imp'}]},
    headers=headers)

# 18. History
if new_id:
    test('GET /credentials/{id}/history', 'get', f'{BASE}/api/credentials/{new_id}/history', 200, headers=headers)

# 19. Shares
if new_id:
    test('GET /credentials/{id}/shares', 'get', f'{BASE}/api/credentials/{new_id}/shares', 200, headers=headers)

# 20. Share
if new_id:
    test('POST share credential', 'post', f'{BASE}/api/credentials/{new_id}/share', 200,
        json={'email': 'share@test.com', 'access_level': 'view_only'}, headers=headers)

# 21. Logs
test('GET /logs', 'get', f'{BASE}/api/logs', 200, headers=headers)

# 22. Password gen
test('GET /generate-password', 'get', f'{BASE}/api/generate-password', 200, headers=headers)

# 23. No auth
test('GET /credentials (no auth)', 'get', f'{BASE}/api/credentials', 401)

# 24. Delete
if new_id:
    test('DELETE /credentials/{id}', 'delete', f'{BASE}/api/credentials/{new_id}', 200, headers=headers)

# Report
print()
print('=' * 70)
print('  PASSWORD MANAGER - FULL API TEST REPORT')
print('=' * 70)
passed = sum(1 for _, ok, *_ in results if ok)
failed = sum(1 for _, ok, *_ in results if not ok)
print(f'  PASSED: {passed}/{len(results)}  |  FAILED: {failed}/{len(results)}')
print('=' * 70)
for name, ok, got, expected, detail in results:
    icon = 'PASS' if ok else 'FAIL'
    print(f'  [{icon}] {name} (got {got}, expected {expected})')
    if not ok and detail:
        print(f'         -> {detail}')
print('=' * 70)
