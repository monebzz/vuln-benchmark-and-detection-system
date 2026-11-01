#!/usr/bin/env python3
"""CWE gate with and without the standalone Ollama reranker.

Does not write the mix baseline files. Fail-open if Ollama is missing.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

_plat = sys.platform
sys.platform = "linux"
import torch  # noqa: E402, F401
sys.platform = _plat

from benchmark.cwe_corpus import get_cases, pairs
from benchmark.probe_model import rank_of_labelled
from compare_line_detectors import _mcc_at_threshold, _paired_wins, _ranking
from linevul.infer import LineVulPredictor
from linevul.llm import OllamaReranker, promotions_from_votes, select_candidates


def _flag_scores(line_probs: dict, promoted: set[int], threshold: float = 0.5) -> dict:
    """Binary scores for MCC: model >= 0.5 or LLM promotion."""
    out = {}
    for ln, p in line_probs.items():
        out[ln] = 1.0 if (p >= threshold or ln in promoted) else 0.0
    return out


def main():
    pred = LineVulPredictor()
    if not pred.available:
        print("No LineVul checkpoint.")
        sys.exit(1)
    print("checkpoint:", pred.summary.get("checkpoint"))

    reranker = OllamaReranker()
    ollama_ok = reranker.available(force=True)
    print("ollama:", reranker.model, "available" if ollama_ok else "MISSING — mix-only numbers only")

    cases = get_cases()
    gold = {c["id"]: set(c["vuln_lines"]) for c in cases}
    mix_maps, llm_maps, flags = {}, {}, {}

    for case in cases:
        raw = case["code"].splitlines()
        probs = pred.score(case["code"])["line_probs"]
        mix_maps[case["id"]] = probs
        promoted: set[int] = set()
        if ollama_ok:
            decision = reranker.enrich(case["code"], raw, probs, enabled=True)
            promoted = decision.promoted
            if decision.error:
                print(f"  llm {case['id']}: {decision.error}")
        llm_maps[case["id"]] = dict(probs)
        for ln in promoted:
            llm_maps[case["id"]][ln] = max(float(llm_maps[case["id"]].get(ln, 0.0)), 0.6)
        flags[case["id"]] = _flag_scores(probs, promoted)

    mix_rank = _ranking(mix_maps, gold)
    mix_wins, n_pairs = _paired_wins(mix_maps)
    mix_mcc = _mcc_at_threshold(mix_maps, gold, 0.5)["mcc"]
    llm_rank = _ranking(llm_maps, gold)
    llm_wins, _ = _paired_wins(llm_maps)
    llm_mcc = _mcc_at_threshold(flags, gold, 0.5)["mcc"]

    print("\n=== mix only (linevul_cwe_mix) ===")
    print(
        f"AUC={mix_rank['pairwise_auc']}  top1={mix_rank['top1']}/{mix_rank['n_labelled']}  "
        f"pairs={mix_wins}/{n_pairs}  MCC={mix_mcc:.4f}"
    )
    print("=== mix + LLM promotions ===")
    print(
        f"AUC={llm_rank['pairwise_auc']}  top1={llm_rank['top1']}/{llm_rank['n_labelled']}  "
        f"pairs={llm_wins}/{n_pairs}  MCC={llm_mcc:.4f}"
    )

    print("\n=== labelled sinks ===")
    for case in cases:
        vuln = gold[case["id"]]
        if not vuln:
            continue
        mix_r, n = rank_of_labelled(mix_maps[case["id"]], vuln)
        llm_r, _ = rank_of_labelled(llm_maps[case["id"]], vuln)
        sink = next(iter(vuln))
        p = mix_maps[case["id"]].get(sink, 0.0)
        cands = select_candidates(case["code"].splitlines(), mix_maps[case["id"]])
        print(
            f"{case['id']:<32s} mix_rank={mix_r}/{n}  llm_rank={llm_r}  "
            f"sink_p={p:.3f}  cands={cands}"
        )

    out = {
        "mix": {
            "pairwise_auc": mix_rank["pairwise_auc"],
            "top1": mix_rank["top1"],
            "paired_wins": mix_wins,
            "mcc": mix_mcc,
        },
        "mix_llm": {
            "pairwise_auc": llm_rank["pairwise_auc"],
            "top1": llm_rank["top1"],
            "paired_wins": llm_wins,
            "mcc": llm_mcc,
            "ollama": ollama_ok,
        },
    }
    dest = ROOT / "benchmark" / "llm_rerank_results.json"
    dest.write_text(json.dumps(out, indent=2))
    print(f"\nWrote {dest}")

    if not ollama_ok:
        print("KEEP mix default. Install: ollama pull qwen2.5-coder:7b")
        sys.exit(0)
    mix_auc = mix_rank["pairwise_auc"] or 0
    llm_auc = llm_rank["pairwise_auc"] or 0
    ok = llm_auc + 1e-9 >= mix_auc and llm_rank["top1"] >= mix_rank["top1"]
    print("SHIP LLM default?" , "YES" if ok else "NO — keep mix-only flags")
    sys.exit(0 if ok else 2)


if __name__ == "__main__":
    main()
