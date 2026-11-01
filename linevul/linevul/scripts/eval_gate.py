#!/usr/bin/env python3
"""Ship-gate: line-detector table, then line-head probe + fused pipeline."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
for p in (ROOT, ROOT / "frontend", ROOT / "scripts"):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from benchmark.probe_model import main as probe_main
from benchmark.run_benchmark import print_summary, run_benchmark
from compare_line_detectors import main as compare_main


def main():
    print("=== line-detector comparison (CWE pairs) ===")
    rows = compare_main() or []
    by = {r["method"]: r for r in rows}

    print("\n=== threshold-free probe (line head only) ===")
    probe = probe_main()
    print("\n=== full pipeline (line head + Flawfinder fusion) ===")
    summary = run_benchmark(mode="full")
    print_summary(summary)
    (ROOT / "benchmark" / "results.json").write_text(json.dumps(summary, indent=2))

    ff, attn, line = by.get("flawfinder"), by.get("attention"), by.get("line_head")
    auc = (probe or {}).get("mean_pairwise_auc")
    wins = (probe or {}).get("paired_wins")
    pairs_n = (probe or {}).get("paired_total")
    mcc = summary["line_metrics"]["mcc"]
    print("\nTarget: beat Flawfinder and attention on pairwise AUC / paired wins.")
    print("  Do not chase LineVul's paper F1 (0.91) on Big-Vul — that set leaks.")
    if ff:
        print(f"  Flawfinder   AUC={ff.get('pairwise_auc')}  pairs={ff.get('paired_wins')}  MCC={ff.get('mcc')}")
    if attn:
        print(f"  Attention    AUC={attn.get('pairwise_auc')}  pairs={attn.get('paired_wins')}")
    if line:
        print(f"  Line head    AUC={line.get('pairwise_auc')}  pairs={line.get('paired_wins')}  MCC={line.get('mcc')}")
    print(f"  Probe AUC    {auc}   paired wins {wins}/{pairs_n}   fused MCC {mcc}")
    line_auc = (line or {}).get("pairwise_auc")
    ff_auc = (ff or {}).get("pairwise_auc")
    attn_auc = (attn or {}).get("pairwise_auc") or 0
    if auc is not None and auc < 0.60:
        print("  INVESTIGATE: ranking is still near chance. Train with ranking loss; do not scale data.")
    elif line_auc and ff_auc and line_auc > ff_auc and line_auc > attn_auc:
        print("  line head is ahead of both baselines on AUC.")
    else:
        print("  Not ahead of both baselines yet — keep the ranking-loss run.")


if __name__ == "__main__":
    main()
