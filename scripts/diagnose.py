import traceback

import feedparser
import requests

from backend.config import get_settings


def main() -> None:
    settings = get_settings()
    feed_url = "https://feeds.bbci.co.uk/news/world/rss.xml"
    try:
        print(f"Attempting to fetch: {feed_url}")
        response = requests.get(
            feed_url, headers={"User-Agent": settings.user_agent},
            timeout=settings.feed_timeout
        )
        print(f"HTTP status: {response.status_code}")
        feed = feedparser.parse(response.content)
        print("\n--- DIAGNOSTICS ---")
        print(f"Feed Bozo (error flag): {feed.bozo}")
        print(f"Feed Title: {feed.feed.get('title', 'NO TITLE FOUND')}")
        print(f"Number of entries: {len(feed.entries)}")
        if feed.bozo:
            print(f"\nBozo Exception: {feed.bozo_exception}")
        if feed.entries:
            print("\n--- FIRST ENTRY ---")
            print(f"Title: {feed.entries[0].get('title', '')}")
            print(f"Link: {feed.entries[0].get('link', '')}")
        else:
            print("\nWARN: NO ENTRIES FOUND")
    except Exception as exc:
        print(f"\nEXCEPTION: {exc}")
        traceback.print_exc()


if __name__ == "__main__":
    main()
