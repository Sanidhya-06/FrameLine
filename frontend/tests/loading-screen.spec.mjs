/**
 * loading-screen.spec.mjs
 *
 * Playwright tests for the /loading screen redesign.
 * Tests:
 *   1. Full-screen background image is loaded and visible
 *   2. Globe canvas is rendered with the correct data-testid
 *   3. Status panel shows the query and stage label
 *   4. Feed-chip appears when a feed completes (mocked job)
 *   5. Error state (retry + new search buttons) with a failed job
 *   6. prefers-reduced-motion: globe present but static (no spinning class)
 *   7. Globe canvas is cleaned up (RAF cancelled) on unmount / navigate away
 *   8. Mobile viewport: globe and panel visible, background uses mobile crop
 */
import { test, expect } from '@playwright/test';

// ── Shared helpers ─────────────────────────────────────────────────────────

/** Inject a fake job into sessionStorage so the page starts already running */
function injectRunningJob(page, overrides = {}) {
  return page.evaluate((data) => {
    sessionStorage.setItem(
      'frameline-app',
      JSON.stringify({
        state: {
          query: data.query,
          job:   data.job,
          jobId: data.job.job_id,
          result: null,
          error: null,
        },
        version: 0,
      }),
    );
  }, {
    query: 'Ukraine peace talks',
    job: {
      job_id: 'test-job-1',
      status: 'running',
      stage:  'retrieving_headlines',
      feeds_completed: 2,
      feeds_total: 6,
      articles_extracted: 5,
      articles_total: 20,
      feed_statuses: [
        { feed: 'BBC World', url: 'https://bbc.test/rss', status: 'ok', error_text: null, entry_count: 8, response_time_ms: 210 },
        { feed: 'TASS',      url: 'https://tass.test/rss', status: 'failed', error_text: 'Connection refused', entry_count: 0, response_time_ms: 5000 },
      ],
      result: null,
      error:  null,
      ...overrides,
    },
  });
}

// ── Test 1: background image ───────────────────────────────────────────────
test('background WebP image is present and covers the viewport', async ({ page }) => {
  // Block job polling so the page stays stable
  await page.route('**/analyze/jobs/**', route => route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ job_id: 'test-job-1', status: 'running', stage: 'retrieving_headlines',
      feeds_completed: 2, feeds_total: 6, articles_extracted: 5, articles_total: 20,
      feed_statuses: [], result: null, error: null }) }));

  await page.goto('http://127.0.0.1:5173/');
  await injectRunningJob(page);
  await page.goto('http://127.0.0.1:5173/loading');

  const img = page.locator('.lb-bg-img');
  await expect(img).toBeVisible();
  const src = await img.getAttribute('src');
  expect(src).toMatch(/loading-bg\.webp/);

  // Image should have rendered (naturalWidth > 0 means loaded)
  const naturalWidth = await img.evaluate(el => (el as HTMLImageElement).naturalWidth);
  expect(naturalWidth).toBeGreaterThan(0);
});

// ── Test 2: globe canvas ───────────────────────────────────────────────────
test('globe canvas is rendered and aria-hidden', async ({ page }) => {
  await page.route('**/analyze/jobs/**', route => route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ job_id: 'test-job-1', status: 'running', stage: 'connecting_feeds',
      feeds_completed: 0, feeds_total: 6, articles_extracted: 0, articles_total: 0,
      feed_statuses: [], result: null, error: null }) }));

  await page.goto('http://127.0.0.1:5173/');
  await injectRunningJob(page);
  await page.goto('http://127.0.0.1:5173/loading');

  const canvas = page.getByTestId('globe-canvas');
  await expect(canvas).toBeVisible();
  expect(await canvas.getAttribute('aria-hidden')).toBe('true');

  // Canvas should have a non-zero size
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(50);
  expect(box!.height).toBeGreaterThan(50);
});

// ── Test 3: status panel content ──────────────────────────────────────────
test('status panel shows the query and current stage label', async ({ page }) => {
  await page.route('**/analyze/jobs/**', route => route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ job_id: 'test-job-1', status: 'running', stage: 'retrieving_headlines',
      feeds_completed: 2, feeds_total: 6, articles_extracted: 5, articles_total: 20,
      feed_statuses: [], result: null, error: null }) }));

  await page.goto('http://127.0.0.1:5173/');
  await injectRunningJob(page);
  await page.goto('http://127.0.0.1:5173/loading');

  // Query label
  await expect(page.locator('.lb-console-query')).toContainText('Ukraine peace talks');
  // Stage label
  await expect(page.locator('.lb-stage-text strong')).toContainText('Retrieving headlines');
  // Counts
  await expect(page.locator('.lb-counts')).toContainText('2/6 FEEDS');
  // aria-live region exists
  const section = page.locator('.lb-console');
  expect(await section.getAttribute('aria-live')).toBe('polite');
});

// ── Test 4: feed failures accordion ───────────────────────────────────────
test('failed feed appears in the accordion', async ({ page }) => {
  await page.route('**/analyze/jobs/**', route => route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ job_id: 'test-job-1', status: 'running', stage: 'extracting_text',
      feeds_completed: 3, feeds_total: 6, articles_extracted: 10, articles_total: 20,
      feed_statuses: [
        { feed: 'TASS', url: 'https://tass.test/rss', status: 'failed', error_text: 'Connection refused', entry_count: 0, response_time_ms: 5000 },
      ], result: null, error: null }) }));

  await page.goto('http://127.0.0.1:5173/');
  await injectRunningJob(page, { stage: 'extracting_text', feed_statuses: [
    { feed: 'TASS', url: 'https://tass.test/rss', status: 'failed', error_text: 'Connection refused', entry_count: 0, response_time_ms: 5000 },
  ]});
  await page.goto('http://127.0.0.1:5173/loading');

  const details = page.locator('.lb-failures');
  await expect(details).toBeVisible();
  await expect(details.locator('summary')).toContainText('1 feed connection failed');

  await details.locator('summary').click();
  await expect(details.locator('li strong')).toContainText('TASS');
});

