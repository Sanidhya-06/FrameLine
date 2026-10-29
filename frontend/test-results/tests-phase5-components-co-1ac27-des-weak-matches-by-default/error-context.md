# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\phase5-components.spec.mjs >> country detail panel renders real fixture evidence and hides weak matches by default
- Location: tests\phase5-components.spec.mjs:9:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Analysis signals not yet available')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Analysis signals not yet available') with timeout 5000ms
  - waiting for getByText('Analysis signals not yet available')

```

```yaml
- main:
  - navigation "Main navigation":
    - link "FrameLine home":
      - /url: /
      - text: FrameLine
    - link "Home":
      - /url: /
    - link "Explore":
      - /url: "#search"
    - link "Insights":
      - /url: /methodology
    - link "Journal":
      - /url: /methodology#journal
    - link "About":
      - /url: /methodology#about
    - button "Explore Now":
      - text: Explore Now
      - img
  - region "How is the world framing this story?":
    - paragraph: INDEPENDENT GLOBAL COVERAGE
    - heading "How is the world framing this story?" [level=1]:
      - text: How is the world
      - emphasis: framing
      - text: this story?
    - paragraph: Trace how news sources across regions cover the same event.
    - img
    - textbox "Search a news topic":
      - /placeholder: Enter a news event, topic, or issue...
    - button "EXPLORE":
      - text: EXPLORE
      - img
    - text: QUICK BRIEF
    - button "01 Ukraine peace talks"
    - button "02 Gaza ceasefire negotiations"
    - button "03 US–China chip restrictions"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | const fixtureResult = {
  3  |   query: 'Ukraine peace talks', status: 'partial_results', cached: true, generated_at: '2026-10-29T05:15:00Z', feed_statuses: [], articles: [], country_groups: { USA: { iso_code: 'USA', region: 'North America', display_name: 'United States', article_count: 3, sources: ['BBC World'], coverage_status: 'covered', signals: [], limitations: [], articles: [
  4  |     { article_id: 'a1', title: 'Leaders discuss next phase of Ukraine peace talks', url: 'https://example.com/a1', publisher: 'BBC World', source_country: 'US', iso_code: 'USA', published_at: '2026-10-28T12:30:00Z', rss_summary: 'Officials met to discuss talks.', article_text: null, retrieved_at: '2026-10-29T05:00:00Z', extraction_status: 'partial', relevance_label: 'relevant' },
  5  |     { article_id: 'a2', title: 'Diplomats prepare for further discussions', url: 'https://example.com/a2', publisher: 'BBC World', source_country: 'US', iso_code: 'USA', published_at: null, rss_summary: 'Diplomats meet soon.', article_text: null, retrieved_at: '2026-10-29T05:00:00Z', extraction_status: 'unavailable', relevance_label: 'weak_match' },
  6  |   ] } },
  7  | };
  8  | 
  9  | test('country detail panel renders real fixture evidence and hides weak matches by default', async ({ page }) => {
  10 |   await page.goto('http://127.0.0.1:5173/');
  11 |   await page.evaluate((data) => {
  12 |     localStorage.setItem('frameline-app', JSON.stringify({ state: { query: data.query, result: data, job: null, jobId: null, error: null }, version: 0 }));
  13 |   }, fixtureResult);
  14 |   await page.goto('http://127.0.0.1:5173/country/USA');
> 15 |   await expect(page.getByText('Analysis signals not yet available')).toBeVisible();
     |                                                                      ^ Error: expect(locator).toBeVisible() failed
  16 |   await expect(page.getByText('Results describe the sources analyzed, not the country as a whole.')).toBeVisible();
  17 |   await expect(page.getByText('Leaders discuss next phase of Ukraine peace talks')).toBeVisible();
  18 |   await expect(page.getByText('Diplomats prepare for further discussions')).toHaveCount(0);
  19 |   await page.getByLabel('Show weak matches (1)').check();
  20 |   await expect(page.getByText('Diplomats prepare for further discussions')).toBeVisible();
  21 | });
  22 | 
  23 | test('map country-to-geography mapping covers alpha-2, alpha-3, and numeric identifiers', async ({ page }) => {
  24 |   await page.goto('http://127.0.0.1:5173/');
  25 |   await page.evaluate(async (groups) => {
  26 |     const source = await (await fetch('/src/components/CountryMap.tsx')).text();
  27 |     const nums = source.match(/const ISO_NUMERIC[^=]*= (\{[^;]+\});/s);
  28 |     const alpha = source.match(/const alpha2[^=]*= (\{[^;]+\});/s);
  29 |     const normalize = (value) => { const code = String(value ?? '').trim().toUpperCase(); if (/^\d{1,3}$/.test(code)) return code.padStart(3, '0'); return (new Function(`return ${nums[1]}`)())[code] || (new Function(`return ${alpha[1]}`)())[code] || code; };
  30 |     const candidates = ['840', 'USA', 'US'].map(normalize);
  31 |     const group = Object.values(groups).find((item) => candidates.includes(normalize(item.iso_code)));
  32 |     window.__mapMatch = group?.display_name;
  33 |   }, fixtureResult.country_groups);
  34 |   expect(await page.evaluate(() => window.__mapMatch)).toBe('United States');
  35 | });
  36 | 
```