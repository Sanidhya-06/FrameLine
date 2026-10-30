import pytest


@pytest.fixture(autouse=True)
def isolate_runtime_cache(tmp_path, monkeypatch):
    """Keep application caches created by tests inside pytest's temp tree."""
    monkeypatch.setenv("FRAMELINE_CACHE_PATH", str(tmp_path / "analysis_cache.sqlite3"))
