import os
import sys
import io
import re
import csv
import json
from pathlib import Path
from datetime import datetime, timedelta
import secrets
import hashlib
from typing import List, Optional
from contextlib import asynccontextmanager

# Ensure workspace root is in sys.path so 'backend' package imports succeed from any working directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query, Depends, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from backend.database import get_db, init_db, SessionLocal, engine
from backend.models.db_models import User, Candidate, JobDescription, ScreeningResult, ActivityLog, SystemSetting, Interview, PasswordResetToken
from backend.services.email_service import send_password_reset_email
from backend.models.schemas import (
    ScreenResumeResponse,
    BatchScreenResumeResponse,
    AnalyzeJobRequest,
    AnalyzeJobResponse,
    CandidateListResponse,
    CandidateItem,
    CandidateDetailResponse,
    AnalyticsResponse,
    UserRegisterRequest,
    UserLoginRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    VerifyResetTokenResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    OAuthConfigResponse,
    OAuthUrlResponse,
    OAuthLoginRequest,
    TokenResponse,
    UserResponse,
    UpdateUserRoleRequest,
    UpdateProfileRequest,
    ChangePasswordRequest,
    UpdatePreferencesRequest,
    SystemSettingsResponse,
    UpdateSystemSettingsRequest,
    JobDescriptionCreate,
    JobDescriptionUpdate,
    JobDescriptionResponse,
    ScreeningHistoryItem,
    ScreeningHistoryListResponse,
    ResumeFileItem,
    ResumeFileListResponse,
    InterviewCreate,
    InterviewResponse,
    DashboardSummaryResponse,
    WeeklyActivityItem,
    PublicRecentActivity
)
from backend.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_password_reset_token,
    verify_password_reset_token,
    get_current_user,
    get_optional_current_user,
    normalize_role,
    require_roles,
    require_admin,
    require_screening_access,
    require_job_manage_access,
    require_analytics_access
)
from backend.services.ml_service import ml_service
from backend.services.candidate_service import candidate_service
from backend.utils.extractor import extract_resume_text
from backend.utils.preprocessor import preprocess_text



# ==========================================
# LIFESPAN & STARTUP VALIDATION
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Validate required ML artifacts exist on startup
    required_files = ["resume_model.pkl", "tfidf_vectorizer.pkl", "required_skills.pkl"]
    for f in required_files:
        path = PROJECT_ROOT / f
        if not path.exists():
            raise RuntimeError(
                f"[STARTUP ERROR] Required ML model artifact '{f}' is missing at: {path}. "
                "Ensure all pre-trained pipeline files are in the workspace root."
            )
        print(f"[Startup Check] Verified ML model artifact: {f} ({path.stat().st_size} bytes)")

    # 2. Initialize Database tables
    init_db()
    print("[Database] SQLite database tables initialized successfully.")

    # 3. Seed default recruiter account & default jobs if empty
    db = SessionLocal()
    try:
        # Seed standard RBAC accounts for all roles
        initial_admin_email = os.getenv("ADMIN_INITIAL_EMAIL", os.getenv("ADMIN_EMAIL", "akhilesh1343@gmail.com")).lower().strip()
        initial_admin_password = os.getenv("ADMIN_INITIAL_PASSWORD", os.getenv("ADMIN_PASSWORD", "Admin@HireNova2026!"))
        recruiter_email = os.getenv("RECRUITER_EMAIL", "recruiter@hirenova.com").lower().strip()
        recruiter_password = os.getenv("RECRUITER_PASSWORD", "recruiter123")
        manager_email = os.getenv("HIRING_MANAGER_EMAIL", "manager@hirenova.com").lower().strip()
        manager_password = os.getenv("HIRING_MANAGER_PASSWORD", "manager123")
        hr_email = os.getenv("HR_LEAD_EMAIL", "hrlead@hirenova.com").lower().strip()
        hr_password = os.getenv("HR_LEAD_PASSWORD", "hrlead123")

        seed_accounts = [
            {
                "email": initial_admin_email,
                "password": initial_admin_password,
                "full_name": "System Administrator",
                "role": "admin",
                "company_name": "HireNova Enterprise"
            },
            {
                "email": "admin@hirenova.com",
                "password": "admin123",
                "full_name": "System Administrator",
                "role": "admin",
                "company_name": "HireNova Enterprise"
            },
            {
                "email": recruiter_email,
                "password": recruiter_password,
                "full_name": "Senior Recruiter",
                "role": "recruiter",
                "company_name": "HireNova Operations"
            },
            {
                "email": manager_email,
                "password": manager_password,
                "full_name": "Engineering Hiring Manager",
                "role": "hiring_manager",
                "company_name": "HireNova Engineering"
            },
            {
                "email": hr_email,
                "password": hr_password,
                "full_name": "HR Lead Director",
                "role": "hr_lead",
                "company_name": "HireNova People & Culture"
            },
            # Compatibility aliases
            {
                "email": "admin@talentai.com",
                "password": "admin123",
                "full_name": "System Administrator",
                "role": "admin",
                "company_name": "HireNova Enterprise"
            },
            {
                "email": "recruiter@talentai.com",
                "password": "recruiter123",
                "full_name": "Senior Recruiter",
                "role": "recruiter",
                "company_name": "HireNova Operations"
            },
            {
                "email": "hiring.manager@talentai.com",
                "password": "manager123",
                "full_name": "Engineering Hiring Manager",
                "role": "hiring_manager",
                "company_name": "HireNova Engineering"
            },
            {
                "email": "hr.lead@talentai.com",
                "password": "hrlead123",
                "full_name": "HR Lead Director",
                "role": "hr_lead",
                "company_name": "HireNova People & Culture"
            }
        ]

        for acc in seed_accounts:
            existing_user = db.query(User).filter(User.email == acc["email"]).first()
            if not existing_user:
                new_u = User(
                    email=acc["email"],
                    hashed_password=hash_password(acc["password"]),
                    full_name=acc["full_name"],
                    role=acc["role"],
                    company_name=acc["company_name"],
                    is_active=True
                )
                db.add(new_u)
                db.commit()
                print(f"[Database] Seeded {acc['role']} account: {acc['email']}")
            else:
                # Ensure existing user has correct role & active status without clobbering existing passwords
                if existing_user.role != acc["role"]:
                    existing_user.role = acc["role"]
                if acc.get("company_name") and not existing_user.company_name:
                    existing_user.company_name = acc["company_name"]
                existing_user.is_active = True
                db.commit()
                print(f"[Database] Verified {acc['role']} account: {acc['email']}")

        admin = db.query(User).filter(User.role == "admin").first()


        # Seed sample job descriptions if empty
        if db.query(JobDescription).count() == 0:
            sample_jobs = [
                JobDescription(
                    title="Senior Python & Backend Developer",
                    description=(
                        "We are seeking an experienced Senior Python Developer to architect and "
                        "scale distributed web services and REST APIs. Key requirements include "
                        "Python, Django, Flask, SQL database design, Git version control, and "
                        "software development best practices."
                    ),
                    required_skills=json.dumps([
                        "python", "django", "flask", "sql", "rest api", "git", "data structures", "software development"
                    ]),
                    user_id=admin.id
                ),
                JobDescription(
                    title="Full Stack Engineer (Python & React)",
                    description=(
                        "Looking for a Full Stack Engineer proficient with React, Python web "
                        "frameworks (FastAPI/Flask), relational databases (SQL/PostgreSQL), and "
                        "modern Git CI/CD workflows."
                    ),
                    required_skills=json.dumps([
                        "python", "react", "sql", "rest api", "git", "javascript", "software development"
                    ]),
                    user_id=admin.id
                ),
                JobDescription(
                    title="Machine Learning & NLP Engineer",
                    description=(
                        "Seeking an ML Engineer to build production NLP pipelines. Strong skills in "
                        "Python, Scikit-Learn, data structures, algorithms, SQL, and REST APIs."
                    ),
                    required_skills=json.dumps([
                        "python", "scikit-learn", "sql", "data structures", "git", "nlp", "rest api"
                    ]),
                    user_id=admin.id
                )
            ]
            db.add_all(sample_jobs)
            db.commit()
            print("[Database] Seeded initial job descriptions.")
    finally:
        db.close()

    yield
    print("[Shutdown] Cleaning up API services.")


