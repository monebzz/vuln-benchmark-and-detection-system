"""
Central Configuration for the LineVul C/C++ Vulnerability Detection Platform.
All paths, thresholds, and hyperparameters are centralized here.
"""

import os
from pathlib import Path

# Base Paths
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
LINEVUL_DIR = ROOT_DIR / "linevul"
DOCS_DIR = ROOT_DIR / "docs"
EVAL_DIR = ROOT_DIR / "eval"
EVAL_RESULTS_DIR = EVAL_DIR / "results"
TESTS_DIR = ROOT_DIR / "tests"
FIXTURES_DIR = TESTS_DIR / "fixtures"

# Ensure directories exist
for d in [DOCS_DIR, EVAL_DIR, EVAL_RESULTS_DIR, TESTS_DIR, FIXTURES_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# CVE Knowledge Base & Embedding Paths
CVE_KB_PATH = Path(os.environ.get("CVE_KB_PATH", BACKEND_DIR / "app" / "cve_kb.json"))
CVE_INDEX_PATH = Path(os.environ.get("CVE_INDEX_PATH", ROOT_DIR / "cve_index.npy"))
CVE_METADATA_PATH = Path(os.environ.get("CVE_METADATA_PATH", ROOT_DIR / "cve_index_meta.json"))

# Service URLs
BACKEND_API_URL = os.environ.get("BACKEND_API_URL", "http://localhost:8001")
LINEVUL_API_URL = os.environ.get("LINEVUL_API_URL", "http://localhost:5000")

# CodeBERT & Transformer Parameters
CODEBERT_MODEL_NAME = "microsoft/codebert-base"
TOKEN_WINDOW_SIZE = int(os.environ.get("TOKEN_WINDOW_SIZE", 512))
TOKEN_STRIDE = int(os.environ.get("TOKEN_STRIDE", 256))

# Hotspot & Line Normalization Parameters
HOTSPOT_TOP_K = int(os.environ.get("HOTSPOT_TOP_K", 5))
HOTSPOT_MIN_SCORE = float(os.environ.get("HOTSPOT_MIN_SCORE", 0.60))
FLAGGED_THRESHOLD = float(os.environ.get("FLAGGED_THRESHOLD", 0.35))

# CVE Embedding Similarity Matching Parameters
CVE_MIN_SIMILARITY = float(os.environ.get("CVE_MIN_SIMILARITY", 0.85))
CVE_TOP_K = int(os.environ.get("CVE_TOP_K", 3))

# Risk Tier Thresholds (Derived strictly from probability)
RISK_TIERS = {
    "SAFE": (0.0, 0.30),
    "SUSPICIOUS": (0.30, 0.60),
    "HIGH": (0.60, 0.85),
    "CRITICAL": (0.85, 1.00),
}


def get_risk_label(probability: float) -> str:
    """Derive consistent risk label from probability alone."""
    p = float(probability)
    if p < 0.30:
        return "Safe"
    elif p < 0.60:
        return "Suspicious"
    elif p < 0.85:
        return "High"
    else:
        return "Critical"


# Model Calibration
TEMPERATURE = float(os.environ.get("MODEL_TEMPERATURE", 1.0))
CALIBRATION_FILE = EVAL_RESULTS_DIR / "calibration_params.json"
