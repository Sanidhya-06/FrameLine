// ============================================
// COUNTRY PAGE (Screen D — Direct URL access)
// /country/:code
// ============================================

import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe } from 'lucide-react';
import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { MOCK_COVERAGE } from '../data/mockData';
import Navbar from '../components/Navbar';
import WorldMap from '../components/WorldMap';
import CountryDetailsPanel from '../components/CountryDetailsPanel';
import type { CountryCoverage } from '../types';

export default function CountryPage() {
  const { code } = useParams<{ code: string }>();
  const { setSelectedCountry } = useAppStore();
  const navigate = useNavigate();

  const coverage = code ? MOCK_COVERAGE[code.toUpperCase()] ?? null : null;

  useEffect(() => {
    if (coverage) {
      setSelectedCountry(coverage.code);
    }
  }, [coverage, setSelectedCountry]);

  const handleCountrySelect = (c: CountryCoverage) => {
    setSelectedCountry(c.code);
    navigate(`/country/${c.code}`, { replace: true });
  };

  const handleClose = () => {
    setSelectedCountry(null);
    navigate('/map', { replace: true });
  };

  // Invalid country code
  if (!coverage) {
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
        <div className="grid-overlay" />
        <Globe size={40} color="#36D7F5" />
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#EAF4FF', fontSize: '1.3rem', fontWeight: 600 }}>
          Country not found
        </h2>
        <p style={{ color: '#8CA3B8', textAlign: 'center', maxWidth: '380px', lineHeight: 1.6 }}>
          The country code <code style={{ color: '#36D7F5' }}>{code}</code> does not exist in the
          simulated coverage dataset, or is not a valid ISO alpha-3 code.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/map" className="btn-primary">
            <ArrowLeft size={14} />
            Back to Map
          </Link>
          <Link to="/" className="btn-ghost">New Search</Link>
        </div>
      </div>
    );
  }

  // Valid country — show map with panel open
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-overlay" />
      <Navbar showSearch={true} showStatus={true} />

      {/* Map workspace */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'fixed',
          inset: 0,
          top: '60px',
          right: '420px',
          background: 'linear-gradient(180deg, #050B14 0%, #060E1A 50%, #050B14 100%)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          <WorldMap
            selectedCode={coverage.code}
            onCountrySelect={handleCountrySelect}
            onCountryDeselect={handleClose}
          />
        </div>
      </motion.div>

      {/* Details panel */}
      <CountryDetailsPanel coverage={coverage} onClose={handleClose} />
    </div>
  );
}
