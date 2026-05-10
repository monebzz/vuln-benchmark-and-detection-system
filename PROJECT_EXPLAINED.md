# VulnScan — Complete Project Documentation
### Final Year Project Evaluator Guide

---

## 1. PROJECT OVERVIEW

### What Is This Project?
VulnScan is an AI-powered static analysis tool that detects security vulnerabilities in C and C++ source code. A developer uploads a `.c`, `.cpp`, or `.h` file through a web browser. The system automatically extracts every function from the file, runs each function through a fine-tuned AI model (CodeBERT), and returns a per-function report classifying each as **VULNERABLE** or **SAFE** with a confidence score.

### What Problem Does It Solve?
Writing secure C/C++ code is notoriously difficult. Bugs like buffer overflows, memory leaks, and null pointer dereferences are invisible to the naked eye but can be exploited by attackers. Traditional tools either require expensive commercial licenses or produce so many false alarms they become useless. VulnScan uses a transformer-based AI model trained on real-world vulnerability data to give accurate, function-level predictions instantly.

### Input and Output
- **Input:** A single `.c`, `.cpp`, or `.h` source file (up to 200 MB)
- **Output:** A JSON report listing every function with its classification (VULNERABLE/SAFE), confidence score (0–100%), line numbers, and optional CWE vulnerability type label

### What Makes This an AI/ML Project?
The core classification engine is **CodeBERT**, a transformer neural network (same family as BERT/GPT) fine-tuned on the Devign dataset — a dataset of real C/C++ functions labeled as vulnerable or safe. The model was pre-trained by Microsoft on millions of lines of code across 6 programming languages, giving it deep understanding of code semantics, not just syntax.

### Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend UI | React 19 + Vite 8 | Single-page web application |
| Styling | Tailwind CSS v4 + CSS Variables | Dark-mode design system |
| Animations | Framer Motion | Smooth transitions and loading states |
| HTTP Client | Axios | API calls from browser to backend |
| Backend API | FastAPI (Python) | REST API server, orchestration |
| ML Framework | PyTorch + HuggingFace Transformers | Model inference |
| AI Model | CodeBERT (fine-tuned) | Vulnerability classification |
| Code Analysis | Joern (via subprocess) | Function extraction / CPG generation |
| Joern Script | Scala (`.sc` file) | Query language for Joern |
| Runtime | Python 3.x + Node.js | Backend and frontend runtimes |

---

## 2. SYSTEM ARCHITECTURE DIAGRAM

```
  ┌─────────────────────────────────────────────────────────┐
  │                    USER'S BROWSER                       │
  │  Visits http://localhost:5173                           │
  │  Drags & drops a .c / .cpp / .h file                   │
  │  Clicks "Analyze File"                                  │
  └─────────────────┬───────────────────────────────────────┘
                    │
                    │  HTTP POST /analyze
                    │  Content-Type: multipart/form-data
                    │  Body: { file: <binary file data> }
                    │  Timeout: 5 minutes
                    ▼
  ┌─────────────────────────────────────────────────────────┐
  │              FASTAPI BACKEND  (port 8001)               │
  │  api.py  →  POST /analyze handler                       │
  │  1. Validates file extension (.c / .cpp / .h)           │
  │  2. Saves file to ./uploads/<filename>                  │
  │  3. Rewrites extract.sc with the correct file path      │
  │  4. Clears old ./workspace/ directory                   │
  └─────────────────┬───────────────────────────────────────┘
                    │
                    │  subprocess.call("run.bat")
                    │  Passes: path to uploaded .c file
                    │  Via: extract.sc Scala script
                    ▼
  ┌─────────────────────────────────────────────────────────┐
  │                  JOERN ENGINE                           │
  │  (Java-based, runs as a separate process)               │
  │  1. Parses the C/C++ file                               │
  │  2. Builds a Code Property Graph (CPG)                  │
  │     CPG = AST + CFG + PDG merged into one graph         │
  │  3. Queries all methods (functions) from the CPG        │
  │  4. Exports: name, code, filename, lineNumber, lineEnd  │
  │  5. Writes output to functions.json                     │
  └─────────────────┬───────────────────────────────────────┘
                    │
                    │  functions.json written to disk
                    │  Format: [{name, code, filename,
                    │            lineNumber, lineNumberEnd}]
                    ▼
  ┌─────────────────────────────────────────────────────────┐
  │         FASTAPI — FUNCTION FILTERING                    │
  │  Reads functions.json                                   │
  │  Skips: <global>, <module>, main, <init>               │
  │  Skips: functions with < 20 characters of code         │
  │  Remaining functions are passed to CodeBERT             │
  └─────────────────┬───────────────────────────────────────┘
                    │
                    │  List of function bodies (raw code strings)
                    ▼
  ┌─────────────────────────────────────────────────────────┐
  │              CODEBERT MODEL (PyTorch)                   │
  │  Model: mahdin70/codebert-devign-vulnerability-detector │
  │  Base:  microsoft/codebert-base                         │
  │  For each function:                                     │
  │  1. Strip comments, normalize whitespace                │
  │  2. Tokenize → token IDs (max 512 tokens)              │
  │  3. Forward pass through 12-layer transformer           │
  │  4. Output: logits [safe_score, vuln_score]             │
  │  5. Softmax → probabilities                             │
  │  6. argmax → 0=SAFE, 1=VULNERABLE                       │
  └─────────────────┬───────────────────────────────────────┘
                    │
                    │  JSON response (HTTP 200)
                    ▼
  ┌─────────────────────────────────────────────────────────┐
  │         FASTAPI — RESPONSE ASSEMBLY                     │
  │  Returns: { filename, total_functions, vulnerable_count │
  │             safe_count, scanned_at, results: [...] }    │
  └─────────────────┬───────────────────────────────────────┘
                    │
                    │  HTTP 200 JSON response
                    ▼
  ┌─────────────────────────────────────────────────────────┐
  │              REACT FRONTEND                             │
  │  useAnalyze.js hook receives response                   │
  │  setResults(data) → triggers re-render                  │
  │  Shows: Summary cards, Risk bar, Filter tabs,           │
  │         FunctionCard list, Download JSON button         │
  └─────────────────────────────────────────────────────────┘
```

