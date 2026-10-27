// ============================================
// WORLD MAP COMPONENT
// ============================================

import { useState, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { motion } from 'framer-motion';
import { MOCK_COVERAGE, COVERED_COUNTRIES } from '../data/mockData';
import type { CountryCoverage } from '../types';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface WorldMapProps {
  selectedCode: string | null;
  onCountrySelect: (coverage: CountryCoverage) => void;
  onCountryDeselect: () => void;
}

interface TooltipState {
  x: number;
  y: number;
  coverage: CountryCoverage;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoProps = { properties: Record<string, any> };

function getCode(geo: GeoProps): string {
  return (geo.properties?.ISO_A3 ?? geo.properties?.ADM0_A3 ?? '') as string;
}

export default function WorldMap({ selectedCode, onCountrySelect, onCountryDeselect }: WorldMapProps) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const getCountryFill = useCallback((geo: GeoProps) => {
    const code = getCode(geo);
    const hasCoverage = COVERED_COUNTRIES.includes(code);
    const isSelected = code === selectedCode;
    const isHovered = code === hoveredCode;

    if (isSelected) return 'rgba(54, 215, 245, 0.85)';
    if (isHovered && hasCoverage) return 'rgba(54, 139, 255, 0.6)';
    if (isHovered) return 'rgba(54, 139, 255, 0.25)';
    if (hasCoverage) return 'rgba(54, 215, 245, 0.45)';
    return 'rgba(18, 38, 58, 0.7)';
  }, [selectedCode, hoveredCode]);

  const getCountryStroke = useCallback((geo: GeoProps) => {
    const code = getCode(geo);
    const isSelected = code === selectedCode;
    if (isSelected) return 'rgba(54, 215, 245, 1)';
    return 'rgba(54, 215, 245, 0.15)';
  }, [selectedCode]);

  const handleMouseEnter = useCallback((geo: GeoProps, evt: React.MouseEvent) => {
    const code = getCode(geo);
    setHoveredCode(code);
    const coverage = MOCK_COVERAGE[code];
    if (coverage) {
      setTooltip({ x: evt.clientX, y: evt.clientY, coverage });
    }
  }, []);

  const handleMouseMove = useCallback((evt: React.MouseEvent) => {
    if (tooltip) {
      setTooltip((prev) => prev ? { ...prev, x: evt.clientX, y: evt.clientY } : null);
    }
  }, [tooltip]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCode(null);
    setTooltip(null);
  }, []);

  const handleClick = useCallback((geo: GeoProps) => {
    const code = getCode(geo);
    const coverage = MOCK_COVERAGE[code];
    if (coverage) {
      if (selectedCode === code) {
        onCountryDeselect();
      } else {
        onCountrySelect(coverage);
      }
    } else {
      onCountryDeselect();
    }
  }, [selectedCode, onCountrySelect, onCountryDeselect]);

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.5, 8));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.5, 1));
  const handleReset = () => {
    setZoom(1);
    setCenter([0, 20]);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map */}
      <ComposableMap
        projection="geoMercator"
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        projectionConfig={{ scale: 140, center: [0, 20] }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ coordinates, zoom: z }) => {
            setCenter(coordinates as [number, number]);
            if (z !== undefined) setZoom(z);
          }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const code = getCode(geo as GeoProps);
                const hasCoverage = COVERED_COUNTRIES.includes(code);
                const name = (geo as GeoProps).properties?.NAME ?? code;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryFill(geo as GeoProps)}
                    stroke={getCountryStroke(geo as GeoProps)}
                    strokeWidth={0.5}
                    onMouseEnter={(evt) => handleMouseEnter(geo as GeoProps, evt)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(geo as GeoProps)}
                    tabIndex={hasCoverage ? 0 : -1}
                    aria-label={hasCoverage ? `${name} — click to view coverage` : undefined}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleClick(geo as GeoProps);
                    }}

                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Map Controls */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        left: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 10,
      }}>
        {[
          { label: '+', action: handleZoomIn, title: 'Zoom in' },
          { label: '−', action: handleZoomOut, title: 'Zoom out' },
          { label: '⊙', action: handleReset, title: 'Reset view' },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            title={btn.title}
            aria-label={btn.title}
            style={{
              width: '36px',
              height: '36px',
              background: 'rgba(10, 20, 34, 0.9)',
              border: '1px solid rgba(54, 215, 245, 0.2)',
              borderRadius: '8px',
              color: '#8CA3B8',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#36D7F5';
              e.currentTarget.style.borderColor = 'rgba(54, 215, 245, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8CA3B8';
              e.currentTarget.style.borderColor = 'rgba(54, 215, 245, 0.2)';
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'fixed',
            left: tooltip.x + 16,
            top: tooltip.y - 40,
            zIndex: 100,
            background: 'rgba(14, 28, 45, 0.95)',
            border: '1px solid rgba(54, 215, 245, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            pointerEvents: 'none',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 20px rgba(54, 215, 245, 0.3)',
            minWidth: '180px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#36D7F5', boxShadow: '0 0 6px #36D7F5', flexShrink: 0,
            }} />
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#EAF4FF' }}>
              {tooltip.coverage.name}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ fontSize: '0.7rem', color: '#4A6174' }}>Articles</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#36D7F5' }}>
                {tooltip.coverage.articleCount}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ fontSize: '0.7rem', color: '#4A6174' }}>Stance</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#368BFF', textTransform: 'capitalize' }}>
                {tooltip.coverage.stance}
              </span>
            </div>
          </div>
          <div style={{
            marginTop: '8px', paddingTop: '8px',
            borderTop: '1px solid rgba(54, 215, 245, 0.1)',
            fontSize: '0.68rem', color: '#8CA3B8', lineHeight: 1.4,
          }}>
            {tooltip.coverage.framingSummary.slice(0, 80)}…
          </div>
          <div style={{
            marginTop: '6px', fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.58rem', color: '#36D7F5', letterSpacing: '0.05em',
          }}>
            Click to explore →
          </div>
        </motion.div>
      )}
    </div>
  );
}
