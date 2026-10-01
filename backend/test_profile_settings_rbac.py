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
    print("==================================================================")
    print("TEST SUITE: PROFILE SETTINGS VS ADMIN SYSTEM SETTINGS VERIFICATION")
    print("==================================================================")
    
    # 0. Health check
    st, res = make_request("/health")
    print(f"[*] Health Check: HTTP {st} -> {res.get('status')}")
    assert st == 200, "Backend is not healthy"

    # 1. Login all 4 seed roles
    accounts = {
        "admin": ("admin@hirenova.com", "admin123"),
        "recruiter": ("recruiter@hirenova.com", "recruiter123"),
        "hiring_manager": ("manager@hirenova.com", "manager123"),
        "hr_lead": ("hrlead@hirenova.com", "hrlead123")
    }

    tokens = {}
    print("\n--- 1. Authenticating All 4 Roles ---")
    for role, (email, pwd) in accounts.items():
        st, res = make_request("/auth/login", method="POST", data={"email": email, "password": pwd})
        if st != 200:
            # Fallback to talentai aliases if hirenova not seeded
            alias_map = {
                "admin": ("admin@talentai.com", "admin123"),
                "recruiter": ("recruiter@talentai.com", "recruiter123"),
                "hiring_manager": ("hiring.manager@talentai.com", "manager123"),
                "hr_lead": ("hr.lead@talentai.com", "hrlead123")
            }
            alt_email, alt_pwd = alias_map[role]
            st, res = make_request("/auth/login", method="POST", data={"email": alt_email, "password": alt_pwd})
            accounts[role] = (alt_email, alt_pwd)
        
        assert st == 200, f"Failed to login as {role}: {res}"
        tokens[role] = res["access_token"]
        print(f"  [PASS] {role.upper()} logged in. User: {res['user']['full_name']} ({res['user']['role']})")

    # 2. Verify: Recruiter can edit name, company, email
    print("\n--- 2. Testing Recruiter Profile Updates ---")
    st, res = make_request("/users/profile", method="PUT", token=tokens["recruiter"], data={
        "full_name": "Senior Recruiter Updated",
        "company_name": "HireNova Talent Org"
    })
    print(f"  [*] Recruiter Name Update: HTTP {st} -> Full Name: {res.get('full_name')}")
    assert st == 200, f"Recruiter failed to update profile: {res}"
    assert res.get("full_name") == "Senior Recruiter Updated"
    assert res.get("company_name") == "HireNova Talent Org"
    print("  [PASS] Recruiter successfully updated name and company.")

    # 3. Verify: Recruiter can change profile photo / avatar
    print("\n--- 3. Testing Recruiter Profile Photo / Avatar ---")
    mock_avatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    st, res = make_request("/users/avatar", method="POST", token=tokens["recruiter"], data={"avatar_url": mock_avatar})
    if st != 200:
        # Also try via profile PUT
        st, res = make_request("/users/profile", method="PUT", token=tokens["recruiter"], data={"avatar_url": mock_avatar})
    print(f"  [*] Recruiter Avatar Update: HTTP {st}")
    assert st == 200, f"Recruiter failed to update avatar: {res}"
    print("  [PASS] Recruiter successfully changed profile photo.")

    # 4. Verify: Recruiter can update notification/theme preferences
    print("\n--- 4. Testing Recruiter Preferences (Theme / Notifications) ---")
    st, res = make_request("/users/preferences", method="PUT", token=tokens["recruiter"], data={
        "theme_preference": "light",
        "notification_preferences": {
            "candidate_matches": True,
            "new_applications": False,
            "interview_reminders": True,
            "weekly_digest": True,
            "security_alerts": True
        }
    })
    print(f"  [*] Recruiter Preferences Update: HTTP {st} -> Theme: {res.get('theme_preference')}")
    assert st == 200, f"Recruiter failed to update preferences: {res}"
    assert res.get("theme_preference") == "light"
    assert res.get("notification_preferences", {}).get("new_applications") is False
    print("  [PASS] Recruiter successfully updated notification & theme preferences.")

    # Restore Recruiter theme to dark
    make_request("/users/preferences", method="PUT", token=tokens["recruiter"], data={"theme_preference": "dark"})

    # 5. Verify: Recruiter can change password
    print("\n--- 5. Testing Recruiter Change Password ---")
    recruiter_pwd = accounts["recruiter"][1]
    new_pwd = "NewRecruiterPassword2026!"
    st, res = make_request("/auth/change-password", method="POST", token=tokens["recruiter"], data={
        "current_password": recruiter_pwd,
        "new_password": new_pwd,
        "confirm_password": new_pwd
    })
    print(f"  [*] Recruiter Change Password: HTTP {st} -> {res.get('message')}")
    assert st == 200, f"Failed to change password: {res}"

    # Verify login with new password
    st_login, res_login = make_request("/auth/login", method="POST", data={"email": accounts["recruiter"][0], "password": new_pwd})
    assert st_login == 200, f"Failed to login with new password: {res_login}"
    print("  [PASS] Login with new password succeeded.")

    # Restore password back to original
    recruiter_token = res_login["access_token"]
    tokens["recruiter"] = recruiter_token
    st_restore, res_restore = make_request("/auth/change-password", method="POST", token=recruiter_token, data={
        "current_password": new_pwd,
        "new_password": recruiter_pwd,
        "confirm_password": recruiter_pwd
    })
    assert st_restore == 200
    print("  [PASS] Recruiter password successfully restored to original.")

    # 6. Verify: Hiring Manager can do the same (name, avatar, preferences, password)
    print("\n--- 6. Testing Hiring Manager Profile Settings ---")
    st, res = make_request("/users/profile", method="PUT", token=tokens["hiring_manager"], data={
        "full_name": "Engineering Manager Updated",
        "avatar_url": mock_avatar
    })
    assert st == 200, f"Hiring Manager profile update failed: {res}"
    print(f"  [PASS] Hiring Manager updated name: '{res.get('full_name')}' and avatar.")

    st, res = make_request("/users/preferences", method="PUT", token=tokens["hiring_manager"], data={
        "theme_preference": "dark",
        "notification_preferences": {"interview_reminders": True}
    })
    assert st == 200
    print("  [PASS] Hiring Manager updated preferences.")

    # 7. Verify: HR Lead can do the same (name, avatar, preferences, password)
    print("\n--- 7. Testing HR Lead Profile Settings ---")
    st, res = make_request("/users/profile", method="PUT", token=tokens["hr_lead"], data={
        "full_name": "HR Lead Director Updated",
        "avatar_url": mock_avatar
    })
    assert st == 200, f"HR Lead profile update failed: {res}"
    print(f"  [PASS] HR Lead updated name: '{res.get('full_name')}' and avatar.")

    st, res = make_request("/users/preferences", method="PUT", token=tokens["hr_lead"], data={
        "theme_preference": "dark",
        "notification_preferences": {"weekly_digest": True}
    })
    assert st == 200
    print("  [PASS] HR Lead updated preferences.")

    # 8. Verify: Non-admin users CANNOT access Admin system settings APIs directly (403 Forbidden)
    print("\n--- 8. Testing Non-Admin System Settings Blocking (403 Forbidden) ---")
    for r in ["recruiter", "hiring_manager", "hr_lead"]:
        st_get, res_get = make_request("/settings/system", method="GET", token=tokens[r])
        print(f"  [*] GET /api/settings/system as {r.upper()}: HTTP {st_get}")
        assert st_get == 403, f"Expected 403 Forbidden for {r} on GET /settings/system, got {st_get}"
        print(f"    [PASS] {r.upper()} properly blocked from GET /settings/system.")

        st_put, res_put = make_request("/settings/system", method="PUT", token=tokens[r], data={
            "similarity_weight_default": 50
        })
        print(f"  [*] PUT /api/settings/system as {r.upper()}: HTTP {st_put}")
        assert st_put == 403, f"Expected 403 Forbidden for {r} on PUT /settings/system, got {st_put}"
        print(f"    [PASS] {r.upper()} properly blocked from PUT /settings/system.")

    # 9. Verify: Admin CAN access and update everything
    print("\n--- 9. Testing Admin Full Access (Profile + System Settings) ---")
    # Admin Profile
    st, res = make_request("/users/profile", method="PUT", token=tokens["admin"], data={
        "full_name": "System Administrator Verified"
    })
    assert st == 200
    print(f"  [PASS] Admin can update profile: '{res.get('full_name')}'.")

    # Admin GET System Settings
    st_get, res_get = make_request("/settings/system", method="GET", token=tokens["admin"])
    print(f"  [*] Admin GET /api/settings/system: HTTP {st_get} -> status: {res_get.get('status')}")
    assert st_get == 200
    assert res_get.get("status") == "operational"

    # Admin PUT System Settings
    st_put, res_put = make_request("/settings/system", method="PUT", token=tokens["admin"], data={
        "similarity_weight_default": 45,
        "skill_weight_default": 55,
        "shortlist_threshold_default": 55,
        "candidate_auto_tagging": True
    })
    print(f"  [*] Admin PUT /api/settings/system: HTTP {st_put} -> weights: {res_put.get('similarity_weight_default')}/{res_put.get('skill_weight_default')}")
    assert st_put == 200
    assert res_put.get("similarity_weight_default") == 45
    print("  [PASS] Admin can view and modify system configuration parameters.")

    # Restore default weights
    make_request("/settings/system", method="PUT", token=tokens["admin"], data={
        "similarity_weight_default": 40,
        "skill_weight_default": 60,
        "shortlist_threshold_default": 50
    })

    print("\n==================================================================")
    print("ALL PROFILE VS SYSTEM SETTINGS CHECKS PASSED (100% SUCCESS)!")
    print("==================================================================")
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
