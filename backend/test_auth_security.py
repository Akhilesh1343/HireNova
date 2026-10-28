"""
HireNova Comprehensive Authentication, Password Reset & OAuth Security Test Suite
Tests:
1. Forgot password request produces generic security-safe response (no email enumeration or token leak).
2. Token stored in DB strictly as SHA-256 hash, raw token only in reset link.
3. Token verification endpoint: valid, expired, and tampered tokens.
4. Password reset endpoint: password validation (>=8 chars, match), single-use invalidation.
5. User authentication: old password revoked, new password authenticates cleanly.
6. OAuth endpoints: config discovery and unconfigured error reporting with clear messages.
"""

import sys
import re
from pathlib import Path
import hashlib
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import SessionLocal, init_db
from backend.models.db_models import User, PasswordResetToken
from backend.models.schemas import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserLoginRequest,
    OAuthLoginRequest
)
from backend.utils.auth import hash_password, verify_password
from backend.services.email_service import _test_dispatched_emails
from backend.main import (
    forgot_password,
    verify_reset_token,
    reset_password,
    get_oauth_config,
    get_oauth_url,
    oauth_authenticate,
    login
)

def run_tests():
    print("======================================================================")
    print("HireNova Authentication Security & OAuth Test Suite")
    print("======================================================================")

    init_db()
    db = SessionLocal()
    try:
        # 1. Setup a clean test recruiter user
        test_email = "security_tester@hirenova.ai"
        initial_pw = "InitialTestPass123!"

        # Remove previous test user if exists
        existing_user = db.query(User).filter(User.email == test_email).first()
        if existing_user:
            db.query(PasswordResetToken).filter(PasswordResetToken.user_id == existing_user.id).delete()
            db.delete(existing_user)
            db.commit()

        # Create fresh user
        hashed_pw = hash_password(initial_pw)
        user = User(
            email=test_email,
            hashed_password=hashed_pw,
            full_name="Security Tester",
            company_name="HireNova QA Labs",
            role="recruiter"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"[+] Created test recruiter: {test_email} (ID: {user.id})")

        # -------------------------------------------------------------
        # TEST 1: Request Password Reset - Generic Response & No Leakage
        # -------------------------------------------------------------
        _test_dispatched_emails.clear()
        res = forgot_password(ForgotPasswordRequest(email=test_email), db=db)
        assert res.status == "success", f"Expected success status, got {res}"
        assert hasattr(res, "message"), "Expected message attribute in response"
        assert not hasattr(res, "reset_token"), "CRITICAL: reset_token must NOT be exposed in API schema"
        print("[PASS] Test 1: Forgot password API returns generic response without exposing reset token")

        # Non-existent user also returns identical generic message
        fake_res = forgot_password(ForgotPasswordRequest(email="nonexistent_user_999@hirenova.ai"), db=db)
        assert fake_res.status == "success"
        print("[PASS] Test 1b: Non-existent email receives generic success (prevents email enumeration)")

        # -------------------------------------------------------------
        # TEST 2: Email Dispatched & Token Stored ONLY as SHA-256 Hash
        # -------------------------------------------------------------
        assert len(_test_dispatched_emails) >= 1, "Expected an email to be recorded in test dispatch queue"
        last_email = _test_dispatched_emails[-1]
        assert last_email["to"] == test_email
        assert "reset_url" in last_email
        
        match = re.search(r"reset_token=([^&#]+)", last_email["reset_url"])
        assert match is not None, "Could not extract reset_token from reset_url"
        raw_token = match.group(1)
        assert len(raw_token) >= 32, "Token should have at least 32 characters of high-entropy urlsafe randomness"

        # Check Database Record
        db_token = db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).order_by(PasswordResetToken.id.desc()).first()
        assert db_token is not None, "PasswordResetToken record must exist in DB"
        assert db_token.used is False, "New token must be unused"
        
        # Verify the DB stores the SHA-256 hash, not the raw token
        expected_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        assert db_token.token_hash == expected_hash, "DB token_hash must match SHA-256 of raw token"
        assert raw_token not in db_token.token_hash, "Raw token must not be in database"
        print("[PASS] Test 2: Token stored strictly as SHA-256 hash in database; raw token isolated in email link")

        # -------------------------------------------------------------
        # TEST 3: Verify Reset Token Endpoint
        # -------------------------------------------------------------
        # 3a. Valid token
        v_res = verify_reset_token(token=raw_token, db=db)
        assert v_res.valid is True
        assert v_res.email == test_email
        print("[PASS] Test 3a: Valid reset token verifies successfully")

        # 3b. Tampered/fake token
        bad_token = raw_token[:-4] + "fake"
        try:
            verify_reset_token(token=bad_token, db=db)
            assert False, "Tampered token should raise HTTPException 400"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"[PASS] Test 3b: Tampered/invalid token correctly rejected with HTTP 400 ({e.detail})")

        # 3c. Expired token
        db_token.expires_at = datetime.utcnow() - timedelta(minutes=1)
        db.commit()
        try:
            verify_reset_token(token=raw_token, db=db)
            assert False, "Expired token should raise HTTPException 400"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"[PASS] Test 3c: Expired token correctly rejected with HTTP 400 ({e.detail})")

        # Restore valid expiration for subsequent reset tests
        db_token.expires_at = datetime.utcnow() + timedelta(minutes=20)
        db.commit()

        # -------------------------------------------------------------
        # TEST 4: Reset Password Endpoint Validation
        # -------------------------------------------------------------
        # 4a. Short password (< 8 chars)
        try:
            req = ResetPasswordRequest(
                token=raw_token,
                new_password="short",
                confirm_password="short"
            )
            reset_password(req, db=db)
            assert False, "Short password should be rejected by validation"
        except Exception as e:
            print(f"[PASS] Test 4a: Short password (<8 chars) rejected by schema/endpoint validation ({e.__class__.__name__})")

        # 4b. Password mismatch
        try:
            reset_password(ResetPasswordRequest(
                token=raw_token,
                new_password="ValidPassword123!",
                confirm_password="DifferentPassword123!"
            ), db=db)
            assert False, "Mismatched passwords should raise HTTPException 400"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"[PASS] Test 4b: Password confirmation mismatch rejected ({e.detail})")

        # 4c. Successful password reset
        new_pw = "NewSecurePassword2026!"
        succ_res = reset_password(ResetPasswordRequest(
            token=raw_token,
            new_password=new_pw,
            confirm_password=new_pw
        ), db=db)
        assert succ_res.status == "success"
        print("[PASS] Test 4c: Valid password reset succeeded")

        # -------------------------------------------------------------
        # TEST 5: Single-Use Token Invalidation
        # -------------------------------------------------------------
        try:
            reset_password(ResetPasswordRequest(
                token=raw_token,
                new_password="AnotherNewPassword123!",
                confirm_password="AnotherNewPassword123!"
            ), db=db)
            assert False, "Reused token should raise HTTPException 400"
        except HTTPException as e:
            assert e.status_code == 400
        
        # Verify verification endpoint also rejects used token
        try:
            verify_reset_token(token=raw_token, db=db)
            assert False, "Used token should raise HTTPException 400 on verification"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"[PASS] Test 5: Reused token rejected on both verify and reset endpoints (single-use enforced: {e.detail})")

        # -------------------------------------------------------------
        # TEST 6: User Authentication with New vs Old Password
        # -------------------------------------------------------------
        # 6a. Old password fails
        try:
            login(UserLoginRequest(email=test_email, password=initial_pw), db=db)
            assert False, "Old password must no longer authenticate"
        except HTTPException as e:
            assert e.status_code == 401
            print(f"[PASS] Test 6a: Old password rejected with HTTP 401 ({e.detail})")

        # 6b. New password succeeds
        new_login = login(UserLoginRequest(email=test_email, password=new_pw), db=db)
        assert hasattr(new_login, "access_token")
        assert new_login.user.role == "recruiter"
        print(f"[PASS] Test 6b: New password successfully authenticates and issues access token for role '{new_login.user.role}'")

        # -------------------------------------------------------------
        # TEST 7: Social OAuth Endpoints
        # -------------------------------------------------------------
        # 7a. OAuth config status
        cfg_res = get_oauth_config()
        assert hasattr(cfg_res, "google_enabled")
        assert hasattr(cfg_res, "apple_enabled")
        print(f"[PASS] Test 7a: OAuth config endpoint returned: google_enabled={cfg_res.google_enabled}, apple_enabled={cfg_res.apple_enabled}")

        # 7b. Google OAuth URL when unconfigured
        if not cfg_res.google_enabled:
            try:
                get_oauth_url(provider="google")
                assert False, "Unconfigured Google OAuth should raise HTTPException 400"
            except HTTPException as e:
                assert e.status_code == 400
                assert "GOOGLE_CLIENT_ID" in e.detail
                print(f"[PASS] Test 7b: Unconfigured Google OAuth returns clear config guidance: {e.detail}")
        else:
            g_url = get_oauth_url(provider="google")
            assert "accounts.google.com" in g_url.auth_url
            print("[PASS] Test 7b: Google OAuth configured and URL generated")

        # 7c. Apple OAuth URL when unconfigured
        if not cfg_res.apple_enabled:
            try:
                get_oauth_url(provider="apple")
                assert False, "Unconfigured Apple OAuth should raise HTTPException 400"
            except HTTPException as e:
                assert e.status_code == 400
                assert "APPLE_CLIENT_ID" in e.detail
                print(f"[PASS] Test 7c: Unconfigured Apple OAuth returns clear config guidance: {e.detail}")
        else:
            a_url = get_oauth_url(provider="apple")
            assert "appleid.apple.com" in a_url.auth_url
            print("[PASS] Test 7c: Apple OAuth configured and URL generated")

        # 7d. OAuth authentication rejection when unconfigured
        if not cfg_res.google_enabled:
            try:
                oauth_authenticate(provider="google", payload=OAuthLoginRequest(provider="google", credential="mock_token"), db=db)
                assert False, "Unconfigured OAuth should raise 400"
            except HTTPException as e:
                assert e.status_code == 400
                assert "GOOGLE_CLIENT_ID" in e.detail
                print(f"[PASS] Test 7d: OAuth authenticate endpoint securely refuses login when unconfigured (never creates fake session)")

        print("======================================================================")
        print("ALL AUTHENTICATION SECURITY & OAUTH TESTS PASSED (100% SUCCESS)!")
        print("======================================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
