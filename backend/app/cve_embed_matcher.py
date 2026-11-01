"""
CVE Embedding Similarity Matcher
Uses CodeBERT 768-d mean-pooled token embeddings and cosine similarity against cve_index.npy.
Strictly deletes all token/function-name matching heuristics.
"""

from __future__ import annotations
import os
import json
from pathlib import Path
from typing import Any, Optional
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel

import config
import cwe_catalog

ROOT_DIR = Path(__file__).resolve().parent

class CVEEmbeddingMatcher:
    _instance: Optional[CVEEmbeddingMatcher] = None

    @classmethod
    def get_instance(cls) -> CVEEmbeddingMatcher:
        if cls._instance is None:
            cls._instance = cls()
            cls._instance.load()
        return cls._instance

    def __init__(self, index_path=None, meta_path=None):
        self.index_path = Path(index_path or getattr(config, "CVE_INDEX_PATH", ROOT_DIR / "cve_index.npy"))
        self.meta_path = Path(meta_path or getattr(config, "CVE_METADATA_PATH", ROOT_DIR / "cve_index_meta.json"))
        self.matrix = None
        self.meta = []
        self.tokenizer = None
        self.model = None
        self._loaded = False

    def load(self):
        if self._loaded:
            return
        if self.index_path.exists() and self.meta_path.exists():
            self.matrix = np.load(self.index_path)
            with open(self.meta_path, "r", encoding="utf-8") as f:
                self.meta = json.load(f)
            self._loaded = True

    def _ensure_model(self):
        if self.model is None or self.tokenizer is None:
            tok_src = getattr(config, "CODEBERT_MODEL_NAME", "microsoft/codebert-base")
            self.tokenizer = AutoTokenizer.from_pretrained(tok_src)
            self.model = AutoModel.from_pretrained(tok_src)
            self.model.eval()

    def embed_code(self, code: str) -> np.ndarray:
        self._ensure_model()
        inputs = self.tokenizer(code, return_tensors="pt", max_length=512, truncation=True, padding=True)
        with torch.no_grad():
            out = self.model(**inputs)
            mask = inputs["attention_mask"].unsqueeze(-1).expand(out[0].size()).float()
            sum_emb = torch.sum(out[0] * mask, dim=1)
            sum_mask = torch.clamp(mask.sum(dim=1), min=1e-9)
            vec = (sum_emb / sum_mask).squeeze(0)
            vec = torch.nn.functional.normalize(vec, p=2, dim=0).cpu().numpy()
        return vec

    def match(self, code: str, detected_cwe: Optional[str] = None, allow_generic_fallback: bool = True) -> Optional[dict[str, Any]]:
        self.load()
        if not self._loaded or self.matrix is None or len(self.meta) == 0:
            return None

        # Compute query embedding
        q = self.embed_code(code)
        # Cosine similarity (both rows and q are L2-normalized)
        sims = np.dot(self.matrix, q)
        ranked_indices = np.argsort(sims)[::-1]

        # Configurable thresholds
        min_sim = float(os.environ.get("CVE_MIN_SIMILARITY", getattr(config, "CVE_MIN_SIMILARITY", 0.85)))
        min_unclass_sim = float(os.environ.get("CVE_UNCLASSIFIED_MIN_SIMILARITY", getattr(config, "CVE_UNCLASSIFIED_MIN_SIMILARITY", 0.92)))

        is_unclassified = not detected_cwe or str(detected_cwe).strip().lower() in ("cwe-general", "unclassified", "none", "", "vulnerability", "general")

        chosen_idx = None
        chosen_sim = 0.0

        if is_unclassified:
            # CVE-family gate must NOT pass by default; require very high similarity (>= min_unclass_sim)
            top_idx = int(ranked_indices[0])
            top_sim = float(sims[top_idx])
            if top_sim >= min_unclass_sim:
                chosen_idx = top_idx
                chosen_sim = top_sim
            else:
                return None
        else:
            # Specific CWE detected: check top candidates for CWE compatibility and min_sim
            for idx in ranked_indices[:15]:
                cand_sim = float(sims[idx])
                if cand_sim < min_sim:
                    break
                cand_meta = self.meta[idx]
                cand_cwe = cand_meta.get("cwe_id", "")
                if cwe_catalog.are_cwes_compatible(detected_cwe, cand_cwe):
                    chosen_idx = int(idx)
                    chosen_sim = cand_sim
                    break
            
            # If no compatible CWE candidate met min_sim, and allow_generic_fallback:
            if chosen_idx is None and allow_generic_fallback:
                top_idx = int(ranked_indices[0])
                top_sim = float(sims[top_idx])
                if top_sim >= min_unclass_sim:
                    chosen_idx = top_idx
                    chosen_sim = top_sim

        if chosen_idx is None:
            return None

        primary = self.meta[chosen_idx]
        
        # Build related CVEs (top-3 other distinct CVEs)
        related = []
        seen_cves = {primary["cve_id"]}
        for r_idx in ranked_indices:
            r_cve = self.meta[r_idx]
            cid = r_cve["cve_id"]
            if cid not in seen_cves:
                seen_cves.add(cid)
                related.append({
                    "cve_id": cid,
                    "title": r_cve.get("title") or f"{cid}",
                    "severity": r_cve.get("severity") or "HIGH",
                    "basescore": float(r_cve.get("basescore") or 7.5),
                    "vendor": r_cve.get("vendor") or "Unknown",
                    "product": r_cve.get("product") or "Unknown",
                })
                if len(related) >= 3:
                    break

        # Extract removed patch lines snippet
        snippet = primary.get("snippet", "")
        if not snippet and primary.get("patch"):
            patch_lines = primary["patch"].splitlines()
            minus_lines = [l[1:].strip() for l in patch_lines if l.startswith("-") and not l.startswith("---")]
            if minus_lines:
                snippet = "\n".join(minus_lines[:3])

        return {
            "cve_id": primary["cve_id"],
            "title": primary.get("title", f"{primary['cve_id']} Vulnerability"),
            "description": primary.get("description", ""),
            "summary": primary.get("title", ""),
            "severity": primary.get("severity", "HIGH"),
            "basescore": float(primary.get("basescore", 7.5)),
            "cvss_version": primary.get("cvss_version", "3.1"),
            "cvss_vector": primary.get("cvss_vector", ""),
            "category_type": primary.get("cwe_id", "Unclassified"),
            "cwe_info": primary.get("cwe_id", "Unclassified"),
            "vendor": primary.get("vendor", "Open Source"),
            "product": primary.get("product", "Software"),
            "date_published": str(primary.get("date_published") or ""),
            "match_reason": f"CodeBERT embedding cosine similarity: {chosen_sim:.4f} ({chosen_sim * 100:.1f}%) to benchmark patch hunk",
            "patch": primary.get("patch", ""),
            "patch_id": primary.get("patch_id", ""),
            "similarity": float(round(chosen_sim, 4)),
            "match_method": "embedding_similarity",
            "matched_snippet": snippet,
            "related_cves": related,
        }
