import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, CircleAlert, Globe2, LoaderCircle, Radio, RotateCcw } from 'lucide-react';
import { getAnalysisJob, startAnalysis } from '../api/client';
import { useAppStore } from '../store/appStore';
import type { AnalyzeJob, FeedStatus, JobStage } from '../types';

const STAGE_LABELS: Record<JobStage, string> = {
  connecting_feeds: 'Connecting to feeds', retrieving_headlines: 'Retrieving headlines',
  checking_relevance: 'Checking topic relevance', extracting_text: 'Extracting article text',
  translating_text: 'Translating headlines and summaries',
  preparing_map: 'Preparing coverage map', done: 'Collection complete', failed: 'Analysis stopped',
};
const STAGE_ORDER: JobStage[] = ['connecting_feeds', 'retrieving_headlines', 'checking_relevance', 'extracting_text', 'translating_text', 'preparing_map', 'done'];

function CollectionField({ job, reduce }: { job: AnalyzeJob | null; reduce: boolean }) {
  const feeds = job?.feed_statuses ?? [];
  const articles = job?.result?.articles ?? [];
  const items = useMemo(() => {
    const items = articles.slice(0, 8).map((article, index) => ({
      key: article.article_id || article.url || `article-${index}`, label: article.publisher,
      code: article.iso_code || article.source_country || 'SOURCE', title: article.title,
      detail: article.rss_summary || article.extraction_status,
      state: 'article' as const,
    }));
    if (items.length) return items;
    return feeds.slice(0, 8).map((feed, index) => ({
      key: `${feed.url}-${index}`, label: feed.feed, code: feed.status.toUpperCase(),
      title: feed.status === 'failed' || feed.status === 'timeout' ? 'Feed could not be reached' : 'Headlines retrieved',
      detail: feed.error_text || `${feed.entry_count} entries · ${Math.round(feed.response_time_ms)} ms`,
      state: feed.status === 'failed' || feed.status === 'timeout' ? 'failed' as const : 'feed' as const,
    }));
  }, [articles, feeds]);
  const stageIndex = job ? Math.max(0, STAGE_ORDER.indexOf(job.stage)) : 0;
  const isActive = job?.status === 'running';
  return <div className="collection-field" aria-hidden="true">
    <div className="field-grain" />
    <div className="field-rays" />
    <motion.div className="collection-core" animate={reduce ? undefined : { scale: [1, 1.035, 1] }} transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}>
      <div className="core-ring core-ring-outer" /><div className="core-ring core-ring-inner" />
      <div className="core-glyph"><Globe2 size={24} strokeWidth={1.3} /></div>
      <span>FL / {String(stageIndex + 1).padStart(2, '0')}</span>
    </motion.div>
    <div className="field-path path-a" /><div className="field-path path-b" /><div className="field-path path-c" />
    <AnimatePresence>
      {items.map((card, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(items.length, 1) - Math.PI / 2;
        const radius = items.length < 4 ? 30 : 37;
        const x = `${50 + Math.cos(angle) * radius}%`; const y = `${49 + Math.sin(angle) * radius}%`;
        const arrived = job?.stage === 'done';
        return <motion.article key={card.key} className={`news-window ${card.state === 'failed' ? 'news-window-failed' : ''}`}
          initial={{ opacity: 0, x: '50vw', y: '30vh', scale: .7 }}
          animate={{ opacity: arrived ? .55 : isActive ? [.32, .74, .32] : .68, left: x, top: y, scale: 1, y: reduce ? 0 : [0, index % 2 ? 8 : -7, 0], rotate: index % 2 ? 1.2 : -1.2 }}
          exit={{ opacity: 0, scale: .65 }}
          transition={{ duration: reduce ? .01 : arrived ? .5 : 4.5 + (index % 3), delay: index * .12, repeat: isActive && !reduce ? Infinity : 0, ease: 'easeInOut' }}>
          <div className="news-window-top"><span className="news-source"><i />{card.label || 'NEWS FEED'}</span><span>{card.code}</span></div>
          <h3>{card.title}</h3><p>{card.detail}</p><div className="news-window-data"><i /><i /><i /></div>
        </motion.article>;
      })}
    </AnimatePresence>
    {job && <div className="field-meta"><span><Radio size={12} /> {job.feeds_completed}/{job.feeds_total} FEEDS</span><span>{job.articles_extracted}/{job.articles_total} ARTICLES</span></div>}
  </div>;
}

function FeedFailures({ statuses }: { statuses: FeedStatus[] }) {
  const failures = statuses.filter((feed) => ['failed', 'timeout'].includes(feed.status));
  if (!failures.length) return null;
  return <details className="feed-failures"><summary>{failures.length} feed {failures.length === 1 ? 'connection' : 'connections'} failed</summary><ul>{failures.map((feed) => <li key={feed.url}><strong>{feed.feed}</strong><span>{feed.error_text || feed.status}</span></li>)}</ul></details>;
}

