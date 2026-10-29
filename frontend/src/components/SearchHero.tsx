import { Globe2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { RefObject } from 'react';
import SearchBar from './SearchBar';
import QuickBriefs from './QuickBriefs';

interface SearchHeroProps {
  value: string;
  error: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function SearchHero({ value, error, inputRef, onChange, onSubmit }: SearchHeroProps) {
  const reduceMotion = useReducedMotion();
  const chooseBrief = (query: string) => { onChange(query); inputRef.current?.focus(); };
  return <section className="search-hero" aria-labelledby="search-title">
    <motion.div className="search-hero-content" initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
    <Globe2 className="hero-globe" size={31} strokeWidth={1.2} aria-hidden="true" />
    <p className="hero-eyebrow"><i />INDEPENDENT GLOBAL COVERAGE<i /></p>
    <h1 id="search-title">How is the world<br /><em>framing</em> this story?</h1>
    <p className="hero-description">Trace how news sources across regions<br className="desktop-break" /> cover the same event.</p>
    <SearchBar value={value} inputRef={inputRef} error={error} onChange={onChange} onSubmit={onSubmit} />
    <QuickBriefs onSelect={chooseBrief} />
    </motion.div>
  </section>;
}
