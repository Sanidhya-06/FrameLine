import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const fixtureResult = {
  query: 'Ukraine peace talks', status: 'partial_results', cached: true, generated_at: '2026-10-29T05:15:00Z', development_only: true, explanation: null, methodology_version: 'phase5', relevance_method: 'hybrid', signals: [],
  feed_statuses: [{ feed: 'BBC World', url: 'https://bbc.example/rss', status: 'ok', error_text: null, entry_count: 8, response_time_ms: 210 }, { feed: 'Global News Desk', url: 'https://failure.example/rss', status: 'failed', error_text: 'Connection timed out', entry_count: 0, response_time_ms: 15000 }],
  articles: [], country_groups: { USA: { iso_code: 'USA', region: 'North America', display_name: 'United States', article_count: 3, sources: ['BBC World', 'The Guardian'], coverage_status: 'covered', signals: [], limitations: [], articles: [
    { article_id: 'article-1', title: 'Leaders discuss next phase of Ukraine peace talks', url: 'https://example.com/story', publisher: 'BBC World', source_country: 'United States', iso_code: 'USA', published_at: '2026-10-28T12:30:00Z', rss_summary: 'Officials met to discuss a proposed framework for peace talks.', article_text: null, retrieved_at: '2026-10-29T05:00:00Z', extraction_status: 'partial', relevance_label: 'relevant' },
    { article_id: 'article-2', title: 'Diplomats prepare for further discussions', url: 'https://example.com/story-2', publisher: 'The Guardian', source_country: 'United States', iso_code: 'USA', published_at: null, rss_summary: 'Diplomats are expected to meet later this week.', article_text: null, retrieved_at: '2026-10-29T05:00:00Z', extraction_status: 'unavailable', relevance_label: 'weak_match' },
  ] } },
};

const browser = await chromium.launch({ headless: true });
const output = fileURLToPath(new URL('../../docs/screenshots/phase5/', import.meta.url));
await mkdir(output, { recursive: true });
const scenarios = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 },
];
for (const viewport of scenarios) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.isMobile, deviceScaleFactor: viewport.deviceScaleFactor });
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate((data) => {
    const raw = sessionStorage.getItem('frameline-app');
    const state = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    state.state = { ...state.state, query: data.query, result: data, job: { job_id: 'fixture', status: 'finished', stage: 'done', feeds_completed: 1, feeds_total: 2, articles_extracted: 0, articles_total: 0, feed_statuses: data.feed_statuses, result: data, error: null } };
    sessionStorage.setItem('frameline-app', JSON.stringify(state));
  }, fixtureResult);
  await page.goto('http://127.0.0.1:5173/map');
  await page.waitForSelector('.map-stage svg');
  await page.screenshot({ path: join(output, `screen-c-map-${viewport.name}.png`), fullPage: true });
  await page.getByRole('button', { name: /United States/ }).first().click();
  await page.waitForSelector('.country-panel');
  await page.screenshot({ path: join(output, `screen-c-country-${viewport.name}.png`), fullPage: true });
  console.log(`Captured Screen C ${viewport.name} map and country panel`);
  await page.close();
}
await browser.close();
