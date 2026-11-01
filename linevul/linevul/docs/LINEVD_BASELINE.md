# LineVD GNN is the failed baseline, not the model we train

This folder (`linevul/`) is the trainable FYP system. The older `../linevd/` tree is kept as the Joern + GAT experiment that did not work.

Do not delete those files. They are Chapter 4 of the thesis: *why we left the GNN*.

| Document | What it records |
|---|---|
| [../linevd/ANALYSIS.md](../../linevd/ANALYSIS.md) | Pooler collapse, 52:1 imbalance, training-loop bugs |
| [../linevd/benchmark/REPORT.md](../../linevd/benchmark/REPORT.md) | Full pipeline MCC −0.040 vs Flawfinder +0.246; pairwise AUC 0.50 |
| [../linevd/benchmark/NEXT_STEPS.md](../../linevd/benchmark/NEXT_STEPS.md) | Retrain-the-GNN plan that this project no longer follows |
| `../linevd/storage/processed/.../linevd-epoch=097-val_loss=1.3451.ckpt` | The collapsed checkpoint |

Headline numbers to quote:

- Flawfinder alone: MCC **+0.246**, paired wins 3/10
- LineVD GNN full scan: MCC **−0.040**, paired wins **0/10**
- Mean pairwise AUC: **0.5017** (coin flip)
- Joern cost: ~30 s/function, so 187k graphs is weeks

The LineVul path keeps the good idea from LineVD (supervise *lines*, not only functions) and drops Joern, DGL, and GAT.
