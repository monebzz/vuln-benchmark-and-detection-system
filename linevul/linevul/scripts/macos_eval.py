#!/usr/bin/env python3
"""Run gate eval on this Mac (avoids a NumPy Accelerate segfault)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

_plat = sys.platform
sys.platform = "linux"
import torch  # noqa: E402, F401
sys.platform = _plat

from scripts.eval_gate import main

if __name__ == "__main__":
    main()
