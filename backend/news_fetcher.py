from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import feedparser
import requests

from backend.config import Settings, get_settings

LOGGER = logging.getLogger(__name__)


def canonicalize_url(url: str) -> str:
    parts = urlsplit(url.strip())
    query = [
        (key, value)
        for key, value in parse_qsl(parts.query, keep_blank_values=True)
        if not key.lower().startswith(("utm_", "fbclid", "gclid"))
    ]
    return urlunsplit(
        (parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip("/"), urlencode(query), "")
    )


def normalize_title(title: str) -> str:
    return re.sub(r"\s+", " ", title.casefold()).strip()


def parse_published_at(raw: str, parsed: Any = None) -> datetime | None:
    if parsed:
        try:
            return datetime(*parsed[:6], tzinfo=timezone.utc)
        except (TypeError, ValueError, OverflowError):
            pass
    if raw:
        try:
            value = parsedate_to_datetime(raw)
            return value.astimezone(timezone.utc) if value.tzinfo else value.replace(
                tzinfo=timezone.utc
            )
        except (TypeError, ValueError, OverflowError):
            return None
    return None


def fetch_from_feed(
    feed_url: str,
    limit: int = 10,
    *,
    feed_config: dict | None = None,
    settings: Settings | None = None,
) -> list[dict]:
    active_settings = settings or get_settings()
    try:
        response = requests.get(
            feed_url, headers={"User-Agent": active_settings.user_agent},
            timeout=active_settings.feed_timeout
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        LOGGER.warning("Feed fetch failed for %s: %s", feed_url, exc)
        return []

    feed = feedparser.parse(response.content)
    if feed.bozo and not feed.entries:
        LOGGER.warning("Feed parse failed for %s: %s", feed_url, feed.bozo_exception)
        return []

    publisher = (feed_config or {}).get("publisher") or feed.feed.get("title", feed_url)
    source_country = (feed_config or {}).get("country") or ""
    iso_code = (feed_config or {}).get("iso_code") or ""
    language = (feed_config or {}).get("language") or ""
    results: list[dict] = []
    seen_urls: set[str] = set()
    seen_titles: set[str] = set()
    for entry in feed.entries:
        title = entry.get("title", "") or ""
        url = entry.get("link", "") or ""
        canonical_url = canonicalize_url(url) if url else ""
        normalized = normalize_title(title) if title else ""
        if (canonical_url and canonical_url in seen_urls) or (
            normalized and normalized in seen_titles
        ):
            continue
        if canonical_url:
            seen_urls.add(canonical_url)
        if normalized:
            seen_titles.add(normalized)
        raw_published = entry.get("published", "") or entry.get("updated", "") or ""
        results.append(
            {
                "article_id": canonical_url or normalized,
                "title": title,
                "url": url,
                "canonical_url": canonical_url,
                "publisher": publisher,
                "source": publisher,
                "source_country": source_country,
                "iso_code": iso_code,
                "language": language,
                "published": raw_published,
                "published_raw": raw_published,
                "published_at": parse_published_at(
                    raw_published,
                    entry.get("published_parsed") or entry.get("updated_parsed"),
                ),
                "summary": entry.get("summary", "") or "",
                "rss_summary": entry.get("summary", "") or "",
                "retrieved_at": datetime.now(timezone.utc),
            }
        )
        if len(results) >= limit:
            break
    return results


def fetch_all_feeds(
    feeds_config: dict,
    limit_per_feed: int = 5,
    *,
    settings: Settings | None = None,
) -> dict[str, list[dict]]:
    all_articles: dict[str, list[dict]] = {}
    seen_urls: set[str] = set()
    seen_titles: set[str] = set()
    for region, feed_list in feeds_config.items():
        country_articles: list[dict] = []
        for feed_entry in feed_list:
            if isinstance(feed_entry, str):
                feed_entry = {"url": feed_entry, "enabled": True}
            if not feed_entry.get("enabled", True):
                continue
            url = feed_entry.get("url", "")
            if not url:
                LOGGER.warning("Skipping empty feed URL in %s", region)
                continue
            for article in fetch_from_feed(
                url, limit=limit_per_feed, feed_config=feed_entry, settings=settings
            ):
                if article["canonical_url"] in seen_urls or (
                    article["title"] and normalize_title(article["title"]) in seen_titles
                ):
                    continue
                seen_urls.add(article["canonical_url"])
                if article["title"]:
                    seen_titles.add(normalize_title(article["title"]))
                country_articles.append(article)
        all_articles[region] = country_articles
    return all_articles
