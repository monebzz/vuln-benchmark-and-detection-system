#!/usr/bin/env python3
"""Build a CWE-labelled C training set so the line head learns real sinks.

Big-Vul labels are 'lines removed in a Git patch'. That does not teach
strcpy/gets/printf. These examples label the actual vulnerable statement.
The paired CWE eval corpus is never copied into this set.
"""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FUNCS = [
    "copy_user", "copy_username", "copy_token", "read_name", "store_id",
    "parse_arg", "load_path", "fill_buf", "write_msg", "handle_input",
    "set_title", "save_key", "read_host", "copy_field", "ingest_line",
]
BUFS = ["buf", "username", "name", "tmp", "storage", "slot", "path", "msg"]
ARGS = ["input", "src", "arg", "user", "value", "raw", "text", "data"]
SIZES = [8, 16, 32, 64, 128, 256]


def rec(rid: str, lines: list[str], labels: list[int], vul: int) -> dict:
    code = "\n".join(lines) + "\n"
    return {
        "id": rid,
        "code": code,
        "func_label": vul,
        "line_labels": sorted(set(labels)),
        "n_lines": len(lines),
    }


def brace(rng: random.Random, sig: str) -> list[str]:
    if rng.random() < 0.5:
        return [sig, "{"]
    return [sig + " {"]


def extra(rng: random.Random) -> list[str]:
    opts = [
        "    int n = 0;",
        "    int ok = 1;",
        "    size_t k = 0;",
        "    int flag = 0;",
    ]
    if rng.random() < 0.6:
        return [rng.choice(opts)]
    return []


def strcpy_vuln(rng: random.Random, i: int) -> dict:
    fn, buf, arg, sz = rng.choice(FUNCS), rng.choice(BUFS), rng.choice(ARGS), rng.choice(SIZES)
    ret = rng.choice(["int", "void"])
    sig = f"{ret} {fn}_{i}(const char *{arg})"
    lines = brace(rng, sig)
    lines += extra(rng)
    lines.append(f"    char {buf}[{sz}];")
    if rng.random() < 0.7:
        lines += [f"    if ({arg} == NULL)", "        return -1;" if ret == "int" else "        return;"]
    sink = f"    strcpy({buf}, {arg});"
    lines.append(sink)
    lab = [len(lines)]
    if rng.random() < 0.5:
        lines += [f"    if (strlen({buf}) == 0)", "        return -1;" if ret == "int" else "        return;"]
    lines.append(f'    printf("out: %s\\n", {buf});')
    lines.append("    return 0;" if ret == "int" else "    return;")
    lines.append("}")
    return rec(f"syn_strcpy_{i}", lines, lab, 1)


def strcpy_ok(rng: random.Random, i: int) -> dict:
    fn, buf, arg, sz = rng.choice(FUNCS), rng.choice(BUFS), rng.choice(ARGS), rng.choice(SIZES)
    sig = f"int {fn}_ok_{i}(const char *{arg})"
    lines = brace(rng, sig)
    lines += [
        f"    char {buf}[{sz}];",
        f"    if ({arg} == NULL)",
        "        return -1;",
        f"    strncpy({buf}, {arg}, sizeof({buf}) - 1);",
        f"    {buf}[sizeof({buf}) - 1] = '\\0';",
        f'    printf("out: %s\\n", {buf});',
        "    return 0;",
        "}",
    ]
    return rec(f"syn_strcpy_ok_{i}", lines, [], 0)


def gets_vuln(rng: random.Random, i: int) -> dict:
    buf, sz = rng.choice(BUFS), rng.choice(SIZES)
    lines = brace(rng, f"int read_{i}(void)")
    lines += [f"    char {buf}[{sz}];", f"    gets({buf});"]
    lab = [len(lines)]
    lines += [f"    return (int)strlen({buf});", "}"]
    return rec(f"syn_gets_{i}", lines, lab, 1)


def gets_ok(rng: random.Random, i: int) -> dict:
    buf, sz = rng.choice(BUFS), rng.choice(SIZES)
    lines = brace(rng, f"int read_ok_{i}(void)")
    lines += [
        f"    char {buf}[{sz}];",
        f"    if (fgets({buf}, sizeof({buf}), stdin) == NULL)",
        "        return -1;",
        f"    return (int)strlen({buf});",
        "}",
    ]
    return rec(f"syn_gets_ok_{i}", lines, [], 0)


def printf_vuln(rng: random.Random, i: int) -> dict:
    arg = rng.choice(ARGS)
    lines = brace(rng, f"void log_{i}(char *{arg})")
    lines += extra(rng)
    lines.append(f"    printf({arg});")
    lab = [len(lines)]
    lines += ["}"]
    return rec(f"syn_fmt_{i}", lines, lab, 1)


