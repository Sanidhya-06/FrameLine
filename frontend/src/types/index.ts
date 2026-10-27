// ============================================
// FRAMELINE TYPE DEFINITIONS
// ============================================

export type AnalysisMode = 'framing' | 'time-rewind';

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

export type Stance =
  | 'critical'
  | 'supportive'
  | 'neutral'
  | 'alarmist'
  | 'skeptical'
  | 'diplomatic';

export interface MockArticle {
  id: string;
  headline: string;
  source: string;
  country: string;
  date: string;
  summary: string;
  url?: string;
}

export interface FramingSignal {
  label: string;
  value: number; // 0-100
  color: 'cyan' | 'blue' | 'magenta';
}

export interface CountryCoverage {
  /** ISO 3166-1 alpha-3 code used by react-simple-maps */
  code: string;
  /** ISO 3166-1 alpha-2 code for flag emoji */
  code2: string;
  name: string;
  articleCount: number;
  sources: string[];
  framingSummary: string;
  stance: Stance;
  sentiment: Sentiment;
  /** Illustrative framing deviation 0-100 — DEMO DATA ONLY */
  illustrativeFramingDeviation: number;
  articles: MockArticle[];
  framingSignals: FramingSignal[];
}

export interface SearchState {
  query: string;
  mode: AnalysisMode;
  selectedCountryCode: string | null;
}
