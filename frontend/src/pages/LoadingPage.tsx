// ============================================
// LOADING PAGE (Screen B)
// ============================================

import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import CollectionAnimation from '../components/CollectionAnimation';
import ProgressIndicator from '../components/ProgressIndicator';
import { LOADING_STAGES } from '../data/mockData';

const STAGE_DURATIONS = [1000, 1200, 1200, 1000, 900]; // ms per stage

export default function LoadingPage() {
  const { query } = useAppStore();
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Announce loading status for screen readers
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // If no query (direct URL access), don't start animation
    if (!query) return;

    let currentStage = 0;

    const advance = () => {
      currentStage += 1;
      if (currentStage < LOADING_STAGES.length) {
        setStage(currentStage);
        setAnnouncement(LOADING_STAGES[currentStage]);
        timerRef.current = setTimeout(advance, STAGE_DURATIONS[currentStage] ?? 1000);
      } else {
        setDone(true);
        timerRef.current = setTimeout(() => {
          navigate('/map', { replace: true });
        }, 600);
      }
    };

    setAnnouncement(LOADING_STAGES[0]);
    timerRef.current = setTimeout(advance, STAGE_DURATIONS[0]);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, navigate]);

  // Handle missing query
  if (!query) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--color-bg-main)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '24px',
      }}>
        <Globe size={40} color="#36D7F5" />
        <h2 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '1.3rem',
          fontWeight: 600,
          color: '#EAF4FF',
        }}>
          No search query found
        </h2>
        <p style={{ color: '#8CA3B8', textAlign: 'center', maxWidth: '360px', lineHeight: 1.6 }}>
          Please start from the home page and enter a topic to analyse.
        </p>
        <Link to="/" className="btn-primary">
          <ArrowLeft size={15} />
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-main)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid overlay */}
      <div className="grid-overlay" />
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="scan-line" aria-hidden="true" />

      {/* Screen reader announcement */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
      >
        {announcement}
      </div>

      {/* Collection animation canvas (full screen) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
      }}>
        <CollectionAnimation stage={stage} />
      </div>

      {/* Bottom HUD */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: '24px',
          background: 'linear-gradient(to top, rgba(5, 11, 20, 0.95) 0%, rgba(5, 11, 20, 0.5) 60%, transparent 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* Query display */}
        <div style={{
          background: 'rgba(14, 28, 45, 0.8)',
          border: '1px solid rgba(54, 215, 245, 0.2)',
          borderRadius: '10px',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backdropFilter: 'blur(12px)',
          maxWidth: '600px',
          width: '100%',
        }}>
          <Globe size={14} color="#36D7F5" />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#4A6174', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
            Analysing:
          </span>
          <span style={{ color: '#EAF4FF', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {query}
          </span>
        </div>

        {/* Progress indicator */}
        <div style={{ maxWidth: '480px', width: '100%' }}>
          <ProgressIndicator
            stage={stage}
            stageLabel={done ? 'Complete — loading map…' : LOADING_STAGES[stage]}
          />
        </div>
      </motion.div>

      {/* Top branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div style={{
          width: '28px',
          height: '28px',
          background: 'linear-gradient(135deg, #36D7F5, #368BFF)',
          borderRadius: '7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Globe size={14} color="#050B14" strokeWidth={2.5} />
        </div>
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 700,
          fontSize: '1rem',
          color: '#EAF4FF',
        }}>
          Frame<span style={{ color: '#36D7F5' }}>Line</span>
        </span>
        <div className="status-badge">
          <div className="dot" />
          Collecting
        </div>
      </motion.div>
    </div>
  );
}
