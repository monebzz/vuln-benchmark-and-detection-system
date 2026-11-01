# LineVul FYP

Line-level C/C++ vulnerability detection. **This folder is the trainable system.** The older [`../linevd`](../linevd) tree is the Joern + GNN baseline that collapsed; see [docs/LINEVD_BASELINE.md](docs/LINEVD_BASELINE.md).

```
code  →  Flawfinder
      →  fine-tuned CodeBERT  →  function head
                              →  mean-pooled line head
      →  late fusion  →  Streamlit ranks / flags
```

No Joern, no DGL, no GNN. Full Big-Vul is just more CSV rows.

## What is new vs stock LineVul

1. **Supervised line head** — mean-pool CodeBERT tokens per line and train an MLP on Big-Vul removed lines. Stock LineVul only trains a function classifier and ranks lines by raw attention.
2. **In-function ranking loss** — push labelled vuln-line logits above safe lines in the same function (`--ranking-lambda`, default 0.5). This is the method extra; fusion is a demo extra.
3. **Late fusion with Flawfinder** — `fused = (1-w) * p_line + w * 1[sast]`.
4. **Paired CWE eval** — beat Flawfinder and attention on the same 23-case corpus. Do not lead the thesis with Big-Vul function F1.

## Layout

```
linevul/           model, data, train, infer, fusion
frontend/          Streamlit app (port 8502)
benchmark/         paired CWE corpus, probe, pipeline metrics
notebooks/         Colab training notebook
scripts/           prepare_subset.py, eval_gate.py
data/subset/       generated 8–15k JSONL splits
checkpoints/       HuggingFace-style weights after training
```

## Train (Colab T4)

Epoch-5 CE-only weights already live in `checkpoints/linevul/` (val line MCC 0.74; CWE AUC 0.54). **Do not overwrite them.** The next run resumes those weights with ranking loss into a **new** folder.

1. Backup Drive `FYP_training_output/linevul` → `linevul_e5_backup`.
2. Re-zip this folder (exclude `checkpoints/`), upload, open the notebook, run the **continue + ranking** cell.
3. Download `FYP_training_output/linevul_rank` → `checkpoints/linevul_rank/`.
4. Gate it:

```bash
cd ~/Desktop/projects/FYP/linevul
# Mac: use the wrapper so torch does not segfault
python scripts/macos_eval.py
# or point at a specific checkpoint
LINEVUL_CHECKPOINT=checkpoints/linevul_rank python scripts/macos_eval.py
```

Do **not** train the full ~188k Big-Vul set.

## Run the app

```bash
cd frontend && ./run.sh
```

- Quick Scan: Flawfinder
- Full Scan: LineVul line head + Flawfinder fusion (falls back to Flawfinder if no checkpoint)

## Comparison (what the thesis must beat)

| Method | Pairwise AUC | Paired wins | Line MCC |
|---|---|---|---|
| Flawfinder | (binary) | 3/10 | **+0.246** |
| Attention (stock LineVul localization) | measured by `eval_gate` | — | ranking only |
| Line head (epoch 5, no ranking) | **0.544** | 2/10 | ~0 |
| Line head + ranking (next checkpoint) | target **0.65–0.80** | beat 3/10 | target **0.20–0.40** |

Realistic final numbers if ranking works: pairwise AUC **0.65–0.80**, line MCC **0.20–0.40** (match or beat Flawfinder). Do not promise LineVul’s 0.91 F1. The 23-case gate can still fail.
