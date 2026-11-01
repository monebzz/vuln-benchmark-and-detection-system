"""Standalone Ollama 7B line reranker.

No imports from infer, fusion, scanner, or Streamlit. The line head still
owns ranking. This module only: pick a few candidate lines, ask Ollama
yes/no, and return promotions. Fail-open on any error.
"""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Mapping, Optional

DEFAULT_HOST = os.environ.get("LINEVUL_OLLAMA_HOST", "http://127.0.0.1:11434")
DEFAULT_MODEL = os.environ.get("LINEVUL_OLLAMA_MODEL", "qwen2.5-coder:7b")
TOP_K = int(os.environ.get("LINEVUL_LLM_TOPK", "5"))
MAX_CANDIDATES = int(os.environ.get("LINEVUL_LLM_MAX", "8"))
PROMOTE_LO = float(os.environ.get("LINEVUL_LLM_PROMOTE_LO", "0.20"))
PROMOTE_HI = float(os.environ.get("LINEVUL_LLM_PROMOTE_HI", "0.50"))
TIMEOUT_S = float(os.environ.get("LINEVUL_OLLAMA_TIMEOUT", "45"))


@dataclass
class LlmDecision:
    """Result of one optional rerank. Empty promotions = no change."""

    promoted: set[int] = field(default_factory=set)
    messages: dict[int, str] = field(default_factory=dict)
    votes: dict[int, dict] = field(default_factory=dict)
    called: bool = False
    error: str = ""
    candidates: list[int] = field(default_factory=list)


def env_enabled() -> bool:
    return os.environ.get("LINEVUL_LLM", "1").strip().lower() not in {"0", "false", "off"}


def _usable_lines(raw_lines: list[str], line_probs: Mapping[int, float]) -> dict[int, float]:
    usable = {}
    for idx, line in enumerate(raw_lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("//") or stripped.startswith("/*"):
            continue
        usable[idx] = float(line_probs.get(idx, 0.0))
    return usable


def select_candidates(
    raw_lines: list[str],
    line_probs: Mapping[int, float],
    sast_hits: Optional[Mapping[int, str]] = None,
    top_k: int = TOP_K,
    max_n: int = MAX_CANDIDATES,
    promote_lo: float = PROMOTE_LO,
    promote_hi: float = PROMOTE_HI,
) -> list[int]:
    """Top-k by model score, plus the uncertain band, plus SAST hits."""
    usable = _usable_lines(raw_lines, line_probs)
    if not usable:
        return []
    ranked = sorted(usable, key=lambda ln: usable[ln], reverse=True)
    chosen: list[int] = []
    for ln in ranked[: max(0, top_k)]:
        if ln not in chosen:
            chosen.append(ln)
    for ln, p in usable.items():
        if promote_lo <= p < promote_hi and ln not in chosen:
            chosen.append(ln)
    if sast_hits:
        for ln in sast_hits:
            if ln in usable and ln not in chosen:
                chosen.append(int(ln))
    chosen.sort(key=lambda ln: usable.get(ln, 0.0), reverse=True)
    return chosen[:max_n]


def promotions_from_votes(
    line_probs: Mapping[int, float],
    votes: Mapping[int, dict],
    promote_lo: float = PROMOTE_LO,
    promote_hi: float = PROMOTE_HI,
) -> set[int]:
    """LLM yes may promote only the uncertain band. Never unflags anyone."""
    out: set[int] = set()
    for ln, vote in votes.items():
        if not vote.get("vulnerable"):
            continue
        p = float(line_probs.get(ln, 0.0))
        if promote_lo <= p < promote_hi:
            out.add(int(ln))
    return out


def _http_json(url: str, payload: Optional[dict] = None, timeout: float = 3.0) -> dict:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"} if data else {},
        method="GET" if data is None else "POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8") or "{}")


