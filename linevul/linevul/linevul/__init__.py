"""LineVul-style line-level vulnerability detection.

Fine-tunes CodeBERT with a function head and a mean-pooled supervised
line head. No Joern, DGL, or GNN.

Heavy imports (torch / transformers) live in model.py, train.py, infer.py
so `scripts/prepare_subset.py` can run with the stdlib only.
"""
