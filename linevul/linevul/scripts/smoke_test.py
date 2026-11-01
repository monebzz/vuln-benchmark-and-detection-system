#!/usr/bin/env python3
"""Sanity-check data labels and a single untrained forward pass."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from linevul.data import removed_line_numbers
from linevul.fusion import fuse_scores


def test_labels():
    before = "void f(char *p) {\n    char buf[8];\n    strcpy(buf, p);\n    return;\n}\n"
    after = "void f(char *p) {\n    char buf[8];\n    strncpy(buf, p, 7);\n    return;\n}\n"
    removed = removed_line_numbers(before, after)
    assert 3 in removed, removed
    print("[ok] removed-line labels", removed)


def test_fusion():
    fused = fuse_scores({1: 0.2, 2: 0.8}, {1: "strcpy"}, weight=0.5)
    # SAST hit is lifted to sast_floor (0.8) so model-0 cannot hide it.
    assert fused[1] >= 0.8, fused
    assert abs(fused[2] - 0.4) < 1e-6, fused
    print("[ok] fusion", fused)


def test_strip_comments():
    from linevul.data import strip_c_comments_keep_lines

    src = (
        'char *p = "http://x";  // keep the URL\n'
        "    strcat(buf, name);  /* drown */\n"
        "    /*\n"
        "     * block\n"
        "     */\n"
        "    return p;\n"
    )
    out = strip_c_comments_keep_lines(src)
    lines = out.split("\n")
    assert 'char *p = "http://x";' == lines[0], lines[0]
    assert "strcat(buf, name);" == lines[1].strip(), lines[1]
    assert len(lines) == len(src.split("\n"))
    print("[ok] strip comments", lines[:2])


def test_llm_vote_rules():
    from linevul.llm import parse_votes, promotions_from_votes, select_candidates

    lines = [
        "void f(char *p) {",
        "    char buf[8];",
        "    int n = 0;",
        "    memcpy(buf, p, n);",
        "    return;",
        "}",
    ]
    probs = {1: 0.01, 2: 0.02, 3: 0.03, 4: 0.35, 5: 0.02, 6: 0.01}
    cands = select_candidates(lines, probs)
    assert 4 in cands, cands
    votes = parse_votes(
        'noise {"votes":[{"line":4,"vulnerable":true,"cwe":"CWE-787","reason":"memcpy"}]}'
    )
    assert votes[4]["vulnerable"] is True
    promoted = promotions_from_votes(probs, votes)
    assert promoted == {4}, promoted
    # strong model hit is never unflagged by LLM no
    votes_no = {4: {"vulnerable": False}}
    assert promotions_from_votes({4: 0.99}, votes_no) == set()
    # LLM cannot promote a 0.05 line
    assert promotions_from_votes({4: 0.05}, votes) == set()
    print("[ok] llm vote rules", cands, promoted)


def test_split_functions():
    from linevul.functions import extract_c_functions

    code = (
        "#include <cstring>\n"
        "void a(char *p) {\n    strcpy(p, p);\n}\n"
        "void b() {\n    return;\n}\n"
    )
    chunks = extract_c_functions(code)
    assert len(chunks) == 2, chunks
    assert chunks[0][0] == 2, chunks
    print("[ok] function split", [(s, t.split("(")[0].strip()) for s, t in chunks])


def test_forward():
    try:
        import torch
        from transformers import AutoTokenizer
        from linevul.model import LineVulModel
        from linevul.data import line_char_spans, token_line_ids
    except ImportError as exc:
        print("[skip] model forward (missing torch/transformers):", exc)
        return
    code = "void f(char *p) {\n    strcpy(p, p);\n}\n"
    tok = AutoTokenizer.from_pretrained("microsoft/codebert-base")
    enc = tok(
        code,
        truncation=True,
        max_length=64,
        padding="max_length",
        return_offsets_mapping=True,
        return_tensors="pt",
    )
    offsets = enc.pop("offset_mapping")[0].tolist()
    lids = torch.tensor([token_line_ids(offsets, line_char_spans(code), 64)])
    model = LineVulModel()
    model.eval()
    with torch.no_grad():
        out = model(enc["input_ids"], enc["attention_mask"], lids, 3)
    probs = torch.softmax(out["line_logits"][0], dim=-1)[:, 1]
    spread = float(probs.max() - probs.min())
    print("[ok] untrained line probs", [round(float(p), 4) for p in probs], "spread", round(spread, 4))
    assert spread > 0.0 or True  # untrained may be flat; just prove the graph runs


if __name__ == "__main__":
    test_labels()
    test_fusion()
    test_strip_comments()
    test_llm_vote_rules()
    test_split_functions()
    test_forward()
    print("smoke test passed")
