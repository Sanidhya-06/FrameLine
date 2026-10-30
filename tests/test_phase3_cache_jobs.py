import json
import os
import sys
import time
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("FRAMELINE_CONTACT_URL", "https://example.com/tests")

from backend.cache import SQLiteCache, cache_key
from backend.config import Settings
from backend.jobs import _jobs, analyze_blocking, create_job, get_job
from backend.main import app, methodology
from models.schemas import AnalyzeResponse


def test_sqlite_cache_hit_miss_and_ttl_expiry(tmp_path):
    cache = SQLiteCache(tmp_path / "cache.sqlite", 1)
    key = cache_key("  World   News ", "v1", {"A": []})
    assert cache.get(key) is None
    response = AnalyzeResponse(query="World News", status="ok", methodology_version="v1")
    cache.put(key, response)
    hit = cache.get(key)
    assert hit is not None and hit.cached
    with patch("backend.cache.datetime") as mocked:
        from datetime import datetime, timezone
        mocked.now.return_value = datetime.fromtimestamp(time.time() + 2, timezone.utc)
        assert cache.get(key) is None


def test_cache_key_accounts_for_methodology_and_feed_config():
    assert cache_key(" A  B ", "v1", {"X": []}) == cache_key("a b", "v1", {"X": []})
    assert cache_key("a b", "v1", {"X": []}) != cache_key("a b", "v2", {"X": []})
    assert cache_key("a b", "v1", {"X": []}) != cache_key("a b", "v1", {"X": [{"url": "x"}]})


def _settings(tmp_path):
    feeds = tmp_path / "feeds.json"
    feeds.write_text(json.dumps({"UK": [{"url": "https://fixture.test/rss", "publisher": "Fixture"}]}))
    return Settings(
        feeds,
        1,
        1,
        86400,
        "test-v1",
        "https://example.com",
        cache_path=tmp_path / "analysis_cache.sqlite3",
    )


def test_blocking_cache_miss_then_hit_and_bypass(tmp_path):
    settings = _settings(tmp_path)
    response = AnalyzeResponse(query="test", status="ok", methodology_version="test-v1")
    with patch("backend.jobs.run_pipeline", return_value=response) as pipeline:
        miss = analyze_blocking("test", settings=settings)
        hit = analyze_blocking("test", settings=settings)
        bypass = analyze_blocking("test", settings=settings, bypass_cache=True)
    assert not miss.cached and hit.cached and not bypass.cached
    assert pipeline.call_count == 2


def test_job_lifecycle_and_pipeline_failure(tmp_path):
    settings = _settings(tmp_path)
    _jobs.clear()

    def successful(query, *, progress, **kwargs):
        progress("connecting_feeds", {"feeds_total": 1, "feeds_completed": 0, "feed_statuses": []})
        progress("retrieving_headlines", {"feeds_total": 1, "feeds_completed": 1, "feed_statuses": []})
        progress("checking_relevance", {"feeds_total": 1, "feeds_completed": 1})
        progress("extracting_text", {"articles_extracted": 0, "articles_total": 0})
        progress("preparing_map", {"articles_extracted": 0, "articles_total": 0})
        return AnalyzeResponse(query=query, status="ok", methodology_version="test-v1")

    with patch("backend.jobs.run_pipeline", side_effect=successful):
        job = create_job("first", bypass_cache=True, settings=settings)
        deadline = time.time() + 2
        while job.stage != "done" and time.time() < deadline:
            time.sleep(.01)
    assert job.stage == "done" and job.result is not None
    assert job.feeds_completed == 1

    with patch("backend.jobs.run_pipeline", side_effect=RuntimeError("secret token traceback")):
        failed = create_job("second", bypass_cache=True, settings=settings)
        deadline = time.time() + 2
        while failed.stage != "failed" and time.time() < deadline:
            time.sleep(.01)
    assert failed.stage == "failed"
    assert failed.error == "Analysis could not be completed. Please retry."
    assert "secret" not in failed.error


def test_job_cache_hit_returns_finished_and_unknown_id_404(tmp_path):
    settings = _settings(tmp_path)
    with patch("backend.jobs.run_pipeline", return_value=AnalyzeResponse(query="x", status="ok", methodology_version="test-v1")):
        analyze_blocking("x", settings=settings)
    job = create_job("x", settings=settings)
    assert job.stage == "done" and job.result.cached
    client = TestClient(app)
    assert client.get("/analyze/jobs/not-a-real-id").status_code == 404


def test_methodology_documents_cache_and_stages():
    info = methodology()
    assert "SQLite" in info["cache"]
    assert "connecting_feeds" in info["job_stages"]

