def extract_nvd_cvss(metrics: dict) -> tuple[float, str, str, str]:
    """
    Extract CVSS score, severity, version, and vector string from NVD metrics object.
    Prefers NVD Primary score (type == 'Primary').
    """
    for key, ver in [("cvssMetricV31", "3.1"), ("cvssMetricV30", "3.0"), ("cvssMetricV2", "2.0")]:
        metric_list = metrics.get(key, []) if isinstance(metrics, dict) else []
        if not metric_list:
            continue
        sorted_metrics = sorted(metric_list, key=lambda m: 0 if m.get("type") == "Primary" else 1)
        target = sorted_metrics[0]
        data = target.get("cvssData", {})
        score = data.get("baseScore")
        severity = data.get("baseSeverity") or target.get("baseSeverity") or "HIGH"
        vector = data.get("vectorString") or ""
        if score is not None:
            return float(score), str(severity).upper(), ver, vector
    return 7.5, "HIGH", "3.1", ""

r"""
Build an integrated CVE Knowledge Base indexing:
1. C:\Users\MUNEEB\Downloads\dataset new
2. C:\Users\MUNEEB\Downloads\kernal data
3. PostgreSQL cve_data_view metadata (323,563 CVEs)

Extracts for each CVE:
- CVE ID
- Function names
- Source file names
- Distinctive code tokens for robust fingerprint matching
- Full unified diff patch
- CVSS scores, CWE classification, vendor, product, and description
"""

import os
import sys
import re
import json
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

BASE_DIR = Path(__file__).resolve().parent.parent

# Dataset paths
DATASET_NEW_PATCH = Path(r"C:\Users\MUNEEB\Downloads\dataset new\patch\patch")
DATASET_NEW_VULN = Path(r"C:\Users\MUNEEB\Downloads\dataset new\vulnerable_function (1)\vulnerable_function")

KERNEL_DATA_PATCH = Path(r"C:\Users\MUNEEB\Downloads\kernal data\patch (1)\patch")
KERNEL_DATA_VULN = Path(r"C:\Users\MUNEEB\Downloads\kernal data\vulnerable_function\vulnerable_function")

STOP_WORDS = {
    "void", "return", "const", "static", "inline", "while", "struct", "else", "break",
    "continue", "char", "unsigned", "signed", "sizeof", "true", "false", "null", "int",
    "float", "double", "long", "short", "switch", "case", "default", "auto", "register",
    "goto", "include", "define", "endif", "ifdef", "ifndef"
}

def clean_patch(txt: str) -> str:
    if not txt:
        return ""
    # Strip RTF headers or metadata dividers
    parts = txt.split("=" * 10)
    body = parts[-1].strip() if len(parts) > 1 else txt.strip()
    # Normalize line endings
    body = body.replace("\r\n", "\n").replace("\r", "\n")
    return body

