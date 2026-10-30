import type { Article, CountryGroup } from './types';

export function coveredGroups(groups: Record<string, CountryGroup>): CountryGroup[] {
  return Object.values(groups).filter((group) => group.articles.length > 0);
}

export function dateRange(articles: Article[]): string {
  const dates = articles.map((article) => article.published_at).filter((date): date is string => Boolean(date)).sort();
  if (!dates.length) return 'Publication dates unavailable';
  const format = (date: string) => new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  return dates[0] === dates[dates.length - 1] ? format(dates[0]) : `${format(dates[0])} – ${format(dates[dates.length - 1])}`;
}

export function extractionBreakdown(articles: Article[]): Record<string, number> {
  return articles.reduce<Record<string, number>>((counts, article) => {
    const status = article.extraction_status || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
}

export function rssOnlyCount(articles: Article[]): number {
  return articles.filter((article) => !article.article_text).length;
}

export function queryTerms(query: string): string[] {
  return query.toLowerCase().split(/\W+/).filter((term) => term.length > 2);
}

export function sharedQueryHeadlines(left: CountryGroup, right: CountryGroup, query: string): Array<{ left: Article; right: Article; terms: string[]; supported: boolean }> {
  const terms = queryTerms(query);
  const candidates = (article: Article) => {
    const matched = article.matched_terms.map((term) => term.toLowerCase()).filter((term) => terms.includes(term));
    return matched.length ? matched : terms.filter((term) => `${article.title} ${article.rss_summary}`.toLowerCase().includes(term));
  };
  const pairs: Array<{ left: Article; right: Article; terms: string[]; supported: boolean }> = [];
  left.articles.forEach((leftArticle) => right.articles.forEach((rightArticle) => {
    const shared = candidates(leftArticle).filter((term) => candidates(rightArticle).includes(term));
    if (shared.length) pairs.push({ left: leftArticle, right: rightArticle, terms: shared, supported: (leftArticle.relevance_score ?? 0) >= .7 && (rightArticle.relevance_score ?? 0) >= .7 });
  }));
  return pairs.slice(0, 6);
}
