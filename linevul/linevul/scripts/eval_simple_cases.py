#!/usr/bin/env python3
"""Check that a checkpoint flags obvious sinks (the demo the Big-Vul model missed)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

_plat = sys.platform
sys.platform = "linux"
import torch  # noqa: E402, F401
sys.platform = _plat

from linevul.infer import LineVulPredictor

CASES = [
    (
        "copy_username",
        "strcpy",
        """int copy_username(const char *input)
{
    char username[32];

    if (input == NULL)
        return -1;

    strcpy(username, input);

    if (strlen(username) == 0)
        return -1;

    printf("Username: %s\\n", username);
    return 0;
}
""",
    ),
    (
        "printf_user",
        "printf(input)",
        """void vulnerable_format(char *input) {
    printf(input);
}
""",
    ),
    (
        "build_greeting",
        "strcat",
        """#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *build_greeting(const char *name) {
    char *greeting = malloc(strlen("Hello, ") + strlen(name));  // missing +1
    strcpy(greeting, "Hello, ");
    strcat(greeting, name);  // no size check — heap overflow
    return greeting;
}

int main(int argc, char *argv[]) {
    if (argc > 1) {
        char *msg = build_greeting(argv[1]);
        printf("%s\\n", msg);
        free(msg);
    }
    return 0;
}
""",
    ),
]


def main():
    pred = LineVulPredictor()
    if not pred.available:
        print("No checkpoint.")
        sys.exit(1)
    print("checkpoint:", pred.summary.get("checkpoint"))
    ok = True
    for name, needle, code in CASES:
        scored = pred.score_file(code) if name == "build_greeting" else pred.score(code)
        target = None
        for ln, line in enumerate(code.splitlines(), 1):
            if needle in line:
                target = ln
                break
        p = scored["line_probs"].get(target or -1, 0.0)
        ranked = sorted(scored["line_probs"].items(), key=lambda kv: -kv[1])
        top = ranked[0] if ranked else (None, 0)
        hit = p >= 0.5
        extra = ""
        if name == "build_greeting":
            strcpy_ln = next(
                i for i, line in enumerate(code.splitlines(), 1) if "strcpy" in line
            )
            sp = scored["line_probs"].get(strcpy_ln, 0.0)
            extra = f" strcpy_p={sp:.3f}"
            if sp < 0.5:
                ok = False
        print(
            f"{name}: func={scored['func_prob']:.3f} "
            f"sink_line={target} p={p:.3f} flagged={hit} "
            f"top=L{top[0]}:{top[1]:.3f}{extra}"
        )
        if not hit:
            ok = False
    sys.exit(0 if ok else 2)


if __name__ == "__main__":
    main()
