import requests
import json
import os

BASE_URL = "http://127.0.0.1:8000"

def test_phase4():
    print("=== TESTING PHASE 4 BACKEND FEATURES ===")
    
    # 1. Test Health Check
    print("\n--- 1. Health Check (GET /api/health) ---")
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    health_data = r.json()
    print("Health response:", health_data)
    assert health_data["status"] == "healthy"
    assert health_data["model_loaded"] is True
    assert health_data["database_connected"] is True
    print("[PASS] Health check verified!")

    # 2. Test Default Admin Login
    print("\n--- 2. Default Recruiter Login (POST /api/auth/login) ---")
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@talentai.com",
        "password": "admin123"
    })
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    token_data = r.json()
    token = token_data["access_token"]
    user_info = token_data["user"]
    print(f"Logged in user: {user_info['full_name']} ({user_info['email']})")
    assert "access_token" in token_data
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Admin authentication verified!")

    # 3. Test Register New Recruiter
    print("\n--- 3. Recruiter Registration (POST /api/auth/register) ---")
    reg_email = f"test.recruiter.{abs(hash(os.urandom(8)))}@example.com"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": reg_email,
        "password": "password123",
        "full_name": "Test Recruiter",
        "role": "recruiter"
    })
    assert r.status_code == 200, f"Registration failed: {r.text}"
    reg_data = r.json()
    print("Registered user:", reg_data["user"])
    print("[PASS] Recruiter registration verified!")

    # 4. Test Current User Profile (GET /api/auth/me)
    print("\n--- 4. Current User Profile (GET /api/auth/me) ---")
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    assert r.status_code == 200, f"Get me failed: {r.text}"
    print("Me response:", r.json())
    print("[PASS] Auth /me endpoint verified!")

    # 5. Test Job Descriptions CRUD
    print("\n--- 5. Job Description CRUD ---")
    # List jobs
    r = requests.get(f"{BASE_URL}/api/jobs")
    assert r.status_code == 200, f"List jobs failed: {r.text}"
    jobs = r.json()
    print(f"Loaded {len(jobs)} seeded job descriptions.")
    assert len(jobs) >= 1
    
    # Create job
    new_job_payload = {
        "title": "Cloud DevOps Architect",
        "description": "Looking for DevOps Architect with Docker, Kubernetes, AWS, Terraform, CI/CD and Linux experience.",
        "required_skills": ["docker", "kubernetes", "aws", "terraform", "ci/cd", "linux"]
    }
    r = requests.post(f"{BASE_URL}/api/jobs", json=new_job_payload, headers=headers)
    assert r.status_code == 201, f"Create job failed: {r.text}"
    created_job = r.json()
    job_id = created_job["id"]
    print("Created job:", created_job["title"], f"(ID: {job_id})")

    # Update job
    r = requests.put(f"{BASE_URL}/api/jobs/{job_id}", json={
        "title": "Senior Cloud DevOps Architect",
        "required_skills": ["docker", "kubernetes", "aws", "terraform", "ci/cd", "linux", "python"]
    }, headers=headers)
    assert r.status_code == 200
    updated_job = r.json()
    assert updated_job["title"] == "Senior Cloud DevOps Architect"
    assert len(updated_job["required_skills"]) == 7
    print("Updated job:", updated_job["title"])

    # Delete job
    r = requests.delete(f"{BASE_URL}/api/jobs/{job_id}", headers=headers)
    assert r.status_code == 204
    print("[PASS] Job Descriptions CRUD verified!")

    # 6. Test Screen Resume with Database Persistence
    print("\n--- 6. Screening Resume & Database Persistence (POST /api/screen-resume) ---")
    pdf_path = os.path.abspath("data/data/INFORMATION-TECHNOLOGY/10089434.pdf")
    with open(pdf_path, "rb") as f:
        files = {"file": ("10089434.pdf", f, "application/pdf")}
        data = {
            "job_description": "We are seeking a Python Engineer with strong skills in Python, SQL, REST API, Git, and Django.",
            "required_skills": json.dumps(["Python", "SQL", "REST API", "Git", "Django"]),
            "job_title": "Python Engineer",
            "candidate_name": "Dev Sharma"
        }
        r = requests.post(f"{BASE_URL}/api/screen-resume", files=files, data=data, headers=headers)
    assert r.status_code == 200, f"Screening failed: {r.text}"
    screen_res = r.json()
    print("Screening result candidate:", screen_res.get("candidate_id"), screen_res.get("ats_score"), "%")
    assert "screening_id" in screen_res
    print(f"Persisted screening_id: {screen_res['screening_id']}")
    print("[PASS] Resume screening & SQLite persistence verified!")

    # 7. Test Screening History
    print("\n--- 7. Screening History (GET /api/screenings) ---")
    r = requests.get(f"{BASE_URL}/api/screenings")
    assert r.status_code == 200, f"Screenings history failed: {r.text}"
    history = r.json()
    print(f"Total screening history records: {history['total']}")
    assert history["total"] >= 1
    screening_item = history["screenings"][0]
    print(f"Recent record: {screening_item['candidate_name']} | Score: {screening_item['ats_score']}% | Rec: {screening_item['recommendation']}")

    # Detail view
    r = requests.get(f"{BASE_URL}/api/screenings/{screening_item['id']}")
    assert r.status_code == 200
    print("[PASS] Screening history verified!")

    # 8. Test Resumes Management
    print("\n--- 8. Resumes Management (GET /api/resumes) ---")
    r = requests.get(f"{BASE_URL}/api/resumes")
    assert r.status_code == 200, f"Resumes list failed: {r.text}"
    resumes_list = r.json()
    print(f"Total resumes logged: {resumes_list['total']}")
    assert resumes_list["total"] >= 1
    print("[PASS] Resumes management endpoint verified!")

    # 9. Test CSV Export Endpoints
    print("\n--- 9. CSV Exports ---")
    # Export rankings
    r = requests.get(f"{BASE_URL}/api/export/rankings")
    assert r.status_code == 200, f"Export rankings failed: {r.text}"
    assert "Candidate ID" in r.text
    print(f"Export Rankings CSV length: {len(r.text)} bytes")

    # Export shortlist
    r = requests.get(f"{BASE_URL}/api/export/shortlist")
    assert r.status_code == 200, f"Export shortlist failed: {r.text}"
    assert "Candidate ID" in r.text
    print(f"Export Shortlist CSV length: {len(r.text)} bytes")

    # Export screenings
    r = requests.get(f"{BASE_URL}/api/export/screenings")
    assert r.status_code == 200, f"Export screenings failed: {r.text}"
    assert "Candidate ID" in r.text
    print(f"Export Screenings CSV length: {len(r.text)} bytes")
    print("[PASS] CSV exports verified!")

    # 10. Test Candidate Details with History
    print("\n--- 10. Candidate Details (GET /api/candidates/{id}) ---")
    cid = screen_res["candidate_id"]
    r = requests.get(f"{BASE_URL}/api/candidates/{cid}")
    assert r.status_code == 200, f"Candidate detail failed: {r.text}"
    cdetail = r.json()
    print(f"Loaded Candidate {cdetail['id']}: category={cdetail['category']}, screenings count={len(cdetail.get('screening_history', []))}")
    assert len(cdetail.get("screening_history", [])) >= 1
    print("[PASS] Candidate detail with history verified!")

    print("\n==============================================")
    print("ALL PHASE 4 BACKEND TESTS PASSED SUCCESSFULLY!")
    print("==============================================")

if __name__ == "__main__":
    test_phase4()
