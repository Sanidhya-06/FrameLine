import { test, expect } from '@playwright/test';
const countryArticles = [
  { article_id: 'a1', title: 'Leaders discuss next phase of Ukraine peace talks', url: 'https://example.com/a1', publisher: 'BBC World', source_country: 'US', iso_code: 'USA', published_at: '2026-10-28T12:30:00Z', rss_summary: 'Officials met to discuss talks.', article_text: null, retrieved_at: '2026-10-29T05:00:00Z', extraction_status: 'partial', relevance_label: 'relevant', translation_status: 'translated', translated_title: 'Translated: leaders discuss Ukraine talks', translated_summary: 'Translated: officials met about talks.', translation_backend: 'nllb' },
  { article_id: 'a2', title: 'Diplomats prepare for further discussions', url: 'https://example.com/a2', publisher: 'BBC World', source_country: 'US', iso_code: 'USA', published_at: null, rss_summary: 'Diplomats meet soon.', article_text: null, retrieved_at: '2026-10-29T05:00:00Z', extraction_status: 'unavailable', relevance_label: 'weak_match' },
];
const fixtureResult = {
  query: 'Ukraine peace talks', status: 'partial_results', cached: true, generated_at: '2026-10-29T05:15:00Z', feed_statuses: [], articles: countryArticles, country_groups: { USA: { iso_code: 'USA', region: 'North America', display_name: 'United States', article_count: 3, sources: ['BBC World'], coverage_status: 'covered', signals: [], limitations: [], articles: countryArticles.filter((article) => article.relevance_label !== 'weak_match') } },
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
  await expect(page.getByText('MACHINE TRANSLATED · nllb')).toBeVisible();
  await expect(page.getByText('Diplomats prepare for further discussions')).toHaveCount(0);
  await page.getByLabel('Show weak matches (1)').check();
  await expect(page.getByText('Diplomats prepare for further discussions')).toBeVisible();
  await page.getByLabel('Show English machine translations (1)').check();
  await expect(page.getByText('Translated: leaders discuss Ukraine talks')).toBeVisible();
});

test('map country-to-geography mapping covers alpha-2, alpha-3, and numeric identifiers', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');
  const mapping = await page.evaluate(async (groups) => {
    const { matchCountryGroup, normalizeIso } = await import('/src/components/CountryMap.tsx');
    return { alpha2: matchCountryGroup({ properties: { ISO_A2: 'US' } }, groups)?.display_name, alpha3: matchCountryGroup({ properties: { ISO_A3: 'USA' } }, groups)?.display_name, numeric: matchCountryGroup({ id: '840' }, groups)?.display_name, padded: normalizeIso('036') };
  }, fixtureResult.country_groups);
  expect(mapping).toEqual({ alpha2: 'United States', alpha3: 'United States', numeric: 'United States', padded: '036' });
});

test('methodology discloses the NLLB license and research-use limitation', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/methodology');
  await expect(page.getByText('NLLB · CC-BY-NC-4.0')).toBeVisible();
  await expect(page.getByText(/not released for production deployment/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /OPUS-MT · Russian/ })).toBeVisible();
});
