import os
import joblib
from pathlib import Path
from typing import List, Optional, Dict, Any
from sklearn.metrics.pairwise import cosine_similarity

from backend.utils.preprocessor import preprocess_text, clean_text


class MLService:
    """
    Singleton service that loads and serves the trained ML model,
    TF-IDF vectorizer, and baseline required skills.
    Reuses existing artifacts from the workspace root.
    """

    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(MLService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, base_dir: Optional[Path] = None):
        if getattr(self, "_initialized", False):
            return

        # Determine root directory containing the existing ML files
        if base_dir:
            self.base_dir = Path(base_dir)
        else:
            # backend/services/ml_service.py -> parent of backend is root
            self.base_dir = Path(__file__).resolve().parent.parent.parent

        self.model_path = self.base_dir / "resume_model.pkl"
        self.tfidf_path = self.base_dir / "tfidf_vectorizer.pkl"
        self.skills_path = self.base_dir / "required_skills.pkl"

        self.model = None
        self.tfidf = None
        self.required_skills: List[str] = []

        self.load_artifacts()
        self._initialized = True

    def load_artifacts(self):
        """Loads existing ML pickles with validation."""
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model file not found at {self.model_path}")
        if not self.tfidf_path.exists():
            raise FileNotFoundError(f"TF-IDF vectorizer not found at {self.tfidf_path}")
        if not self.skills_path.exists():
            raise FileNotFoundError(f"Required skills file not found at {self.skills_path}")

        print(f"[MLService] Loading model from: {self.model_path.name}")
        self.model = joblib.load(str(self.model_path))

        print(f"[MLService] Loading TF-IDF vectorizer from: {self.tfidf_path.name}")
        self.tfidf = joblib.load(str(self.tfidf_path))

        print(f"[MLService] Loading default skills from: {self.skills_path.name}")
        loaded_skills = joblib.load(str(self.skills_path))
        if isinstance(loaded_skills, (list, tuple, set)):
            self.required_skills = [str(s).strip() for s in loaded_skills]
        else:
            self.required_skills = [
                "python", "django", "flask", "sql", "rest api", "git", "data structures", "software development"
            ]

    def get_default_skills(self) -> List[str]:
        return list(self.required_skills)

    def screen_resume(
        self,
        resume_text: str,
        job_description: str,
        custom_skills: Optional[List[str]] = None,
        filename: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the exact resume screening pipeline from Jupyter notebook:
        1. Preprocess resume and job description (clean + remove stopwords)
        2. TF-IDF vectorization of both texts
        3. Predict category with LinearSVC model
        4. Cosine similarity between job_vector and resume_vector * 100
        5. Case-insensitive skill matching
        6. Skill score = (matched / total) * 100
        7. ATS Score = (similarity * 0.4) + (skill_score * 0.6)
        8. Recommendation tiers
        """
        # Determine effective required skills
        if custom_skills and len(custom_skills) > 0:
            effective_skills = [s.strip().lower() for s in custom_skills if s and s.strip()]
        else:
            effective_skills = [s.strip().lower() for s in self.required_skills]

        # 1. Preprocessing (exact match with notebook training)
        resume_clean = preprocess_text(resume_text)
        job_clean = preprocess_text(job_description)

        if not resume_clean:
            raise ValueError("Processed resume text contains no valid alphabetic content.")

        # 2. Vectorization
        resume_vector = self.tfidf.transform([resume_clean])
        job_vector = self.tfidf.transform([job_clean])

        # 3. Model Category Prediction
        predicted_category = str(self.model.predict(resume_vector)[0])

        # 4. Cosine Similarity Score
        raw_similarity = float(cosine_similarity(job_vector, resume_vector)[0][0]) * 100.0
        similarity_score = round(max(0.0, min(100.0, raw_similarity)), 2)

        # 5. Skill Matching (case-insensitive in cleaned text)
        matched_skills = [
            skill for skill in effective_skills
            if skill in resume_clean
        ]
        missing_skills = [
            skill for skill in effective_skills
            if skill not in matched_skills
        ]

        # 6. Skill Score
        if len(effective_skills) > 0:
            skill_score = round((len(matched_skills) / len(effective_skills)) * 100.0, 2)
        else:
            skill_score = 0.0

        # 7. Final ATS-style Score
        ats_score = round((similarity_score * 0.4) + (skill_score * 0.6), 2)

        # 8. Recommendation according to Phase 2 guidelines:
        # ATS >= 70: Strong Match | ATS >= 50: Good Match | ATS >= 30: Moderate Match | ATS < 30: Low Match
        if ats_score >= 70.0:
            recommendation = "Strong Match"
        elif ats_score >= 50.0:
            recommendation = "Good Match"
        elif ats_score >= 30.0:
            recommendation = "Moderate Match"
        else:
            recommendation = "Low Match"

        # Candidate ID generation
        candidate_num = abs(hash(resume_text[:200] if len(resume_text) >= 200 else resume_text)) % 90000000 + 10000000
        candidate_id = str(candidate_num)

        return {
            "candidate_id": candidate_id,
            "predicted_category": predicted_category,
            "similarity_score": similarity_score,
            "skill_score": skill_score,
            "ats_score": ats_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "recommendation": recommendation,
            "file_name": filename or "Uploaded_Resume.pdf",
            "extracted_text_preview": resume_text[:3000].strip()
        }


# Global singleton instance
ml_service = MLService()
