#!/usr/bin/env python3
"""
Custom Dataset Builder for LineVul
=================================
Processes and pairs:
  1) Kernel Data: 'kernal data' (vulnerable_function vs nonvulnerable_function)
  2) Open-Source Data: 'dataset new' (vulnerable_function vs nonvulnerable_function zip)

Generates 3 Organized Splits:
  - Split 1 (Kernel): data/split_1_kernel/ (train, val, test)
  - Split 2 (Application/Open-Source): data/split_2_application/ (train, val, test)
  - Split 3 (Full Combined): data/split_3_combined/ (train, val, test)
"""

import os
import sys
import re
import csv
import json
import random
import difflib
import zipfile
import argparse
from pathlib import Path
from collections import defaultdict

csv.field_size_limit(min(2**31 - 1, 10**8))

COMMENT_ONLY = re.compile(r"^\s*(/\*|//|\*)")

def normalize_code(text: str) -> str:
    if not text:
        return ""
    return text.replace("\r\n", "\n").replace("\r", "\n")

def extract_line_labels(vul_code: str, safe_code: str) -> list[int]:
    """Identify 1-based removed or modified line numbers from vul to safe."""
    vul_lines = vul_code.splitlines()
    safe_lines = safe_code.splitlines()
    if not vul_lines or vul_lines == safe_lines:
        return []
    
    matcher = difflib.SequenceMatcher(a=vul_lines, b=safe_lines, autojunk=False)
    removed = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag in ("delete", "replace"):
            removed.extend(range(i1 + 1, i2 + 1))
    return sorted(set(removed))

