"""Flawfinder + trained LineVul scanner (no Joern, no GNN)."""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from linevul.fusion import fuse_scores
from linevul.infer import LineVulPredictor
from linevul.llm import OllamaReranker

LINE_THRESHOLD = float(os.environ.get("LINEVUL_THRESHOLD", "0.5"))
FUSION_WEIGHT = float(os.environ.get("LINEVUL_FUSION_WEIGHT", "0.35"))
QUICK_THRESHOLD = 0.40

SOURCE_EXTENSIONS = {".c", ".cpp", ".cc", ".cxx", ".c++", ".h", ".hpp", ".hh", ".hxx"}
EXCLUDED_DIRS = {
    ".git", ".svn", ".hg", "node_modules", "venv", ".venv", "__pycache__",
    "build", "out", "dist", "vendor", "third_party", "thirdparty",
    "external", "deps", "test", "tests", "testing",
}
MAX_FILE_BYTES = 1_000_000


@dataclass
class LineScanResult:
    line_number: int
    code: str
    is_vulnerable: bool
    confidence: float
    sources: list = field(default_factory=list)
    message: str = ""
    model_prob: float = 0.0


@dataclass
class ScanReport:
    lines: list
    total_lines: int
    vulnerable_lines: int
    scan_mode: str
    graph_data: Optional[dict] = None
    func_prob: float = 0.0


@dataclass
class FileScanResult:
    path: str
    total_lines: int
    vulnerable_lines: int
    max_confidence: float
    report: Optional[ScanReport] = None
    error: str = ""

    @property
    def vuln_ratio(self) -> float:
        return self.vulnerable_lines / self.total_lines if self.total_lines else 0.0

    @property
    def scored_by(self) -> str:
        if self.error:
            return "failed"
        mode = self.report.scan_mode if self.report else ""
        if mode == "full-fused":
            return "LineVul+SAST"
        if mode in ("model", "full-linevul"):
            return "LineVul"
        return "flawfinder"


@dataclass
class RepoScanReport:
    root: str
    files: list
    scan_mode: str
    files_scanned: int
    files_skipped: int
    total_lines: int
    total_vulnerable_lines: int

    @property
    def affected_files(self) -> list:
        return [f for f in self.files if f.vulnerable_lines > 0]

    @property
    def failed_files(self) -> list:
        return [f for f in self.files if f.error]


def find_source_files(root, include_headers=True, skip_tests=True, max_bytes=MAX_FILE_BYTES):
    root = Path(root).expanduser().resolve()
    if not root.is_dir():
        return []
    header_exts = {".h", ".hpp", ".hh", ".hxx"}
    excluded = EXCLUDED_DIRS if skip_tests else EXCLUDED_DIRS - {
        "test", "tests", "testing"
    }
    found = []
    for path in root.rglob("*"):
        if not path.is_file() or path.is_symlink():
            continue
        suffix = path.suffix.lower()
        if suffix not in SOURCE_EXTENSIONS:
            continue
        if not include_headers and suffix in header_exts:
            continue
        if any(part.lower() in excluded for part in path.relative_to(root).parts[:-1]):
            continue
        try:
            if path.stat().st_size > max_bytes:
                continue
        except OSError:
            continue
        found.append(path)
    return sorted(found)


class FlawfinderScanner:
    @staticmethod
    def scan(code: str) -> dict:
        results = {}
        with tempfile.NamedTemporaryFile(mode="w", suffix=".c", delete=False) as tmp:
            tmp.write(code)
            tmp_path = tmp.name
        try:
            proc = subprocess.run(
                ["flawfinder", "--dataonly", "--quiet", "--singleline", tmp_path],
                capture_output=True,
                text=True,
                timeout=30,
            )
            for line in proc.stdout.strip().splitlines():
                parts = line.split(":", 2)
                if len(parts) >= 3:
                    try:
                        results[int(parts[1])] = parts[2].strip()
                    except ValueError:
                        continue
        except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
            print(f"Flawfinder error: {exc}")
        finally:
            os.unlink(tmp_path)
        return results


