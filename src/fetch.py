# src/fetch.py
import feedparser
import requests

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

def fetch_from_feed(feed_url: str, limit: int = 10):
    """Fetch entries from an RSS feed with proper error handling."""
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
            "title": entry.get("title", ""),
            "url": entry.get("link", ""),
            "published": entry.get("published", ""),
            "summary": entry.get("summary", ""),
            "source": feed.feed.get("title", feed_url)
        })
    return results


def fetch_all_feeds(feeds_dict: dict, limit_per_feed: int = 5):
    """Fetch from all countries/feeds. Returns dict: country -> list of articles."""
    all_articles = {}
    for country, urls in feeds_dict.items():
        country_articles = []
        for url in urls:
            articles = fetch_from_feed(url, limit=limit_per_feed)
            country_articles.extend(articles)
        all_articles[country] = country_articles
        print(f"[{country}] Fetched {len(country_articles)} articles")
    return all_articles