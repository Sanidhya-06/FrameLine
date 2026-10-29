import { ArrowRight, Search } from 'lucide-react';
import type { FormEvent, RefObject } from 'react';

interface SearchBarProps {
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  error: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function SearchBar({ value, inputRef, error, onChange, onSubmit }: SearchBarProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(); };
  return <div className="search-area">
    <form id="search" className={`reference-search ${error ? 'has-error' : ''}`} onSubmit={submit}>
      <Search size={21} className="reference-search-icon" />
      <input ref={inputRef} value={value} onChange={(event) => onChange(event.target.value)}
        placeholder="Enter a news event, topic, or issue..." aria-label="Search a news topic"
        aria-describedby={error ? 'search-error' : undefined} />
      <button type="submit"><span>EXPLORE</span><ArrowRight size={19} /></button>
    </form>
    {error && <p id="search-error" className="reference-search-error" role="alert">{error}</p>}
  </div>;
}
