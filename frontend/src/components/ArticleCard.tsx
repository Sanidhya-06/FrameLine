// ============================================
// ARTICLE CARD
// ============================================

import { motion } from 'framer-motion';
import { Calendar, Newspaper } from 'lucide-react';
import type { MockArticle } from '../types';

interface ArticleCardProps {
  article: MockArticle;
  index: number;
}

export default function ArticleCard({ article, index }: ArticleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="article-card"
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <Newspaper size={11} color="#36D7F5" />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.62rem',
            color: '#36D7F5',
            letterSpacing: '0.05em',
          }}>
            {article.source}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <Calendar size={10} color="#4A6174" />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.58rem',
            color: '#4A6174',
          }}>
            {article.date}
          </span>
        </div>
      </div>

      {/* Headline */}
      <h4 style={{
        fontSize: '0.82rem',
        fontWeight: 600,
        color: '#EAF4FF',
        lineHeight: 1.4,
        marginBottom: '8px',
        fontFamily: 'Space Grotesk, sans-serif',
      }}>
        {article.headline}
      </h4>

      {/* Summary */}
      <p style={{
        fontSize: '0.75rem',
        color: '#8CA3B8',
        lineHeight: 1.5,
      }}>
        {article.summary}
      </p>

      {/* Decorative accent */}
      <div style={{
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid rgba(54, 139, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <div style={{
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: 'rgba(54, 215, 245, 0.4)',
        }} />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.58rem',
          color: '#4A6174',
          letterSpacing: '0.08em',
        }}>
          SIMULATED CONTENT
        </span>
      </div>
    </motion.div>
  );
}
