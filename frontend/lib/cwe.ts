// Single source of truth for CWE metadata in the frontend

export interface CweInfo {
  id: string;
  name: string;
  short_name: string;
  category: string;
  family: string;
}

export const CWE_CATALOG: Record<number, { name: string; short_name: string; category: string; family: string }> = {
  20: { name: "Improper Input Validation", short_name: "Input Validation", category: "Input Validation", family: "input_validation" },
  78: { name: "OS Command Injection", short_name: "Command Injection", category: "Injection", family: "injection" },
  119: { name: "Improper Restriction of Operations within the Bounds of a Memory Buffer", short_name: "Buffer Overflow", category: "Memory Safety", family: "memory_safety" },
  120: { name: "Buffer Copy without Checking Size of Input ('Classic Buffer Overflow')", short_name: "Buffer Copy Overflow", category: "Memory Safety", family: "memory_safety" },
  121: { name: "Stack-based Buffer Overflow", short_name: "Stack Overflow", category: "Memory Safety", family: "memory_safety" },
  122: { name: "Heap-based Buffer Overflow", short_name: "Heap Overflow", category: "Memory Safety", family: "memory_safety" },
  124: { name: "Buffer Underwrite ('Buffer Underflow')", short_name: "Buffer Underflow", category: "Memory Safety", family: "memory_safety" },
  125: { name: "Out-of-bounds Read", short_name: "OOB Read", category: "Memory Safety", family: "memory_safety" },
  129: { name: "Improper Validation of Array Index", short_name: "Array Index Error", category: "Memory Safety", family: "memory_safety" },
  134: { name: "Use of Externally-Controlled Format String", short_name: "Format String", category: "Injection", family: "injection" },
  170: { name: "Improper Null Termination", short_name: "Missing NUL Terminator", category: "Memory Safety", family: "memory_safety" },
  190: { name: "Integer Overflow or Wraparound", short_name: "Integer Overflow", category: "Numeric Errors", family: "numeric_errors" },
  191: { name: "Integer Underflow (Wrap or Wraparound)", short_name: "Integer Underflow", category: "Numeric Errors", family: "numeric_errors" },
  193: { name: "Off-by-one Error", short_name: "Off-by-one", category: "Numeric Errors", family: "numeric_errors" },
  195: { name: "Signed to Unsigned Conversion Error", short_name: "Signedness Conversion", category: "Numeric Errors", family: "numeric_errors" },
  242: { name: "Use of Inherently Dangerous Function", short_name: "Dangerous Function", category: "Dangerous APIs", family: "dangerous_api" },
  415: { name: "Double Free", short_name: "Double Free", category: "Memory Lifetime", family: "lifetime" },
  416: { name: "Use After Free", short_name: "Use After Free", category: "Memory Lifetime", family: "lifetime" },
  457: { name: "Use of Uninitialized Variable", short_name: "Uninitialized Variable", category: "Initialization", family: "initialization" },
  476: { name: "NULL Pointer Dereference", short_name: "Null Dereference", category: "Pointer Errors", family: "pointer_errors" },
  787: { name: "Out-of-bounds Write", short_name: "OOB Write", category: "Memory Safety", family: "memory_safety" },
};

export function normalizeCweId(cweInput?: string | number | null): { num: number | null; id: string } {
  if (!cweInput) return { num: null, id: "Unclassified" };
  if (typeof cweInput === "number") return { num: cweInput, id: `CWE-${cweInput}` };
  const str = String(cweInput).trim();
  const match = str.match(/(?:CWE-?)?(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    return { num, id: `CWE-${num}` };
  }
  return { num: null, id: str || "Unclassified" };
}

export function getCweInfo(cweInput?: string | number | null): CweInfo {
  const { num, id } = normalizeCweId(cweInput);
  if (num !== null && CWE_CATALOG[num]) {
    const entry = CWE_CATALOG[num];
    return {
      id,
      name: entry.name,
      short_name: entry.short_name,
      category: entry.category,
      family: entry.family,
    };
  }
  return {
    id,
    name: id !== "Unclassified" ? `${id}` : "Unclassified",
    short_name: "Unclassified",
    category: "Unclassified",
    family: "other",
  };
}

export function getCweName(cweInput?: string | number | null): string {
  return getCweInfo(cweInput).name;
}

export function getCweFamily(cweInput?: string | number | null): string {
  return getCweInfo(cweInput).family;
}

export function areCwesCompatible(cweA?: string | number | null, cweB?: string | number | null): boolean {
  const infoA = getCweInfo(cweA);
  const infoB = getCweInfo(cweB);
  if (infoA.id === infoB.id) return true;
  if (infoA.family !== "other" && infoA.family === infoB.family) return true;
  return false;
}
