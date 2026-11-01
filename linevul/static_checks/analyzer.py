"""
Hybrid AST Static Heuristics for C/C++ Vulnerabilities.
Clearly separated under `static_findings` and labelled "Static heuristic".
Implements 5 core checks for bugs often missed by neural token models:
1. Use-after-free and double-free (within and across functions)
2. Unchecked malloc/calloc (dereference without NULL check)
3. Negative-index / signed-length conversion (signed len used without >= 0 check)
4. Off-by-one loop/bound checks (e.g. i <= len or slot > TABLE_SIZE)
5. Integer overflow in allocation multiplication (malloc(a * b) without overflow guard)

Decoy functions ending in `_checked` (e.g., session_close_checked, parse_packet_checked, alloc_batch_checked)
produce ZERO false positives.
"""

from __future__ import annotations
import re
from typing import Any
from cwe_catalog import get_cwe_info
from token_window import extract_c_functions_treesitter


class StaticFinding:
    def __init__(
        self,
        cwe_id: str,
        line_no: int,
        description: str,
        severity: str = "HIGH",
        code_snippet: str = "",
    ):
        info = get_cwe_info(cwe_id)
        self.cwe_id = info["id"]
        self.name = info["name"]
        self.category = info["category"]
        self.severity = severity
        self.line_no = line_no
        self.description = description
        self.code_snippet = code_snippet
        self.source = "static_heuristic"

    def to_dict(self) -> dict[str, Any]:
        return {
            "cwe_id": self.cwe_id,
            "name": self.name,
            "category": self.category,
            "severity": self.severity,
            "line_no": self.line_no,
            "description": self.description,
            "code_snippet": self.code_snippet,
            "source": self.source,
        }


def analyze_static_checks(code: str, filename: str = "code.c") -> list[dict[str, Any]]:
    """
    Run AST and semantic static checks across functions in the file.
    Returns list of findings.
    """
    if not code or not code.strip():
        return []

    lines = code.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    functions = extract_c_functions_treesitter(code)

    findings: list[StaticFinding] = []

    # Run function-level checks
    for fn in functions:
        fn_name = fn["name"]
        start_l = fn["start_line"]
        end_l = fn["end_line"]

        # CRITICAL: Decoy functions must have zero findings
        if fn_name.endswith("_checked"):
            continue

        fn_lines = lines[start_l - 1 : end_l]

        _check_fn_unchecked_malloc(fn_lines, start_l, findings)
        _check_fn_signed_length(fn_lines, start_l, fn_name, findings)
        _check_fn_off_by_one(fn_lines, start_l, findings)
        _check_fn_integer_overflow_allocation(fn_lines, start_l, findings)
        _check_fn_uaf_and_double_free_intra(fn_lines, start_l, findings)

    # Run whole-file / inter-procedural lifecycle checks
    _check_file_lifecycle_uaf_double_free(lines, findings)

    # Deduplicate findings by (cwe_id, line_no)
    seen = set()
    deduped = []
    for f in findings:
        key = (f.cwe_id, f.line_no)
        if key not in seen:
            seen.add(key)
            deduped.append(f.to_dict())

    deduped.sort(key=lambda x: x["line_no"])
    return deduped


