import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import SearchHero from '../components/SearchHero';
import SiteNavigation from '../components/SiteNavigation';

export default function LandingPage() {
  const { query, setQuery, reset } = useAppStore();
  const [value, setValue] = useState(query);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const submit = () => {
    const clean = value.trim();
    if (!clean) { setError('Please enter a news topic or event to analyse.'); inputRef.current?.focus(); return; }
    setError('');
    reset();
    setQuery(clean);
    navigate('/loading');
  };

  return <main className="landing-shell">
    <SiteNavigation onExplore={() => inputRef.current?.focus()} />
    <SearchHero value={value} error={error} inputRef={inputRef} onChange={(next) => { setValue(next); setError(''); }} onSubmit={submit} />
  </main>;
}
