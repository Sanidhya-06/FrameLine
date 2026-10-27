// ============================================
// PROGRESS INDICATOR
// ============================================

import { motion } from 'framer-motion';
import { LOADING_STAGES } from '../data/mockData';

interface ProgressIndicatorProps {
  stage: number;
  stageLabel: string;
}

export default function ProgressIndicator({ stage, stageLabel }: ProgressIndicatorProps) {
  const progress = ((stage + 1) / LOADING_STAGES.length) * 100;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '100%',
      maxWidth: '480px',
    }}>
      {/* Current stage */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#36D7F5',
            boxShadow: '0 0 8px #36D7F5',
            flexShrink: 0,
          }}
        />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.75rem',
          color: '#36D7F5',
          letterSpacing: '0.05em',
        }}>
          {stageLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <motion.div
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>

      {/* Stage dots */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {LOADING_STAGES.map((_s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
            <motion.div
              animate={i <= stage ? {
                background: '#36D7F5',
                boxShadow: '0 0 8px rgba(54, 215, 245, 0.6)',
              } : {}}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: i < stage ? '#36D7F5' : i === stage ? '#36D7F5' : 'rgba(54, 215, 245, 0.2)',
                boxShadow: i === stage ? '0 0 8px rgba(54, 215, 245, 0.8)' : 'none',
                flexShrink: 0,
                transition: 'all 0.4s ease',
              }}
            />
            {i < LOADING_STAGES.length - 1 && (
              <div style={{
                flex: 1,
                height: '1px',
                background: i < stage ? 'rgba(54, 215, 245, 0.4)' : 'rgba(54, 215, 245, 0.1)',
                transition: 'background 0.4s ease',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Stage counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.65rem',
          color: '#4A6174',
          letterSpacing: '0.08em',
        }}>
          STAGE {stage + 1} / {LOADING_STAGES.length}
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.65rem',
          color: '#36D7F5',
        }}>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
