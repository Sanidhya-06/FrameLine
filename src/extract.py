# src/extract.py
import trafilatura

def extract_article(url: str) -> dict:
    """Extract article text using trafilatura. Always returns a dict with 'error' key."""
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded is None:
            return {"url": url, "error": "download_failed", "text": "", "title": ""}
        
        text = trafilatura.extract(
            downloaded,
            include_comments=False,
            include_tables=False,
            favor_precision=True,
        )
        
        if not text:
            return {"url": url, "error": "extraction_failed", "text": "", "title": ""}
        
        metadata = trafilatura.extract_metadata(downloaded)
        return {
            "url": url,
            "title": metadata.title if metadata else "",
            "author": metadata.author if metadata else "",
            "date": metadata.date if metadata else "",
            "text": text,
            "error": None,   # ← Always present
        }
    except Exception as e:
        return {"url": url, "error": str(e), "text": "", "title": ""}