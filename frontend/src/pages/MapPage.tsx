import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3, Globe2, Search, X } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { CountryMap } from '../components/CountryMap';
import type { CountryGroup } from '../types';

function countryFrom(groups: Record<string, CountryGroup>, code?: string) { return Object.values(groups).find((group) => group.iso_code.toLowerCase() === code?.toLowerCase()) || null; }
function FeedSummary({ result }: { result: NonNullable<ReturnType<typeof useAppStore.getState>['result']> }) {
  const succeeded = result.feed_statuses.filter((feed) => !['failed', 'timeout', 'error'].includes(feed.status)).length;
  const failures = result.feed_statuses.filter((feed) => ['failed', 'timeout', 'error'].includes(feed.status));
  return <details className="feed-summary"><summary>{succeeded} of {result.feed_statuses.length} feeds returned results{failures.length ? ` · ${failures.length} failed` : ''}</summary>{failures.length > 0 && <ul>{failures.map((feed) => <li key={feed.url}>{feed.feed}: {feed.error_text || feed.status}</li>)}</ul>}</details>;
}
function CountryDetails({ group, weakArticles, onClose }: { group: CountryGroup; weakArticles: CountryGroup['articles']; onClose: () => void }) {
  const [showWeak, setShowWeak] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const articles = [...group.articles, ...(showWeak ? weakArticles : [])];
  const weakCount = weakArticles.length;
  const translationCount = articles.filter((article) => article.translation_status === 'translated' || article.translation_status === 'partial').length;
  return <aside className="country-panel" aria-label={`${group.display_name} country details`}>
    <div className="panel-title"><div><span className="panel-kicker">SOURCE GROUP / {group.iso_code}</span><h2>{group.display_name}</h2></div><button className="icon-control panel-close" onClick={onClose} aria-label="Close country details"><X size={17}/></button></div>
    <div className="country-stat"><strong>{group.article_count}</strong><span>articles analyzed</span></div>
    <div className="source-block"><span className="section-label">PUBLISHERS</span><div className="source-chips">{group.sources.map((source) => <span key={source}>{source}</span>)}</div></div>
    {group.article_count < 3 && <div className="coverage-notice"><span>INSUFFICIENT COVERAGE</span><p>Fewer than 3 articles are available for meaningful aggregation.</p></div>}
    <section className="article-section"><div className="article-heading"><span className="section-label">ARTICLE EVIDENCE</span><span>{articles.length} shown</span></div>
      {weakCount > 0 && <label className="weak-toggle"><input type="checkbox" checked={showWeak} onChange={(event) => setShowWeak(event.target.checked)}/> Show weak matches ({weakCount})</label>}
      {translationCount > 0 && <label className="weak-toggle translation-toggle"><input type="checkbox" checked={showTranslations} onChange={(event) => setShowTranslations(event.target.checked)}/> Show English machine translations ({translationCount})</label>}
      <div className="article-list">{articles.map((article) => <article className="article-card" key={article.article_id || article.url}>
        <div className="article-meta"><span>{article.publisher}</span>{article.published_at && <time>{new Date(article.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</time>}</div>
        <h3><a href={article.url} target="_blank" rel="noreferrer">{showTranslations && article.translated_title ? article.translated_title : article.title}<ArrowRight size={13}/></a></h3>
        <p>{showTranslations && article.translated_summary ? article.translated_summary : article.article_text || article.rss_summary || 'No RSS summary or extracted snippet is available.'}</p>
        {article.translation_status !== 'not_requested' && <span className={`translation-badge translation-${article.translation_status}`}>{article.translation_status === 'translated' || article.translation_status === 'partial' ? `MACHINE TRANSLATED · ${article.translation_backend || 'BACKEND'}` : 'TRANSLATION UNAVAILABLE'}</span>}
        <span className={`extract-badge status-${article.extraction_status.toLowerCase()}`}>{article.extraction_status.replaceAll('_', ' ')}</span>
      </article>)}</div>
    </section>
    <section className="signals-placeholder"><span className="section-label">ANALYSIS SIGNALS</span><p>Analysis signals not yet available</p></section>
    <p className="country-disclaimer">Results describe the sources analyzed, not the country as a whole.</p>
  </aside>;
}

export function MapPage() {
  const { result, query } = useAppStore(); const { code } = useParams(); const navigate = useNavigate();
  const [selectedCode, setSelectedCode] = useState<string | null>(code || null);
  const countryGroups = result?.country_groups || {};
  const available = useMemo(() => Object.values(countryGroups).filter((group) => group.articles.length > 0), [countryGroups]);
  useEffect(() => { if (!result) return; const next = code ? countryFrom(countryGroups, code) : null; setSelectedCode(next?.iso_code || null); }, [code, result, countryGroups]);
  if (!result) return <Navigate to="/" replace />;
  const select = (countryCode: string | null) => { setSelectedCode(countryCode); navigate(countryCode ? `/country/${encodeURIComponent(countryCode)}` : '/map'); };
  const selected = countryFrom(countryGroups, selectedCode || undefined);
  const failures = result.feed_statuses.filter((feed) => ['failed', 'timeout', 'error'].includes(feed.status)).length;
  return <main className="coverage-shell">
    <header className="coverage-topbar"><Link className="coverage-brand" to="/"><span><Globe2 size={16}/></span>FRAME<span>LINE</span></Link><div className="coverage-breadcrumb"><span>FIELD 03</span><i/> GLOBAL COVERAGE MAP</div><Link className="new-search" to="/" onClick={() => useAppStore.getState().setError(null)}><Search size={15}/> New search</Link></header>
    <section className="coverage-heading"><div><div className="coverage-kicker"><i/> COVERAGE INTELLIGENCE <i/></div><h1>Stories, seen <em>worldwide.</em></h1><p><span>QUERY</span> “{query || result.query}”</p></div><div className="cache-info"><span>{result.cached ? 'CACHED RESULT' : 'LIVE RESULT'}</span><small><Clock3 size={12}/> {result.generated_at ? new Date(result.generated_at).toLocaleString() : 'Time unavailable'}</small></div></section>
    <div className="feed-strip"><span className={`feed-light ${failures ? 'feed-light-warn' : ''}`}/><FeedSummary result={result}/>{result.status && <span className="result-status">{result.status.replaceAll('_', ' ')}</span>}</div>
    {result.articles.length === 0 ? <section className="map-empty"><Globe2 size={33}/><h2>No country coverage returned</h2><p>{result.explanation || 'No relevant articles were found for this query.'}</p><Link className="new-search" to="/">Start a new search <ArrowRight size={15}/></Link></section> : <>
      <div className={`coverage-layout ${selected ? 'has-country' : ''}`}>
        <section className="map-column"><CountryMap groups={countryGroups} selected={selected?.iso_code || null} onSelect={(countryCode) => select(countryCode)}/>
          <section className="country-list-panel"><div className="country-list-heading"><span className="section-label">COUNTRY / SOURCE GROUPS</span><span>{available.length} GROUPS</span></div><div className="country-list">{available.map((group) => <button key={group.iso_code} className={`country-button ${selected?.iso_code === group.iso_code ? 'is-active' : ''}`} onClick={() => select(group.iso_code)}><span className="country-pip"/><strong>{group.display_name}</strong><span>{group.article_count} {group.article_count === 1 ? 'article' : 'articles'}</span><ArrowRight size={14}/></button>)}</div></section>
        </section>
        {selected && <CountryDetails group={selected} weakArticles={result.articles.filter((article) => article.iso_code === selected.iso_code && article.relevance_label === 'weak_match')} onClose={() => select(null)}/>}
      </div>
      {failures > 0 && <p className="partial-notice">Partial results: {failures} feed {failures === 1 ? 'could not' : 'feeds could not'} be reached. Country counts include returned articles only.</p>}
    </>}
    <footer className="coverage-footer"><span>FRAMELINE / SOURCE MONITOR</span><Link to="/">NEW QUERY <ArrowLeft size={12}/></Link></footer>
  </main>;
}
