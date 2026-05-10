import { motion } from 'framer-motion';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'vulnerable', label: 'Vulnerable' },
  { key: 'safe', label: 'Safe' },
];

export default function FilterTabs({ activeFilter, setActiveFilter, counts }) {
  return (
    <div
      style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}
      className="filter-tabs-wrapper"
    >
      <style>{`
        @media (max-width: 640px) {
          .filter-tabs-scroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .filter-tabs-scroll::-webkit-scrollbar { display: none; }
        }
      `}</style>
      <div className="filter-tabs-scroll">
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-elevated)',
            borderRadius: 10,
            padding: 4,
            whiteSpace: 'nowrap',
          }}
        >
          {TABS.map((tab) => {
            const active = activeFilter === tab.key;
            const count = counts?.[tab.key] ?? 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                style={{
                  position: 'relative',
                  padding: '7px 20px',
                  border: 'none',
                  borderRadius: 8,
                  background: 'transparent',
                  color: active ? 'var(--text-1)' : 'var(--text-3)',
                  fontWeight: active ? 600 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'color 200ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  zIndex: 1,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--text-2)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--text-3)';
                }}
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      zIndex: -1,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 999,
                    padding: '1px 7px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: active ? 'var(--text-1)' : 'var(--text-3)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
