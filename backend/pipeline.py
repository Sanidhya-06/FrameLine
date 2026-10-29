from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from time import monotonic
from datetime import datetime, timezone
from typing import Callable

import feedparser
import requests

from backend.article_extractor import extract_article
from backend.config import Settings, get_settings, load_feed_config
from backend.news_fetcher import canonicalize_url, normalize_title, parse_published_at
from backend.relevance import score_entries
from models.schemas import AnalyzeResponse, Article, CountryGroup, FeedStatus


def _fetch(feed: dict, settings: Settings) -> tuple[list[dict], FeedStatus]:
    start = monotonic()
    label = feed.get("publisher") or feed.get("url", "unknown feed")
    try:
        response = requests.get(feed["url"], headers={"User-Agent": settings.user_agent}, timeout=settings.feed_timeout)
        response.raise_for_status()
        parsed = feedparser.parse(response.content)
        if parsed.bozo and not parsed.entries:
            raise ValueError(str(parsed.bozo_exception))
        entries = []
        for e in parsed.entries:
            entries.append({"title": e.get("title", ""), "url": e.get("link", ""), "published": e.get("published", "") or e.get("updated", ""), "published_parsed": e.get("published_parsed") or e.get("updated_parsed"), "rss_summary": e.get("summary", "")})
        status = "empty" if not entries else "ok"
        return entries, FeedStatus(feed=label, url=feed["url"], status=status, error_text=None, entry_count=len(entries), response_time_ms=round((monotonic()-start)*1000, 2))
    except requests.Timeout as exc:
        state, error = "timeout", str(exc) or "Feed request timed out"
    except Exception as exc:
        state, error = "failed", str(exc)
    return [], FeedStatus(feed=label, url=feed.get("url", ""), status=state, error_text=error, entry_count=0, response_time_ms=round((monotonic()-start)*1000, 2))


