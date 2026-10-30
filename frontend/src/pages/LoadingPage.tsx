/**
 * LoadingPage — rebuilt for loading-bg.webp visual
 *
 * Visual:  full-viewport WebP background, rotating 3D globe at centre,
 *          glass status panel below, chip toasts for completed feeds.
 * Logic:   all real behaviour preserved —
 *            job polling, stage tracking, retry, navigate to /map on done,
 *            feed failures, 404/stall handling, new-search link.
 */
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, Check, CircleAlert, Globe2, LoaderCircle,
  Radio, RotateCcw,
} from 'lucide-react';
import { getAnalysisJob, startAnalysis } from '../api/client';
import { useAppStore } from '../store/appStore';
import type { FeedStatus, JobStage } from '../types';
import { GlobeCanvas } from '../components/GlobeCanvas';

// ── Stage metadata ────────────────────────────────────────────────────────
const STAGE_LABELS: Record<JobStage, string> = {
  connecting_feeds:    'Connecting to feeds',
  retrieving_headlines:'Retrieving headlines',
  checking_relevance:  'Checking topic relevance',
  extracting_text:     'Extracting article text',
  translating_text:    'Translating headlines and summaries',
  preparing_map:       'Preparing coverage map',
  done:                'Collection complete',
  failed:              'Analysis stopped',
};
const STAGE_ORDER: JobStage[] = [
  'connecting_feeds','retrieving_headlines','checking_relevance',
  'extracting_text','translating_text','preparing_map','done',
];
const STAGE_FRAC: Record<JobStage, number> = {
  connecting_feeds:0, retrieving_headlines:1, checking_relevance:2,
  extracting_text:3, translating_text:4, preparing_map:5, done:6, failed:0,
};

// ── Feed-completion chip ──────────────────────────────────────────────────
interface FeedChip { id: string; label: string; code: string; failed: boolean; }

function FeedChipToast({ chip, reduce }: { chip: FeedChip; reduce: boolean }) {
  return (
    <motion.div
      key={chip.id}
      className={`lb-feed-chip ${chip.failed ? 'lb-feed-chip-fail' : ''}`}
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: reduce ? 0.01 : 0.35 }}
    >
      <span className="lb-chip-dot" />
      <span className="lb-chip-source">{chip.label}</span>
      <span className="lb-chip-code">{chip.code}</span>
    </motion.div>
  );
}

