"""
VulnScan — FastAPI Backend
Exposes POST /analyze endpoint for the React frontend.
Uses Joern for function extraction and CodeBERT for vulnerability classification.
"""

import os
import re
import json
import subprocess
import torch
from datetime import datetime, timezone
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
RUN_BAT        = os.path.join(BASE_DIR, "run.bat")
EXTRACT_SC     = os.path.join(BASE_DIR, "extract.sc")
FUNCTIONS_JSON = os.path.join(BASE_DIR, "functions.json")
UPLOAD_DIR     = os.path.join(BASE_DIR, "uploads")
WORKSPACE_DIR  = os.path.join(BASE_DIR, "workspace")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(title="VulnScan API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model Loading (lazy singleton) ──────────────────────────────────────────
_tokenizer = None
_model = None

def get_model():
    global _tokenizer, _model
    if _tokenizer is None or _model is None:
        print("Loading CodeBERT model... (first request only)")
        _tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
        _model = AutoModelForSequenceClassification.from_pretrained(
            "mahdin70/codebert-devign-code-vulnerability-detector"
        )
        _model.eval()
        print("Model loaded successfully.")
    return _tokenizer, _model

# ── Helpers ──────────────────────────────────────────────────────────────────
def normalize_code(code: str) -> str:
    code = re.sub(r'//.*', '', code)
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    code = re.sub(r'\s+', ' ', code).strip()
    return code

def predict(code: str, tokenizer, model):
    code = normalize_code(code)
    inputs = tokenizer(
        code, return_tensors="pt",
        truncation=True, padding="max_length", max_length=512
    )
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        pred = torch.argmax(probs, dim=1).item()
        confidence = probs[0][pred].item()
    return pred, confidence

def update_extract_sc(c_file_path: str):
    script = f"""importCode("{c_file_path.replace(chr(92), '/')}")

cpg.method.filter(_.filename != "<empty>").map(m => Map(
  "name" -> m.name,
  "code" -> m.code,
  "filename" -> m.filename,
  "lineNumber" -> m.lineNumber.getOrElse(-1),
  "lineNumberEnd" -> m.lineNumberEnd.getOrElse(-1)
)).toJson #> "{FUNCTIONS_JSON.replace(chr(92), '/')}"

exit
"""
    with open(EXTRACT_SC, "w") as f:
        f.write(script)

def run_joern():
    """Run Joern and clean up workspace after extraction."""
    if os.path.exists(FUNCTIONS_JSON):
        os.remove(FUNCTIONS_JSON)
    # Clean Joern workspace to avoid stale CPGs
    if os.path.exists(WORKSPACE_DIR):
        import shutil
        shutil.rmtree(WORKSPACE_DIR, ignore_errors=True)
    subprocess.call(RUN_BAT, shell=True, cwd=BASE_DIR)
    return os.path.exists(FUNCTIONS_JSON)

# ── API Endpoint ─────────────────────────────────────────────────────────────
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    # Validate file extension
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ('.c', '.cpp', '.h', '.cc', '.cxx', '.hpp'):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Please upload a .c, .cpp, or .h file."
        )

    # Save uploaded file
    save_path = os.path.join(UPLOAD_DIR, filename)
    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)

    # Step 1: Run Joern to extract functions
    update_extract_sc(save_path)
    success = run_joern()

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Joern failed to extract functions. The file may be invalid or Joern is not configured correctly."
        )

    # Step 2: Load extracted functions
    try:
        with open(FUNCTIONS_JSON, "r", encoding="utf-8") as f:
            functions = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse extracted functions: {str(e)}")

    # Step 3: Run CodeBERT predictions
    tokenizer, model = get_model()
    SKIP_NAMES = {"<global>", "<module>", "main", "<init>"}
    results = []

    for func in functions:
        name     = func.get("name", "unknown")
        code     = func.get("code", "")
        start    = func.get("lineNumber", -1)
        end      = func.get("lineNumberEnd", -1)

        if name in SKIP_NAMES or name.startswith("<") or len(code.strip()) < 20:
            continue

        pred, confidence = predict(code, tokenizer, model)
        results.append({
            "function_name": name,
            "start_line": start if isinstance(start, int) and start > 0 else 1,
            "end_line": end if isinstance(end, int) and end > 0 else 1,
            "label": "VULNERABLE" if pred == 1 else "SAFE",
            "confidence": round(confidence, 4),
            "vulnerability_type": None,
        })

    vuln_count = sum(1 for r in results if r["label"] == "VULNERABLE")
    safe_count = sum(1 for r in results if r["label"] == "SAFE")

    return {
        "filename": filename,
        "total_functions": len(results),
        "vulnerable_count": vuln_count,
        "safe_count": safe_count,
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "results": results,
    }

# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}
