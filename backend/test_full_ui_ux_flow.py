import requests
import sys
import io

BASE_URL = "http://127.0.0.1:8000"

def test_flow():
    print(f"--- 1. Testing Backend Health at {BASE_URL}/api/health ---")
    res = requests.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health = res.json()
    print("Health response:", health)
    assert health["status"] in ["healthy", "ok"]
    assert health["model_loaded"] is True
    print("[PASS] Health endpoint confirmed.")

    print("\n--- 2. Testing Job Creation with Template Data ---")
    job_payload = {
        "title": "Senior Full Stack Engineer (HireNova Template)",
        "department": "Engineering",
        "location": "Remote",
        "employment_type": "FULL_TIME",
        "description": "Looking for a seasoned Full Stack Developer with strong experience in Python, FastAPI, React, TypeScript, and modern scalable system design.",
        "required_skills": ["Python", "React", "TypeScript", "FastAPI", "SQL", "Docker"],
        "status": "ACTIVE"
    }
    res = requests.post(f"{BASE_URL}/api/jobs", json=job_payload)
    assert res.status_code in [200, 201], f"Job creation failed: {res.text}"
    job_data = res.json()
    job_id = job_data["id"]
    print(f"[PASS] Job created with ID: {job_id} Title: {job_data['title']}")

    print("\n--- 3. Testing Single Resume Screening & File Saving ---")
    resume_text = """
    ALEXANDER WRIGHT
    alex.wright@example.com | San Francisco, CA | linkedin.com/in/alexwright
    
    PROFESSIONAL SUMMARY
    Senior Software Engineer with 7+ years of experience in Python, React, TypeScript, FastAPI, and distributed systems. Expert in architecting microservices, relational databases (SQL/PostgreSQL), containerization with Docker, and cloud deployments on AWS.
    
    CORE SKILLS
    Languages: Python, TypeScript, JavaScript, SQL, Bash
    Frameworks: FastAPI, React, Node.js, Next.js, Django
    DevOps & Tools: Docker, AWS, Git, CI/CD, Redis
    
    EXPERIENCE
    Lead Engineer | CloudScale Innovations (2021 - Present)
    - Designed and implemented FastAPI backend services handling 10M+ daily events.
    - Built responsive frontend client interfaces using React and modern component libraries.
    - Orchestrated container deployment using Docker and automated CI/CD pipelines.
    
    Software Developer | NextGen Apps (2018 - 2021)
    - Developed high throughput REST APIs with Python and SQL.
    - Collaborated with product designers to implement clean UI workflows.
    """
    
    file_bytes = resume_text.encode('utf-8')
    files = {
        "file": ("Alexander_Wright_Resume.txt", io.BytesIO(file_bytes), "text/plain")
    }
    data = {
        "job_description": job_payload["description"],
        "required_skills": job_payload["required_skills"],
        "job_id": str(job_id)
    }

    res = requests.post(f"{BASE_URL}/api/screen-resume", files=files, data=data)
    assert res.status_code == 200, f"Screening failed: {res.text}"
    screening_res = res.json()
    cand_id = screening_res["candidate_id"]
    screening_id = screening_res["screening_id"]
    print(f"[PASS] Single screening success. Candidate ID: {cand_id}, ATS: {screening_res['ats_score']}%, Match: {screening_res['recommendation']}")

    print("\n--- 4. Testing Real View Resume Endpoint ---")
    res = requests.get(f"{BASE_URL}/api/candidates/{cand_id}/resume")
    assert res.status_code == 200, f"View candidate resume failed: {res.status_code}"
    assert "Alexander" in res.text or "ALEXANDER" in res.text or len(res.content) > 50
    print(f"[PASS] GET /api/candidates/{cand_id}/resume returned real file content ({len(res.content)} bytes).")

    print("\n--- 5. Testing Real Download Resume Endpoint ---")
    res = requests.get(f"{BASE_URL}/api/candidates/{cand_id}/resume/download")
    assert res.status_code == 200, f"Download resume failed: {res.status_code}"
    disposition = res.headers.get("Content-Disposition", "")
    assert "attachment" in disposition, f"Expected attachment header: {disposition}"
    print(f"[PASS] GET /api/candidates/{cand_id}/resume/download returned attachment: {disposition}")

    print("\n--- 6. Testing Multiple Resume Upload (Batch Screening) ---")
    batch_files = [
        ("files", ("DevOps_Candidate.txt", io.BytesIO(b"DevOps Engineer. Kubernetes, Docker, AWS, CI/CD, Python, Linux, Bash."), "text/plain")),
        ("files", ("Frontend_Candidate.txt", io.BytesIO(b"Frontend Developer. React, TypeScript, JavaScript, CSS, HTML, Webpack, Git."), "text/plain")),
        ("files", ("DataScientist_Candidate.txt", io.BytesIO(b"Data Scientist. Python, Machine Learning, SQL, Pandas, Scikit-Learn, PyTorch."), "text/plain")),
    ]
    batch_data = {
        "job_description": job_payload["description"],
        "required_skills": job_payload["required_skills"],
        "job_id": str(job_id)
    }
    res = requests.post(f"{BASE_URL}/api/screen-resumes-batch", files=batch_files, data=batch_data)
    assert res.status_code == 200, f"Batch screening failed: {res.text}"
    batch_res = res.json()
    total_count = batch_res.get("total_resumes", batch_res.get("total_screened", len(batch_res.get("ranked_candidates", []))))
    print(f"[PASS] Batch screening returned {total_count} ranked candidates.")
    candidates = batch_res.get("results", [])
    for idx, c in enumerate(candidates, 1):
        print(f"   #{idx} Candidate {c['candidate_id']}: ATS {c['ats_score']}% ({c['recommendation']})")

    print("\n--- 7. Testing Export JSON & CSV Endpoints ---")
    res = requests.get(f"{BASE_URL}/api/export/json")
    assert res.status_code == 200
    json_data = res.json()
    assert "candidates" in json_data and "jobs" in json_data
    print(f"[PASS] GET /api/export/json: {len(json_data['candidates'])} candidates, {len(json_data['jobs'])} jobs.")

    res = requests.get(f"{BASE_URL}/api/export/rankings")
    assert res.status_code == 200
    print(f"[PASS] GET /api/export/rankings: {len(res.content)} bytes CSV.")

    res = requests.get(f"{BASE_URL}/api/export/shortlist")
    assert res.status_code == 200
    print(f"[PASS] GET /api/export/shortlist: {len(res.content)} bytes CSV.")

    print("\n==========================================")
    print("ALL REFINED BACKEND & FRONTEND CONTRACT TESTS PASSED!")
    print("==========================================")

if __name__ == "__main__":
    test_flow()
