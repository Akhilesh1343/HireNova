import sys
from pathlib import Path
from fastapi import HTTPException

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import SessionLocal, init_db
from backend.models.db_models import User
from backend.models.schemas import UserLoginRequest, UserRegisterRequest
from backend.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    normalize_role,
    require_admin,
    require_screening_access,
    require_job_manage_access,
    require_analytics_access,
    create_password_reset_token,
    verify_password_reset_token
)
from backend.main import login, register, get_dashboard_summary, view_candidate_resume, download_candidate_resume

def run_tests():
    print("=" * 60)
    print("RUNNING DIRECT HIRENOVA RBAC & ENDPOINT TEST SUITE")
    print("=" * 60)

    # 1. Initialize DB and seed
    init_db()
    db = SessionLocal()
    try:
        # Verify seed accounts exist in database
        print("\n--- 1. Verifying Database Seed Accounts ---")
        seed_roles = {
            "admin": "admin@hirenova.com",
            "recruiter": "recruiter@hirenova.com",
            "hiring_manager": "manager@hirenova.com",
            "hr_lead": "hrlead@hirenova.com"
        }

        users = {}
        for role, email in seed_roles.items():
            u = db.query(User).filter(User.email == email).first()
            assert u is not None, f"Seed user {email} missing from DB"
            assert u.role == role, f"Seed user role mismatch: {u.role} != {role}"
            assert u.is_active is True
            users[role] = u
            print(f"  [PASS] Found seed {role.upper()}: email='{u.email}', role='{u.role}', active={u.is_active}")

        # 2. Test Login & Role Detection directly through login route
        print("\n--- 2. Testing Login Route & Role Detection ---")
        passwords = {
            "admin": "admin123",
            "recruiter": "recruiter123",
            "hiring_manager": "manager123",
            "hr_lead": "hrlead123"
        }

        tokens = {}
        for role, pwd in passwords.items():
            payload = UserLoginRequest(email=seed_roles[role], password=pwd)
            resp = login(payload, db=db)
            assert resp.user.role == role, f"Role returned by login does not match: {resp.user.role} != {role}"
            assert resp.access_token is not None
            tokens[role] = resp.access_token
            print(f"  [PASS] Login {role.upper()} -> access_token generated. Detected role from DB: '{resp.user.role}'")

        # 3. Test Invalid Login
        print("\n--- 3. Testing Invalid Credentials Security ---")
        try:
            bad_payload = UserLoginRequest(email="admin@hirenova.com", password="wrongpassword")
            login(bad_payload, db=db)
            assert False, "Should have raised 401 HTTPException"
        except HTTPException as e:
            assert e.status_code == 401
            print(f"  [PASS] Wrong password rejected with HTTP 401: {e.detail}")

        # 4. Test Registration Route Security (Admin must be 403 Forbidden)
        print("\n--- 4. Testing Public Registration Security ---")
        try:
            reg_admin = UserRegisterRequest(
                email="hacker@test.com",
                password="Password123!",
                full_name="Hacker Admin",
                role="admin"
            )
            register(reg_admin, db=db)
            assert False, "Admin registration should have raised 403 HTTPException"
        except HTTPException as e:
            assert e.status_code == 403
            print(f"  [PASS] Public Admin registration blocked with HTTP 403: {e.detail}")

        # Test valid roles (recruiter, hiring_manager, hr_lead)
        import time
        ts = int(time.time())
        for test_role in ["recruiter", "hiring_manager", "hr_lead"]:
            reg_req = UserRegisterRequest(
                email=f"user.{test_role}.{ts}@test.com",
                password="Password123!",
                full_name=f"Test {test_role.title()}",
                role=test_role,
                company_name="HireNova Test"
            )
            reg_resp = register(reg_req, db=db)
            assert reg_resp.user.role == test_role
            print(f"  [PASS] Registered {test_role.upper()} successfully saved with role: '{reg_resp.user.role}'")

        # 5. Test Dependency Enforcement (require_admin, require_screening_access, etc.)
        print("\n--- 5. Testing RBAC Role Dependency Functions ---")

        # 5a. require_admin
        admin_checker = require_admin
        # Admin should pass
        res_u = admin_checker(users["admin"])
        assert res_u.role == "admin"
        print("  [PASS] require_admin: Admin passed.")

        # Non-admins should fail with 403
        for r in ["recruiter", "hiring_manager", "hr_lead"]:
            try:
                admin_checker(users[r])
                assert False, f"Expected 403 for {r} in require_admin"
            except HTTPException as e:
                assert e.status_code == 403
                print(f"  [PASS] require_admin: {r.upper()} blocked with HTTP 403 ({e.detail[:50]}...)")

        # 5b. require_screening_access (admin & recruiter only)
        print("\n  [*] require_screening_access (Admin & Recruiter only):")
        assert require_screening_access(users["admin"]).role == "admin"
        print("    [PASS] Admin allowed.")
        assert require_screening_access(users["recruiter"]).role == "recruiter"
        print("    [PASS] Recruiter allowed.")

        for r in ["hiring_manager", "hr_lead"]:
            try:
                require_screening_access(users[r])
                assert False, f"Expected 403 for {r} in require_screening_access"
            except HTTPException as e:
                assert e.status_code == 403
                print(f"    [PASS] {r.upper()} blocked with HTTP 403.")

        # 5c. require_job_manage_access (admin & recruiter only)
        print("\n  [*] require_job_manage_access (Admin & Recruiter only):")
        assert require_job_manage_access(users["admin"]).role == "admin"
        assert require_job_manage_access(users["recruiter"]).role == "recruiter"
        print("    [PASS] Admin and Recruiter allowed.")
        for r in ["hiring_manager", "hr_lead"]:
            try:
                require_job_manage_access(users[r])
                assert False
            except HTTPException as e:
                assert e.status_code == 403
                print(f"    [PASS] {r.upper()} blocked with HTTP 403.")

        # 5d. require_analytics_access (admin & hr_lead only)
        print("\n  [*] require_analytics_access (Admin & HR Lead only):")
        assert require_analytics_access(users["admin"]).role == "admin"
        assert require_analytics_access(users["hr_lead"]).role == "hr_lead"
        print("    [PASS] Admin and HR Lead allowed.")
        for r in ["recruiter", "hiring_manager"]:
            try:
                require_analytics_access(users[r])
                assert False
            except HTTPException as e:
                assert e.status_code == 403
                print(f"    [PASS] {r.upper()} blocked with HTTP 403.")

        # 6. Test Public Dashboard Summary
        print("\n--- 6. Testing Public Dashboard Summary Function ---")
        summary = get_dashboard_summary(db=db)
        print(f"  [PASS] get_dashboard_summary works publicly without auth (Public access)")
        print(f"    - Total Candidates: {summary.total_candidates}")
        print(f"    - Total Jobs: {summary.total_jobs}")
        print(f"    - Resumes Screened: {summary.total_screenings}")
        print(f"    - Shortlisted: {summary.total_shortlisted}")
        print(f"    - Average ATS Score: {summary.average_ats_score}%")
        print(f"    - ML Engine Status: {summary.ml_engine_status}")

        # 7. Test Password Reset Token JWT
        print("\n--- 7. Testing Password Reset Security ---")
        reset_tok = create_password_reset_token("recruiter@hirenova.com")
        verified_email = verify_password_reset_token(reset_tok)
        assert verified_email == "recruiter@hirenova.com"
        print(f"  [PASS] Password reset token signed and verified successfully for '{verified_email}'")

        bad_token_res = verify_password_reset_token("invalid.jwt.token")
        assert bad_token_res is None
        print("  [PASS] Tampered reset token correctly rejected.")

        # 8. Test Resume Authentication & RBAC Protection
        print("\n--- 8. Testing Resume Preview & Download Authentication ---")
        # 8a. No token -> 401
        try:
            get_current_user(token=None, token_query=None, db=db)
            assert False, "Should have raised 401 without token"
        except HTTPException as e:
            assert e.status_code == 401
            assert "Could not validate credentials or session has expired" in e.detail
            print(f"  [PASS] Unauthenticated request correctly blocked with HTTP 401: '{e.detail}'")

        # 8b. Invalid token -> 401
        try:
            get_current_user(token="malformed.jwt.token", token_query=None, db=db)
            assert False, "Should have raised 401 with bad token"
        except HTTPException as e:
            assert e.status_code == 401
            print(f"  [PASS] Invalid token correctly blocked with HTTP 401")

        # 8c. Valid token in header (Bearer)
        recruiter_token = tokens["recruiter"]
        user_from_header = get_current_user(token=recruiter_token, token_query=None, db=db)
        assert user_from_header.email == seed_roles["recruiter"]
        print(f"  [PASS] Valid Bearer token successfully authenticated user '{user_from_header.email}'")

        # 8d. Valid token in query param (?token=...)
        user_from_query = get_current_user(token=None, token_query=recruiter_token, db=db)
        assert user_from_query.email == seed_roles["recruiter"]
        print(f"  [PASS] Valid query token successfully authenticated user '{user_from_query.email}'")

        # 8e. Test resume view & download with valid session
        # Check an existing candidate
        from backend.models.db_models import Candidate
        cand = db.query(Candidate).first()
        test_cid = cand.candidate_id if cand else "101"
        try:
            view_resp = view_candidate_resume(test_cid, current_user=user_from_header, db=db)
            assert view_resp.status_code == 200
            assert "Content-Disposition" in view_resp.headers
            print(f"  [PASS] Authenticated resume preview for candidate '{test_cid}' returned HTTP 200 with media '{view_resp.media_type}'")
        except HTTPException as e:
            if e.status_code == 404:
                print(f"  [PASS] Authenticated resume preview endpoint reached (candidate '{test_cid}' has no file on disk -> HTTP 404, not 401)")
            else:
                raise e

        try:
            dl_resp = download_candidate_resume(test_cid, current_user=user_from_header, db=db)
            assert dl_resp.status_code == 200
            assert "attachment" in dl_resp.headers["Content-Disposition"]
            print(f"  [PASS] Authenticated resume download for candidate '{test_cid}' returned HTTP 200 attachment")
        except HTTPException as e:
            if e.status_code == 404:
                print(f"  [PASS] Authenticated resume download endpoint reached (candidate '{test_cid}' has no file on disk -> HTTP 404, not 401)")
            else:
                raise e

        print("\n" + "=" * 60)
        print("ALL DIRECT RBAC TESTS PASSED WITH 100% SUCCESS!")
        print("=" * 60)
        return True

    finally:
        db.close()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
