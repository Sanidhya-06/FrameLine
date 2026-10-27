// ============================================
// COLLECTION ANIMATION (LOADING SCREEN)
// ============================================

import { motion, useReducedMotion } from 'framer-motion';

interface FloatingCard {
  id: string;
  x: string;
  y: string;
  width: number;
  delay: number;
  duration: number;
  headline: string;
  source: string;
  country: string;
  rotation: number;
}

const CARDS: FloatingCard[] = [
  { id: 'c1', x: '8%', y: '15%', width: 200, delay: 0, duration: 3.2, headline: 'Diplomatic talks resume after weeks of standoff', source: 'NY Times', country: 'US', rotation: -4 },
  { id: 'c2', x: '75%', y: '10%', width: 190, delay: 0.3, duration: 2.9, headline: 'Beijing signals willingness for multilateral dialogue', source: 'Xinhua', country: 'CN', rotation: 5 },
  { id: 'c3', x: '60%', y: '72%', width: 210, delay: 0.6, duration: 3.5, headline: 'Moscow defends strategic posture amid pressure', source: 'TASS', country: 'RU', rotation: -3 },
  { id: 'c4', x: '5%', y: '68%', width: 185, delay: 0.9, duration: 2.7, headline: 'UK weighs options as G7 partners diverge', source: 'BBC News', country: 'GB', rotation: 6 },
  { id: 'c5', x: '85%', y: '45%', width: 195, delay: 1.2, duration: 3.1, headline: 'India walks diplomatic tightrope on alliance commitments', source: 'The Hindu', country: 'IN', rotation: -5 },
  { id: 'c6', x: '15%', y: '42%', width: 180, delay: 1.5, duration: 2.8, headline: 'Ottawa signals support while guarding trade autonomy', source: 'Globe & Mail', country: 'CA', rotation: 4 },
  { id: 'c7', x: '45%', y: '8%', width: 170, delay: 0.5, duration: 3.8, headline: 'Berlin weighs costs of deeper alliance commitments', source: 'Der Spiegel', country: 'DE', rotation: -7 },
  { id: 'c8', x: '42%', y: '80%', width: 175, delay: 1.8, duration: 3.3, headline: 'Paris calls for independent European voice', source: 'Le Monde', country: 'FR', rotation: 3 },
  { id: 'c9', x: '88%', y: '75%', width: 160, delay: 2.1, duration: 2.6, headline: 'Global supply chains brace for further disruption', source: 'Reuters', country: 'INT', rotation: -2 },
  { id: 'c10', x: '2%', y: '35%', width: 155, delay: 2.4, duration: 3.0, headline: 'UN Secretary General urges immediate de-escalation', source: 'AFP', country: 'INT', rotation: 5 },
];

interface CollectionAnimationProps {
  stage: number;
}

export default function CollectionAnimation({ stage }: CollectionAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: '#8CA3B8',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.8rem',
        letterSpacing: '0.08em',
      }}>
        <div className="status-badge">
          <div className="dot" />
          Collecting articles…
        </div>
        <p>Gathering news from {stage * 2 + 2} sources across {stage + 1} regions</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Central collection point */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}>
        {/* Outer rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`ring-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              borderRadius: '50%',
              border: `1px solid rgba(54, 215, 245, ${0.4 - i * 0.12})`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              width: [60 + i * 50, 80 + i * 50, 60 + i * 50],
              height: [60 + i * 50, 80 + i * 50, 60 + i * 50],
              opacity: [0.8, 0.2, 0.8],
            }}
            transition={{
              duration: 2.5 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          />
        ))}
        {/* Core orb */}
        <motion.div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(54, 215, 245, 0.9) 0%, rgba(54, 139, 255, 0.5) 50%, transparent 100%)',
            boxShadow: '0 0 30px rgba(54, 215, 245, 0.6), 0 0 60px rgba(54, 215, 245, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 0 10px white',
          }} />
        </motion.div>
      </div>

      {/* Light trails */}
      {stage >= 1 && CARDS.slice(0, Math.min(stage * 2, CARDS.length)).map((card, i) => (
        <motion.div
          key={`trail-${card.id}`}
          style={{
            position: 'absolute',
            left: card.x,
            top: card.y,
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            background: '#36D7F5',
            boxShadow: '0 0 8px #36D7F5, 0 0 20px rgba(54, 215, 245, 0.4)',
          }}
          animate={{
            left: '50%',
            top: '50%',
            opacity: [1, 0.8, 0],
            scale: [1, 0.5, 0],
          }}
          transition={{
            duration: card.duration * 0.7,
            delay: i * 0.1,
            ease: 'easeIn',
            repeat: Infinity,
            repeatDelay: 2,
          }}
        />
      ))}

      {/* Floating article cards */}
      {CARDS.map((card, index) => {
        const isCollecting = index < stage * 2;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.7, x: 0, y: 0 }}
            animate={isCollecting ? {
              opacity: [0, 0.8, 0.6, 0],
              scale: [0.8, 1, 0.9, 0.4],
              left: ['50%', card.x, card.x, '50%'],
              top: ['50%', card.y, card.y, '50%'],
              rotate: [0, card.rotation, card.rotation, 0],
            } : {
              opacity: [0, 0.7, 0.6],
              scale: [0.85, 1, 0.95],
              left: card.x,
              top: card.y,
              rotate: card.rotation,
            }}
            transition={{
              duration: isCollecting ? card.duration : 0.5 + index * 0.1,
              delay: card.delay,
              ease: 'easeInOut',
              repeat: isCollecting ? Infinity : 0,
              repeatDelay: 1,
            }}
            style={{
              position: 'absolute',
              width: `${card.width}px`,
              background: 'rgba(14, 28, 45, 0.85)',
              border: '1px solid rgba(54, 215, 245, 0.2)',
              borderRadius: '8px',
              padding: '10px 12px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
          >
            {/* Top bar */}
            <div style={{ height: '2px', background: 'linear-gradient(90deg, #368BFF, #36D7F5)', borderRadius: '1px', marginBottom: '8px' }} />
            {/* Source + country */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.55rem',
                color: '#36D7F5',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                {card.source}
              </span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.55rem',
                color: '#4A6174',
                background: 'rgba(54, 215, 245, 0.08)',
                padding: '1px 5px',
                borderRadius: '3px',
              }}>
                {card.country}
              </span>
            </div>
            {/* Headline */}
            <p style={{
              fontSize: '0.65rem',
              color: '#8CA3B8',
              lineHeight: 1.4,
            }}>
              {card.headline}
            </p>
            {/* Shimmer lines */}
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {[100, 85, 60].map((w, i) => (
                <div key={i} style={{
                  height: '2px',
                  width: `${w}%`,
                  background: 'rgba(54, 215, 245, 0.06)',
                  borderRadius: '1px',
                }} />
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
