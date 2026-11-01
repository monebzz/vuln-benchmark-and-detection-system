#!/usr/bin/env python3
"""
Package LineVul Code & Prepared Dataset for Google Colab
========================================================
Creates a compact 'linevul_train.zip' containing:
  - Source code (linevul/, scripts/, notebooks/)
  - Prepared dataset (data/combined_new/)
  - requirements.txt
Excludes large checkpoint weight files and __pycache__ to keep the zip under ~20MB.
"""

import os
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_ZIP = ROOT.parent / "linevul_train.zip"

EXCLUDE_DIRS = {
    "__pycache__",
    ".git",
    "saved_models",
    "checkpoints",
    "venv",
    ".venv",
    ".pytest_cache",
    ".ipynb_checkpoints"
}

EXCLUDE_EXTS = {".bin", ".pt", ".pth", ".tar", ".gz", ".DS_Store"}

def package():
    print(f"[*] Packaging project from {ROOT} to {OUTPUT_ZIP}...")
    count = 0
    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(ROOT):
            # prune excluded dirs
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for f in files:
                ext = Path(f).suffix
                if ext in EXCLUDE_EXTS or f in EXCLUDE_EXTS:
                    continue
                full_path = Path(root) / f
                rel_path = full_path.relative_to(ROOT)
                # Store under 'linevul/' inside zip
                arcname = Path("linevul") / rel_path
                z.write(full_path, arcname)
                count += 1

    size_mb = OUTPUT_ZIP.stat().st_size / (1024 * 1024)
    print(f"[OK] Packaged {count} files into {OUTPUT_ZIP} ({size_mb:.2f} MB)")
    print(f"[OK] Ready to upload to Google Drive!")

if __name__ == "__main__":
    package()