app = FastAPI(
    title="HireNova — Next-Gen Recruitment API",
    description="Backend service providing ML-powered resume screening, TF-IDF scoring, SQLite persistence, authentication, and recruiter analytics.",
    version="3.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS configuration
origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
)
allow_origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins if allow_origins else ["*"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


# ==========================================
# SYSTEM & HEALTH ENDPOINTS
# ==========================================

@app.get("/", tags=["Root"])
def root():
    return {
        "system": "HireNova — Next-Gen Recruitment API",
        "status": "online",
        "version": "3.0.0",
        "docs": "/docs",
        "ml_pipeline": "TF-IDF + LinearSVC Classifier",
        "database": "SQLite (SQLAlchemy)"
    }


@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.execute(func.now())
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if (ml_service.model is not None and db_ok) else "degraded",
        "model_loaded": ml_service.model is not None,
        "vectorizer_loaded": ml_service.tfidf is not None,
        "default_skills_count": len(ml_service.required_skills),
        "database_connected": db_ok,
        "total_corpus_candidates": len(candidate_service.df_candidates) if candidate_service.df_candidates is not None else 0
    }


# ==========================================
# PUBLIC DASHBOARD SUMMARY (Unauthenticated)
# ==========================================

@app.get(
    "/api/dashboard/summary",
    response_model=DashboardSummaryResponse,
    tags=["Dashboard"],
    summary="Public aggregate dashboard metrics and non-sensitive recruitment statistics"
)
def get_dashboard_summary(db: Session = Depends(get_db)):
    # 1. Total candidates in database or corpus
    db_cands = db.query(Candidate).count()
    corpus_count = len(candidate_service.df_candidates) if candidate_service.df_candidates is not None else 0
    total_candidates = db_cands if db_cands > 0 else corpus_count

    # 2. Total active jobs
    total_jobs = db.query(JobDescription).count()

    # 3. Total screenings recorded
    total_screenings = db.query(ScreeningResult).count()

    # 4. Total shortlisted candidates
    db_shortlisted = db.query(ScreeningResult).filter(ScreeningResult.ats_score >= 50.0).count()
    if db_shortlisted == 0 and db_cands > 0:
        db_shortlisted = db.query(Candidate).filter(Candidate.ats_score >= 50.0).count()
    if db_shortlisted == 0 and candidate_service.df_shortlisted is not None and not candidate_service.df_shortlisted.empty:
        db_shortlisted = len(candidate_service.df_shortlisted)
    total_shortlisted = db_shortlisted

    # 5. Average ATS score
    avg_score = db.query(func.avg(ScreeningResult.ats_score)).scalar()
    if avg_score is None:
        if db_cands > 0:
            avg_score = db.query(func.avg(Candidate.ats_score)).scalar()
        elif candidate_service.df_candidates is not None and not candidate_service.df_candidates.empty:
            avg_score = float(candidate_service.df_candidates["ATS_Score"].mean())
    average_ats = round(float(avg_score), 1) if avg_score is not None else 0.0

    # 6. Weekly screening activity (genuine counts for past 7 days)
    from datetime import date, timedelta
    today = date.today()
    days_abbr = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly = []
    for i in range(6, -1, -1):
        day_date = today - timedelta(days=i)
        day_str = day_date.strftime("%Y-%m-%d")
        count = db.query(ScreeningResult).filter(
            func.date(ScreeningResult.created_at) == day_str
        ).count()
        weekly.append(WeeklyActivityItem(
            date=day_str,
            count=count,
            day=days_abbr[day_date.weekday()]
        ))

    # 7. Pipeline stages
    interview_count = db.query(Interview).count()
    pipeline_stages = {
        "applied": total_candidates,
        "screened": total_screenings,
        "shortlisted": total_shortlisted,
        "interviewed": interview_count
    }

    # 8. Category distribution (top 5 non-sensitive)
    cat_counts = (
        db.query(ScreeningResult.predicted_category, func.count(ScreeningResult.id))
        .group_by(ScreeningResult.predicted_category)
        .order_by(desc(func.count(ScreeningResult.id)))
        .limit(5)
        .all()
    )
    categories = []
    if cat_counts:
        categories = [{"name": c[0] or "General", "count": c[1]} for c in cat_counts if c[0]]
    elif candidate_service.df_candidates is not None and not candidate_service.df_candidates.empty:
        top_cats = candidate_service.df_candidates["Category"].value_counts().head(5)
        categories = [{"name": cat, "count": int(cnt)} for cat, cnt in top_cats.items()]

    # 9. Recent non-sensitive activity (NO personal candidate info or contact details)
    recent_screenings = db.query(ScreeningResult).order_by(desc(ScreeningResult.created_at)).limit(5).all()
    public_recent = [
        PublicRecentActivity(
            id=s.id,
            job_title=s.job_title or "Role Evaluation",
            category=s.predicted_category or "Technical",
            ats_score=round(s.ats_score, 1),
            recommendation=s.recommendation or "Evaluated",
            created_at=s.created_at.isoformat() if s.created_at else None
        )
        for s in recent_screenings
    ]

    return DashboardSummaryResponse(
        total_candidates=total_candidates,
        total_jobs=total_jobs,
        total_screenings=total_screenings,
        total_shortlisted=total_shortlisted,
        average_ats_score=average_ats,
        ml_engine_status="online" if ml_service.model is not None else "offline",
        model_name="LinearSVC + TF-IDF",
        scoring_formula={
            "similarity_weight": 40,
            "skill_weight": 60,
            "threshold": 50,
            "formula_text": "40% JD Similarity + 60% Skill Match"
        },
        weekly_activity=weekly,
        pipeline_stages=pipeline_stages,
        category_distribution=categories,
        recent_public_activity=public_recent
    )


# ==========================================
# AUDIT LOGGING HELPER
# ==========================================


def log_activity(db: Session, action: str, user_email: str, user_role: str, details: str = None, ip_address: str = None):
    """Write an immutable audit log record to activity_logs table."""
    try:
        entry = ActivityLog(
            action=action,
            user_email=user_email,
            user_role=user_role,
            details=details,
            ip_address=ip_address
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        print(f"[ActivityLog] Error logging activity: {e}")


# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================

@app.post(
    "/api/auth/register",
    response_model=TokenResponse,
    tags=["Authentication"],
    summary="Register a new recruiter account"
)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead."
        )

    # Strictly enforce only the 3 allowed public registration roles (Admin cannot be publicly registered)
    clean_role_input = normalize_role(payload.role)

    if clean_role_input == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The Admin role cannot be created through public registration. It is provisioned exclusively by system administrators."
        )

    allowed_registration_roles = {
        "recruiter": "recruiter",
        "hiring_manager": "hiring_manager",
        "hr_lead": "hr_lead"
    }

    if clean_role_input not in allowed_registration_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Registration is restricted to: Recruiter, Hiring Manager, or HR Lead."
        )

    user_role = allowed_registration_roles[clean_role_input]

    new_user = User(
        email=clean_email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        company_name=payload.company_name.strip() if payload.company_name else None,
        role=user_role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_activity(db, "USER_REGISTERED", new_user.email, new_user.role, f"New {user_role} account created")

    token = create_access_token({"sub": new_user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**new_user.to_dict())
    )


@app.post(
    "/api/auth/login",
    response_model=TokenResponse,
    tags=["Authentication"],
    summary="Authenticate recruiter and issue JWT token"
)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This recruiter account is currently inactive."
        )

    log_activity(db, "USER_LOGIN", user.email, user.role, "Successful sign-in to workspace")

    token = create_access_token({"sub": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**user.to_dict())
    )


