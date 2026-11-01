# Quickstart for Teammates

The platform runs in Docker. You do not need to install Python, Node.js, PyTorch, or PostgreSQL locally. The initial Docker build and database import can take several minutes.

---

### Prerequisites
- Install & open **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (make sure it says "Engine running").

---

### Step 1: Clone the repository and download the Drive files
1. **Clone the project:**
   ```bash
   git clone https://github.com/monebzz/vuln-benchmark-and-detection-system.git
   cd vuln-benchmark-and-detection-system
   ```
2. Download these three files from the Google Drive folder shared by the project owner. Keep the filenames unchanged and place them at these paths:
   - `cve_record.sql` → repository root: `./cve_record.sql`
   - `12heads_linevul_model.bin` → `./linevul/linevul/saved_models/checkpoint-best-f1/12heads_linevul_model.bin`
   - `cve_kb.json` → make two copies: `./backend/app/cve_kb.json` and `./linevul/cve_kb.json`

   The large dataset and model files are intentionally stored on Drive rather than GitHub.

---

### Step 2: Start All Services (1-Click)
- **Windows:** Double-click **`run_docker.bat`**
- **Mac/Linux:** Run `./run_docker.sh`

The first build may take several minutes. Wait until Docker reports the services are running before continuing.

---

### Step 3: Load Database & Open Web App
1. **Load the CVE database (1-click):**
   - **Windows:** Double-click **`import_dataset.bat`**
   - **Mac/Linux:** Run `./import_dataset.sh`
   The restore loads the 1.5 GB PostgreSQL custom-format dump and may take several minutes. PostgreSQL 17 is used to match the dump format. Keep the terminal open until the restore finishes.
2. **Open the platform in your browser:**
   - 🌐 **Web App:** [http://localhost:3000](http://localhost:3000)
   - 📄 **API Docs:** [http://localhost:8001/docs](http://localhost:8001/docs)

---

### 🛑 To Stop:
Run `docker compose down` in a terminal. Do not use `docker compose down -v` unless you intend to delete the imported database volume.

### LineVul model status
The LineVul service needs access to Hugging Face on first startup to retrieve the CodeBERT base model unless that model is already cached locally. If the LineVul page reports **Model unavailable**, check that Docker Desktop has outbound internet access to `huggingface.co`, then restart the service with `docker compose restart linevul`.
