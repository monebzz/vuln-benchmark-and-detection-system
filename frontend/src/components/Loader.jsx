import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

const STEPS = [
  'Extracting functions with Joern',
  'Tokenizing with CodeBERT',
  'Classifying vulnerabilities',
];

export default function Loader() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Top progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 68,
          left: 0,
          right: 0,
          height: 2,
          zIndex: 99,
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        <div
          className="animate-progress"
          style={{
            height: '100%',
            width: '30%',
            background: 'linear-gradient(90deg, transparent, var(--cyan), var(--cyan), transparent)',
          }}
        />
      </div>

      {/* Status card */}
      <div style={{ maxWidth: 680, margin: '32px auto 0', padding: '0 24px', width: '100%' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(24px)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: 40,
            textAlign: 'center',
            boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
          }}
        >
          <Cpu
            size={32}
            className="animate-spin-slow"
            style={{ color: 'var(--cyan)', margin: '0 auto' }}
          />
          <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)', marginTop: 16 }}>
            Running Analysis
          </p>

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            {STEPS.map((step, i) => {
              const done = i < activeStep;
              const active = i === activeStep;
              return (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: i <= activeStep ? 1 : 0.3, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: done ? 'var(--green)' : active ? 'var(--cyan)' : 'transparent',
                      border: done || active ? 'none' : '1.5px solid var(--text-3)',
                      boxShadow: active ? '0 0 8px var(--cyan)' : done ? '0 0 6px var(--green)' : 'none',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 400, color: done ? 'var(--green)' : active ? 'var(--text-1)' : 'var(--text-3)' }}>
                    {step}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </>
  );
}