@app.post(
    "/api/auth/forgot-password",
    response_model=ForgotPasswordResponse,
    tags=["Authentication"],
    summary="Request a password reset link"
)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if user and user.is_active:
        # Invalidate any prior unused tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False
        ).update({"used": True})

        # Generate cryptographically secure random single-use reset token
        raw_token = secrets.token_urlsafe(32)
        # Store only SHA-256 hash in database
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        expires_at = datetime.utcnow() + timedelta(minutes=20)

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            used=False
        )
        db.add(reset_record)
        db.commit()

        # Build reset URL using configured FRONTEND_BASE_URL (never untrusted request Host header)
        frontend_base_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
        reset_url = f"{frontend_base_url}/?reset_token={raw_token}#reset-password"

        # Dispatch reset email via SMTP or configured email provider
        send_password_reset_email(user.email, user.full_name, reset_url)

        log_activity(db, "PASSWORD_RESET_REQUEST", user.email, user.role, "Requested password reset instructions")

    # Generic response prevents email enumeration attacks
    return ForgotPasswordResponse(
        message="If an account exists for this email, you will receive password reset instructions.",
        status="success"
    )


@app.get(
    "/api/auth/verify-reset-token",
    response_model=VerifyResetTokenResponse,
    tags=["Authentication"],
    summary="Verify reset token validity before displaying new password form"
)
def verify_reset_token(token: str = Query(..., description="Raw password reset token"), db: Session = Depends(get_db)):
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token is required."
        )

    token_hash = hashlib.sha256(token.strip().encode("utf-8")).hexdigest()
    record = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link is invalid or unrecognized. Please request a new reset link."
        )

    if record.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has already been used. For security, reset links can only be used once."
        )

    if datetime.utcnow() > record.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has expired (20-minute validity limit). Please request a new reset link."
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account associated with this token was not found or is inactive."
        )

    return VerifyResetTokenResponse(
        valid=True,
        email=user.email,
        message="Token is valid. You may proceed to set a new password."
    )


@app.post(
    "/api/auth/reset-password",
    response_model=ResetPasswordResponse,
    tags=["Authentication"],
    summary="Reset password using valid single-use reset token"
)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )

    if payload.confirm_password and payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match. Please verify your new password entries."
        )

    token_hash = hashlib.sha256(payload.token.strip().encode("utf-8")).hexdigest()
    record = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link is invalid or unrecognized. Please request a new reset link."
        )

    if record.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has already been used. Password reset links are single-use."
        )

    if datetime.utcnow() > record.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has expired. Please request a new reset link."
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account associated with this token was not found or is inactive."
        )

    # Hash new password with existing bcrypt utility
    user.hashed_password = hash_password(payload.new_password)
    # Single-use invalidation
    record.used = True
    db.commit()

    log_activity(db, "PASSWORD_RESET_SUCCESS", user.email, user.role, "Password successfully reset via single-use token")

    return ResetPasswordResponse(
        message="Your password has been reset successfully. You can now sign in with your new credentials.",
        status="success"
    )


# =========================================================================
# OAUTH AUTHENTICATION ENDPOINTS (Google & Apple)
# =========================================================================

@app.get(
    "/api/auth/oauth/config",
    response_model=OAuthConfigResponse,
    tags=["Authentication"],
    summary="Check status of configured social login OAuth providers"
)
def get_oauth_config():
    google_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    apple_id = os.getenv("APPLE_CLIENT_ID", "").strip()
    return OAuthConfigResponse(
        google_enabled=bool(google_id),
        apple_enabled=bool(apple_id)
    )


@app.get(
    "/api/auth/oauth/{provider}/url",
    response_model=OAuthUrlResponse,
    tags=["Authentication"],
    summary="Generate OAuth authorization URL for Google or Apple"
)
def get_oauth_url(provider: str):
    prov = provider.lower().strip()
    frontend_base_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")

    if prov == "google":
        client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
        if not client_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google Sign-In is not configured yet on this server. To enable real Google authentication, please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env."
            )
        redirect_uri = f"{frontend_base_url}/api/auth/callback/google"
        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&response_type=code"
            f"&scope=openid%20email%20profile"
            f"&access_type=online"
            f"&prompt=select_account"
        )
        return OAuthUrlResponse(provider="google", auth_url=auth_url)

    elif prov == "apple":
        client_id = os.getenv("APPLE_CLIENT_ID", "").strip()
        if not client_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apple Sign-In is not configured yet on this server. To enable real Apple authentication, please set APPLE_CLIENT_ID and APPLE_TEAM_ID in backend/.env."
            )
        redirect_uri = f"{frontend_base_url}/api/auth/callback/apple"
        auth_url = (
            f"https://appleid.apple.com/auth/authorize"
            f"?client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&response_type=code%20id_token"
            f"&response_mode=form_post"
            f"&scope=name%20email"
        )
        return OAuthUrlResponse(provider="apple", auth_url=auth_url)

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider '{provider}'. Supported providers are 'google' and 'apple'."
        )


@app.post(
    "/api/auth/oauth/{provider}",
    response_model=TokenResponse,
    tags=["Authentication"],
    summary="Authenticate or register user via verified Google or Apple OAuth"
)
def oauth_authenticate(provider: str, payload: OAuthLoginRequest, db: Session = Depends(get_db)):
    prov = provider.lower().strip()

    if prov == "google":
        client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
        if not client_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google Sign-In is not configured yet on this server. To enable real Google authentication, please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env."
            )

        import requests
        email = None
        full_name = "Google User"
        avatar_url = None

        if payload.credential:
            res = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.credential}", timeout=8)
            if res.status_code != 200:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Google ID token.")
            data = res.json()
            email = data.get("email")
            full_name = data.get("name") or data.get("given_name") or "Google User"
            avatar_url = data.get("picture")
        elif payload.code:
            frontend_base = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
            redirect_uri = payload.redirect_uri or f"{frontend_base}/api/auth/callback/google"
            token_res = requests.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": payload.code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code"
                },
                timeout=8
            )
            if token_res.status_code != 200:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not exchange Google auth code.")
            token_data = token_res.json()
            access_tok = token_data.get("access_token")
            userinfo_res = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_tok}"},
                timeout=8
            )
            if userinfo_res.status_code != 200:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not retrieve Google profile.")
            u_info = userinfo_res.json()
            email = u_info.get("email")
            full_name = u_info.get("name") or "Google User"
            avatar_url = u_info.get("picture")

        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not obtain verified email from Google.")

        clean_email = email.lower().strip()
        user = db.query(User).filter(User.email == clean_email).first()
        if not user:
            user = User(
                email=clean_email,
                hashed_password=hash_password(secrets.token_hex(16)),
                full_name=full_name,
                company_name="Organization",
                role="recruiter",
                avatar_url=avatar_url,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            log_activity(db, "OAUTH_REGISTER", user.email, user.role, "Registered via Google Sign-In")
        else:
            if avatar_url and not user.avatar_url:
                user.avatar_url = avatar_url
                db.commit()
            log_activity(db, "OAUTH_LOGIN", user.email, user.role, "Signed in via Google OAuth")

        jwt_token = create_access_token({"sub": user.email})
        return TokenResponse(
            access_token=jwt_token,
            token_type="bearer",
            user=UserResponse(**user.to_dict())
        )

    elif prov == "apple":
        apple_id = os.getenv("APPLE_CLIENT_ID", "").strip()
        if not apple_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apple Sign-In is not configured yet on this server. To enable real Apple authentication, please set APPLE_CLIENT_ID and APPLE_TEAM_ID in backend/.env."
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apple OAuth requires configuring APPLE_CLIENT_ID, APPLE_TEAM_ID, and APPLE_PRIVATE_KEY."
        )

    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported OAuth provider: '{provider}'")


@app.get(
    "/api/auth/me",
    response_model=UserResponse,
    tags=["Authentication"],
    summary="Get current recruiter user profile"
)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.to_dict())


@app.get(
    "/api/users/profile",
    response_model=UserResponse,
    tags=["User Profile"],
    summary="Get current user profile (All Authenticated Users)"
)
def get_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.to_dict())