---

## 3. FILE-BY-FILE BREAKDOWN

### Backend Files

---

**FILE: `api.py`**
**PURPOSE:** The main FastAPI backend server — the brain of the entire backend operation.
**CONTAINS:**
- `GET /health` — simple health check endpoint
- `POST /analyze` — the only real endpoint; receives an uploaded file, runs Joern, runs CodeBERT, returns results
- `get_model()` — lazy singleton that loads CodeBERT once on first request and reuses it
- `normalize_code(code)` — strips comments and extra whitespace before feeding to the model
- `predict(code, tokenizer, model)` — tokenizes one function and runs one forward pass; returns `(0 or 1, confidence float)`
- `update_extract_sc(path)` — rewrites `extract.sc` with the correct absolute path to the uploaded file
- `run_joern()` — calls `run.bat` via `subprocess.call()`, clears old workspace first, checks if `functions.json` was produced
**CONNECTS TO:** `run.bat`, `extract.sc`, `functions.json`, HuggingFace model hub

---

**FILE: `app.py`**
**PURPOSE:** An alternative Streamlit-based UI (not used in production; the React frontend is used instead).
**NOTE:** This was likely the original prototype before the React frontend was built. It does exactly the same thing as `api.py` + the React UI, but in a single Python file using Streamlit widgets.
**STATUS:** Unused in the current architecture but preserved in the repo.

---

**FILE: `run.bat`**
**PURPOSE:** Windows batch script that configures Java and launches the Joern CLI.
**CONTENTS:**
```bat
@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
echo Running Joern...
call "%~dp0joern\joern-cli\joern.bat" --script "%~dp0extract.sc"
echo Joern done.
```
**WHY NEEDED:** Joern is a Java application. It requires Java 17 to be set correctly. This script sets the `JAVA_HOME` environment variable, then calls Joern with the `extract.sc` Scala script.

---

**FILE: `extract.sc`**
**PURPOSE:** A Joern Scala query script that tells Joern what to do with the uploaded C file.
**CONTENTS (at runtime, after `update_extract_sc()` rewrites it):**
```scala
importCode("/path/to/uploads/yourfile.c")

cpg.method.filter(_.filename != "<empty>").map(m => Map(
  "name"          -> m.name,
  "code"          -> m.code,
  "filename"      -> m.filename,
  "lineNumber"    -> m.lineNumber.getOrElse(-1),
  "lineNumberEnd" -> m.lineNumberEnd.getOrElse(-1)
)).toJson #> "/path/to/functions.json"

exit
```
**WHAT IT DOES:** `importCode()` tells Joern to parse the file and build a CPG. Then it queries every method (function) from that CPG, extracts 5 fields per function, serializes to JSON, and writes it to disk.

---

**FILE: `functions.json`**
**PURPOSE:** The intermediate data file produced by Joern and consumed by the FastAPI backend.
**FORMAT:**
```json
[
  {
    "name": "strcpy_wrapper",
    "code": "void strcpy_wrapper(char *dst, char *src) { strcpy(dst, src); }",
    "filename": "/path/to/uploads/test.c",
    "lineNumber": 12,
    "lineNumberEnd": 14
  }
]
```

---

### Frontend Files

---

**FILE: `frontend/index.html`**
**PURPOSE:** The single HTML page the browser loads. It imports the Poppins font from Google Fonts, sets the page title ("VulnScan — C/C++ Vulnerability Detector"), and provides the `<div id="root">` that React mounts into.

---

**FILE: `frontend/src/main.jsx`**
**PURPOSE:** React application entry point. Calls `createRoot(document.getElementById('root')).render(<App />)`. Wraps app in `<StrictMode>` for development warnings.

---

**FILE: `frontend/src/App.jsx`**
**PURPOSE:** The root React component — owns all top-level state and composes every other component.
**STATE IT OWNS:**
- `file` — the File object selected by the user (or null)
- `activeFilter` — one of `'all'`, `'vulnerable'`, `'safe'`
- `isDownloaded` — boolean for the download button's "Downloaded ✓" flash
- `loading`, `error`, `results` — from `useAnalyze` hook
**KEY LOGIC:**
- `handleAnalyze(f)` — resets state, calls `analyze(f)` from the hook
- `handleNewScan()` — resets everything, scrolls back to top
- `handleDownload()` — calls `downloadResultsJSON`, flashes success state
- `filtered` — computed array; filters `results.results` based on `activeFilter`
- `counts` — `{ all, vulnerable, safe }` object passed to FilterTabs
- `RiskBar` — inline sub-component that renders the animated red/green risk bar
- `formatDate(iso)` — formats the ISO timestamp from the API into a human-readable string

---

**FILE: `frontend/src/hooks/useAnalyze.js`**
**PURPOSE:** Custom React hook that encapsulates all API communication logic.
**API URL:** `http://localhost:8001/analyze`
**STATE:** `loading` (bool), `error` (string|null), `results` (object|null)
**FUNCTIONS:**
- `analyze(file)` — builds a `FormData`, POSTs it to the API via Axios with a 5-minute timeout, stores response in `results`
- `reset()` — clears all state back to initial values
**ERROR HANDLING:** Extracts `err.response.data.detail` (FastAPI format) or falls back to `err.message`

---

