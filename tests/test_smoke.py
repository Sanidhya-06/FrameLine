"""
tests/test_smoke.py — Phase 0 smoke test.

Tests one feed per region and one article extraction, printing a pass/fail
summary. Exit code 0 = all checks passed. Exit code 1 = at least one failure.

Status label rule (from docs/phase0_audit.md §4):
    successful  : error is None AND len(text) >= 200 chars
    partial     : error is None AND 0 < len(text) < 200 chars
    unavailable : error is non-null OR text is empty/None

Run:
    python -m pytest tests/test_smoke.py -v
  OR standalone:
    python tests/test_smoke.py
"""

import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import requests
import feedparser

from src.fetch import fetch_from_feed, HEADERS
from src.extract import extract_article

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
MIN_TEXT_CHARS = 200   # must match docs/phase0_audit.md §4

# One representative feed per region (enabled feeds only).
# geo_unreliable=True: feed was confirmed working in initial Phase 0 run but
# intermittently returns 403/0 entries due to geo-filtering (e.g. TASS).
# A 0-entry result for these is recorded as a warning, not a test failure.
SMOKE_FEEDS = [
    {"region": "UK",          "url": "http://feeds.bbci.co.uk/news/world/rss.xml",          "geo_unreliable": False},
    {"region": "USA",         "url": "http://rss.cnn.com/rss/edition_world.rss",            "geo_unreliable": False},
    {"region": "Russia",      "url": "https://tass.com/rss/v2.xml",                         "geo_unreliable": True},
    {"region": "India",       "url": "https://www.thehindu.com/news/feeder/default.rss",    "geo_unreliable": False},
    {"region": "Middle East", "url": "https://www.aljazeera.com/xml/rss/all.xml",           "geo_unreliable": False},
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def extraction_status(result: dict) -> str:
    text = result.get("text", "") or ""
    if result.get("error") and not text:
        return "unavailable"
    if len(text) >= MIN_TEXT_CHARS:
        return "successful"
    if text:
        return "partial"
    return "unavailable"


# ---------------------------------------------------------------------------
# Test functions (work both with pytest and as standalone)
# ---------------------------------------------------------------------------

def test_smoke_feeds_and_extraction():
    """
    For each region:
      1. Fetch the smoke feed — must return >= 1 entry (unless geo_unreliable).
      2. Extract the first article — must not crash; status logged.

    geo_unreliable feeds: 0 entries is a WARN, not a FAIL (geo-blocking expected).
    extraction_status 'unavailable' is a soft warning (paywall/JS-only accepted).
    """
    results = []
    overall_pass = True

    print("\n" + "=" * 60)
    print("  FrameLine Phase 0 Smoke Test")
    print("=" * 60)

    for feed_cfg in SMOKE_FEEDS:
        region   = feed_cfg["region"]
        feed_url = feed_cfg["url"]
        geo_unreliable = feed_cfg.get("geo_unreliable", False)
        region_pass = True
        notes = []

        # ── 1. Feed fetch ──────────────────────────────────────────
        t0 = time.monotonic()
        try:
            entries = fetch_from_feed(feed_url, limit=10)
        except Exception as exc:
            entries = []
            notes.append(f"fetch_from_feed raised: {exc}")

        elapsed = round(time.monotonic() - t0, 2)

        if not entries:
            if geo_unreliable:
                notes.append("0 entries (geo_unreliable — WARN only, not FAIL)")
            else:
                region_pass = False
                notes.append("0 entries returned")
        else:
            notes.append(f"{len(entries)} entries in {elapsed}s")

        # ── 2. Article extraction ──────────────────────────────────
        article_url = None
        ext_status  = "skipped"

        if entries:
            article_url = entries[0].get("url", "")
            if article_url:
                try:
                    result   = extract_article(article_url)
                    ext_status = extraction_status(result)
                    err = result.get("error")
                    if err:
                        notes.append(f"extract error: {err}")
                    else:
                        notes.append(f"extract: {ext_status} ({len(result.get('text','') or '')} chars)")
                except Exception as exc:
                    ext_status = "crashed"
                    region_pass = False
                    notes.append(f"extract_article raised: {exc}")
            else:
                notes.append("first entry has no URL")

        # ext_status unavailable is not a test failure (paywall/JS-only is expected)
        if ext_status == "crashed":
            region_pass = False

        flag = "PASS" if region_pass else "FAIL"
        if not region_pass:
            overall_pass = False

        results.append({
            "region":      region,
            "feed_url":    feed_url,
            "entries":     len(entries),
            "article_url": article_url or "",
            "ext_status":  ext_status,
            "pass":        region_pass,
        })

        print(f"\n  [{flag}] {region}")
        print(f"    Feed:       {feed_url}")
        print(f"    Entries:    {len(entries)}")
        print(f"    Article:    {article_url or '(none)'}")
        print(f"    Extraction: {ext_status}")
        for note in notes:
            print(f"    Note:       {note}")

    # ── Summary ────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    passed  = sum(1 for r in results if r["pass"])
    failed  = len(results) - passed
    ext_ok  = sum(1 for r in results if r["ext_status"] == "successful")
    ext_par = sum(1 for r in results if r["ext_status"] == "partial")
    ext_una = sum(1 for r in results if r["ext_status"] == "unavailable")

    print(f"  Feeds:       {passed}/{len(results)} regions PASS")
    print(f"  Extraction:  {ext_ok} successful | {ext_par} partial | {ext_una} unavailable")
    print("=" * 60)

    if not overall_pass:
        print(f"\n  SMOKE TEST FAILED ({failed} region(s) failed)\n")

    # pytest assertion
    assert overall_pass, (
        f"{failed} region(s) failed smoke test. "
        "Check feed URLs and network connectivity."
    )

    print("\n  ALL CHECKS PASSED\n")
    return results


# ---------------------------------------------------------------------------
# Standalone entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    try:
        test_smoke_feeds_and_extraction()
        sys.exit(0)
    except AssertionError as exc:
        print(f"\nFAIL: {exc}\n")
        sys.exit(1)
    except Exception as exc:
        print(f"\nUNEXPECTED ERROR: {exc}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
