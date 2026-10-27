// ============================================
// MAP LEGEND
// ============================================

export default function MapLegend() {
  const items = [
    { color: 'rgba(54, 215, 245, 0.7)', label: 'Coverage available', border: 'none', bg: 'rgba(54, 215, 245, 0.7)' },
    { color: 'rgba(54, 215, 245, 0.95)', label: 'Selected country', border: 'none', bg: 'rgba(54, 215, 245, 0.95)' },
    { color: 'rgba(54, 139, 255, 0.4)', label: 'Hovered', border: 'none', bg: 'rgba(54, 139, 255, 0.4)' },
    { color: 'rgba(30, 55, 80, 0.7)', label: 'No coverage', border: 'none', bg: 'rgba(30, 55, 80, 0.5)' },
  ];

  return (
    <div style={{
      background: 'rgba(10, 20, 34, 0.85)',
      border: '1px solid rgba(54, 139, 255, 0.15)',
      borderRadius: '10px',
      padding: '12px 14px',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.6rem',
        color: '#4A6174',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '10px',
      }}>
        Coverage Legend
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '14px',
              height: '10px',
              borderRadius: '2px',
              background: item.bg,
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: '0.7rem',
              color: '#8CA3B8',
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
