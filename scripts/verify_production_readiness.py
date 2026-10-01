"""
Production Readiness & End-to-End System Test Suite
Executes real system tests across all 12 operational dimensions.
"""

import sys
import os
import json
import io
import time
from fastapi.testclient import TestClient

# Ensure root is in python path
sys.path.insert(0, os.path.abspath("."))

from backend.main import app
from backend.database import SessionLocal, engine
from backend.models.db_models import User, Candidate, JobDescription, ScreeningResult
from backend.services.ml_service import ml_service
from backend.services.candidate_service import candidate_service

client = TestClient(app)

results = {}

def report(name, status, details=""):
    results[name] = status
    icon = "[PASS]" if status else "[FAIL]"
    print(f"{icon} {name.ljust(25)}: {details}")

print("=" * 70)
print("     FINAL PRODUCTION HARDENING & E2E VERIFICATION TEST SUITE     ")
print("=" * 70)

# -------------------------------------------------------------
# 1. FRONTEND BUILD VERIFICATION
# -------------------------------------------------------------
try:
    dist_html = os.path.abspath("frontend/dist/index.html")
    dist_assets = os.path.abspath("frontend/dist/assets")
    if os.path.exists(dist_html) and os.path.exists(dist_assets) and len(os.listdir(dist_assets)) > 0:
        html_size = os.path.getsize(dist_html)
        report("Frontend Build", True, f"Verified dist/index.html ({html_size} B) & assets bundle")
    else:
        report("Frontend Build", False, "frontend/dist bundle missing")
except Exception as e:
    report("Frontend Build", False, str(e))

# -------------------------------------------------------------
# 2. BACKEND & HEALTH CHECK
# -------------------------------------------------------------
try:
    r_root = client.get("/")
    r_docs = client.get("/docs")
    r_health = client.get("/api/health")
    assert r_root.status_code == 200
    assert r_docs.status_code == 200
    assert r_health.status_code == 200
    h_data = r_health.json()
    assert h_data["status"] == "healthy"
    assert h_data["model_loaded"] is True
    assert h_data["vectorizer_loaded"] is True
    assert h_data["database_connected"] is True
    report("Backend", True, f"Status: {h_data['status']}, Models & DB confirmed")
except Exception as e:
    report("Backend", False, str(e))

# -------------------------------------------------------------
# 3. DATABASE VERIFICATION
# -------------------------------------------------------------
try:
    db = SessionLocal()
    user_count = db.query(User).count()
    job_count = db.query(JobDescription).count()
    cand_count = db.query(Candidate).count()
    db.close()
    assert user_count >= 1
    assert job_count >= 1
    report("Database", True, f"SQLite online with {user_count} users, {job_count} jobs, {cand_count} candidates")
except Exception as e:
    report("Database", False, str(e))

