# 🎓 Final Year Project: CVE & LineVul Vulnerability Detection Platform
## Teammate Handoff & Quickstart Guide

Welcome to the **CVE Analysis & LineVul C/C++ Deep Learning Vulnerability Detection Platform**! 

Everything in this project has been containerized with **Docker** and **Docker Compose**. Teammates do not need to install Python 3.11, PyTorch, Node.js, Next.js, or PostgreSQL locally. Docker runs all four tiers in isolated, synchronized containers.

---

## 🏛️ Platform Architecture

```
[ Frontend: Next.js 16 ] (Port 3000)
         │
         ├───► [ FastAPI Backend ] (Port 8001) ───► [ PostgreSQL 17 ] (Port 5432)
         │               │
         └───────────────┴───► [ LineVul PyTorch AI Service ] (Port 5000)
```

1. **Frontend (`http://localhost:3000`)**: Next.js 16 Web Dashboard with interactive vulnerability inspection, metrics visualization, and CodeBERT hotspot highlighting.
2. **Backend API (`http://localhost:8001`)**: FastAPI service orchestrating CVE database queries, CodeBERT vector search, and API routing.
3. **LineVul AI Service (`http://localhost:5000`)**: PyTorch transformer inference service scoring functions and predicting line-level vulnerabilities using CodeBERT attention weights.
4. **PostgreSQL Database (`localhost:5432`)**: Stores CVE definitions, CWE hierarchies, EPSS scores, vendor/product statistics, and patches (`vulnmark` database).

---

## 🚀 3-Minute Setup for Teammates

### Step 1: Install & Open Docker Desktop
Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and running on your computer.

### Step 2: Start All Services
Simply run the startup script for your operating system:

- **Windows:** Double-click `run_docker.bat` (or run `./run_docker.bat` in PowerShell)
- **macOS / Linux:** Run `./run_docker.sh` in Terminal

Docker Compose will automatically:
- Build the Next.js frontend, FastAPI backend, and LineVul PyTorch services.
- Pull PostgreSQL 17 and initialize the database schema.
- Wire up internal networking and start all services.

### Step 3: Access the Platform
Once started, open your browser:
- 🌐 **Web Dashboard:** [http://localhost:3000](http://localhost:3000)
- 📄 **Backend API Docs (Swagger):** [http://localhost:8001/docs](http://localhost:8001/docs)
- 🤖 **LineVul AI Service:** [http://localhost:5000](http://localhost:5000)

---

## 💾 Importing the Full CVE Dataset (`cve_record.sql`)

The repository includes a 1.47 GB database dump (`cve_record.sql`).

To load this full dataset into your PostgreSQL container:
- **Windows:** Double-click `import_dataset.bat`
- **macOS / Linux:** Run `./import_dataset.sh`

*(Note: Restoring 1.47 GB takes approximately 2–4 minutes depending on your SSD speed).*

---

## 📦 How to Share This FYP with Teammates

### What to Share:
You can share the project via **GitHub**, a shared drive, or a `.zip` archive.

1. **If using Git / GitHub:**
   - The `.gitignore` and `.dockerignore` files are already configured to keep your repository clean (ignoring `node_modules`, `venv`, caches, and build artifacts).
   - Because `cve_record.sql` (1.47 GB) and model bin files may exceed GitHub's 100 MB file limit, upload `cve_record.sql` and `12heads_linevul_model.bin` to Google Drive or OneDrive, and share the link with your team.
   - Teammates place `cve_record.sql` directly into the project root folder.

2. **If sharing via USB / Google Drive ZIP:**
   - Exclude `frontend/node_modules/`, `frontend/.next/`, and any `.venv/` folders (Docker rebuilds them automatically and they save 3+ GB of transfer size).
   - Include `cve_record.sql`, `cve_index.npy`, `cve_index_meta.json`, and the code.

---

## 🛠️ Helpful Docker Commands

| Action | Command |
|---|---|
| **View real-time logs** | `docker compose logs -f` |
| **View logs for backend only** | `docker compose logs -f backend` |
| **View logs for LineVul AI only** | `docker compose logs -f linevul` |
| **Stop all services** | `docker compose down` |
| **Stop and wipe database volume** | `docker compose down -v` |
| **Rebuild after making code changes** | `docker compose up --build -d` |

---

## 🎯 FYP Presentation & Demo Tips

1. **Live Code Vulnerability Scan:** Navigate to `http://localhost:3000/linevul`, paste a vulnerable C/C++ function (such as a buffer overflow `strcpy`), and click analyze to showcase LineVul's line-by-line attention heatmaps.
2. **Interactive CVE Intelligence:** Search CVEs by ID, CWE, vendor, or CVSS score in the dashboard to demonstrate the full-stack database integration.