@app.put(
    "/api/users/profile",
    response_model=UserResponse,
    tags=["User Profile"],
    summary="Update current user profile (All Authenticated Users)"
)
def update_user_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.full_name is not None:
        trimmed = payload.full_name.strip()
        if len(trimmed) < 2:
            raise HTTPException(status_code=400, detail="Full name must be at least 2 characters.")
        current_user.full_name = trimmed

    if payload.company_name is not None:
        current_user.company_name = payload.company_name.strip()

    if payload.email is not None:
        clean_email = payload.email.lower().strip()
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", clean_email):
            raise HTTPException(status_code=400, detail="Invalid email format.")
        if clean_email != current_user.email:
            existing = db.query(User).filter(User.email == clean_email, User.id != current_user.id).first()
            if existing:
                raise HTTPException(status_code=400, detail="An account with this email already exists.")
            current_user.email = clean_email

    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    if payload.notification_preferences is not None:
        current_user.notification_preferences = json.dumps(payload.notification_preferences)

    if payload.theme_preference is not None:
        current_user.theme_preference = payload.theme_preference

    db.commit()
    db.refresh(current_user)

    log_activity(
        db,
        "PROFILE_UPDATED",
        current_user.email,
        current_user.role,
        f"Updated profile details for {current_user.email}"
    )

    return UserResponse(**current_user.to_dict())


@app.post(
    "/api/users/avatar",
    tags=["User Profile"],
    summary="Upload or update user profile avatar (All Authenticated Users)"
)
async def upload_user_avatar(
    file: Optional[UploadFile] = File(None),
    avatar_url: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data_url = None
    if file and file.filename:
        ext = file.filename.split(".")[-1].lower()
        if ext not in ["jpg", "jpeg", "png", "webp", "gif", "svg"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported image format .{ext}. Allowed: JPG, PNG, WEBP, GIF, SVG"
            )
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Avatar image size cannot exceed 5MB.")
        import base64
        mime = f"image/{'svg+xml' if ext == 'svg' else ('jpeg' if ext in ['jpg', 'jpeg'] else ext)}"
        encoded = base64.b64encode(content).decode("utf-8")
        data_url = f"data:{mime};base64,{encoded}"
    elif avatar_url:
        data_url = avatar_url.strip()
    else:
        raise HTTPException(status_code=400, detail="Please upload an image file or provide an avatar URL.")

    current_user.avatar_url = data_url
    db.commit()
    db.refresh(current_user)

    log_activity(db, "AVATAR_UPDATED", current_user.email, current_user.role, f"Updated profile photo for {current_user.email}")
    return {
        "status": "success",
        "avatar_url": current_user.avatar_url,
        "user": current_user.to_dict()
    }


@app.post(
    "/api/auth/change-password",
    tags=["Authentication", "User Profile"],
    summary="Change user password (All Authenticated Users)"
)
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long."
        )

    if payload.confirm_password and payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match."
        )

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()

    log_activity(db, "PASSWORD_CHANGED", current_user.email, current_user.role, "User successfully changed their password")

    return {
        "status": "success",
        "message": "Password changed successfully."
    }


@app.put(
    "/api/users/preferences",
    response_model=UserResponse,
    tags=["User Profile"],
    summary="Update theme and notification preferences (All Authenticated Users)"
)
def update_preferences(
    payload: UpdatePreferencesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.theme_preference is not None:
        current_user.theme_preference = payload.theme_preference
    if payload.notification_preferences is not None:
        current_user.notification_preferences = json.dumps(payload.notification_preferences)

    db.commit()
    db.refresh(current_user)
    return UserResponse(**current_user.to_dict())



# ==========================================
# JOB DESCRIPTION MANAGEMENT ENDPOINTS
# ==========================================

@app.get(
    "/api/jobs",
    response_model=List[JobDescriptionResponse],
    tags=["Job Descriptions"],
    summary="List all saved job descriptions"
)
def list_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    jobs = db.query(JobDescription).order_by(desc(JobDescription.created_at)).all()
    return [JobDescriptionResponse(**j.to_dict()) for j in jobs]


@app.post(
    "/api/jobs",
    response_model=JobDescriptionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Job Descriptions"],
    summary="Create a new job description (Recruiter & Admin only)"
)
def create_job(
    payload: JobDescriptionCreate,
    current_user: User = Depends(require_job_manage_access),
    db: Session = Depends(get_db)
):
    skills_json = json.dumps([s.strip().lower() for s in payload.required_skills if s.strip()])
    job = JobDescription(
        title=payload.title.strip(),
        description=payload.description.strip(),
        required_skills=skills_json,
        user_id=current_user.id
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    log_activity(db, "JOB_CREATED", current_user.email, current_user.role, f"Created job '{job.title}' (ID {job.id})")
    return JobDescriptionResponse(**job.to_dict())


@app.get(
    "/api/jobs/{job_id}",
    response_model=JobDescriptionResponse,
    tags=["Job Descriptions"],
    summary="Get a single job description by ID"
)
def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found.")
    return JobDescriptionResponse(**job.to_dict())



@app.put(
    "/api/jobs/{job_id}",
    response_model=JobDescriptionResponse,
    tags=["Job Descriptions"],
    summary="Update an existing job description (Recruiter & Admin only)"
)
def update_job(
    job_id: int,
    payload: JobDescriptionUpdate,
    current_user: User = Depends(require_job_manage_access),
    db: Session = Depends(get_db)
):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found.")

    if payload.title is not None:
        job.title = payload.title.strip()
    if payload.description is not None:
        job.description = payload.description.strip()
    if payload.required_skills is not None:
        job.required_skills = json.dumps([s.strip().lower() for s in payload.required_skills if s.strip()])

    job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    log_activity(db, "JOB_UPDATED", current_user.email, current_user.role, f"Updated job ID {job.id}")
    return JobDescriptionResponse(**job.to_dict())


@app.delete(
    "/api/jobs/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Job Descriptions"],
    summary="Delete a job description (Admin only)"
)
def delete_job(
    job_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found.")
    deleted_title = job.title
    db.delete(job)
    db.commit()
    log_activity(db, "JOB_DELETED", current_user.email, current_user.role, f"Deleted job '{deleted_title}' (ID {job_id})")
    return None


# ==========================================
# RESUME SCREENING & HISTORY ENDPOINTS
# ==========================================

@app.post(
    "/api/screen-resume",
    response_model=ScreenResumeResponse,
    tags=["Resume Screening"],
    summary="Screen an uploaded resume against job requirements using ML & persist result"
)
async def screen_resume_endpoint(
    file: UploadFile = File(..., description="Resume file in PDF, DOCX, or TXT format"),
    job_description: str = Form(..., description="Target job description text"),
    required_skills: Optional[str] = Form(None, description="Optional custom comma-separated or JSON list of required skills"),
    job_title: Optional[str] = Form(None, description="Optional job title designation"),
    job_description_id: Optional[int] = Form(None, description="Optional linked job description ID"),
    candidate_name: Optional[str] = Form(None, description="Optional candidate name"),
    current_user: User = Depends(require_screening_access),
    db: Session = Depends(get_db)
):
    # 1. Validate Job Description
    if not job_description or not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty. Please provide the requirements for the role."
        )

    # 2. Validate File Presence and Name
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No resume file uploaded. Please upload a PDF, DOCX, or TXT document."
        )

    filename = file.filename
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ["pdf", "docx", "txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Supported formats: PDF, DOCX, TXT."
        )

    # 3. Read File and Check Size Limit (10MB max)
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes). Please upload a valid resume."
        )

    max_size = 10 * 1024 * 1024
    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10MB limit. Please upload a smaller document."
        )

    # 4. Extract Text
    try:
        extracted_text, doc_type = extract_resume_text(filename, file_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from document: {str(e)}"
        )

    if not extracted_text or len(extracted_text.strip()) < 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract readable text from the document. If this is a scanned PDF image, please use a text-based PDF or DOCX document."
        )

    # 5. Parse Custom Skills if provided
    skills_list = None
    if required_skills and required_skills.strip():
        raw_skills = required_skills.strip()
        if raw_skills.startswith("[") and raw_skills.endswith("]"):
            try:
                skills_list = json.loads(raw_skills)
            except Exception:
                skills_list = [s.strip() for s in raw_skills.strip("[]").split(",") if s.strip()]
        else:
            skills_list = [s.strip() for s in raw_skills.split(",") if s.strip()]

    # 6. Execute ML Screening Pipeline
    try:
        result = ml_service.screen_resume(
            resume_text=extracted_text,
            job_description=job_description,
            custom_skills=skills_list,
            filename=filename
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred in the ML prediction pipeline: {str(e)}"
        )

    # 7. Persist to SQLite Database and Filesystem
    try:
        cid = result["candidate_id"]
        # Save actual uploaded resume file for View/Download Resume
        upload_dir = PROJECT_ROOT / "backend" / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        safe_name = re.sub(r'[^a-zA-Z0-9_\.-]', '_', filename)
        saved_file = upload_dir / f"{cid}_{safe_name}"
        try:
            with open(saved_file, "wb") as f_out:
                f_out.write(file_bytes)
        except Exception as write_err:
            print(f"[Warning] Failed to save resume to uploads: {write_err}")

        cname = candidate_name.strip() if candidate_name and candidate_name.strip() else None
        if not cname:
            lines = [l.strip() for l in extracted_text.split("\n") if l.strip()]
            first_line = lines[0] if lines else ""
            if 3 <= len(first_line) <= 35 and re.match(r"^[a-zA-Z\s\.\'-]+$", first_line) and not re.search(r"(resume|curriculum|summary|profile|page|contact|email|phone|skills|experience)", first_line, re.I):
                cname = first_line.title()
            else:
                name_base = filename.rsplit(".", 1)[0]
                clean_name = re.sub(r'^(resume|cv)[_\s-]*', '', name_base, flags=re.IGNORECASE)
                clean_name = re.sub(r'[_\s-]+(resume|cv)$', '', clean_name, flags=re.IGNORECASE)
                clean_name = clean_name.replace('_', ' ').replace('-', ' ').strip()
                cname = clean_name.title() if clean_name and len(clean_name) > 2 else f"Candidate {cid}"

        # Upsert Candidate record
        db_candidate = db.query(Candidate).filter(Candidate.candidate_id == cid).first()
        if not db_candidate:
            db_candidate = Candidate(
                candidate_id=cid,
                name=cname,
                category=result["predicted_category"],
                ats_score=result["ats_score"],
                similarity_score=result["similarity_score"],
                skill_score=result["skill_score"],
                matched_skills=json.dumps(result["matched_skills"]),
                missing_skills=json.dumps(result["missing_skills"]),
                recommendation=result["recommendation"],
                resume_preview=extracted_text[:2000]
            )
            db.add(db_candidate)
        else:
            db_candidate.ats_score = result["ats_score"]
            db_candidate.similarity_score = result["similarity_score"]
            db_candidate.skill_score = result["skill_score"]
            db_candidate.matched_skills = json.dumps(result["matched_skills"])
            db_candidate.missing_skills = json.dumps(result["missing_skills"])
            db_candidate.recommendation = result["recommendation"]

        # Insert ScreeningResult record
        screening_record = ScreeningResult(
            candidate_id=cid,
            candidate_name=cname,
            predicted_category=result["predicted_category"],
            similarity_score=result["similarity_score"],
            skill_score=result["skill_score"],
            ats_score=result["ats_score"],
            matched_skills=json.dumps(result["matched_skills"]),
            missing_skills=json.dumps(result["missing_skills"]),
            recommendation=result["recommendation"],
            resume_filename=filename,
            file_type=ext.upper(),
            job_title=job_title or "General Screening",
            job_description_id=job_description_id,
            user_id=current_user.id if current_user else None
        )
        db.add(screening_record)
        db.commit()
        db.refresh(screening_record)

        result["screening_id"] = screening_record.id
        result["job_title"] = screening_record.job_title
        result["candidate_name"] = cname
    except Exception as db_err:
        db.rollback()
        print(f"[Warning] Failed to save screening result to DB: {db_err}")

    return ScreenResumeResponse(**result)


