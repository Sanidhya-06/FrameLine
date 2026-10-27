// ============================================
// COVERAGE SUMMARY (FRAMING SIGNALS)
// ============================================

import { motion } from 'framer-motion';
import type { FramingSignal } from '../types';

interface CoverageSummaryProps {
  signals: FramingSignal[];
  framingDeviation: number;
}

const COLOR_MAP = {
  cyan: '#36D7F5',
  blue: '#368BFF',
  magenta: '#E45AC7',
};

export default function CoverageSummary({ signals, framingDeviation }: CoverageSummaryProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Framing Deviation */}
      <div style={{
        background: 'rgba(5, 11, 20, 0.6)',
        border: '1px solid rgba(54, 139, 255, 0.12)',
        borderRadius: '10px',
        padding: '14px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.62rem',
            color: '#8CA3B8',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Illustrative Framing Deviation
          </span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.9rem',
            color: framingDeviation > 70 ? '#E45AC7' : framingDeviation > 45 ? '#368BFF' : '#36D7F5',
            fontWeight: 700,
          }}>
            {framingDeviation}
          </span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${framingDeviation}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            style={{
              background: framingDeviation > 70
                ? 'linear-gradient(90deg, #368BFF, #E45AC7)'
                : framingDeviation > 45
                  ? 'linear-gradient(90deg, #368BFF, #36D7F5)'
                  : 'linear-gradient(90deg, #36D7F5, #368BFF)',
            }}
          />
        </div>
        <p style={{
          marginTop: '8px',
          fontSize: '0.65rem',
          color: '#4A6174',
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}>
          Illustrative metric only. Not a validated bias score. For demonstration purposes.
        </p>
      </div>

      {/* Framing signals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.62rem',
          color: '#4A6174',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Framing Signals
        </span>
        {signals.map((signal, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '0.75rem', color: '#8CA3B8' }}>{signal.label}</span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.68rem',
                color: COLOR_MAP[signal.color],
              }}>
                {signal.value}
              </span>
            </div>
            <div style={{
              height: '3px',
              background: 'rgba(54, 215, 245, 0.08)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${signal.value}%` }}
                transition={{ duration: 0.6, delay: 0.1 * i + 0.3, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: COLOR_MAP[signal.color],
                  borderRadius: '2px',
                  boxShadow: `0 0 8px ${COLOR_MAP[signal.color]}60`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
