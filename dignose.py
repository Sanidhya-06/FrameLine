import feedparser
import traceback

feed_url = "http://feeds.bbci.co.uk/news/world/rss.xml"

try:
    print(f"Attempting to fetch: {feed_url}")
    feed = feedparser.parse(feed_url)
    
    print(f"\n--- DIAGNOSTICS ---")
    print(f"HTTP Status: {feed.status}")
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
        print("\n⚠️ NO ENTRIES FOUND")

except Exception as e:
    print(f"\n❌ EXCEPTION: {e}")
    traceback.print_exc()