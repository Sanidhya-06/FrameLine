# src/fetch.py
import feedparser
import requests

# SRD FR-2: Use a descriptive User-Agent that identifies the project.
# A spoofed browser UA is NOT compliant; FrameLine-identifying string is required.
HEADERS = {
    "User-Agent": (
        "FrameLine/1.0 (academic news-framing research prototype; "
        "https://github.com/Sanidhya-06/FrameLine) "
        "python-requests/2.x feedparser/6.x"
    )
}


def fetch_from_feed(feed_url: str, limit: int = 10):
    """Fetch entries from an RSS feed with proper error handling.

    Returns a list of dicts with keys:
        title, url, published, summary, source
    Returns [] on any error (timeout, HTTP error, parse error).
    One feed failure never propagates to the caller (SRD FR-2).
    """
    try:
        response = requests.get(feed_url, headers=HEADERS, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"[FETCH ERROR] {feed_url}: {e}")
        return []

    feed = feedparser.parse(response.content)

    if feed.bozo and not feed.entries:
        print(f"[PARSE ERROR] {feed_url}: {feed.bozo_exception}")
        return []

    results = []
    for entry in feed.entries[:limit]:
        results.append({
            "title":     entry.get("title", ""),
            "url":       entry.get("link", ""),
            "published": entry.get("published", ""),
            "summary":   entry.get("summary", ""),
            "source":    feed.feed.get("title", feed_url),
        })
    return results


def fetch_all_feeds(feeds_config: dict, limit_per_feed: int = 5):
    """Fetch from all enabled feeds in the config.

    Accepts EITHER the old format  {country: [url, ...]}
    OR the new extended format     {country: [{url, enabled, publisher, ...}, ...]}

    Returns dict: country -> list of articles.
    Skipped/disabled feeds are logged but do not raise.
    """
    all_articles = {}
    for country, feed_list in feeds_config.items():
        country_articles = []
        for feed_entry in feed_list:
            # Support both legacy plain-string URLs and new structured entries
            if isinstance(feed_entry, str):
                url = feed_entry
                enabled = True
            else:
                url = feed_entry.get("url", "")
                enabled = feed_entry.get("enabled", True)
                if not enabled:
                    reason = feed_entry.get("disabled_reason", "no reason given")
                    print(f"[SKIP] {country} / {url}: disabled — {reason}")
                    continue

            if not url:
                print(f"[SKIP] {country}: empty URL in config")
                continue

            articles = fetch_from_feed(url, limit=limit_per_feed)
            country_articles.extend(articles)

        all_articles[country] = country_articles
        print(f"[{country}] Fetched {len(country_articles)} articles")
    return all_articles