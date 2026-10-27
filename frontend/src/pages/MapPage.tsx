// ============================================
// MAP PAGE (Screen C)
// ============================================

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { MOCK_COVERAGE } from '../data/mockData';
import type { CountryCoverage } from '../types';
import Navbar from '../components/Navbar';
import WorldMap from '../components/WorldMap';
import MapLegend from '../components/MapLegend';
import CountryDetailsPanel from '../components/CountryDetailsPanel';
import DemoDataBadge from '../components/DemoDataBadge';

export default function MapPage() {
  const { query, selectedCountryCode, setSelectedCountry } = useAppStore();
  const navigate = useNavigate();
  const [selectedCoverage, setSelectedCoverage] = useState<CountryCoverage | null>(
    selectedCountryCode ? MOCK_COVERAGE[selectedCountryCode] ?? null : null
  );

  const handleCountrySelect = useCallback((coverage: CountryCoverage) => {
    setSelectedCoverage(coverage);
    setSelectedCountry(coverage.code);
  }, [setSelectedCountry]);

  const handleCountryDeselect = useCallback(() => {
    setSelectedCoverage(null);
    setSelectedCountry(null);
    navigate('/map', { replace: true });
  }, [setSelectedCountry, navigate]);

  // Handle direct /map access with no query
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
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#EAF4FF', fontSize: '1.3rem', fontWeight: 600 }}>
          No search query
        </h2>
        <p style={{ color: '#8CA3B8', textAlign: 'center', maxWidth: '360px', lineHeight: 1.6 }}>
          Please start from the home page and enter a topic to analyse.
        </p>
        <Link to="/" className="btn-primary">Start a new search</Link>
      </div>
    );
  }

  const panelOpen = selectedCoverage !== null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-main)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid overlay */}
      <div className="grid-overlay" />

      {/* Navbar */}
      <Navbar showSearch={true} showStatus={true} />

      {/* Map workspace */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          top: '60px',
          right: panelOpen ? '420px' : '0',
          transition: 'right 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'linear-gradient(180deg, #050B14 0%, #060E1A 50%, #050B14 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Subtle ocean colour for the map background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 60%, rgba(6, 18, 36, 1) 0%, rgba(5, 11, 20, 1) 70%)',
        }} />

        {/* Map container */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}>
          <WorldMap
            selectedCode={selectedCoverage?.code ?? null}
            onCountrySelect={handleCountrySelect}
            onCountryDeselect={handleCountryDeselect}
          />
        </div>

        {/* Bottom-left controls */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
        }}>
          {/* Legend */}
          <div style={{ pointerEvents: 'auto' }}>
            <MapLegend />
          </div>

          {/* Demo badge */}
          <div style={{ pointerEvents: 'auto' }}>
            <DemoDataBadge />
          </div>
        </div>

        {/* Top-left coverage count */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 10,
          background: 'rgba(10, 20, 34, 0.8)',
          border: '1px solid rgba(54, 215, 245, 0.15)',
          borderRadius: '10px',
          padding: '10px 14px',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.6rem',
            color: '#4A6174',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            Coverage
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '1.3rem',
              color: '#36D7F5',
              fontWeight: 700,
            }}>
              {Object.keys(MOCK_COVERAGE).length}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#8CA3B8' }}>countries</span>
          </div>
        </div>

        {/* Hint text when no country selected */}
        {!panelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 10,
              background: 'rgba(10, 20, 34, 0.7)',
              border: '1px solid rgba(54, 215, 245, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              backdropFilter: 'blur(10px)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.62rem',
              color: '#4A6174',
              letterSpacing: '0.05em',
            }}
          >
            Click a highlighted country to explore coverage
          </motion.div>
        )}
      </motion.div>

      {/* Country details panel */}
      <CountryDetailsPanel
        coverage={selectedCoverage}
        onClose={handleCountryDeselect}
      />
    </div>
  );
}
