# LineVul — AI Source Code Vulnerability Detection System

LineVul is a line-level vulnerability prediction engine based on a fine-tuned CodeBERT/RoBERTa deep neural architecture. It predicts both function-level vulnerability status and pinpoints the exact vulnerable lines using 12-head self-attention attribution scores.

---

## 📁 Directory Structure & Architecture

Everything related to LineVul is completely self-contained in this folder:

```text
Archive/
└── linevul/
    ├── app.py                     # Flask web server and prediction REST API
    ├── run.bat                    # One-click Windows batch launcher
    ├── run.ps1                    # One-click PowerShell launcher
    ├── setup_env.ps1              # Environment setup script
    ├── requirements.txt           # Python dependencies
    ├── templates/
    │   └── index.html             # LineVul Interactive Web Inspector UI
    ├── static/
    │   ├── css/
    │   │   └── style.css          # Glassmorphic dark theme styles & animations
    │   └── js/
    │       └── main.js            # Frontend logic, file reader, & line heatmap
    └── linevul/
        ├── linevul_model.py       # PyTorch Model wrapper (12 attention heads)
        └── saved_models/
            └── checkpoint-best-f1/
                └── 12heads_linevul_model.bin  # Fine-tuned model weights (997 MB)
```

---

## 🚀 How to Run

### Method 1: Using the Launcher Script
Double-click [`run.bat`](file:///c:/Users/MUNEEB/Downloads/Archive/linevul/run.bat) or execute:
```powershell
.\run.ps1
```
The script will automatically detect the Python environment and launch the web server.

### Method 2: Manual Python Execution
```powershell
# Using the pre-installed LineVul venv
& "C:\Users\MUNEEB\Downloads\lineVul\venv\Scripts\python.exe" app.py
```
Access the application in your browser at:
**[http://localhost:5000](http://localhost:5000)**

---

## ⚡ Features

1. **Line-Level Vulnerability Attribution**:
   - Computes multi-head attention scores per token and aggregates them per code line.
   - Highlights suspected vulnerable lines directly in the code visualizer with normalized heatmaps (red glowing overlays).
2. **File Upload & Direct Pasting**:
   - Paste C/C++ function code directly into the editor.
   - Drag-and-drop or upload `.c`, `.cpp`, `.h` files.
3. **Verdict & Confidence Gauge**:
   - Instant `VULNERABLE` or `SECURE` verdict with exact risk percentage.
4. **Report Export**:
   - Download the full inspection report as a JSON file including line numbers, codes, attention scores, and normalized metrics.

---

## 🔌 API Reference

### Health Check
- **Endpoint**: `GET /health`
- **Response**:
```json
{
  "status": "ok",
  "service": "linevul",
  "model_loaded": true,
  "device": "cpu"
}
```

### Predict / Analyze
- **Endpoint**: `POST /predict` (also aliased as `POST /analyze`)
- **Headers**: `Content-Type: application/json` or `multipart/form-data`
- **Request (JSON)**:
```json
{
  "code": "void vuln(char *src) { char buf[16]; strcpy(buf, src); }"
}
```
- **Response**:
```json
{
  "filename": "snippet.c",
  "vulnerable": true,
  "verdict": "VULNERABLE",
  "probability": 0.9993,
  "total_lines": 4,
  "vulnerable_lines_count": 2,
  "lines": [
    {
      "line_no": 1,
      "code": "void vuln(char *src) {",
      "attention_score": 0.0824,
      "normalized_score": 0.7033
    },
    {
      "line_no": 3,
      "code": "    strcpy(buf, src);",
      "attention_score": 0.1171,
      "normalized_score": 1.0
    }
  ]
}
```
