export interface Article {
  article_id: string; title: string; url: string; publisher: string; source_country: string;
  iso_code: string; published_at: string | null; published_raw: string | null;
  rss_summary: string; article_text: string | null; retrieved_at: string;
  extraction_status: string; language: string; translation_status: string;
  translated_title?: string | null; translated_summary?: string | null; translation_backend?: string | null;
  matched_terms: string[]; relevance_score: number | null;
  relevance_components: Record<string, number>;
  relevance_method: 'hybrid' | 'lexical_fallback'; relevance_label: 'relevant' | 'weak_match';
}
export interface FeedStatus {
  feed: string; url: string; status: string; error_text: string | null;
  entry_count: number; response_time_ms: number;
}
export interface Signal {
  signal_name: string; status: string; value: unknown | null; label: string | null;
  method: string; confidence: number | null; target: string | null;
  evidence: string[]; limitations: string[];
}
export interface CountryGroup {
  iso_code: string; region: string; display_name: string; article_count: number;
  sources: string[]; coverage_status: string; articles: Article[];
  signals: Signal[]; limitations: string[];
}
export interface AnalyzeResponse {
  query: string; status: string; articles: Article[]; country_groups: Record<string, CountryGroup>;
  signals: Signal[]; methodology_version: string; relevance_method: 'hybrid' | 'lexical_fallback';
  development_only: boolean; explanation: string | null; feed_statuses: FeedStatus[];
  cached: boolean; generated_at: string | null;
  translation_stats: TranslationStats;
}
export interface TranslationStats {
  status: string; elapsed_seconds: number; model_load_seconds: number; articles_total: number;
  articles_translated: number; articles_failed: number; text_segments: number; cache_hits: number;
  fallback_segments: number; backend_counts: Record<string, number>; language_counts: Record<string, number>;
}
export type JobStage = 'connecting_feeds' | 'retrieving_headlines' | 'checking_relevance' | 'extracting_text' | 'translating_text' | 'preparing_map' | 'done' | 'failed';
export interface AnalyzeJob {
  job_id: string; status: 'running' | 'finished' | 'failed'; stage: JobStage;
  feeds_completed: number; feeds_total: number; articles_extracted: number; articles_total: number;
  feed_statuses: FeedStatus[]; result: AnalyzeResponse | null; error: string | null;
  translations_completed?: number; translations_total?: number;
}
