"""Threshold-free ranking probe for the trained LineVul line head.

Same measurements as the LineVD probe: rank of the labelled line and
pairwise AUC. Joern is not involved.

Usage:  python -m benchmark.probe_model
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from benchmark.cwe_corpus import get_cases, pairs
from linevul.infer import LineVulPredictor


def rank_of_labelled(scores, vuln_lines):
    scored = list(scores.items())
    if not scored:
        return None, 0
    ordered = sorted(scored, key=lambda kv: -kv[1])
    for rank, (ln, _) in enumerate(ordered, start=1):
        if ln in vuln_lines:
            return rank, len(ordered)
    return None, len(ordered)


def pairwise_auc(scores, vuln_lines):
    pos = [s for ln, s in scores.items() if ln in vuln_lines]
    neg = [s for ln, s in scores.items() if ln not in vuln_lines]
    if not pos or not neg:
        return None
    wins = sum((p > n) + 0.5 * (p == n) for p in pos for n in neg)
    return wins / (len(pos) * len(neg))


def main():
    model = LineVulPredictor()
    if not model.available:
        print("LineVul unavailable — train a checkpoint into checkpoints/ first.")
        print(f"  load_error: {model.load_error}")
        return None
    print(f"hparams: {model.summary}\n")

    cases = get_cases()
    rows, aucs, ranks = [], [], []
    score_cache = {}

    for case in cases:
        scores = model.score_lines(case["code"])
        score_cache[case["id"]] = scores
        vuln = set(case["vuln_lines"])
        if not scores:
            print(f"{case['id']:<32s} NO SCORES")
            rows.append({"id": case["id"], "error": "no_scores"})
            continue
        vals = list(scores.values())
        row = {
            "id": case["id"],
            "cwe": case["cwe"],
            "n_scored": len(scores),
            "min": round(min(vals), 4),
            "max": round(max(vals), 4),
            "spread": round(max(vals) - min(vals), 4),
            "scores": {int(k): round(v, 4) for k, v in scores.items()},
        }
        if vuln:
            rank, n = rank_of_labelled(scores, vuln)
            auc = pairwise_auc(scores, vuln)
            row["best_rank"] = rank
            row["n_lines"] = n
            row["pairwise_auc"] = round(auc, 4) if auc is not None else None
            if rank is not None:
                ranks.append((rank, n))
            if auc is not None:
                aucs.append(auc)
            print(
                f"{case['id']:<32s} rank={rank}/{n}  auc={row['pairwise_auc']}  "
                f"spread={row['spread']:.4f}"
            )
        else:
            print(f"{case['id']:<32s} clean  spread={row['spread']:.4f}")
        rows.append(row)

    pair_wins = 0
    pair_margins = []
    pair_list = pairs()
    for vuln_case, patched_case in pair_list:
        v = score_cache.get(vuln_case["id"], {})
        p = score_cache.get(patched_case["id"], {})
        vmax = max(v.values()) if v else 0.0
        pmax = max(p.values()) if p else 0.0
        if vmax > pmax:
            pair_wins += 1
        pair_margins.append(vmax - pmax)

    summary = {
        "hparams": model.summary,
        "mean_pairwise_auc": round(sum(aucs) / len(aucs), 4) if aucs else None,
        "labelled_top1": sum(1 for r, _n in ranks if r == 1),
        "labelled_top3": sum(1 for r, _n in ranks if r is not None and r <= 3),
        "n_labelled": len(ranks),
        "paired_wins": pair_wins,
        "paired_total": len(pair_list),
        "mean_paired_margin": round(sum(pair_margins) / len(pair_margins), 4)
        if pair_margins
        else None,
        "cases": rows,
    }
    print("\nMean pairwise AUC over labelled cases:", summary["mean_pairwise_auc"])
    print(f"Labelled line ranked #1:              {summary['labelled_top1']}/{summary['n_labelled']}")
    print(f"Labelled line in top 3:               {summary['labelled_top3']}/{summary['n_labelled']}")
    print(f"Vulnerable twin peaks higher:         {pair_wins}/{len(pair_list)}")
    out = Path(__file__).parent / "probe_results.json"
    out.write_text(json.dumps(summary, indent=2))
    print(f"\nWrote {out}")
    return summary


if __name__ == "__main__":
    main()
