// ============================================
// COUNTRY DETAILS PANEL
// ============================================

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Globe2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CountryCoverage } from '../types';
import ArticleCard from './ArticleCard';
import CoverageSummary from './CoverageSummary';
import DemoDataBadge from './DemoDataBadge';

interface CountryDetailsPanelProps {
  coverage: CountryCoverage | null;
  onClose: () => void;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#36D7F5',
  neutral: '#368BFF',
  negative: '#E45AC7',
  mixed: '#F59636',
};

const STANCE_COLORS: Record<string, string> = {
  critical: '#E45AC7',
  supportive: '#36D7F5',
  neutral: '#8CA3B8',
  alarmist: '#E45AC7',
  skeptical: '#F59636',
  diplomatic: '#368BFF',
};

const FLAG_EMOJI: Record<string, string> = {
  US: '🇺🇸', CN: '🇨🇳', RU: '🇷🇺', GB: '🇬🇧',
  IN: '🇮🇳', CA: '🇨🇦', DE: '🇩🇪', FR: '🇫🇷',
};

export default function CountryDetailsPanel({ coverage, onClose }: CountryDetailsPanelProps) {
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Update URL when panel opens
  useEffect(() => {
    if (coverage) {
      navigate(`/country/${coverage.code}`, { replace: true });
    }
  }, [coverage?.code]);

  return (
    <AnimatePresence>
      {coverage && (
        <motion.div
          key={coverage.code}
          className="country-panel"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="complementary"
          aria-label={`Coverage details for ${coverage.name}`}
        >
          {/* Panel header */}
          <div style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid rgba(54, 139, 255, 0.12)',
            position: 'sticky',
            top: 0,
            background: 'var(--color-bg-panel)',
            zIndex: 10,
          }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>
                  {FLAG_EMOJI[coverage.code2] || '🌐'}
                </span>
                <div>
                  <h2 style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#EAF4FF',
                    letterSpacing: '-0.01em',
                  }}>
                    {coverage.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.6rem',
                      color: STANCE_COLORS[coverage.stance] || '#8CA3B8',
                      background: `${STANCE_COLORS[coverage.stance]}15`,
                      border: `1px solid ${STANCE_COLORS[coverage.stance]}30`,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                      {coverage.stance}
                    </span>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.6rem',
                      color: SENTIMENT_COLORS[coverage.sentiment] || '#8CA3B8',
                      background: `${SENTIMENT_COLORS[coverage.sentiment]}15`,
                      border: `1px solid ${SENTIMENT_COLORS[coverage.sentiment]}30`,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                      {coverage.sentiment}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close country panel"
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(54, 215, 245, 0.06)',
                  border: '1px solid rgba(54, 215, 245, 0.15)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#8CA3B8',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#36D7F5';
                  e.currentTarget.style.borderColor = 'rgba(54, 215, 245, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#8CA3B8';
                  e.currentTarget.style.borderColor = 'rgba(54, 215, 245, 0.15)';
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                flex: 1,
                background: 'rgba(5, 11, 20, 0.5)',
                border: '1px solid rgba(54, 139, 255, 0.1)',
                borderRadius: '8px',
                padding: '10px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '1.1rem',
                  color: '#36D7F5',
                  fontWeight: 700,
                }}>
                  {coverage.articleCount}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#4A6174', marginTop: '2px' }}>Articles</div>
              </div>
              <div style={{
                flex: 1,
                background: 'rgba(5, 11, 20, 0.5)',
                border: '1px solid rgba(54, 139, 255, 0.1)',
                borderRadius: '8px',
                padding: '10px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '1.1rem',
                  color: '#368BFF',
                  fontWeight: 700,
                }}>
                  {coverage.sources.length}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#4A6174', marginTop: '2px' }}>Sources</div>
              </div>
              <div style={{
                flex: 1,
                background: 'rgba(5, 11, 20, 0.5)',
                border: '1px solid rgba(54, 139, 255, 0.1)',
                borderRadius: '8px',
                padding: '10px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '1.1rem',
                  color: STANCE_COLORS[coverage.stance] || '#8CA3B8',
                  fontWeight: 700,
                }}>
                  {coverage.illustrativeFramingDeviation}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#4A6174', marginTop: '2px' }}>Dev.</div>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
            {/* Demo notice */}
            <DemoDataBadge />

            {/* Framing summary */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Globe2 size={14} color="#36D7F5" />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.62rem',
                  color: '#4A6174',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  Framing Summary
                </span>
              </div>
              <p style={{
                fontSize: '0.82rem',
                color: '#8CA3B8',
                lineHeight: 1.6,
                background: 'rgba(5, 11, 20, 0.4)',
                border: '1px solid rgba(54, 139, 255, 0.1)',
                borderRadius: '8px',
                padding: '12px',
              }}>
                {coverage.framingSummary}
              </p>
            </div>

            {/* Sources */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <FileText size={14} color="#36D7F5" />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.62rem',
                  color: '#4A6174',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  Publishers
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {coverage.sources.map((source) => (
                  <span key={source} style={{
                    fontSize: '0.72rem',
                    color: '#8CA3B8',
                    background: 'rgba(54, 215, 245, 0.05)',
                    border: '1px solid rgba(54, 215, 245, 0.12)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                  }}>
                    {source}
                  </span>
                ))}
              </div>
            </div>

            {/* Coverage summary (framing signals) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <TrendingUp size={14} color="#36D7F5" />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.62rem',
                  color: '#4A6174',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  Analysis
                </span>
              </div>
              <CoverageSummary
                signals={coverage.framingSignals}
                framingDeviation={coverage.illustrativeFramingDeviation}
              />
            </div>

            {/* Articles */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FileText size={14} color="#36D7F5" />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.62rem',
                  color: '#4A6174',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  Sample Articles
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {coverage.articles.map((article, i) => (
                  <ArticleCard key={article.id} article={article} index={i} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
