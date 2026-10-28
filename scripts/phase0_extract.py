"""
Phase 0 — Extraction sampling (Step 2), final run.
Only fetches India and Middle East (USA/UK already partially done).
Merges with existing rows from prior partial run and writes final CSV + fixtures.
"""

import csv
import sys
import re
from pathlib import Path
from collections import Counter
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import requests
import feedparser
from backend.article_extractor import extract_article
from backend.config import get_settings

EXTRACT_REPORT = ROOT / "docs" / "extraction_report.csv"
FIXTURES_DIR   = ROOT / "tests" / "fixtures"
FIXTURES_DIR.mkdir(parents=True, exist_ok=True)

HEADERS_UA = {"User-Agent": get_settings().user_agent}

SAMPLE_PER_FEED = 5

# Only the two regions not yet processed
NEW_FEEDS = {
    "India":       "https://www.thehindu.com/news/feeder/default.rss",
    "Middle East": "https://www.aljazeera.com/xml/rss/all.xml",
}

# Already-collected rows from prior run output (USA + UK partial results)
PRIOR_ROWS = [
    # USA - CNN
    {"url": "https://www.cnn.com/business/live-news/stock-market-bank-earnings/index.html",
     "publisher":"USA","country":"USA","status":"successful","chars_extracted":2090,
     "metadata_found":"title|author|date","failure_reason":""},
    {"url": "https://www.cnn.com/2023/04/13/success/tax-filing-tips/index.html",
     "publisher":"USA","country":"USA","status":"unavailable","chars_extracted":0,
     "metadata_found":"","failure_reason":"download_timeout"},
    {"url": "https://www.cnn.com/2023/04/14/economy/march-retail-sales/index.html",
     "publisher":"USA","country":"USA","status":"unavailable","chars_extracted":0,
     "metadata_found":"","failure_reason":"connection_error"},
    {"url": "https://www.cnn.com/2023/04/14/media/fox-news-dominion-hnk-intl/index.html",
     "publisher":"USA","country":"USA","status":"unavailable","chars_extracted":0,
     "metadata_found":"","failure_reason":"connection_error"},
    {"url": "https://www.cnn.com/2023/04/13/business/silicon-valley-bank-entrepreneurs-of-color-reaj/in",
     "publisher":"USA","country":"USA","status":"unavailable","chars_extracted":0,
     "metadata_found":"","failure_reason":"connection_error"},
    # Russia - TASS returned 0 entries on re-fetch (intermittent); mark as feed error
    {"url": "https://tass.com/rss/v2.xml",
     "publisher":"Russia","country":"Russia","status":"unavailable","chars_extracted":0,
     "metadata_found":"","failure_reason":"feed_returned_0_entries_on_recheck"},
    # UK - BBC
    {"url": "https://www.bbc.co.uk/news/articles/ckly0xpxp243o",
     "publisher":"UK","country":"UK","status":"unavailable","chars_extracted":0,
     "metadata_found":"","failure_reason":"connection_error"},
    {"url": "https://www.bbc.co.uk/news/articles/c6vgj813mlelo",
     "publisher":"UK","country":"UK","status":"unavailable","chars_extracted":0,
     "metadata_found":"","failure_reason":"connection_error"},
    {"url": "https://www.bbc.co.uk/news/articles/ck20wjnv3w0jo",
     "publisher":"UK","country":"UK","status":"unavailable","chars_extracted":0,
     "metadata_found":"","failure_reason":"download_timeout"},
    {"url": "https://www.bbc.co.uk/news/articles/c6x2qgyqr79wo",
     "publisher":"UK","country":"UK","status":"unavailable","chars_extracted":0,
     "metadata_found":"","failure_reason":"connection_error"},
    {"url": "https://www.bbc.co.uk/news/articles/cv62yg0erp8zo",
     "publisher":"UK","country":"UK","status":"successful","chars_extracted":6825,
     "metadata_found":"title|author|date","failure_reason":""},
]


def safe_fixture_name(country: str, url: str) -> str:
    """Strip query strings and Windows-invalid chars from URL for use as filename."""
    parsed = urlparse(url)
    # Use only scheme+host+path, no query or fragment
    path_part = (parsed.netloc + parsed.path) \
        .replace("/", "_").replace(":", "_").replace("\\", "_")
    # Strip any remaining invalid Windows filename chars
    path_part = re.sub(r'[<>:"/\\|?*]', '_', path_part)
    country_safe = re.sub(r'[^a-z0-9_]', '_', country.lower())
    return f"extract_{country_safe}_{path_part[:50]}.txt"


def fetch_entries(url: str):
    try:
        resp = requests.get(url, headers=HEADERS_UA, timeout=15)
        if resp.status_code != 200:
            return []
        feed = feedparser.parse(resp.content)
        return [] if (feed.bozo and not feed.entries) else feed.entries
    except Exception:
        return []


rows = list(PRIOR_ROWS)

print("\n== Phase 0 Step 2: Extraction — India + Middle East ==\n")

for country, feed_url in NEW_FEEDS.items():
    print(f"[{country}] {feed_url}")
    entries = fetch_entries(feed_url)
    print(f"  -> {len(entries)} entries")

    sampled, seen = [], set()
    for e in entries:
        link = e.get("link", "").strip()
        if link and link not in seen:
            seen.add(link)
            sampled.append(link)
        if len(sampled) >= SAMPLE_PER_FEED:
            break

    fixture_saved = False
    for url in sampled:
        print(f"  -> {url[:90]}", flush=True)
        result = extract_article(url)
        status = result["extraction_status"]
        text   = result.get("text", "") or ""
        chars  = len(text)

        meta = []
        if result.get("title"):  meta.append("title")
        if result.get("author"): meta.append("author")
        if result.get("date"):   meta.append("date")

        rows.append({
            "url":             url,
            "publisher":       country,
            "country":         country,
            "status":          status,
            "chars_extracted": chars,
            "metadata_found":  "|".join(meta),
            "failure_reason":  str(result.get("error") or ""),
        })
        print(f"     {status}  chars={chars}  meta={meta}  err={result.get('error') or '-'}")

        if status == "successful" and not fixture_saved:
            fname = safe_fixture_name(country, url)
            fp = FIXTURES_DIR / fname
            if not fp.exists():
                try:
                    fp.write_text(text[:3000], encoding="utf-8")
                    print(f"     Fixture saved: {fp.name}")
                except OSError as exc:
                    print(f"     [WARN] Could not save fixture: {exc}")
            fixture_saved = True

# Write final merged CSV
cols = ["url","publisher","country","status","chars_extracted","metadata_found","failure_reason"]
with open(EXTRACT_REPORT, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    w.writerows(rows)

total  = len(rows)
counts = Counter(r["status"] for r in rows)
print(f"\n== Done. {total} articles total ==")
print(f"   successful={counts['successful']}  partial={counts['partial']}  unavailable={counts['unavailable']}")
print(f"   Report: {EXTRACT_REPORT}")

by_pub = {}
for r in rows:
    by_pub.setdefault(r["publisher"], []).append(r["status"])
print("\nPer-publisher:")
for pub, statuses in sorted(by_pub.items()):
    ok = sum(1 for s in statuses if s == "successful")
    print(f"  {pub}: {ok}/{len(statuses)} successful")
