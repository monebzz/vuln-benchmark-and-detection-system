"""Pipeline benchmark on the paired CWE corpus.

Modes:
  quick — Flawfinder only
  full  — LineVul line head fused with Flawfinder
  model — LineVul line head alone (fusion weight 0)

Usage:
    python -m benchmark.run_benchmark
    BENCHMARK_MODE=quick python -m benchmark.run_benchmark
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
for p in (PROJECT_ROOT, PROJECT_ROOT / "frontend"):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from benchmark.cwe_corpus import get_cases, pairs
from scanner import VulnerabilityScanner


def score_line_level(predictions, labels):
    all_lines = set(predictions) | set(labels)
    tp = sum(1 for ln in all_lines if predictions.get(ln) and labels.get(ln))
    fp = sum(1 for ln in all_lines if predictions.get(ln) and not labels.get(ln))
    fn = sum(1 for ln in all_lines if not predictions.get(ln) and labels.get(ln))
    tn = sum(1 for ln in all_lines if not predictions.get(ln) and not labels.get(ln))
    prec = tp / (tp + fp) if tp + fp else 0.0
    rec = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
    denom = ((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)) ** 0.5
    mcc = ((tp * tn) - (fp * fn)) / denom if denom else 0.0
    return {
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "mcc": round(mcc, 4),
        "tp": tp,
        "fp": fp,
        "tn": tn,
        "fn": fn,
    }


def run_benchmark(mode="full"):
    scanner = VulnerabilityScanner()
    if mode == "model":
        scanner.fusion_weight = 0.0
        mode_label = "model"
    else:
        mode_label = mode

    cases = get_cases()
    results = []
    print(f"Running benchmark in {mode_label} mode...")
    print(f"Scanner status: {scanner.get_status()}")
    print(f"Model: {scanner.get_model_info()}")
    print()

    for case in cases:
        report = scanner.quick_scan(case["code"]) if mode == "quick" else scanner.full_scan(case["code"])
        preds = {r.line_number: r.is_vulnerable for r in report.lines}
        confs = {r.line_number: r.confidence for r in report.lines}
        scored = {ln: c for ln, c in confs.items() if c > 0.0}
        vuln_set = set(case["vuln_lines"])
        if case.get("accept_any"):
            hit = any(preds.get(ln, False) for ln in vuln_set)
        elif not vuln_set:
            hit = True
        else:
            hit = all(preds.get(ln, False) for ln in vuln_set)
        flagged = [ln for ln, v in preds.items() if v]
        results.append({
            "id": case["id"],
            "cwe": case["cwe"],
            "name": case["name"],
            "vulnerable": case["vulnerable"],
            "vuln_lines": list(vuln_set),
            "flagged_lines": flagged,
            "false_positives": [ln for ln in flagged if ln not in vuln_set],
            "hit": hit,
            "scan_mode": report.scan_mode,
            "scores": confs,
            "n_scored": len(scored),
            "spread": round(max(scored.values()) - min(scored.values()), 4) if scored else 0.0,
            "mean_score": round(sum(scored.values()) / len(scored), 4) if scored else 0.0,
        })

    all_preds, all_labels = {}, {}
    for case, res in zip(cases, results):
        vuln_set = set(case["vuln_lines"])
        for ln in res["scores"]:
            key = f"{res['id']}:{ln}"
            all_preds[key] = ln in res["flagged_lines"]
            all_labels[key] = ln in vuln_set
    line_metrics = score_line_level(all_preds, all_labels)

    pair_results = []
    for vuln_case, patched_case in pairs():
        vuln_res = next(r for r in results if r["id"] == vuln_case["id"])
        patch_res = next(r for r in results if r["id"] == patched_case["id"])
        pair_results.append({
            "vuln_id": vuln_case["id"],
            "patched_id": patched_case["id"],
            "vuln_flags": len(vuln_res["flagged_lines"]),
            "patched_flags": len(patch_res["flagged_lines"]),
            "correct": len(vuln_res["flagged_lines"]) > len(patch_res["flagged_lines"]),
        })
    correct_pairs = sum(1 for p in pair_results if p["correct"])

    all_scores = [s for res in results for s in res["scores"].values() if s > 0.0]
    score_dist = {
        "min": round(min(all_scores), 4),
        "max": round(max(all_scores), 4),
        "mean": round(sum(all_scores) / len(all_scores), 4),
        "spread": round(max(all_scores) - min(all_scores), 4),
    } if all_scores else {}

    return {
        "mode": mode_label,
        "total_cases": len(cases),
        "line_metrics": line_metrics,
        "pair_accuracy": round(correct_pairs / len(pair_results), 4) if pair_results else 0.0,
        "correct_pairs": correct_pairs,
        "total_pairs": len(pair_results),
        "score_distribution": score_dist,
        "per_case": results,
        "pairs": pair_results,
    }


def print_summary(summary):
    print("\n" + "=" * 80)
    print(f"BENCHMARK RESULTS — {summary['mode'].upper()} MODE")
    print("=" * 80)
    lm = summary["line_metrics"]
    print("\nLine-level metrics:")
    print(f"  Precision: {lm['precision']:.4f}")
    print(f"  Recall:    {lm['recall']:.4f}")
    print(f"  F1:        {lm['f1']:.4f}")
    print(f"  MCC:       {lm['mcc']:.4f}")
    print(f"  TP/FP/TN/FN: {lm['tp']}/{lm['fp']}/{lm['tn']}/{lm['fn']}")
    print(
        f"\nPaired accuracy (vuln > patched): {summary['pair_accuracy']:.4f}  "
        f"({summary['correct_pairs']}/{summary['total_pairs']})"
    )
    sd = summary["score_distribution"]
    if sd:
        print(f"\nScore distribution: min={sd['min']:.4f} max={sd['max']:.4f} spread={sd['spread']:.4f}")
    print(f"\n{'ID':<30s} {'Hit':<5s} {'FP':<4s} {'Spread':<8s} {'Mode':<18s}")
    print("-" * 80)
    for res in summary["per_case"]:
        mark = "Y" if res["hit"] else "N"
        print(
            f"{res['id']:<30s} {mark:<5s} {len(res['false_positives']):<4d} "
            f"{res['spread']:<8.4f} {res['scan_mode']:<18s}"
        )
    print("\nPairs (must have vuln_flags > patched_flags):")
    for p in summary["pairs"]:
        mark = "Y" if p["correct"] else "N"
        print(
            f"  {mark} {p['vuln_id']:<35s} {p['vuln_flags']:2d} flags  vs  "
            f"{p['patched_id']:<35s} {p['patched_flags']:2d} flags"
        )
    print()


def main():
    mode = os.environ.get("BENCHMARK_MODE", "full")
    summary = run_benchmark(mode=mode)
    print_summary(summary)
    out = Path(__file__).parent / "results.json"
    out.write_text(json.dumps(summary, indent=2))
    print(f"Detailed results written to {out}")


if __name__ == "__main__":
    main()