class VulnerabilityScanner:
    def __init__(self):
        self._model = LineVulPredictor()
        if self._model.available:
            self._model._load()
        self._llm = OllamaReranker()
        fusion = self._model.config.get("fusion_weight")
        self.fusion_weight = float(fusion) if fusion is not None else FUSION_WEIGHT
        self.threshold = LINE_THRESHOLD

    @property
    def model(self) -> LineVulPredictor:
        return self._model

    def quick_scan(self, code: str) -> ScanReport:
        raw_lines = code.splitlines()
        hits = FlawfinderScanner.scan(code)
        results = []
        for idx, line in enumerate(raw_lines, start=1):
            flagged = idx in hits
            results.append(
                LineScanResult(
                    line_number=idx,
                    code=line,
                    is_vulnerable=flagged,
                    confidence=1.0 if flagged else 0.0,
                    sources=["flawfinder"] if flagged else [],
                    message=hits.get(idx, ""),
                    model_prob=0.0,
                )
            )
        return ScanReport(
            lines=results,
            total_lines=len(raw_lines),
            vulnerable_lines=sum(1 for r in results if r.is_vulnerable),
            scan_mode="quick",
        )

    def _apply_llm(
        self,
        code: str,
        raw_lines: list[str],
        line_probs: dict,
        flagged: set[int],
        sast_hits: Optional[dict] = None,
        use_llm: bool = False,
    ):
        """Merge promote-only LLM votes. Scanner does not implement Ollama."""
        if not use_llm:
            return flagged, {}
        decision = self._llm.enrich(
            code, raw_lines, line_probs, sast_hits=sast_hits, enabled=True
        )
        return flagged | decision.promoted, decision.messages

    def full_scan(self, code: str, use_llm: bool = False) -> ScanReport:
        raw_lines = code.splitlines()
        hits = FlawfinderScanner.scan(code)
        scored = self._model.score_file(code) if self._model.available else {
            "func_prob": 0.0, "line_probs": {}
        }
        line_probs = scored["line_probs"]
        if line_probs:
            fused = fuse_scores(line_probs, hits, weight=self.fusion_weight)
            mode = "full-fused"
        else:
            fused = {idx: 1.0 if idx in hits else 0.0 for idx in range(1, len(raw_lines) + 1)}
            mode = "full-sast" if hits else "full-nolinevul"

        results = []
        model_flags = self._flag_line_ids(raw_lines, line_probs) if line_probs else set()
        llm_flags, llm_msgs = self._apply_llm(
            code, raw_lines, line_probs, model_flags, sast_hits=hits, use_llm=use_llm
        )
        for idx, line in enumerate(raw_lines, start=1):
            conf = float(fused.get(idx, line_probs.get(idx, 0.0)))
            model_p = float(line_probs.get(idx, 0.0))
            sast_hit = idx in hits
            model_flag = idx in model_flags
            llm_flag = idx in llm_flags and idx not in model_flags and not sast_hit
            sources = []
            if model_flag:
                sources.append("linevul")
            if sast_hit:
                sources.append("flawfinder")
            if llm_flag:
                sources.append("llm")
                conf = max(conf, 0.6)
            flagged = model_flag or sast_hit or llm_flag
            msg = hits.get(idx, "")
            if llm_flag and llm_msgs.get(idx):
                msg = f"{msg} {llm_msgs[idx]}".strip() if msg else llm_msgs[idx]
            results.append(
                LineScanResult(
                    line_number=idx,
                    code=line,
                    is_vulnerable=flagged if line_probs else sast_hit,
                    confidence=round(conf, 4),
                    sources=sources,
                    message=msg,
                    model_prob=round(model_p, 4),
                )
            )
        return ScanReport(
            lines=results,
            total_lines=len(raw_lines),
            vulnerable_lines=sum(1 for r in results if r.is_vulnerable),
            scan_mode=mode,
            func_prob=float(scored.get("func_prob", 0.0)),
        )

    def model_scan(self, code: str, use_llm: bool = False) -> ScanReport:
        """Trained line head only — no Flawfinder."""
        raw_lines = code.splitlines()
        empty = ScanReport(lines=[], total_lines=len(raw_lines), vulnerable_lines=0, scan_mode="model")
        if not self._model.available:
            empty.scan_mode = "model-missing"
            return empty
        scored = self._model.score_file(code)
        line_probs = scored["line_probs"]
        flagged_ids = self._flag_line_ids(raw_lines, line_probs)
        llm_flags, llm_msgs = self._apply_llm(
            code, raw_lines, line_probs, flagged_ids, use_llm=use_llm
        )
        results = []
        for idx, line in enumerate(raw_lines, start=1):
            p = float(line_probs.get(idx, 0.0))
            if not line.strip():
                p = 0.0
            model_flag = idx in flagged_ids
            llm_flag = idx in llm_flags and not model_flag
            flagged = model_flag or llm_flag
            sources = []
            if model_flag:
                sources.append("linevul")
            if llm_flag:
                sources.append("llm")
                p = max(p, 0.6)
            results.append(
                LineScanResult(
                    line_number=idx,
                    code=line,
                    is_vulnerable=flagged,
                    confidence=round(p, 4),
                    sources=sources,
                    message=llm_msgs.get(idx, "") if llm_flag else "",
                    model_prob=round(float(line_probs.get(idx, 0.0)), 4),
                )
            )
        return ScanReport(
            lines=results,
            total_lines=len(raw_lines),
            vulnerable_lines=sum(1 for r in results if r.is_vulnerable),
            scan_mode="model",
            func_prob=float(scored.get("func_prob", 0.0)),
        )

    def _flag_line_ids(self, raw_lines: list[str], line_probs: dict) -> set[int]:
        """Flag real code lines that the line head is confident about.

        Blank / comment-only lines never count. A line is flagged if it
        clears the threshold, or if it is within 15% of the function's
        peak and that peak is already above the threshold (token bleed).
        """
        usable = {}
        for idx, line in enumerate(raw_lines, start=1):
            stripped = line.strip()
            if not stripped or stripped.startswith("//") or stripped.startswith("/*"):
                continue
            usable[idx] = float(line_probs.get(idx, 0.0))
        if not usable:
            return set()
        peak = max(usable.values())
        flagged = set()
        for idx, p in usable.items():
            if p >= self.threshold:
                flagged.add(idx)
            elif peak >= self.threshold and p >= 0.85 * peak and p >= 0.35:
                flagged.add(idx)
        return flagged

    def scan_repository(
        self,
        root,
        mode: str = "quick",
        include_headers: bool = True,
        skip_tests: bool = True,
        max_files: Optional[int] = None,
        progress_callback=None,
    ) -> RepoScanReport:
        root = Path(root).expanduser().resolve()
        files = find_source_files(
            root, include_headers=include_headers, skip_tests=skip_tests
        )
        skipped = 0
        if max_files is not None and len(files) > max_files:
            skipped = len(files) - max_files
            files = files[:max_files]

        if mode.startswith("model"):
            use = "model"
        elif mode.startswith("full"):
            use = "full"
        else:
            use = "quick"
        results = []
        total_lines = total_vuln = 0
        for idx, fpath in enumerate(files):
            rel = str(fpath.relative_to(root))
            if progress_callback is not None:
                progress_callback(idx, len(files), rel)
            try:
                code = fpath.read_text(errors="ignore")
            except OSError as exc:
                results.append(FileScanResult(rel, 0, 0, 0.0, error=f"unreadable: {exc}"))
                continue
            if not code.strip():
                skipped += 1
                continue
            try:
                if use == "full":
                    report = self.full_scan(code)
                elif use == "model":
                    report = self.model_scan(code)
                else:
                    report = self.quick_scan(code)
            except Exception as exc:  # noqa: BLE001
                results.append(
                    FileScanResult(
                        rel, len(code.splitlines()), 0, 0.0,
                        error=f"{type(exc).__name__}: {exc}",
                    )
                )
                continue
            max_conf = max((r.confidence for r in report.lines if r.is_vulnerable), default=0.0)
            results.append(
                FileScanResult(
                    rel, report.total_lines, report.vulnerable_lines,
                    round(max_conf, 4), report=report,
                )
            )
            total_lines += report.total_lines
            total_vuln += report.vulnerable_lines
        if progress_callback is not None:
            progress_callback(len(files), len(files), "done")
        results.sort(key=lambda f: (f.vulnerable_lines, f.max_confidence), reverse=True)
        return RepoScanReport(
            root=str(root),
            files=results,
            scan_mode=use,
            files_scanned=sum(1 for f in results if not f.error),
            files_skipped=skipped,
            total_lines=total_lines,
            total_vulnerable_lines=total_vuln,
        )

    def get_status(self) -> dict:
        return {
            "flawfinder": self._check_flawfinder(),
            "linevul": self._model.available,
            "ollama": self._llm.available(force=True),
            "joern": False,
        }

    def get_model_info(self) -> dict:
        if not self._model.available:
            return {}
        return self._model.summary

    @staticmethod
    def _check_flawfinder() -> bool:
        try:
            subprocess.run(["flawfinder", "--version"], capture_output=True, timeout=5)
            return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False
