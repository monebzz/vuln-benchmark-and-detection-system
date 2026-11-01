"""
Single source of truth for CWE metadata and classification rules.
"""

from typing import Any
import re

FAMILY_INPUT_VALIDATION = "input_validation"
FAMILY_INJECTION = "injection"
FAMILY_MEMORY_SAFETY = "memory_safety"
FAMILY_NUMERIC_ERRORS = "numeric_errors"
FAMILY_DANGEROUS_API = "dangerous_api"
FAMILY_LIFETIME = "lifetime"
FAMILY_INITIALIZATION = "initialization"
FAMILY_POINTER_ERRORS = "pointer_errors"
FAMILY_OTHER = "other"

CWE_CATALOG: dict[int, dict[str, str]] = {
    20: {"name": "Improper Input Validation", "short_name": "Input Validation", "category": "Input Validation", "family": FAMILY_INPUT_VALIDATION},
    78: {"name": "OS Command Injection", "short_name": "Command Injection", "category": "Injection", "family": FAMILY_INJECTION},
    119: {"name": "Improper Restriction of Operations within the Bounds of a Memory Buffer", "short_name": "Buffer Overflow", "category": "Memory Safety", "family": FAMILY_MEMORY_SAFETY},
    120: {"name": "Buffer Copy without Checking Size of Input ('Classic Buffer Overflow')", "short_name": "Buffer Copy Overflow", "category": "Memory Safety", "family": FAMILY_MEMORY_SAFETY},
    121: {"name": "Stack-based Buffer Overflow", "short_name": "Stack Overflow", "category": "Memory Safety", "family": FAMILY_MEMORY_SAFETY},
    122: {"name": "Heap-based Buffer Overflow", "short_name": "Heap Overflow", "category": "Memory Safety", "family": FAMILY_MEMORY_SAFETY},
    124: {"name": "Buffer Underwrite ('Buffer Underflow')", "short_name": "Buffer Underflow", "category": "Memory Safety", "family": FAMILY_MEMORY_SAFETY},
    125: {"name": "Out-of-bounds Read", "short_name": "OOB Read", "category": "Memory Safety", "family": FAMILY_MEMORY_SAFETY},
    129: {"name": "Improper Validation of Array Index", "short_name": "Array Index Error", "category": "Memory Safety", "family": FAMILY_MEMORY_SAFETY},
    134: {"name": "Use of Externally-Controlled Format String", "short_name": "Format String", "category": "Injection", "family": FAMILY_INJECTION},
    170: {"name": "Improper Null Termination", "short_name": "Missing NUL Terminator", "category": "Memory Safety", "family": FAMILY_MEMORY_SAFETY},
    190: {"name": "Integer Overflow or Wraparound", "short_name": "Integer Overflow", "category": "Numeric Errors", "family": FAMILY_NUMERIC_ERRORS},
    191: {"name": "Integer Underflow (Wrap or Wraparound)", "short_name": "Integer Underflow", "category": "Numeric Errors", "family": FAMILY_NUMERIC_ERRORS},
    193: {"name": "Off-by-one Error", "short_name": "Off-by-one", "category": "Numeric Errors", "family": FAMILY_NUMERIC_ERRORS},
    195: {"name": "Signed to Unsigned Conversion Error", "short_name": "Signedness Conversion", "category": "Numeric Errors", "family": FAMILY_NUMERIC_ERRORS},
    242: {"name": "Use of Inherently Dangerous Function", "short_name": "Dangerous Function", "category": "Dangerous APIs", "family": FAMILY_DANGEROUS_API},
    415: {"name": "Double Free", "short_name": "Double Free", "category": "Memory Lifetime", "family": FAMILY_LIFETIME},
    416: {"name": "Use After Free", "short_name": "Use After Free", "category": "Memory Lifetime", "family": FAMILY_LIFETIME},
    457: {"name": "Use of Uninitialized Variable", "short_name": "Uninitialized Variable", "category": "Initialization", "family": FAMILY_INITIALIZATION},
    476: {"name": "NULL Pointer Dereference", "short_name": "Null Dereference", "category": "Pointer Errors", "family": FAMILY_POINTER_ERRORS},
    787: {"name": "Out-of-bounds Write", "short_name": "OOB Write", "category": "Memory Safety", "family": FAMILY_MEMORY_SAFETY},
}


def normalize_cwe_id(cwe_input: Any) -> tuple[int | None, str]:
    if not cwe_input:
        return None, "Unclassified"
    if isinstance(cwe_input, int):
        return cwe_input, f"CWE-{cwe_input}"
    s = str(cwe_input).strip()
    m = re.search(r"(?:CWE-?)?(\d+)", s, re.IGNORECASE)
    if m:
        num = int(m.group(1))
        return num, f"CWE-{num}"
    return None, s or "Unclassified"


def get_cwe_info(cwe_input: Any) -> dict[str, str]:
    num, cwe_id = normalize_cwe_id(cwe_input)
    if num is not None and num in CWE_CATALOG:
        entry = CWE_CATALOG[num]
        return {
            "id": cwe_id,
            "name": entry["name"],
            "short_name": entry["short_name"],
            "category": entry["category"],
            "family": entry["family"],
        }
    return {
        "id": cwe_id,
        "name": f"{cwe_id}" if cwe_id != "Unclassified" else "Unclassified",
        "short_name": "Unclassified",
        "category": "Unclassified",
        "family": FAMILY_OTHER,
    }


def get_cwe_name(cwe_input: Any) -> str:
    return get_cwe_info(cwe_input)["name"]


def get_cwe_family(cwe_input: Any) -> str:
    return get_cwe_info(cwe_input)["family"]


def are_cwes_compatible(cwe_a: Any, cwe_b: Any) -> bool:
    info_a = get_cwe_info(cwe_a)
    info_b = get_cwe_info(cwe_b)
    if info_a["id"] == info_b["id"]:
        return True
    if info_a["family"] != FAMILY_OTHER and info_a["family"] == info_b["family"]:
        return True
    return False
