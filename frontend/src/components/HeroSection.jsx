import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section
      style={{
        padding: '140px 24px 64px',
        textAlign: 'center',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      {/* Eyebrow pill */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          border: '1px solid var(--border-accent)',
          background: 'var(--cyan-dim)',
          borderRadius: 999,
          padding: '5px 16px',
          marginBottom: 24,
        }}
      >
        <span
          className="animate-blink"
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: '0 0 6px var(--green)',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--cyan)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          AI-Powered Static Analysis
        </span>
      </motion.div>

      {/* H1 */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          fontSize: 'clamp(36px, 5.5vw, 64px)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
          color: 'var(--text-1)',
        }}
      >
        Detect{' '}
        <span
          style={{
            background: 'linear-gradient(135deg, #00C2FF 0%, #7B61FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Vulnerabilities
        </span>
        <br />
        in C/C++ Code
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        style={{
          fontSize: 17,
          fontWeight: 400,
          color: 'var(--text-2)',
          lineHeight: 1.7,
          maxWidth: 560,
          margin: '20px auto 0',
        }}
      >
        Upload your C/C++ source file. Our system extracts functions using
        Joern's code property graph, then classifies each one with a fine-tuned
        CodeBERT model trained on real vulnerability datasets.
      </motion.p>
    </section>
  );
}