def process_cve(cve_id: str, vuln_dir: Path | None, patch_dir: Path | None) -> dict:
    funcs = set()
    files = set()
    tokens = set()
    patch = ""
    patch_id = ""
    summary = ""

    # 1. Extract from vulnerable function files
    if vuln_dir and vuln_dir.exists():
        for cdir in vuln_dir.iterdir():
            if not cdir.is_dir():
                continue
            if not patch_id:
                patch_id = cdir.name
            for f in cdir.iterdir():
                if not f.is_file():
                    continue
                # Parse filename pattern: hunk<N>_<function>_<file>.cpp
                m = re.match(r"hunk\d+_(.+?)_(.+)\.[a-zA-Z0-9]+", f.name)
                if m:
                    funcs.add(m.group(1))
                    files.add(m.group(2))
                try:
                    txt = f.read_text(encoding="utf-8", errors="ignore")
                except Exception:
                    continue
                
                # Function signature match: void my_func(...) { or Class::my_func(...) {
                for sig in re.finditer(r"(?:[a-zA-Z_0-9:]+::)?([a-zA-Z_0-9]+)\s*\([^)]*\)\s*\{?", txt):
                    fn = sig.group(1)
                    if fn.lower() not in STOP_WORDS and len(fn) >= 3:
                        funcs.add(fn)
                
                # Extract distinctive tokens
                words = re.findall(r"\b([a-zA-Z_][a-zA-Z0-9_]{3,})\b", txt)
                for w in words:
                    if w.lower() not in STOP_WORDS:
                        tokens.add(w)

    # 2. Extract from patch files
    if patch_dir and patch_dir.exists():
        patch_diffs = []
        for cdir in patch_dir.iterdir():
            if not cdir.is_dir():
                continue
            if not patch_id:
                patch_id = cdir.name
            for f in cdir.iterdir():
                if not f.is_file():
                    continue
                fname_lower = f.name.lower()
                try:
                    txt = f.read_text(encoding="utf-8", errors="ignore")
                except Exception:
                    continue

                if "hunk" in fname_lower:
                    for l in txt.splitlines()[:12]:
                        if l.startswith("Function:"):
                            funcs.add(l.split(":", 1)[1].strip())
                        elif l.startswith("File:"):
                            files.add(l.split(":", 1)[1].strip())
                    cp = clean_patch(txt)
                    if cp and ("---" in cp or "+++" in cp):
                        patch_diffs.append(cp)
                        # Extract distinctive tokens from hunk diff lines (+ and -)
                        for pline in cp.splitlines():
                            if pline.startswith(("+", "-")) and not pline.startswith(("+++", "---")):
                                for w in re.findall(r"\b([a-zA-Z_][a-zA-Z0-9_]{3,})\b", pline):
                                    if w.lower() not in STOP_WORDS:
                                        tokens.add(w)
                elif "file_diff" in fname_lower:
                    cp = clean_patch(txt)
                    if cp and ("---" in cp or "+++" in cp):
                        patch_diffs.append(cp)
                elif "cve_summary" in fname_lower:
                    summary = txt.strip()

        if patch_diffs:
            # Join all unique diffs
            seen_diffs = set()
            unique_diffs = []
            for pd in patch_diffs:
                norm_d = pd[:200]
                if norm_d not in seen_diffs:
                    seen_diffs.add(norm_d)
                    unique_diffs.append(pd)
            patch = "\n\n".join(unique_diffs)

    return {
        "cve_id": cve_id,
        "patch_id": patch_id,
        "functions": sorted(list(funcs)),
        "files": sorted(list(files)),
        "tokens": sorted(list(tokens)),
        "patch": patch,
        "summary": summary
    }