**FILE: `frontend/src/components/UploadCard.jsx`**
**PURPOSE:** The file upload card with drag-and-drop zone and the "Analyze File" button.
**RECEIVES PROPS:** `file`, `setFile`, `onAnalyze`, `loading`
**BEHAVIOR:**
- Uses `react-dropzone` to handle drag-and-drop and file browse
- Accepts only `.c`, `.cpp`, `.h` files; max size 200 MB
- When a file is selected: shows a "file chip" with name and size, and enables the Analyze button
- Clicking "Analyze File" calls `onAnalyze(file)` → triggers `handleAnalyze` in App.jsx
- While `loading=true`: dropzone is disabled, button shows spinner and "Analyzing…"

---

**FILE: `frontend/src/components/FunctionCard.jsx`**
**PURPOSE:** Renders a single function's analysis result as a styled card.
**RECEIVES PROPS:** `result` (one item from `results.results`), `index` (for staggered animation delay)
**DISPLAYS:**
- Function name (monospace font)
- Line range (e.g. "Lines 12 – 27")
- Confidence percentage (e.g. "94.3% conf.")
- Status badge: "⚠ VULNERABLE" (red) or "✓ SAFE" (green)
- If vulnerable AND a CWE type is present: amber CWE badge (e.g. "⚡ CWE-120 · Buffer Overflow")
**CWE NAMES MAP:** Contains 10 CWE types hardcoded: CWE-20, CWE-119, CWE-120, CWE-122, CWE-125, CWE-190, CWE-401, CWE-416, CWE-476, CWE-787

---

**FILE: `frontend/src/components/FilterTabs.jsx`**
**PURPOSE:** Three-tab filter bar (All / Vulnerable / Safe) with animated sliding indicator.
**RECEIVES PROPS:** `activeFilter`, `setActiveFilter`, `counts` (`{all, vulnerable, safe}`)
**BEHAVIOR:** Clicking a tab calls `setActiveFilter(key)`, which updates state in App.jsx. App.jsx then recomputes the `filtered` array. Uses Framer Motion `layoutId="activeTab"` for the smooth sliding background animation.

---

**FILE: `frontend/src/components/ResultsSummary.jsx`**
**PURPOSE:** Three summary stat cards shown after a scan: Functions Analyzed, Vulnerabilities Found, Clean Functions.
**RECEIVES PROPS:** `data` (the full API response object)
**FEATURES:** Uses a custom `useCountUp(target)` hook that animates numbers counting up from 0 to their final value over 1.2 seconds. Each card has a colored top border and subtle glow wash.

---

**FILE: `frontend/src/components/Loader.jsx`**
**PURPOSE:** Loading state shown while the API call is in progress (Joern + CodeBERT can take 30–120 seconds).
**DISPLAYS:**
- A top progress bar that sweeps left-to-right repeatedly (CSS animation)
- A centered card with a spinning CPU icon
- Three step indicators that light up sequentially every 2.5 seconds:
  1. "Extracting functions with Joern"
  2. "Tokenizing with CodeBERT"
  3. "Classifying vulnerabilities"

---

**FILE: `frontend/src/components/Navbar.jsx`**
**PURPOSE:** Fixed top navigation bar. Shows "VulnScan" brand name with shield icon on the left, and a "CodeBERT + Joern" pill badge on the right. Uses glassmorphism (backdrop-blur) styling.

---

**FILE: `frontend/src/components/HeroSection.jsx`**
**PURPOSE:** The large hero text section shown above the upload card. Displays the main headline "Detect Vulnerabilities in C/C++ Code" and a subtitle explaining the technology pipeline.

---

**FILE: `frontend/src/components/ErrorToast.jsx`**
**PURPOSE:** A slide-in error notification shown in the bottom-right corner when the API call fails.
**RECEIVES PROPS:** `message` (string), `onDismiss` (function)
**BEHAVIOR:** Auto-dismisses after 5 seconds with an animated countdown progress bar at the bottom of the toast.

---

**FILE: `frontend/src/utils/downloadJSON.js`**
**PURPOSE:** Utility function `downloadResultsJSON(data)` that builds a formatted JSON report and triggers a browser file download.
**OUTPUT FILE NAME FORMAT:** `vulnscan_<filename>_<timestamp>.json`
**REPORT STRUCTURE:**
```json
{
  "report": {
    "generated_by": "VulnScan — CodeBERT + Joern",
    "filename": "...",
    "scanned_at": "...",
    "summary": { "total_functions", "vulnerable_count", "safe_count", "vulnerability_rate" },
    "functions": [{ "name", "lines", "classification", "confidence", "vulnerability_type" }]
  }
}
```

---

**FILE: `frontend/src/index.css`**
**PURPOSE:** Global stylesheet and design token definitions.
**CONTAINS:** CSS custom properties (variables) for the entire color palette (`--cyan`, `--red`, `--green`, `--bg-base`, etc.), global reset, scrollbar styles, and 5 keyframe animations (`float1`, `float2`, `blink-dot`, `progress-sweep`, `spin-slow`).

---

### Config Files

| File | Purpose |
|---|---|
| `frontend/vite.config.js` | Vite bundler config; enables React and Tailwind CSS plugins |
| `frontend/package.json` | Lists all npm dependencies; defines `dev`, `build`, `lint` scripts |
| `frontend/index.html` | HTML shell; loads Google Fonts (Poppins), mounts React root |

---

## 4. COMPLETE REQUEST LIFECYCLE

**Step 1 — User selects a file**
- User drags a `.cpp` file onto the dropzone in `UploadCard.jsx`
- `react-dropzone`'s `onDrop` callback fires, calling `setFile(accepted[0])`
- `handleSetFile` in App.jsx updates the `file` state
- The file chip appears (filename + size), the Analyze button becomes enabled

