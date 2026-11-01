"""
Token sliding window and Tree-Sitter C/C++ function parser.
Implements window size 512 with stride 256 for long files (>512 tokens),
aggregating file probability (max over windows) and line attention (max over windows containing line).
"""

from __future__ import annotations
import re
from typing import Any

try:
    import tree_sitter
    import tree_sitter_c
    TREE_SITTER_AVAILABLE = True
except Exception:
    TREE_SITTER_AVAILABLE = False


def _extract_identifier(node: Any) -> str:
    """Recursively search for function identifier in declarator node."""
    if node.type == "identifier":
        return node.text.decode("utf-8")
    for child in node.children:
        if child.type in ("function_declarator", "declarator", "pointer_declarator"):
            res = _extract_identifier(child)
            if res != "unknown":
                return res
        elif child.type == "identifier":
            return child.text.decode("utf-8")
    return "unknown"


def extract_c_functions_treesitter(code: str) -> list[dict[str, Any]]:
    """Extract all C/C++ function definitions using Tree-Sitter C parser."""
    if not TREE_SITTER_AVAILABLE:
        return extract_c_functions_fallback(code)

    try:
        lang = tree_sitter.Language(tree_sitter_c.language())
        parser = tree_sitter.Parser(lang)
        code_bytes = code.encode("utf-8")
        tree = parser.parse(code_bytes)
        code_lines = code.replace("\r\n", "\n").replace("\r", "\n").split("\n")

        functions: list[dict[str, Any]] = []

        def visit(node: Any):
            if node.type == "function_definition":
                decl = node.child_by_field_name("declarator")
                name = _extract_identifier(decl) if decl else "unknown"
                start_line = node.start_point.row + 1
                end_line = node.end_point.row + 1
                func_code = "\n".join(code_lines[start_line - 1 : end_line])
                functions.append({
                    "name": name,
                    "start_line": start_line,
                    "end_line": end_line,
                    "code": func_code,
                })
                return
            for child in node.children:
                visit(child)

        visit(tree.root_node)
        return functions
    except Exception:
        return extract_c_functions_fallback(code)


def extract_c_functions_fallback(code: str) -> list[dict[str, Any]]:
    """Fallback brace-matching C function extractor if Tree-Sitter is unavailable."""
    code_lines = code.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    functions = []
    sig_pattern = re.compile(
        r"^[a-zA-Z_][a-zA-Z0-9_*&<>\s:]*\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^;]*\)\s*\{?"
    )

    in_func = False
    func_name = ""
    start_line = 0
    brace_depth = 0

    for idx, line in enumerate(code_lines):
        line_num = idx + 1
        stripped = line.strip()

        if not in_func:
            m = sig_pattern.match(line)
            if m and not stripped.startswith("typedef") and not stripped.startswith("struct"):
                func_name = m.group(1)
                start_line = line_num
                in_func = True
                brace_depth = line.count("{") - line.count("}")
                if brace_depth <= 0 and "{" in line:
                    functions.append({
                        "name": func_name,
                        "start_line": start_line,
                        "end_line": line_num,
                        "code": "\n".join(code_lines[start_line - 1 : line_num]),
                    })
                    in_func = False
        else:
            brace_depth += line.count("{") - line.count("}")
            if brace_depth <= 0:
                functions.append({
                    "name": func_name,
                    "start_line": start_line,
                    "end_line": line_num,
                    "code": "\n".join(code_lines[start_line - 1 : line_num]),
                })
                in_func = False

    return functions


def create_token_windows(
    code: str,
    tokenizer: Any,
    window_size: int = 512,
    stride: int = 256,
) -> list[dict[str, Any]]:
    """
    Split tokenized code into sliding windows (size 512, stride 256)
    with accurate line number mapping derived from offset_mapping.
    """
    # Compute character index to 1-based line number lookup
    char_to_line: list[int] = []
    current_line = 1
    for ch in code:
        char_to_line.append(current_line)
        if ch == "\n":
            current_line += 1

    # Tokenize with offsets
    encoding = tokenizer(
        code,
        return_offsets_mapping=True,
        add_special_tokens=False,
    )
    input_ids = encoding["input_ids"]
    offsets = encoding["offset_mapping"]
    total_tokens = len(input_ids)

    if total_tokens == 0:
        return []

    windows: list[dict[str, Any]] = []
    start = 0

    while start < total_tokens:
        end = min(total_tokens, start + window_size)
        win_ids = input_ids[start:end]
        win_offsets = offsets[start:end]

        # Map tokens to line numbers
        token_lines: list[int] = []
        for c_start, c_end in win_offsets:
            if c_start < len(char_to_line):
                token_lines.append(char_to_line[c_start])
            else:
                token_lines.append(current_line)

        contained_lines = sorted(set(token_lines)) if token_lines else []
        windows.append({
            "window_index": len(windows),
            "start_token": start,
            "end_token": end,
            "input_ids": win_ids,
            "token_lines": token_lines,
            "contained_lines": contained_lines,
        })

        if end >= total_tokens:
            break
        start += stride

    return windows
