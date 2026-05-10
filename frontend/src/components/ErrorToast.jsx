import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorToast({ message, onDismiss }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!message) { setProgress(100); return; }
    const start = Date.now();
    const dur = 5000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / dur) * 100);
      setProgress(remaining);
      if (remaining > 0) requestAnimationFrame(tick);
      else onDismiss();
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [message, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 200,
            maxWidth: 380,
            background: 'var(--bg-elevated)',
            border: '1px solid rgba(255,68,85,0.3)',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            overflow: 'hidden',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          }}
        >
          <AlertCircle size={18} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>Analysis Failed</p>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, wordBreak: 'break-word' }}>{message}</p>
          </div>
          <button
            onClick={onDismiss}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', padding: 2, flexShrink: 0 }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>

          {/* Progress bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--red)', transition: 'width 50ms linear' }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
