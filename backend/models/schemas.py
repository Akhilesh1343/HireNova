from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr


# ==========================================
# AUTHENTICATION SCHEMAS
# ==========================================

class UserRegisterRequest(BaseModel):
    email: str = Field(..., description="Recruiter email address")
    password: str = Field(..., min_length=8, description="Password (at least 8 characters)")
    full_name: str = Field(..., min_length=2, description="Full recruiter name")
    company_name: Optional[str] = Field(None, description="Company or organization name")
    role: Optional[str] = Field("recruiter", description="User role")


class UserLoginRequest(BaseModel):
    email: str = Field(..., description="Recruiter email address")
    password: str = Field(..., description="User password")


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Registered work email address")


class ForgotPasswordResponse(BaseModel):
    message: str
    status: str = "success"


class VerifyResetTokenResponse(BaseModel):
    valid: bool
    email: Optional[str] = None
    message: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password (minimum 8 characters)")
    confirm_password: Optional[str] = None


class ResetPasswordResponse(BaseModel):
    message: str
    status: str = "success"


class OAuthConfigResponse(BaseModel):
    google_enabled: bool
    apple_enabled: bool


class OAuthUrlResponse(BaseModel):
    provider: str
    auth_url: str


class OAuthLoginRequest(BaseModel):
    provider: str
    code: Optional[str] = None
    credential: Optional[str] = None
    id_token: Optional[str] = None
    redirect_uri: Optional[str] = None



class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    company_name: Optional[str] = None
    role: str
    is_active: bool
    avatar_url: Optional[str] = None
    notification_preferences: Optional[Dict[str, Any]] = None
    theme_preference: Optional[str] = "dark"
    created_at: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, description="User full name")
    company_name: Optional[str] = Field(None, description="Company or organization name")
    email: Optional[str] = Field(None, description="Updated work email address")
    avatar_url: Optional[str] = Field(None, description="Base64 or URL profile photo")
    notification_preferences: Optional[Dict[str, Any]] = Field(None, description="Notification alert settings")
    theme_preference: Optional[str] = Field(None, description="Visual theme preference ('dark' or 'light')")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current account password")
    new_password: str = Field(..., min_length=8, description="New password (minimum 8 characters)")
    confirm_password: Optional[str] = Field(None, description="Password confirmation")


class UpdatePreferencesRequest(BaseModel):
    theme_preference: Optional[str] = Field(None, description="Visual theme preference ('dark' or 'light')")
    notification_preferences: Optional[Dict[str, Any]] = Field(None, description="Notification alert settings")


class SystemSettingsResponse(BaseModel):
    status: str = "operational"
    model_name: str = "LinearSVC_TFIDF_v1"
    similarity_weight_default: int = 40
    skill_weight_default: int = 60
    shortlist_threshold_default: int = 50
    allowed_extensions: List[str] = ["pdf", "docx", "txt"]
    max_file_size_mb: int = 10
    supported_roles: List[str] = ["Admin", "Recruiter", "Hiring Manager", "HR Lead"]
    candidate_auto_tagging: Optional[bool] = True
    duplicate_resume_detection: Optional[bool] = True
    data_retention_days: Optional[int] = 365


class UpdateSystemSettingsRequest(BaseModel):
    similarity_weight_default: Optional[int] = None
    skill_weight_default: Optional[int] = None
    shortlist_threshold_default: Optional[int] = None
    model_name: Optional[str] = None
    max_file_size_mb: Optional[int] = None
    allowed_extensions: Optional[List[str]] = None
    candidate_auto_tagging: Optional[bool] = None
    duplicate_resume_detection: Optional[bool] = None
    data_retention_days: Optional[int] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UpdateUserRoleRequest(BaseModel):
    role: str = Field(..., description="Target canonical role: admin, recruiter, hiring_manager, hr_lead")


# ==========================================
# JOB DESCRIPTION SCHEMAS
# ==========================================

class JobDescriptionCreate(BaseModel):
    title: str = Field(..., min_length=3, description="Role title, e.g. Senior Python Developer")
    description: str = Field(..., min_length=10, description="Full job description requirements")
    required_skills: List[str] = Field(default_factory=list, description="Target list of required skills")


class JobDescriptionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None


class JobDescriptionResponse(BaseModel):
    id: int
    title: str
    description: str
    required_skills: List[str]
    user_id: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ==========================================
# SCREENING & CANDIDATE SCHEMAS
# ==========================================