**Step 2 — User clicks "Analyze File"**
- `onClick` in the button calls `onAnalyze(file)` → `handleAnalyze(f)` in App.jsx
- `handleAnalyze` calls `reset()` (clears old results/error), then calls `analyze(f)` from `useAnalyze`

**Step 3 — useAnalyze.js makes the API call**
- `analyze(file)` sets `loading = true`, `error = null`, `results = null`
- Creates a `FormData` object, appends the file: `formData.append('file', file)`
- Calls `axios.post('http://localhost:8001/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 })`
- Back in App.jsx: `loading=true` → `<Loader />` component renders

**Step 4 — FastAPI receives the request**
- Route: `POST /analyze` in `api.py`
- Validates file extension; rejects anything not in `('.c', '.cpp', '.h', '.cc', '.cxx', '.hpp')`
- Saves binary content to `./uploads/<filename>` on disk
- Calls `update_extract_sc(save_path)` — rewrites `extract.sc` with correct absolute path
- Calls `run_joern()` — deletes old `functions.json`, clears `./workspace/`, then calls `subprocess.call("run.bat", shell=True, cwd=BASE_DIR)`

**Step 5 — Joern runs**
- `run.bat` sets JAVA_HOME, then calls `joern\joern-cli\joern.bat --script extract.sc`
- Joern reads `extract.sc`, calls `importCode(...)` which parses the C file and builds a CPG
- Queries all methods, extracts name/code/filename/lineNumber/lineNumberEnd
- Writes the JSON array to `functions.json`
- Process exits; `run_joern()` returns `True` if `functions.json` now exists

**Step 6 — Functions are filtered**
- Backend reads `functions.json` and parses the JSON array
- Skips any function whose name is in `{"<global>", "<module>", "main", "<init>"}`
- Skips any function whose code body is under 20 characters (too small to analyze)
- Remaining functions are analyzed one by one

**Step 7 — CodeBERT classifies each function**
- `get_model()` is called (loads model on first request, cached in memory afterward)
  - Tokenizer: `microsoft/codebert-base`
  - Model weights: `mahdin70/codebert-devign-code-vulnerability-detector` (from HuggingFace Hub)
- For each function:
  1. `normalize_code(code)` strips `//` and `/* */` comments, collapses whitespace
  2. `tokenizer(code, return_tensors='pt', truncation=True, padding='max_length', max_length=512)` — produces input_ids and attention_mask tensors
  3. `model(**inputs)` — forward pass through the 12-layer transformer
  4. `outputs.logits` — raw scores, shape `[1, 2]` (2 classes: safe=0, vulnerable=1)
  5. `softmax(logits)` — converts to probabilities summing to 1.0
  6. `argmax` — picks class with highest probability
  7. `confidence = probs[0][pred].item()` — probability of the winning class (0.0 to 1.0)

**Step 8 — Response is assembled and returned**
```json
{
  "filename": "example.c",
  "total_functions": 8,
  "vulnerable_count": 3,
  "safe_count": 5,
  "scanned_at": "2025-05-08T17:58:00.123456+00:00",
  "results": [
    {
      "function_name": "strcpy_wrapper",
      "start_line": 12,
      "end_line": 15,
      "label": "VULNERABLE",
      "confidence": 0.9431,
      "vulnerability_type": null
    }
  ]
}
```

**Step 9 — Frontend displays results**
- Axios receives the JSON; `setResults(data)` is called; `setLoading(false)`
- `<Loader />` unmounts; `<motion.section>` with results animates in (opacity 0→1, y 40→0)
- `useEffect` triggers smooth scroll to the results section
- `ResultsSummary` renders 3 cards with count-up animations
- `RiskBar` renders the red/green proportional bar
- `FilterTabs` renders with counts for all/vulnerable/safe
- `filtered` array is computed and mapped to `<FunctionCard>` components (staggered entry animations)
- "Download JSON" button is enabled

**Step 10 — User downloads report**
- Clicking "Download JSON" calls `handleDownload()` in App.jsx
- `downloadResultsJSON(results)` builds the payload, creates a Blob, triggers `<a>` click
- File downloads as `vulnscan_<name>_<timestamp>.json`
- Button flashes green "Downloaded ✓" for 2.5 seconds

---

## 5. THE AI/ML PIPELINE EXPLAINED

### 5a. What is CodeBERT?

**CodeBERT** is a transformer-based neural network developed by **Microsoft Research** and released in 2020. It belongs to the same family as BERT and GPT — models that learn language by reading enormous amounts of text.

- **Architecture:** 12-layer transformer encoder, 125 million parameters (identical to RoBERTa-base)
- **Pre-training data:** 6.4 million code-comment pairs across 6 languages: Python, Java, JavaScript, PHP, Ruby, and Go — plus natural language documentation
- **Pre-training tasks:** Masked Language Modeling (predict hidden tokens) and Replaced Token Detection
- **Result:** After pre-training, CodeBERT "understands" code the way BERT understands English sentences

**Fine-tuning for this project:**
The HuggingFace model `mahdin70/codebert-devign-code-vulnerability-detector` is CodeBERT with an added classification head (a linear layer on top) that was fine-tuned on the **Devign dataset**.

- **Devign dataset:** ~27,000 C/C++ functions collected from 4 large open-source projects (FFmpeg, QEMU, Linux kernel, LibPNG), each manually labeled as VULNERABLE or SAFE by security researchers
- **Fine-tuning:** The model learned to distinguish vulnerable patterns by adjusting its 125M weights on these labeled examples
- **Input to model:** Token ID integers (not raw text). The tokenizer converts the code string into a sequence of up to 512 integer IDs.
- **Output from model:** Two raw scores (logits) — one for SAFE, one for VULNERABLE
- **Decision:** Softmax converts logits to probabilities. `argmax` picks the higher one. If class 1 (VULNERABLE) wins, the function is flagged.

