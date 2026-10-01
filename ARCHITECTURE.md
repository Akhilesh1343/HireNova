# System Architecture & Technical Specifications

## AI Resume Screening & Candidate Shortlisting System

---

## 1. High-Level Architectural Overview

The AI Resume Screening & Candidate Shortlisting System is built on a decoupled, microservices-style client-server architecture designed for high throughput, sub-second screening latency, and recruiter-focused analytics.

```
+-------------------------------------------------------------------------+
|                         React 18 + Vite Frontend                        |
|   (Dashboard, Screening Engine, Candidate Rankings, Analytics, Admin)    |
+-------------------------------------------------------------------------+
                                    |
                                    | HTTPS / JSON & Multipart-Form
                                    v
+-------------------------------------------------------------------------+
|                           FastAPI Backend                               |
|   (ASGI / Uvicorn Server, REST Endpoints, OAuth2 JWT Authentication)    |
+-------------------------------------------------------------------------+
                                    |
                                    | In-Memory Service Calls
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
|                 * Seamless migration to PostgreSQL *                   |
+-------------------------------------------------------------------------+
```

---

## 2. End-to-End Resume Screening Flow

The resume screening lifecycle transforms an unstructured binary or text document into a structured recruiter evaluation:

```
[Candidate Resume (PDF/DOCX/TXT)]
               │
               ▼
┌──────────────────────────────┐
│  1. Document Text Extraction │  --> PyPDF / python-docx / utf-8 text extractor
└──────────────┬───────────────┘
               │  Extracted Plain Text
               ▼
┌──────────────────────────────┐
│  2. NLP Cleaning & Filtering │  --> Strip URLs, special characters, normalize spaces
└──────────────┬───────────────┘
               │  Cleaned Tokens
               ▼
┌──────────────────────────────┐
│  3. TF-IDF Transformation    │  --> Scikit-learn TF-IDF Vectorizer (ngram range (1, 2))
└──────────────┬───────────────┘
               │  Dense TF-IDF Sparse Vectors
               ▼
┌──────────────────────────────┐
│  4. LinearSVC Classification │  --> Categorizes resume into 1 of 24 industry domains
└──────────────┬───────────────┘
               │
               ├─────────────────────────────────────────┐
               ▼                                         ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  5. Cosine Similarity Match  │        │  6. Skill Extraction Match   │
│  (Resume Vector vs JD Vector)│        │  (Keyword presence check)    │
└──────────────┬───────────────┘        └──────────────┬───────────────┘
               │  Similarity Score (0-100%)            │  Skill Match Score (0-100%)
               └────────────────────┬──────────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │ 7. Weighted ATS Calculation  │
                     │ ATS = (Sim * 0.4)+(Skill*0.6)│
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │ 8. Recommendation Assignment │
                     │  - Strong Match  (>= 70%)    │
                     │  - Good Match    (>= 50%)    │
                     │  - Moderate Match(>= 30%)    │
                     │  - Low Match     (< 30%)     │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │ 9. SQLite DB Persistence     │
                     │    & Recruiter Response      │
                     └──────────────────────────────┘
```

### Detailed Pipeline Stages

1. **Document Ingestion & Validation**:
   - The recruiter uploads a resume file (`.pdf`, `.docx`, or `.txt`) along with a target job description and skill requirements.
   - File size is constrained to a 10MB limit and file format extensions are validated against strict whitelists.
2. **Text Extraction**:
   - **PDF**: Parsed using `pypdf` extracting text across all document pages.
   - **DOCX**: Structured extraction using `python-docx` traversing paragraphs and headings.
   - **TXT**: Direct UTF-8 decoding with fallback handling.
3. **Text Normalization**:
   - URLs, email addresses, and HTML tags are stripped.
   - Non-alphanumeric punctuation is removed.
   - Excess whitespace and line breaks are normalized into single spaces.
4. **TF-IDF Vectorization**:
   - The pre-trained `tfidf_vectorizer.pkl` maps both the resume text and the job description into high-dimensional vector representations.
5. **Domain Classification**:
   - The pre-trained `resume_model.pkl` (Linear Support Vector Classifier) predicts the primary domain out of 24 industry sectors (e.g., `ENGINEERING`, `INFORMATION-TECHNOLOGY`, `FINANCE`, `HEALTHCARE`).
6. **Cosine Similarity**:
   $$\text{Similarity} = \frac{\mathbf{v}_{\text{resume}} \cdot \mathbf{v}_{\text{job}}}{\|\mathbf{v}_{\text{resume}}\| \|\mathbf{v}_{\text{job}}\|} \times 100$$
7. **Skill Matching**:
   $$\text{Skill Score} = \left(\frac{N_{\text{matched}}}{N_{\text{required}}}\right) \times 100$$