class ScreenResumeResponse(BaseModel):
    candidate_id: str = Field(..., description="Unique generated or extracted candidate identifier")
    predicted_category: str = Field(..., description="Predicted professional industry category from LinearSVC model")
    similarity_score: float = Field(..., description="Cosine similarity percentage between resume and job description (40% weight)")
    skill_score: float = Field(..., description="Percentage of required skills matched (60% weight)")
    ats_score: float = Field(..., description="Composite weighted ATS score")
    matched_skills: List[str] = Field(default_factory=list, description="List of required skills detected in resume")
    missing_skills: List[str] = Field(default_factory=list, description="List of required skills missing from resume")
    recommendation: str = Field(..., description="ATS recommendation based on score thresholds")
    file_name: Optional[str] = None
    candidate_name: Optional[str] = None
    extracted_text_preview: Optional[str] = None
    screening_id: Optional[int] = None
    job_title: Optional[str] = None


class BatchScreenResumeResponse(BaseModel):
    total_screened: int
    job_title: Optional[str] = None
    results: List[ScreenResumeResponse]



class ScreeningHistoryItem(BaseModel):
    id: int
    candidate_id: str
    candidate_name: str
    predicted_category: str
    similarity_score: float
    skill_score: float
    ats_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    recommendation: str
    resume_filename: Optional[str] = None
    file_type: Optional[str] = None
    job_title: Optional[str] = None
    job_description_id: Optional[int] = None
    created_at: Optional[str] = None


class ScreeningHistoryListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    screenings: List[ScreeningHistoryItem]


class ResumeFileItem(BaseModel):
    id: int
    filename: str
    file_type: str
    candidate_id: str
    candidate_name: str
    category: str
    ats_score: float
    recommendation: str
    upload_date: Optional[str] = None


class ResumeFileListResponse(BaseModel):
    total: int
    resumes: List[ResumeFileItem]


class AnalyzeJobRequest(BaseModel):
    job_description: str = Field(..., min_length=5, description="Full text of the target job description")
    required_skills: Optional[List[str]] = Field(default=None, description="Optional custom list of required skills")


class AnalyzeJobResponse(BaseModel):
    cleaned_job_description: str
    required_skills: List[str]
    skills_count: int
    default_skills: List[str]


class CandidateItem(BaseModel):
    rank: int
    id: str
    category: str
    similarity: float
    skill_score: float
    ats_score: float
    matched_skills: List[str]
    recommendation: str


class CandidateListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    candidates: List[CandidateItem]


class CategoryCount(BaseModel):
    category: str
    count: int


class ScoreBucket(BaseModel):
    range: str
    count: int


class SkillStat(BaseModel):
    skill: str
    count: int


class AnalyticsResponse(BaseModel):
    total_resumes: int
    total_candidates: int
    shortlisted_candidates: int
    total_screenings: int = 0
    average_ats_score: float
    average_skill_score: float = 0.0
    highest_ats_score: float
    average_shortlist_ats: float
    category_distribution: List[CategoryCount]
    score_distribution: List[ScoreBucket]
    skill_distribution: List[SkillStat]
    required_skills: List[str]


class CandidateDetailResponse(BaseModel):
    id: str
    name: Optional[str] = None
    rank: Optional[int] = None
    category: str
    ats_score: float
    similarity: float
    skill_score: float
    matched_skills: List[str]
    missing_skills: Optional[List[str]] = None
    recommendation: str
    resume_preview: Optional[str] = None
    screening_history: Optional[List[ScreeningHistoryItem]] = None


class InterviewCreate(BaseModel):
    candidate_id: str
    candidate_name: str
    candidate_email: Optional[str] = None
    job_title: str
    interviewer: str
    stage: str = "Technical Round"
    scheduled_at: str
    status: Optional[str] = "Scheduled"
    meeting_type: Optional[str] = "Video Conference"
    notes: Optional[str] = None


class InterviewResponse(BaseModel):
    id: int
    candidate_id: str
    candidate_name: str
    candidate_email: Optional[str] = None
    job_title: str
    interviewer: str
    stage: str
    scheduled_at: Optional[str] = None
    status: str
    meeting_type: str
    notes: Optional[str] = None
    created_at: Optional[str] = None


class WeeklyActivityItem(BaseModel):
    date: str
    count: int
    day: str


class PublicRecentActivity(BaseModel):
    id: int
    job_title: str
    category: str
    ats_score: float
    recommendation: str
    created_at: Optional[str] = None


class DashboardSummaryResponse(BaseModel):
    total_candidates: int
    total_jobs: int
    total_screenings: int
    total_shortlisted: int
    average_ats_score: float
    ml_engine_status: str
    model_name: str
    scoring_formula: Dict[str, Any]
    weekly_activity: List[WeeklyActivityItem]
    pipeline_stages: Dict[str, int]
    category_distribution: List[Dict[str, Any]]
    recent_public_activity: List[PublicRecentActivity]