### 5b. What is Joern?

**Joern** is an open-source code analysis platform built at ShiftLeft. It parses C/C++ source code and builds a **Code Property Graph (CPG)**.

**What is a CPG?**
A Code Property Graph merges three classic program analysis graphs into one unified structure:
- **AST (Abstract Syntax Tree):** Represents the grammatical structure of the code
- **CFG (Control Flow Graph):** Shows the order in which statements execute (if/else branches, loops)
- **PDG (Program Dependence Graph):** Shows which variables depend on which other variables

By combining all three, Joern can answer questions like: "Give me all functions in this file" with full metadata (name, body, line numbers).

**Why not just feed the whole file to CodeBERT?**
- CodeBERT has a hard limit of **512 tokens** (roughly 300–400 words of code)
- A real C file might have 5,000+ lines across 50+ functions
- Feeding the whole file would truncate it, losing most of the code
- More importantly, we need **per-function results** — developers need to know *which function* is vulnerable, not just that *the file* is vulnerable
- Joern cleanly isolates each function body, enabling function-level analysis

**How Joern is called (actual code from `api.py`):**
```python
def update_extract_sc(c_file_path: str):
    script = f"""importCode("{c_file_path.replace(chr(92), '/')}")
cpg.method.filter(_.filename != "<empty>").map(m => Map(
  "name"          -> m.name,
  "code"          -> m.code,
  "filename"      -> m.filename,
  "lineNumber"    -> m.lineNumber.getOrElse(-1),
  "lineNumberEnd" -> m.lineNumberEnd.getOrElse(-1)
)).toJson #> "{FUNCTIONS_JSON.replace(chr(92), '/')}"
exit
"""
    with open(EXTRACT_SC, "w") as f:
        f.write(script)

def run_joern():
    if os.path.exists(FUNCTIONS_JSON):
        os.remove(FUNCTIONS_JSON)
    if os.path.exists(WORKSPACE_DIR):
        shutil.rmtree(WORKSPACE_DIR, ignore_errors=True)
    subprocess.call(RUN_BAT, shell=True, cwd=BASE_DIR)
    return os.path.exists(FUNCTIONS_JSON)
```

### 5c. Why CodeBERT + Joern Together?

| Component | Contribution | What breaks without it |
|---|---|---|
| **Joern** | Parses C/C++ syntax, extracts individual functions with line numbers | Without Joern: can't split the file into functions; would have to feed the whole file (too long, no per-function results) |
| **CodeBERT** | AI classification of each function as SAFE or VULNERABLE | Without CodeBERT: would need hand-written rules (misses novel patterns, high false-positive rate) |

---

## 6. VULNERABILITY TYPES DETECTED

The model was trained on Devign data which covers general C/C++ vulnerability patterns. The frontend hardcodes 10 CWE categories in `FunctionCard.jsx` for display purposes:

| CWE ID | Full Name | Real-World Example |
|---|---|---|
| CWE-20 | Improper Input Validation | Accepting negative array index without checking |
| CWE-119 | Improper Restriction of Operations within Buffer Bounds | Generic buffer boundary error |
| CWE-120 | Buffer Copy Without Checking Size | `strcpy(dst, src)` with no length check |
| CWE-122 | Heap-based Buffer Overflow | Writing past the end of a `malloc`'d block |
| CWE-125 | Out-of-bounds Read | Reading `arr[i]` where `i` may exceed array size |
| CWE-190 | Integer Overflow or Wraparound | `int x = INT_MAX + 1` wraps to negative |
| CWE-401 | Missing Release of Memory after Effective Lifetime | `malloc()` without matching `free()` |
| CWE-416 | Use After Free | Accessing memory after `free(ptr)` |
| CWE-476 | NULL Pointer Dereference | Dereferencing a pointer without null check |
| CWE-787 | Out-of-bounds Write | Writing past buffer end, corrupting adjacent memory |

> **Note:** The current model returns `vulnerability_type: null` for all results (the field is reserved for future CWE classification enhancement). The CWE badge in `FunctionCard.jsx` only renders when the API returns a non-null `vulnerability_type`.

---

## 7. DATA FLOW DIAGRAM

```
RAW .cpp FILE  (e.g. 500 lines, 20 functions)
        |
        |  Joern reads file, builds CPG
        ↓
FUNCTION LIST (functions.json):
  [
    { name: "parse_input",  code: "void parse_input(...){...}", lineNumber: 12, lineNumberEnd: 28 },
    { name: "copy_buffer",  code: "void copy_buffer(...){...}", lineNumber: 30, lineNumberEnd: 45 },
    ...18 more...
  ]
        |
        |  FastAPI filters out <global>, main, tiny functions
        ↓
FILTERED LIST: 17 functions remain
        |
        |  For each function: normalize_code() strips comments/whitespace
        ↓
CLEAN CODE STRINGS:
  "void parse_input(char *buf, int len) { if (len > MAX) ... }"
        |
        |  tokenizer(code, truncation=True, max_length=512)
        ↓
TOKEN IDS (PyTorch tensor):
  [[0, 6581, 31892, 1640, 1, 4, 479, 43, 2, ...]]
  shape: [1, 512]
        |
        |  model(input_ids, attention_mask) — forward pass
        ↓
LOGITS (raw output):
  tensor([[ 2.31, -1.08]])   ← SAFE wins
  tensor([[-0.74,  3.22]])   ← VULNERABLE wins
        |
        |  softmax(logits, dim=-1)
        ↓
PROBABILITIES:
  tensor([[0.9318, 0.0682]])  ← 93.2% SAFE
  tensor([[0.0241, 0.9759]])  ← 97.6% VULNERABLE
        |
        |  argmax → class index; probs[0][pred] → confidence
        ↓
PER-FUNCTION RESULT:
  { function_name: "copy_buffer", label: "VULNERABLE",
    confidence: 0.9759, start_line: 30, end_line: 45 }
        |
        |  Collect all results, count totals
        ↓
FINAL JSON RESPONSE:
  {
    filename, total_functions, vulnerable_count,
    safe_count, scanned_at,
    results: [ ...per-function objects... ]
  }
        |
        |  HTTP 200 to browser
        ↓
REACT UI renders FunctionCard for each result
```

