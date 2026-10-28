"""test_run.py — debug script for manual end-to-end inspection.

B4 fix: wrapped in try/except so one crash never aborts the whole run.
Uses data/rss_feeds.json (canonical config) instead of hardcoded URLs.
"""
import json
from pathlib import Path
from backend.article_extractor import extract_article
from backend.news_fetcher import fetch_all_feeds

# Use the canonical feed config, not hardcoded URLs
FEEDS_PATH = Path(__file__).parent / "data" / "rss_feeds.json"
with open(FEEDS_PATH, encoding="utf-8") as f:
    raw_config = json.load(f)

# Build a simple {country: [url]} dict of enabled feeds for fetch_all_feeds
try:
    articles_by_country = fetch_all_feeds(raw_config, limit_per_feed=3)
except Exception as exc:
    print(f"[FATAL] fetch_all_feeds crashed: {exc}")
    articles_by_country = {}

for country, articles in articles_by_country.items():
    if not articles:
        print(f"\n--- {country}: NO ARTICLES ---")
        continue

    first = articles[0]
    print(f"\n--- {country}: {first['title']} ---")
    print(f"URL: {first['url']}")

    try:
        extracted = extract_article(first["url"])
    except Exception as exc:
        print(f"  [ERROR] extract_article raised: {exc}")
        continue

    # Print the ENTIRE returned dict so we can see its shape
    print(f"\n🔍 DEBUG — extracted keys: {list(extracted.keys())}")
    print(f"🔍 DEBUG — extracted dict: {extracted}\n")

    if extracted.get("error"):
        print(f"  ❌ Extraction failed: {extracted['error']}")
    else:
        text = extracted.get("text", "")
        print(f"  ✅ Extracted {len(text)} characters")
        print(f"  Preview: {text[:200]}...")