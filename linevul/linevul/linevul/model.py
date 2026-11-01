"""CodeBERT encoder with a function head and a mean-pooled line head."""

from __future__ import annotations

import torch
import torch.nn as nn
from transformers import AutoConfig, AutoModel


class LineVulModel(nn.Module):
    """LineVul function classifier plus a supervised per-line MLP.

    Function and line embeddings both use attention-masked mean pooling.
    RoBERTa's pooler_output is never used — it collapses short C lines.
    """

    def __init__(
        self,
        model_name: str = "microsoft/codebert-base",
        dropout: float = 0.1,
        local_files_only: bool = False,
        from_config_only: bool = False,
    ):
        super().__init__()
        self.model_name = model_name
        if from_config_only:
            cfg = AutoConfig.from_pretrained(
                model_name, local_files_only=local_files_only
            )
            self.encoder = AutoModel.from_config(cfg)
        else:
            self.encoder = AutoModel.from_pretrained(
                model_name, local_files_only=local_files_only
            )
        hidden = self.encoder.config.hidden_size
        self.dropout = nn.Dropout(dropout)
        self.func_head = nn.Linear(hidden, 2)
        self.line_head = nn.Sequential(
            nn.Linear(hidden, hidden // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden // 2, 2),
        )

    def encode(self, input_ids, attention_mask, output_attentions=False):
        out = self.encoder(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_attentions=output_attentions,
        )
        if output_attentions:
            return out.last_hidden_state, out.attentions
        return out.last_hidden_state

    def mean_pool(self, hidden, mask):
        weights = mask.unsqueeze(-1).to(hidden.dtype)
        return (hidden * weights).sum(1) / weights.sum(1).clamp(min=1e-9)

    def pool_lines(self, hidden, line_ids, n_lines: int):
        """Mean-pool tokens that belong to each 1-based line.

        hidden:   [B, T, H]
        line_ids: [B, T]  0 = special/pad, 1..L = line number
        returns:  embs [B, L, H], valid [B, L]
        """
        batch, _, hidden_size = hidden.shape
        embs = hidden.new_zeros(batch, n_lines, hidden_size)
        valid = torch.zeros(batch, n_lines, dtype=torch.bool, device=hidden.device)
        for ln in range(1, n_lines + 1):
            token_mask = line_ids == ln
            valid[:, ln - 1] = token_mask.any(dim=1)
            weights = token_mask.unsqueeze(-1).to(hidden.dtype)
            summed = (hidden * weights).sum(1)
            count = weights.sum(1).clamp(min=1e-9)
            embs[:, ln - 1] = summed / count
        return embs, valid

    def forward(self, input_ids, attention_mask, line_ids, n_lines: int):
        hidden = self.encode(input_ids, attention_mask)
        func_emb = self.dropout(self.mean_pool(hidden, attention_mask))
        func_logits = self.func_head(func_emb)

        line_embs, line_valid = self.pool_lines(hidden, line_ids, n_lines)
        line_logits = self.line_head(self.dropout(line_embs))
        return {
            "func_logits": func_logits,
            "line_logits": line_logits,
            "line_valid": line_valid,
        }


def pairwise_ranking_loss(line_logits, line_labels, line_mask, margin: float = 1.0):
    """Push labelled vuln lines above safe lines inside each function."""
    scores = line_logits[..., 1]
    parts = []
    batch = scores.size(0)
    for i in range(batch):
        valid = line_mask[i]
        pos = scores[i][(line_labels[i] == 1) & valid]
        neg = scores[i][(line_labels[i] == 0) & valid]
        if pos.numel() == 0 or neg.numel() == 0:
            continue
        delta = margin - pos.unsqueeze(1) + neg.unsqueeze(0)
        parts.append(torch.relu(delta).mean())
    if not parts:
        return scores.new_zeros(())
    return torch.stack(parts).mean()
