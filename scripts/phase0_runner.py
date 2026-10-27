"""
Phase 0 audit runner for FrameLine.
Tasks:
  1. Fetch all configured feeds -> docs/feed_report.csv
  2. Sample ~5 articles per working feed -> docs/extraction_report.csv
  3. Save raw feed XML and extraction text -> tests/fixtures/
  4. Exit code 0 always (one failure must not stop the run).
"""

import csv
import json
import sys
import time
from pathlib import Path
from collections import Counter

# path setup
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import requests
import feedparser

try:
    from src.extract import extract_article
    SRC_EXTRACT_OK = True
except Exception as e:
    print(f"[WARN] Could not import src.extract: {e}")
    SRC_EXTRACT_OK = False

# configuration
FEEDS_PATH = ROOT / "data" / "rss_feeds.json"
FEED_REPORT_PATH = ROOT / "docs" / "feed_report.csv"
EXTRACT_REPORT_PATH = ROOT / "docs" / "extraction_report.csv"
FIXTURES_DIR = ROOT / "tests" / "fixtures"
FIXTURES_DIR.mkdir(parents=True, exist_ok=True)

DESCRIPTIVE_UA = (
    "FrameLine/1.0 (academic news-framing research prototype; "
    "contact: frameline-research@example.com) "
    "requests/2.x feedparser/6.x"
)
HEADERS_UA = {"User-Agent": DESCRIPTIVE_UA}

FETCH_TIMEOUT = 15
MIN_TEXT_CHARS = 200
SAMPLE_PER_FEED = 5


def safe_fetch_feed(name, url):
    """Returns (status_str, entries, elapsed_s, raw_bytes). Never raises."""
    t0 = time.monotonic()
    try:
        resp = requests.get(url, headers=HEADERS_UA, timeout=FETCH_TIMEOUT)
        elapsed = round(time.monotonic() - t0, 2)
        if resp.status_code != 200:
            return str(resp.status_code), [], elapsed, b""
        raw = resp.content
        feed = feedparser.parse(raw)
        if feed.bozo and not feed.entries:
            return f"parse_error:{type(feed.bozo_exception).__name__}", [], elapsed, raw
        return "200", feed.entries, elapsed, raw
    except requests.exceptions.Timeout:
        return "timeout", [], round(time.monotonic() - t0, 2), b""
    except requests.exceptions.ConnectionError as exc:
        short = str(exc)[:80]
        return f"connection_error", [], round(time.monotonic() - t0, 2), b""
    except Exception as exc:
        return f"error:{exc}", [], round(time.monotonic() - t0, 2), b""


def entry_field_shares(entries):
    if not entries:
        return 0.0, 0.0, 0.0, 0.0
    n = len(entries)
    t = sum(1 for e in entries if e.get("title", "").strip()) / n
    u = sum(1 for e in entries if e.get("link",  "").strip()) / n
    s = sum(1 for e in entries if e.get("summary", "").strip()) / n
    d = sum(1 for e in entries if e.get("published_parsed") or e.get("updated_parsed")) / n
    return t, u, s, d


def determine_extraction_status(result):
    text = result.get("text", "") or ""
    if result.get("error") and not text:
        return "unavailable"
    if len(text) >= MIN_TEXT_CHARS:
        return "successful"
    if text:
        return "partial"
    return "unavailable"


def safe_extract(url):
    """Call extract_article and never raise."""
    if SRC_EXTRACT_OK:
        try:
            return extract_article(url)
        except Exception as exc:
            return {"url": url, "error": str(exc), "text": "", "title": ""}
    try:
        import trafilatura
        downloaded = trafilatura.fetch_url(url)
        if downloaded is None:
            return {"url": url, "error": "download_failed", "text": "", "title": ""}
        text = trafilatura.extract(
            downloaded, include_comments=False, include_tables=False, favor_precision=True
        )
        if not text:
            return {"url": url, "error": "extraction_failed", "text": "", "title": ""}
        meta = trafilatura.extract_metadata(downloaded)
        return {
            "url": url,
            "title": meta.title if meta else "",
            "author": meta.author if meta else "",
            "date": meta.date if meta else "",
            "text": text,
            "error": None,
        }
    except Exception as exc:
        return {"url": url, "error": str(exc), "text": "", "title": ""}


def safe_fixture_name(url, prefix="", suffix=".xml", maxlen=80):
    cleaned = url.replace("https://", "").replace("http://", "").replace("/", "_").replace(":", "_")
    return f"{prefix}{cleaned[:maxlen]}{suffix}"


# MAIN
print("\n" + "=" * 55)
print("  FrameLine Phase 0 Audit Runner")
print("=" * 55 + "\n")

with open(FEEDS_PATH, encoding="utf-8") as f:
    feeds_config = json.load(f)

total_urls = sum(len(v) for v in feeds_config.values())
print(f"Loaded {total_urls} feed URLs across {len(feeds_config)} regions\n")