def run_pipeline(query: str, *, settings: Settings | None = None, feeds_config: dict | None = None, progress: Callable[[str, dict], None] | None = None) -> AnalyzeResponse:
    settings = settings or get_settings()
    feeds_config = feeds_config if feeds_config is not None else load_feed_config(settings)
    feeds = [dict(f, _group=group) for group, items in feeds_config.items() for f in items if isinstance(f, dict) and f.get("enabled", True) and f.get("url")]
    def emit(stage: str, **values):
        if progress:
            progress(stage, values)
    emit("connecting_feeds", feeds_total=len(feeds), feeds_completed=0, articles_extracted=0, articles_total=0, feed_statuses=[])
    emit("retrieving_headlines", feeds_total=len(feeds), feeds_completed=0, articles_extracted=0, articles_total=0, feed_statuses=[])
    results = {}
    with ThreadPoolExecutor(max_workers=max(1, len(feeds))) as pool:
        futures = {pool.submit(_fetch, f, settings): f for f in feeds}
        for future in as_completed(futures):
            f = futures[future]
            try: results[id(f)] = future.result()
            except Exception as exc:
                results[id(f)] = ([], FeedStatus(feed=f.get("publisher", f["url"]), url=f["url"], status="failed", error_text=str(exc), entry_count=0, response_time_ms=0))
            emit("connecting_feeds", feeds_completed=len(results), feeds_total=len(feeds), feed_statuses=[status.model_dump(mode="json") for _, status in results.values()])
    emit("checking_relevance", feeds_completed=len(results), feeds_total=len(feeds), feed_statuses=[status.model_dump(mode="json") for _, status in results.values()])
    feed_statuses, articles, seen_urls, seen_titles = [], [], set(), set()
    relevance_method = "hybrid"
    for f in feeds:
        entries, fs = results[id(f)]; feed_statuses.append(fs)
        emit("checking_relevance", feeds_completed=len(feed_statuses), feeds_total=len(feeds), feed_statuses=[s.model_dump(mode="json") for s in feed_statuses])
        selected, feed_relevance_method = score_entries(entries, query)
        emit("extracting_text", articles_extracted=len(articles), articles_total=len(articles)+len(selected), feeds_completed=len(feed_statuses), feeds_total=len(feeds), feed_statuses=[s.model_dump(mode="json") for s in feed_statuses])
        if feed_relevance_method == "lexical_fallback":
            relevance_method = "lexical_fallback"
        count = 0
        for e in selected:
            url = e.get("url", ""); canonical = canonicalize_url(url) if url else ""
            title_key = normalize_title(e.get("title", ""))
            if (canonical and canonical in seen_urls) or (title_key and title_key in seen_titles): continue
            if canonical: seen_urls.add(canonical)
            if title_key: seen_titles.add(title_key)
            retrieved = e.get("published_parsed")
            extraction = {"text": None, "extraction_status": "unavailable"}
            if f.get("fulltext_allowed") is True and count < 5 and url:
                emit("extracting_text", articles_extracted=len(articles), articles_total=len(articles)+1, feeds_completed=len(feed_statuses), feeds_total=len(feeds), feed_statuses=[s.model_dump(mode="json") for s in feed_statuses])
                try: extraction = extract_article(url, feed_config=f, rss_summary=e.get("rss_summary", ""), published=e.get("published", ""), settings=settings)
                except Exception as exc: extraction = {"text": None, "extraction_status": "unavailable", "error": str(exc)}
            articles.append(Article(article_id=canonical or title_key, title=e.get("title", ""), url=url, publisher=f.get("publisher", "Unknown"), source_country=f.get("country", ""), iso_code=f.get("iso_code", ""), published_at=parse_published_at(e.get("published", ""), retrieved), published_raw=e.get("published", ""), rss_summary=e.get("rss_summary", ""), article_text=extraction.get("text"), retrieved_at=datetime.now(timezone.utc), extraction_status=extraction.get("extraction_status", "unavailable"), language=f.get("language", ""), matched_terms=e["matched_terms"], relevance_score=e["relevance_score"], relevance_components=e["relevance_components"], relevance_method=e["relevance_method"], relevance_label=e["relevance_label"]))
            if f.get("fulltext_allowed") is True and url:
                count += 1
            emit("extracting_text", articles_extracted=len(articles), articles_total=len(articles), feeds_completed=len(feed_statuses), feeds_total=len(feeds), feed_statuses=[s.model_dump(mode="json") for s in feed_statuses])
    groups = {}
    for article in articles:
        if not article.iso_code or article.relevance_label == "weak_match": continue
        group = groups.setdefault(article.iso_code, {"iso_code": article.iso_code, "region": next((f["_group"] for f in feeds if f.get("iso_code") == article.iso_code), ""), "display_name": article.source_country, "articles": [], "sources": []})
        group["articles"].append(article)
        if article.publisher not in group["sources"]: group["sources"].append(article.publisher)
    country_groups = {code: CountryGroup(**g, article_count=len(g["articles"]), coverage_status="insufficient coverage" if len(g["articles"]) < 3 else "available") for code, g in groups.items()}
    successes = sum(s.status in {"ok", "empty"} for s in feed_statuses)
    status = "no_results" if not articles else ("partial" if successes < len(feed_statuses) else "ok")
    emit("preparing_map", articles_extracted=len(articles), articles_total=len(articles), feeds_completed=len(feed_statuses), feeds_total=len(feeds), feed_statuses=[s.model_dump(mode="json") for s in feed_statuses])
    return AnalyzeResponse(query=query, status=status, explanation="No relevant entries appeared in the current RSS feed windows. RSS feeds expose only a limited recent set of items, so this does not mean the topic has no coverage." if not articles else None, methodology_version=settings.methodology_version, relevance_method=relevance_method, articles=articles, country_groups=country_groups, feed_statuses=feed_statuses, generated_at=datetime.now(timezone.utc))
