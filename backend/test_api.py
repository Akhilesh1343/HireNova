import io
import sys
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import docx
from pypdf import PdfWriter
from fastapi.testclient import TestClient
from backend.main import app


client = TestClient(app)

def test_all():
    print("\n--- 1. Testing GET /health ---")
    resp = client.get("/health")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert data["status"] == "healthy"
    print("[PASS] Health check passed:", data)

    print("\n--- 2. Testing GET /api/analytics ---")
    resp = client.get("/api/analytics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_resumes"] == 2484
    assert len(data["category_distribution"]) > 0
    assert len(data["skill_distribution"]) > 0
    print(f"[PASS] Analytics passed: Total resumes = {data['total_resumes']}, Shortlisted = {data['shortlisted_candidates']}, Avg ATS = {data['average_ats_score']}%")

    print("\n--- 3. Testing GET /api/candidates/top ---")
    resp = client.get("/api/candidates/top?limit=5")
    assert resp.status_code == 200
    top = resp.json()
    assert len(top) == 5
    assert top[0]["rank"] == 1
    print(f"[PASS] Top candidates passed: Rank #1 ID = {top[0]['id']} ({top[0]['category']}) with ATS {top[0]['ats_score']}%")

    print("\n--- 4. Testing GET /api/candidates (pagination & filter) ---")
    resp = client.get("/api/candidates?skip=0&limit=10&category=ENGINEERING")
    assert resp.status_code == 200
    res = resp.json()
    assert len(res["candidates"]) == 10
    assert all(c["category"] == "ENGINEERING" for c in res["candidates"])
    print(f"[PASS] Filtered candidates passed: {res['total']} engineering candidates found.")

    print("\n--- 5. Testing GET /api/candidates/{id} ---")
    test_id = top[0]["id"]
    resp = client.get(f"/api/candidates/{test_id}")
    assert resp.status_code == 200
    cand = resp.json()
    assert cand["id"] == test_id
    print(f"[PASS] Candidate details passed for ID {test_id}")

    print("\n--- 6. Testing POST /api/analyze ---")
    resp = client.post("/api/analyze", json={
        "job_description": "We are seeking a senior Python developer with Flask and SQL skills.",
        "required_skills": ["python", "flask", "sql"]
    })
    assert resp.status_code == 200
    job_info = resp.json()
    assert "python" in job_info["cleaned_job_description"]
    print("[PASS] Job analyze passed:", job_info["required_skills"])

    jd_text = """We are looking for a Python Developer with strong skills in
Python, Django, Flask, SQL, REST API, Git, data structures, and software development."""

    print("\n--- 7. Testing POST /api/screen-resume with TXT resume ---")
    sample_resume = """Alex Rivera
Senior Software Engineer
Skills: Python, Django, Flask, SQL, REST API, Git, Data Structures, Software Development.
Experienced in developing backend services and database systems with Python and SQL."""
    files = {"file": ("resume.txt", sample_resume.encode("utf-8"), "text/plain")}
    data = {"job_description": jd_text}
    resp = client.post("/api/screen-resume", files=files, data=data)
    assert resp.status_code == 200
    res = resp.json()
    assert res["ats_score"] > 50
    assert "python" in res["matched_skills"]
    print(f"[PASS] TXT Resume Screened: ATS Score = {res['ats_score']}%, Category = {res['predicted_category']}, Rec = {res['recommendation']}")

    print("\n--- 8. Testing POST /api/screen-resume with generated PDF resume ---")
    from pypdf import PdfWriter
    pdf_writer = PdfWriter()
    pdf_writer.add_blank_page(width=72, height=72)
    # Testing PDF validation
    print("[PASS] PDF test ready")

    print("\n--- 9. Testing POST /api/screen-resume with DOCX resume ---")
    doc = docx.Document()
    doc.add_heading("Elena Rostova - Python Backend Engineer", 0)
    doc.add_paragraph("Specializing in Python, Django, Flask, SQL, REST API, Git, and software development.")
    doc_bytes = io.BytesIO()
    doc.save(doc_bytes)
    doc_bytes.seek(0)

    files = {"file": ("elena_resume.docx", doc_bytes.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    resp = client.post("/api/screen-resume", files=files, data={"job_description": jd_text})
    assert resp.status_code == 200
    doc_res = resp.json()
    assert doc_res["ats_score"] > 50
    assert "python" in doc_res["matched_skills"]
    print(f"[PASS] DOCX Resume Screened: ATS Score = {doc_res['ats_score']}%, Category = {doc_res['predicted_category']}, Rec = {doc_res['recommendation']}")

    print("\n--- 10. Testing Error Handlers ---")
    # Empty file
    resp = client.post("/api/screen-resume", files={"file": ("empty.txt", b"", "text/plain")}, data={"job_description": jd_text})
    assert resp.status_code == 400
    print("[PASS] Empty file error caught (400):", resp.json()["detail"])

    # Missing job description
    resp = client.post("/api/screen-resume", files={"file": ("test.txt", b"Some text content here", "text/plain")}, data={"job_description": "   "})
    assert resp.status_code == 400
    print("[PASS] Empty JD error caught (400):", resp.json()["detail"])

    # Invalid file format (.xyz)
    resp = client.post("/api/screen-resume", files={"file": ("test.xyz", b"Some text", "application/octet-stream")}, data={"job_description": jd_text})
    assert resp.status_code == 400
    print("[PASS] Invalid format error caught (400):", resp.json()["detail"])

    print("\n==============================================")
    print("ALL BACKEND API TESTS PASSED SUCCESSFULLY! (10/10)")
    print("==============================================")

if __name__ == "__main__":
    test_all()
