import urllib.request
import urllib.parse
import json
import mimetypes
import uuid

def test_batch_screening():
    url = "http://127.0.0.1:8000/api/screen-resumes-batch"
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"

    resume_1 = """ELENA ROSTOVA
Senior Backend Software Engineer
Experienced with Python, Django, Flask, SQL, REST API, Git, data structures, and software development.
Built scalable microservices and optimized PostgreSQL database queries."""

    resume_2 = """ALEX RIVERA
Full Stack Developer
Skilled in Python, SQL, REST API, Git, software development, data structures, React and Express.
Built financial reconciliation services using Python and SQL."""

    resume_3 = """JORDAN HAYES
Digital Marketing Specialist
Expert in SEO, Content Writing, Google Analytics, Social Media campaigns, and branding.
No programming or Python experience."""

    files = [
        ("Elena_Rostova_Python.txt", resume_1.encode("utf-8")),
        ("Alex_Rivera_FullStack.txt", resume_2.encode("utf-8")),
        ("Jordan_Hayes_Marketing.txt", resume_3.encode("utf-8")),
    ]

    body = bytearray()
    
    # Add files
    for filename, content in files:
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="files"; filename="{filename}"\r\n'.encode("utf-8"))
        body.extend(b"Content-Type: text/plain\r\n\r\n")
        body.extend(content)
        body.extend(b"\r\n")

    # Add form fields
    fields = {
        "job_title": "Python Developer",
        "job_description": "We are looking for a Python Developer with strong skills in Python, Django, Flask, SQL, REST API, Git, data structures, and software development.",
        "required_skills": "python,django,flask,sql,rest api,git,data structures,software development"
    }

    for name, value in fields.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
        body.extend(value.encode("utf-8"))
        body.extend(b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(url, data=bytes(body))
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print("Status Code:", resp.status)
            print("Total Screened:", data.get("total_screened"))
            print("Job Title:", data.get("job_title"))
            print("Candidate Shortlist Ranking:")
            for idx, r in enumerate(data.get("results", [])):
                print(f"  #{idx+1}: {r.get('candidate_name')} | Score: {r.get('ats_score')}% | Recommendation: {r.get('recommendation')} | Matched: {len(r.get('matched_skills'))} skills")
            return True
    except Exception as e:
        print("Batch screening failed:", e)
        if hasattr(e, "read"):
            print("Error details:", e.read().decode("utf-8"))
        return False

if __name__ == "__main__":
    success = test_batch_screening()
    if not success:
        exit(1)
