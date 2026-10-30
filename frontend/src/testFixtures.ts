import type { AnalyzeResponse } from './types';

export const fixtureResult: AnalyzeResponse = {
  query: 'Ukraine peace talks', status: 'partial_results', cached: true, generated_at: '2026-10-29T05:15:00Z',
  development_only: true, explanation: null, methodology_version: 'phase5', relevance_method: 'hybrid', signals: [],
  translation_stats: { status: 'not_requested', elapsed_seconds: 0, model_load_seconds: 0, articles_total: 0, articles_translated: 0, articles_failed: 0, text_segments: 0, cache_hits: 0, fallback_segments: 0, backend_counts: {}, language_counts: {} },
  feed_statuses: [
    { feed: 'BBC World', url: 'https://bbc.example/rss', status: 'ok', error_text: null, entry_count: 8, response_time_ms: 210 },
    { feed: 'Global News Desk', url: 'https://failure.example/rss', status: 'failed', error_text: 'Connection timed out', entry_count: 0, response_time_ms: 15000 },
  ],
  articles: [], country_groups: {
    USA: { iso_code: 'USA', region: 'North America', display_name: 'United States', article_count: 3, sources: ['BBC World', 'The Guardian'], coverage_status: 'covered', signals: [], limitations: [], articles: [
      { article_id: 'article-1', title: 'Leaders discuss next phase of Ukraine peace talks', url: 'https://example.com/story', publisher: 'BBC World', source_country: 'United States', iso_code: 'USA', published_at: '2026-10-28T12:30:00Z', published_raw: null, rss_summary: 'Officials met to discuss a proposed framework for peace talks.', article_text: null, retrieved_at: '2026-10-29T05:00:00Z', extraction_status: 'partial', language: 'en', translation_status: 'not_required', matched_terms: ['Ukraine'], relevance_score: .83, relevance_components: {}, relevance_method: 'hybrid', relevance_label: 'relevant' },
      { article_id: 'article-2', title: 'Diplomats prepare for further discussions', url: 'https://example.com/story-2', publisher: 'The Guardian', source_country: 'United States', iso_code: 'USA', published_at: null, published_raw: null, rss_summary: 'Diplomats are expected to meet later this week.', article_text: null, retrieved_at: '2026-10-29T05:00:00Z', extraction_status: 'unavailable', language: 'en', translation_status: 'not_required', matched_terms: [], relevance_score: .51, relevance_components: {}, relevance_method: 'hybrid', relevance_label: 'weak_match' },
    ] },
  },
};
