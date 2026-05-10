import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchX, RotateCcw, Download, Check } from 'lucide-react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import UploadCard from './components/UploadCard';
import Loader from './components/Loader';
import ResultsSummary from './components/ResultsSummary';
import FilterTabs from './components/FilterTabs';
import FunctionCard from './components/FunctionCard';
import ErrorToast from './components/ErrorToast';
import useAnalyze from './hooks/useAnalyze';
import { downloadResultsJSON } from './utils/downloadJSON';

const GRID_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M40 0v40M0 40h40' stroke='rgba(255,255,255,0.025)' stroke-width='0.5'/%3E%3C/svg%3E")`;

function RiskBar({ vulnerable, safe, total }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const vulnPct = total > 0 ? (vulnerable / total) * 100 : 0;
  const safePct = total > 0 ? (safe / total) * 100 : 0;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-2)',
          }}
        >
          Risk Distribution
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
          {vulnerable} vulnerable / {safe} safe
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: 'var(--bg-elevated)',
          marginTop: 8,
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <div
          style={{
            width: mounted ? `${vulnPct}%` : '0%',
            background: 'linear-gradient(90deg, var(--red), #CC2233)',
            transition: 'width 1s ease-out',
            borderRadius: vulnPct >= 100 ? 999 : '999px 0 0 999px',
          }}
        />
        <div
          style={{
            width: mounted ? `${safePct}%` : '0%',
            background: 'linear-gradient(90deg, var(--green), #00AA77)',
            transition: 'width 1s ease-out',
            borderRadius: safePct >= 100 ? 999 : '0 999px 999px 0',
          }}
        />
      </div>
    </div>
  );
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) +
      ' at ' +
      d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
  } catch {
    return iso;
  }
}

export default function App() {
  const [file, setFile] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDownloaded, setIsDownloaded] = useState(false);
  const { loading, error, results, analyze, reset } = useAnalyze();
  const resultsRef = useRef(null);

  // Scroll to results when they arrive
  useEffect(() => {
    if (results) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 300);
    }
  }, [results]);

  const handleAnalyze = useCallback(
    (f) => {
      reset();
      setActiveFilter('all');
      setIsDownloaded(false);
      analyze(f);
    },
    [analyze, reset]
  );

  const handleSetFile = useCallback(
    (f) => {
      setFile(f);
      if (!f) reset();
    },
    [reset]
  );

  const handleNewScan = useCallback(() => {
    reset();
    setFile(null);
    setActiveFilter('all');
    setIsDownloaded(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset]);

  const handleDownload = useCallback(() => {
    if (!results) return;
    downloadResultsJSON(results);
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2500);
  }, [results]);

  const filtered =
    results?.results?.filter((r) => {
      if (activeFilter === 'vulnerable') return r.label === 'VULNERABLE';
      if (activeFilter === 'safe') return r.label === 'SAFE';
      return true;
    }) ?? [];

  const counts = {
    all: results?.results?.length ?? 0,
    vulnerable: results?.vulnerable_count ?? 0,
    safe: results?.safe_count ?? 0,
  };

  return (
    <>
      {/* ── Background Layer (z-0) ── */}
      <div
        className="animate-float1"
        style={{
          position: 'fixed',
          top: -100,
          left: -100,
          width: 600,
          height: 600,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(circle, rgba(0,194,255,0.06) 0%, transparent 70%)',
        }}
      />
      <div
        className="animate-float2"
        style={{
          position: 'fixed',
          bottom: -200,
          right: -200,
          width: 800,
          height: 800,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(circle, rgba(0,194,255,0.04) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: -50,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 400,
          height: 400,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: GRID_SVG,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* ── Content Layer (z-1+) ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          paddingBottom: 80,
        }}
      >
        <Navbar />
        <HeroSection />

        <UploadCard
          file={file}
          setFile={handleSetFile}
          onAnalyze={handleAnalyze}
          loading={loading}
        />

        {loading && <Loader />}

        <AnimatePresence>
          {results && !loading && (
            <motion.section
              ref={resultsRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                padding: '48px 24px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              {/* ── Section Header Row ── */}
              <div
                style={{
                  maxWidth: 680,
                  margin: '0 auto',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
                className="results-header"
              >
                <style>{`
                  @media (max-width: 640px) {
                    .results-header {
                      flex-direction: column !important;
                    }
                  }
                `}</style>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--cyan)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    SCAN COMPLETE
                  </p>
                  <h2
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: 'var(--text-1)',
                      fontFamily:
                        "'JetBrains Mono', 'Fira Code', monospace",
                    }}
                  >
                    {results.filename}
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-2)',
                      marginTop: 4,
                    }}
                  >
                    Scanned on {formatDate(results.scanned_at)}
                  </p>
                </div>

                {/* Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    flexShrink: 0,
                  }}
                >
                  {/* New Scan */}
                  <button
                    onClick={handleNewScan}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '10px 20px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: 'var(--text-2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        'var(--border-accent)';
                      e.currentTarget.style.color = 'var(--text-1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        'var(--border)';
                      e.currentTarget.style.color = 'var(--text-2)';
                    }}
                  >
                    <RotateCcw size={16} />
                    <span>New Scan</span>
                  </button>

                  {/* Download JSON */}
                  <button
                    onClick={handleDownload}
                    style={{
                      background: isDownloaded
                        ? 'linear-gradient(135deg, var(--green), #00AA77)'
                        : 'linear-gradient(135deg, #00C2FF, #0090CC)',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 20px',
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#05080F',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: isDownloaded
                        ? '0 4px 16px rgba(0,229,160,0.25)'
                        : '0 4px 16px rgba(0,194,255,0.25)',
                      transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isDownloaded) {
                        e.currentTarget.style.boxShadow =
                          '0 6px 24px rgba(0,194,255,0.4)';
                        e.currentTarget.style.transform =
                          'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = isDownloaded
                        ? '0 4px 16px rgba(0,229,160,0.25)'
                        : '0 4px 16px rgba(0,194,255,0.25)';
                      e.currentTarget.style.transform =
                        'translateY(0)';
                    }}
                  >
                    {isDownloaded ? (
                      <>
                        <Check size={16} />
                        <span>Downloaded ✓</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Download JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ── Summary Cards ── */}
              <ResultsSummary data={results} />

              {/* ── Risk Distribution Bar ── */}
              <RiskBar
                vulnerable={results.vulnerable_count}
                safe={results.safe_count}
                total={results.total_functions}
              />

              {/* ── Filter Tabs ── */}
              <FilterTabs
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                counts={counts}
              />

              {/* ── Function Cards ── */}
              <div
                style={{
                  maxWidth: 680,
                  margin: '0 auto',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {filtered.length > 0 ? (
                  filtered.map((r, i) => (
                    <FunctionCard
                      key={`${r.function_name}-${r.start_line}`}
                      result={r}
                      index={i}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ textAlign: 'center', padding: '48px 0' }}
                  >
                    <SearchX
                      size={40}
                      style={{
                        color: 'var(--text-3)',
                        margin: '0 auto',
                      }}
                    />
                    <p
                      style={{
                        fontSize: 15,
                        color: 'var(--text-2)',
                        marginTop: 12,
                      }}
                    >
                      No {activeFilter === 'all' ? '' : activeFilter + ' '}functions found
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <ErrorToast message={error} onDismiss={() => reset()} />
    </>
  );
}
