import { test, expect } from '@playwright/test';

const article = (id, country, title, score, translated = false) => ({
  article_id: id, title, url: `https://example.com/${id}`, publisher: `${country} News`,
  source_country: country, iso_code: country, published_at: '2026-10-28T12:30:00Z',
  published_raw: null, rss_summary: 'Officials discuss the Ukraine peace talks.',
  article_text: translated ? null : 'Officials discussed the next phase of the talks.',
  retrieved_at: '2026-10-29T05:00:00Z', extraction_status: translated ? 'unavailable' : 'partial',
  language: translated ? 'uk' : 'en', translation_status: translated ? 'translated' : 'not_required',
  translated_title: translated ? `English: ${title}` : null, translated_summary: translated ? 'English summary.' : null,
  translation_backend: translated ? 'nllb' : null, matched_terms: ['Ukraine', 'peace', 'talks'],
  relevance_score: score, relevance_components: {}, relevance_method: 'hybrid', relevance_label: 'relevant',
});

const base = {
  query: 'Ukraine peace talks', status: 'ok', articles: [], signals: [], methodology_version: 'phase7',
  relevance_method: 'hybrid', development_only: true, explanation: null, feed_statuses: [], cached: true,
  generated_at: '2026-10-29T05:15:00Z', translation_stats: {},
};

function result(groups) { return { ...base, country_groups: groups }; }
const groups = {
  USA: { iso_code: 'USA', region: 'North America', display_name: 'United States', article_count: 2, sources: ['US News'], coverage_status: 'covered', signals: [], limitations: [], articles: [article('us-1', 'USA', 'US leaders discuss peace talks', .85), article('us-2', 'USA', 'US diplomats prepare for talks', .81, true)] },
  GBR: { iso_code: 'GBR', region: 'Europe', display_name: 'United Kingdom', article_count: 1, sources: ['UK News'], coverage_status: 'covered', signals: [], limitations: [], articles: [article('gb-1', 'GBR', 'UK leaders report on Ukraine talks', .82)] },
};

async function seed(page, data) {
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate((value) => sessionStorage.setItem('frameline-app', JSON.stringify({ state: { query: value.query, result: value, job: null, jobId: null, error: null }, version: 0 })), data);
}

test('compare renders side-by-side evidence and notices', async ({ page }) => {
  await seed(page, result(groups));
  await page.goto('http://127.0.0.1:5173/compare');
  await expect(page.getByRole('heading', { name: 'Coverage, side by side.' })).toBeVisible();
  await expect(page.getByText('Fewer than 3 articles; interpretation is limited.')).toHaveCount(2);
  await expect(page.locator('.compare-notice')).toHaveCount(3);
  await expect(page.getByText(/Differences in coverage reflect/)).toBeVisible();
  await expect(page.getByText(/Method: lexical query-term overlap/)).toBeVisible();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByText('English: US diplomats prepare for talks')).toBeVisible();
  await page.screenshot({ path: 'test-results/compare-desktop.png', fullPage: true });
});

test('compare has a clear empty state with fewer than two covered groups', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, result({ USA: groups.USA }));
  await page.goto('http://127.0.0.1:5173/compare');
  await expect(page.getByText('Comparison needs two covered countries')).toBeVisible();
  await expect(page.getByText(/Only 1 country with retrieved coverage/)).toBeVisible();
  await page.screenshot({ path: 'test-results/compare-mobile.png', fullPage: true });
});
