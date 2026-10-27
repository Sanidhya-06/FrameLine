import feedparser
import requests
import traceback

# B2 fix: dignose.py was previously calling feedparser.parse(url) directly,
# which bypasses the HEADERS/User-Agent set in src/fetch.py.
# Now uses requests first (with the shared UA), then passes bytes to feedparser.

from src.fetch import HEADERS

feed_url = "http://feeds.bbci.co.uk/news/world/rss.xml"

try:
    print(f"Attempting to fetch: {feed_url}")
    resp = requests.get(feed_url, headers=HEADERS, timeout=15)
    print(f"HTTP status: {resp.status_code}")
    feed = feedparser.parse(resp.content)

    print(f"\n--- DIAGNOSTICS ---")
    print(f"Feed Bozo (error flag): {feed.bozo}")
    print(f"Feed Title: {feed.feed.get('title', 'NO TITLE FOUND')}")
    print(f"Number of entries: {len(feed.entries)}")

    if feed.bozo:
        print(f"\nBozo Exception: {feed.bozo_exception}")

    if len(feed.entries) > 0:
        print(f"\n--- FIRST ENTRY ---")
        print(f"Title: {feed.entries[0].title}")
        print(f"Link: {feed.entries[0].link}")
    else:
        print("\nWARN: NO ENTRIES FOUND")

except Exception as e:
    print(f"\nEXCEPTION: {e}")
    traceback.print_exc()