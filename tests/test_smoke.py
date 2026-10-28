"""Fixture-backed Phase 0 smoke tests.

The smoke test deliberately performs no live network access. Feed and article
responses are loaded from tests/fixtures.
"""

import os
import sys
from pathlib import Path
from types import SimpleNamespace

os.environ.setdefault("FRAMELINE_CONTACT_URL", "https://example.com/frameline-tests")

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import pytest

from backend.article_extractor import extract_article
from backend.news_fetcher import fetch_from_feed


FIXTURES = ROOT / "tests" / "fixtures"


class FixtureResponse:
    def __init__(self, content: bytes, status_code: int = 200):
        self.content = content
        self.text = content.decode("utf-8", errors="replace")
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


def test_smoke_feeds_and_extraction(monkeypatch: pytest.MonkeyPatch) -> None:
    feed_fixture = (
        FIXTURES / "feed_feeds.bbci.co.uk_news_world_rss.xml.xml"
    ).read_bytes()
    article_fixture = (
        FIXTURES / "extract_usa_www.cnn.com_business_live-news_stock-market-bank-e.txt"
    ).read_text(encoding="utf-8")

    def fake_get(url: str, **_: object) -> FixtureResponse:
        if "rss" in url:
            return FixtureResponse(feed_fixture)
        return FixtureResponse(article_fixture.encode("utf-8"))

    monkeypatch.setattr("backend.news_fetcher.requests.get", fake_get)
    monkeypatch.setattr("backend.article_extractor.requests.get", fake_get)
    monkeypatch.setattr(
        "backend.article_extractor.trafilatura.extract",
        lambda *_args, **_kwargs: article_fixture,
    )
    monkeypatch.setattr(
        "backend.article_extractor.trafilatura.extract_metadata",
        lambda *_args, **_kwargs: SimpleNamespace(
            title="Fixture article", author="Fixture author", date="2026-10-28"
        ),
    )

    entries = fetch_from_feed(
        "https://fixture.invalid/rss.xml",
        feed_config={
            "publisher": "BBC News",
            "country": "United Kingdom",
            "iso_code": "GB",
            "language": "en",
        },
    )
    assert entries
    result = extract_article(
        entries[0]["url"],
        feed_config={"fulltext_allowed": True},
        rss_summary=entries[0]["rss_summary"],
        published=entries[0]["published_raw"],
    )
    assert result["extraction_status"] == "successful"
    assert len(result["text"]) >= 200


def test_restricted_extraction_does_not_fetch(monkeypatch: pytest.MonkeyPatch) -> None:
    def fail_get(*_args: object, **_kwargs: object) -> None:
        raise AssertionError("restricted articles must not be fetched")

    monkeypatch.setattr("backend.article_extractor.requests.get", fail_get)
    result = extract_article(
        "https://example.com/article",
        feed_config={"fulltext_allowed": False},
        rss_summary="RSS-only summary",
    )
    assert result["extraction_status"] == "restricted"
    assert result["rss_summary"] == "RSS-only summary"
