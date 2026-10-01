import os
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

def run_verification():
    print("=" * 70)
    print("  HIRENOVA — NEXT-GEN RECRUITMENT: FINAL VERIFICATION SUITE")
    print("=" * 70)
    
    # 0. Health & System Check
    st, res = make_request("/health")
    assert st == 200, f"Backend health check failed: {res}"
    print(f"[*] Backend Health: HTTP {st} -> {res.get('status')} (ML & DB OK)")
    
    root_st, root_res = make_request("", method="GET") # root
    # Note: root is at http://127.0.0.1:8000/
    req_root = urllib.request.Request("http://127.0.0.1:8000/")
    with urllib.request.urlopen(req_root) as r:
        root_data = json.loads(r.read().decode("utf-8"))
        print(f"[*] API Root: System Name = '{root_data.get('system')}'")
        assert "HireNova" in root_data.get("system", "")

    # 1. Test All 4 Roles Login with Backend DB Determination
    print("\n--- TEST 1: Login & Automatic Database Role Determination for 4 Roles ---")
    credentials = {
        "admin": ("admin@hirenova.com", "admin123"),
        "recruiter": ("recruiter@hirenova.com", "recruiter123"),
        "hiring_manager": ("manager@hirenova.com", "manager123"),
        "hr_lead": ("hrlead@hirenova.com", "hrlead123")
    }
    
    tokens = {}
    users = {}
    for role_key, (email, pwd) in credentials.items():
        # Notice: Login payload ONLY has email and password. Absolutely NO role parameter!
        st, res = make_request("/auth/login", method="POST", data={"email": email, "password": pwd})
        assert st == 200, f"Login failed for {email}: {res}"
        assert "access_token" in res, "Missing access token"
        tokens[role_key] = res["access_token"]
        users[role_key] = res["user"]
        retrieved_role = res["user"]["role"]
        print(f"  [PASS] {role_key.upper()}: Logged in as '{email}'. DB Role = '{retrieved_role}'")
        assert retrieved_role == role_key, f"Expected role {role_key}, got {retrieved_role}"

    # 2. Test Admin Account Exists in Database & Has Hashed Password
    print("\n--- TEST 2: Admin Account Existence & Secure Hashing in DB ---")
    from backend.database import SessionLocal
    from backend.models.db_models import User
    from backend.utils.auth import verify_password
    db = SessionLocal()
    admin_user = db.query(User).filter(User.email == "admin@hirenova.com").first()
    assert admin_user is not None, "admin@hirenova.com not found in DB!"
    assert admin_user.role == "admin", f"Expected admin role, got {admin_user.role}"
    assert admin_user.is_active is True
    assert admin_user.hashed_password.startswith("$2b$") or len(admin_user.hashed_password) > 40, "Password is not bcrypt hashed!"
    assert verify_password("admin123", admin_user.hashed_password) is True, "Password verification failed"
    print(f"  [PASS] DB User: ID={admin_user.id} | Email='{admin_user.email}' | Role='{admin_user.role}' | HashPrefix='{admin_user.hashed_password[:10]}...'")
    db.close()

    # 3. Test Public Registration Restrictions (Admin MUST be 403 Forbidden)
    print("\n--- TEST 3: Public Registration Restrictions ---")
    ts = int(time.time())
    st, res = make_request("/auth/register", method="POST", data={
        "email": f"fake.admin.{ts}@test.com",
        "password": "Password123!",
        "full_name": "Fake Admin",
        "role": "admin"
    })
    print(f"  [*] Attempting public registration with role 'admin': HTTP {st}")
    assert st == 403, f"Expected 403 Forbidden for admin registration, got {st}"
    print(f"  [PASS] Admin registration properly blocked with 403: {res.get('detail')}")

    # 4. Test Allowed Public Registration Roles
    print("\n--- TEST 4: Allowed Public Registration Roles ---")
    allowed_roles = [
        ("recruiter", "Recruiter User"),
        ("hiring_manager", "Manager User"),
        ("hr_lead", "HR User")
    ]
    for r, name in allowed_roles:
        st, res = make_request("/auth/register", method="POST", data={
            "email": f"pub.{r}.{ts}@test.com",
            "password": "Password123!",
            "full_name": name,
            "company_name": "Test Company",
            "role": r
        })
        assert st == 200, f"Registration failed for role {r}: {res}"
        assert res["user"]["role"] == r, f"Role mismatch for {r}"
        print(f"  [PASS] Public registration for '{r}' succeeded. User Role: '{res['user']['role']}'")

    # 5. Role Security & Authorization Enforcement (Admin-only APIs return 403 for non-admin)
    print("\n--- TEST 5: Role Security & Admin-only API 403 Enforcement ---")
    
    # 5a. /api/users
    print("  [*] Testing GET /api/users:")
    st, res = make_request("/users", token=tokens["admin"])
    assert st == 200 and isinstance(res, list), f"Admin failed to access /api/users: {res}"
    print(f"    - Admin: HTTP {st} (Retrieved {len(res)} users) [PASS]")
    
    for r in ["recruiter", "hiring_manager", "hr_lead"]:
        st, res = make_request("/users", token=tokens[r])
        assert st == 403, f"Expected 403 for {r} on /api/users, got {st}"
        print(f"    - {r.upper()}: HTTP {st} (403 Forbidden properly returned) [PASS]")

    # 5b. /api/activity-logs
    print("\n  [*] Testing GET /api/activity-logs:")
    st, res = make_request("/activity-logs", token=tokens["admin"])
    assert st == 200 and isinstance(res, list), f"Admin failed to access /api/activity-logs: {res}"
    print(f"    - Admin: HTTP {st} (Retrieved {len(res)} activity logs) [PASS]")
    
    for r in ["recruiter", "hiring_manager", "hr_lead"]:
        st, res = make_request("/activity-logs", token=tokens[r])
        assert st == 403, f"Expected 403 for {r} on /api/activity-logs, got {st}"
        print(f"    - {r.upper()}: HTTP {st} (403 Forbidden properly returned) [PASS]")

    # 5c. /api/settings/system
    print("\n  [*] Testing GET /api/settings/system:")
    st, res = make_request("/settings/system", token=tokens["admin"])
    assert st == 200, f"Admin failed to access /api/settings/system: {res}"
    print(f"    - Admin: HTTP {st} (System config loaded: {res.get('model_name')}) [PASS]")
    
    for r in ["recruiter", "hiring_manager", "hr_lead"]:
        st, res = make_request("/settings/system", token=tokens[r])
        assert st == 403, f"Expected 403 for {r} on /api/settings/system, got {st}"
        print(f"    - {r.upper()}: HTTP {st} (403 Forbidden properly returned) [PASS]")

    # 5d. DELETE /api/jobs/{id}
    print("\n  [*] Testing DELETE /api/jobs/99999 (Admin Only):")
    st, res = make_request("/jobs/99999", method="DELETE", token=tokens["recruiter"])
    assert st == 403, f"Expected 403 for recruiter deleting job, got {st}"
    print(f"    - Recruiter DELETE job: HTTP {st} (403 Forbidden properly returned) [PASS]")

    # 6. Admin Permissions Verification
    print("\n--- TEST 6: Admin Comprehensive Permissions Verification ---")
    # Jobs list & detail
    st, jobs = make_request("/jobs", token=tokens["admin"])
    assert st == 200, "Admin cannot list jobs"
    print(f"  [PASS] Jobs access: {len(jobs)} jobs loaded")

    # Candidates list
    st, cands = make_request("/candidates", token=tokens["admin"])
    assert st == 200, "Admin cannot list candidates"
    print(f"  [PASS] Candidates access: {cands.get('total', 0)} total candidates")

    # Screening History
    st, hist = make_request("/screenings?limit=5", token=tokens["admin"])
    assert st == 200, "Admin cannot access screening history"
    print(f"  [PASS] Screening History access: {len(hist.get('screenings', []))} records")

    # Analytics
    st, analytics = make_request("/analytics", token=tokens["admin"])
    assert st == 200, "Admin cannot access analytics"
    print(f"  [PASS] Analytics access: total_candidates={analytics.get('total_candidates')}")

    # Data Export JSON
    st, export = make_request("/export/json", token=tokens["admin"])
    assert st == 200, "Admin cannot access export JSON"
    assert export.get("platform") == "HireNova — Next-Gen Recruitment"
    print(f"  [PASS] Export JSON: platform='{export.get('platform')}'")

    # Role Management
    target_user_id = users["recruiter"]["id"]
    st, role_update = make_request(f"/users/{target_user_id}/role", method="PUT", data={"role": "recruiter"}, token=tokens["admin"])
    assert st == 200, "Admin cannot update user role"
    print(f"  [PASS] Role Management: Updated user {target_user_id} role successfully")

    # 7. Check Frontend Code & HTML Branding
    print("\n--- TEST 7: Frontend Title & Branding Checks ---")
    frontend_index = Path("frontend/index.html").read_text(encoding="utf-8")
    assert "<title>HireNova — Next-Gen Recruitment</title>" in frontend_index, "index.html missing exact title"
    print("  [PASS] frontend/index.html title is: 'HireNova — Next-Gen Recruitment'")

    dist_index = Path("frontend/dist/index.html").read_text(encoding="utf-8")
    assert "<title>HireNova — Next-Gen Recruitment</title>" in dist_index, "dist/index.html missing exact title"
    print("  [PASS] frontend/dist/index.html title is: 'HireNova — Next-Gen Recruitment'")

    sidebar_code = Path("frontend/src/components/layout/Sidebar.jsx").read_text(encoding="utf-8")
    assert "HireNova" in sidebar_code, "Sidebar missing HireNova"
    assert "Next-Gen Recruitment" in sidebar_code, "Sidebar missing Next-Gen Recruitment"
    assert "Screening History" in sidebar_code, "Sidebar missing Screening History"
    print("  [PASS] Sidebar has HireNova, Next-Gen Recruitment, and Screening History nav item")

    auth_modal_code = Path("frontend/src/components/auth/AuthModal.jsx").read_text(encoding="utf-8")
    assert "Sign in to HireNova" in auth_modal_code
    assert "Next-Gen Recruitment" in auth_modal_code
    print("  [PASS] AuthModal has 'Sign in to HireNova' and 'Next-Gen Recruitment'")

    landing_code = Path("frontend/src/pages/LandingPage.jsx").read_text(encoding="utf-8")
    assert "HireNova — Next-Gen Recruitment © 2026" in landing_code
    assert "Explore HireNova Workspace" in landing_code
    print("  [PASS] LandingPage footer & CTA updated to HireNova")

    print("\n" + "=" * 70)
    print("  ALL 12 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
    print("=" * 70)
    return True

if __name__ == "__main__":
    from pathlib import Path
    PROJECT_ROOT = Path(__file__).resolve().parent.parent
    if str(PROJECT_ROOT) not in sys.path:
        sys.path.insert(0, str(PROJECT_ROOT))
    ok = run_verification()
    sys.exit(0 if ok else 1)