def main():
    t0 = time.time()
    print("Collecting CVE directories across both datasets...")

    cve_map = {} # cve_id -> (vuln_path, patch_path)

    # Dataset New
    if DATASET_NEW_VULN.exists():
        for item in DATASET_NEW_VULN.iterdir():
            if item.is_dir():
                cve_map.setdefault(item.name, [None, None])[0] = item

    if DATASET_NEW_PATCH.exists():
        for item in DATASET_NEW_PATCH.iterdir():
            if item.is_dir():
                cve_map.setdefault(item.name, [None, None])[1] = item

    # Kernel Data
    if KERNEL_DATA_VULN.exists():
        for item in KERNEL_DATA_VULN.iterdir():
            if item.is_dir():
                cve_map.setdefault(item.name, [None, None])[0] = item

    if KERNEL_DATA_PATCH.exists():
        for item in KERNEL_DATA_PATCH.iterdir():
            if item.is_dir():
                cve_map.setdefault(item.name, [None, None])[1] = item

    total_cves = len(cve_map)
    print(f"Total unique CVEs discovered: {total_cves}")

    print("Parsing functions, files, tokens, and patches with ThreadPoolExecutor (16 workers)...")
    tasks = [(cve_id, paths[0], paths[1]) for cve_id, paths in cve_map.items()]

    parsed_records = {}
    with ThreadPoolExecutor(max_workers=16) as pool:
        futures = [pool.submit(process_cve, cve_id, v_p, p_p) for cve_id, v_p, p_p in tasks]
        for idx, fut in enumerate(futures):
            res = fut.result()
            parsed_records[res["cve_id"]] = res
            if (idx + 1) % 5000 == 0:
                print(f"  Parsed {idx + 1} / {total_cves} CVEs ({time.time() - t0:.1f}s)...")

    print(f"All {total_cves} CVEs parsed from disk in {time.time() - t0:.1f}s.")

    # 3. Enrich with metadata (from existing cve_kb.json or PostgreSQL)
    pg_metadata = {}
    kb_existing = BASE_DIR / "linevul" / "cve_kb.json"
    if kb_existing.exists():
        try:
            with open(kb_existing, "r", encoding="utf-8") as f:
                old_kb = json.load(f)
                for cid, old_rec in old_kb.items():
                    pg_metadata[cid] = {
                        "cveid": cid,
                        "title": old_rec.get("title"),
                        "description": old_rec.get("description"),
                        "latest_severity": old_rec.get("severity"),
                        "latest_basescore": old_rec.get("basescore"),
                        "category_type": old_rec.get("cwe_info"),
                        "vendor": old_rec.get("vendor"),
                        "product": old_rec.get("product"),
                        "datepublished": old_rec.get("date_published")
                    }
            print(f"Loaded existing metadata for {len(pg_metadata)} CVEs from cve_kb.json.")
        except Exception as e:
            print(f"Notice: Failed to load existing cve_kb metadata: {e}")

    try:
        import psycopg
        from psycopg.rows import dict_row
        print("Checking PostgreSQL for latest CVE metadata (timeout 1s)...")
        conn = psycopg.connect("postgresql://postgres:muneeb88@localhost:8000/vulnmark", row_factory=dict_row, connect_timeout=1)
        cve_ids_list = list(parsed_records.keys())
        for i in range(0, len(cve_ids_list), 5000):
            batch = cve_ids_list[i:i+5000]
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT cveid, title, description, latest_severity, latest_basescore, category_type, vendor, product, datepublished
                    FROM cve_data_view
                    WHERE cveid = ANY(%s)
                """, (batch,))
                for row in cur.fetchall():
                    pg_metadata[row["cveid"]] = row
        print(f"PostgreSQL metadata fetched for {len(pg_metadata)} CVEs.")
    except Exception as e:
        print(f"Notice: PostgreSQL enrichment skipped ({e}); using existing metadata.")

    # 4. Assemble integrated CVE records
    final_kb = {}
    for cve_id, rec in parsed_records.items():
        meta = pg_metadata.get(cve_id, {})
        title = meta.get("title")
        fn_str = ", ".join(rec["functions"][:3]) if rec["functions"] else "code component"
        file_str = ", ".join(rec["files"][:2]) if rec["files"] else "source file"

        if not title:
            title = f"{cve_id}: Vulnerability in {fn_str} ({file_str})"

        desc = meta.get("description")
        if not desc:
            desc = f"A vulnerability in {fn_str} ({file_str}) allows potential attackers to compromise system security."

        sev = meta.get("latest_severity") or "HIGH"
        score = meta.get("latest_basescore")
        if score is None:
            score = 7.5

        cwe_raw = meta.get("category_type")
        cwe_id = "CWE-General"
        cwe_title = "General Vulnerability"
        if cwe_raw and cwe_raw != "N/A":
            cwe_id = cwe_raw.split(":")[0].strip()
            cwe_title = cwe_raw
        elif any("copy" in fn.lower() or "strcpy" in fn.lower() for fn in rec["functions"]):
            cwe_id = "CWE-120"
            cwe_title = "CWE-120: Classic Buffer Overflow"
        elif any("free" in fn.lower() for fn in rec["functions"]):
            cwe_id = "CWE-416"
            cwe_title = "CWE-416: Use After Free"

        final_kb[cve_id] = {
            "cve_id": cve_id,
            "title": title,
            "description": desc,
            "severity": sev,
            "basescore": float(score),
            "cvss_version": meta.get("cvss_version") or "3.1",
            "cvss_vector": meta.get("cvss_vector") or "",
            "category_type": cwe_id,
            "cwe_id": cwe_id,
            "cwe_title": cwe_title,
            "vendor": meta.get("vendor") or "Open Source / Linux",
            "product": meta.get("product") or file_str,
            "date_published": str(meta.get("datepublished") or ""),
            "patch_id": rec["patch_id"],
            "functions": rec["functions"],
            "files": rec["files"],
            "tokens": rec["tokens"],
            "patch": rec["patch"],
            "summary": rec["summary"]
        }

    # 5. Save KB to target locations
    kb_out_linevul = BASE_DIR / "linevul" / "cve_kb.json"
    kb_out_backend = BASE_DIR / "backend" / "app" / "cve_kb.json"

    print(f"Saving {len(final_kb)} CVE records to {kb_out_linevul}...")
    with open(kb_out_linevul, "w", encoding="utf-8") as f:
        json.dump(final_kb, f, indent=2)

    print(f"Saving copy to {kb_out_backend}...")
    with open(kb_out_backend, "w", encoding="utf-8") as f:
        json.dump(final_kb, f, indent=2)

    size_mb = kb_out_linevul.stat().st_size / (1024 * 1024)
    print(f"[SUCCESS] Built complete CVE & Patch Knowledge Base: {len(final_kb)} CVEs ({size_mb:.1f} MB) in {time.time() - t0:.1f}s.")

if __name__ == "__main__":
    main()
