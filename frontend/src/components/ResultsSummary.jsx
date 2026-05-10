import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code2, ShieldX, ShieldCheck } from 'lucide-react';

function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target == null || target === 0) { setCount(0); return; }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

const CARDS = [
  {
    key: 'total',
    label: 'Functions Analyzed',
    icon: Code2,
    dataKey: 'total_functions',
    color: 'var(--text-1)',
    iconColor: 'var(--text-2)',
    accent: null,
  },
  {
    key: 'vuln',
    label: 'Vulnerabilities Found',
    icon: ShieldX,
    dataKey: 'vulnerable_count',
    color: 'var(--red)',
    iconColor: 'var(--red)',
    accent: 'var(--red)',
    glowColor: 'rgba(255,68,85,0.07)',
  },
  {
    key: 'safe',
    label: 'Clean Functions',
    icon: ShieldCheck,
    dataKey: 'safe_count',
    color: 'var(--green)',
    iconColor: 'var(--green)',
    accent: 'var(--green)',
    glowColor: 'rgba(0,229,160,0.07)',
  },
];

export default function ResultsSummary({ data }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        maxWidth: 680,
        margin: '0 auto',
        width: '100%',
      }}
      className="results-summary-grid"
    >
      <style>{`
        @media (max-width: 640px) {
          .results-summary-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      {CARDS.map((card, i) => {
        const Icon = card.icon;
        const count = useCountUp(data?.[card.dataKey] ?? 0);
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderTop: card.accent
                ? `3px solid ${card.accent}`
                : '1px solid var(--border)',
              borderRadius: 16,
              padding: '24px 28px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow wash */}
            {card.glowColor && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at 80% 80%, ${card.glowColor} 0%, transparent 60%)`,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Top line for total card */}
            {!card.accent && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: 'rgba(255,255,255,0.08)',
                }}
              />
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                position: 'relative',
              }}
            >
              <Icon size={18} style={{ color: card.iconColor }} />
            </div>
            <p
              style={{
                fontSize: 40,
                fontWeight: 800,
                color: card.color,
                lineHeight: 1,
                position: 'relative',
              }}
            >
              {count}
            </p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: 'var(--text-2)',
                marginTop: 6,
                position: 'relative',
              }}
            >
              {card.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
