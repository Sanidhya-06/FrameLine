import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, Globe2, Search } from 'lucide-react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { coveredGroups, dateRange, extractionBreakdown, rssOnlyCount, sharedQueryHeadlines } from '../compare';
import type { Article, CountryGroup } from '../types';

function ArticleCard({ article }: { article: Article }) {
  const [english, setEnglish] = useState(false);
  const translated = article.translation_status === 'translated' || article.translation_status === 'partial';
  return <article className="compare-article">
    <div className="article-meta"><span>{article.publisher}</span>{article.published_at && <time>{new Date(article.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</time>}</div>
    <h3><a href={article.url} target="_blank" rel="noreferrer">{english && article.translated_title ? article.translated_title : article.title}<ArrowRight size={13}/></a></h3>
    <p>{english && article.translated_summary ? article.translated_summary : article.article_text || article.rss_summary || 'No summary or extracted text is available.'}</p>
    <div className="compare-card-footer">
      <span className={`extract-badge status-${article.extraction_status.toLowerCase()}`}>{article.extraction_status.replaceAll('_', ' ')}</span>
      {translated && <><span className="translation-badge">MACHINE TRANSLATED</span><button className="text-toggle" onClick={() => setEnglish(!english)}>{english ? 'Original' : 'English'}</button></>}
    </div>
  </article>;
}

function GroupColumn({ group }: { group: CountryGroup }) {
  const breakdown = extractionBreakdown(group.articles);
  const rssOnly = rssOnlyCount(group.articles);
  return <section className="compare-column" aria-labelledby={`compare-${group.iso_code}`}>
    <div className="compare-column-heading"><span className="panel-kicker">SOURCE GROUP / {group.iso_code}</span><h2 id={`compare-${group.iso_code}`}>{group.display_name}</h2></div>
    <div className="compare-stat"><strong>{group.articles.length}</strong><span>articles analyzed</span></div>
    <div className="compare-facts"><div><span>Publishers</span><strong>{group.sources.join(', ') || 'Unavailable'}</strong></div><div><span>Publication range</span><strong>{dateRange(group.articles)}</strong></div><div><span>Extraction status</span><strong>{Object.entries(breakdown).map(([status, count]) => `${status.replaceAll('_', ' ')}: ${count}`).join(' · ') || 'Unavailable'}</strong></div></div>
    {group.articles.length < 3 && <div className="compare-notice"><strong>LOW SAMPLE</strong><span>Fewer than 3 articles; interpretation is limited.</span></div>}
    {rssOnly > 0 && <div className="compare-notice"><strong>MISSING ARTICLE TEXT</strong><span>{rssOnly} article{rssOnly === 1 ? '' : 's'} are RSS-summary-only; analysis is limited to headlines and summaries.</span></div>}
    <div className="compare-articles">{group.articles.map((article) => <ArticleCard key={article.article_id || article.url} article={article}/>)}</div>
  </section>;
}

export function ComparePage() {
  const { result, query } = useAppStore();
  const [searchParams] = useSearchParams();
  const groups = useMemo(() => result ? coveredGroups(result.country_groups) : [], [result]);
  const [leftCode, setLeftCode] = useState(searchParams.get('left') || '');
  const [rightCode, setRightCode] = useState('');
  if (!result) return <Navigate to="/" replace />;
  const left = groups.find((group) => group.iso_code === leftCode) || groups[0];
  const right = groups.find((group) => group.iso_code === rightCode) || groups.find((group) => group.iso_code !== left?.iso_code);
  const pairs = left && right ? sharedQueryHeadlines(left, right, query || result.query) : [];
  const setSide = (side: 'left' | 'right', code: string) => side === 'left' ? setLeftCode(code) : setRightCode(code);
  return <main className="coverage-shell compare-shell">
    <header className="coverage-topbar"><Link className="coverage-brand" to="/map"><span><Globe2 size={16}/></span>FRAME<span>LINE</span></Link><div className="coverage-breadcrumb"><span>FIELD 04</span><i/> COMPARISON</div><Link className="new-search" to="/"><Search size={15}/> New search</Link></header>
    <section className="coverage-heading"><div><div className="coverage-kicker"><i/> SOURCE COMPARISON <i/></div><h1>Coverage, side by <em>side.</em></h1><p><span>QUERY</span> “{query || result.query}”</p></div></section>
    {groups.length < 2 ? <section className="map-empty compare-empty"><BarChart3 size={33}/><h2>Comparison needs two covered countries</h2><p>Only {groups.length} country{groups.length === 1 ? '' : 'ies'} with retrieved coverage are available for this query.</p><Link className="new-search" to="/map"><ArrowLeft size={15}/> Back to map</Link></section> : <>
      <div className="compare-controls"><label>First country<select value={left?.iso_code || ''} onChange={(event) => setSide('left', event.target.value)}>{groups.map((group) => <option key={group.iso_code} value={group.iso_code}>{group.display_name}</option>)}</select></label><span aria-hidden="true">VS</span><label>Second country<select value={right?.iso_code || ''} onChange={(event) => setSide('right', event.target.value)}>{groups.map((group) => <option key={group.iso_code} value={group.iso_code}>{group.display_name}</option>)}</select></label></div>
      <p className="compare-disclaimer">Differences in coverage reflect the sources analyzed, not entire countries or populations.</p>
      {left && right && <div className="compare-columns"><GroupColumn group={left}/><GroupColumn group={right}/></div>}
      {left && right && <section className="shared-events"><div className="shared-events-heading"><div><span className="section-label">SHARED-EVENT VIEW</span><h2>Headlines with overlapping query terms</h2></div><span className="method-chip">Method: lexical query-term overlap · relevance support noted per match</span></div>{pairs.length ? <div className="shared-event-grid">{pairs.map((pair, index) => <div className="shared-event-row" key={`${pair.left.article_id}-${pair.right.article_id}-${index}`}><a href={pair.left.url} target="_blank" rel="noreferrer">{pair.left.title}</a><span>{pair.supported ? 'High relevance on both sides; not a claim of the same event.' : 'Term overlap only; relevance does not support a same-event claim.'}</span><a href={pair.right.url} target="_blank" rel="noreferrer">{pair.right.title}</a></div>)}</div> : <p className="shared-empty">No article pair shares a query term in the retrieved evidence.</p>}</section>}
    </>}
    <footer className="coverage-footer"><span>FRAMELINE / SOURCE MONITOR</span><Link to="/map">MAP <ArrowLeft size={12}/></Link></footer>
  </main>;
}
