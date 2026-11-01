"""Late fusion of the supervised line head with Flawfinder hits."""

from __future__ import annotations

from typing import Mapping


def fuse_scores(
    line_probs: Mapping[int, float],
    flawfinder_hits: Mapping[int, str],
    weight: float = 0.35,
    sast_floor: float = 0.8,
) -> dict[int, float]:
    """Mix model probability with a binary SAST hit.

    mixed = (1 - w) * p_line + w * 1[flawfinder]
    A Flawfinder hit is then lifted to at least ``sast_floor`` so a model
    score of ~0 cannot hide a SAST finding below the 0.5 flag threshold.
    """
    weight = min(max(float(weight), 0.0), 1.0)
    floor = min(max(float(sast_floor), 0.0), 1.0)
    keys = set(line_probs) | set(flawfinder_hits)
    fused = {}
    for ln in keys:
        p = float(line_probs.get(ln, 0.0))
        sast = 1.0 if ln in flawfinder_hits else 0.0
        mixed = (1.0 - weight) * p + weight * sast
        fused[ln] = max(mixed, floor) if sast else mixed
    return fused


def grid_best_weight(
    cases: list[tuple[dict[int, float], set[int], set[int]]],
    weights=None,
) -> float:
    """Pick the fusion weight that maximises line-level MCC on labelled cases.

    Each case is (line_probs, flawfinder_line_set, gold_vuln_lines).
    """
    if weights is None:
        weights = [i / 20 for i in range(21)]
    best_w, best_mcc = 0.35, -1.0
    for w in weights:
        tp = fp = tn = fn = 0
        for probs, sast_lines, gold in cases:
            fused = fuse_scores(probs, {ln: "" for ln in sast_lines}, weight=w)
            for ln, p in fused.items():
                pred = p >= 0.5
                label = ln in gold
                if pred and label:
                    tp += 1
                elif pred and not label:
                    fp += 1
                elif (not pred) and label:
                    fn += 1
                else:
                    tn += 1
        denom = ((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)) ** 0.5
        mcc = ((tp * tn) - (fp * fn)) / denom if denom > 0 else 0.0
        if mcc > best_mcc:
            best_mcc, best_w = mcc, w
    return best_w