def parse_votes(raw: str) -> dict[int, dict]:
    """Accept a JSON object or array; ignore junk around the payload."""
    text = (raw or "").strip()
    if not text:
        return {}
    match = re.search(r"\{[\s\S]*\}|\[[\s\S]*\]", text)
    if match:
        text = match.group(0)
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return {}
    rows = payload
    if isinstance(payload, dict):
        rows = payload.get("votes", payload.get("lines", [payload]))
    if not isinstance(rows, list):
        return {}
    votes = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        try:
            ln = int(row.get("line") or row.get("line_number"))
        except (TypeError, ValueError):
            continue
        if ln < 1:
            continue
        vul = row.get("vulnerable", row.get("is_vulnerable"))
        if isinstance(vul, str):
            vul = vul.strip().lower() in {"1", "true", "yes"}
        votes[ln] = {
            "vulnerable": bool(vul),
            "cwe": str(row.get("cwe") or ""),
            "reason": str(row.get("reason") or "")[:240],
        }
    return votes


def _build_prompt(code: str, raw_lines: list[str], candidates: list[int]) -> str:
    numbered = "\n".join(f"{i:4d}|{line}" for i, line in enumerate(raw_lines, start=1))
    cand = []
    for ln in candidates:
        text = raw_lines[ln - 1] if 1 <= ln <= len(raw_lines) else ""
        cand.append(f"  {ln}: {text.strip()}")
    return (
        "You are a C/C++ security reviewer. Look only at the listed candidate "
        "lines. Say whether each is a vulnerability sink (buffer overflow, "
        "use-after-free, format string, command injection, null deref, OOB, "
        "integer overflow, double free). Ignore style and comments.\n\n"
        f"CODE:\n{numbered}\n\n"
        "CANDIDATE LINES:\n" + "\n".join(cand) + "\n\n"
        "Reply with JSON only:\n"
        '{"votes":[{"line":<int>,"vulnerable":<true|false>,"cwe":"CWE-xxx",'
        '"reason":"<one sentence>"}]}\n'
        "One object per candidate line. No markdown."
    )


class OllamaReranker:
    """HTTP client for a local Ollama coder model."""

    def __init__(
        self,
        host: str = DEFAULT_HOST,
        model: str = DEFAULT_MODEL,
        timeout: float = TIMEOUT_S,
    ):
        self.host = host.rstrip("/")
        self.model = model
        self.timeout = timeout
        self._available: Optional[bool] = None
        self.last_names: list[str] = []
        self.server_up: bool = False

    def _refresh(self) -> None:
        try:
            body = _http_json(f"{self.host}/api/tags", timeout=2.0)
            self.server_up = True
            self.last_names = [m.get("name", "") for m in body.get("models") or []]
            want = self.model
            self._available = any(
                n == want
                or n.startswith(want)
                or n.split(":")[0] == want.split(":")[0]
                for n in self.last_names
            )
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
            self.server_up = False
            self.last_names = []
            self._available = False

    def available(self, force: bool = False) -> bool:
        # Re-check when last seen as missing so a finished `ollama pull` shows up.
        if self._available and not force:
            return True
        self._refresh()
        return bool(self._available)

    def vote(self, code: str, raw_lines: list[str], candidates: list[int]) -> dict[int, dict]:
        if not candidates:
            return {}
        prompt = _build_prompt(code, raw_lines, candidates)
        try:
            body = _http_json(
                f"{self.host}/api/generate",
                {
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0},
                },
                timeout=self.timeout,
            )
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
            return {}
        return parse_votes(body.get("response") or "")

    def enrich(
        self,
        code: str,
        raw_lines: list[str],
        line_probs: Mapping[int, float],
        sast_hits: Optional[Mapping[int, str]] = None,
        enabled: bool = True,
    ) -> LlmDecision:
        """Pick candidates, ask Ollama, return promote-only decisions."""
        if not enabled or not env_enabled():
            return LlmDecision(error="disabled")
        if not self.available():
            return LlmDecision(error="ollama-unavailable")
        candidates = select_candidates(raw_lines, line_probs, sast_hits)
        if not candidates:
            return LlmDecision(error="no-candidates")
        votes = self.vote(code, raw_lines, candidates)
        if not votes:
            return LlmDecision(
                called=True, candidates=candidates, error="empty-or-bad-json"
            )
        promoted = promotions_from_votes(line_probs, votes)
        messages = {}
        for ln in promoted:
            reason = (votes.get(ln) or {}).get("reason") or "Ollama marked this line"
            cwe = (votes.get(ln) or {}).get("cwe") or ""
            messages[ln] = f"{cwe} {reason}".strip()
        return LlmDecision(
            promoted=promoted,
            messages=messages,
            votes=votes,
            called=True,
            candidates=candidates,
        )
