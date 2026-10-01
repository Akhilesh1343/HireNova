import os
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

RESUME_PATH = os.path.abspath("data/data/INFORMATION-TECHNOLOGY/10089434.pdf")

JOB_DESCRIPTION = (
    "We are looking for a Python Developer with strong skills in "
    "Python, Django, Flask, SQL, REST API, Git, Data Structures "
    "and Software Development."
)

REQUIRED_SKILLS = [
    "Python",
    "Django",
    "Flask",
    "SQL",
    "REST API",
    "Git",
    "Data Structures",
    "Software Development"
]

def run_e2e_test():
    print(f"=== FINAL END-TO-END TEST ===")
    print(f"Resume Path: {RESUME_PATH}")
    assert os.path.exists(RESUME_PATH), f"Resume file not found at {RESUME_PATH}"
    
    # Test POST /api/screen-resume with multipart form data
    print("\n--- 1. Testing POST /api/screen-resume (Multipart File Upload) ---")
    with open(RESUME_PATH, "rb") as f:
        files = {
            "file": (os.path.basename(RESUME_PATH), f, "application/pdf")
        }
        data = {
            "job_description": JOB_DESCRIPTION,
            "skills": json.dumps(REQUIRED_SKILLS)
        }
        resp = requests.post(f"{BASE_URL}/api/screen-resume", files=files, data=data)
        
    print(f"Response Status Code: {resp.status_code}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    
    result = resp.json()
    print("Screening Result:")
    print(f"  Candidate Name: {result.get('candidate_name')}")
    print(f"  Predicted Category: {result.get('predicted_category')}")
    print(f"  ATS Score: {result.get('ats_score')}%")
    print(f"  Job Similarity Score: {result.get('similarity_score')}%")
    print(f"  Skill Match Score: {result.get('skill_score')}%")
    print(f"  Recommendation: {result.get('recommendation')}")
    print(f"  Matched Skills: {result.get('matched_skills')}")
    print(f"  Missing Skills: {result.get('missing_skills')}")
    
    assert "predicted_category" in result and result["predicted_category"], "Category prediction missing"
    assert "ats_score" in result and isinstance(result["ats_score"], (int, float)), "ATS score missing/invalid"
    assert "similarity_score" in result, "Similarity score missing"
    assert "skill_score" in result, "Skill score missing"
    assert "matched_skills" in result and isinstance(result["matched_skills"], list), "Matched skills missing"
    assert "missing_skills" in result and isinstance(result["missing_skills"], list), "Missing skills missing"
    assert "recommendation" in result, "Recommendation missing"
    
    print("[PASS] Full multipart screening test completed successfully!")
    
    # Test POST /api/analyze (Job Description Analysis)
    print("\n--- 2. Testing POST /api/analyze (Job Description Analysis) ---")
    analyze_payload = {
        "job_description": JOB_DESCRIPTION,
        "required_skills": REQUIRED_SKILLS
    }
    resp2 = requests.post(f"{BASE_URL}/api/analyze", json=analyze_payload)
    print(f"Response Status Code: {resp2.status_code}")
    assert resp2.status_code == 200, f"Expected 200, got {resp2.status_code}: {resp2.text}"
    result2 = resp2.json()
    print("Analyze Result:")
    print(f"  Cleaned Job Description Preview: {result2.get('cleaned_job_description')[:80]}...")
    print(f"  Required Skills Count: {result2.get('skills_count')}")
    print(f"  Default Skills Count: {len(result2.get('default_skills', []))}")
    assert "cleaned_job_description" in result2, "Cleaned JD missing"
    assert result2.get("skills_count") == len(REQUIRED_SKILLS), "Skills count mismatch"
    print("[PASS] Job description analysis test completed successfully!")

if __name__ == "__main__":
    run_e2e_test()