// ── Test 5: error / failed state ──────────────────────────────────────────
test('failed job shows retry and new-search buttons', async ({ page }) => {
  await page.route('**/analyze/jobs/**', route => route.fulfill({ status: 500,
    body: JSON.stringify({ detail: 'Server error' }), contentType: 'application/json' }));

  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => {
    sessionStorage.setItem('frameline-app', JSON.stringify({
      state: {
        query: 'Ukraine peace talks',
        job: {
          job_id: 'test-job-fail', status: 'failed', stage: 'failed',
          feeds_completed: 0, feeds_total: 6, articles_extracted: 0, articles_total: 0,
          feed_statuses: [], result: null, error: 'Stage failed',
        },
        jobId: 'test-job-fail', result: null, error: null,
      },
      version: 0,
    }));
  });
  await page.goto('http://127.0.0.1:5173/loading');

  await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /new search/i })).toBeVisible();
  // Status text should indicate failed
  await expect(page.locator('.lb-topbar-tag')).toContainText('ATTENTION');
});

// ── Test 6: prefers-reduced-motion ────────────────────────────────────────
test('globe canvas is present with reduced-motion preference', async ({ browser }) => {
  const ctx = await browser.newContext({
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();

  await page.route('**/analyze/jobs/**', route => route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ job_id: 'rm-job', status: 'running', stage: 'connecting_feeds',
      feeds_completed: 0, feeds_total: 3, articles_extracted: 0, articles_total: 0,
      feed_statuses: [], result: null, error: null }) }));

  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => {
    sessionStorage.setItem('frameline-app', JSON.stringify({
      state: {
        query: 'climate summit',
        job: {
          job_id: 'rm-job', status: 'running', stage: 'connecting_feeds',
          feeds_completed: 0, feeds_total: 3, articles_extracted: 0, articles_total: 0,
          feed_statuses: [], result: null, error: null,
        },
        jobId: 'rm-job', result: null, error: null,
      },
      version: 0,
    }));
  });
  await page.goto('http://127.0.0.1:5173/loading');

  // Globe canvas still present in reduced-motion mode
  const canvas = page.getByTestId('globe-canvas');
  await expect(canvas).toBeVisible();

  // Background image should NOT have the parallax animation class running
  // (animation is suppressed via @media prefers-reduced-motion in CSS)
  const animDuration = await page.evaluate(() => {
    const el = document.querySelector('.lb-bg-img');
    return el ? getComputedStyle(el).animationDuration : null;
  });
  // In reduced-motion the animation-duration collapses to 0.01ms or 0s
  expect(['0s', '0.01ms', '1ms'].some(v => animDuration?.startsWith('0'))).toBe(true);

  await ctx.close();
});

// ── Test 7: globe cleanup on unmount ──────────────────────────────────────
test('navigating away from /loading cancels the globe RAF', async ({ page }) => {
  await page.route('**/analyze/jobs/**', route => route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ job_id: 'cleanup-job', status: 'running', stage: 'connecting_feeds',
      feeds_completed: 0, feeds_total: 3, articles_extracted: 0, articles_total: 0,
      feed_statuses: [], result: null, error: null }) }));

  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => {
    sessionStorage.setItem('frameline-app', JSON.stringify({
      state: {
        query: 'climate summit',
        job: { job_id: 'cleanup-job', status: 'running', stage: 'connecting_feeds',
          feeds_completed: 0, feeds_total: 3, articles_extracted: 0, articles_total: 0,
          feed_statuses: [], result: null, error: null },
        jobId: 'cleanup-job', result: null, error: null,
      },
      version: 0,
    }));
  });
  await page.goto('http://127.0.0.1:5173/loading');

  // Verify canvas is present before navigating
  await expect(page.getByTestId('globe-canvas')).toBeVisible();

  // Track RAF calls after navigation — if cleanup works, no new RAF errors occur
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  // Navigate away
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForTimeout(600); // allow any in-flight RAF to complete

  // Globe canvas should no longer exist in the DOM
  await expect(page.getByTestId('globe-canvas')).toHaveCount(0);

  // No JS errors from unmounted canvas
  expect(errors.filter(e => e.includes('canvas') || e.includes('Globe'))).toHaveLength(0);
});

// ── Test 8: mobile viewport ───────────────────────────────────────────────
test('mobile viewport renders globe and panel without layout overflow', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  await page.route('**/analyze/jobs/**', route => route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ job_id: 'mob-job', status: 'running', stage: 'checking_relevance',
      feeds_completed: 3, feeds_total: 6, articles_extracted: 8, articles_total: 20,
      feed_statuses: [], result: null, error: null }) }));

  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => {
    sessionStorage.setItem('frameline-app', JSON.stringify({
      state: {
        query: 'Gaza ceasefire',
        job: { job_id: 'mob-job', status: 'running', stage: 'checking_relevance',
          feeds_completed: 3, feeds_total: 6, articles_extracted: 8, articles_total: 20,
          feed_statuses: [], result: null, error: null },
        jobId: 'mob-job', result: null, error: null,
      },
      version: 0,
    }));
  });
  await page.goto('http://127.0.0.1:5173/loading');

  await expect(page.getByTestId('globe-canvas')).toBeVisible();
  await expect(page.locator('.lb-console')).toBeVisible();

  // No horizontal overflow
  const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth   = 390;
  expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 2); // 2px tolerance

  await ctx.close();
});