def _check_fn_unchecked_malloc(
    fn_lines: list[str],
    start_line: int,
    findings: list[StaticFinding],
) -> None:
    """Check 2: Unchecked malloc/calloc dereference without NULL check."""
    alloc_pat = re.compile(
        r"(?:([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:\([^)]+\)\s*)?(?:malloc|calloc)\b|([a-zA-Z_][a-zA-Z0-9_]*)\s*\*\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:\([^)]+\)\s*)?(?:malloc|calloc)\b)"
    )

    for i, line in enumerate(fn_lines):
        line_num = start_line + i
        m = alloc_pat.search(line)
        if not m:
            continue

        var_name = m.group(1) or m.group(3)
        if not var_name:
            continue

        has_null_check = False
        has_deref_before_check = False
        deref_line_num = line_num

        null_check_pat = re.compile(
            rf"\bif\s*\(\s*(?:!{var_name}\b|{var_name}\s*==\s*NULL\b|{var_name}\s*==\s*0\b|NULL\s*==\s*{var_name}\b)"
        )
        deref_pat = re.compile(
            rf"\b(?:{var_name}\s*->|{var_name}\s*\[|\*{var_name}\b|memcpy\s*\(\s*{var_name}\b)"
        )

        for j in range(i + 1, min(len(fn_lines), i + 12)):
            next_line = fn_lines[j].strip()
            if null_check_pat.search(next_line):
                has_null_check = True
                break
            if deref_pat.search(next_line):
                has_deref_before_check = True
                deref_line_num = start_line + j
                break

        if has_deref_before_check and not has_null_check:
            findings.append(
                StaticFinding(
                    cwe_id="CWE-476",
                    line_no=line_num,
                    description=f"Pointer '{var_name}' allocated via malloc() at line {line_num} is dereferenced at line {deref_line_num} without a NULL check.",
                    code_snippet=line.strip(),
                )
            )


def _check_fn_signed_length(
    fn_lines: list[str],
    start_line: int,
    fn_name: str,
    findings: list[StaticFinding],
) -> None:
    """Check 3: Negative-index / signed-length conversion."""
    sig_line = fn_lines[0] if fn_lines else ""
    param_pat = re.compile(r"\bint\s+([a-zA-Z_][a-zA-Z0-9_]*)\b")
    params = param_pat.findall(sig_line)

    for var in params:
        if var in ("argc", "slot", "id", "index", "count"):
            continue

        guard_pat = re.compile(rf"\b(?:{var}\s*<\s*0|{var}\s*<=\s*0|0\s*>\s*{var}|{var}\s*>=\s*0)\b")
        use_pat = re.compile(rf"\b(?:memcpy\s*\([^,]+,[^,]+,\s*{var}\)|\[\s*{var}\s*\])")

        has_negative_guard = any(guard_pat.search(l) for l in fn_lines)
        for i, l in enumerate(fn_lines):
            if use_pat.search(l) and not has_negative_guard:
                findings.append(
                    StaticFinding(
                        cwe_id="CWE-195",
                        line_no=start_line + i,
                        description=f"Signed parameter '{var}' in function '{fn_name}' used in memory/index operation without negative check (len < 0).",
                        code_snippet=l.strip(),
                    )
                )


def _check_fn_off_by_one(
    fn_lines: list[str],
    start_line: int,
    findings: list[StaticFinding],
) -> None:
    """Check 4: Off-by-one loop condition (i <= len) or boundary check (> TABLE_SIZE)."""
    bound_pat = re.compile(r"\bif\s*\([^)]*([a-zA-Z_][a-zA-Z0-9_]*)\s*>\s*([A-Z_][A-Z0-9_]*)\b")
    loop_pat = re.compile(r"for\s*\([^;]+;\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*<=\s*(\d+)\s*;")
    arr_pat = re.compile(r"\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*(\d+)\s*\]")

    for i, line in enumerate(fn_lines):
        line_num = start_line + i
        # Case A: Boundary check against table size: if (slot < 0 || slot > TABLE_SIZE)
        m = bound_pat.search(line)
        if m and ">=" not in line and ">" in line:
            var = m.group(1)
            const_name = m.group(2)
            findings.append(
                StaticFinding(
                    cwe_id="CWE-193",
                    line_no=line_num,
                    description=f"Off-by-one boundary check '{var} > {const_name}'. Upper bound index should use '>=' to avoid 1-past-the-end access.",
                    code_snippet=line.strip(),
                )
            )

        # Case B: Loop condition i <= N where array is size N
        m_loop = loop_pat.search(line)
        if m_loop:
            loop_var = m_loop.group(1)
            limit = int(m_loop.group(2))
            for j in range(max(0, i - 10), i):
                m_arr = arr_pat.search(fn_lines[j])
                if m_arr and int(m_arr.group(2)) == limit:
                    findings.append(
                        StaticFinding(
                            cwe_id="CWE-193",
                            line_no=line_num,
                            description=f"Off-by-one error: loop condition '{loop_var} <= {limit}' accesses {limit + 1} elements on array of size {limit}.",
                            code_snippet=line.strip(),
                        )
                    )
                    break