def process_kernel_data(kernel_root: Path, max_pairs: int = 0, max_lines_change: int = 25):
    vuln_base = kernel_root / "vulnerable_function" / "vulnerable_function"
    safe_base = kernel_root / "nonvulnerable_function" / "nonvulnerable_function"

    if not vuln_base.exists() or not safe_base.exists():
        print(f"[!] Warning: Kernel folders not found at {vuln_base} or {safe_base}", flush=True)
        return []

    print(f"[*] Processing Kernel Data from {vuln_base}...", flush=True)
    records = []
    scanned = 0

    for root, _, files in os.walk(vuln_base):
        for f in files:
            if not f.endswith(".c"):
                continue
            scanned += 1
            if scanned % 1000 == 0:
                print(f"    ...scanned {scanned} kernel files (extracted {len(records)//2} pairs)", flush=True)

            vf = Path(root) / f
            try:
                rel = vf.relative_to(vuln_base)
            except ValueError:
                continue

            sf = safe_base / rel
            if not sf.exists():
                continue

            try:
                v_code = normalize_code(vf.read_text(encoding="utf-8", errors="replace"))
                s_code = normalize_code(sf.read_text(encoding="utf-8", errors="replace"))
            except Exception:
                continue

            v_loc = v_code.count("\n") + 1
            s_loc = s_code.count("\n") + 1
            if v_loc < 3 or v_loc > 300 or s_loc < 3 or s_loc > 300 or abs(v_loc - s_loc) > 30:
                continue

            line_labels = extract_line_labels(v_code, s_code)
            if not line_labels or len(line_labels) > max_lines_change:
                continue

            # Check if change is only comments
            v_lines = v_code.splitlines()
            labelled_lines = [v_lines[i - 1] for i in line_labels if i <= len(v_lines)]
            if all(COMMENT_ONLY.match(x or " ") or not (x or "").strip() for x in labelled_lines):
                continue

            cve_match = re.search(r"(CVE-\d{4}-\d{4,7})", str(rel), re.I)
            cve_id = cve_match.group(1).upper() if cve_match else "KERNEL"
            clean_name = re.sub(r"[^a-zA-Z0-9_]+", "_", f"{cve_id}_{f}")[:60]
            rec_id = f"kernel_{clean_name}_{len(records)}"

            records.append({
                "id": rec_id,
                "code": v_code,
                "func_label": 1,
                "line_labels": line_labels,
                "n_lines": v_loc,
                "cve": cve_id,
                "source": "kernel"
            })
            records.append({
                "id": f"{rec_id}_safe",
                "code": s_code,
                "func_label": 0,
                "line_labels": [],
                "n_lines": s_code.count("\n") + 1,
                "cve": cve_id,
                "source": "kernel"
            })

            if max_pairs > 0 and (len(records) // 2) >= max_pairs:
                print(f"[OK] Reached target limit of {max_pairs} pairs from Kernel Data.", flush=True)
                return records

    print(f"[OK] Extracted {len(records)} records ({len(records)//2} pairs) from Kernel Data.", flush=True)
    return records

def process_dataset_new(dataset_root: Path, max_pairs: int = 0, max_lines_change: int = 25):
    vuln_base = dataset_root / "vulnerable_function (1)" / "vulnerable_function"
    zip_path = dataset_root / "nonvulnerable_function (1).zip"

    if not vuln_base.exists() or not zip_path.exists():
        print(f"[!] Warning: New dataset files not found at {vuln_base} or {zip_path}", flush=True)
        return []

    print(f"[*] Processing Dataset New from {vuln_base} & {zip_path}...", flush=True)
    records = []
    scanned = 0

    try:
        with zipfile.ZipFile(zip_path, "r") as z:
            zip_names = set(z.namelist())

            for root, _, files in os.walk(vuln_base):
                for f in files:
                    if not f.endswith(".c"):
                        continue
                    scanned += 1
                    if scanned % 2000 == 0:
                        print(f"    ...scanned {scanned} dataset_new files (extracted {len(records)//2} pairs)", flush=True)

                    vf = Path(root) / f
                    try:
                        rel = os.path.relpath(vf, vuln_base).replace("\\", "/")
                    except ValueError:
                        continue

                    zip_target = f"nonvulnerable_function/{rel}"
                    if zip_target not in zip_names:
                        continue

                    try:
                        v_code = normalize_code(vf.read_text(encoding="utf-8", errors="replace"))
                        s_bytes = z.read(zip_target)
                        s_code = normalize_code(s_bytes.decode("utf-8", errors="replace"))
                    except Exception:
                        continue

                    v_loc = v_code.count("\n") + 1
                    s_loc = s_code.count("\n") + 1
                    if v_loc < 3 or v_loc > 300 or s_loc < 3 or s_loc > 300 or abs(v_loc - s_loc) > 30:
                        continue

                    line_labels = extract_line_labels(v_code, s_code)
                    if not line_labels or len(line_labels) > max_lines_change:
                        continue

                    v_lines = v_code.splitlines()
                    labelled_lines = [v_lines[i - 1] for i in line_labels if i <= len(v_lines)]
                    if all(COMMENT_ONLY.match(x or " ") or not (x or "").strip() for x in labelled_lines):
                        continue

                    cve_match = re.search(r"(CVE-\d{4}-\d{4,7})", rel, re.I)
                    cve_id = cve_match.group(1).upper() if cve_match else "DATASET_NEW"
                    clean_name = re.sub(r"[^a-zA-Z0-9_]+", "_", f"{cve_id}_{f}")[:60]
                    rec_id = f"dsnew_{clean_name}_{len(records)}"

                    records.append({
                        "id": rec_id,
                        "code": v_code,
                        "func_label": 1,
                        "line_labels": line_labels,
                        "n_lines": v_loc,
                        "cve": cve_id,
                        "source": "dataset_new"
                    })
                    records.append({
                        "id": f"{rec_id}_safe",
                        "code": s_code,
                        "func_label": 0,
                        "line_labels": [],
                        "n_lines": s_code.count("\n") + 1,
                        "cve": cve_id,
                        "source": "dataset_new"
                    })

                    if max_pairs > 0 and (len(records) // 2) >= max_pairs:
                        print(f"[OK] Reached target limit of {max_pairs} pairs from Dataset New.", flush=True)
                        return records
    except Exception as e:
        print(f"[!] Error reading zip file: {e}", flush=True)

    print(f"[OK] Extracted {len(records)} records ({len(records)//2} pairs) from Dataset New.", flush=True)
    return records

def split_pairs(records: list[dict], val_ratio: float = 0.1, test_ratio: float = 0.1, seed: int = 42):
    """Keep vulnerable and safe twins in the same split to avoid data leakage."""
    groups = defaultdict(list)
    for rec in records:
        key = rec["id"].removesuffix("_safe")
        groups[key].append(rec)

    keys = list(groups.keys())
    rng = random.Random(seed)
    rng.shuffle(keys)

    n = len(keys)
    n_test = max(1, int(n * test_ratio))
    n_val = max(1, int(n * val_ratio))
    test_keys = set(keys[:n_test])
    val_keys = set(keys[n_test : n_test + n_val])
    train_keys = set(keys[n_test + n_val :])

    splits = {"train": [], "val": [], "test": []}
    for key, items in groups.items():
        if key in test_keys:
            splits["test"].extend(items)
        elif key in val_keys:
            splits["val"].extend(items)
        else:
            splits["train"].extend(items)

    for k in splits:
        rng.shuffle(splits[k])
    return splits

def save_split_files(splits: dict, out_dir: Path, split_name_desc: str = "dataset"):
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1. Write JSONL files (for Supervised Line Head)
    for split_name, rows in splits.items():
        jsonl_path = out_dir / f"{split_name}.jsonl"
        with jsonl_path.open("w", encoding="utf-8") as handle:
            for r in rows:
                handle.write(json.dumps(r, ensure_ascii=False) + "\n")

    # 2. Write CSV files (for Stock LineVul / linevul_main.py)
    for split_name, rows in splits.items():
        csv_path = out_dir / f"{split_name}.csv"
        with csv_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=["id", "processed_func", "target", "line_labels", "n_lines", "cve"])
            writer.writeheader()
            for r in rows:
                writer.writerow({
                    "id": r["id"],
                    "processed_func": r["code"],
                    "target": r["func_label"],
                    "line_labels": ";".join(map(str, r["line_labels"])),
                    "n_lines": r["n_lines"],
                    "cve": r.get("cve", "")
                })

    stats = {
        "split_name": split_name_desc,
        "total_samples": sum(len(v) for v in splits.values()),
        "total_pairs": sum(len(v) for v in splits.values()) // 2,
        "train": len(splits["train"]),
        "train_pairs": len(splits["train"]) // 2,
        "val": len(splits["val"]),
        "val_pairs": len(splits["val"]) // 2,
        "test": len(splits["test"]),
        "test_pairs": len(splits["test"]) // 2,
        "train_vul": sum(r["func_label"] for r in splits["train"]),
        "train_safe": sum(1 for r in splits["train"] if r["func_label"] == 0),
        "val_vul": sum(r["func_label"] for r in splits["val"]),
        "test_vul": sum(r["func_label"] for r in splits["test"]),
    }
    stats_path = out_dir / "stats.json"
    stats_path.write_text(json.dumps(stats, indent=2), encoding="utf-8")
    print(f"\n[OK] Saved {split_name_desc} to {out_dir}:", flush=True)
    print(f"     Train: {stats['train']} ({stats['train_pairs']} pairs) | Val: {stats['val']} | Test: {stats['test']}", flush=True)
    return stats

def main():
    parser = argparse.ArgumentParser(description="Build training dataset splits from Kernel and Dataset New")
    parser.add_argument("--kernel-dir", default=r"C:\Users\MUNEEB\Downloads\kernal data")
    parser.add_argument("--new-dir", default=r"C:\Users\MUNEEB\Downloads\dataset new")
    parser.add_argument("--base-data-dir", default=str(Path(__file__).resolve().parent.parent / "data"))
    parser.add_argument("--max-samples", type=int, default=0, help="Limit total pairs per source (0 = all)")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    base_dir = Path(args.base_data_dir)
    split1_dir = base_dir / "split_1_kernel"
    split2_dir = base_dir / "split_2_application"
    split3_dir = base_dir / "split_3_combined"

    # 1. Process Kernel records
    kernel_records = process_kernel_data(Path(args.kernel_dir), max_pairs=args.max_samples)
    
    # 2. Process Dataset New records
    new_records = process_dataset_new(Path(args.new_dir), max_pairs=args.max_samples)

    if not kernel_records and not new_records:
        print("[!] No records extracted. Check your folder paths.", flush=True)
        sys.exit(1)

    all_records = kernel_records + new_records

    print(f"\n=======================================================", flush=True)
    print(f"Creating 3 Distinct Training Splits...", flush=True)
    print(f"=======================================================", flush=True)

    summary = {}

    # Build Split 1: Kernel Only
    if kernel_records:
        splits_k = split_pairs(kernel_records, seed=args.seed)
        summary["split_1_kernel"] = save_split_files(splits_k, split1_dir, "Split 1: Kernel Vulnerabilities")

    # Build Split 2: Application / Open-Source Only
    if new_records:
        splits_a = split_pairs(new_records, seed=args.seed)
        summary["split_2_application"] = save_split_files(splits_a, split2_dir, "Split 2: Application Vulnerabilities")

    # Build Split 3: Full Combined
    splits_c = split_pairs(all_records, seed=args.seed)
    summary["split_3_combined"] = save_split_files(splits_c, split3_dir, "Split 3: Combined Kernel + Application")

    # Save summary
    summary_path = base_dir / "splits_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"\n[OK] All 3 splits successfully generated! Summary written to {summary_path}", flush=True)

if __name__ == "__main__":
    main()