# -------------------------------------------------------------
# 4. AUTHENTICATION (Register, Login, Me, Token)
# -------------------------------------------------------------
auth_headers = {}
test_email = f"qa.evaluator.{int(time.time())}@talentai.com"
try:
    # 4a. Register
    reg_payload = {
        "email": test_email,
        "password": "SecurePassword123!",
        "full_name": "QA Principal Evaluator",
        "role": "recruiter"
    }
    r_reg = client.post("/api/auth/register", json=reg_payload)
    assert r_reg.status_code == 200, f"Register status {r_reg.status_code}: {r_reg.text}"
    token_reg = r_reg.json()["access_token"]

    # 4b. Login
    login_payload = {
        "email": test_email,
        "password": "SecurePassword123!"
    }
    r_login = client.post("/api/auth/login", json=login_payload)
    assert r_login.status_code == 200, f"Login status {r_login.status_code}: {r_login.text}"
    login_data = r_login.json()
    token = login_data["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 4c. Profile
    r_me = client.get("/api/auth/me", headers=auth_headers)
    assert r_me.status_code == 200
    assert r_me.json()["email"] == test_email
    report("Authentication", True, f"JWT issued & validated for {test_email}")
except Exception as e:
    report("Authentication", False, str(e))

# -------------------------------------------------------------
# 5. JOB DESCRIPTION MANAGEMENT
# -------------------------------------------------------------
target_job_id = None
target_jd_text = ""
target_skills = []
try:
    # Create Job
    job_payload = {
        "title": "Principal Python Backend Engineer",
        "description": "Seeking Principal Python Engineer with expertise in Python, Django, Flask, SQL, REST API, Git, Data Structures, and Software Development.",
        "required_skills": ["python", "django", "flask", "sql", "rest api", "git", "data structures", "software development"]
    }
    r_job = client.post("/api/jobs", json=job_payload, headers=auth_headers)
    assert r_job.status_code == 201
    job_data = r_job.json()
    target_job_id = job_data["id"]
    target_jd_text = job_data["description"]
    target_skills = job_data["required_skills"]

    # List Jobs
    r_list = client.get("/api/jobs", headers=auth_headers)
    assert r_list.status_code == 200
    assert any(j["id"] == target_job_id for j in r_list.json())
    report("Job Management", True, f"Created Job ID {target_job_id}: {job_data['title']}")
except Exception as e:
    report("Job Management", False, str(e))

# -------------------------------------------------------------
# 6. RESUME UPLOAD (PDF, DOCX, TXT)
# -------------------------------------------------------------
screening_result_data = None
try:
    # 6a. Upload Demo PDF
    pdf_path = os.path.abspath("data/demo_resumes/Sample_IT_Engineer_Resume.pdf")
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    r_pdf = client.post(
        "/api/screen-resume",
        files={"file": ("Sample_IT_Engineer_Resume.pdf", pdf_bytes, "application/pdf")},
        data={
            "job_description": target_jd_text,
            "required_skills": json.dumps(target_skills),
            "job_title": "Principal Python Backend Engineer",
            "job_description_id": target_job_id,
            "candidate_name": "Rohan IT Specialist"
        },
        headers=auth_headers
    )
    assert r_pdf.status_code == 200, f"PDF upload failed: {r_pdf.text}"

    # 6b. Upload Demo DOCX
    docx_path = os.path.abspath("data/demo_resumes/Alex_Rivera_FullStack.docx")
    with open(docx_path, "rb") as f:
        docx_bytes = f.read()
    r_docx = client.post(
        "/api/screen-resume",
        files={"file": ("Alex_Rivera_FullStack.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        data={
            "job_description": target_jd_text,
            "required_skills": json.dumps(target_skills),
            "job_title": "Principal Python Backend Engineer",
            "job_description_id": target_job_id,
            "candidate_name": "Alex Rivera"
        },
        headers=auth_headers
    )
    assert r_docx.status_code == 200, f"DOCX upload failed: {r_docx.text}"

    # 6c. Upload Demo TXT
    txt_path = os.path.abspath("data/demo_resumes/Elena_Rostova_Python_Expert.txt")
    with open(txt_path, "rb") as f:
        txt_bytes = f.read()
    r_txt = client.post(
        "/api/screen-resume",
        files={"file": ("Elena_Rostova_Python_Expert.txt", txt_bytes, "text/plain")},
        data={
            "job_description": target_jd_text,
            "required_skills": json.dumps(target_skills),
            "job_title": "Principal Python Backend Engineer",
            "job_description_id": target_job_id,
            "candidate_name": "Elena Rostova"
        },
        headers=auth_headers
    )
    assert r_txt.status_code == 200, f"TXT upload failed: {r_txt.text}"
    screening_result_data = r_txt.json()
    report("Resume Upload", True, "Successfully uploaded & parsed PDF, DOCX, and TXT resumes")
except Exception as e:
    report("Resume Upload", False, str(e))

# -------------------------------------------------------------
# 7. ML PREDICTION & LINEARSVC CLASSIFICATION
# -------------------------------------------------------------
try:
    assert screening_result_data is not None
    pred_category = screening_result_data["predicted_category"]
    assert pred_category in [
        "ENGINEERING", "INFORMATION-TECHNOLOGY", "ACCOUNTANT", "ADVOCATE",
        "AGRICULTURE", "APPAREL", "ARTS", "AUTOMOBILE", "AVIATION", "BANKING",
        "BPO", "BUSINESS-DEVELOPMENT", "CHEF", "CONSTRUCTION", "CONSULTANT",
        "DESIGNER", "DIGITAL-MEDIA", "FINANCE", "FITNESS", "HEALTHCARE", "HR",
        "PUBLIC-RELATIONS", "SALES", "TEACHER"
    ]
    report("ML Prediction", True, f"LinearSVC classified candidate as '{pred_category}'")
except Exception as e:
    report("ML Prediction", False, str(e))

# -------------------------------------------------------------
# 8. ATS SCORING & SKILL MATCHING
# -------------------------------------------------------------
try:
    assert screening_result_data is not None
    ats = screening_result_data["ats_score"]
    sim = screening_result_data["similarity_score"]
    sk = screening_result_data["skill_score"]
    matched = screening_result_data["matched_skills"]
    missing = screening_result_data["missing_skills"]
    rec = screening_result_data["recommendation"]

    # Verify ATS formula: (sim * 0.4) + (sk * 0.6)
    expected_ats = round((sim * 0.4) + (sk * 0.6), 2)
    assert abs(ats - expected_ats) < 0.1, f"ATS mismatch: {ats} vs expected {expected_ats}"
    assert len(matched) > 0
    assert rec in ["Strong Match", "Good Match", "Moderate Match", "Low Match"]
    report("ATS Scoring", True, f"ATS: {ats}%, Sim: {sim}%, Skill: {sk}%, Rec: {rec}")
except Exception as e:
    report("ATS Scoring", False, str(e))

# -------------------------------------------------------------
# 9. CANDIDATE RANKING & DETAILS
# -------------------------------------------------------------
try:
    # 9a. List candidates
    r_cands = client.get("/api/candidates?skip=0&limit=10&min_ats=20.0")
    assert r_cands.status_code == 200
    cand_resp = r_cands.json()
    assert cand_resp["total"] > 0
    first_cand = cand_resp["candidates"][0]

    # 9b. Get Candidate Details
    r_detail = client.get(f"/api/candidates/{first_cand['id']}")
    assert r_detail.status_code == 200
    detail = r_detail.json()
    assert detail["id"] == first_cand["id"]
    report("Candidate Ranking", True, f"Loaded rankings. Candidate {detail['id']} ATS: {detail['ats_score']}%")
except Exception as e:
    report("Candidate Ranking", False, str(e))

# -------------------------------------------------------------
# 10. ANALYTICS & INSIGHTS
# -------------------------------------------------------------
try:
    r_analytics = client.get("/api/analytics")
    assert r_analytics.status_code == 200
    a_data = r_analytics.json()
    assert a_data["total_resumes"] == 2484
    assert a_data["total_candidates"] == 2484
    assert len(a_data["category_distribution"]) > 0
    assert len(a_data["score_distribution"]) > 0
    assert a_data["total_screenings"] >= 3
    report("Analytics", True, f"Analyzed 2,484 resumes, {a_data['total_screenings']} dynamic screenings recorded")
except Exception as e:
    report("Analytics", False, str(e))

# -------------------------------------------------------------
# 11. EXPORT ENDPOINTS (Rankings, Shortlist, Screenings)
# -------------------------------------------------------------
try:
    # Rankings CSV
    r_exp_rank = client.get("/api/export/rankings")
    assert r_exp_rank.status_code == 200
    assert "Rank,Candidate ID" in r_exp_rank.text[:50]

    # Shortlist CSV
    r_exp_short = client.get("/api/export/shortlist")
    assert r_exp_short.status_code == 200
    assert "Rank,Candidate ID" in r_exp_short.text[:50]

    # Screenings CSV
    r_exp_screen = client.get("/api/export/screenings")
    assert r_exp_screen.status_code == 200
    assert "ID,Candidate ID" in r_exp_screen.text[:50]
    report("Export", True, "Exported Rankings, Shortlist, and Screening History CSVs successfully")
except Exception as e:
    report("Export", False, str(e))

# -------------------------------------------------------------
# 12. SECURITY CHECK
# -------------------------------------------------------------
try:
    # 12a. Verify Password Hashing (bcrypt format)
    db = SessionLocal()
    user_rec = db.query(User).filter(User.email == test_email).first()
    assert user_rec is not None
    assert user_rec.hashed_password.startswith("$2b$") or user_rec.hashed_password.startswith("$2a$")
    assert "SecurePassword123!" not in user_rec.hashed_password
    db.close()

    # 12b. File validation: reject invalid extension (.exe)
    r_bad_ext = client.post(
        "/api/screen-resume",
        files={"file": ("exploit.exe", b"malicious binary payload", "application/x-msdownload")},
        data={"job_description": "Standard JD"}
    )
    assert r_bad_ext.status_code == 400
    assert "Unsupported file format" in r_bad_ext.json()["detail"]

    # 12c. Empty file validation
    r_empty = client.post(
        "/api/screen-resume",
        files={"file": ("empty.pdf", b"", "application/pdf")},
        data={"job_description": "Standard JD"}
    )
    assert r_empty.status_code == 400

    # 12d. Protected route unauthenticated rejection
    r_unauth = client.get("/api/auth/me")
    assert r_unauth.status_code == 401

    report("Security Check", True, "Bcrypt verified, file validation active, auth boundaries enforced")
except Exception as e:
    report("Security Check", False, str(e))

# -------------------------------------------------------------
# 13. PRODUCTION BUILD CHECK
# -------------------------------------------------------------
try:
    prod_index = os.path.abspath("frontend/dist/index.html")
    assert os.path.exists(prod_index)
    report("Production Build", True, "Vite production bundle compiled and ready for static hosting")
except Exception as e:
    report("Production Build", False, str(e))

print("=" * 70)
all_passed = all(results.values())
print(f"OVERALL SYSTEM READINESS STATUS: {'PASSED (12/12)' if all_passed else 'FAILED'}")
print("=" * 70)

if not all_passed:
    sys.exit(1)