@app.post(
    "/api/screen-resumes-batch",
    response_model=BatchScreenResumeResponse,
    tags=["Resume Screening"],
    summary="Screen multiple uploaded resumes against job requirements and return ranked shortlist"
)
async def screen_resumes_batch_endpoint(
    files: List[UploadFile] = File(..., description="Multiple resume files in PDF, DOCX, or TXT format"),
    job_description: str = Form(..., description="Target job description text"),
    required_skills: Optional[str] = Form(None, description="Optional custom comma-separated or JSON list of required skills"),
    job_title: Optional[str] = Form(None, description="Optional job title designation"),
    job_description_id: Optional[int] = Form(None, description="Optional linked job description ID"),
    current_user: User = Depends(require_screening_access),
    db: Session = Depends(get_db)
):
    if not job_description or not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty. Please provide the requirements for the role."
        )

    if not files or len(files) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No resume files uploaded. Please upload at least one PDF, DOCX, or TXT document."
        )

    # Parse Custom Skills if provided
    skills_list = None
    if required_skills and required_skills.strip():
        raw_skills = required_skills.strip()
        if raw_skills.startswith("[") and raw_skills.endswith("]"):
            try:
                skills_list = json.loads(raw_skills)
            except Exception:
                skills_list = [s.strip() for s in raw_skills.strip("[]").split(",") if s.strip()]
        else:
            skills_list = [s.strip() for s in raw_skills.split(",") if s.strip()]

    results = []
    max_size = 10 * 1024 * 1024

    for file in files:
        if not file or not file.filename:
            continue

        filename = file.filename
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in ["pdf", "docx", "txt"]:
            continue

        try:
            file_bytes = await file.read()
            if len(file_bytes) == 0 or len(file_bytes) > max_size:
                continue

            extracted_text, doc_type = extract_resume_text(filename, file_bytes)
            if not extracted_text or len(extracted_text.strip()) < 15:
                continue

            result = ml_service.screen_resume(
                resume_text=extracted_text,
                job_description=job_description,
                custom_skills=skills_list,
                filename=filename
            )

            # Derive clean candidate name from resume text or filename
            cname = None
            lines = [l.strip() for l in extracted_text.split("\n") if l.strip()]
            first_line = lines[0] if lines else ""
            if 3 <= len(first_line) <= 35 and re.match(r"^[a-zA-Z\s\.\'-]+$", first_line) and not re.search(r"(resume|curriculum|summary|profile|page|contact|email|phone|skills|experience)", first_line, re.I):
                cname = first_line.title()

            if not cname:
                name_base = filename.rsplit(".", 1)[0]
                clean_name = re.sub(r'^(resume|cv)[_\s-]*', '', name_base, flags=re.IGNORECASE)
                clean_name = re.sub(r'[_\s-]+(resume|cv)$', '', clean_name, flags=re.IGNORECASE)
                clean_name = clean_name.replace('_', ' ').replace('-', ' ').strip()
                cname = clean_name.title() if clean_name and len(clean_name) > 2 else f"Candidate #{result['candidate_id']}"

            result["candidate_name"] = cname
            result["file_name"] = filename

            # Persist to DB
            try:
                cid = result["candidate_id"]
                db_candidate = db.query(Candidate).filter(Candidate.candidate_id == cid).first()
                if not db_candidate:
                    db_candidate = Candidate(
                        candidate_id=cid,
                        name=cname,
                        category=result["predicted_category"],
                        ats_score=result["ats_score"],
                        similarity_score=result["similarity_score"],
                        skill_score=result["skill_score"],
                        matched_skills=json.dumps(result["matched_skills"]),
                        missing_skills=json.dumps(result["missing_skills"]),
                        recommendation=result["recommendation"],
                        resume_preview=extracted_text[:2000]
                    )
                    db.add(db_candidate)
                else:
                    db_candidate.name = cname
                    db_candidate.ats_score = result["ats_score"]
                    db_candidate.similarity_score = result["similarity_score"]
                    db_candidate.skill_score = result["skill_score"]
                    db_candidate.matched_skills = json.dumps(result["matched_skills"])
                    db_candidate.missing_skills = json.dumps(result["missing_skills"])
                    db_candidate.recommendation = result["recommendation"]

                screening_record = ScreeningResult(
                    candidate_id=cid,
                    candidate_name=cname,
                    predicted_category=result["predicted_category"],
                    similarity_score=result["similarity_score"],
                    skill_score=result["skill_score"],
                    ats_score=result["ats_score"],
                    matched_skills=json.dumps(result["matched_skills"]),
                    missing_skills=json.dumps(result["missing_skills"]),
                    recommendation=result["recommendation"],
                    resume_filename=filename,
                    file_type=ext.upper(),
                    job_title=job_title or "General Screening",
                    job_description_id=job_description_id,
                    user_id=current_user.id if current_user else None
                )
                db.add(screening_record)
                db.commit()
                db.refresh(screening_record)

                # Save actual uploaded resume file for View/Download Resume
                upload_dir = PROJECT_ROOT / "backend" / "uploads"
                upload_dir.mkdir(parents=True, exist_ok=True)
                safe_name = re.sub(r'[^a-zA-Z0-9_\.-]', '_', filename)
                saved_file = upload_dir / f"{cid}_{safe_name}"
                try:
                    with open(saved_file, "wb") as f_out:
                        f_out.write(file_bytes)
                except Exception as write_err:
                    print(f"[Warning] Failed to save batch resume to uploads: {write_err}")

                result["screening_id"] = screening_record.id
                result["job_title"] = screening_record.job_title
            except Exception as db_err:
                db.rollback()
                print(f"[Warning] Failed to save batch screening result to DB: {db_err}")

            results.append(result)
        except Exception as e:
            print(f"[Batch Screening Warning] Failed to process {filename}: {e}")
            continue

    if not results:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not process any of the uploaded resumes. Please ensure documents are valid, readable PDF, DOCX, or TXT files."
        )

    # Sort results by ATS score descending
    results.sort(key=lambda x: x.get("ats_score", 0), reverse=True)

    return BatchScreenResumeResponse(
        total_screened=len(results),
        job_title=job_title or "Target Role",
        results=[ScreenResumeResponse(**r) for r in results]
    )


