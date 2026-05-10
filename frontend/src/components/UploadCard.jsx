import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileCode, X, Loader2 } from 'lucide-react';

export default function UploadCard({ file, setFile, onAnalyze, loading }) {
  const [hovering, setHovering] = useState(false);

  const onDrop = useCallback(
    (accepted) => { if (accepted.length > 0) setFile(accepted[0]); },
    [setFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/x-c': ['.c'], 'text/x-c++src': ['.cpp'], 'text/x-h': ['.h'] },
    maxFiles: 1,
    maxSize: 200 * 1024 * 1024,
    disabled: loading,
  });

  const fmtSize = (b) => {
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  };

  const active = isDragActive || hovering;

  return (
    <div style={{ maxWidth: 680, margin: '56px auto 0', padding: '0 24px', width: '100%' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid',
          borderColor: hovering ? 'var(--border-accent)' : 'var(--border)',
          borderRadius: 24,
          padding: 40,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          transition: 'border-color 300ms ease',
        }}
      >
        {/* Dropzone */}
        <div
          {...getRootProps()}
          style={{
            background: active ? 'var(--cyan-dim)' : 'var(--bg-elevated)',
            border: `1.5px dashed ${active ? 'var(--cyan)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 16,
            padding: '48px 32px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 220ms ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: active ? 'inset 0 0 32px rgba(0,194,255,0.05)' : 'none',
          }}
        >
          <input {...getInputProps()} />

          {/* Icon box */}
          <div
            style={{
              width: 64,
              height: 64,
              background: 'rgba(0,194,255,0.08)',
              border: '1px solid rgba(0,194,255,0.15)',
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <UploadCloud size={28} style={{ color: 'var(--cyan)' }} />
          </div>

          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginTop: 16 }}>
            {isDragActive ? 'Drop your file here' : 'Drop your file here'}
          </p>
          <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-3)', marginTop: 4 }}>
            or click to browse
          </p>

          {/* File type badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['.C', '.CPP', '.H'].map((ext) => (
              <span
                key={ext}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '3px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-2)',
                  letterSpacing: '0.05em',
                }}
              >
                {ext}
              </span>
            ))}
            <span style={{ color: 'var(--text-3)', fontSize: 11 }}>·</span>
            <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Max 200MB</span>
          </div>
        </div>

        {/* File chip */}
        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <FileCode size={18} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  style={{
                    width: 28,
                    height: 28,
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    borderRadius: 6,
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-3)',
                    transition: 'all 150ms ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,68,85,0.15)'; e.currentTarget.style.color = 'var(--red)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-3)'; }}
                  aria-label="Remove file"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analyze button */}
        <button
          onClick={() => file && !loading && onAnalyze(file)}
          disabled={!file || loading}
          style={{
            marginTop: 20,
            width: '100%',
            height: 54,
            borderRadius: 12,
            border: 'none',
            background: !file || loading ? 'linear-gradient(135deg, #00C2FF 0%, #0090CC 100%)' : 'linear-gradient(135deg, #00C2FF 0%, #0090CC 100%)',
            color: '#05080F',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '0.02em',
            cursor: !file || loading ? 'not-allowed' : 'pointer',
            opacity: !file || loading ? 0.35 : 1,
            boxShadow: file && !loading ? '0 4px 24px rgba(0,194,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => {
            if (file && !loading) {
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,194,255,0.45), inset 0 1px 0 rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (file && !loading) {
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,194,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
          onMouseDown={(e) => { if (file && !loading) e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Analyzing…</span>
            </>
          ) : (
            <span>Analyze File</span>
          )}
        </button>
      </motion.div>
    </div>
  );
}
