import os
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

os.environ.setdefault("FRAMELINE_CONTACT_URL", "https://example.com/tests")

from backend.config import Settings
from backend.main import app, methodology
from backend.pipeline import run_pipeline
from models.schemas import FeedStatus


ROOT = Path(__file__).resolve().parent
SETTINGS = Settings(ROOT / "fixtures" / "unused.json", 1, 1, 0, "phase2-v1", "https://example.com/tests")


class Response:
    status_code = 200
    def __init__(self, content): self.content = content
    def raise_for_status(self): pass


def test_pipeline_fixture_fetch_filter_group_and_partial_status():
    fixture = (ROOT / "fixtures" / "feed_feeds.bbci.co.uk_news_world_rss.xml.xml").read_bytes()
    feeds = {"UK": [
        {"url": "https://fixture.test/feed", "publisher": "BBC", "country": "United Kingdom", "region": "UK", "iso_code": "GB", "language": "en", "enabled": True, "fulltext_allowed": False},
        {"url": "https://fixture.test/down", "publisher": "Down", "iso_code": "ZZ", "enabled": True},
    ]}
    def get(url, **kwargs):
        if url.endswith("down"): raise ConnectionError("fixture failure")
        return Response(fixture)
    with patch("backend.pipeline.requests.get", side_effect=get), patch(
        "backend.relevance._get_model", return_value=None
    ):
        result = run_pipeline("Ukraine", settings=SETTINGS, feeds_config=feeds)
    assert result.status in {"ok", "partial"}
    assert result.feed_statuses[0].entry_count > 0
    assert result.feed_statuses[1].status == "failed"
    assert all(a.matched_terms for a in result.articles)
    assert result.relevance_method == "lexical_fallback"
    assert all(a.relevance_score is not None for a in result.articles)
    assert all(a.relevance_method == result.relevance_method for a in result.articles)
    assert all(
        article.relevance_label != "weak_match"
        for group in result.country_groups.values()
        for article in group.articles
    )
    assert "GB" in result.country_groups


def test_weak_matches_remain_visible_but_are_excluded_from_country_groups():
    feed = {
        "url": "https://fixture.test/feed",
        "publisher": "Fixture",
        "country": "Sudan",
        "iso_code": "SD",
        "language": "en",
        "enabled": True,
        "fulltext_allowed": False,
    }
    entries = [
        {
            "title": "Sudan famine worsens",
            "url": "https://fixture.test/relevant",
            "rss_summary": "Families need urgent aid",
            "matched_terms": ["famin", "sudan"],
        },
        {
            "title": "Sudan aid update",
            "url": "https://fixture.test/weak",
            "rss_summary": "Famine is discussed",
            "matched_terms": ["famin", "sudan"],
        },
        {
            "title": "Famine aid update",
            "url": "https://fixture.test/unanchored",
            "rss_summary": "Food insecurity grows",
            "matched_terms": ["famin"],
        },
    ]

    def fetch(_feed, _settings):
        return entries, FeedStatus(
            feed="Fixture",
            url=feed["url"],
            status="ok",
            error_text=None,
            entry_count=len(entries),
            response_time_ms=1,
        )

    with patch("backend.pipeline._fetch", side_effect=fetch), patch(
        "backend.relevance._get_model", return_value=None
    ):
        result = run_pipeline(
            "Sudan famine", settings=SETTINGS, feeds_config={"Sudan": [feed]}
        )

    assert [article.relevance_label for article in result.articles] == [
        "relevant",
        "weak_match",
    ]
    assert result.country_groups["SD"].article_count == 1
    assert [
        article.relevance_label
        for article in result.country_groups["SD"].articles
    ] == ["relevant"]


def test_endpoint_rejects_blank_and_uses_pipeline():
    methods = methodology()
    assert methods["relevance_model"] == "sentence-transformers/all-MiniLM-L6-v2"
    assert "relevance score threshold" in methods["relevance_filter"]
    client = TestClient(app)
    assert client.post("/analyze", json={"query": "  "}).status_code == 422
    with patch("backend.main.run_pipeline") as pipeline:
        from models.schemas import AnalyzeResponse
        pipeline.return_value = AnalyzeResponse(query="Ukraine", status="no_results", methodology_version="test")
        response = client.post("/analyze", json={"query": " Ukraine "})
    assert response.status_code == 200
    pipeline.assert_called_once_with("Ukraine")