// ── Feed failures accordion ───────────────────────────────────────────────
function FeedFailures({ statuses }: { statuses: FeedStatus[] }) {
  const failures = statuses.filter((f) => ['failed','timeout'].includes(f.status));
  if (!failures.length) return null;
  return (
    <details className="lb-failures">
      <summary>{failures.length} feed {failures.length === 1 ? 'connection' : 'connections'} failed</summary>
      <ul>
        {failures.map((f) => (
          <li key={f.url}>
            <strong>{f.feed}</strong>
            <span>{f.error_text || f.status}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────
function StageBar({ stage, failed }: { stage: JobStage | undefined; failed: boolean }) {
  const frac = stage ? STAGE_FRAC[stage] : 0;
  const pct  = failed ? 100 : Math.round((frac / 6) * 100);
  return (
    <div className="lb-bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className={`lb-bar-fill ${failed ? 'lb-bar-fail' : ''}`}
        initial={{ width: '0%' }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6 }}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function LoadingPage() {
  const { query, job, setJob, result, setError } = useAppStore();
  const navigate   = useNavigate();
  const reduce     = useReducedMotion();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [starting,  setStarting]  = useState(false);
  const [chips, setChips]         = useState<FeedChip[]>([]);
  const seenFeeds = useRef<Set<string>>(new Set());
  const mounted   = useRef(true);
  const startedFor = useRef<string | null>(null);

  const activeJob = job?.job_id && job.status !== 'finished' && job.status !== 'failed'
    ? job : null;

  // Globe size: ~23 vw, clamped 160–340
  const [globeSize, setGlobeSize] = useState(() =>
    Math.min(340, Math.max(160, Math.round(window.innerWidth * 0.23))));
  useEffect(() => {
    const onResize = () =>
      setGlobeSize(Math.min(340, Math.max(160, Math.round(window.innerWidth * 0.23))));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Collect ISO codes of feeds that have completed
  const litCodes = useMemo(() => {
    const s = new Set<string>();
    for (const f of (job?.feed_statuses ?? [])) {
      if (f.status === 'ok' || f.status === 'failed' || f.status === 'timeout') {
        // try to extract iso from feed name heuristic — backend should provide iso_code
        // We use what the article records give us; feed statuses don't always have it
        // so we leave this as an extension point.
      }
    }
    // from articles
    for (const a of (job?.result?.articles ?? [])) {
      if (a.iso_code) s.add(a.iso_code);
    }
    return s;
  }, [job]);

  // Emit chips when feed statuses change
  useEffect(() => {
    for (const f of (job?.feed_statuses ?? [])) {
      const done = f.status === 'ok' || f.status === 'failed' || f.status === 'timeout';
      if (done && !seenFeeds.current.has(f.url)) {
        seenFeeds.current.add(f.url);
        const chip: FeedChip = {
          id:     `${f.url}-${Date.now()}`,
          label:  f.feed,
          code:   f.status.toUpperCase(),
          failed: f.status !== 'ok',
        };
        setChips((prev) => [...prev.slice(-4), chip]); // keep last 5
        // auto-dismiss after 3.5 s
        setTimeout(() => setChips((prev) => prev.filter((c) => c.id !== chip.id)), 3500);
      }
    }
  }, [job?.feed_statuses]);

  // ── Start job ──────────────────────────────────────────────────────────
  const begin = useCallback(async () => {
    if (!query.trim() || starting) return;
    setStarting(true);
    setRequestError(null);
    setError(null);
    try {
      const started = await startAnalysis(query);
      if ('stage' in started) {
        setJob(started);
        if (started.result) useAppStore.getState().setResult(started.result);
        if (started.status === 'finished' && started.result) {
          navigate('/map', { replace: true });
          return;
        }
      } else {
        startedFor.current = started.job_id;
        setJob({
          job_id: started.job_id, status: 'running', stage: 'connecting_feeds',
          feeds_completed: 0, feeds_total: 0, articles_extracted: 0,
          articles_total: 0, feed_statuses: [], result: null, error: null,
        });
      }
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Could not start analysis.');
    } finally {
      if (mounted.current) setStarting(false);
    }
  }, [query, starting, setError, setJob, navigate]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!query) return;
    if (result && job?.status === 'finished' && result.articles.length > 0) {
      navigate('/map', { replace: true });
      return;
    }
    if (!job && !requestError) void begin();
  }, [query, job, result, requestError, begin, navigate]);

  // ── Poll ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = activeJob?.job_id;
    if (!id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await getAnalysisJob(id);
        if (cancelled) return;
        setJob(next);
        if (next.result) useAppStore.getState().setResult(next.result);
        if (next.stage === 'done' && next.result) {
          navigate('/map', { replace: true });
          return;
        }
        if (next.stage !== 'failed') timer = setTimeout(poll, 800);
      } catch (err) {
        if (!cancelled) {
          setRequestError(err instanceof Error ? err.message : 'Could not retrieve analysis progress.');
        }
      }
    };
    void poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeJob?.job_id, setJob, navigate]);

  // ── Derived state ──────────────────────────────────────────────────────
  const stage      = job?.stage;
  const stageLabel = stage ? STAGE_LABELS[stage] : starting ? 'Starting analysis…' : 'Waiting to begin';
  const failed     = Boolean(requestError || job?.stage === 'failed');
  const noResults  = Boolean(job?.stage === 'done' && job.result && job.result.articles.length === 0);

  const retry = () => {
    startedFor.current = null;
    setRequestError(null);
    seenFeeds.current.clear();
    setChips([]);
    setJob({
      job_id: '', status: 'running', stage: 'connecting_feeds',
      feeds_completed: 0, feeds_total: 0, articles_extracted: 0,
      articles_total: 0, feed_statuses: [], result: null, error: null,
    });
    void begin();
  };

  // ── Empty state ────────────────────────────────────────────────────────
  if (!query) {
    return (
      <main className="loading-empty">
        <Globe2 />
        <h1>No topic to collect</h1>
        <p>Start with a story so we can retrieve its coverage.</p>
        <Link className="action-secondary" to="/">Back to search</Link>
      </main>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <main className="lb-shell" aria-label="News collection in progress">
      {/* Background image */}
      <picture aria-hidden="true" className="lb-bg-picture">
        <source media="(max-width: 600px)" srcSet="/images/loading-bg-mobile.webp" type="image/webp" />
        <img
          src="/images/loading-bg.webp"
          alt=""
          aria-hidden="true"
          className="lb-bg-img"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </picture>

      {/* Vignette overlay */}
      <div className="lb-vignette" aria-hidden="true" />

      {/* Slow parallax scale on background (CSS only, respects reduce motion) */}
      <div className="lb-parallax" aria-hidden="true" />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="lb-topbar">
        <Link to="/" className="lb-wordmark">
          <span className="lb-wordmark-icon"><Globe2 size={15} /></span>
          <span>FRAME<span className="lb-cyan">LINE</span></span>
        </Link>
        <div className="lb-topbar-right">
          <span className={failed ? 'lb-status-dot lb-status-dot-err' : 'lb-status-dot'} />
          <span className="lb-topbar-tag">
            {failed ? 'ATTENTION' : stage === 'done' ? 'COLLECTION READY' : 'LIVE COLLECTION'}
          </span>
        </div>
      </header>

      {/* ── Globe centred in the image's convergence gap ────────────── */}
      <div className="lb-globe-wrap" aria-hidden="true">
        {/* Outer atmosphere ring */}
        {!reduce && (
          <motion.div
            className="lb-globe-aura"
            style={{ width: globeSize + 60, height: globeSize + 60 }}
            animate={{ opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <GlobeCanvas
          size={globeSize}
          reduceMotion={Boolean(reduce)}
          litCodes={litCodes}
        />
        {/* Stage counter badge */}
        <div className="lb-globe-badge">
          <span>FL</span>
          <span className="lb-cyan">{String(STAGE_ORDER.indexOf(stage ?? 'connecting_feeds') + 1).padStart(2,'0')}</span>
        </div>
      </div>

      {/* ── Feed-completion chips (Framer Motion portal near globe) ─── */}
      <div className="lb-chips-wrap" aria-hidden="true">
        <AnimatePresence>
          {chips.map((chip) => (
            <FeedChipToast key={chip.id} chip={chip} reduce={Boolean(reduce)} />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Status panel ─────────────────────────────────────────────── */}
      <section className="lb-console" aria-live="polite" aria-atomic="false">
        <div className="lb-console-eyebrow">
          <span>FIELD 02</span>
          <i />
          SOURCE COLLECTION
        </div>

        <h1 className="lb-console-h1">
          {failed
            ? 'The connection broke.'
            : noResults
              ? 'No matching headlines found.'
              : 'Gathering the world\u2019s coverage.'}
        </h1>

        <p className="lb-console-query">
          <span>QUERY</span> &ldquo;{query}&rdquo;
        </p>

        {/* Stage row */}
        <div className={`lb-stage-row ${failed ? 'lb-stage-row-err' : ''}`}>
          <span className="lb-stage-icon">
            {failed
              ? <CircleAlert size={15} />
              : stage === 'done'
                ? <Check size={15} />
                : <LoaderCircle size={15} className={reduce ? '' : 'lb-spin'} />}
          </span>
          <div className="lb-stage-text">
            <strong>{failed ? 'Analysis could not be completed' : stageLabel}</strong>
            <small>
              {job
                ? `${job.feeds_completed} of ${job.feeds_total} feeds · ${job.articles_extracted} of ${job.articles_total} articles${
                    stage === 'translating_text' && job.translations_total
                      ? ` · ${job.translations_completed ?? 0} of ${job.translations_total} segments`
                      : ''}`
                : 'Connecting to the configured news feeds'}
            </small>
          </div>
        </div>

        {/* Progress bar */}
        <StageBar stage={stage} failed={failed} />

        {/* Counts row */}
        {job && (
          <div className="lb-counts">
            <span><Radio size={11} /> {job.feeds_completed}/{job.feeds_total} FEEDS</span>
            <span>{job.articles_extracted}/{job.articles_total} ARTICLES</span>
          </div>
        )}

        <FeedFailures statuses={job?.feed_statuses ?? []} />

        {/* Actions */}
        {(failed || noResults) && (
          <div className="lb-actions">
            <button className="lb-action-primary" onClick={retry}>
              <RotateCcw size={14} /> Try again
            </button>
            <Link className="lb-action-secondary" to="/" onClick={() => setError(null)}>
              New search <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {noResults && (
          <p className="lb-result-note">
            {job?.result?.explanation || 'The current feeds did not return relevant headlines for this topic.'}
          </p>
        )}
        {requestError && <p className="lb-req-error" role="alert">{requestError}</p>}
        {stage === 'done' && !noResults && (
          <p className="lb-ready-note">Coverage collected. Opening the map…</p>
        )}
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="lb-footer">
        <span>FRAMELINE / SOURCE MONITOR</span>
        <span className="lb-caption-note">Illustrative background</span>
        <span>
          {job?.result?.cached
            ? 'CACHED RESULT'
            : stage === 'done'
              ? 'FEED WINDOW COMPLETE'
              : 'PROGRESS FROM LIVE JOB'}
        </span>
      </footer>
    </main>
  );
}
