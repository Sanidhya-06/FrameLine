import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const browser = await chromium.launch({ headless: true });
const output = fileURLToPath(new URL('../../docs/screenshots/phase4/', import.meta.url));
await mkdir(output, { recursive: true });

const scenarios = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 },
];

for (const viewport of scenarios) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.isMobile, deviceScaleFactor: viewport.deviceScaleFactor });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(output, `screen-a-${viewport.name}.png`), fullPage: true });
  await page.locator('.reference-search button').click();
  await page.getByRole('alert').waitFor();

  await page.route('http://localhost:8000/analyze/jobs**', async (route) => {
    const url = route.request().url();
    if (route.request().method() === 'POST') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ job_id: 'visual-review-job' }) });
      return;
    }
    const payload = {
      job_id: 'visual-review-job', status: 'running', stage: 'extracting_text',
      feeds_completed: 3, feeds_total: 5, articles_extracted: 2, articles_total: 7,
      feed_statuses: [
        { feed: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', status: 'ok', error_text: null, entry_count: 14, response_time_ms: 210 },
        { feed: 'The Guardian', url: 'https://theguardian.com/world/rss', status: 'ok', error_text: null, entry_count: 18, response_time_ms: 340 },
        { feed: 'Global News Desk', url: 'https://example.invalid/rss', status: 'failed', error_text: 'Connection timed out', entry_count: 0, response_time_ms: 15000 },
      ], result: null, error: null,
    };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(payload) });
  });
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://127.0.0.1:5173/');
  await page.getByLabel('Search a news topic').fill('Ukraine peace talks');
  await page.locator('.reference-search button').click();
  await page.waitForSelector('.collection-console');
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(output, `screen-b-${viewport.name}.png`), fullPage: true });
  console.log(`Captured Screen A/B at ${viewport.width}x${viewport.height}`);
  await page.close();
}

await browser.close();
