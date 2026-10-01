# Demo & Test Resumes

This directory contains standalone, clearly-labelled demo candidate resumes designed for live testing and college demonstration:

1. `Elena_Rostova_Python_Expert.txt` — Strong match candidate with deep Python, Django, Flask, SQL, REST API, Git, Data Structures, and Software Development experience.
2. `Alex_Rivera_FullStack.docx` — Good match full-stack engineer with Python, SQL, REST API, Git, and web technologies.
3. `Jordan_Hayes_Marketing.txt` — Unmatched / Low match resume (Digital Marketing domain) to demonstrate category classification and low ATS scoring.

---
### Dataset Distinctions:
- **Original Dataset**: Located in `data/data/` (24 categorized folders with 2,484 resumes) and `Resume/Resume.csv`. Must remain untouched.
- **Demo / Test Data**: Located in `data/demo_resumes/` for manual drag-and-drop or file upload testing.
- **User-Uploaded Resumes**: Temporarily processed by the backend and tracked in the SQLite database (`backend/screening.db`).
