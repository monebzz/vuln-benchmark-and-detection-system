"""Big-Vul loaders, removed-line labels, and the 8–15k training subset."""

from __future__ import annotations

import csv
import difflib
import json
import random
from pathlib import Path
from typing import Iterable, Optional

try:
    import torch
    from torch.utils.data import Dataset
except ImportError:  # subset prep does not need torch
    torch = None
    Dataset = object

csv.field_size_limit(min(2**31 - 1, 10**8))

CODE_KEYS = ("func_before", "processed_func", "func", "before")
AFTER_KEYS = ("func_after", "after")
LABEL_KEYS = ("vul", "target", "label")
ID_KEYS = ("id", "", "Unnamed: 0")

TRUE_VALUES = {"1", "1.0", "true", "yes"}


def parse_bool(value) -> int:
    if value is None:
        return 0
    return int(str(value).strip().lower() in TRUE_VALUES)


def first_present(row: dict, keys: Iterable[str], default=""):
    for key in keys:
        if key in row and row[key] not in (None, ""):
            return row[key]
    return default


def normalize_code(text: str) -> str:
    if not text:
        return ""
    return str(text).replace("\r\n", "\n").replace("\r", "\n")


def strip_c_comments_keep_lines(code: str) -> str:
    """Drop // and /* */ comments without changing line numbers.

    The line head mean-pools every token on a line. A long English comment
    on the same line as strcpy/strcat drowns the sink and the score collapses.
    String literals are left intact (so URLs in quotes stay).
    """
    code = normalize_code(code)
    out: list[str] = []
    in_block = False
    for line in code.split("\n"):
        chars: list[str] = []
        i = 0
        in_str = None
        while i < len(line):
            if in_block:
                if i + 1 < len(line) and line[i : i + 2] == "*/":
                    in_block = False
                    i += 2
                    continue
                i += 1
                continue
            ch = line[i]
            if in_str:
                chars.append(ch)
                if ch == "\\" and i + 1 < len(line):
                    chars.append(line[i + 1])
                    i += 2
                    continue
                if ch == in_str:
                    in_str = None
                i += 1
                continue
            if ch in ("'", '"'):
                in_str = ch
                chars.append(ch)
                i += 1
                continue
            if i + 1 < len(line) and line[i : i + 2] == "//":
                break
            if i + 1 < len(line) and line[i : i + 2] == "/*":
                in_block = True
                i += 2
                continue
            chars.append(ch)
            i += 1
        out.append("".join(chars).rstrip())
    return "\n".join(out)


def line_char_spans(code: str) -> list[tuple[int, int, int]]:
    """Return (1-based line number, start_char, end_char) for each line."""
    spans = []
    start = 0
    for i, line in enumerate(code.split("\n"), start=1):
        end = start + len(line)
        spans.append((i, start, end))
        start = end + 1
    return spans


def removed_line_numbers(before: str, after: str) -> list[int]:
    """1-based line numbers deleted or replaced in `before` vs `after`."""
    before = normalize_code(before)
    after = normalize_code(after)
    if not before or before == after:
        return []
    removed = []
    matcher = difflib.SequenceMatcher(
        a=before.split("\n"), b=after.split("\n"), autojunk=False
    )
    for tag, i1, i2, _j1, _j2 in matcher.get_opcodes():
        if tag in ("delete", "replace"):
            removed.extend(range(i1 + 1, i2 + 1))
    return removed


def record_from_row(row: dict) -> Optional[dict]:
    code = normalize_code(first_present(row, CODE_KEYS))
    if not code.strip():
        return None
    after = normalize_code(first_present(row, AFTER_KEYS))
    vul = parse_bool(first_present(row, LABEL_KEYS, default="0"))
    line_labels = removed_line_numbers(code, after) if vul and after else []
    rec_id = first_present(row, ID_KEYS, default="")
    return {
        "id": str(rec_id),
        "code": code,
        "func_label": vul,
        "line_labels": line_labels,
        "n_lines": code.count("\n") + 1,
    }


def iter_csv(path: Path) -> Iterable[dict]:
    with path.open(newline="", errors="replace") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rec = record_from_row(row)
            if rec is not None:
                yield rec


def default_source_csv(project_root: Path) -> Path:
    """Prefer the full Big-Vul dump, then the trimmed copy, then local data/."""
    candidates = [
        project_root / "data" / "MSR_data_cleaned.csv",
        project_root.parent / "linevd" / "data" / "MSR_data_cleaned.csv",
        project_root.parent / "linevd" / "data" / "MSR_data_trimmed.csv",
        project_root / "data" / "MSR_data_trimmed.csv",
    ]
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError(
        "No Big-Vul CSV found. Place MSR_data_cleaned.csv under linevul/data/ "
        "or keep it at linevd/data/MSR_data_cleaned.csv"
    )


