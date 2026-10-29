const briefs = [
  { title: 'Ukraine peace talks', query: 'Ukraine peace talks' },
  { title: 'Gaza ceasefire negotiations', query: 'Gaza ceasefire negotiations' },
  { title: 'US–China chip restrictions', query: 'US-China chip restrictions' },
];

export default function QuickBriefs({ onSelect }: { onSelect: (query: string) => void }) {
  return <div className="quick-briefs"><span className="quick-brief-label">QUICK BRIEF</span>
    {briefs.map((brief, index) => <button type="button" key={brief.query} onClick={() => onSelect(brief.query)}>
      <span>{String(index + 1).padStart(2, '0')}</span>{brief.title}
    </button>)}
  </div>;
}
