import re
import nltk
from nltk.corpus import stopwords

# Ensure NLTK English stopwords are ready
try:
    stop_words = set(stopwords.words("english"))
except Exception:
    nltk.download("stopwords", quiet=True)
    stop_words = set(stopwords.words("english"))


def clean_text(text: str) -> str:
    """
    Cleans raw text matching the training pipeline:
    - Lowercase
    - Remove URLs
    - Remove non-alphabetic characters
    - Normalize multiple whitespaces
    """
    if not text:
        return ""
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def remove_stopwords(text: str) -> str:
    """
    Removes English stopwords from text matching the training pipeline.
    """
    if not text:
        return ""
    words = text.split()
    return " ".join(
        word for word in words
        if word not in stop_words
    )


def preprocess_text(text: str) -> str:
    """
    Full text preprocessing pipeline for TF-IDF vectorization:
    clean_text -> remove_stopwords
    """
    cleaned = clean_text(text)
    return remove_stopwords(cleaned)
