import { ShieldAlert } from 'lucide-react';

export default function Navbar() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(5,8,15,0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShieldAlert
          size={24}
          style={{
            color: 'var(--cyan)',
            filter: 'drop-shadow(0 0 8px var(--cyan))',
          }}
        />
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-1)',
            letterSpacing: '-0.5px',
          }}
        >
          VulnScan
        </span>
      </div>

      <div
        style={{
          background: 'var(--cyan-dim)',
          border: '1px solid var(--border-accent)',
          borderRadius: 999,
          padding: '6px 14px',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--cyan)',
            letterSpacing: '0.02em',
          }}
        >
          CodeBERT + Joern
        </span>
      </div>
    </nav>
  );
}
