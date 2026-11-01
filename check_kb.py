import sys
from pathlib import Path
root = Path(__file__).resolve().parent
sys.path.insert(0, str(root / "linevul"))
sys.path.insert(0, str(root))

try:
    import app
    print("[SUCCESS] linevul.app imported successfully!")
except Exception as e:
    import traceback
    print("[ERROR] Failed to import linevul.app:")
    traceback.print_exc()
