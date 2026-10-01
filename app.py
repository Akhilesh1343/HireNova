import streamlit as st
import pandas as pd
import joblib
import PyPDF2
import re

# Load trained files
model = joblib.load("resume_model.pkl")
tfidf = joblib.load("tfidf_vectorizer.pkl")
required_skills = joblib.load("required_skills.pkl")

st.set_page_config(
    page_title="AI Resume Screening",
    page_icon="📄",
    layout="wide"
)

st.title("🤖 AI Resume Screening System")
st.write("Upload your resume to analyze your job suitability.")

# Job description
job_description = st.text_area(
    "📋 Job Description",
    value="""We are looking for a Python Developer with strong skills in
Python, Django, Flask, SQL, REST API, Git, data structures,
and software development."""
)

uploaded_file = st.file_uploader(
    "📄 Upload Resume",
    type=["pdf"]
)

if uploaded_file is not None:

    # Extract PDF text
    reader = PyPDF2.PdfReader(uploaded_file)
    resume_text = ""

    for page in reader.pages:
        resume_text += page.extract_text() or ""

    st.subheader("📑 Resume Preview")
    st.text_area(
        "Extracted Text",
        resume_text[:3000],
        height=200
    )

    # Clean text
    def clean_text(text):
        text = text.lower()
        text = re.sub(r"http\S+|www\S+", " ", text)
        text = re.sub(r"[^a-zA-Z\s]", " ", text)
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    clean_resume = clean_text(resume_text)
    clean_job = clean_text(job_description)

    # TF-IDF similarity
    job_vector = tfidf.transform([clean_job])
    resume_vector = tfidf.transform([clean_resume])

    from sklearn.metrics.pairwise import cosine_similarity

    similarity = cosine_similarity(
        job_vector,
        resume_vector
    )[0][0] * 100

    # Skill matching
    matched_skills = [
        skill for skill in required_skills
        if skill.lower() in clean_resume
    ]

    skill_score = (
        len(matched_skills) /
        len(required_skills)
    ) * 100

    # Final ATS score
    ats_score = (
        similarity * 0.4 +
        skill_score * 0.6
    )

    # Prediction
    category = model.predict(
        tfidf.transform([clean_resume])
    )[0]

    st.divider()

    col1, col2, col3 = st.columns(3)

    col1.metric(
        "🎯 ATS Score",
        f"{ats_score:.2f}%"
    )

    col2.metric(
        "🧠 Skill Match",
        f"{skill_score:.2f}%"
    )

    col3.metric(
        "📊 Resume Category",
        category
    )

    st.subheader("🛠️ Matched Skills")

    if matched_skills:
        st.success(", ".join(matched_skills))
    else:
        st.warning("No required skills detected.")

    # Recommendation
    if ats_score >= 40:
        recommendation = "🟢 Strong Match"
    elif ats_score >= 30:
        recommendation = "🟡 Good Match"
    elif ats_score >= 20:
        recommendation = "🟠 Moderate Match"
    else:
        recommendation = "🔴 Low Match"

    st.subheader("💡 Recommendation")
    st.info(recommendation)

# Expose FastAPI app instance for uvicorn app:app compatibility when run from workspace root
try:
    from backend.main import app
except Exception:
    pass