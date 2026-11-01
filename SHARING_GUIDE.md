# 🤝 Final Year Project: Complete Sharing Guide (GitHub + Google Drive)

This guide provides the exact, foolproof workflow to share your FYP with your teammates using **GitHub** (for code and Docker setup) and **Google Drive** (for large dataset and model files).

---

## 💡 The Strategy: Why Split Between GitHub and Drive?

GitHub has a strict **100 MB per-file limit** and rejects commits containing files larger than 100 MB. 
Your project contains large AI model weights and a 1.47 GB database dump. By separating them cleanly:
- **GitHub holds:** All frontend, backend, AI inference code, Docker configurations, scripts, and schemas (~50 MB).
- **Google Drive holds:** The 3 large files that exceed GitHub's limits (`cve_record.sql`, `12heads_linevul_model.bin`, and `cve_kb.json`).

---

## 📤 PART 1: What YOU (Project Owner) Need to Do

### A. Upload the 3 Large Files to Google Drive

1. Open [Google Drive](https://drive.google.com/) and create a new folder named:  
   📁 `FYP_Large_Files`
2. Inside that folder, upload these **3 specific files** from your project directory:

| File Name | Location on Your PC | Size | Description |
|---|---|---|---|
| `cve_record.sql` | `Archive/cve_record.sql` | ~1.47 GB | PostgreSQL CVE dataset dump |
| `12heads_linevul_model.bin` | `Archive/linevul/linevul/saved_models/checkpoint-best-f1/12heads_linevul_model.bin` | ~951 MB | Trained LineVul CodeBERT model weights |
| `cve_kb.json` | `Archive/backend/app/cve_kb.json` | ~157 MB | Precomputed CVE Knowledge Base |

3. In Google Drive, right-click the `FYP_Large_Files` folder, select **Share** ➡️ change General Access to **"Anyone with the link can view"** (or add your teammates' email addresses), and copy the link.

---

### B. Push the Codebase to GitHub

The `.gitignore` has already been updated to prevent large files, virtual environments, and node_modules from being committed.

Open PowerShell or Command Prompt in your project folder (`C:\Users\MUNEEB\Downloads\Archive`) and run:

```bash
# 1. Stage all code and Docker configurations
git add .

# 2. Commit the files
git commit -m "FYP containerization: Docker Compose, Next.js UI, FastAPI, LineVul, scripts"

# 3. Create a new repository on github.com (e.g. named 'cve-linevul-platform')
# Then link and push:
git remote add origin https://github.com/YOUR_USERNAME/cve-linevul-platform.git
git branch -M main
git push -u origin main
```

*(Note: If you already have a remote configured, verify with `git remote -v` and push with `git push origin main`).*

---

## 📥 PART 2: What YOUR TEAMMATES Need to Do

Share the **GitHub repository link** and your **Google Drive link** with your teammates. They only need to follow these 4 steps:

### Step 1: Clone the GitHub Repository
```bash
git clone https://github.com/YOUR_USERNAME/cve-linevul-platform.git
cd cve-linevul-platform
```

### Step 2: Download & Place the 3 Files from Google Drive
From your Google Drive link, have them download the 3 files and place them into the cloned project folder at these exact locations:

1. **`cve_record.sql`** ➡️ Place directly in the **root** folder:
   ```
   cve-linevul-platform/
   └── cve_record.sql
   ```
2. **`12heads_linevul_model.bin`** ➡️ Place inside:
   ```
   cve-linevul-platform/
   └── linevul/
       └── linevul/
           └── saved_models/
               └── checkpoint-best-f1/
                   └── 12heads_linevul_model.bin
   ```
   *(If the folder `saved_models/checkpoint-best-f1/` does not exist on their machine, tell them to simply create that folder).*

3. **`cve_kb.json`** ➡️ Place two copies (one for backend, one for linevul):
   ```
   cve-linevul-platform/backend/app/cve_kb.json
   cve-linevul-platform/linevul/cve_kb.json
   ```

---

### Step 3: Start the Platform with Docker Desktop

Make sure **Docker Desktop** is open and running on their PC.

- **On Windows:** Double-click `run_docker.bat`
- **On Mac/Linux:** In terminal, run `./run_docker.sh`

Docker will automatically build the Next.js frontend, Python FastAPI backend, LineVul AI model service, and start PostgreSQL 17.

They can access:
- 🌐 **Web Dashboard:** [http://localhost:3000](http://localhost:3000)
- 📄 **Backend API Docs (Swagger):** [http://localhost:8001/docs](http://localhost:8001/docs)
- 🤖 **LineVul AI Engine:** [http://localhost:5000](http://localhost:5000)

---

### Step 4: Import the Database

Once the containers are running:
- **On Windows:** Double-click `import_dataset.bat`
- **On Mac/Linux:** In terminal, run `./import_dataset.sh`

This loads all 320,000+ CVE records from `cve_record.sql` into their PostgreSQL database automatically.

---

## 📋 Teammate Checklist Summary

| Check | Step | Action |
|:---:|---|---|
| [ ] | **1** | Install & open Docker Desktop |
| [ ] | **2** | Clone GitHub repository |
| [ ] | **3** | Download 3 large files from Google Drive and drop them in the matching folders |
| [ ] | **4** | Double-click `run_docker.bat` |
| [ ] | **5** | Double-click `import_dataset.bat` |
| [ ] | **6** | Open `http://localhost:3000` in browser! |
