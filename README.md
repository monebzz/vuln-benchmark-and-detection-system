# VulnScan — Vulnerability Benchmark and Detection System

Final-year project: line-level vulnerability detection in C/C++ code.

## What it does

- Detects vulnerabilities across 15 CWE categories using a fine-tuned CodeBERT model and code property graphs from Joern.
- Maps detections to CVE benchmark records with remediation patches.
- Demo: LineVul flags a `strcpy` overflow as Critical (96.0%, CVE-2018-3865, CWE-120) and passes a safe file at 0.0%.

## Stack

- Backend: Python, FastAPI, CodeBERT, Joern
- Frontend: React / TypeScript
- See `backend/README.md` and `frontend/README.md` for setup, and `README-DOCKER.md` for Docker instructions.