---

## 8. API DOCUMENTATION

### POST /analyze

| Property | Value |
|---|---|
| URL | `http://localhost:8001/analyze` |
| Method | `POST` |
| Content-Type | `multipart/form-data` |
| Request body | `file`: binary file data (field name must be exactly `file`) |
| Timeout | 5 minutes (300,000 ms) |
| Accepted extensions | `.c`, `.cpp`, `.h`, `.cc`, `.cxx`, `.hpp` |

**Success Response (HTTP 200):**
```json
{
  "filename": "string — original uploaded filename",
  "total_functions": "integer — number of functions analyzed",
  "vulnerable_count": "integer — number classified VULNERABLE",
  "safe_count": "integer — number classified SAFE",
  "scanned_at": "ISO 8601 UTC timestamp string",
  "results": [
    {
      "function_name": "string — function identifier",
      "start_line": "integer — first line of function in source file",
      "end_line": "integer — last line of function in source file",
      "label": "VULNERABLE or SAFE",
      "confidence": "float 0.0–1.0 (multiply by 100 for %)",
      "vulnerability_type": "null (reserved for future CWE labeling)"
    }
  ]
}
```

**Error Responses:**

| HTTP Code | Condition | `detail` message |
|---|---|---|
| 400 | Unsupported file type | `"Unsupported file type: .xyz. Please upload a .c, .cpp, or .h file."` |
| 500 | Joern failed (bad file or misconfigured) | `"Joern failed to extract functions..."` |
| 500 | functions.json malformed | `"Failed to parse extracted functions: ..."` |

**Typical Processing Time:** 30–120 seconds (dominated by Joern startup ~20s + CodeBERT inference ~1–3s per function)

---

### GET /health

| Property | Value |
|---|---|
| URL | `http://localhost:8001/health` |
| Method | `GET` |
| Response | `{ "status": "ok" }` |

---

## 9. FRONTEND STATE MANAGEMENT

### State Ownership

| State Variable | Type | Owner | Purpose |
|---|---|---|---|
| `file` | `File \| null` | App.jsx | The selected file object |
| `activeFilter` | `'all'\|'vulnerable'\|'safe'` | App.jsx | Which tab is active |
| `isDownloaded` | `boolean` | App.jsx | Download button flash state |
| `loading` | `boolean` | useAnalyze.js | API call in progress |
| `error` | `string \| null` | useAnalyze.js | Error message to display |
| `results` | `object \| null` | useAnalyze.js | Full API response |
| `hovering` | `boolean` | UploadCard.jsx | Local hover state for card border |
| `activeStep` | `0\|1\|2` | Loader.jsx | Which loading step is highlighted |
| `progress` | `number` | ErrorToast.jsx | Toast countdown progress bar |
| `count` | `number` | ResultsSummary (useCountUp) | Animated counter value |

### Component Tree

```
App  (owns: file, activeFilter, isDownloaded, loading, error, results)
├── <div> Background glow orbs (decorative, no state)
├── Navbar  (no props, no state)
├── HeroSection  (no props, no state)
├── UploadCard
│   ├── props: file, setFile, onAnalyze, loading
│   └── local state: hovering
├── Loader  (renders when loading=true)
│   └── local state: activeStep
├── AnimatePresence
│   └── <motion.section>  (renders when results && !loading)
│       ├── Section header (filename, scanned_at, buttons)
│       ├── ResultsSummary
│       │   ├── props: data (full results object)
│       │   └── 3× StatCard, each with useCountUp hook
│       ├── RiskBar  (inline component in App.jsx)
│       │   └── props: vulnerable, safe, total
│       ├── FilterTabs
│       │   └── props: activeFilter, setActiveFilter, counts
│       └── FunctionCard[]  (one per filtered result)
│           └── props: result, index
└── ErrorToast
    ├── props: message, onDismiss
    └── local state: progress
```

### State Flow Summary
1. User picks file → `setFile` → App re-renders → button enabled
2. User clicks Analyze → `handleAnalyze` → `useAnalyze.analyze()` → `loading=true` → `<Loader>` mounts
3. API responds → `results` set, `loading=false` → `<Loader>` unmounts, results section mounts
4. User clicks filter tab → `setActiveFilter` → App recomputes `filtered` → `FunctionCard` list re-renders
5. User clicks New Scan → `handleNewScan` → all state resets → scroll to top

---

## 10. HOW TO RUN THE PROJECT

### Prerequisites
- Python 3.9+ with pip
- Node.js 18+ with npm
- Java 17 (Eclipse Adoptium / Temurin recommended)
- Joern bundled in `./joern/joern-cli/` directory
- Internet access for first run (downloads CodeBERT ~500 MB from HuggingFace)

### Backend Setup
```bash
# 1. Navigate to project root
cd vuln-detection

# 2. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# 3. Install Python dependencies
pip install fastapi uvicorn torch transformers python-dotenv python-multipart

# 4. Start the FastAPI server
uvicorn api:app --host 0.0.0.0 --port 8001 --reload
```
The server starts at `http://localhost:8001`. On first `/analyze` request, CodeBERT (~500 MB) downloads from HuggingFace and is cached locally.

### Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start the Vite dev server
npm run dev
```
Frontend runs at `http://localhost:5173`.

