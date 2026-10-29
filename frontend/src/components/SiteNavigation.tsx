import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SiteNavigation({ onExplore }: { onExplore: () => void }) {
  return <nav className="site-nav" aria-label="Main navigation">
    <Link className="nav-brand" to="/" aria-label="FrameLine home">Frame<span>Line</span></Link>
    <div className="nav-links">
      <Link className="active" to="/">Home</Link>
      <a href="#search" onClick={(event) => { event.preventDefault(); onExplore(); }}>Explore</a>
      <Link to="/methodology">Insights</Link>
      <Link to="/methodology#journal">Journal</Link>
      <Link to="/methodology#about">About</Link>
    </div>
    <button type="button" className="nav-cta" onClick={onExplore}>Explore Now <ArrowRight size={16} /></button>
  </nav>;
}
