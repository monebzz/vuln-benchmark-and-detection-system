#!/usr/bin/env python3
"""Build the stratified 8–15k Big-Vul subset used for the first training run."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from linevul.data import build_subset, default_source_csv


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--source", default=None, help="Big-Vul CSV (MSR or LineVul split)")
    p.add_argument("--out-dir", default=str(ROOT / "data" / "subset"))
    p.add_argument("--max-samples", type=int, default=12000)
    p.add_argument("--seed", type=int, default=1)
    args = p.parse_args()

    source = Path(args.source) if args.source else default_source_csv(ROOT)
    print(f"[prepare] source={source}")
    stats = build_subset(source, Path(args.out_dir), max_samples=args.max_samples, seed=args.seed)
    print("[prepare] subset written:")
    for key, value in stats.items():
        print(f"  {key}: {value}")
    n = stats["train"] + stats["val"] + stats["test"]
    if n < 8000:
        print(
            f"[prepare] NOTE: only {n} samples. The 8–15k target needs the full "
            "MSR_data_cleaned.csv (~10k vulnerable functions), not the 3k trimmed file."
        )


if __name__ == "__main__":
    main()