### Joern Setup
Joern is **bundled** inside `./joern/joern-cli/`. It is NOT installed system-wide. `run.bat` calls it directly using a relative path. Java 17 must be installed at `C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot` (or update the path in `run.bat`).

---

## 11. LIKELY EVALUATOR QUESTIONS AND ANSWERS

**Q1: Why CodeBERT instead of GPT-4 or another LLM?**
A: CodeBERT is purpose-built for code understanding, is open-source, runs locally (no API costs or data privacy concerns), and can be fine-tuned on labeled vulnerability data. GPT-4 is a generative model — it produces text, not binary classifications with calibrated confidence scores. CodeBERT's encoder architecture is better suited for classification tasks.

**Q2: What is the training dataset for the model?**
A: The Devign dataset (~27,000 C/C++ functions from FFmpeg, QEMU, Linux, LibPNG), each labeled VULNERABLE or SAFE by security researchers. The model used (`mahdin70/codebert-devign-code-vulnerability-detector`) was fine-tuned on this dataset.

**Q3: Why is Joern needed? Can't you just send the whole file?**
A: CodeBERT accepts at most 512 tokens (~300 words of code). A typical C file has thousands of lines. Joern splits the file into individual functions, enabling per-function analysis and precise line-number reporting. Without Joern, you'd lose most of the code due to truncation and wouldn't know *which* function is vulnerable.

**Q4: How does the system handle a function longer than 512 tokens?**
A: The tokenizer's `truncation=True` setting silently cuts the function to 512 tokens. The tail of a very long function is not analyzed. This is a known limitation — very long functions (200+ lines) may have their ending cut off.

**Q5: What is the difference between a false positive and false negative here?**
A: A **false positive** is when the model flags a SAFE function as VULNERABLE (alarming the developer unnecessarily). A **false negative** is when a VULNERABLE function is classified as SAFE (missing a real bug — more dangerous). The Devign-trained model has roughly 65–70% accuracy on held-out test data, meaning both types of errors occur.

**Q6: What is your model's accuracy?**
A: The `mahdin70/codebert-devign` model achieves approximately 65–70% accuracy on the Devign test set, which is consistent with reported results for CodeBERT on this benchmark. This is significantly better than random (50%) but not perfect. Real-world accuracy depends on how similar the new code is to the training data.

**Q7: Is this static analysis or dynamic analysis?**
A: This is **static analysis** — the code is never executed. It is analyzed purely from its text/structure. Dynamic analysis would require running the code with specific inputs to observe behavior at runtime.

**Q8: What languages does this support?**
A: Only C and C++ (`.c`, `.cpp`, `.h`, `.cc`, `.cxx`, `.hpp`). Joern can handle other languages but the CodeBERT model was fine-tuned exclusively on C/C++ vulnerability data, so other languages would produce unreliable results.

**Q9: How is the confidence score calculated?**
A: After the model produces two raw logit scores, `softmax` converts them to probabilities summing to 1.0. The confidence is the probability of the *winning* class. Example: logits `[-0.5, 2.1]` → softmax → `[0.077, 0.923]` → prediction: VULNERABLE, confidence: 92.3%.

**Q10: Can this system detect ALL vulnerability types?**
A: No. It detects vulnerability patterns that appear in the Devign training data (primarily memory safety bugs common in systems code). It will not detect logic errors, authentication bypasses, cryptographic weaknesses, or vulnerabilities that require understanding of program behavior across multiple functions (inter-procedural analysis).

**Q11: What happens if two users upload files simultaneously?**
A: The current implementation has a concurrency problem — `extract.sc` and `functions.json` are single shared files on disk. Two simultaneous requests would overwrite each other's data. This is a known limitation suitable for single-user/demo use only.

**Q12: How does the frontend know when analysis is done?**
A: The HTTP request itself is synchronous from the frontend's perspective (Axios awaits the response). FastAPI keeps the connection open while Joern runs and CodeBERT infers. When `api.py` has all results, it returns the JSON response and the connection closes. The 5-minute Axios timeout prevents the browser from giving up too early.

**Q13: Why is `main` excluded from analysis?**
A: `main()` is the program entry point and typically contains argument parsing and top-level orchestration logic. It rarely contains the kind of vulnerability patterns the model was trained on, and analyzing it often produces noisy/unreliable results. Joern also produces synthetic entries like `<global>` and `<module>` that are not real functions.

**Q14: How is the model loaded efficiently?**
A: The `get_model()` function uses a lazy singleton pattern — it checks if `_tokenizer` and `_model` are `None`. If so, it downloads/loads them and stores them in module-level global variables. Subsequent requests reuse the already-loaded model, avoiding the ~30-second reload penalty.

**Q15: What is tokenization?**
A: Tokenization converts a code string into a list of integer IDs that the model can process. For example, the word `void` might map to token ID `6581`. CodeBERT uses Byte-Pair Encoding (BPE) — the same technique used by GPT models. Unknown words are split into subword pieces (e.g., `strcpy` → `str` + `cpy`).

**Q16: Could this be deployed as a cloud service?**
A: Yes, but with significant engineering work needed: replace the single-file `functions.json` approach with per-request temp directories, add a task queue (Celery/Redis) for long-running jobs, containerize with Docker, and serve behind an HTTPS reverse proxy (Nginx). The current architecture is designed for local/demo use.

**Q17: What is the role of Framer Motion in the project?**
A: Framer Motion is a React animation library used throughout the frontend for: entry animations (cards fading in), the sliding FilterTabs indicator, the results section animate-in, and the ErrorToast slide-in/out. It improves perceived quality without affecting functionality.

**Q18: Why is `app.py` (Streamlit) still in the repo?**
A: It was the original proof-of-concept prototype built to validate the Joern + CodeBERT pipeline before the React frontend was developed. It is not used in production but serves as documentation of the early design.

