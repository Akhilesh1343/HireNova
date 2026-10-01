# AI-Based Resume Screening & Candidate Shortlisting System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.2+-F7931E.svg?style=flat&logo=scikit-learn)](https://scikit-learn.org)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg?style=flat&logo=sqlite)](https://sqlite.org)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=flat&logo=python)](https://python.org)

An enterprise-ready, end-to-end recruitment intelligence platform designed to automate resume parsing, domain categorization, job-description matching, screening history auditing, and candidate shortlisting.

Built with a high-performance **FastAPI** backend, **SQLite + SQLAlchemy** persistent database, and a modern **React 18 + Vite + Tailwind CSS** frontend, the system leverages a pre-trained **LinearSVC** model and **TF-IDF vectorizer** trained on 2,484 resumes across 24 industry domains.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Screenshots & UI Walkthrough](#screenshots--ui-walkthrough)
5. [Tech Stack](#tech-stack)
6. [ML Pipeline](#ml-pipeline)
7. [ATS Scoring Formula](#ats-scoring-formula)
8. [Installation & Prerequisites](#installation--prerequisites)
9. [Environment Variables](#environment-variables)
10. [Frontend Setup](#frontend-setup)
11. [Backend Setup](#backend-setup)
12. [Database Setup & PostgreSQL Migration](#database-setup--postgresql-migration)
13. [API Documentation](#api-documentation)
14. [Testing & Verification](#testing--verification)
15. [Deployment Guide](#deployment-guide)
16. [College Demonstration Mode](#college-demonstration-mode)
17. [Limitations](#limitations)
18. [Future Scope](#future-scope)
19. [License](#license)

---

## Project Overview

Recruitment teams face bottlenecks reviewing hundreds of unstructured candidate resumes for technical roles. This system automates the preliminary screening workflow by:
1. Extracting raw text from uploaded resumes (PDF, DOCX, TXT).
2. Classifying each candidate into one of 24 industry domains using a Support Vector Machine (`LinearSVC`).
3. Calculating semantic match against recruiter job descriptions using TF-IDF cosine similarity.
4. Performing case-insensitive technical skill extraction against configurable role criteria.
5. Computing an interpretable, weighted Applicant Tracking System (ATS) score with tier-based recommendations.
6. Persisting all candidate records, screening events, and job postings in a relational database with one-click CSV exporting.

---

## Features

- **Multi-Format Resume Parser**: Instant text extraction from `.pdf`, `.docx`, and `.txt` documents with UTF-8 / Latin-1 encoding fallbacks.
- **Automated Text Preprocessing**: Strips URLs, hashtags, punctuation, special symbols, extra whitespaces, and removes NLTK English stopwords matching the training pipeline.
- **Domain Category Classification**: Classifies resumes into 24 distinct domains (e.g., Information Technology, Engineering, HR, Finance, Healthcare, Digital Media) using a pre-trained Linear Support Vector Classifier (`LinearSVC`).
- **Semantic Job Description Matching**: Calculates cosine similarity between resume text and job requirements using a shared TF-IDF matrix.
- **Skill Gap & Match Analysis**: Detects matched and missing technical skills against configurable job criteria.
- **Weighted ATS Suitability Score**: Computes a transparent composite score (40% JD similarity + 60% skill match) with tier-based recommendations (`Strong Match`, `Good Match`, `Moderate Match`, `Low Match`).
- **Persistent Database (SQLite + SQLAlchemy)**: Persistent storage of recruiter accounts, candidate records, standardized job descriptions, and screening audit history.
- **Recruiter Authentication & Security**: Secure bcrypt password hashing, JWT Bearer tokens, recruiter registration, sign-in, and protected actions.
- **Screening History Audit Trail**: Filter, search, and sort previous resume screening records with detailed drill-down views.
- **Job Description Management (CRUD)**: Create, view, edit, and delete company job postings. In resume screening, recruiters can select any saved job to auto-populate requirements.
- **Export & Print Capabilities**: One-click CSV exports for candidate rankings, shortlisted candidates, and screening history, plus printable candidate profiles.
- **Interactive Recruiter Dashboard**: Live KPI cards (Total Resumes, Total Screenings, Shortlisted Candidates, Average ATS Score, Average Skill Score), recent screenings, and distribution charts.
- **Candidate Rankings Leaderboard**: Search, filter by domain, adjust minimum ATS score thresholds, and sort candidates across multiple attributes.
- **Demo Resumes Included**: Pre-packaged test resumes in `data/demo_resumes/` for seamless evaluations.

---

## Architecture

The system follows a clean, decoupled client-server architecture:

```
+-------------------------------------------------------------------------+
|                         React 18 + Vite Frontend                        |
|   (Dashboard, Screening Engine, Candidate Rankings, Analytics, Admin)    |
+-------------------------------------------------------------------------+
                                    |
                                    | REST API Calls (JSON & Multipart)
                                    v
+-------------------------------------------------------------------------+
|                           FastAPI Backend                               |
|   (ASGI / Uvicorn Server, REST Endpoints, OAuth2 JWT Authentication)    |
+-------------------------------------------------------------------------+
                                    |
                                    | In-Memory Services (Singletons)
                                    v
+-------------------------------------------------------------------------+
|                     ML Inference & Matching Service                     |
|           (Singleton Engine: Preprocessing, Tokenization, TF-IDF)        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                   TF-IDF Vectorizer + LinearSVC Model                   |
|       (Joblib Artifacts: 24 Domain Classifiers, Cosine Similarity)      |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                           ATS Scoring Engine                            |
|             Formula: ATS = (Similarity x 0.40) + (Skill Match x 0.60)   |
+-------------------------------------------------------------------------+
                                    |
                                    | SQLAlchemy ORM
                                    v
+-------------------------------------------------------------------------+
|                         SQLite Database Engine                          |
|         (Users, JobDescriptions, Candidates, ScreeningResults)          |
+-------------------------------------------------------------------------+
```

*For comprehensive architecture specifications, refer to [ARCHITECTURE.md](ARCHITECTURE.md).*

---

## Screenshots & UI Walkthrough

| View | Key Capabilities |
| :--- | :--- |
| **Recruiter Dashboard** | KPI overview cards, system status pills, quick action shortcuts, recent screenings feed, and top candidates. |
| **Resume Screening** | Drag-and-drop file uploader (PDF/DOCX/TXT), preset job selector, dynamic custom skill tags, animated multi-step ML analysis. |
| **Candidate Result** | Radial ATS score dial, similarity vs skill scores breakdown, matched skill tags (green), missing skill tags (red), recommendation banner, JSON export, and print view. |
| **Candidate Rankings** | Searchable leaderboard across 2,484 resumes, category filters, minimum ATS slider, server-side CSV export buttons. |
| **Analytics & Insights** | Domain category distribution charts, ATS score tier breakdown, candidate talent acquisition funnel, technical skill demand chart. |
| **Screening History** | Relational audit trail of all previous screening operations with date/time, candidate name, job title, ATS score, and delete controls. |
| **Job Management** | Full CRUD interface to manage standardized job postings with title, description, and required skill chips. |
| **System Settings** | Live backend health telemetry, recruiter profile credentials, algorithm weight adjusters, and theme toggles. |

---

## Tech Stack

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `18.3.1` | Modular reactive UI component tree |
| **Build Tool** | Vite | `6.0.7` | Blazing-fast bundler with Hot Module Replacement |
| **Styling** | Tailwind CSS | `3.4.17` | Responsive utility-first modern design system |
| **Icons** | Lucide React | `0.469.0` | Accessible modern vector icon library |
| **Backend API** | FastAPI | `0.100+` | High-performance asynchronous REST microservice |
| **ASGI Server** | Uvicorn | `0.20+` | Production ASGI web server |
| **Database ORM** | SQLAlchemy | `2.0+` | Relational database mapping and queries |
| **Database** | SQLite 3 | Built-in | Relational ACID database (PostgreSQL ready) |
| **Authentication** | Passlib + Bcrypt | `1.7.4` | Salted password hashing |
| **Token Handling** | Python-JOSE | `3.3.0` | Cryptographic JWT signing (HS256) |
| **Machine Learning** | Scikit-Learn | `1.2+` | TF-IDF Vectorizer & LinearSVC model |
| **Model Persistence** | Joblib | `1.2+` | Fast serialization of machine learning artifacts |
| **Data Processing** | Pandas & NumPy | `2.0+` | Matrix manipulation and candidate ranking storage |
| **PDF Extraction** | PyPDF / PyPDF2 | `3.0+` | Multi-page text extraction from PDF resumes |
| **DOCX Extraction** | python-docx | `0.8.11` | Document parsing for Microsoft Word files |

---

## ML Pipeline

The machine learning pipeline was trained on a dataset of 2,484 multi-domain resumes across 24 distinct professional categories:

1. **Text Preprocessing**:
   - Removal of URLs (`http\S+|www\S+`), non-alphabetic characters, and excess whitespace.
   - Lowercase normalization.
   - Removal of English stopwords using NLTK stopwords list.
2. **Feature Extraction (`tfidf_vectorizer.pkl`)**:
   - Term Frequency-Inverse Document Frequency (TF-IDF).
   - N-gram range: `(1, 2)` (unigrams and bigrams).
   - Sublinear TF scaling enabled to damp the effect of repeated terms.
3. **Classification Model (`resume_model.pkl`)**:
   - **Algorithm**: `LinearSVC` (Linear Support Vector Classifier).
   - Multi-class strategy: One-vs-Rest (OvR).
   - Achieved superior classification accuracy and sub-second inference speeds compared to Random Forest and KNN baselines.
4. **Target Classes (24 Categories)**:
   `ACCOUNTANT`, `ADVOCATE`, `AGRICULTURE`, `APPAREL`, `ARTS`, `AUTOMOBILE`, `AVIATION`, `BANKING`, `BPO`, `BUSINESS-DEVELOPMENT`, `CHEF`, `CONSTRUCTION`, `CONSULTANT`, `DESIGNER`, `DIGITAL-MEDIA`, `ENGINEERING`, `FINANCE`, `FITNESS`, `HEALTHCARE`, `HR`, `INFORMATION-TECHNOLOGY`, `PUBLIC-RELATIONS`, `SALES`, `TEACHER`.

---

## ATS Scoring Formula

The Applicant Tracking System (ATS) Suitability Score is computed via a transparent, multi-attribute formula:

$$\text{ATS Score} = (\text{Cosine Similarity} \times 0.40) + (\text{Skill Match Score} \times 0.60)$$

Where:
- **Cosine Similarity ($0 - 100\%$)**:
  $$\text{Cosine Similarity} = \frac{\mathbf{v}_{\text{resume}} \cdot \mathbf{v}_{\text{job}}}{\|\mathbf{v}_{\text{resume}}\| \|\mathbf{v}_{\text{job}}\|} \times 100$$
  Measures the semantic alignment of the candidate's career experience and context against the target job description.
- **Skill Match Score ($0 - 100\%$)**:
  $$\text{Skill Match Score} = \left(\frac{N_{\text{matched}}}{N_{\text{required}}}\right) \times 100$$
  Measures the direct presence of core mandatory technical competencies.
- **Recommendation Tiers**:
  - **Strong Match**: $\ge 70.0\%$ (Fast-track for interview)
  - **Good Match**: $50.0\% - 69.99\%$ (Recommended for review)
  - **Moderate Match**: $30.0\% - 49.99\%$ (Potential backup / skill gaps present)
  - **Low Match**: $< 30.0\%$ (Not recommended for technical role)

---

## Installation & Prerequisites

### Prerequisites
- **Python**: Version `3.10` or higher (verified on Python 3.13)
- **Node.js**: Version `18.0` or higher (verified on Node v22.15)
- **Git**: For version control

### Repository Clone
```bash
git clone https://github.com/your-username/Resume-screening-system.git
cd Resume-screening-system
```

---

## Environment Variables

Copy `.env.example` to configure your environment:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///./backend/screening.db` | SQLAlchemy connection string (SQLite or PostgreSQL) |
| `SECRET_KEY` | `talent-ai-recruiter-jwt-secret-key-production-2026` | 32+ character random key for JWT token signatures |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT token validity window in minutes (1440 = 24h) |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend client origins |
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Backend API base URL used by Vite frontend |

---

## Backend Setup

1. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Download required NLTK resources:
   ```bash
   python -m nltk.downloader stopwords
   ```

4. Start the FastAPI server:
   ```bash
   python -m uvicorn backend.main:app --reload --port 8000
   ```

- Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/health`

---

## Frontend Setup

1. In a separate terminal, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

- Web Application URL: `http://localhost:5173`

4. For production build:
   ```bash
   npm run build
   ```
   *Generates optimized production bundle in `frontend/dist/`.*

---

## Database Setup & PostgreSQL Migration

### SQLite (Default for Local / Demo Use)
- SQLite requires zero installation or configuration.
- The database file is automatically created at `backend/screening.db` upon initial server startup.
- Automatically seeds the default recruiter account:
  - **Email**: `admin@talentai.com`
  - **Password**: `admin123`
- Pre-seeds 3 default job postings (Python Developer, Full Stack Engineer, ML Engineer).

### PostgreSQL Enterprise Migration
To migrate from SQLite to PostgreSQL:
1. Install `psycopg2-binary`:
   ```bash
   pip install psycopg2-binary
   ```
2. Update `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/resume_screening_db
   ```
3. Restart FastAPI. SQLAlchemy will automatically initialize all tables in the PostgreSQL database.

---

## API Documentation

The backend provides complete OpenAPI (Swagger 3.0) documentation available at `http://127.0.0.1:8000/docs`:

| Method | Endpoint | Description | Request Payload | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health & ML loaded check | None | `HealthStatus` |
| `POST` | `/api/auth/register` | Register new recruiter | `UserRegisterRequest` | `TokenResponse` |
| `POST` | `/api/auth/login` | Authenticate recruiter | `UserLoginRequest` | `TokenResponse` |
| `GET` | `/api/auth/me` | Current recruiter profile | Bearer Token | `UserResponse` |
| `GET` | `/api/jobs` | List job postings | Optional Bearer | `List[JobDescriptionResponse]` |
| `POST` | `/api/jobs` | Create job posting | `JobDescriptionCreate` | `JobDescriptionResponse` |
| `PUT` | `/api/jobs/{id}` | Update job posting | `JobDescriptionUpdate` | `JobDescriptionResponse` |
| `DELETE` | `/api/jobs/{id}` | Delete job posting | Optional Bearer | `204 No Content` |
| `POST` | `/api/screen-resume` | Screen resume file with ML | `multipart/form-data` | `ScreenResumeResponse` |
| `GET` | `/api/screenings` | Paginated screening history | Query parameters | `ScreeningHistoryListResponse` |
| `DELETE` | `/api/screenings/{id}` | Delete screening record | Path ID | `204 No Content` |
| `GET` | `/api/candidates` | Filtered candidate rankings | Query parameters | `CandidateListResponse` |
| `GET` | `/api/candidates/top` | Top 10 shortlisted candidates | `limit` query param | `List[CandidateItem]` |
| `GET` | `/api/candidates/{id}` | Candidate profile & history | Path ID | `CandidateDetailResponse` |
| `GET` | `/api/analytics` | Statistical analytics & funnel | None | `AnalyticsResponse` |
| `GET` | `/api/export/rankings` | Download rankings CSV | None | CSV attachment |
| `GET` | `/api/export/shortlist` | Download shortlist CSV | None | CSV attachment |
| `GET` | `/api/export/screenings` | Download history CSV | None | CSV attachment |

---

## Testing & Verification

The project includes an automated end-to-end test suite that verifies all 12 operational subsystems:

```bash
python scripts/verify_production_readiness.py
```

### Verification Results Summary

```
======================================================================
     FINAL PRODUCTION HARDENING & E2E VERIFICATION TEST SUITE     
======================================================================
[PASS] Frontend Build           : Verified dist/index.html & assets bundle
[PASS] Backend                  : Status: healthy, Models & DB confirmed
[PASS] Database                 : SQLite online with seeded users & jobs
[PASS] Authentication           : JWT issued & validated
[PASS] Job Management           : Created & listed job descriptions
[PASS] Resume Upload            : Successfully uploaded & parsed PDF, DOCX, TXT
[PASS] ML Prediction            : LinearSVC classified candidate as 'ENGINEERING'
[PASS] ATS Scoring              : ATS: 87.32%, Sim: 68.3%, Skill: 100.0%, Rec: Strong Match
[PASS] Candidate Ranking        : Loaded rankings. Candidate ATS: 41.17%
[PASS] Analytics                : Analyzed 2,484 resumes, dynamic screenings recorded
[PASS] Export                   : Exported Rankings, Shortlist, and History CSVs
[PASS] Security Check           : Bcrypt verified, file validation active, auth boundaries enforced
[PASS] Production Build         : Vite production bundle compiled and ready for static hosting
======================================================================
OVERALL SYSTEM READINESS STATUS: PASSED (12/12)
======================================================================
```

---

## Deployment Guide

### Option 1: Standalone Server Deployment (Ubuntu / Linux)

1. **Backend Service**:
   Run with Uvicorn managed by `systemd` or `supervisor`:
   ```bash
   uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

2. **Frontend Static Hosting**:
   Build the production bundle and serve with Nginx:
   ```bash
   cd frontend
   npm run build
   # Copy frontend/dist/ to /var/www/html/
   ```

3. **Sample Nginx Configuration**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           root /var/www/html/dist;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:8000/api/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

### Option 2: Docker Containerization

Create a `Dockerfile` for the combined or separated services using standard Python and Node base images.

---

## College Demonstration Mode

For presenting to examiners and evaluators:

1. **Launch Backend**:
   ```bash
   python -m uvicorn backend.main:app --reload
   ```
2. **Launch Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
3. **Execute Live Demo Steps**:
   - **Step 1: 1-Click Login**: Click "Sign In" in header -> click "Demo Sign In" (authenticates as `admin@talentai.com`).
   - **Step 2: Dashboard Overview**: View the 2,484 corpus stats, shortlisted rate, and top candidates.
   - **Step 3: Resume Screening**:
     - Navigate to **Resume Screening**.
     - Select the "Python Developer" preset job or select a saved job.
     - Select a sample resume (e.g., "Elena Rostova (Strong Match)") or drag-and-drop a file from `data/demo_resumes/`.
     - Click **Run AI Screening Analysis**.
   - **Step 4: View Results**: Review the radial ATS gauge, LinearSVC category prediction, and skill breakdown matrix.
   - **Step 5: Rankings & Export**: Navigate to **Candidate Rankings**, filter by category, and download the CSV.
   - **Step 6: Analytics**: Navigate to **Analytics** to view category distribution and talent funnel.

---

## Limitations

1. **Scanned PDF Images**: Purely image-based PDFs lacking an OCR text layer cannot be parsed without external OCR engines (e.g., Tesseract).
2. **Closed Domain Classes**: The category classification model classifies resumes strictly into the 24 classes present in the training corpus.
3. **Static Skill Synonyms**: Skill matching uses normalized keyword matching; future versions will benefit from semantic vector embeddings (e.g., matching "k8s" to "kubernetes").

---

## Future Scope

1. **Deep Learning Embeddings**: Integrate transformer models (BERT, RoBERTa) for deep semantic representation.
2. **Automated Interview Scheduling**: Integrate calendar APIs (Google Calendar / Microsoft Graph) directly into shortlisted candidate cards.
3. **Multi-Language Resume Parsing**: Support multilingual resume parsing (Spanish, German, French, Hindi).
4. **Automated Email Notifications**: Candidate status dispatch via SMTP/SendGrid.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
