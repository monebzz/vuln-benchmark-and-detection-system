"""Hand-labelled CWE benchmark corpus for the LineVul pipeline.

Copied from the LineVD project so this folder stays self-contained.
The LineVD collapse numbers live in ../linevd/benchmark/REPORT.md.

Each case is a compilable-looking C function with the vulnerable lines marked by
1-based line number, counting from the first line of `code` (which starts at
line 1 after the leading newline is stripped).

Labelling rule, chosen to match how the model was TRAINED rather than what a
human would highlight: BigVul labels a line vulnerable if it was removed or
directly depended on by the fix commit. So the label is the line that must
change, not every line involved in the data flow. Where a fix would plausibly
touch a guard line instead of the sink, both are listed and scoring counts a hit
on either (see `accept_any`).

Pairs matter more than absolute scores here. Each `vuln` case has a `patched`
twin that is as close to line-identical as possible, so a detector that simply
flags all C code scores zero on the paired metric.
"""

CASES = [
    # ---------------------------------------------------------------- CWE-120
    {
        "id": "cwe120_strcpy",
        "cwe": "CWE-120",
        "name": "Unbounded strcpy into fixed buffer",
        "vulnerable": True,
        "vuln_lines": [5],
        "code": """
void copy_name(char *user_input) {
    char buf[64];
    int len;
    len = strlen(user_input);
    strcpy(buf, user_input);
    printf("%s\\n", buf);
}
""",
    },
    {
        "id": "cwe120_strcpy_patched",
        "cwe": "CWE-120",
        "name": "strcpy replaced with bounded strncpy",
        "vulnerable": False,
        "vuln_lines": [],
        "pair_of": "cwe120_strcpy",
        "code": """
void copy_name(char *user_input) {
    char buf[64];
    int len;
    len = strlen(user_input);
    strncpy(buf, user_input, sizeof(buf) - 1);
    buf[sizeof(buf) - 1] = '\\0';
    printf("%s\\n", buf);
}
""",
    },
    # ---------------------------------------------------------------- CWE-121
    {
        "id": "cwe121_gets",
        "cwe": "CWE-121",
        "name": "gets() on stack buffer",
        "vulnerable": True,
        "vuln_lines": [4],
        "code": """
int read_line(void) {
    char buffer[128];
    int count = 0;
    gets(buffer);
    count = strlen(buffer);
    return count;
}
""",
    },
    {
        "id": "cwe121_fgets_patched",
        "cwe": "CWE-121",
        "name": "gets() replaced with fgets()",
        "vulnerable": False,
        "vuln_lines": [],
        "pair_of": "cwe121_gets",
        "code": """
int read_line(void) {
    char buffer[128];
    int count = 0;
    fgets(buffer, sizeof(buffer), stdin);
    count = strlen(buffer);
    return count;
}
""",
    },
    # ---------------------------------------------------------------- CWE-787
    {
        "id": "cwe787_memcpy_unchecked",
        "cwe": "CWE-787",
        "name": "memcpy with attacker-controlled length",
        "vulnerable": True,
        "vuln_lines": [6],
        "code": """
void store_packet(char *src, int len) {
    char dest[256];
    int i;
    i = 0;
    if (len < 0)
        return;
    memcpy(dest, src, len);
    dest[255] = 0;
}
""",
    },
    {
        "id": "cwe787_memcpy_checked",
        "cwe": "CWE-787",
        "name": "memcpy with an upper bound check",
        "vulnerable": False,
        "vuln_lines": [],
        "pair_of": "cwe787_memcpy_unchecked",
        "code": """
void store_packet(char *src, int len) {
    char dest[256];
    int i;
    i = 0;
    if (len < 0 || len > sizeof(dest))
        return;
    memcpy(dest, src, len);
    dest[255] = 0;
}
""",
    },
    # ---------------------------------------------------------------- CWE-134
    {
        "id": "cwe134_format_string",
        "cwe": "CWE-134",
        "name": "Non-constant format string",
        "vulnerable": True,
        "vuln_lines": [4],
        "code": """
void log_message(char *user_msg) {
    int level;
    level = 1;
    printf(user_msg);
    fflush(stdout);
}
""",
    },
    {
        "id": "cwe134_format_string_patched",
        "cwe": "CWE-134",
        "name": "Constant format string",
        "vulnerable": False,
        "vuln_lines": [],
        "pair_of": "cwe134_format_string",
        "code": """
void log_message(char *user_msg) {
    int level;
    level = 1;
    printf("%s", user_msg);
    fflush(stdout);
}
""",
    },
    # ---------------------------------------------------------------- CWE-078
    {
        "id": "cwe78_command_injection",
        "cwe": "CWE-78",
        "name": "system() with concatenated user input",
        "vulnerable": True,
        "vuln_lines": [5, 6],
        "accept_any": True,
        "code": """
void run_lookup(char *host) {
    char cmd[512];
    int rc;
    rc = 0;
    sprintf(cmd, "nslookup %s", host);
    rc = system(cmd);
    return;
}
""",
    },
    {
        "id": "cwe78_command_injection_patched",
        "cwe": "CWE-78",
        "name": "execvp with an argument vector, no shell",
        "vulnerable": False,
        "vuln_lines": [],
        "pair_of": "cwe78_command_injection",
        "code": """
void run_lookup(char *host) {
    char *argv[3];
    int rc;
    rc = 0;
    argv[0] = "nslookup"; argv[1] = host; argv[2] = 0;
    rc = execvp(argv[0], argv);
    return;
}
""",
    },
    # ---------------------------------------------------------------- CWE-416
    {
        "id": "cwe416_use_after_free",
        "cwe": "CWE-416",
        "name": "Read after free",
        "vulnerable": True,
        "vuln_lines": [6],
        "accept_any": True,
        "code": """
int process(struct node *n) {
    int value;
    value = 0;
    free(n);
    value = n->count;
    return value;
}
""",
    },
    {
        "id": "cwe416_use_after_free_patched",
        "cwe": "CWE-416",
        "name": "Read before free",
        "vulnerable": False,
        "vuln_lines": [],
        "pair_of": "cwe416_use_after_free",
        "code": """
int process(struct node *n) {
    int value;
    value = 0;
    value = n->count;
    free(n);
    return value;
}
""",
    },
    # ---------------------------------------------------------------- CWE-415
    {
        "id": "cwe415_double_free",
        "cwe": "CWE-415",
        "name": "Double free on error path",
        "vulnerable": True,
        "vuln_lines": [7],
        "code": """
void cleanup(char *buf, int err) {
    int state;
    state = 0;
    free(buf);
    if (err) {
        state = 1;
        free(buf);
    }
    return;
}
""",
    },
    {
        "id": "cwe415_double_free_patched",
        "cwe": "CWE-415",
        "name": "Pointer nulled after free",
        "vulnerable": False,
        "vuln_lines": [],
        "pair_of": "cwe415_double_free",
        "code": """
void cleanup(char *buf, int err) {
    int state;
    state = 0;
    free(buf);
    buf = 0;
    if (err) {
        state = 1;
    }
    return;
}
""",
    },
    # ---------------------------------------------------------------- CWE-190
    {
        "id": "cwe190_integer_overflow",
        "cwe": "CWE-190",
        "name": "Integer overflow in allocation size",
        "vulnerable": True,
        "vuln_lines": [5, 6],
        "accept_any": True,
        "code": """
char *make_array(int count) {
    char *p;
    int total;
    total = count * 32;
    p = malloc(total);
    memset(p, 0, total);
    return p;
}
""",
    },
    {
        "id": "cwe190_integer_overflow_patched",
        "cwe": "CWE-190",
        "name": "Overflow-checked allocation",
        "vulnerable": False,
        "vuln_lines": [],
        "pair_of": "cwe190_integer_overflow",
        "code": """
char *make_array(int count) {
    char *p;
    int total;
    if (count < 0 || count > 1000000)
        return 0;
    total = count * 32;
    p = calloc(count, 32);
    memset(p, 0, total);
    return p;
}
""",
    },
    # ---------------------------------------------------------------- CWE-476
    {
        "id": "cwe476_null_deref",
        "cwe": "CWE-476",
        "name": "Unchecked malloc return dereferenced",
        "vulnerable": True,
        "vuln_lines": [5],
        "code": """
int fill_record(int size) {
    char *rec;
    int n;
    rec = malloc(size);
    rec[0] = 'A';
    n = size;
    return n;
}
""",
    },
    {
        "id": "cwe476_null_deref_patched",
        "cwe": "CWE-476",
        "name": "malloc return checked before use",
        "vulnerable": False,
        "vuln_lines": [],
        "pair_of": "cwe476_null_deref",
        "code": """
int fill_record(int size) {
    char *rec;
    int n;
    rec = malloc(size);
    if (rec == 0)
        return -1;
    rec[0] = 'A';
    n = size;
    return n;
}
""",
    },
    # ---------------------------------------------------------------- CWE-125
    {
        "id": "cwe125_oob_read",
        "cwe": "CWE-125",
        "name": "Off-by-one read past array end",
        "vulnerable": True,
        "vuln_lines": [6],
        "accept_any": True,
        "code": """
int sum_all(int *data, int n) {
    int total;
    int i;
    total = 0;
    for (i = 0; i <= n; i++) {
        total += data[i];
    }
    return total;
}
""",
    },
    {
        "id": "cwe125_oob_read_patched",
        "cwe": "CWE-125",
        "name": "Correct loop bound",
        "vulnerable": False,
        "vuln_lines": [],
        "pair_of": "cwe125_oob_read",
        "code": """
int sum_all(int *data, int n) {
    int total;
    int i;
    total = 0;
    for (i = 0; i < n; i++) {
        total += data[i];
    }
    return total;
}
""",
    },
    # ------------------------------------------------- clean controls (no CWE)
    # These exist to measure the false-positive rate on ordinary code. A model
    # that flags lines here is charging the user for noise.
    {
        "id": "clean_string_utils",
        "cwe": None,
        "name": "Benign bounded string helper",
        "vulnerable": False,
        "vuln_lines": [],
        "code": """
int count_words(const char *text, int max) {
    int words;
    int i;
    words = 0;
    for (i = 0; i < max && text[i] != 0; i++) {
        if (text[i] == ' ')
            words++;
    }
    return words;
}
""",
    },
    {
        "id": "clean_arithmetic",
        "cwe": None,
        "name": "Benign arithmetic with guards",
        "vulnerable": False,
        "vuln_lines": [],
        "code": """
int compute_average(const int *values, int n) {
    int total;
    int i;
    if (n <= 0)
        return 0;
    total = 0;
    for (i = 0; i < n; i++) {
        total += values[i];
    }
    return total / n;
}
""",
    },
    {
        "id": "clean_lookup",
        "cwe": None,
        "name": "Benign bounded table lookup",
        "vulnerable": False,
        "vuln_lines": [],
        "code": """
const char *level_name(int level) {
    static const char *names[4];
    int idx;
    names[0] = "debug"; names[1] = "info";
    names[2] = "warn";  names[3] = "error";
    idx = level;
    if (idx < 0 || idx >= 4)
        return "unknown";
    return names[idx];
}
""",
    },
]


def get_cases():
    """Return all cases with `code` normalised to start at line 1."""
    out = []
    for c in CASES:
        c = dict(c)
        c["code"] = c["code"].lstrip("\n")
        out.append(c)
    return out


def pairs():
    """Return (vulnerable_case, patched_case) tuples."""
    by_id = {c["id"]: c for c in get_cases()}
    return [
        (by_id[c["pair_of"]], c)
        for c in get_cases()
        if c.get("pair_of") and c["pair_of"] in by_id
    ]