**Q19: What is the purpose of normalizing code before inference?**
A: `normalize_code()` strips `//` and `/* */` comments and collapses multiple spaces/newlines into single spaces. This reduces noise in the input — the model should focus on code logic, not comment text. It also helps stay within the 512-token limit by removing non-code content.

**Q20: What are the ethical considerations of this system?**
A: (1) False negatives could give developers false confidence that code is safe. (2) False positives waste developer time investigating non-issues. (3) The system should be positioned as an assistive tool, not a definitive security audit. (4) All uploaded files are stored locally — in a cloud deployment, uploaded code (which may be proprietary) must be handled with appropriate privacy controls.

---

## 12. KNOWN LIMITATIONS

| Limitation | Detail |
|---|---|
| **Language support** | C and C++ only; no Python, Java, Rust, etc. |
| **File types** | No support for binary files, header-only libraries with no function bodies, or preprocessor-heavy code |
| **Function length** | Functions > 512 tokens are silently truncated; tail code not analyzed |
| **Inter-procedural** | Each function analyzed in isolation; vulnerabilities spanning multiple functions are invisible |
| **No CWE labels** | `vulnerability_type` is always `null`; CWE classification not yet implemented |
| **Single-user** | Shared `functions.json` file causes race conditions under concurrent use |
| **Windows-only** | `run.bat` is a Windows batch script; Linux/Mac would need a shell script equivalent |
| **Model accuracy** | ~65–70% accuracy; significant false positive and false negative rates |
| **Joern startup time** | Joern (JVM-based) takes ~15–30 seconds to start each time, making the tool slow for interactive use |
| **No CI/CD integration** | No CLI mode, no Git hooks, no IDE plugin — browser-only interface |
| **Large files** | Very large files (hundreds of functions) may cause long wait times (minutes) |

---

## 13. GLOSSARY

**AST (Abstract Syntax Tree)**
A tree representation of the grammatical structure of source code. Each node represents a language construct (function, loop, expression). Joern builds an AST as part of its CPG.

**CFG (Control Flow Graph)**
A graph showing all possible paths of execution through a function. Nodes are basic blocks of code; edges represent branches (if/else, loops).

**CodeBERT**
A transformer neural network pre-trained by Microsoft on 6 million code-comment pairs across 6 programming languages. Used in this project as the vulnerability classifier after fine-tuning on the Devign dataset.

**Confidence Score**
The probability assigned by the model to its winning prediction. A confidence of 0.95 means the model is 95% certain of its classification. Calculated via softmax on the output logits.

**CPG (Code Property Graph)**
A unified graph structure that combines AST, CFG, and PDG. Developed by the Joern team. Enables powerful queries about code structure, data flow, and control flow simultaneously.

**CWE (Common Weakness Enumeration)**
A community-maintained list of software weakness categories maintained by MITRE. Each CWE has an ID (e.g., CWE-120) and describes a class of vulnerability pattern. Used in this project as labels for the type of vulnerability detected.

**Devign Dataset**
A dataset of ~27,000 C/C++ functions collected from 4 open-source projects (FFmpeg, QEMU, Linux, LibPNG), each labeled as VULNERABLE or SAFE. Used to fine-tune the CodeBERT model for vulnerability detection.

**Dynamic Analysis**
Analyzing a program by actually running it with test inputs and observing behavior. Contrasted with static analysis. Can find runtime bugs but cannot cover all possible inputs.

**False Negative**
When the model classifies a VULNERABLE function as SAFE. The bug is missed. More dangerous than a false positive in security contexts.

**False Positive**
When the model classifies a SAFE function as VULNERABLE. The developer wastes time investigating a non-issue.

**FastAPI**
A modern Python web framework for building REST APIs. Uses Python type hints to auto-generate API documentation. Used as the backend server in this project.

**Fine-tuning**
Taking a pre-trained model (CodeBERT) and further training it on a smaller, task-specific dataset (Devign) to specialize its capabilities. The pre-trained weights give a strong starting point; fine-tuning adapts them to the target task.

**Framer Motion**
A React animation library that provides declarative animations, layout transitions, and gesture support. Used for all UI animations in the frontend.

**Joern**
An open-source code analysis platform that parses C/C++ (and other languages), builds a Code Property Graph, and provides a Scala-based query language to extract information from the graph.

**Logits**
The raw, unnormalized output scores from a neural network's final layer before any activation function is applied. In this project, shape `[1, 2]` — one score per class (SAFE, VULNERABLE).

**Multipart/form-data**
An HTTP content type used to upload files. The request body is divided into named "parts", each containing a field name and binary data. Used by the frontend to send the uploaded file to FastAPI.

**PDG (Program Dependence Graph)**
A graph that shows data and control dependencies between statements. Node A depends on node B if A uses a variable defined in B.

**Softmax**
A mathematical function that converts a vector of arbitrary real numbers (logits) into a probability distribution (values between 0 and 1 that sum to 1). `softmax([2.3, -1.1]) → [0.964, 0.036]`.

**Static Analysis**
Analyzing source code without executing it. Examines code structure, data flow, and patterns. This project performs static analysis — the uploaded file is never run.

**Tokenization**
The process of converting raw text (or code) into a sequence of integer IDs that a neural network can process. CodeBERT uses Byte-Pair Encoding (BPE) tokenization, which can represent any word as a sequence of subword pieces.

**Transformer**
A neural network architecture introduced in the 2017 paper "Attention Is All You Need". Uses a self-attention mechanism to process entire sequences in parallel, capturing long-range dependencies. CodeBERT, BERT, and GPT are all transformer models.

**Vite**
A modern JavaScript build tool and dev server. Extremely fast due to native ES modules and esbuild. Used to bundle and serve the React frontend.

---

*Document generated for VulnScan Final Year Project — covers all files, components, and architectural decisions as of the current codebase.*
