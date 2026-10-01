import sys
from pathlib import Path
import requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
pdf_path = PROJECT_ROOT / "data" / "data" / "INFORMATION-TECHNOLOGY" / "10089434.pdf"

with open(pdf_path, "rb") as f:
    pdf_bytes = f.read()

files = [
    ("files", ("resume_candidate1.pdf", pdf_bytes, "application/pdf")),
    ("files", ("resume_candidate2.txt", b"Jane Doe\nSenior Python Engineer with 6 years experience in Python, Django, Flask, SQL, REST API, Git, data structures, and software development.", "text/plain"))
]

data = {
    "job_description": "We are seeking a Python Developer with strong proficiency in Python, Django, Flask, SQL, REST API, Git, data structures, and software development.",
    "job_title": "Python Developer",
    "required_skills": "python,django,flask,sql,rest api,git,data structures,software development"
}

r = requests.post("http://127.0.0.1:8000/api/screen-resumes-batch", files=files, data=data)
print(f"Batch Screening HTTP Status: {r.status_code}")
assert r.status_code == 200, f"Failed: {r.text}"

res = r.json()
print(f"Total Resumes Screened: {res.get('total_screened')}")
for c in res.get("results", []):
    print(f"  - Rank #{c.get('rank', 0)}: {c.get('candidate_name')} | Category: {c.get('predicted_category')} | ATS: {c.get('ats_score')}% | Recommendation: {c.get('recommendation')}")
    print(f"    Matched Skills: {c.get('matched_skills')}")
    print(f"    Missing Skills: {c.get('missing_skills')}")

print("\n[SUCCESS] Batch multiple resume upload verified!")
