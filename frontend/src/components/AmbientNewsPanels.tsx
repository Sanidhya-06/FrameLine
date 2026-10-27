// ============================================
// AMBIENT NEWS PANELS (DECORATIVE)
// ============================================

import { motion } from 'framer-motion';

const PANELS = [
  {
    id: 'panel-1',
    style: { top: '12%', left: '2%', width: '180px' },
    delay: 0,
    drift: { x: [-4, 4, -4], y: [0, -8, 0] },
    headline: 'BREAKING: Diplomatic envoys convene emergency session',
    lines: ['State dept confirms', 'multilateral talks', 'resume Monday'],
    tag: 'LIVE',
    tagColor: '#E45AC7',
  },
  {
    id: 'panel-2',
    style: { top: '20%', right: '2%', width: '200px' },
    delay: 0.8,
    drift: { x: [4, -4, 4], y: [-6, 6, -6] },
    headline: 'Markets react to geopolitical signals',
    lines: ['S&P –0.4%', 'Nikkei –1.1%', 'DAX –0.7%'],
    tag: 'MARKETS',
    tagColor: '#368BFF',
  },
  {
    id: 'panel-3',
    style: { bottom: '25%', left: '1%', width: '170px' },
    delay: 1.4,
    drift: { x: [-6, 2, -6], y: [4, -4, 4] },
    headline: 'Regional media diverges on conflict framing',
    lines: ['47 sources', 'analyzed', '8 regions'],
    tag: 'ANALYSIS',
    tagColor: '#36D7F5',
  },
  {
    id: 'panel-4',
    style: { bottom: '30%', right: '1%', width: '190px' },
    delay: 2,
    drift: { x: [3, -5, 3], y: [-5, 5, -5] },
    headline: 'Summit communiqué signals cautious optimism',
    lines: ['G20 draft text', 'circulated', 'ahead of vote'],
    tag: 'SUMMIT',
    tagColor: '#36D7F5',
  },
  {
    id: 'panel-5',
    style: { top: '55%', left: '3%', width: '155px' },
    delay: 0.4,
    drift: { x: [-3, 5, -3], y: [6, -2, 6] },
    headline: 'Narrative shift detected: 12 outlets',
    lines: ['Coverage', 'tone changed', 'in 48 hours'],
    tag: 'SIGNAL',
    tagColor: '#E45AC7',
  },
];

export default function AmbientNewsPanels() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {PANELS.map((panel) => (
        <motion.div
          key={panel.id}
          className="ambient-panel"
          style={{ ...panel.style, position: 'absolute' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: [0.35, 0.5, 0.35],
            x: panel.drift.x,
            y: panel.drift.y,
          }}
          transition={{
            opacity: { duration: 4 + panel.delay, repeat: Infinity, ease: 'easeInOut', delay: panel.delay },
            x: { duration: 8 + panel.delay, repeat: Infinity, ease: 'easeInOut', delay: panel.delay },
            y: { duration: 6 + panel.delay, repeat: Infinity, ease: 'easeInOut', delay: panel.delay },
          }}
        >
          {/* Tag */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '6px',
          }}>
            <div style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: panel.tagColor,
              boxShadow: `0 0 6px ${panel.tagColor}`,
            }} />
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.55rem',
              letterSpacing: '0.12em',
              color: panel.tagColor,
              textTransform: 'uppercase',
            }}>
              {panel.tag}
            </span>
          </div>
          {/* Headline */}
          <p style={{
            fontSize: '0.65rem',
            color: '#8CA3B8',
            lineHeight: 1.4,
            marginBottom: '6px',
          }}>
            {panel.headline}
          </p>
          {/* Data lines */}
          <div style={{
            borderTop: '1px solid rgba(54, 215, 245, 0.08)',
            paddingTop: '6px',
          }}>
            {panel.lines.map((line, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '2px',
              }}>
                <div style={{
                  width: '2px',
                  height: '2px',
                  borderRadius: '50%',
                  background: 'rgba(54, 215, 245, 0.4)',
                }} />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.55rem',
                  color: '#4A6174',
                }}>
                  {line}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
