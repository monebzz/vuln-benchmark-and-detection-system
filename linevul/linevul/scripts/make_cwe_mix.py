#!/usr/bin/env python3
"""Build cwe_mix = all of cwe_synth plus filtered C pair-diffs.

Keeps every synthetic sink row. Adds real C functions whose line labels
come from a tight safe/vul patch diff (not Big-Vul-style rewrites).
"""

from __future__ import annotations

import argparse
import csv
import json
import random
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SINK_RE = re.compile(
    r"\b(strcpy|strncpy|strcat|strncat|sprintf|snprintf|gets|scanf|memcpy|"
    r"memmove|malloc|calloc|realloc|free|printf|system|exec|execl|execv|"
    r"read|write|recv|send)\s*\("
    r"|->|\[|\bNULL\b|\bnull\b",
    re.I,
)
COMMENT_ONLY = re.compile(r"^\s*(/\*|//|\*)")
NAME_RE = re.compile(r"^[\w\s\*:]{0,120}\b(\w+)\s*\(", re.M)
WEB_CWE = {"CWE-79", "CWE-89", "CWE-352", "CWE-918", "CWE-22", "CWE-78"}
NON_C = re.compile(
    r"<\?php|\$_(GET|POST|REQUEST|COOKIE)|^\s*def\s+\w+|^\s*class\s+\w+|"
    r"public\s+class|System\.out|console\.log|function\s+\w+\s*\(|=>\s*\{",
    re.M,
)
C_HINT = re.compile(
    r"\b(char\s+\*|malloc\s*\(|sizeof\s*\(|size_t|void\s+\w+|struct\s+\w+|"
    r"unsigned\s+|int\s+\w+\s*\()",
)


def load_jsonl(path: Path) -> list[dict]:
    rows = []
    with path.open() as handle:
        for line in handle:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def first_name(code: str) -> str | None:
    match = re.search(NAME_RE, code)
    return match.group(1) if match else None


def is_c(code: str) -> bool:
    if NON_C.search(code):
        return False
    return bool(C_HINT.search(code))


def line_labels_from_diff(vul: str, safe: str) -> list[int]:
    before = vul.split("\n")
    after = safe.split("\n")
    removed: list[int] = []
    matcher = __import__("difflib").SequenceMatcher(a=before, b=after, autojunk=False)
    for tag, i1, i2, _j1, _j2 in matcher.get_opcodes():
        if tag in ("delete", "replace"):
            removed.extend(range(i1 + 1, i2 + 1))
    return sorted(set(removed))


def pick_twin(cands: list[str], other: str) -> str:
    n = other.count("\n")
    return min(cands, key=lambda s: abs(s.count("\n") - n))


def extract_pairs(csv_path: Path, max_lines: int = 80) -> tuple[list[dict], dict]:
    csv.field_size_limit(min(2**31 - 1, 10**8))
    buckets: dict[tuple[str, str], dict[str, list[str]]] = defaultdict(
        lambda: {"vulnerable": [], "safe": []}
    )
    with csv_path.open(newline="", errors="replace") as handle:
        for row in csv.DictReader(handle):
            code = (row.get("Code") or "").replace("\r\n", "\n").replace("\r", "\n")
            if not is_c(code):
                continue
            loc = code.count("\n") + 1
            if loc < 3 or loc > max_lines:
                continue
            lab = (row.get("safe/vulnerable") or "").strip().lower()
            cwe = (row.get("cwe") or "").strip().split(",")[0].strip()
            name = first_name(code)
            if not name or lab not in ("vulnerable", "safe") or not cwe:
                continue
            buckets[(name, cwe)][lab].append(code)

    dropped = {
        "paired": 0,
        "na": 0,
        "web_cwe": 0,
        "empty": 0,
        "comment_only": 0,
        "wide": 0,
        "no_sink_token": 0,
        "usable": 0,
    }
    records: list[dict] = []
    cwes: dict[str, int] = defaultdict(int)

    for (name, cwe), sides in buckets.items():
        if not sides["vulnerable"] or not sides["safe"]:
            continue
        dropped["paired"] += 1
        if cwe in {"", "N/A"}:
            dropped["na"] += 1
            continue
        if cwe in WEB_CWE:
            dropped["web_cwe"] += 1
            continue
        vul = pick_twin(sides["vulnerable"], sides["safe"][0])
        safe = pick_twin(sides["safe"], vul)
        labels = [ln for ln in line_labels_from_diff(vul, safe) if 1 <= ln <= vul.count("\n") + 1]
        if not labels:
            dropped["empty"] += 1
            continue
        labelled = [vul.split("\n")[i - 1] for i in labels]
        if all(COMMENT_ONLY.match(x or " ") or not (x or "").strip() for x in labelled):
            dropped["comment_only"] += 1
            continue
        if len(labels) > 8:
            dropped["wide"] += 1
            continue
        if not any(SINK_RE.search(x) for x in labelled):
            dropped["no_sink_token"] += 1
            continue

        dropped["usable"] += 1
        cwes[cwe] += 1
        slug = re.sub(r"[^a-zA-Z0-9_]+", "_", f"{cwe}_{name}")[:60]
        idx = dropped["usable"]
        vul_code = vul.rstrip("\n") + "\n"
        safe_code = safe.rstrip("\n") + "\n"
        records.append(
            {
                "id": f"pair_{slug}_{idx}",
                "code": vul_code,
                "func_label": 1,
                "line_labels": labels,
                "n_lines": vul_code.count("\n"),
            }
        )
        records.append(
            {
                "id": f"pair_{slug}_{idx}_ok",
                "code": safe_code,
                "func_label": 0,
                "line_labels": [],
                "n_lines": safe_code.count("\n"),
            }
        )

    return records, {
        "dropped": dropped,
        "cwes": dict(sorted(cwes.items(), key=lambda kv: -kv[1])),
        "n_pair_records": len(records),
        "n_pair_vul": sum(r["func_label"] for r in records),
    }


