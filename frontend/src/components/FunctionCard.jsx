import { motion } from 'framer-motion';

const CWE_NAMES = {
  'CWE-20': 'Improper Input Validation',
  'CWE-119': 'Buffer Errors',
  'CWE-120': 'Buffer Overflow',
  'CWE-122': 'Heap Buffer Overflow',
  'CWE-125': 'Out-of-bounds Read',
  'CWE-190': 'Integer Overflow',
  'CWE-401': 'Memory Leak',
  'CWE-416': 'Use After Free',
  'CWE-476': 'NULL Pointer Deref',
  'CWE-787': 'Out-of-bounds Write',
};

export default function FunctionCard({ result, index }) {
  const vuln = result.label === 'VULNERABLE';
  const accent = vuln ? 'var(--red)' : 'var(--green)';
  const conf = (result.confidence * 100).toFixed(1);
  const cwe = result.vulnerability_type;
  const cweName = cwe ? CWE_NAMES[cwe] || null : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 12,
        padding: '20px 24px',
        cursor: 'default',
        transition: 'all 150ms ease',
      }}
      whileHover={{
        y: -2,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      {/* Row 1 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Left: name + lines */}
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontWeight: 600,
              fontSize: 15,
              color: 'var(--text-1)',
              wordBreak: 'break-word',
            }}
          >
            {result.function_name}
          </p>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-3)',
              marginTop: 3,
            }}
          >
            Lines {result.start_line} – {result.end_line}
          </p>
        </div>

        {/* Right: confidence + status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-2)',
            }}
          >
            {conf}% conf.
          </span>

          <span
            style={{
              background: vuln
                ? 'rgba(255,68,85,0.12)'
                : 'rgba(0,229,160,0.1)',
              border: `1px solid ${
                vuln
                  ? 'rgba(255,68,85,0.3)'
                  : 'rgba(0,229,160,0.25)'
              }`,
              color: accent,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.05em',
              borderRadius: 999,
              padding: '4px 12px',
              whiteSpace: 'nowrap',
            }}
          >
            {vuln ? '⚠ VULNERABLE' : '✓ SAFE'}
          </span>
        </div>
      </div>

      {/* Row 2: CWE badge */}
      {vuln && cwe && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
          }}
        >
          <span
            style={{
              background: 'rgba(255,180,71,0.08)',
              border: '1px solid rgba(255,180,71,0.2)',
              color: 'var(--amber)',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
              padding: '3px 10px',
              display: 'inline-block',
            }}
          >
            ⚡ {cwe}
            {cweName ? ` · ${cweName}` : ''}
          </span>
        </div>
      )}
    </motion.div>
  );
}