@app.get(
    "/api/screenings",
    response_model=ScreeningHistoryListResponse,
    tags=["Screening History"],
    summary="Get paginated screening history with search, category, and recommendation filters"
)
def get_screening_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    recommendation: Optional[str] = Query(None),
    min_ats: float = Query(0.0, ge=0.0, le=100.0),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ScreeningResult)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (ScreeningResult.candidate_name.ilike(term)) |
            (ScreeningResult.candidate_id.ilike(term)) |
            (ScreeningResult.job_title.ilike(term)) |
            (ScreeningResult.predicted_category.ilike(term))
        )

    if category and category != "ALL":
        query = query.filter(ScreeningResult.predicted_category == category)

    if recommendation and recommendation != "ALL":
        query = query.filter(ScreeningResult.recommendation.ilike(f"%{recommendation}%"))

    if min_ats > 0.0:
        query = query.filter(ScreeningResult.ats_score >= min_ats)

    total = query.count()

    # Sort field
    sort_column = ScreeningResult.created_at
    if sort_by == "ats_score":
        sort_column = ScreeningResult.ats_score
    elif sort_by == "similarity_score":
        sort_column = ScreeningResult.similarity_score
    elif sort_by == "skill_score":
        sort_column = ScreeningResult.skill_score
    elif sort_by == "candidate_name":
        sort_column = ScreeningResult.candidate_name

    if sort_order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    records = query.offset(skip).limit(limit).all()
    return ScreeningHistoryListResponse(
        total=total,
        skip=skip,
        limit=limit,
        screenings=[ScreeningHistoryItem(**r.to_dict()) for r in records]
    )


