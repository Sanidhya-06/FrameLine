// ============================================
// 404 NOT FOUND PAGE
// ============================================

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-main)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="grid-overlay" />
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
        }}
      >
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '5rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #36D7F5, #368BFF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}>
          404
        </div>

        <h1 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '1.4rem',
          fontWeight: 700,
          color: '#EAF4FF',
        }}>
          Route Not Found
        </h1>

        <p style={{
          color: '#8CA3B8',
          maxWidth: '360px',
          lineHeight: 1.6,
          fontSize: '0.9rem',
        }}>
          The page you're looking for doesn't exist in this intelligence system.
          Return to base and try again.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/" className="btn-primary">
            <ArrowLeft size={14} />
            Return to Base
          </Link>
          <Link to="/map" className="btn-ghost">
            <Globe size={14} />
            Open Map
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
