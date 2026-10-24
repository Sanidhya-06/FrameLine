from src.fetch import fetch_all_feeds
from src.extract import extract_article

RSS_FEEDS = {
    "UK": ["http://feeds.bbci.co.uk/news/world/rss.xml"],
    "USA": ["https://rss.nytimes.com/services/xml/rss/nyt/World.xml"],
    "Middle East": ["https://www.aljazeera.com/xml/rss/all.xml"],
}

articles_by_country = fetch_all_feeds(RSS_FEEDS, limit_per_feed=3)

for country, articles in articles_by_country.items():
    if not articles:
        print(f"\n--- {country}: NO ARTICLES ---")
        continue
    
    first = articles[0]
    print(f"\n--- {country}: {first['title']} ---")
    print(f"URL: {first['url']}")
    
    extracted = extract_article(first["url"])
    
    # Print the ENTIRE returned dict so we can see its shape
    print(f"\n🔍 DEBUG — extracted keys: {list(extracted.keys())}")
    print(f"🔍 DEBUG — extracted dict: {extracted}\n")
    
    if extracted.get("error"):
        print(f"  ❌ Extraction failed: {extracted['error']}")
    else:
        text = extracted.get("text", "")
        print(f"  ✅ Extracted {len(text)} characters")
        print(f"  Preview: {text[:200]}...")