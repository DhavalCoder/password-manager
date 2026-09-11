import sys

with open('app/api/routes/credentials.py', 'r') as f:
    lines = f.readlines()

def find_line(pattern):
    for i, line in enumerate(lines):
        if pattern in line:
            return i
    return -1

export_start = find_line('# Export: GET /api/credentials/export')
history_start = find_line('# History: GET /api/credentials/{cred_id}/history')

export_import_lines = lines[export_start:history_start]
del lines[export_start:history_start]

get_cred_id = find_line('@router.get("/{cred_id}", response_model=CredentialResponse)')
# go back to the top of that route definition
get_cred_id -= 1

lines = lines[:get_cred_id] + export_import_lines + lines[get_cred_id:]

with open('app/api/routes/credentials.py', 'w') as f:
    f.writelines(lines)