@app.get(
    "/api/screenings/{screening_id}",
    response_model=ScreeningHistoryItem,
    tags=["Screening History"],
    summary="Get single screening history detail"
)
def get_screening_detail(
    screening_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(ScreeningResult).filter(ScreeningResult.id == screening_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Screening record not found.")
    return ScreeningHistoryItem(**rec.to_dict())


@app.delete(
    "/api/screenings/{screening_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Screening History"],
    summary="Delete a screening record (Recruiter & Admin only)"
)
def delete_screening_record(
    screening_id: int,
    current_user: User = Depends(require_screening_access),
    db: Session = Depends(get_db)
):
    rec = db.query(ScreeningResult).filter(ScreeningResult.id == screening_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Screening record not found.")
    db.delete(rec)
    db.commit()
    return None


@app.get(
    "/api/resumes",
    response_model=ResumeFileListResponse,
    tags=["Resume Management"],
    summary="List previously screened resumes with file metadata"
)
def list_screened_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    screenings = db.query(ScreeningResult).order_by(desc(ScreeningResult.created_at)).limit(100).all()
    items = []
    for s in screenings:
        items.append(ResumeFileItem(
            id=s.id,
            filename=s.resume_filename or "Resume.pdf",
            file_type=s.file_type or "PDF",
            candidate_id=s.candidate_id,
            candidate_name=s.candidate_name or f"Candidate {s.candidate_id}",
            category=s.predicted_category,
            ats_score=s.ats_score,
            recommendation=s.recommendation,
            upload_date=s.created_at.isoformat() if s.created_at else None
        ))
    return ResumeFileListResponse(total=len(items), resumes=items)



def find_resume_file_or_data(candidate_id: str, db: Session):
    """Securely resolves uploaded resume file, dataset PDF, or clean text preview."""
    safe_cid = re.sub(r'[^a-zA-Z0-9_-]', '', str(candidate_id))
    upload_dir = PROJECT_ROOT / "backend" / "uploads"

    # 1. Search uploaded files for {candidate_id}_*
    if upload_dir.exists():
        for f in upload_dir.iterdir():
            if f.is_file() and f.name.startswith(f"{safe_cid}_"):
                ext = f.suffix.lower()
                media = "application/pdf" if ext == ".pdf" else (
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" if ext == ".docx" else "text/plain"
                )
                filename = f.name.split("_", 1)[1] if "_" in f.name else f.name
                return f.read_bytes(), filename, media

    # 2. Check dataset files data/data/{category}/{candidate_id}.pdf
    db_cand = db.query(Candidate).filter(Candidate.candidate_id == safe_cid).first()
    category = db_cand.category if db_cand else None
    if not category:
        cand_corpus = candidate_service.get_candidate_by_id(safe_cid)
        if cand_corpus:
            category = cand_corpus.get("category")

    if category:
        dataset_pdf = PROJECT_ROOT / "data" / "data" / category / f"{safe_cid}.pdf"
        if dataset_pdf.exists():
            return dataset_pdf.read_bytes(), f"Resume_{safe_cid}.pdf", "application/pdf"

    # 3. Fallback: Generate text document from candidate extracted text preview
    text_content = ""
    if db_cand and db_cand.resume_preview:
        text_content = db_cand.resume_preview
    else:
        cand_corpus = candidate_service.get_candidate_by_id(safe_cid)
        if cand_corpus and cand_corpus.get("resume_preview"):
            text_content = cand_corpus.get("resume_preview")

    if text_content:
        return text_content.encode("utf-8"), f"Resume_{safe_cid}.txt", "text/plain; charset=utf-8"

    return None, None, None


@app.get(
    "/api/candidates/{candidate_id}/resume",
    tags=["Resume Management"],
    summary="View candidate resume inline in browser"
)
def view_candidate_resume(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data, filename, media = find_resume_file_or_data(candidate_id, db)
    if not data:
        raise HTTPException(status_code=404, detail="Resume file not found.")
    return Response(
        content=data,
        media_type=media,
        headers={"Content-Disposition": f"inline; filename=\"{filename}\""}
    )


@app.get(
    "/api/candidates/{candidate_id}/resume/download",
    tags=["Resume Management"],
    summary="Download candidate resume file"
)
def download_candidate_resume(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data, filename, media = find_resume_file_or_data(candidate_id, db)
    if not data:
        raise HTTPException(status_code=404, detail="Resume file not found.")
    return Response(
        content=data,
        media_type=media,
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
    )


@app.get(
    "/api/screenings/{screening_id}/resume",
    tags=["Resume Management"],
    summary="View screening resume inline in browser"
)
def view_screening_resume(
    screening_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(ScreeningResult).filter(ScreeningResult.id == screening_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Screening record not found.")
    return view_candidate_resume(rec.candidate_id, current_user, db)


@app.get(
    "/api/screenings/{screening_id}/resume/download",
    tags=["Resume Management"],
    summary="Download screening resume file"
)
def download_screening_resume(
    screening_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(ScreeningResult).filter(ScreeningResult.id == screening_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Screening record not found.")
    return download_candidate_resume(rec.candidate_id, current_user, db)


@app.get(
    "/api/export/json",
    tags=["Export"],
    summary="Export all recruitment data to JSON (HR Lead & Admin only)"
)
def export_json(
    current_user: User = Depends(require_analytics_access),
    db: Session = Depends(get_db)
):
    cands = db.query(Candidate).order_by(desc(Candidate.ats_score)).all()
    screenings = db.query(ScreeningResult).order_by(desc(ScreeningResult.created_at)).all()
    jobs = db.query(JobDescription).all()
    export_payload = {
        "platform": "HireNova — Next-Gen Recruitment",
        "export_date": datetime.utcnow().isoformat(),
        "total_candidates": len(cands),
        "total_screenings": len(screenings),
        "total_jobs": len(jobs),
        "jobs": [j.to_dict() for j in jobs],
        "candidates": [c.to_dict() for c in cands],
        "screenings": [s.to_dict() for s in screenings]
    }
    return JSONResponse(
        content=export_payload,
        headers={"Content-Disposition": "attachment; filename=HireNova_Data_Export.json"}
    )



# ==========================================
# EXPORT FEATURES (CSV)
# ==========================================

@app.get(
    "/api/export/rankings",
    tags=["Export"],
    summary="Export candidate rankings to CSV (HR Lead & Admin only)"
)
def export_rankings_csv(
    current_user: User = Depends(require_analytics_access)
):
    df = candidate_service.df_candidates
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="No candidate rankings dataset available.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Rank", "Candidate ID", "Category", "Similarity Score (%)", "Skill Score (%)", "ATS Score (%)", "Recommendation", "Matched Skills"])

    for idx, row in df.iterrows():
        rank = row.get("Rank", idx + 1)
        cid = str(row.get("Candidate_ID", row.get("ID", f"CAND-{idx+1}")))
        cat = str(row.get("Category", "N/A"))
        sim = round(float(row.get("Similarity", row.get("Cosine_Similarity", 0.0))), 2)
        sk_score = round(float(row.get("Skill_Score", 0.0)), 2)
        ats = round(float(row.get("ATS_Score", 0.0)), 2)
        rec = str(row.get("Recommendation", "N/A"))
        matched = str(row.get("Matched_Skills", ""))
        writer.writerow([rank, cid, cat, sim, sk_score, ats, rec, matched])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=Candidate_Rankings.csv"}
    )


@app.get(
    "/api/export/shortlist",
    tags=["Export"],
    summary="Export shortlisted candidates to CSV (HR Lead & Admin only)"
)
def export_shortlist_csv(
    current_user: User = Depends(require_analytics_access)
):
    df = candidate_service.df_shortlisted
    if df is None or df.empty:
        df = candidate_service.df_candidates.head(10) if candidate_service.df_candidates is not None else None

    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="No shortlisted candidates available.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Rank", "Candidate ID", "Category", "ATS Score (%)", "Skill Score (%)", "Similarity Score (%)", "Recommendation"])

    for idx, row in df.iterrows():
        rank = row.get("Rank", idx + 1)
        cid = str(row.get("Candidate_ID", row.get("ID", f"CAND-{idx+1}")))
        cat = str(row.get("Category", "N/A"))
        ats = round(float(row.get("ATS_Score", 0.0)), 2)
        sk_score = round(float(row.get("Skill_Score", 0.0)), 2)
        sim = round(float(row.get("Similarity", row.get("Cosine_Similarity", 0.0))), 2)
        rec = str(row.get("Recommendation", "Strong Match"))
        writer.writerow([rank, cid, cat, ats, sk_score, sim, rec])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=Shortlisted_Candidates.csv"}
    )


@app.get(
    "/api/export/screenings",
    tags=["Export"],
    summary="Export screening history to CSV (HR Lead & Admin only)"
)
def export_screenings_csv(
    current_user: User = Depends(require_analytics_access),
    db: Session = Depends(get_db)
):
    screenings = db.query(ScreeningResult).order_by(desc(ScreeningResult.created_at)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Candidate ID", "Candidate Name", "Job Title", "Category", "ATS Score (%)", "Similarity (%)", "Skill Score (%)", "Recommendation", "Filename", "Date"])

    for s in screenings:
        writer.writerow([
            s.id,
            s.candidate_id,
            s.candidate_name,
            s.job_title,
            s.predicted_category,
            round(s.ats_score, 2),
            round(s.similarity_score, 2),
            round(s.skill_score, 2),
            s.recommendation,
            s.resume_filename,
            s.created_at.strftime("%Y-%m-%d %H:%M:%S") if s.created_at else ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=Screening_History.csv"}
    )


# ==========================================
# CANDIDATE RANKINGS & DETAILS ENDPOINTS
# ==========================================

@app.get(
    "/api/candidates",
    response_model=CandidateListResponse,
    tags=["Candidates"],
    summary="Get paginated candidate rankings with search, filter, and sorting"
)
def list_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    min_ats: float = Query(0.0, ge=0.0, le=100.0),
    sort_by: str = Query("Rank"),
    sort_order: str = Query("asc"),
    current_user: User = Depends(get_current_user)
):
    data = candidate_service.get_candidates(
        skip=skip,
        limit=limit,
        category=category,
        search=search,
        min_ats=min_ats,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return CandidateListResponse(**data)


@app.get(
    "/api/candidates/top",
    response_model=List[CandidateItem],
    tags=["Candidates"],
    summary="Get top ranked candidates"
)
def get_top_candidates(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user)
):
    items = candidate_service.get_top_candidates(limit=limit)
    return [CandidateItem(**item) for item in items]


@app.get(
    "/api/candidates/{candidate_id}",
    response_model=CandidateDetailResponse,
    tags=["Candidates"],
    summary="Get comprehensive candidate profile by ID"
)
def get_candidate_detail(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Check if candidate exists in SQLite database
    db_cand = db.query(Candidate).filter(Candidate.candidate_id == candidate_id).first()
    screenings = db.query(ScreeningResult).filter(ScreeningResult.candidate_id == candidate_id).order_by(desc(ScreeningResult.created_at)).all()
    history_items = [ScreeningHistoryItem(**s.to_dict()) for s in screenings] if screenings else []

    if db_cand:
        matched = db_cand.get_matched_skills()
        missing = db_cand.get_missing_skills()
        return CandidateDetailResponse(
            id=db_cand.candidate_id,
            name=db_cand.name,
            category=db_cand.category,
            ats_score=round(db_cand.ats_score, 2),
            similarity=round(db_cand.similarity_score, 2),
            skill_score=round(db_cand.skill_score, 2),
            matched_skills=matched,
            missing_skills=missing,
            recommendation=db_cand.recommendation,
            resume_preview=db_cand.resume_preview,
            screening_history=history_items
        )

    # 2. Check candidate_service (from candidate_ranking.csv corpus)
    candidate = candidate_service.get_candidate_by_id(candidate_id)
    if candidate:
        all_req = ml_service.get_default_skills()
        matched = candidate.get("matched_skills", [])
        missing = [s for s in all_req if s.lower() not in [m.lower() for m in matched]]
        return CandidateDetailResponse(
            id=str(candidate.get("id")),
            name=f"Candidate {candidate.get('id')}",
            rank=candidate.get("rank"),
            category=candidate.get("category"),
            ats_score=candidate.get("ats_score"),
            similarity=candidate.get("similarity"),
            skill_score=candidate.get("skill_score"),
            matched_skills=matched,
            missing_skills=missing,
            recommendation=candidate.get("recommendation"),
            resume_preview=candidate.get("resume_preview"),
            screening_history=history_items
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Candidate with ID '{candidate_id}' not found."
    )


# ==========================================
# ANALYTICS & JOB ANALYSIS ENDPOINTS
# ==========================================

@app.get(
    "/api/analytics",
    response_model=AnalyticsResponse,
    tags=["Analytics"],
    summary="Get aggregated dataset and screening analytics (HR Lead & Admin only)"
)
def get_analytics(
    current_user: User = Depends(require_analytics_access),
    db: Session = Depends(get_db)
):
    base_stats = candidate_service.get_analytics()
    total_screenings = db.query(ScreeningResult).count()

    # Calculate average skill score from database if screenings exist
    avg_skill = 0.0
    if total_screenings > 0:
        db_avg_skill = db.query(func.avg(ScreeningResult.skill_score)).scalar()
        avg_skill = round(float(db_avg_skill), 2) if db_avg_skill else 0.0

    return AnalyticsResponse(
        total_resumes=base_stats["total_resumes"],
        total_candidates=base_stats["total_candidates"],
        shortlisted_candidates=base_stats["shortlisted_candidates"],
        total_screenings=total_screenings,
        average_ats_score=base_stats["average_ats_score"],
        average_skill_score=avg_skill,
        highest_ats_score=base_stats["highest_ats_score"],
        average_shortlist_ats=base_stats["average_shortlist_ats"],
        category_distribution=base_stats["category_distribution"],
        score_distribution=base_stats["score_distribution"],
        skill_distribution=base_stats["skill_distribution"],
        required_skills=base_stats["required_skills"]
    )


@app.post(
    "/api/analyze",
    response_model=AnalyzeJobResponse,
    tags=["Job Description"],
    summary="Analyze and clean target job description requirements"
)
def analyze_job_description(
    payload: AnalyzeJobRequest,
    current_user: User = Depends(get_current_user)
):
    cleaned = preprocess_text(payload.job_description)
    default_skills = ml_service.get_default_skills()
    effective = payload.required_skills if payload.required_skills else default_skills

    return AnalyzeJobResponse(
        cleaned_job_description=cleaned,
        required_skills=effective,
        skills_count=len(effective),
        default_skills=default_skills
    )


@app.get(
    "/api/skills",
    tags=["Skills"],
    summary="Get default target skills loaded from ML pipeline"
)
def get_skills(current_user: User = Depends(get_current_user)):
    return {
        "skills": ml_service.get_default_skills(),
        "count": len(ml_service.get_default_skills())
    }



# ==========================================
# RBAC: USER MANAGEMENT (Admin Only)
# ==========================================

@app.get(
    "/api/users",
    response_model=List[UserResponse],
    tags=["User Management"],
    summary="List all registered system users (Admin only)"
)
def list_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(desc(User.created_at)).all()
    return [UserResponse(**u.to_dict()) for u in users]


@app.put(
    "/api/users/{user_id}/role",
    response_model=UserResponse,
    tags=["User Management"],
    summary="Update user role (Admin only)"
)
def update_user_role(
    user_id: int,
    payload: UpdateUserRoleRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User account not found.")

    new_role = normalize_role(payload.role)
    if new_role not in ["admin", "recruiter", "hiring_manager", "hr_lead"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Must be 'admin', 'recruiter', 'hiring_manager', or 'hr_lead'."
        )

    old_role = target_user.role
    target_user.role = new_role
    db.commit()
    db.refresh(target_user)

    log_activity(
        db,
        "ROLE_UPDATED",
        current_user.email,
        current_user.role,
        f"Changed role for {target_user.email} from {old_role} to {new_role}"
    )

    return UserResponse(**target_user.to_dict())


# ==========================================
# RBAC: ACTIVITY LOGS & AUDIT (Admin Only)
# ==========================================

@app.get(
    "/api/activity-logs",
    tags=["Activity Logs"],
    summary="List system audit and security logs (Admin only)"
)
def list_activity_logs(
    limit: int = 50,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(ActivityLog).order_by(desc(ActivityLog.created_at)).limit(limit).all()
    return [log.to_dict() for log in logs]


# ==========================================
# RBAC: SYSTEM CONFIGURATION (Admin Only)
# ==========================================

DEFAULT_SYSTEM_SETTINGS = {
    "status": "operational",
    "model_name": "LinearSVC_TFIDF_v1",
    "similarity_weight_default": 40,
    "skill_weight_default": 60,
    "shortlist_threshold_default": 50,
    "allowed_extensions": ["pdf", "docx", "txt"],
    "max_file_size_mb": 10,
    "supported_roles": ["Admin", "Recruiter", "Hiring Manager", "HR Lead"],
    "candidate_auto_tagging": True,
    "duplicate_resume_detection": True,
    "data_retention_days": 365
}


@app.get(
    "/api/settings/system",
    response_model=SystemSettingsResponse,
    tags=["System Settings"],
    summary="Get system AI configuration parameters (Admin only)"
)
def get_system_settings(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == "system_config").first()
    if setting:
        try:
            saved_data = json.loads(setting.value)
            merged = {**DEFAULT_SYSTEM_SETTINGS, **saved_data}
            return SystemSettingsResponse(**merged)
        except Exception:
            pass
    return SystemSettingsResponse(**DEFAULT_SYSTEM_SETTINGS)


@app.put(
    "/api/settings/system",
    response_model=SystemSettingsResponse,
    tags=["System Settings"],
    summary="Update system AI configuration parameters (Admin only)"
)
def update_system_settings(
    payload: UpdateSystemSettingsRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == "system_config").first()
    current_data = dict(DEFAULT_SYSTEM_SETTINGS)
    if setting:
        try:
            current_data.update(json.loads(setting.value))
        except Exception:
            pass

    update_dict = payload.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        if v is not None:
            current_data[k] = v

    if not setting:
        setting = SystemSetting(key="system_config", value=json.dumps(current_data))
        db.add(setting)
    else:
        setting.value = json.dumps(current_data)
        setting.updated_at = datetime.utcnow()

    db.commit()
    log_activity(
        db,
        "SYSTEM_SETTINGS_UPDATED",
        current_user.email,
        current_user.role,
        "Admin updated system screening and model configuration parameters"
    )
    return SystemSettingsResponse(**current_data)


# ==========================================
# RECRUITMENT PIPELINE & INTERVIEWS
# ==========================================

@app.get(
    "/api/interviews",
    response_model=List[InterviewResponse],
    tags=["Interviews"],
    summary="List all scheduled interviews (Authenticated users only)"
)
def list_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interviews = db.query(Interview).order_by(Interview.scheduled_at.asc()).all()
    return [InterviewResponse(**i.to_dict()) for i in interviews]


@app.post(
    "/api/interviews",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Interviews"],
    summary="Schedule a new interview (Recruiter, Hiring Manager & Admin only)"
)
def create_interview(
    payload: InterviewCreate,
    current_user: User = Depends(require_roles(["admin", "recruiter", "hiring_manager"])),
    db: Session = Depends(get_db)
):
    try:
        scheduled_dt = datetime.fromisoformat(payload.scheduled_at.replace("Z", "+00:00"))
    except Exception:
        scheduled_dt = datetime.utcnow()

    interview = Interview(
        candidate_id=payload.candidate_id,
        candidate_name=payload.candidate_name,
        candidate_email=payload.candidate_email,
        job_title=payload.job_title,
        interviewer=payload.interviewer,
        stage=payload.stage or "Technical Round",
        scheduled_at=scheduled_dt,
        status=payload.status or "Scheduled",
        meeting_type=payload.meeting_type or "Video Conference",
        notes=payload.notes
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    log_activity(
        db,
        "INTERVIEW_SCHEDULED",
        current_user.email,
        current_user.role,
        f"Scheduled interview for {interview.candidate_name} ({interview.job_title})"
    )
    return InterviewResponse(**interview.to_dict())


@app.delete(
    "/api/interviews/{interview_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Interviews"],
    summary="Cancel / delete an interview (Recruiter, Hiring Manager & Admin only)"
)
def delete_interview(
    interview_id: int,
    current_user: User = Depends(require_roles(["admin", "recruiter", "hiring_manager"])),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")
    db.delete(interview)
    db.commit()
    log_activity(
        db,
        "INTERVIEW_CANCELLED",
        current_user.email,
        current_user.role,
        f"Cancelled interview ID {interview_id}"
    )
    return None



