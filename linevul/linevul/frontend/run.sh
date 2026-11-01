#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -d "$PROJECT_DIR/venv" ]; then
    # shellcheck disable=SC1091
    source "$PROJECT_DIR/venv/bin/activate"
elif [ -d "$PROJECT_DIR/../linevd/venv" ]; then
    # Reuse the existing FYP venv until this folder has its own.
    # shellcheck disable=SC1091
    source "$PROJECT_DIR/../linevd/venv/bin/activate"
fi

cd "$SCRIPT_DIR"
export PYTHONPATH="$PROJECT_DIR${PYTHONPATH:+:$PYTHONPATH}"
if [ -z "${LINEVUL_CHECKPOINT:-}" ]; then
    if [ -f "$PROJECT_DIR/checkpoints/linevul_cwe_mix/pytorch_model.bin" ]; then
        export LINEVUL_CHECKPOINT="$PROJECT_DIR/checkpoints/linevul_cwe_mix"
    elif [ -f "$PROJECT_DIR/checkpoints/linevul_cwe/pytorch_model.bin" ]; then
        export LINEVUL_CHECKPOINT="$PROJECT_DIR/checkpoints/linevul_cwe"
    fi
fi
streamlit run app.py --server.port 8502 --server.headless true
