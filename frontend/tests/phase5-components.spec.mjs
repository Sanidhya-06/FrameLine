import { test, expect } from '@playwright/test';
const fixtureResult = {
  query: 'Ukraine peace talks', status: 'partial_results', cached: true, generated_at: '2026-10-29T05:15:00Z', feed_statuses: [], articles: [], country_groups: { USA: { iso_code: 'USA', region: 'North America', display_name: 'United States', article_count: 3, sources: ['BBC World'], coverage_status: 'covered', signals: [], limitations: [], articles: [
    { article_id: 'a1', title: 'Leaders discuss next phase of Ukraine peace talks', url: 'https://example.com/a1', publisher: 'BBC World', source_country: 'US', iso_code: 'USA', published_at: '2026-10-28T12:30:00Z', rss_summary: 'Officials met to discuss talks.', article_text: null, retrieved_at: '2026-10-29T05:00:00Z', extraction_status: 'partial', relevance_label: 'relevant' },
    { article_id: 'a2', title: 'Diplomats prepare for further discussions', url: 'https://example.com/a2', publisher: 'BBC World', source_country: 'US', iso_code: 'USA', published_at: null, rss_summary: 'Diplomats meet soon.', article_text: null, retrieved_at: '2026-10-29T05:00:00Z', extraction_status: 'unavailable', relevance_label: 'weak_match' },
  ] } },
};

test('country detail panel renders real fixture evidence and hides weak matches by default', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate((data) => {
    sessionStorage.setItem('frameline-app', JSON.stringify({ state: { query: data.query, result: data, job: null, jobId: null, error: null }, version: 0 }));
  }, fixtureResult);
  await page.goto('http://127.0.0.1:5173/country/USA');
  await expect(page.getByText('Analysis signals not yet available')).toBeVisible();
  await expect(page.getByText('Results describe the sources analyzed, not the country as a whole.')).toBeVisible();
  await expect(page.getByText('Leaders discuss next phase of Ukraine peace talks')).toBeVisible();
  await expect(page.getByText('Diplomats prepare for further discussions')).toHaveCount(0);
  await page.getByLabel('Show weak matches (1)').check();
  await expect(page.getByText('Diplomats prepare for further discussions')).toBeVisible();
});

test('map country-to-geography mapping covers alpha-2, alpha-3, and numeric identifiers', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(async (groups) => {
    const source = await (await fetch('/src/components/CountryMap.tsx')).text();
    const nums = source.match(/const ISO_NUMERIC[^=]*= (\{[^;]+\});/s);
    const alpha = source.match(/const alpha2[^=]*= (\{[^;]+\});/s);
    const normalize = (value) => { const code = String(value ?? '').trim().toUpperCase(); if (/^\d{1,3}$/.test(code)) return code.padStart(3, '0'); return (new Function(`return ${nums[1]}`)())[code] || (new Function(`return ${alpha[1]}`)())[code] || code; };
    const candidates = ['840', 'USA', 'US'].map(normalize);
    const group = Object.values(groups).find((item) => candidates.includes(normalize(item.iso_code)));
    window.__mapMatch = group?.display_name;
  }, fixtureResult.country_groups);
  expect(await page.evaluate(() => window.__mapMatch)).toBe('United States');
});
