"""LineVul — line-level vulnerability scanner (Streamlit)."""

import sys
from pathlib import Path

import streamlit as st

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent))

from scanner import VulnerabilityScanner, find_source_files
from linevul.infer import find_checkpoint

st.set_page_config(
    page_title="LineVul — Vulnerability Scanner",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
<style>
    .vuln-line { background-color: rgba(255, 60, 60, 0.15); border-left: 3px solid #ff3c3c;
        padding: 2px 8px; margin: 1px 0; font-family: ui-monospace, monospace; font-size: 13px; }
    .safe-line { background-color: rgba(40, 200, 80, 0.05); border-left: 3px solid #28c850;
        padding: 2px 8px; margin: 1px 0; font-family: ui-monospace, monospace; font-size: 13px; }
    .warn-line { background-color: rgba(255, 180, 0, 0.12); border-left: 3px solid #ffb400;
        padding: 2px 8px; margin: 1px 0; font-family: ui-monospace, monospace; font-size: 13px; }
    .line-number { color: #888; min-width: 35px; display: inline-block; user-select: none; }
    .confidence-badge { float: right; font-size: 11px; padding: 1px 6px; border-radius: 8px; font-weight: 600; }
    .badge-high { background: #ff3c3c22; color: #ff3c3c; }
    .badge-med { background: #ffb40022; color: #cc8800; }
    .badge-low { background: #28c85022; color: #28c850; }
</style>
""",
    unsafe_allow_html=True,
)

if "scanner" not in st.session_state:
    st.session_state.scanner = None
if "scanner_ckpt" not in st.session_state:
    st.session_state.scanner_ckpt = ""


def get_scanner():
    ckpt = find_checkpoint()
    key = str(ckpt) if ckpt else ""
    if st.session_state.scanner is None or st.session_state.scanner_ckpt != key:
        st.session_state.scanner = VulnerabilityScanner()
        st.session_state.scanner_ckpt = key
    return st.session_state.scanner
if "scan_result" not in st.session_state:
    st.session_state.scan_result = None
if "code_input" not in st.session_state:
    st.session_state.code_input = ""
if "repo_result" not in st.session_state:
    st.session_state.repo_result = None
if "repo_path" not in st.session_state:
    st.session_state.repo_path = ""

SAMPLE_MODEL_CODE = '''void copy_name(char *user_input) {
    char buf[64];
    int len;
    len = strlen(user_input);
    strcpy(buf, user_input);
    printf("%s\\n", buf);
}
'''

SAMPLE_CODE = '''#include <stdio.h>
#include <string.h>
#include <stdlib.h>

void process_input(char *user_input) {
    char buffer[64];
    char temp[128];
    strcpy(buffer, user_input);
    printf(user_input);
    char *data = (char *)malloc(strlen(user_input));
    if (data == NULL) return;
    sprintf(temp, "Processing: %s", user_input);
    free(data);
    memcpy(buffer, data, 64);
    printf("Done: %s\\n", buffer);
}
'''

with st.sidebar:
    st.title("LineVul")
    st.caption("Line-level C/C++ vulnerability detection")
    st.divider()
    scan_mode = st.radio(
        "Scan Mode",
        [
            "Model (LineVul only)",
            "Quick (Flawfinder)",
            "Full (LineVul + Flawfinder)",
        ],
        help="Model = trained CodeBERT line head only. Quick = Flawfinder. Full = both.",
    )
    _pre = get_scanner()
    ollama_up = bool(_pre.get_status().get("ollama"))
    ollama = getattr(_pre, "_llm", None)
    if "use_llm" not in st.session_state:
        st.session_state.use_llm = ollama_up
    use_llm = st.checkbox(
        "LLM rerank (Ollama)",
        key="use_llm",
        help="7B coder votes only on a few candidate lines. Cannot unflag LineVul or Flawfinder.",
    )
    if ollama_up:
        st.caption(f"Using `{getattr(ollama, 'model', 'qwen2.5-coder:7b')}`.")
    elif ollama is not None and getattr(ollama, "server_up", False):
        st.caption(
            "Ollama is running but **no model** is installed. "
            "In a new terminal: `ollama pull qwen2.5-coder:7b` then Reload model."
        )
    else:
        st.caption("Ollama server is off. Run `ollama serve`, then Reload model.")
    st.divider()
    st.subheader("Tool Status")
    if st.button("Reload model", use_container_width=True):
        st.session_state.scanner = None
        st.session_state.scanner_ckpt = ""
        st.rerun()
    with st.spinner("Checking tools..."):
        scanner = get_scanner()
    status = scanner.get_status()
    for tool, available in status.items():
        st.markdown(f"{'OK' if available else 'missing'} **{tool}**")
    if not status.get("linevul"):
        st.info("No checkpoint in `checkpoints/`. Full Scan falls back to Flawfinder.")
    else:
        ckpt_name = Path(scanner.model.checkpoint).name if scanner.model.checkpoint else "?"
        st.success(f"Loaded **{ckpt_name}**")
        with st.expander("Trained model"):
            for k, v in scanner.get_model_info().items():
                st.caption(f"**{k}**: {v}")
    st.divider()
    st.caption("Base: LineVul (Fu & Tantithamthavorn, 2022). Line head is supervised, not attention.")


def _display_score(lr) -> float:
    """Score shown on the badge: model rank, or SAST floor if only Flawfinder fired."""
    model_p = float(getattr(lr, "model_prob", 0.0) or 0.0)
    conf = float(lr.confidence or 0.0)
    sources = lr.sources or []
    if "linevul" in sources:
        return max(model_p, conf)
    if "llm" in sources:
        return max(model_p, conf, 0.6)
    if "flawfinder" in sources:
        return conf if conf >= 0.5 else 0.8
    return model_p


def _fmt_pct(p: float) -> str:
    if p >= 0.005:
        return f"{p:.0%}"
    return f"{p:.1%}"


def render_annotated_code(result, key_prefix: str):
    show_filter = st.selectbox(
        "Show",
        ["All Lines", "Vulnerable Only", "Safe Only"],
        key=f"{key_prefix}_filter",
        label_visibility="collapsed",
    )
    html_lines = []
    for lr in result.lines:
        if show_filter == "Vulnerable Only" and not lr.is_vulnerable:
            continue
        if show_filter == "Safe Only" and lr.is_vulnerable:
            continue
        escaped = (
            lr.code.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace(" ", "&nbsp;").replace("\t", "&nbsp;&nbsp;&nbsp;&nbsp;")
        )
        if lr.is_vulnerable and _display_score(lr) >= 0.7:
            css, badge = "vuln-line", "badge-high"
        elif lr.is_vulnerable:
            css, badge = "warn-line", "badge-med"
        else:
            css, badge = "safe-line", "badge-low"
        tags = ""
        if lr.sources:
            tags = "&nbsp;" + " ".join(
                f'<span style="font-size:10px;color:#aaa;">[{s}]</span>' for s in lr.sources
            )
        pct = _fmt_pct(_display_score(lr))
        html_lines.append(
            f'<div class="{css}"><span class="line-number">{lr.line_number:3d}</span> '
            f"{escaped}{tags}"
            f'<span class="confidence-badge {badge}">{pct}</span></div>'
        )
    st.markdown("\n".join(html_lines), unsafe_allow_html=True)


def render_vuln_table(result):
    ranked = sorted(
        [lr for lr in result.lines if _display_score(lr) > 0.001 or lr.is_vulnerable],
        key=lambda lr: -_display_score(lr),
    )
    rows = [
        {
            "Rank": i,
            "Line": lr.line_number,
            "Code": lr.code.strip()[:80],
            "Score": _fmt_pct(_display_score(lr)),
            "LineVul": _fmt_pct(float(getattr(lr, "model_prob", 0.0) or 0.0)),
            "Flagged": "yes" if lr.is_vulnerable else "",
            "Sources": ", ".join(lr.sources),
        }
        for i, lr in enumerate(ranked, start=1)
    ]
    if rows:
        st.caption("Lines ranked by shown score. LineVul column is the neural net only.")
        st.dataframe(rows, use_container_width=True, hide_index=True)


def render_scan_report(result, key_prefix: str):
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Lines", result.total_lines)
    c2.metric("Vulnerable Lines", result.vulnerable_lines)
    ratio = f"{result.vulnerable_lines / result.total_lines * 100:.1f}%" if result.total_lines else "0%"
    c3.metric("Vulnerability Ratio", ratio)
    c4.metric("Scan Mode", result.scan_mode)
    st.caption(f"LineVul function-level probability: {result.func_prob:.4f}")
    if result.scan_mode == "model-missing":
        st.warning("No LineVul checkpoint loaded. Sidebar should say **linevul_cwe_mix**. Click Reload model.")
    elif result.scan_mode == "model":
        st.caption(
            "Every line shows its **rank score**. Red = score ≥ 50% (flagged). "
            "Grey is still ranked, just below the flag line."
        )
    elif result.scan_mode == "full-fused":
        st.caption(
            "Badge = LineVul rank. Red if the line head is ≥ 50% **or** Flawfinder hit."
        )
    max_p = max((getattr(lr, "model_prob", 0.0) or 0.0) for lr in result.lines) if result.lines else 0.0
    if result.scan_mode == "model" and result.func_prob < 0.01 and max_p < 0.05:
        st.warning(
            "Model scores are near zero — this is the old Big-Vul checkpoint, or the model did not load. "
            "Confirm the sidebar says **linevul_cwe_mix**, then Reload model."
        )
    st.divider()
    st.subheader("Scan Results")
    render_annotated_code(result, key_prefix)
    st.divider()
    st.subheader("Line ranking")
    render_vuln_table(result)


st.title("LineVul Vulnerability Scanner")
tab_snippet, tab_repo = st.tabs(["Single File / Snippet", "Scan Folder"])

with tab_snippet:
    st.markdown("Paste C/C++ code or upload a file for line-level scoring.")
    col_input, col_upload = st.columns([3, 1])
    with col_upload:
        uploaded = st.file_uploader("Upload .c/.cpp/.h", type=["c", "cpp", "h", "cc", "cxx"])
        if uploaded:
            st.session_state.code_input = uploaded.read().decode("utf-8")
        if st.button("Load Sample (Flawfinder demo)", use_container_width=True):
            st.session_state.code_input = SAMPLE_CODE
        if st.button("Load C function (LineVul demo)", use_container_width=True):
            st.session_state.code_input = SAMPLE_MODEL_CODE
    with col_input:
        code = st.text_area(
            "Source Code",
            value=st.session_state.code_input,
            height=400,
            placeholder="Paste your C/C++ code here...",
            label_visibility="collapsed",
        )
    b1, b2, _ = st.columns([1, 1, 4])
    scan_clicked = b1.button("Scan Code", type="primary", use_container_width=True, disabled=not code.strip())
    if b2.button("Clear", use_container_width=True):
        st.session_state.scan_result = None
        st.session_state.code_input = ""
        st.rerun()

    if scan_clicked and code.strip():
        scanner = get_scanner()
        use_model = scan_mode.startswith("Model")
        use_full = scan_mode.startswith("Full")
        spinner = (
            "Running LineVul + Ollama..."
            if use_model and use_llm
            else "Running LineVul..."
            if use_model
            else "Running LineVul + Flawfinder + Ollama..."
            if use_full and use_llm
            else "Running LineVul + Flawfinder..."
            if use_full
            else "Running Flawfinder..."
        )
        with st.spinner(spinner):
            if use_model:
                st.session_state.scan_result = scanner.model_scan(code, use_llm=use_llm)
            elif use_full:
                st.session_state.scan_result = scanner.full_scan(code, use_llm=use_llm)
            else:
                st.session_state.scan_result = scanner.quick_scan(code)

    if st.session_state.scan_result:
        st.divider()
        render_scan_report(st.session_state.scan_result, "snippet")

with tab_repo:
    st.markdown("Scan every C/C++ file in a local folder.")
    repo_path_input = st.text_input(
        "Folder path",
        value=st.session_state.repo_path,
        placeholder="/Users/you/projects/some-c-repo",
    )
    o1, o2, o3, o4 = st.columns(4)
    repo_mode = o1.selectbox(
        "Mode",
        ["Model (LineVul only)", "Quick (Flawfinder)", "Full (LineVul + Flawfinder)"],
    )
    include_headers = o2.checkbox("Include headers", value=True)
    skip_tests = o3.checkbox("Skip test dirs", value=True)
    max_files = o4.number_input("Max files", min_value=1, max_value=5000, value=100, step=25)
    r1, r2, _ = st.columns([1, 1, 3])
    repo_scan_clicked = r1.button(
        "Scan Folder", type="primary", use_container_width=True,
        disabled=not repo_path_input.strip(),
    )
    if r2.button("Clear Results", use_container_width=True, key="repo_clear"):
        st.session_state.repo_result = None
        st.rerun()

    if repo_path_input.strip():
        candidate = Path(repo_path_input.strip()).expanduser()
        if not candidate.is_dir():
            st.warning(f"Not a folder: `{candidate}`")
        else:
            found = find_source_files(candidate, include_headers=include_headers, skip_tests=skip_tests)
            cap = f" — will scan the first {max_files}." if len(found) > max_files else "."
            st.caption(f"Found **{len(found)}** C/C++ files{cap}")

    if repo_scan_clicked:
        scanner = get_scanner()
        target = Path(repo_path_input.strip()).expanduser()
        if not target.is_dir():
            st.error(f"Not a folder: `{target}`")
        else:
            st.session_state.repo_path = repo_path_input
            bar = st.progress(0.0)
            status = st.empty()

            def _progress(idx, total, path):
                bar.progress(min(idx / total if total else 1.0, 1.0))
                status.caption(f"[{idx}/{total}] {path}")

            if repo_mode.startswith("Model"):
                repo_scan_mode = "model"
            elif repo_mode.startswith("Full"):
                repo_scan_mode = "full"
            else:
                repo_scan_mode = "quick"
            st.session_state.repo_result = scanner.scan_repository(
                target,
                mode=repo_scan_mode,
                include_headers=include_headers,
                skip_tests=skip_tests,
                max_files=int(max_files),
                progress_callback=_progress,
            )
            bar.empty()
            status.empty()

    repo_report = st.session_state.repo_result
    if repo_report:
        st.divider()
        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Files Scanned", repo_report.files_scanned)
        m2.metric("Affected Files", len(repo_report.affected_files))
        m3.metric("Flagged Lines", repo_report.total_vulnerable_lines)
        m4.metric("Mode", repo_report.scan_mode)
        if repo_report.failed_files:
            with st.expander(f"{len(repo_report.failed_files)} file(s) failed"):
                for f in repo_report.failed_files:
                    st.caption(f"`{f.path}` — {f.error}")
        rows = [
            {
                "File": f.path,
                "Flagged Lines": f.vulnerable_lines,
                "Total Lines": f.total_lines,
                "Ratio": f"{f.vuln_ratio:.0%}",
                "Max Confidence": f"{f.max_confidence:.0%}",
                "Scored By": f.scored_by,
            }
            for f in repo_report.files
            if not f.error
        ]
        if rows:
            st.dataframe(rows, use_container_width=True, hide_index=True)
            csv_lines = ["file,line,confidence,scored_by,sources,code"]
            for f in repo_report.files:
                if not f.report:
                    continue
                for lr in f.report.lines:
                    if lr.is_vulnerable:
                        safe = lr.code.strip().replace('"', '""')
                        csv_lines.append(
                            f'"{f.path}",{lr.line_number},{lr.confidence},'
                            f'"{f.scored_by}","{"|".join(lr.sources)}","{safe}"'
                        )
            st.download_button(
                "Download findings (CSV)",
                data="\n".join(csv_lines),
                file_name="linevul_findings.csv",
                mime="text/csv",
            )
            st.subheader("Inspect a File")
            affected = [f for f in repo_report.files if f.report and not f.error]
            if affected:
                choice = st.selectbox("File", options=[f.path for f in affected], key="repo_file_choice")
                chosen = next((f for f in affected if f.path == choice), None)
                if chosen and chosen.report:
                    render_annotated_code(chosen.report, "repo_detail")
                    render_vuln_table(chosen.report)
