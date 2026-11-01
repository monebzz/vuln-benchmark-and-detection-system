#!/usr/bin/env python3
"""Compare Flawfinder, attention ranking, and the supervised line head.

This is the FYP table: beat other *line* detectors, not copy LineVul's paper numbers.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
for p in (ROOT, ROOT / "frontend"):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from benchmark.cwe_corpus import get_cases, pairs
from benchmark.probe_model import pairwise_auc, rank_of_labelled
from benchmark.run_benchmark import score_line_level
from linevul.infer import LineVulPredictor
from scanner import FlawfinderScanner


def _mcc_at_threshold(score_maps, gold_maps, threshold):
    preds, labels = {}, {}
    for cid, scores in score_maps.items():
        gold = gold_maps[cid]
        for ln, s in scores.items():
            key = f"{cid}:{ln}"
            preds[key] = s >= threshold
            labels[key] = ln in gold
    return score_line_level(preds, labels)


def _paired_wins(score_maps):
    wins = 0
    n = 0
    for vuln, patched in pairs():
        v = score_maps.get(vuln["id"], {})
        p = score_maps.get(patched["id"], {})
        if not v or not p:
            continue
        n += 1
        if max(v.values()) > max(p.values()):
            wins += 1
    return wins, n


def _ranking(score_maps, gold_maps):
    aucs, top1 = [], 0
    labelled = 0
    for cid, gold in gold_maps.items():
        if not gold:
            continue
        scores = score_maps.get(cid, {})
        if not scores:
            continue
        labelled += 1
        auc = pairwise_auc(scores, gold)
        if auc is not None:
            aucs.append(auc)
        rank, _n = rank_of_labelled(scores, gold)
        if rank == 1:
            top1 += 1
    return {
        "pairwise_auc": round(sum(aucs) / len(aucs), 4) if aucs else None,
        "top1": top1,
        "n_labelled": labelled,
    }


def main():
    cases = get_cases()
    gold = {c["id"]: set(c["vuln_lines"]) for c in cases}

    ff = {}
    for c in cases:
        hits = FlawfinderScanner.scan(c["code"])
        n = max(len(c["code"].splitlines()), 1)
        ff[c["id"]] = {i: (1.0 if i in hits else 0.0) for i in range(1, n + 1)}

    model = LineVulPredictor()
    attn, line = {}, {}
    if model.available:
        print(f"checkpoint: {model.summary}")
        for c in cases:
            attn[c["id"]] = model.score_attention(c["code"])
            line[c["id"]] = model.score_lines(c["code"])
    else:
        print("No LineVul checkpoint — attention/line-head rows will be empty.")

    rows = []
    methods = [
        ("flawfinder", ff, 0.5),
        ("attention", attn, None),
        ("line_head", line, 0.5),
    ]
    print(f"\n{'method':<12} {'AUC':>7} {'top1':>8} {'pairs':>8} {'MCC':>8}")
    print("-" * 48)
    for name, scores, thr in methods:
        rank = _ranking(scores, gold)
        wins, n_pairs = _paired_wins(scores)
        mcc = None
        if thr is not None and scores:
            mcc = _mcc_at_threshold(scores, gold, thr)["mcc"]
        row = {
            "method": name,
            "pairwise_auc": rank["pairwise_auc"],
            "top1": f"{rank['top1']}/{rank['n_labelled']}",
            "paired_wins": f"{wins}/{n_pairs}",
            "mcc": mcc,
        }
        rows.append(row)
        auc = "n/a" if row["pairwise_auc"] is None else f"{row['pairwise_auc']:.4f}"
        mcc_s = "n/a" if mcc is None else f"{mcc:.4f}"
        print(f"{name:<12} {auc:>7} {row['top1']:>8} {row['paired_wins']:>8} {mcc_s:>8}")

    print("\nWin = higher pairwise AUC and more paired wins than Flawfinder and attention.")
    out = ROOT / "benchmark" / "compare_results.json"
    out.write_text(json.dumps({"rows": rows, "hparams": model.summary if model.available else {}}, indent=2))
    print(f"Wrote {out}")
    return rows


if __name__ == "__main__":
    main()