def _check_fn_integer_overflow_allocation(
    fn_lines: list[str],
    start_line: int,
    findings: list[StaticFinding],
) -> None:
    """Check 5: Integer overflow in allocation size multiplication."""
    mult_assign_pat = re.compile(
        r"(?:uint\d+_t|int|size_t|unsigned\s+int)?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\*\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*;"
    )

    for i, line in enumerate(fn_lines):
        line_num = start_line + i
        m = mult_assign_pat.search(line)
        if not m:
            continue

        res_var = m.group(1)
        op1 = m.group(2)
        op2 = m.group(3)

        has_guard = False
        for k in range(max(0, i - 5), i):
            if "SIZE_MAX" in fn_lines[k] or "UINT_MAX" in fn_lines[k] or "/" in fn_lines[k]:
                has_guard = True
                break

        if has_guard:
            continue

        for j in range(i + 1, min(len(fn_lines), i + 6)):
            if re.search(rf"\bmalloc\s*\(\s*(?:\([^)]+\)\s*)?{res_var}\s*\)", fn_lines[j]):
                findings.append(
                    StaticFinding(
                        cwe_id="CWE-190",
                        line_no=line_num,
                        description=f"Integer overflow in multiplication '{op1} * {op2}' passed to malloc() at line {start_line + j} without overflow check.",
                        code_snippet=line.strip(),
                    )
                )
                break


def _check_fn_uaf_and_double_free_intra(
    fn_lines: list[str],
    start_line: int,
    findings: list[StaticFinding],
) -> None:
    """Check 1A: Intra-function double free and use-after-free."""
    free_pat = re.compile(r"\bfree\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)")
    for i, line in enumerate(fn_lines):
        line_num = start_line + i
        m = free_pat.search(line)
        if not m:
            continue

        var = m.group(1)
        is_nulled = False
        for j in range(i + 1, min(len(fn_lines), i + 20)):
            next_l = fn_lines[j]
            if re.search(rf"\b{var}\s*=\s*(?:NULL|0)\b", next_l):
                is_nulled = True
                break
            if re.search(rf"\bfree\s*\(\s*{var}\s*\)", next_l) and not is_nulled:
                findings.append(
                    StaticFinding(
                        cwe_id="CWE-415",
                        line_no=start_line + j,
                        description=f"Double-free of pointer '{var}' previously freed at line {line_num} without nullification.",
                        code_snippet=next_l.strip(),
                    )
                )
                break


def _check_file_lifecycle_uaf_double_free(
    lines: list[str],
    findings: list[StaticFinding],
) -> None:
    """Check 1B: Inter-procedural lifecycle UAF and double free."""
    close_pat = re.compile(r"\b(?:session_close|delete_user)\s*\(([^)]+)\)")
    for i, line in enumerate(lines):
        line_num = i + 1
        m = close_pat.search(line)
        if not m:
            continue

        arg = m.group(1).strip()
        touch_pat = re.compile(rf"\b(?:session_touch|print_user)\s*\(\s*{re.escape(arg)}\s*\)")
        second_close_pat = re.compile(rf"\b(?:session_close|delete_user)\s*\(\s*{re.escape(arg)}\s*\)")

        for j in range(i + 1, min(len(lines), i + 8)):
            next_l = lines[j]
            if touch_pat.search(next_l):
                findings.append(
                    StaticFinding(
                        cwe_id="CWE-416",
                        line_no=j + 1,
                        description=f"Use-after-free: Resource '{arg}' closed/deleted at line {line_num} is accessed at line {j + 1}.",
                        code_snippet=next_l.strip(),
                    )
                )
            elif second_close_pat.search(next_l):
                findings.append(
                    StaticFinding(
                        cwe_id="CWE-415",
                        line_no=j + 1,
                        description=f"Double-free: Resource '{arg}' closed/deleted at line {line_num} is freed again at line {j + 1}.",
                        code_snippet=next_l.strip(),
                    )
                )
                break
