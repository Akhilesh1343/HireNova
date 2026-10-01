import os
import pandas as pd
from pathlib import Path
from typing import List, Optional, Dict, Any


class CandidateService:
    """
    Service to access and query the existing CSV data without duplicating files:
    - candidate_ranking.csv
    - shortlisted_candidates.csv
    - Resume/Resume.csv
    """

    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(CandidateService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, base_dir: Optional[Path] = None):
        if getattr(self, "_initialized", False):
            return

        if base_dir:
            self.base_dir = Path(base_dir)
        else:
            self.base_dir = Path(__file__).resolve().parent.parent.parent

        self.ranking_file = self.base_dir / "candidate_ranking.csv"
        self.shortlist_file = self.base_dir / "shortlisted_candidates.csv"
        self.resume_file = self.base_dir / "Resume" / "Resume.csv"

        self.df_candidates = None
        self.df_shortlisted = None
        self._analytics_cache = None

        self.load_data()
        self._initialized = True

    def load_data(self):
        """Loads and pre-processes CSV datasets in memory."""
        if self.ranking_file.exists():
            print(f"[CandidateService] Loading {self.ranking_file.name}...")
            df = pd.read_csv(str(self.ranking_file))
            # Clean Matched_Skills and numeric columns
            df["ID"] = df["ID"].astype(str)
            df["Rank"] = df["Rank"].astype(int)
            df["Similarity"] = df["Similarity"].astype(float).round(2)
            df["Skill_Score"] = df["Skill_Score"].astype(float).round(2)
            df["ATS_Score"] = df["ATS_Score"].astype(float).round(2)
            df["Matched_Skills"] = df["Matched_Skills"].fillna("")
            self.df_candidates = df
        else:
            print(f"[CandidateService] Warning: {self.ranking_file} not found.")
            self.df_candidates = pd.DataFrame()

        if self.shortlist_file.exists():
            print(f"[CandidateService] Loading {self.shortlist_file.name}...")
            df_short = pd.read_csv(str(self.shortlist_file))
            df_short["ID"] = df_short["ID"].astype(str)
            df_short["Rank"] = df_short["Rank"].astype(int)
            self.df_shortlisted = df_short
        else:
            self.df_shortlisted = pd.DataFrame()

    def _determine_recommendation(self, ats: float) -> str:
        """Determines ATS recommendation tier."""
        if ats >= 70.0:
            return "Strong Match"
        elif ats >= 50.0:
            return "Good Match"
        elif ats >= 30.0:
            return "Moderate Match"
        else:
            return "Low Match"

    def _row_to_candidate_item(self, row: pd.Series) -> Dict[str, Any]:
        """Maps a pandas row to candidate dictionary."""
        skills_raw = str(row.get("Matched_Skills", ""))
        matched = [s.strip() for s in skills_raw.split(",") if s.strip() and s.strip() != "nan"]
        ats = float(row.get("ATS_Score", 0.0))

        return {
            "rank": int(row.get("Rank", 0)),
            "id": str(row.get("ID", "")),
            "category": str(row.get("Category", "GENERAL")),
            "similarity": float(row.get("Similarity", 0.0)),
            "skill_score": float(row.get("Skill_Score", 0.0)),
            "ats_score": ats,
            "matched_skills": matched,
            "recommendation": self._determine_recommendation(ats)
        }

    def get_candidates(
        self,
        skip: int = 0,
        limit: int = 50,
        category: Optional[str] = None,
        search: Optional[str] = None,
        min_ats: float = 0.0,
        sort_by: str = "Rank",
        sort_order: str = "asc"
    ) -> Dict[str, Any]:
        """Returns filtered, searched, sorted, and paginated candidate list."""
        if self.df_candidates is None or self.df_candidates.empty:
            return {"total": 0, "skip": skip, "limit": limit, "candidates": []}

        df = self.df_candidates

        # Category filter
        if category and category.upper() != "ALL":
            df = df[df["Category"].str.upper() == category.upper()]

        # Min ATS score filter
        if min_ats > 0.0:
            df = df[df["ATS_Score"] >= min_ats]

        # Search filter (by ID, Category, or Matched_Skills)
        if search:
            s = search.lower().strip()
            mask = (
                df["ID"].str.lower().str.contains(s) |
                df["Category"].str.lower().str.contains(s) |
                df["Matched_Skills"].str.lower().str.contains(s)
            )
            df = df[mask]

        # Sorting
        sort_col = "Rank"
        if sort_by.lower() in ["ats", "ats_score"]:
            sort_col = "ATS_Score"
        elif sort_by.lower() in ["similarity", "similarity_score"]:
            sort_col = "Similarity"
        elif sort_by.lower() in ["skill", "skill_score"]:
            sort_col = "Skill_Score"

        ascending = (sort_order.lower() == "asc")
        df = df.sort_values(by=sort_col, ascending=ascending)

        total = len(df)
        paginated_df = df.iloc[skip : skip + limit]

        candidates = [self._row_to_candidate_item(row) for _, row in paginated_df.iterrows()]

        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "candidates": candidates
        }

    def get_top_candidates(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Returns top candidates from shortlist / top rankings."""
        if self.df_candidates is None or self.df_candidates.empty:
            return []

        top_df = self.df_candidates.head(limit)
        return [self._row_to_candidate_item(row) for _, row in top_df.iterrows()]

    def get_candidate_by_id(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        """Returns detailed candidate info, with resume preview if found."""
        if self.df_candidates is None or self.df_candidates.empty:
            return None

        match = self.df_candidates[self.df_candidates["ID"] == str(candidate_id)]
        if match.empty:
            return None

        row = match.iloc[0]
        result = self._row_to_candidate_item(row)

        # Attempt to load resume text preview from Resume.csv if available
        resume_preview = None
        if self.resume_file.exists():
            try:
                # Optimized chunked reading for large Resume.csv
                for chunk in pd.read_csv(str(self.resume_file), chunksize=500, usecols=["ID", "Resume_str"]):
                    chunk_match = chunk[chunk["ID"].astype(str) == str(candidate_id)]
                    if not chunk_match.empty:
                        resume_preview = str(chunk_match.iloc[0]["Resume_str"])[:3000].strip()
                        break
            except Exception as e:
                print(f"[CandidateService] Resume.csv preview lookup error: {e}")

        result["resume_preview"] = resume_preview
        return result

    def get_analytics(self) -> Dict[str, Any]:
        """Calculates global statistical analytics over the 2,484 resumes."""
        if self._analytics_cache:
            return self._analytics_cache

        if self.df_candidates is None or self.df_candidates.empty:
            return {
                "total_resumes": 0,
                "total_candidates": 0,
                "shortlisted_candidates": 0,
                "average_ats_score": 0.0,
                "highest_ats_score": 0.0,
                "average_shortlist_ats": 0.0,
                "category_distribution": [],
                "score_distribution": [],
                "skill_distribution": [],
                "required_skills": []
            }

        df = self.df_candidates
        total = len(df)
        avg_ats = round(float(df["ATS_Score"].mean()), 2)
        max_ats = round(float(df["ATS_Score"].max()), 2)

        # Shortlisted count (ATS >= 28.95)
        shortlisted_df = df[df["ATS_Score"] >= 28.95]
        shortlisted_count = len(shortlisted_df)
        avg_shortlist_ats = round(float(shortlisted_df["ATS_Score"].mean()), 2) if shortlisted_count > 0 else 0.0

        # Category distribution
        cat_counts = df["Category"].value_counts()
        category_distribution = [
            {"category": cat, "count": int(count)}
            for cat, count in cat_counts.items()
        ]

        # Score distribution buckets matching Phase 2 thresholds
        score_distribution = [
            {"range": ">= 70% (Strong Match)", "count": int((df["ATS_Score"] >= 70).sum())},
            {"range": "50% - 69% (Good Match)", "count": int(((df["ATS_Score"] >= 50) & (df["ATS_Score"] < 70)).sum())},
            {"range": "30% - 49% (Moderate Match)", "count": int(((df["ATS_Score"] >= 30) & (df["ATS_Score"] < 50)).sum())},
            {"range": "10% - 29% (Low Match)", "count": int(((df["ATS_Score"] >= 10) & (df["ATS_Score"] < 30)).sum())},
            {"range": "< 10% (Unmatched)", "count": int((df["ATS_Score"] < 10).sum())}
        ]

        # Skill presence frequency
        required_skills = [
            "python", "django", "flask", "sql", "rest api", "git", "data structures", "software development"
        ]
        skill_distribution = []
        for s in required_skills:
            cnt = int(df["Matched_Skills"].str.contains(s, case=False).sum())
            skill_distribution.append({"skill": s, "count": cnt})

        analytics = {
            "total_resumes": total,
            "total_candidates": total,
            "shortlisted_candidates": shortlisted_count,
            "average_ats_score": avg_ats,
            "highest_ats_score": max_ats,
            "average_shortlist_ats": avg_shortlist_ats,
            "category_distribution": category_distribution,
            "score_distribution": score_distribution,
            "skill_distribution": skill_distribution,
            "required_skills": required_skills
        }

        self._analytics_cache = analytics
        return analytics


# Global singleton instance
candidate_service = CandidateService()
