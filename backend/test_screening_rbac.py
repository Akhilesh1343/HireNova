import urllib.request
import urllib.error
import json
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def get_token(email, pwd):
    req = urllib.request.Request(
        f"{BASE_URL}/auth/login",
        data=json.dumps({"email": email, "password": pwd}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())["access_token"]

admin_tok = get_token("admin@talentai.com", "admin123")
recruiter_tok = get_token("recruiter@talentai.com", "recruiter123")
manager_tok = get_token("hiring.manager@talentai.com", "manager123")
hr_tok = get_token("hr.lead@talentai.com", "hrlead123")

def create_multipart_body(fields, files):
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    body = bytearray()
    
    for k, v in fields.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode("utf-8"))
        body.extend(f"{v}\r\n".encode("utf-8"))
        
    for name, (filename, content, content_type) in files.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode("utf-8"))
        body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
        body.extend(content)
        body.extend(b"\r\n")
        
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))
    content_type = f"multipart/form-data; boundary={boundary}"
    return bytes(body), content_type

def test_screen_rbac(role_name, token):
    fields = {
        "job_description": "We are seeking a Python backend engineer with SQL and Git experience.",
        "job_title": "Backend Python Developer"
    }
    resume_text = "John Doe\nPython Developer with 5 years experience in Django, SQL, PostgreSQL, REST APIs, Git."
    files = {
        "file": ("resume.txt", resume_text.encode("utf-8"), "text/plain")
    }
    
    data, content_type = create_multipart_body(fields, files)
    
    req = urllib.request.Request(
        f"{BASE_URL}/screen-resume",
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": content_type
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        try:
            parsed = json.loads(err_msg)
        except Exception:
            parsed = {"raw": err_msg}
        return e.code, parsed

print("--- Testing /api/screen-resume Role Permissions ---")

# 1. Admin -> Allowed (200)
st, res = test_screen_rbac("ADMIN", admin_tok)
print(f"  [*] ADMIN: HTTP {st}")
assert st == 200, f"Expected 200 for Admin screening, got {st}"
print(f"  [PASS] ADMIN successfully screened resume. ATS Score: {res.get('ats_score')}%")

# 2. Recruiter -> Allowed (200)
st, res = test_screen_rbac("RECRUITER", recruiter_tok)
print(f"  [*] RECRUITER: HTTP {st}")
assert st == 200, f"Expected 200 for Recruiter screening, got {st}"
print(f"  [PASS] RECRUITER successfully screened resume. ATS Score: {res.get('ats_score')}%")

# 3. Hiring Manager -> 403 Forbidden
st, res = test_screen_rbac("HIRING_MANAGER", manager_tok)
print(f"  [*] HIRING MANAGER: HTTP {st} -> {res.get('detail')}")
assert st == 403, f"Expected 403 for Hiring Manager screening, got {st}"
print("  [PASS] HIRING MANAGER is strictly forbidden from screening resumes (HTTP 403).")

# 4. HR Lead -> 403 Forbidden
st, res = test_screen_rbac("HR_LEAD", hr_tok)
print(f"  [*] HR LEAD: HTTP {st} -> {res.get('detail')}")
assert st == 403, f"Expected 403 for HR Lead screening, got {st}"
print("  [PASS] HR LEAD is strictly forbidden from screening resumes (HTTP 403).")

print("\nALL SCREENING RBAC CHECKS PASSED PERFECTLY!")
