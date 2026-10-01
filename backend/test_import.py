import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

try:
    from backend.main import app
    print("SUCCESS: backend.main app imported cleanly!")
except Exception as e:
    import traceback
    print("FAILED TO IMPORT APP:")
    traceback.print_exc()
