// ============================================
// DEMO DATA BADGE
// ============================================

import { FlaskConical } from 'lucide-react';

interface DemoDataBadgeProps {
  style?: React.CSSProperties;
}

export default function DemoDataBadge({ style }: DemoDataBadgeProps) {
  return (
    <div
      className="demo-badge"
      style={style}
      title="All data shown is simulated for demonstration purposes only. It does not represent real news coverage or analytical findings."
    >
      <FlaskConical size={9} />
      Simulated Coverage
    </div>
  );
}
