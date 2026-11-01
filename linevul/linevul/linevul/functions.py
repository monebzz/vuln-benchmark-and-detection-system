"""Split a C/C++ snippet into top-level functions for scoring.

The line head was trained on single Big-Vul functions. Scoring a whole
translation unit (includes + several functions) collapses to ~0.
"""

from __future__ import annotations

_CONTROL = {"if", "for", "while", "switch", "else", "do", "catch", "try"}


def extract_c_functions(code: str) -> list[tuple[int, str]]:
    """Return (1-based start line, function text) for each top-level function."""
    raw = code.splitlines()
    n = len(raw)
    i = 0
    out: list[tuple[int, str]] = []
    while i < n:
        stripped = raw[i].strip()
        if not _looks_like_signature(stripped):
            i += 1
            continue
        brace_at = None
        for j in range(i, min(n, i + 6)):
            if "{" in raw[j]:
                brace_at = j
                break
            if raw[j].strip().endswith(";") and "{" not in "\n".join(raw[i : j + 1]):
                break
        if brace_at is None:
            i += 1
            continue
        depth = 0
        started = False
        k = i
        acc = []
        while k < n:
            acc.append(raw[k])
            for ch in raw[k]:
                if ch == "{":
                    depth += 1
                    started = True
                elif ch == "}":
                    depth -= 1
            if started and depth <= 0:
                out.append((i + 1, "\n".join(acc) + "\n"))
                i = k + 1
                break
            k += 1
        else:
            i += 1
    return out


def _looks_like_signature(stripped: str) -> bool:
    if not stripped or "(" not in stripped:
        return False
    if stripped.startswith(("#", "//", "*", "}", "return ")):
        return False
    head = stripped.split("(", 1)[0].strip().split()
    if not head:
        return False
    name = head[-1].lstrip("*&")
    if name in _CONTROL:
        return False
    if stripped.endswith(";") and "{" not in stripped:
        return False
    return True
