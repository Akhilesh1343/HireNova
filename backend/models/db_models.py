import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=True)
    role = Column(String(50), default="recruiter", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    avatar_url = Column(Text, nullable=True)
    notification_preferences = Column(Text, nullable=True)  # JSON-encoded dictionary
    theme_preference = Column(String(50), default="dark", nullable=True)

    # Relationships
    job_descriptions = relationship("JobDescription", back_populates="creator", cascade="all, delete-orphan")
    screening_results = relationship("ScreeningResult", back_populates="recruiter")

    def to_dict(self):
        notif_prefs = None
        if getattr(self, "notification_preferences", None):
            try:
                notif_prefs = json.loads(self.notification_preferences)
            except Exception:
                notif_prefs = None
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "company_name": getattr(self, "company_name", None),
            "role": self.role,
            "is_active": self.is_active,
            "avatar_url": getattr(self, "avatar_url", None),
            "notification_preferences": notif_prefs,
            "theme_preference": getattr(self, "theme_preference", "dark") or "dark",
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        try:
            val = json.loads(self.value)
        except Exception:
            val = self.value
        return {
            "key": self.key,
            "value": val,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(100), nullable=True)
    category = Column(String(100), index=True, nullable=False)
    ats_score = Column(Float, default=0.0, nullable=False)
    similarity_score = Column(Float, default=0.0, nullable=False)
    skill_score = Column(Float, default=0.0, nullable=False)
    matched_skills = Column(Text, default="[]", nullable=False)  # JSON-encoded array
    missing_skills = Column(Text, default="[]", nullable=False)  # JSON-encoded array
    recommendation = Column(String(100), nullable=False)
    resume_preview = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    screenings = relationship("ScreeningResult", back_populates="candidate", cascade="all, delete-orphan")

    def get_matched_skills(self):
        try:
            return json.loads(self.matched_skills) if self.matched_skills else []
        except Exception:
            return []

    def get_missing_skills(self):
        try:
            return json.loads(self.missing_skills) if self.missing_skills else []
        except Exception:
            return []

    def to_dict(self):
        return {
            "id": self.candidate_id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "category": self.category,
            "ats_score": self.ats_score,
            "similarity": self.similarity_score,
            "skill_score": self.skill_score,
            "matched_skills": self.get_matched_skills(),
            "missing_skills": self.get_missing_skills(),
            "recommendation": self.recommendation,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=False)
    required_skills = Column(Text, default="[]", nullable=False)  # JSON-encoded list of skills
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    creator = relationship("User", back_populates="job_descriptions")
    screenings = relationship("ScreeningResult", back_populates="job_description")

    def get_skills_list(self):
        try:
            return json.loads(self.required_skills) if self.required_skills else []
        except Exception:
            return []

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "required_skills": self.get_skills_list(),
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(String(100), ForeignKey("candidates.candidate_id"), index=True, nullable=False)
    candidate_name = Column(String(255), nullable=True)
    predicted_category = Column(String(100), index=True, nullable=False)
    similarity_score = Column(Float, nullable=False)
    skill_score = Column(Float, nullable=False)
    ats_score = Column(Float, index=True, nullable=False)
    matched_skills = Column(Text, default="[]", nullable=False)  # JSON-encoded list
    missing_skills = Column(Text, default="[]", nullable=False)  # JSON-encoded list
    recommendation = Column(String(100), index=True, nullable=False)
    resume_filename = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True)
    job_title = Column(String(255), nullable=True)
    job_description_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    # Relationships
    candidate = relationship("Candidate", back_populates="screenings")
    job_description = relationship("JobDescription", back_populates="screenings")
    recruiter = relationship("User", back_populates="screening_results")

    def get_matched_skills(self):
        try:
            return json.loads(self.matched_skills) if self.matched_skills else []
        except Exception:
            return []

    def get_missing_skills(self):
        try:
            return json.loads(self.missing_skills) if self.missing_skills else []
        except Exception:
            return []

    def to_dict(self):
        return {
            "id": self.id,
            "candidate_id": self.candidate_id,
            "candidate_name": self.candidate_name or f"Candidate {self.candidate_id}",
            "predicted_category": self.predicted_category,
            "similarity_score": round(self.similarity_score, 2),
            "skill_score": round(self.skill_score, 2),
            "ats_score": round(self.ats_score, 2),
            "matched_skills": self.get_matched_skills(),
            "missing_skills": self.get_missing_skills(),
            "recommendation": self.recommendation,
            "resume_filename": self.resume_filename,
            "file_type": self.file_type or (self.resume_filename.split(".")[-1].upper() if self.resume_filename and "." in self.resume_filename else "PDF"),
            "job_title": self.job_title or "General Screening",
            "job_description_id": self.job_description_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    user_email = Column(String(255), nullable=False)
    user_role = Column(String(50), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "action": self.action,
            "user_email": self.user_email,
            "user_role": self.user_role,
            "details": self.details,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(String(100), index=True, nullable=False)
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255), nullable=True)
    job_title = Column(String(255), nullable=False)
    interviewer = Column(String(255), nullable=False)
    stage = Column(String(100), default="Technical Round", nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    status = Column(String(50), default="Scheduled", nullable=False)
    meeting_type = Column(String(100), default="Video Conference", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "candidate_id": self.candidate_id,
            "candidate_name": self.candidate_name,
            "candidate_email": self.candidate_email,
            "job_title": self.job_title,
            "interviewer": self.interviewer,
            "stage": self.stage,
            "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
            "status": self.status,
            "meeting_type": self.meeting_type,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


