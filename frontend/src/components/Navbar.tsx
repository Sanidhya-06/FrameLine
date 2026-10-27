// ============================================
// NAVBAR COMPONENT
// ============================================

import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Search, Zap } from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface NavbarProps {
  showSearch?: boolean;
  showStatus?: boolean;
}

export default function Navbar({ showSearch = true, showStatus = true }: NavbarProps) {
  const { query, reset } = useAppStore();
  const navigate = useNavigate();

  const handleNewSearch = () => {
    reset();
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'rgba(5, 11, 20, 0.85)',
        borderBottom: '1px solid rgba(54, 139, 255, 0.12)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
      }}>
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #36D7F5, #368BFF)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Globe size={16} color="#050B14" strokeWidth={2.5} />
          </div>
          <span style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#EAF4FF',
            letterSpacing: '-0.02em',
          }}>
            Frame<span style={{ color: '#36D7F5' }}>Line</span>
          </span>
        </Link>

        {/* Query display */}
        {showSearch && query && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '20px',
              width: '1px',
              background: 'rgba(54, 139, 255, 0.2)',
              flexShrink: 0,
            }} />
            <Search size={14} color="#8CA3B8" style={{ flexShrink: 0 }} />
            <span style={{
              color: '#8CA3B8',
              fontSize: '0.85rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {query}
            </span>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              background: 'rgba(54, 215, 245, 0.08)',
              border: '1px solid rgba(54, 215, 245, 0.2)',
              borderRadius: '4px',
              flexShrink: 0,
            }}>
              <Zap size={10} color="#36D7F5" />
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#36D7F5',
              }}>
                Framing
              </span>
            </div>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {showStatus && (
            <div className="status-badge" style={{ display: 'flex' }}>
              <div className="dot" />
              System Online
            </div>
          )}
          {showSearch && (
            <button
              onClick={handleNewSearch}
              className="btn-ghost"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              New Search
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
