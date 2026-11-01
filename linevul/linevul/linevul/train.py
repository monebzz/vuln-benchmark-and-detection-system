"""Fine-tune CodeBERT + function/line heads. No Joern, no DGL."""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader
from transformers import AutoTokenizer, get_linear_schedule_with_warmup

from linevul.data import (
    BigVulLineDataset,
    collate_batch,
    line_class_weight,
    load_jsonl,
)
from linevul.model import LineVulModel, pairwise_ranking_loss

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def seed_everything(seed: int = 1):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def device():
    if torch.cuda.is_available():
        return torch.device("cuda")
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def mcc(logits, labels, mask=None):
    pred = logits.argmax(dim=-1)
    if mask is not None:
        pred = pred[mask]
        labels = labels[mask]
    if pred.numel() == 0:
        return 0.0
    tp = ((pred == 1) & (labels == 1)).sum().item()
    tn = ((pred == 0) & (labels == 0)).sum().item()
    fp = ((pred == 1) & (labels == 0)).sum().item()
    fn = ((pred == 0) & (labels == 1)).sum().item()
    denom = ((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)) ** 0.5
    return ((tp * tn) - (fp * fn)) / denom if denom > 0 else 0.0


def total_loss(out, batch, crit_func, crit_line, ranking_lambda, ranking_margin):
    loss_f = crit_func(out["func_logits"], batch["func_label"])
    mask = batch["line_mask"]
    if mask.any():
        loss_l = crit_line(out["line_logits"][mask], batch["line_labels"][mask])
    else:
        loss_l = out["line_logits"].new_zeros(())
    loss_r = out["line_logits"].new_zeros(())
    if ranking_lambda > 0:
        loss_r = pairwise_ranking_loss(
            out["line_logits"], batch["line_labels"], mask, margin=ranking_margin
        )
    return loss_f + loss_l + ranking_lambda * loss_r, loss_f, loss_l, loss_r


@torch.no_grad()
def evaluate(model, loader, crit_func, crit_line, dev, ranking_lambda, ranking_margin):
    model.eval()
    losses, func_mccs, line_mccs = [], [], []
    for batch in loader:
        batch = {
            k: v.to(dev) if torch.is_tensor(v) else v for k, v in batch.items()
        }
        n_lines = batch["line_labels"].size(1)
        out = model(
            batch["input_ids"],
            batch["attention_mask"],
            batch["line_ids"],
            n_lines,
        )
        loss, _, _, _ = total_loss(
            out, batch, crit_func, crit_line, ranking_lambda, ranking_margin
        )
        losses.append(loss.item())
        func_mccs.append(mcc(out["func_logits"], batch["func_label"]))
        line_mccs.append(mcc(out["line_logits"], batch["line_labels"], batch["line_mask"]))
    return {
        "loss": float(np.mean(losses)) if losses else 0.0,
        "func_mcc": float(np.mean(func_mccs)) if func_mccs else 0.0,
        "line_mcc": float(np.mean(line_mccs)) if line_mccs else 0.0,
    }


def save_checkpoint(model, tokenizer, out_dir: Path, extra: dict):
    out_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out_dir / "pytorch_model.bin")
    tokenizer.save_pretrained(out_dir)
    config = {
        "model_name": model.model_name,
        "pooling": "mean",
        **extra,
    }
    (out_dir / "linevul_config.json").write_text(json.dumps(config, indent=2))
    print(f"[linevul] saved checkpoint to {out_dir}")


