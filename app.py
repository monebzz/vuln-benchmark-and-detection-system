import streamlit as st
import subprocess
import json
import torch
import re
import os
import time
import shutil
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
RUN_BAT        = os.path.join(BASE_DIR, "run.bat")
EXTRACT_SC     = os.path.join(BASE_DIR, "extract.sc")
FUNCTIONS_JSON = os.path.join(BASE_DIR, "functions.json")
UPLOAD_DIR     = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── Page Config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Vulnerability Detection",
    page_icon="🔐",
    layout="wide"
)

st.title("🔐 C/C++ Vulnerability Detection System")
st.markdown("Upload a C or C++ file to detect vulnerable functions using **Joern + CodeBERT**.")

# ── Load Model (cached) ───────────────────────────────────────────────────────
@st.cache_resource
def load_model():
    tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
    model = AutoModelForSequenceClassification.from_pretrained(
        "mahdin70/codebert-devign-code-vulnerability-detector"
    )
    model.eval()
    return tokenizer, model

# ── Helpers ───────────────────────────────────────────────────────────────────
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
        confidence = probs[0][pred].item() * 100
    return pred, confidence

def update_extract_sc(c_file_path: str):
    script = f"""importCode("{c_file_path.replace(chr(92), '/')}")

cpg.method.filter(_.filename != "<empty>").map(m => Map(
  "name" -> m.name,
  "code" -> m.code,
  "filename" -> m.filename
)).toJson #> "{FUNCTIONS_JSON.replace(chr(92), '/')}"

exit
"""
    with open(EXTRACT_SC, "w") as f:
        f.write(script)

def run_joern():
    if os.path.exists(FUNCTIONS_JSON):
        os.remove(FUNCTIONS_JSON)
    subprocess.call(RUN_BAT, shell=True)
    return os.path.exists(FUNCTIONS_JSON)

def run_prediction(tokenizer, model):
    with open(FUNCTIONS_JSON, "r", encoding="utf-8") as f:
        functions = json.load(f)

    SKIP_NAMES = {"<global>", "<module>", "main"}
    results = []

    for func in functions:
        name     = func.get("name", "unknown")
        code     = func.get("code", "")
        filename = func.get("filename", "")

        if name in SKIP_NAMES or name.startswith("<") or len(code.strip()) < 20:
            continue

        pred, confidence = predict(code, tokenizer, model)
        results.append({
            "Function": name,
            "File": os.path.basename(filename),
            "Prediction": "VULNERABLE" if pred == 1 else "SAFE",
            "Confidence": f"{confidence:.2f}%",
            "pred_int": pred
        })

    return results

# ── UI ────────────────────────────────────────────────────────────────────────
uploaded_file = st.file_uploader(
    "Upload your C/C++ file",
    type=["c", "cpp", "h"]
)

if uploaded_file is not None:
    # Save uploaded file
    save_path = os.path.join(UPLOAD_DIR, uploaded_file.name)
    with open(save_path, "wb") as f:
        f.write(uploaded_file.getbuffer())

    st.success(f"✅ File uploaded: `{uploaded_file.name}`")

    # Show file contents
    with st.expander("📄 View uploaded file"):
        st.code(uploaded_file.getvalue().decode("utf-8"), language="c")

    if st.button("🚀 Run Analysis", type="primary"):

        # Step 1 — Joern
        with st.spinner("⏳ Running Joern... this may take a minute"):
            update_extract_sc(save_path)
            success = run_joern()

        if not success:
            st.error("❌ Joern failed to extract functions. Check your file.")
        else:
            # Step 2 — CodeBERT
            with st.spinner("🤖 Running CodeBERT predictions..."):
                tokenizer, model = load_model()
                results = run_prediction(tokenizer, model)

            if not results:
                st.warning("⚠️ No functions found to analyze.")
            else:
                # Summary
                vuln_count = sum(1 for r in results if r["Prediction"] == "VULNERABLE")
                safe_count = sum(1 for r in results if r["Prediction"] == "SAFE")

                st.markdown("---")
                st.subheader("📊 Summary")

                col1, col2, col3 = st.columns(3)
                col1.metric("Total Functions", len(results))
                col2.metric("🔴 Vulnerable", vuln_count)
                col3.metric("🟢 Safe", safe_count)

                st.markdown("---")
                st.subheader("📋 Detailed Results")

                # Display each result
                for r in results:
                    if r["Prediction"] == "VULNERABLE":
                        st.error(
                            f"🔴 **{r['Function']}** — VULNERABLE ({r['Confidence']} confidence)"
                        )
                    else:
                        st.success(
                            f"🟢 **{r['Function']}** — SAFE ({r['Confidence']} confidence)"
                        )

                # Full table
                st.markdown("---")
                st.subheader("📁 Full Results Table")
                display_results = [
                    {k: v for k, v in r.items() if k != "pred_int"}
                    for r in results
                ]
                st.table(display_results)

                # Download results
                st.download_button(
                    label="⬇️ Download results.json",
                    data=json.dumps(display_results, indent=2),
                    file_name="results.json",
                    mime="application/json"
                )