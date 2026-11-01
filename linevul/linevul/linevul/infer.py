"""Load a trained LineVul checkpoint and score a C/C++ function."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

import torch
from transformers import AutoTokenizer

from linevul.data import line_char_spans, strip_c_comments_keep_lines, token_line_ids
from linevul.functions import extract_c_functions
from linevul.model import LineVulModel

PROJECT_ROOT = Path(__file__).resolve().parent.parent
_LOCAL_CODEBERT = (
    PROJECT_ROOT.parent
    / "linevd"
    / "storage"
    / "cache"
    / "codebert_model"
    / "models--microsoft--codebert-base"
    / "snapshots"
    / "3b0952feddeffad0063f274080e3c23d75e7eb39"
)


def find_checkpoint(root: Optional[Path] = None) -> Optional[Path]:
    env = os.environ.get("LINEVUL_CHECKPOINT")
    if env:
        folder = Path(env)
        if folder.is_file():
            folder = folder.parent
        if (folder / "pytorch_model.bin").exists():
            return folder
    root = root or PROJECT_ROOT
    for name in ("linevul_cwe_mix", "linevul_cwe"):
        preferred = root / "checkpoints" / name
        if (preferred / "pytorch_model.bin").exists():
            return preferred
    candidates = []
    for pattern in ("checkpoints/**/linevul_config.json", "checkpoints/**/pytorch_model.bin"):
        for path in root.glob(pattern):
            folder = path.parent
            if (folder / "pytorch_model.bin").exists():
                candidates.append(folder)
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


class LineVulPredictor:
    """Function + per-line probabilities from a saved checkpoint."""

    def __init__(self, checkpoint: Optional[Path] = None, device: Optional[str] = None):
        self.checkpoint = Path(checkpoint) if checkpoint else find_checkpoint()
        self._model = None
        self._tokenizer = None
        self.config = {}
        self._load_error = None
        if device:
            self._device = torch.device(device)
        elif torch.cuda.is_available():
            self._device = torch.device("cuda")
        else:
            self._device = torch.device("cpu")

    @property
    def available(self) -> bool:
        return (
            self.checkpoint is not None
            and (self.checkpoint / "pytorch_model.bin").exists()
        )

    @property
    def ready(self) -> bool:
        """Whether the checkpoint and encoder have both loaded successfully."""
        return self._model is not None

    @property
    def load_error(self) -> Optional[str]:
        return self._load_error

    def _tokenizer_source(self) -> str:
        if (self.checkpoint / "vocab.json").exists() or (
            self.checkpoint / "tokenizer.json"
        ).exists() and (self.checkpoint / "merges.txt").exists():
            return str(self.checkpoint)
        if _LOCAL_CODEBERT.exists():
            return str(_LOCAL_CODEBERT)
        return str(self.checkpoint)

    def _encoder_source(self, model_name: str) -> str:
        if (self.checkpoint / "config.json").exists():
            return str(self.checkpoint)
        if _LOCAL_CODEBERT.exists():
            return str(_LOCAL_CODEBERT)
        return model_name

    def _load(self) -> bool:
        if self._model is not None:
            return True
        if not self.available:
            self._load_error = "No LineVul checkpoint under checkpoints/"
            return False
        try:
            cfg_path = self.checkpoint / "linevul_config.json"
            self.config = json.loads(cfg_path.read_text()) if cfg_path.exists() else {}
            model_name = self.config.get("model_name", "microsoft/codebert-base")
            tok_src = self._tokenizer_source()
            self._tokenizer = AutoTokenizer.from_pretrained(
                tok_src, local_files_only=True
            )
            enc_src = self._encoder_source(model_name)
            model = LineVulModel(
                enc_src, from_config_only=True, local_files_only=True
            )
            try:
                state = torch.load(
                    self.checkpoint / "pytorch_model.bin",
                    map_location="cpu",
                    weights_only=True,
                )
            except TypeError:
                state = torch.load(
                    self.checkpoint / "pytorch_model.bin", map_location="cpu"
                )
            model.load_state_dict(state)
            model.to(self._device)
            model.eval()
            self._model = model
        except Exception as exc:  # noqa: BLE001 - surface any load failure
            self._load_error = f"{type(exc).__name__}: {exc}"
            self._model = None
            return False
        return True

    @property
    def summary(self) -> dict:
        if not self._load():
            return {"error": self._load_error}
        return {
            "checkpoint": str(self.checkpoint),
            "pooling": self.config.get("pooling", "mean"),
            "stmtweight": self.config.get("stmtweight"),
            "fusion_weight": self.config.get("fusion_weight", 0.35),
            "line_threshold": self.config.get("line_threshold", 0.5),
            "best_val_line_mcc": self.config.get("best_val_line_mcc"),
            "ranking_lambda": self.config.get("ranking_lambda"),
            "model_name": self.config.get("model_name", "microsoft/codebert-base"),
        }

    @torch.no_grad()
    def score(self, code: str) -> dict:
        """Return function probability and {line_number: vuln_prob}."""
        empty = {"func_prob": 0.0, "line_probs": {}}
        if not code or not code.strip():
            return empty
        if not self._load():
            return empty

        code = strip_c_comments_keep_lines(code)
        max_length = int(self.config.get("max_length", 512))
        spans = line_char_spans(code)
        encoded = self._tokenizer(
            code,
            truncation=True,
            max_length=max_length,
            padding="max_length",
            return_offsets_mapping=True,
            return_tensors="pt",
        )
        offsets = encoded.pop("offset_mapping")[0].tolist()
        line_ids = torch.tensor(
            [token_line_ids(offsets, spans, max_length)], dtype=torch.long
        )
        input_ids = encoded["input_ids"].to(self._device)
        attention_mask = encoded["attention_mask"].to(self._device)
        line_ids = line_ids.to(self._device)
        n_lines = min(len(spans), 128)
        out = self._model(input_ids, attention_mask, line_ids, n_lines)
        func_prob = float(torch.softmax(out["func_logits"], dim=-1)[0, 1])
        line_probs_t = torch.softmax(out["line_logits"][0], dim=-1)[:, 1]
        valid = out["line_valid"][0]
        line_probs = {}
        for i, (ln, _s, _e) in enumerate(spans):
            if i >= n_lines:
                break
            if not bool(valid[i]):
                continue
            line_probs[ln] = float(line_probs_t[i])
        return {"func_prob": func_prob, "line_probs": line_probs}

    def score_file(self, code: str) -> dict:
        """Score a pasted file, taking the max of whole-file and per-function scores.

        Whole-file scoring keeps include context some sinks need. Per-function
        scoring matches training (single functions). Comments are stripped
        inside score() so English on the sink line cannot drown it.
        """
        if not self._load():
            return {"func_prob": 0.0, "line_probs": {}}
        whole = self.score(code)
        chunks = extract_c_functions(code)
        if not chunks:
            return whole

        includes = [
            ln for ln in code.splitlines() if ln.lstrip().startswith("#include")
        ]
        prefix = "\n".join(includes)
        prefix_lines = (prefix.count("\n") + 2) if prefix else 0  # includes + blank
        func_prob = whole["func_prob"]
        line_probs = dict(whole["line_probs"])

        def merge(start: int, part: dict, skip: int = 0) -> None:
            nonlocal func_prob
            func_prob = max(func_prob, part["func_prob"])
            for ln, p in part["line_probs"].items():
                if skip and ln <= skip:
                    continue
                file_ln = start + ln - skip - 1
                if file_ln < 1:
                    continue
                line_probs[file_ln] = max(line_probs.get(file_ln, 0.0), p)

        # In large files, prioritize functions containing potential vulnerability surface and cap at top 8
        if len(chunks) > 8:
            def surf_weight(item):
                s = item[1]
                w = 0
                if re.search(r'\b(malloc|free|kfree|strcpy|strcat|sprintf|memcpy|memmove|gets)\b', s):
                    w += 10
                if '[' in s or '->' in s or '*' in s:
                    w += 5
                return w
            chunks = sorted(chunks, key=surf_weight, reverse=True)[:8]

        for start, snippet in chunks:
            s_res = self.score(snippet)
            merge(start, s_res)
            if prefix and s_res.get("func_prob", 0.0) >= 0.50:
                merge(start, self.score(f"{prefix}\n\n{snippet}"), skip=prefix_lines)
        return {"func_prob": func_prob, "line_probs": line_probs}

    def score_lines(self, code: str) -> dict[int, float]:
        return self.score(code)["line_probs"]

    @torch.no_grad()
    def score_attention(self, code: str) -> dict[int, float]:
        """LineVul-style localization: CLS attention, summed over layers/heads."""
        if not code or not code.strip() or not self._load():
            return {}
        code = strip_c_comments_keep_lines(code)
        max_length = int(self.config.get("max_length", 512))
        spans = line_char_spans(code)
        encoded = self._tokenizer(
            code,
            truncation=True,
            max_length=max_length,
            padding="max_length",
            return_offsets_mapping=True,
            return_tensors="pt",
        )
        offsets = encoded.pop("offset_mapping")[0].tolist()
        line_ids = token_line_ids(offsets, spans, max_length)
        input_ids = encoded["input_ids"].to(self._device)
        attention_mask = encoded["attention_mask"].to(self._device)
        _hidden, attns = self._model.encode(
            input_ids, attention_mask, output_attentions=True
        )
        # attns: n_layers x [1, heads, T, T] — attention from CLS (index 0) to tokens
        stacked = torch.stack([a[0] for a in attns])  # [layers, heads, T, T]
        cls_to_tok = stacked[:, :, 0, :].mean(dim=(0, 1))  # [T]
        mask = attention_mask[0].bool()
        scores = {}
        counts = {}
        for t, ln in enumerate(line_ids):
            if ln <= 0 or not bool(mask[t]):
                continue
            scores[ln] = scores.get(ln, 0.0) + float(cls_to_tok[t])
            counts[ln] = counts.get(ln, 0) + 1
        return {ln: scores[ln] / counts[ln] for ln in scores}