def printf_ok(rng: random.Random, i: int) -> dict:
    arg = rng.choice(ARGS)
    lines = brace(rng, f"void log_ok_{i}(char *{arg})")
    lines += [f'    printf("%s", {arg});', "}"]
    return rec(f"syn_fmt_ok_{i}", lines, [], 0)


def memcpy_vuln(rng: random.Random, i: int) -> dict:
    buf, sz = rng.choice(BUFS), rng.choice([64, 128, 256])
    lines = brace(rng, f"void store_{i}(char *src, int len)")
    lines += [f"    char {buf}[{sz}];", "    if (len < 0)", "        return;", f"    memcpy({buf}, src, len);"]
    lab = [len(lines)]
    lines += [f"    {buf}[{sz - 1}] = 0;", "}"]
    return rec(f"syn_memcpy_{i}", lines, lab, 1)


def memcpy_ok(rng: random.Random, i: int) -> dict:
    buf, sz = rng.choice(BUFS), rng.choice([64, 128, 256])
    lines = brace(rng, f"void store_ok_{i}(char *src, int len)")
    lines += [
        f"    char {buf}[{sz}];",
        f"    if (len < 0 || (size_t)len > sizeof({buf}))",
        "        return;",
        f"    memcpy({buf}, src, len);",
        f"    {buf}[{sz - 1}] = 0;",
        "}",
    ]
    return rec(f"syn_memcpy_ok_{i}", lines, [], 0)


def sprintf_vuln(rng: random.Random, i: int) -> dict:
    arg = rng.choice(ARGS)
    lines = brace(rng, f"void cmd_{i}(char *{arg})")
    lines += ["    char cmd[64];", f'    sprintf(cmd, "nslookup %s", {arg});']
    lab = [len(lines)]
    lines += ["    system(cmd);", "}"]
    # system is also a sink; label sprintf as the overflow/injection write
    return rec(f"syn_sprintf_{i}", lines, lab, 1)


def sprintf_ok(rng: random.Random, i: int) -> dict:
    arg = rng.choice(ARGS)
    lines = brace(rng, f"void cmd_ok_{i}(const char *{arg})")
    lines += [
        "    char cmd[64];",
        f'    snprintf(cmd, sizeof(cmd), "nslookup %s", {arg});',
        "    /* do not call system on user data */",
        "}",
    ]
    return rec(f"syn_sprintf_ok_{i}", lines, [], 0)


def uaf_vuln(rng: random.Random, i: int) -> dict:
    lines = brace(rng, f"void done_{i}(char *p)")
    lines += ["    free(p);", '    printf("%s", p);']
    lab = [len(lines)]
    lines += ["}"]
    return rec(f"syn_uaf_{i}", lines, lab, 1)


def uaf_ok(rng: random.Random, i: int) -> dict:
    lines = brace(rng, f"void done_ok_{i}(char *p)")
    lines += ['    printf("%s", p);', "    free(p);", "    p = NULL;", "}"]
    return rec(f"syn_uaf_ok_{i}", lines, [], 0)


def double_free_vuln(rng: random.Random, i: int) -> dict:
    lines = brace(rng, f"void drop_{i}(char *p)")
    lines += ["    free(p);", "    free(p);"]
    lab = [len(lines)]
    lines += ["}"]
    return rec(f"syn_dfree_{i}", lines, lab, 1)


def double_free_ok(rng: random.Random, i: int) -> dict:
    lines = brace(rng, f"void drop_ok_{i}(char *p)")
    lines += ["    free(p);", "    p = NULL;", "}"]
    return rec(f"syn_dfree_ok_{i}", lines, [], 0)


def null_vuln(rng: random.Random, i: int) -> dict:
    lines = brace(rng, f"int fill_{i}(int size)")
    lines += ["    char *rec = malloc(size);", "    rec[0] = 'A';"]
    lab = [len(lines)]
    lines += ["    return size;", "}"]
    return rec(f"syn_null_{i}", lines, lab, 1)


def null_ok(rng: random.Random, i: int) -> dict:
    lines = brace(rng, f"int fill_ok_{i}(int size)")
    lines += [
        "    char *rec = malloc(size);",
        "    if (rec == NULL)",
        "        return -1;",
        "    rec[0] = 'A';",
        "    free(rec);",
        "    return size;",
        "}",
    ]
    return rec(f"syn_null_ok_{i}", lines, [], 0)


