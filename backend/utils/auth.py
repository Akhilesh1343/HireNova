import os
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.db_models import User

# Configuration & Secrets
SECRET_KEY = os.getenv("SECRET_KEY", "talent-ai-recruiter-jwt-secret-key-production-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    """Hash plaintext password using bcrypt with automated salt generation."""
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    token_query: Optional[str] = Query(None, alias="token"),
    db: Session = Depends(get_db)
) -> User:
    """FastAPI dependency to authenticate requests using Bearer JWT or query param token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session has expired. Please sign in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    auth_token = token or token_query
    if not auth_token:
        raise credentials_exception

    try:
        payload = jwt.decode(auth_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    token_query: Optional[str] = Query(None, alias="token"),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Dependency that returns current user if token is valid, or None if unauthenticated."""
    auth_token = token or token_query
    if not auth_token:
        return None
    try:
        payload = jwt.decode(auth_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            return None
        return db.query(User).filter(User.email == email, User.is_active == True).first()
    except Exception:
        return None


def normalize_role(role_name: Optional[str]) -> str:
    """Normalize role string to canonical form: admin, recruiter, hiring_manager, hr_lead."""
    if not role_name:
        return "recruiter"
    return role_name.strip().lower().replace(" ", "_").replace("-", "_")


def require_roles(allowed_roles: list):
    """
    FastAPI dependency factory enforcing that the authenticated user's role
    matches one of the allowed roles. Returns 403 Forbidden otherwise.
    """
    normalized_allowed = [normalize_role(r) for r in allowed_roles]

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = normalize_role(current_user.role)
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden. This action requires one of the following roles: {', '.join(allowed_roles)}. Your current role is '{current_user.role}'."
            )
        return current_user

    return role_checker


# Canonical RBAC Dependencies
require_admin = require_roles(["admin"])
require_screening_access = require_roles(["admin", "recruiter"])
require_job_manage_access = require_roles(["admin", "recruiter"])
require_analytics_access = require_roles(["admin", "hr_lead"])


def create_password_reset_token(email: str) -> str:
    """Generate a secure signed JWT password reset token with 30-minute validity."""
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode = {
        "sub": email.lower().strip(),
        "type": "password_reset",
        "exp": expire
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token integrity and return associated email or None if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "password_reset":
            return None
        return payload.get("sub")
    except JWTError:
        return None
