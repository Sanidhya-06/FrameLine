# src/extract.py
import trafilatura
import requests

# SRD FR-2 / §8: trafilatura.fetch_url has no configurable timeout in older
# versions and will block indefinitely on slow or hanging servers.
# Fix: download with requests (hard timeout) and pass HTML to trafilatura.
_EXTRACT_HEADERS = {
    "User-Agent": (
        "FrameLine/1.0 (academic news-framing research prototype; "
        "https://github.com/Sanidhya-06/FrameLine) "
        "python-requests/2.x trafilatura"
    )
}
_DOWNLOAD_TIMEOUT = 12  # seconds


def extract_article(url: str) -> dict:
    """Extract article text using trafilatura. Always returns a dict with 'error' key.

    Returns a dict with keys:
        url, title, author, date, text, error, extraction_status

    extraction_status values (SRD FR-3):
        "successful"  — text present and len(text) >= 200 chars
        "partial"     — text present but < 200 chars
        "unavailable" — no text (paywall, JS-only, network failure, etc.)

    Never raises. One article failure must not stop the run (SRD §8).
    """
    # ── Download with hard timeout ──────────────────────────────────────────
    try:
        resp = requests.get(url, headers=_EXTRACT_HEADERS, timeout=_DOWNLOAD_TIMEOUT)
        if resp.status_code != 200:
            return _result(url, error=f"http_{resp.status_code}")
        html = resp.text
    except requests.exceptions.Timeout:
        return _result(url, error="download_timeout")
    except requests.exceptions.ConnectionError:
        return _result(url, error="connection_error")
    except Exception as e:
        return _result(url, error=f"download_error:{e}")

    # ── Extract text ────────────────────────────────────────────────────────
    try:
        text = trafilatura.extract(
            html,
            include_comments=False,
            include_tables=False,
            favor_precision=True,
        )
    except Exception as e:
        return _result(url, error=f"extraction_error:{e}")

    if not text:
        return _result(url, error="extraction_failed")

    # ── Extract metadata ────────────────────────────────────────────────────
    try:
        metadata = trafilatura.extract_metadata(html)
    except Exception:
        metadata = None

    return _result(
        url,
        text=text,
        title=getattr(metadata, "title", "") or "",
        author=getattr(metadata, "author", "") or "",
        date=getattr(metadata, "date", "") or "",
    )


def _result(url, text="", title="", author="", date="", error=None):
    """Build a consistent return dict and add extraction_status label."""
    char_count = len(text) if text else 0
    if error and not text:
        status = "unavailable"
    elif char_count >= 200:
        status = "successful"
    elif char_count > 0:
        status = "partial"
    else:
        status = "unavailable"

    return {
        "url":               url,
        "title":             title,
        "author":            author,
        "date":              date,
        "text":              text,
        "error":             error,        # None on success; always present
        "extraction_status": status,       # SRD FR-3 label
    }