def train(args):
    seed_everything(args.seed)
    data_dir = Path(args.data_dir)
    train_rows = load_jsonl(data_dir / "train.jsonl")
    val_rows = load_jsonl(data_dir / "val.jsonl")
    if not train_rows:
        raise SystemExit(f"No training rows in {data_dir / 'train.jsonl'}")

    stmtweight = (
        line_class_weight(train_rows) if args.stmtweight == "auto" else float(args.stmtweight)
    )
    print(
        f"[linevul] train={len(train_rows)} val={len(val_rows)} "
        f"stmtweight={stmtweight:.2f} encoder={args.model_name} "
        f"rank_λ={args.ranking_lambda} margin={args.ranking_margin}"
    )

    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    train_ds = BigVulLineDataset(train_rows, tokenizer, args.max_length)
    val_ds = BigVulLineDataset(val_rows, tokenizer, args.max_length)
    train_dl = DataLoader(
        train_ds,
        batch_size=args.batch_size,
        shuffle=True,
        collate_fn=collate_batch,
        num_workers=0,
    )
    val_dl = DataLoader(
        val_ds,
        batch_size=args.batch_size,
        shuffle=False,
        collate_fn=collate_batch,
        num_workers=0,
    )

    dev = device()
    model = LineVulModel(args.model_name, dropout=args.dropout).to(dev)
    if args.resume:
        resume_path = Path(args.resume)
        if resume_path.is_dir():
            resume_path = resume_path / "pytorch_model.bin"
        if not resume_path.exists():
            raise SystemExit(f"resume path not found: {resume_path}")
        try:
            state = torch.load(resume_path, map_location=dev, weights_only=True)
        except TypeError:
            state = torch.load(resume_path, map_location=dev)
        model.load_state_dict(state)
        print(f"[linevul] resumed weights from {resume_path}")
    opt = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    total_steps = max(1, len(train_dl) * args.epochs)
    sched = get_linear_schedule_with_warmup(
        opt, num_warmup_steps=max(1, total_steps // 10), num_training_steps=total_steps
    )
    crit_func = torch.nn.CrossEntropyLoss()
    crit_line = torch.nn.CrossEntropyLoss(
        weight=torch.tensor([1.0, stmtweight], device=dev)
    )

    out_dir = Path(args.out_dir)
    best_mcc = -1.0
    bad_epochs = 0
    history = []

    for epoch in range(1, args.epochs + 1):
        model.train()
        running = []
        for step, batch in enumerate(train_dl, start=1):
            batch = {
                k: v.to(dev) if torch.is_tensor(v) else v for k, v in batch.items()
            }
            n_lines = batch["line_labels"].size(1)
            out = model(
                batch["input_ids"],
                batch["attention_mask"],
                batch["line_ids"],
                n_lines,
            )
            loss, _, _, _ = total_loss(
                out,
                batch,
                crit_func,
                crit_line,
                args.ranking_lambda,
                args.ranking_margin,
            )
            opt.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            sched.step()
            running.append(loss.item())
            if step % args.log_every == 0:
                print(
                    f"  epoch {epoch} step {step}/{len(train_dl)} "
                    f"loss={np.mean(running[-args.log_every:]):.4f}"
                )

        metrics = evaluate(
            model,
            val_dl,
            crit_func,
            crit_line,
            dev,
            args.ranking_lambda,
            args.ranking_margin,
        )
        metrics["epoch"] = epoch
        metrics["train_loss"] = float(np.mean(running)) if running else 0.0
        history.append(metrics)
        print(
            f"[linevul] epoch {epoch} train_loss={metrics['train_loss']:.4f} "
            f"val_loss={metrics['loss']:.4f} "
            f"val_func_mcc={metrics['func_mcc']:.4f} "
            f"val_line_mcc={metrics['line_mcc']:.4f}"
        )
        # Watch line MCC, not accuracy. At heavy imbalance accuracy is a trap.
        if metrics["line_mcc"] > best_mcc + 1e-4:
            best_mcc = metrics["line_mcc"]
            bad_epochs = 0
            save_checkpoint(
                model,
                tokenizer,
                out_dir,
                extra={
                    "stmtweight": stmtweight,
                    "fusion_weight": args.fusion_weight,
                    "line_threshold": args.threshold,
                    "best_val_line_mcc": best_mcc,
                    "epoch": epoch,
                    "max_length": args.max_length,
                    "ranking_lambda": args.ranking_lambda,
                    "ranking_margin": args.ranking_margin,
                    "resumed_from": args.resume,
                },
            )
        else:
            bad_epochs += 1
            if bad_epochs >= args.patience:
                print(f"[linevul] early stop at epoch {epoch} (best line MCC {best_mcc:.4f})")
                break

    (out_dir / "history.json").write_text(json.dumps(history, indent=2))
    if best_mcc < 0:
        save_checkpoint(
            model,
            tokenizer,
            out_dir,
            extra={
                "stmtweight": stmtweight,
                "fusion_weight": args.fusion_weight,
                "line_threshold": args.threshold,
                "best_val_line_mcc": best_mcc,
                "max_length": args.max_length,
                "ranking_lambda": args.ranking_lambda,
                "ranking_margin": args.ranking_margin,
                "resumed_from": args.resume,
            },
        )
    print(f"[linevul] done. best val_line_mcc={best_mcc:.4f}")
    return best_mcc


def parse_args(argv=None):
    p = argparse.ArgumentParser(description="Train LineVul + supervised line head")
    p.add_argument("--data-dir", default=str(PROJECT_ROOT / "data" / "subset"))
    p.add_argument("--out-dir", default=str(PROJECT_ROOT / "checkpoints" / "linevul"))
    p.add_argument("--model-name", default="microsoft/codebert-base")
    p.add_argument("--epochs", type=int, default=10)
    p.add_argument("--batch-size", type=int, default=8)
    p.add_argument("--lr", type=float, default=2e-5)
    p.add_argument("--max-length", type=int, default=512)
    p.add_argument("--dropout", type=float, default=0.1)
    p.add_argument("--stmtweight", default="auto")
    p.add_argument("--fusion-weight", type=float, default=0.35)
    p.add_argument("--threshold", type=float, default=0.5)
    p.add_argument("--patience", type=int, default=3)
    p.add_argument("--seed", type=int, default=1)
    p.add_argument("--log-every", type=int, default=50)
    p.add_argument(
        "--ranking-lambda",
        type=float,
        default=0.5,
        help="Weight of in-function pairwise ranking loss (0 disables it)",
    )
    p.add_argument("--ranking-margin", type=float, default=1.0)
    p.add_argument(
        "--resume",
        default="",
        help="Path to pytorch_model.bin or a checkpoint folder",
    )
    return p.parse_args(argv)


if __name__ == "__main__":
    train(parse_args())