# -- STEP 1: fetch feeds
print("-- STEP 1: Fetching all feeds " + "-" * 26)
feed_rows = []
working_feeds = []

for country, urls in feeds_config.items():
    for url in urls:
        print(f"  [{country}] {url}")
        status, entries, elapsed, raw_bytes = safe_fetch_feed(country, url)
        n = len(entries)
        t_title, t_url, t_summary, t_date = entry_field_shares(entries)

        feed_rows.append({
            "name": country,
            "country": country,
            "url": url,
            "http_status_or_error": status,
            "entries_returned": n,
            "pct_with_title":   f"{t_title:.2%}",
            "pct_with_url":     f"{t_url:.2%}",
            "pct_with_summary": f"{t_summary:.2%}",
            "pct_with_date":    f"{t_date:.2%}",
            "response_time_s":  elapsed,
        })

        ok = (status == "200") and (n > 0)
        print(f"     {'OK' if ok else 'FAIL'} status={status}  entries={n}  time={elapsed}s")

        if raw_bytes:
            fname = safe_fixture_name(url, prefix="feed_")
            (FIXTURES_DIR / fname).write_bytes(raw_bytes)
            print(f"     Fixture saved: {fname}")

        if ok:
            working_feeds.append((country, country, url, entries))

FEED_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
with open(FEED_REPORT_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(feed_rows[0].keys()))
    writer.writeheader()
    writer.writerows(feed_rows)

print(f"\nFeed report written: {FEED_REPORT_PATH}")
print(f"Working feeds: {len(working_feeds)} / {len(feed_rows)}\n")

# -- STEP 2: extract article samples
print("-- STEP 2: Extracting article samples " + "-" * 17)
extraction_rows = []

for (publisher, country, feed_url, entries) in working_feeds:
    sampled = []
    seen = set()
    for entry in entries:
        link = entry.get("link", "").strip()
        if link and link not in seen:
            seen.add(link)
            sampled.append((entry.get("title", ""), link))
        if len(sampled) >= SAMPLE_PER_FEED:
            break

    print(f"\n  [{country}] {len(sampled)} articles to extract")
    for title, url in sampled:
        print(f"    -> {url[:90]}")
        result = safe_extract(url)
        status = determine_extraction_status(result)
        text = result.get("text", "") or ""
        chars = len(text)

        meta_found = []
        if result.get("title"):  meta_found.append("title")
        if result.get("author"): meta_found.append("author")
        if result.get("date"):   meta_found.append("date")

        failure_reason = result.get("error") or ""
        extraction_rows.append({
            "url": url,
            "publisher": publisher,
            "country": country,
            "status": status,
            "chars_extracted": chars,
            "metadata_found": "|".join(meta_found),
            "failure_reason": str(failure_reason),
        })

        print(f"       {status}  chars={chars}  meta={meta_found}  err={failure_reason or '-'}")

        if status == "successful" and chars > 0:
            fname = safe_fixture_name(url, prefix=f"extract_{publisher.lower()[:10]}_", suffix=".txt", maxlen=50)
            fpath = FIXTURES_DIR / fname
            if not fpath.exists():
                fpath.write_text(text[:3000], encoding="utf-8")
                print(f"       Fixture saved: {fname}")

with open(EXTRACT_REPORT_PATH, "w", newline="", encoding="utf-8") as f:
    cols = ["url", "publisher", "country", "status", "chars_extracted", "metadata_found", "failure_reason"]
    writer = csv.DictWriter(f, fieldnames=cols)
    writer.writeheader()
    writer.writerows(extraction_rows)

print(f"\nExtraction report written: {EXTRACT_REPORT_PATH}")

# -- SUMMARY
print("\n" + "=" * 55)
print("  SUMMARY")
print("=" * 55)
print(f"\nFeeds working: {len(working_feeds)}/{len(feed_rows)}")
for row in feed_rows:
    flag = "OK  " if row["http_status_or_error"] == "200" else "FAIL"
    print(f"  [{flag}] [{row['country']:12s}] {row['http_status_or_error']:25s}  {row['entries_returned']} entries")

if extraction_rows:
    total_ex = len(extraction_rows)
    status_counts = Counter(r["status"] for r in extraction_rows)
    print(f"\nExtraction totals ({total_ex} articles):")
    for s, c in status_counts.items():
        print(f"  {s}: {c} ({c/total_ex*100:.0f}%)")

    print("\nPer-publisher success rate:")
    by_pub = {}
    for r in extraction_rows:
        by_pub.setdefault(r["publisher"], []).append(r["status"])
    for pub, statuses in sorted(by_pub.items()):
        ok = sum(1 for s in statuses if s == "successful")
        print(f"  {pub}: {ok}/{len(statuses)} successful")

print(f"\nFixtures: {FIXTURES_DIR}")
print(f"Feed report: {FEED_REPORT_PATH}")
print(f"Extraction report: {EXTRACT_REPORT_PATH}\n")
