"""
Application entrypoint alias for uvicorn app:app compatibility.
Allows starting the server from either:
  1) Workspace root: python -m uvicorn backend.app:app --reload --port 8000
  2) backend/ dir:   python -m uvicorn app:app --reload --port 8000
"""
import sys
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import app

__all__ = ["app"]