def oob_vuln(rng: random.Random, i: int) -> dict:
    n = rng.choice([4, 5, 8, 10])
    lines = brace(rng, f"int at_{i}(int index)")
    vals = ", ".join(str(x) for x in range(n))
    lines += [f"    int arr[{n}] = {{{vals}}};", "    return arr[index];"]
    lab = [len(lines)]
    lines += ["}"]
    return rec(f"syn_oob_{i}", lines, lab, 1)


def oob_ok(rng: random.Random, i: int) -> dict:
    n = rng.choice([4, 5, 8, 10])
    lines = brace(rng, f"int at_ok_{i}(int index)")
    vals = ", ".join(str(x) for x in range(n))
    lines += [
        f"    int arr[{n}] = {{{vals}}};",
        f"    if (index < 0 || index >= {n})",
        "        return -1;",
        "    return arr[index];",
        "}",
    ]
    return rec(f"syn_oob_ok_{i}", lines, [], 0)


def overflow_vuln(rng: random.Random, i: int) -> dict:
    lines = brace(rng, f"int add_{i}(int a, int b)")
    lines += ["    return a + b;"]
    lab = [len(lines)]
    lines += ["}"]
    return rec(f"syn_ovf_{i}", lines, lab, 1)


def overflow_ok(rng: random.Random, i: int) -> dict:
    lines = brace(rng, f"int add_ok_{i}(int a, int b)")
    lines += [
        "    if (b > 0 && a > 2147483647 - b)",
        "        return -1;",
        "    return a + b;",
        "}",
    ]
    return rec(f"syn_ovf_ok_{i}", lines, [], 0)


def strcat_vuln(rng: random.Random, i: int) -> dict:
    buf, arg = rng.choice(BUFS), rng.choice(ARGS)
    lines = brace(rng, f"void cat_{i}(char *{arg})")
    lines += [f"    char {buf}[16] = \"id=\";", f"    strcat({buf}, {arg});"]
    lab = [len(lines)]
    lines += ["}"]
    return rec(f"syn_strcat_{i}", lines, lab, 1)


def strcat_ok(rng: random.Random, i: int) -> dict:
    buf, arg = rng.choice(BUFS), rng.choice(ARGS)
    lines = brace(rng, f"void cat_ok_{i}(const char *{arg})")
    lines += [
        f"    char {buf}[16] = \"id=\";",
        f"    strncat({buf}, {arg}, sizeof({buf}) - strlen({buf}) - 1);",
        "}",
    ]
    return rec(f"syn_strcat_ok_{i}", lines, [], 0)


GENERATORS = [
    (strcpy_vuln, 900),
    (strcpy_ok, 900),
    (gets_vuln, 400),
    (gets_ok, 400),
    (printf_vuln, 500),
    (printf_ok, 500),
    (memcpy_vuln, 400),
    (memcpy_ok, 400),
    (sprintf_vuln, 350),
    (sprintf_ok, 350),
    (strcat_vuln, 300),
    (strcat_ok, 300),
    (uaf_vuln, 350),
    (uaf_ok, 350),
    (double_free_vuln, 250),
    (double_free_ok, 250),
    (null_vuln, 350),
    (null_ok, 350),
    (oob_vuln, 400),
    (oob_ok, 400),
    (overflow_vuln, 200),
    (overflow_ok, 200),
]


def build(out_dir: Path, seed: int = 1) -> dict:
    rng = random.Random(seed)
    rows = []
    for gen, n in GENERATORS:
        for i in range(n):
            rows.append(gen(rng, i))
    rng.shuffle(rows)
    n = len(rows)
    n_test = max(1, int(n * 0.1))
    n_val = max(1, int(n * 0.1))
    test, val, train = rows[:n_test], rows[n_test : n_test + n_val], rows[n_test + n_val :]
    out_dir.mkdir(parents=True, exist_ok=True)
    splits = {"train": train, "val": val, "test": test}
    for name, part in splits.items():
        with (out_dir / f"{name}.jsonl").open("w") as handle:
            for row in part:
                handle.write(json.dumps(row) + "\n")
    stats = {
        "kind": "synthetic_cwe_sinks",
        "seed": seed,
        "train": len(train),
        "val": len(val),
        "test": len(test),
        "train_vul": sum(r["func_label"] for r in train),
        "val_vul": sum(r["func_label"] for r in val),
        "note": "Line labels are CWE sinks, not Big-Vul removed lines. Eval corpus not included.",
    }
    (out_dir / "stats.json").write_text(json.dumps(stats, indent=2))
    return stats


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--out-dir", default=str(ROOT / "data" / "cwe_synth"))
    p.add_argument("--seed", type=int, default=1)
    args = p.parse_args()
    stats = build(Path(args.out_dir), args.seed)
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
