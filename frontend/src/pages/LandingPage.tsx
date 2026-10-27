// ============================================
// LANDING PAGE (Screen A)
// ============================================

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Search, Globe, Zap, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import AmbientNewsPanels from '../components/AmbientNewsPanels';
import { EXAMPLE_QUERIES } from '../data/mockData';

const CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const { query, setQuery, mode, setMode } = useAppStore();
  const [localQuery, setLocalQuery] = useState(query);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSubmit = () => {
    const trimmed = localQuery.trim();
    if (!trimmed) {
      setError('Please enter a news topic or event to analyse.');
      inputRef.current?.focus();
      return;
    }
    setError('');
    setQuery(trimmed);
    navigate('/loading');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleSuggestion = (suggestion: string) => {
    setLocalQuery(suggestion);
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-main)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Grid overlay */}
      <div className="grid-overlay" />

      {/* Ambient orbs */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />

      {/* Scan line */}
      <div className="scan-line" aria-hidden="true" />

      {/* Ambient panels (decorative) */}
      <AmbientNewsPanels />

      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '80px 24px 40px',
      }}>
        <motion.div
          variants={CONTAINER_VARIANTS}
          initial="hidden"
          animate="visible"
          style={{
            width: '100%',
            maxWidth: '720px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '32px',
          }}
        >
          {/* Status badge */}
          <motion.div variants={ITEM_VARIANTS}>
            <div className="status-badge">
              <div className="dot" />
              Intelligence System Online
            </div>
          </motion.div>

          {/* Logo / Branding */}
          <motion.div variants={ITEM_VARIANTS} style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '10px' }}>
              <motion.div
                style={{
                  width: '52px',
                  height: '52px',
                  background: 'linear-gradient(135deg, #36D7F5, #368BFF)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(54, 215, 245, 0.3)',
                }}
                animate={{ boxShadow: ['0 0 30px rgba(54, 215, 245, 0.3)', '0 0 50px rgba(54, 215, 245, 0.5)', '0 0 30px rgba(54, 215, 245, 0.3)'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Globe size={26} color="#050B14" strokeWidth={2.5} />
              </motion.div>
              <div>
                <h1 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  color: '#EAF4FF',
                }}>
                  Frame<span style={{ color: '#36D7F5' }}>Line</span>
                </h1>
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#4A6174',
                  marginTop: '2px',
                }}>
                  Global News Framing Intelligence
                </p>
              </div>
            </div>
          </motion.div>

          {/* Hero text */}
          <motion.div variants={ITEM_VARIANTS} style={{ textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              marginBottom: '16px',
              color: '#EAF4FF',
            }}>
              How is the world{' '}
              <span style={{
                background: 'linear-gradient(135deg, #36D7F5, #368BFF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                framing
              </span>{' '}
              this story?
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#8CA3B8',
              lineHeight: 1.7,
              maxWidth: '580px',
              margin: '0 auto',
            }}>
              Explore how global media sources report the same event, uncover differences
              in framing, and examine the narratives shaping public understanding.
            </p>
          </motion.div>

          {/* Analysis mode selector */}
          <motion.div variants={ITEM_VARIANTS} style={{ width: '100%' }}>
            <div style={{
              marginBottom: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.62rem',
              color: '#4A6174',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              Analysis Mode
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {/* Framing mode */}
              <button
                className={`mode-card ${mode === 'framing' ? 'active' : ''}`}
                onClick={() => setMode('framing')}
                aria-pressed={mode === 'framing'}
                id="mode-framing"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Zap size={14} color={mode === 'framing' ? '#36D7F5' : '#4A6174'} />
                  <span style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: mode === 'framing' ? '#EAF4FF' : '#8CA3B8',
                  }}>
                    Framing
                  </span>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#4A6174', lineHeight: 1.4 }}>
                  Analyse how different countries frame a story right now.
                </p>
              </button>

              {/* Time Rewind (coming soon) */}
              <div
                className="mode-card coming-soon"
                aria-disabled="true"
                title="Coming soon"
                id="mode-time-rewind"
                style={{ position: 'relative' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Clock size={14} color="#4A6174" />
                  <span style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#4A6174',
                  }}>
                    Time Rewind
                  </span>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.55rem',
                    color: '#E45AC7',
                    background: 'rgba(228, 90, 199, 0.1)',
                    border: '1px solid rgba(228, 90, 199, 0.2)',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    Soon
                  </span>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#4A6174', lineHeight: 1.4 }}>
                  Track narrative evolution and framing shifts over time.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Search interface */}
          <motion.div variants={ITEM_VARIANTS} style={{ width: '100%' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}>
                <Search size={18} color={isFocused ? '#36D7F5' : '#4A6174'} style={{ transition: 'color 0.2s' }} />
              </div>
              <input
                ref={inputRef}
                id="search-input"
                className="search-input"
                type="text"
                value={localQuery}
                onChange={(e) => {
                  setLocalQuery(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Enter a news event, topic, or geopolitical issue..."
                aria-label="Search news topic"
                aria-describedby={error ? 'search-error' : undefined}
                style={{ paddingLeft: '52px', paddingRight: '140px' }}
              />
              <button
                onClick={handleSubmit}
                className="btn-primary"
                id="search-submit-btn"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '10px 20px',
                  fontSize: '0.85rem',
                }}
                aria-label="Start analysis"
              >
                Analyse
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  id="search-error"
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    fontSize: '0.78rem',
                    color: '#E45AC7',
                  }}
                >
                  <AlertCircle size={13} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Example queries */}
          <motion.div variants={ITEM_VARIANTS} style={{ width: '100%' }}>
            <div style={{
              marginBottom: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.62rem',
              color: '#4A6174',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              Try an example
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              {EXAMPLE_QUERIES.map((suggestion) => (
                <motion.button
                  key={suggestion}
                  onClick={() => handleSuggestion(suggestion)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '7px 14px',
                    background: 'rgba(10, 20, 34, 0.7)',
                    border: '1px solid rgba(54, 139, 255, 0.18)',
                    borderRadius: '8px',
                    color: '#8CA3B8',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(54, 215, 245, 0.35)';
                    e.currentTarget.style.color = '#36D7F5';
                    e.currentTarget.style.background = 'rgba(54, 215, 245, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(54, 139, 255, 0.18)';
                    e.currentTarget.style.color = '#8CA3B8';
                    e.currentTarget.style.background = 'rgba(10, 20, 34, 0.7)';
                  }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Footer note */}
          <motion.div variants={ITEM_VARIANTS} style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.62rem',
              color: '#4A6174',
              letterSpacing: '0.05em',
            }}>
              Phase 1 Demo · All data is simulated · No real news fetching
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