export default function LoadingPage() {
  const { query, job, setJob, result, setError } = useAppStore();
  const navigate = useNavigate(); const reduce = useReducedMotion();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const mounted = useRef(true); const startedFor = useRef<string | null>(null);
  const activeJob = job?.job_id && job.status !== 'finished' && job.status !== 'failed' ? job : null;

  const begin = useCallback(async () => {
    if (!query.trim() || starting) return;
    setStarting(true); setRequestError(null); setError(null);
    try {
      const started = await startAnalysis(query);
      if ('stage' in started) {
        setJob(started);
        if (started.result) useAppStore.getState().setResult(started.result);
        if (started.status === 'finished' && started.result) { navigate('/map', { replace: true }); return; }
      } else {
        startedFor.current = started.job_id;
        setJob({ job_id: started.job_id, status: 'running', stage: 'connecting_feeds', feeds_completed: 0, feeds_total: 0, articles_extracted: 0, articles_total: 0, feed_statuses: [], result: null, error: null });
      }
    } catch (err) { setRequestError(err instanceof Error ? err.message : 'Could not start analysis.'); }
    finally { if (mounted.current) setStarting(false); }
  }, [query, starting, setError, setJob, navigate]);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!query) return;
    if (result && job?.status === 'finished' && result.articles.length > 0) { navigate('/map', { replace: true }); return; }
    if (!job && !requestError) void begin();
  }, [query, job, result, requestError, begin, navigate]);

  useEffect(() => {
    const id = activeJob?.job_id; if (!id) return;
    let cancelled = false; let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await getAnalysisJob(id);
        if (cancelled) return;
        setJob(next);
        if (next.result) useAppStore.getState().setResult(next.result);
        if (next.stage === 'done' && next.result) { navigate('/map', { replace: true }); return; }
        if (next.stage !== 'failed') timer = setTimeout(poll, 800);
      } catch (err) {
        if (!cancelled) { setRequestError(err instanceof Error ? err.message : 'Could not retrieve analysis progress.'); }
      }
    };
    void poll(); return () => { cancelled = true; clearTimeout(timer); };
  }, [activeJob?.job_id, setJob, navigate]);

  const stage = job?.stage;
  const stageLabel = stage ? STAGE_LABELS[stage] : starting ? 'Starting analysis' : 'Waiting to begin';
  const failed = Boolean(requestError || job?.stage === 'failed');
  const noResults = Boolean(job?.stage === 'done' && job.result && job.result.articles.length === 0);
  const retry = () => { startedFor.current = null; setRequestError(null); setJob({ job_id: '', status: 'running', stage: 'connecting_feeds', feeds_completed: 0, feeds_total: 0, articles_extracted: 0, articles_total: 0, feed_statuses: [], result: null, error: null }); void begin(); };

  if (!query) return <main className="loading-empty"><Globe2 /><h1>No topic to collect</h1><p>Start with a story so we can retrieve its coverage.</p><Link className="action-secondary" to="/">Back to search</Link></main>;

  return <main className="loading-shell">
    <CollectionField job={job} reduce={Boolean(reduce)} />
    <header className="loading-topbar"><Link to="/" className="wordmark"><span className="wordmark-icon"><Globe2 size={16} /></span><span>FRAME<span className="cyan">LINE</span></span></Link><span className="collection-tag"><span className={failed ? 'status-dot status-dot-error' : 'status-dot'} />{failed ? 'ATTENTION' : stage === 'done' ? 'COLLECTION READY' : 'LIVE COLLECTION'}</span></header>
    <section className="collection-console" aria-live="polite">
      <div className="collection-eyebrow"><span>FIELD 02</span><i /> SOURCE COLLECTION</div>
      <h1>{failed ? 'The connection broke.' : noResults ? 'No matching headlines found.' : 'Gathering the world’s coverage.'}</h1>
      <p className="collection-query"><span>QUERY</span> “{query}”</p>
      <div className={`stage-status ${failed ? 'stage-error' : ''}`}><span className="stage-icon">{failed ? <CircleAlert size={16} /> : stage === 'done' ? <Check size={16} /> : <LoaderCircle size={16} className={reduce ? '' : 'spin'} />}</span><div><strong>{failed ? 'Analysis could not be completed' : stageLabel}</strong><small>{job ? `${job.feeds_completed} of ${job.feeds_total} feeds · ${job.articles_extracted} of ${job.articles_total} articles${stage === 'translating_text' && job.translations_total ? ` · ${job.translations_completed || 0} of ${job.translations_total} text segments` : ''}` : 'Connecting to the configured news feeds'}</small></div></div>
      <FeedFailures statuses={job?.feed_statuses ?? []} />
      {(failed || noResults) && <div className="collection-actions"><button className="action-primary" onClick={retry}><RotateCcw size={15} /> Try again</button><Link className="action-secondary" to="/" onClick={() => setError(null)}>New search <ArrowRight size={15} /></Link></div>}
      {noResults && <p className="result-note">{job?.result?.explanation || 'The current feeds did not return relevant headlines for this topic.'}</p>}
      {requestError && <p className="request-error" role="alert">{requestError}</p>}
      {job?.stage === 'done' && !noResults && <p className="ready-note">Coverage collected. Opening the map…</p>}
    </section>
    <footer className="loading-footer"><span>FRAMELINE / SOURCE MONITOR</span><span>{job?.result?.cached ? 'CACHED RESULT' : stage === 'done' ? 'FEED WINDOW COMPLETE' : 'PROGRESS FROM LIVE JOB'}</span></footer>
  </main>;
}