def build_subset(
    source: Path,
    out_dir: Path,
    max_samples: int = 12000,
    seed: int = 1,
    val_ratio: float = 0.1,
    test_ratio: float = 0.1,
) -> dict:
    """Stratified 8–15k subset: every usable vulnerable function + matched clean."""
    random.seed(seed)
    vul = []
    # Reservoir of clean functions so we never hold all ~177k in RAM.
    clean_res, n_clean_seen = [], 0
    clean_res_size = max_samples
    for rec in iter_csv(source):
        if rec["func_label"] == 1:
            vul.append(rec)
            continue
        n_clean_seen += 1
        if len(clean_res) < clean_res_size:
            clean_res.append(rec)
        else:
            j = random.randrange(n_clean_seen)
            if j < clean_res_size:
                clean_res[j] = rec

    # Keep vulnerable functions that actually have a removed-line label first.
    vul_with_lines = [r for r in vul if r["line_labels"]]
    vul_no_lines = [r for r in vul if not r["line_labels"]]
    random.shuffle(vul_with_lines)
    random.shuffle(vul_no_lines)
    vul_ordered = vul_with_lines + vul_no_lines

    n_vul_budget = min(len(vul_ordered), max_samples // 2)
    chosen_vul = vul_ordered[:n_vul_budget]
    n_clean = min(len(clean_res), len(chosen_vul), max_samples - len(chosen_vul))
    random.shuffle(clean_res)
    chosen_clean = clean_res[:n_clean]
    chosen = chosen_vul + chosen_clean
    random.shuffle(chosen)

    n = len(chosen)
    n_test = max(1, int(n * test_ratio))
    n_val = max(1, int(n * val_ratio))
    test = chosen[:n_test]
    val = chosen[n_test : n_test + n_val]
    train = chosen[n_test + n_val :]

    out_dir.mkdir(parents=True, exist_ok=True)
    splits = {"train": train, "val": val, "test": test}
    for name, rows in splits.items():
        dest = out_dir / f"{name}.jsonl"
        with dest.open("w") as handle:
            for row in rows:
                handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    stats = {
        "source": str(source),
        "max_samples": max_samples,
        "n_vul_available": len(vul),
        "n_vul_with_line_labels": len(vul_with_lines),
        "n_clean_available": n_clean_seen,
        "train": len(train),
        "val": len(val),
        "test": len(test),
        "train_vul": sum(r["func_label"] for r in train),
        "val_vul": sum(r["func_label"] for r in val),
        "test_vul": sum(r["func_label"] for r in test),
    }
    (out_dir / "stats.json").write_text(json.dumps(stats, indent=2))
    return stats


def load_jsonl(path: Path) -> list[dict]:
    rows = []
    with path.open() as handle:
        for line in handle:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def token_line_ids(offset_mapping, line_spans, seq_len: int) -> list[int]:
    ids = [0] * seq_len
    # Skip empty lines so a newline token cannot steal the sink's score.
    usable = [(ln, ls, le) for ln, ls, le in line_spans if le > ls]
    for t, pair in enumerate(offset_mapping):
        start, end = int(pair[0]), int(pair[1])
        if start == end == 0:
            continue
        for ln, ls, le in usable:
            if start < le and end > ls:
                ids[t] = ln
                break
    return ids


class BigVulLineDataset(Dataset):
    """Tokenized functions with per-line labels for the supervised line head."""

    def __init__(self, records: list[dict], tokenizer, max_length: int = 512):
        if torch is None:
            raise ImportError("torch is required to build the training dataset")
        self.records = records
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        rec = self.records[idx]
        code = rec["code"]
        spans = line_char_spans(code)
        encoded = self.tokenizer(
            code,
            truncation=True,
            max_length=self.max_length,
            padding="max_length",
            return_offsets_mapping=True,
            return_tensors="pt",
        )
        offsets = encoded.pop("offset_mapping")[0].tolist()
        line_ids = token_line_ids(offsets, spans, self.max_length)
        n_lines = rec["n_lines"]
        vuln_set = set(rec["line_labels"])
        line_labels = [1 if i in vuln_set else 0 for i in range(1, n_lines + 1)]
        return {
            "input_ids": encoded["input_ids"].squeeze(0),
            "attention_mask": encoded["attention_mask"].squeeze(0),
            "line_ids": torch.tensor(line_ids, dtype=torch.long),
            "func_label": torch.tensor(rec["func_label"], dtype=torch.long),
            "line_labels": torch.tensor(line_labels, dtype=torch.long),
            "n_lines": n_lines,
        }


def collate_batch(batch, max_lines: int = 128):
    if torch is None:
        raise ImportError("torch is required to collate training batches")
    input_ids = torch.stack([b["input_ids"] for b in batch])
    attention_mask = torch.stack([b["attention_mask"] for b in batch])
    line_ids = torch.stack([b["line_ids"] for b in batch])
    func_label = torch.stack([b["func_label"] for b in batch])

    L = min(max_lines, max(b["n_lines"] for b in batch))
    line_labels = torch.zeros(len(batch), L, dtype=torch.long)
    line_mask = torch.zeros(len(batch), L, dtype=torch.bool)
    for i, item in enumerate(batch):
        n = min(item["n_lines"], L)
        line_labels[i, :n] = item["line_labels"][:n]
        present = set(item["line_ids"].tolist())
        for ln in range(1, n + 1):
            if ln in present:
                line_mask[i, ln - 1] = True
    return {
        "input_ids": input_ids,
        "attention_mask": attention_mask,
        "line_ids": line_ids,
        "func_label": func_label,
        "line_labels": line_labels,
        "line_mask": line_mask,
    }


def line_class_weight(records: list[dict]) -> float:
    pos = sum(len(r["line_labels"]) for r in records)
    tot = sum(r["n_lines"] for r in records)
    neg = max(tot - pos, 1)
    pos = max(pos, 1)
    return neg / pos