8. **ATS Score Formulation**:
   $$\text{ATS Score} = (\text{Similarity} \times 0.40) + (\text{Skill Score} \times 0.60)$$
9. **Recommendation Matrix**:
   - **Strong Match**: ATS Score $\ge 70\%$
   - **Good Match**: $50\% \le \text{ATS Score} < 70\%$
   - **Moderate Match**: $30\% \le \text{ATS Score} < 50\%$
   - **Low Match**: $\text{ATS Score} < 30\%$
10. **Data Persistence**:
    - Result is saved to the SQLite database table `screening_results` and indexed by candidate identifier for ranking and history tracking.

---

## 3. Technology Stack & Component Specifications

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, Vite, Tailwind CSS | Single-page responsive recruiter portal |
| **Icons & Design** | Lucide React | Clean, modern visual indicators |
| **Backend API** | FastAPI, Uvicorn, Python 3.13 | High-performance asynchronous REST microservice |
| **Machine Learning** | Scikit-Learn, LinearSVC, TF-IDF | Classification, vectorization, and similarity scoring |
| **Database** | SQLite 3 (SQLAlchemy ORM) | Local zero-configuration relational persistence |
| **Auth & Security** | Passlib, Bcrypt, Python-JOSE | Secure password hashing and stateless JWT tokens |
| **Document Parsers** | PyPDF, python-docx | Text extraction from multi-format resume files |

---

## 4. Database Schema Design

The relational database architecture is managed via SQLAlchemy ORM with four primary entities:

```
┌───────────────────────────┐         ┌───────────────────────────┐
│           users           │         │     job_descriptions      │
├───────────────────────────┤         ├───────────────────────────┤
│ id (PK, Integer)          │ 1     * │ id (PK, Integer)          │
│ email (Unique, String)    ├────────<│ title (String)            │
│ hashed_password (String)  │         │ description (Text)        │
│ full_name (String)        │         │ required_skills (JSON)    │
│ role (String)             │         │ user_id (FK -> users.id)  │
│ is_active (Boolean)       │         │ created_at (DateTime)     │
│ created_at (DateTime)     │         │ updated_at (DateTime)     │
└─────────────┬─────────────┘         └─────────────┬─────────────┘
              │ 1                                   │ 1
              │                                     │
              │ *                                   │ *
┌─────────────▼─────────────┐         ┌─────────────▼─────────────┐
│     screening_results     │         │        candidates         │
├───────────────────────────┤         ├───────────────────────────┤
│ id (PK, Integer)          │         │ id (PK, Integer)          │
│ candidate_id (String)     │         │ candidate_id (Unique)     │
│ candidate_name (String)   │         │ name (String)             │
│ predicted_category (String│         │ category (String)         │
│ similarity_score (Float)  │         │ ats_score (Float)         │
│ skill_score (Float)       │         │ similarity_score (Float)  │
│ ats_score (Float)         │         │ skill_score (Float)       │
│ matched_skills (JSON)     │         │ matched_skills (JSON)     │
│ missing_skills (JSON)     │         │ missing_skills (JSON)     │
│ recommendation (String)   │         │ recommendation (String)   │
│ resume_filename (String)  │         │ resume_preview (Text)     │
│ file_type (String)        │         │ updated_at (DateTime)     │
│ job_title (String)        │         └───────────────────────────┘
│ job_description_id (FK)   │
│ user_id (FK -> users.id)  │
│ created_at (DateTime)     │
└───────────────────────────┘
```

---

## 5. PostgreSQL Migration Path

While SQLite is configured by default for zero-setup demonstration, the application is fully database-agnostic through SQLAlchemy.

To switch to PostgreSQL in enterprise production:

1. Install psycopg2:
   ```bash
   pip install psycopg2-binary
   ```
2. Set the environment variable in `.env`:
   ```env
   DATABASE_URL=postgresql://recruiter:SecretPass2026@db-server:5432/resume_screening_db
   ```
3. Restart the FastAPI backend. SQLAlchemy will automatically create all tables and indexes on the PostgreSQL instance.

---

## 6. Security & Hardening Architecture

1. **Authentication**:
   - OAuth2 Bearer token architecture with HMAC-SHA256 (HS256) signature.
   - JWT tokens include expiration timestamps (`exp`), issuer identity (`sub`), and tamper-proof verification.
2. **Password Security**:
   - Passwords hashed using `bcrypt` with automatically generated salts. Plaintext passwords never reach storage or log files.
3. **Upload Sanitization**:
   - Input filenames sanitized to prevent path traversal (`../`) vulnerabilities.
   - Size limit strictly enforced (10MB maximum).
   - Content format validated via both extension checking and parser verification.
4. **CORS Isolation**:
   - Restricted cross-origin resource sharing configured via `CORS_ORIGINS` environment variable.