def split_pairs(records: list[dict], seed: int) -> dict[str, list[dict]]:
    """Keep each vul/ok twin in the same split."""
    groups: dict[str, list[dict]] = defaultdict(list)
    for rec in records:
        key = rec["id"].removesuffix("_ok")
        groups[key].append(rec)
    keys = list(groups)
    rng = random.Random(seed)
    rng.shuffle(keys)
    n = len(keys)
    n_test = max(1, int(n * 0.1))
    n_val = max(1, int(n * 0.1))
    test_k, val_k, train_k = keys[:n_test], keys[n_test : n_test + n_val], keys[n_test + n_val :]
    out = {"train": [], "val": [], "test": []}
    for name, chunk in (("test", test_k), ("val", val_k), ("train", train_k)):
        for key in chunk:
            out[name].extend(groups[key])
        rng.shuffle(out[name])
    return out


def find_csv(explicit: str | None) -> Path:
    if explicit:
        path = Path(explicit).expanduser()
        if not path.is_file():
            raise SystemExit(f"CSV not found: {path}")
        return path
    for cand in (
        ROOT.parent / "vulnerability_dataset[1].csv",
        ROOT / "vulnerability_dataset[1].csv",
    ):
        if cand.is_file():
            return cand
    raise SystemExit("vulnerability_dataset[1].csv not found next to FYP/ or linevul/")


def build(csv_path: Path, synth_dir: Path, out_dir: Path, seed: int = 1) -> dict:
    synth = {name: load_jsonl(synth_dir / f"{name}.jsonl") for name in ("train", "val", "test")}
    if not synth["train"]:
        raise SystemExit(f"Empty synth train: {synth_dir / 'train.jsonl'}")

    seen = {re.sub(r"\s+", " ", r["code"]).strip() for part in synth.values() for r in part}
    pairs, pair_stats = extract_pairs(csv_path)
    pairs = [r for r in pairs if re.sub(r"\s+", " ", r["code"]).strip() not in seen]
    split = split_pairs(pairs, seed)

    mixed = {}
    for name in ("train", "val", "test"):
        mixed[name] = list(synth[name]) + list(split[name])
        random.Random(seed + {"train": 11, "val": 22, "test": 33}[name]).shuffle(
            mixed[name]
        )
        write_jsonl(out_dir / f"{name}.jsonl", mixed[name])

    stats = {
        "kind": "cwe_synth_plus_filtered_c_pairs",
        "seed": seed,
        "csv": str(csv_path),
        "synth": {k: len(v) for k, v in synth.items()},
        "pairs_added": {k: len(split[k]) for k in split},
        "train": len(mixed["train"]),
        "val": len(mixed["val"]),
        "test": len(mixed["test"]),
        "train_vul": sum(r["func_label"] for r in mixed["train"]),
        "val_vul": sum(r["func_label"] for r in mixed["val"]),
        "test_vul": sum(r["func_label"] for r in mixed["test"]),
        "pair_extract": pair_stats,
        "note": (
            "cwe_synth kept in full. Extra rows are C-only tight patch diffs "
            "(CWE present, 1-8 changed lines, not comment-only, sink-like token). "
            "Safe twins included. Do not overwrite linevul_cwe."
        ),
    }
    (out_dir / "stats.json").write_text(json.dumps(stats, indent=2))
    return stats


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default=None)
    parser.add_argument("--synth-dir", default=str(ROOT / "data" / "cwe_synth"))
    parser.add_argument("--out-dir", default=str(ROOT / "data" / "cwe_mix"))
    parser.add_argument("--seed", type=int, default=1)
    args = parser.parse_args()
    stats = build(find_csv(args.csv), Path(args.synth_dir), Path(args.out_dir), args.seed)
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
