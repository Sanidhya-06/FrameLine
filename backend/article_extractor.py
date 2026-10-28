from __future__ import annotations

from datetime import datetime, timezone

import requests
import trafilatura

from backend.config import Settings, get_settings
from backend.news_fetcher import parse_published_at


def extract_article(
    url: str,
    *,
    feed_config: dict | None = None,
    rss_summary: str = "",
    published: str = "",
    settings: Settings | None = None,
) -> dict:
    config = feed_config or {}
    base = {
        "url": url,
        "title": "",
        "author": "",
        "date": "",
        "text": "",
        "error": None,
        "extraction_status": "unavailable",
        "rss_summary": rss_summary,
        "published_raw": published,
        "published_at": parse_published_at(published),
        "retrieved_at": datetime.now(timezone.utc),
    }
    if config.get("fulltext_allowed") is False:
        base["extraction_status"] = "restricted"
        base["error"] = "fulltext_restricted"
        return base

    active_settings = settings or get_settings()
    try:
        response = requests.get(
            url,
            headers={"User-Agent": active_settings.user_agent},
            timeout=active_settings.extraction_timeout,
        )
        if response.status_code != 200:
            base["error"] = f"http_{response.status_code}"
            return base
        html = response.text
    except requests.exceptions.Timeout:
        base["error"] = "download_timeout"
        return base
    except requests.exceptions.ConnectionError:
        base["error"] = "connection_error"
        return base
    except requests.RequestException as exc:
        base["error"] = f"download_error:{exc}"
        return base

    try:
        text = trafilatura.extract(
            html, include_comments=False, include_tables=False, favor_precision=True
        )
    except Exception as exc:
        base["error"] = f"extraction_error:{exc}"
        return base
    if not text:
        base["error"] = "extraction_failed"
        return base

    try:
        metadata = trafilatura.extract_metadata(html)
    except Exception:
        metadata = None
    base.update(
        {
            "text": text,
            "title": getattr(metadata, "title", "") or "",
            "author": getattr(metadata, "author", "") or "",
            "date": getattr(metadata, "date", "") or "",
            "error": None,
            "extraction_status": "successful" if len(text) >= 200 else "partial",
        }
    )
    if base["published_at"] is None:
        base["published_raw"] = base["date"] or published
        base["published_at"] = parse_published_at(base["published_raw"])
    return base
