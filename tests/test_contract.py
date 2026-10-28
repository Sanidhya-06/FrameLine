import os
import sys
from pathlib import Path

os.environ.setdefault("FRAMELINE_CONTACT_URL", "https://example.com/frameline-tests")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.news_fetcher import canonicalize_url, parse_published_at
from models.schemas import AnalyzeResponse, Article


def test_url_and_date_normalization() -> None:
    assert canonicalize_url(
        "HTTPS://Example.COM/story/?utm_source=rss&x=1#fragment"
    ) == "https://example.com/story?x=1"
    parsed = parse_published_at("Wed, 28 Oct 2026 03:00:00 GMT")
    assert parsed is not None
    assert parsed.tzinfo is not None
    assert parsed.isoformat() == "2026-10-28T03:00:00+00:00"


def test_schema_requires_phase_one_article_fields() -> None:
    article = Article(
        article_id="a1",
        title="Fixture",
        url="https://example.com/a1",
        publisher="Fixture",
        source_country="United Kingdom",
        iso_code="GB",
        retrieved_at=parse_published_at("Wed, 28 Oct 2026 03:00:00 GMT"),
        extraction_status="restricted",
        language="en",
    )
    response = AnalyzeResponse(
        query="fixture",
        status="not_implemented",
        methodology_version="phase1-v1",
        articles=[article],
    )
    assert response.articles[0].extraction_status == "restricted"
