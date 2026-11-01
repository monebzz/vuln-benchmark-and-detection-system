"""
Attention attribution and normalization utilities for LineVul.
Implements real min-max normalization, configurable top-k hotspot selection,
and prevents hard-zeroing of non-hotspot lines.
"""

from __future__ import annotations
from typing import Any
import config


def normalize_line_attention(
    raw_lines: list[dict[str, Any]],
    is_vulnerable: bool,
    top_k: int = config.HOTSPOT_TOP_K,
    min_score: float = config.HOTSPOT_MIN_SCORE,
) -> tuple[list[dict[str, Any]], int]:
    """
    Perform min-max normalization over all lines in [0, 1] and mark hotspots.

    Args:
        raw_lines: List of dicts with 'line_no', 'code', 'attention_score'.
        is_vulnerable: Whether the file is classified as vulnerable.
        top_k: Maximum number of hotspots to flag (default 5).
        min_score: Minimum normalized score required to qualify as hotspot (default 0.60).

    Returns:
        tuple of (processed_lines, hotspot_count)
    """
    if not raw_lines:
        return [], 0

    scores = [float(l.get("attention_score", 0.0)) for l in raw_lines]
    min_s = min(scores)
    max_s = max(scores)
    span = max_s - min_s

    processed: list[dict[str, Any]] = []
    candidates: list[tuple[int, float, float]] = []  # (index, raw_score, norm_score)

    for idx, item in enumerate(raw_lines):
        raw = float(item.get("attention_score", 0.0))
        if span > 1e-9:
            norm = (raw - min_s) / span
        elif max_s > 0:
            norm = 1.0
        else:
            norm = 0.0

        norm = max(0.0, min(1.0, float(norm)))
        norm_rounded = round(norm, 4)

        line_entry = {
            "line_no": item["line_no"],
            "code": item["code"],
            "attention_score": round(raw, 6),
            "normalized_score": norm_rounded,
            "is_hotspot": False,
        }
        processed.append(line_entry)
        candidates.append((idx, raw, norm_rounded))

    hotspot_indices: set[int] = set()
    if is_vulnerable:
        # Filter by minimum normalized score threshold
        qualifying = [c for c in candidates if c[2] >= min_score]
        # Sort descending by raw score, tiebreak by earlier line_no
        qualifying.sort(key=lambda x: (-x[1], x[0]))
        # Take top-k
        for c in qualifying[:top_k]:
            hotspot_indices.add(c[0])

    for idx in hotspot_indices:
        processed[idx]["is_hotspot"] = True

    return processed, len(hotspot_indices)
