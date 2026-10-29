import { Link } from 'react-router-dom';

export function PlaceholderPage({ title }: { title: string }) {
  return <main className="placeholder-page"><div className="brand-mark">F<span>L</span></div><p className="eyebrow">PHASE 4 · FOUNDATION</p><h1>{title}</h1><p>This screen is reserved for a later phase.</p><Link className="text-link" to="/">← Return to search</Link></main>;
}
