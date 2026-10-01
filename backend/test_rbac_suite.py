import sys
import json
import urllib.request
import urllib.error
import time

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as err:
        err_content = err.read().decode("utf-8")
        try:
            parsed = json.loads(err_content)
        except Exception:
            parsed = {"raw": err_content}
        return err.code, parsed
    except Exception as e:
        return 0, {"error": str(e)}

def run_tests():
    print("==================================================")
    print("RUNNING HIRENOVA RBAC AUDIT & VERIFICATION SUITE")
    print("==================================================")
    
    # 0. Health check
    st, res = make_request("/health")
    print(f"[*] Health Check: HTTP {st} -> {res.get('status')}")
    if st != 200:
        print("[!] Backend is not reachable or healthy on http://127.0.0.1:8000. Aborting.")
        return False
    
    # 1. Login all 4 seed roles (both HireNova accounts and legacy aliases)
    accounts = {
        "admin": ("admin@hirenova.com", "admin123"),
        "recruiter": ("recruiter@hirenova.com", "recruiter123"),
        "hiring_manager": ("manager@hirenova.com", "manager123"),
        "hr_lead": ("hrlead@hirenova.com", "hrlead123")
    }
    
    tokens = {}
    print("\n--- 1. Testing Login & Automatic Role Detection for 4 HireNova Roles ---")
    for role, (email, pwd) in accounts.items():
        st, res = make_request("/auth/login", method="POST", data={"email": email, "password": pwd})
        if st == 200 and "access_token" in res:
            detected_role = res.get("user", {}).get("role")
            tokens[role] = res["access_token"]
            print(f"  [PASS] {role.upper()}: Logged in successfully. Detected Role: '{detected_role}' (Expected: '{role}')")
            assert detected_role == role, f"Role mismatch: {detected_role} != {role}"
        else:
            print(f"  [FAIL] {role.upper()}: Login failed with HTTP {st}: {res}")
            return False
            
    # 2. Registration RBAC tests
    print("\n--- 2. Testing Registration Role Security ---")
    ts = int(time.time())
    
    # 2a. Attempt registering as Admin -> MUST BE 403 FORBIDDEN
    st, res = make_request("/auth/register", method="POST", data={
        "email": f"hacker.admin.{ts}@test.com",
        "password": "Password123!",
        "full_name": "Rogue Admin",
        "role": "admin"
    })
    print(f"  [TEST] Public registration as 'admin': HTTP {st}")
    if st == 403:
        print(f"  [PASS] Public Admin registration blocked with 403 Forbidden: {res.get('detail')}")
    else:
        print(f"  [FAIL] Expected 403 for Admin registration, got HTTP {st}: {res}")
        return False
        
    # 2b. Registering as Recruiter -> Allowed
    st, res = make_request("/auth/register", method="POST", data={
        "email": f"reg.recruiter.{ts}@test.com",
        "password": "Password123!",
        "full_name": "New Recruiter",
        "role": "recruiter"
    })
    if st == 200 and res.get("user", {}).get("role") == "recruiter":
        print(f"  [PASS] Registered Recruiter successfully saved with role: '{res['user']['role']}'")
    else:
        print(f"  [FAIL] Recruiter registration failed: HTTP {st}: {res}")
        return False
        
    # 2c. Registering as Hiring Manager -> Allowed
    st, res = make_request("/auth/register", method="POST", data={
        "email": f"reg.manager.{ts}@test.com",
        "password": "Password123!",
        "full_name": "New Hiring Manager",
        "role": "hiring_manager"
    })
    if st == 200 and res.get("user", {}).get("role") == "hiring_manager":
        print(f"  [PASS] Registered Hiring Manager successfully saved with role: '{res['user']['role']}'")
    else:
        print(f"  [FAIL] Hiring Manager registration failed: HTTP {st}: {res}")
        return False

    # 2d. Registering as HR Lead -> Allowed
    st, res = make_request("/auth/register", method="POST", data={
        "email": f"reg.hrlead.{ts}@test.com",
        "password": "Password123!",
        "full_name": "New HR Lead",
        "role": "hr_lead"
    })
    if st == 200 and res.get("user", {}).get("role") == "hr_lead":
        print(f"  [PASS] Registered HR Lead successfully saved with role: '{res['user']['role']}'")
    else:
        print(f"  [FAIL] HR Lead registration failed: HTTP {st}: {res}")
        return False

    # 3. Endpoint Authorization Verification (403 Forbidden enforcement)
    print("\n--- 3. Testing Backend Protected Endpoint Enforcement (403 Forbidden) ---")
    
    # 3a. /api/users (User Management) - ONLY Admin
    print("  [*] Endpoint: GET /api/users (Admin Only)")
    st, res = make_request("/users", token=tokens["admin"])
    print(f"    - Admin: HTTP {st} (Count: {len(res) if isinstance(res, list) else 0}) [PASS]")
    assert st == 200
    
    for r in ["recruiter", "hiring_manager", "hr_lead"]:
        st, res = make_request("/users", token=tokens[r])
        print(f"    - {r.upper()}: HTTP {st} -> {res.get('detail')}")
        if st != 403:
            print(f"    [FAIL] Expected 403 Forbidden for {r}, got {st}")
            return False
        print(f"    [PASS] {r.upper()} properly blocked with 403 Forbidden.")

    # 3b. /api/activity-logs (Audit Logs) - ONLY Admin
    print("\n  [*] Endpoint: GET /api/activity-logs (Admin Only)")
    st, res = make_request("/activity-logs", token=tokens["admin"])
    print(f"    - Admin: HTTP {st} [PASS]")
    assert st == 200
    
    for r in ["recruiter", "hiring_manager", "hr_lead"]:
        st, res = make_request("/activity-logs", token=tokens[r])
        print(f"    - {r.upper()}: HTTP {st}")
        if st != 403:
            print(f"    [FAIL] Expected 403 Forbidden for {r}, got {st}")
            return False
        print(f"    [PASS] {r.upper()} properly blocked from Activity Logs with 403 Forbidden.")

    # 3c. /api/settings/system (System Settings) - ONLY Admin
    print("\n  [*] Endpoint: GET /api/settings/system (Admin Only)")
    st, res = make_request("/settings/system", token=tokens["admin"])
    print(f"    - Admin: HTTP {st} [PASS]")
    assert st == 200

    for r in ["recruiter", "hiring_manager", "hr_lead"]:
        st, res = make_request("/settings/system", token=tokens[r])
        if st != 403:
            print(f"    [FAIL] Expected 403 Forbidden for {r}, got {st}")
            return False
        print(f"    [PASS] {r.upper()} properly blocked from System Settings with 403 Forbidden.")

    # 3d. DELETE /api/jobs/{id} - ONLY Admin can delete jobs
    print("\n  [*] Endpoint: DELETE /api/jobs/999 (Admin Only)")
    st, res = make_request("/jobs/999", method="DELETE", token=tokens["recruiter"])
    if st != 403:
        print(f"    [FAIL] Expected 403 for Recruiter deleting job, got {st}")
        return False
    print(f"    [PASS] Recruiter delete job blocked with HTTP 403: {res.get('detail')}")

    # 4. Forgot Password Flow Verification
    print("\n--- 4. Testing Forgot Password & Reset Flow ---")
    st, res = make_request("/auth/forgot-password", method="POST", data={"email": "recruiter@talentai.com"})
    print(f"  [*] Request Reset Link: HTTP {st} -> {res.get('message')}")
    assert st == 200
    token = res.get("reset_token")
    if not token:
        print("  [FAIL] Reset token not returned in dev mode response.")
        return False
        
    new_pwd = "NewRecruiterPass123!"
    st, res = make_request("/auth/reset-password", method="POST", data={
        "token": token,
        "new_password": new_pwd,
        "confirm_password": new_pwd
    })
    print(f"  [*] Submit New Password: HTTP {st} -> {res.get('message')}")
    assert st == 200
    
    # Verify login with new password
    st, res = make_request("/auth/login", method="POST", data={"email": "recruiter@talentai.com", "password": new_pwd})
    print(f"  [*] Login with New Password: HTTP {st} -> User Role: {res.get('user', {}).get('role')}")
    assert st == 200
    
    # Restore original password for recruiter
    st, res = make_request("/auth/forgot-password", method="POST", data={"email": "recruiter@talentai.com"})
    token = res.get("reset_token")
    st, res = make_request("/auth/reset-password", method="POST", data={
        "token": token,
        "new_password": "recruiter123",
        "confirm_password": "recruiter123"
    })
    print("  [PASS] Password reset flow fully validated and password restored.")

    print("\n==================================================")
    print("ALL RBAC TESTS PASSED SUCCESSFULLY! (100% COMPLIANT)")
    print("==================================================")
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
