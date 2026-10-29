"""In-memory asynchronous analysis jobs."""
from __future__ import annotations

import threading
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from backend.cache import SQLiteCache, cache_key
from backend.config import Settings, get_settings, load_feed_config
from backend.pipeline import run_pipeline
from models.schemas import AnalyzeResponse

STAGES = {"connecting_feeds", "retrieving_headlines", "checking_relevance", "extracting_text", "preparing_map", "done", "failed"}


@dataclass
class Job:
    job_id: str
    query: str
    stage: str = "connecting_feeds"
    feeds_completed: int = 0
    feeds_total: int = 0
    articles_extracted: int = 0
    articles_total: int = 0
    feed_statuses: list[dict] = field(default_factory=list)
    result: AnalyzeResponse | None = None
    error: str | None = None
    created: float = field(default_factory=time.time)
    finished: float | None = None

    def as_dict(self) -> dict[str, Any]:
        return {"job_id": self.job_id, "status": "finished" if self.stage == "done" else ("failed" if self.stage == "failed" else "running"), "stage": self.stage, "feeds_completed": self.feeds_completed, "feeds_total": self.feeds_total, "articles_extracted": self.articles_extracted, "articles_total": self.articles_total, "feed_statuses": self.feed_statuses, "result": self.result.model_dump(mode="json") if self.result else None, "error": self.error}


_jobs: dict[str, Job] = {}
_lock = threading.RLock()


def _cache(settings: Settings) -> SQLiteCache:
    return SQLiteCache(settings.cache_path, settings.cache_ttl_seconds)


def create_job(query: str, *, bypass_cache: bool = False, settings: Settings | None = None) -> Job:
    settings = settings or get_settings()
    feeds = load_feed_config(settings)
    key = cache_key(query, settings.methodology_version, feeds)
    if not bypass_cache:
        cached = _cache(settings).get(key)
        if cached is not None:
            job = Job(str(uuid.uuid4()), query, stage="done", feeds_completed=len(cached.feed_statuses), feeds_total=len(cached.feed_statuses), articles_extracted=len(cached.articles), articles_total=len(cached.articles), feed_statuses=[f.model_dump(mode="json") for f in cached.feed_statuses], result=cached, finished=time.time())
            with _lock:
                _expire(settings.job_ttl_seconds)
                _jobs[job.job_id] = job
            return job
    job = Job(str(uuid.uuid4()), query)
    with _lock:
        _expire(settings.job_ttl_seconds)
        _jobs[job.job_id] = job

    def progress(stage: str, values: dict):
        with _lock:
            job.stage = stage
            for name in ("feeds_completed", "feeds_total", "articles_extracted", "articles_total", "feed_statuses"):
                if name in values:
                    setattr(job, name, values[name])

    def worker():
        try:
            result = run_pipeline(query, settings=settings, feeds_config=feeds, progress=progress)
            _cache(settings).put(key, result)
            with _lock:
                job.result = result
                job.stage = "done"
                job.finished = time.time()
        except Exception:
            with _lock:
                job.stage = "failed"
                job.error = "Analysis could not be completed. Please retry."
                job.finished = time.time()

    threading.Thread(target=worker, name=f"analysis-{job.job_id}", daemon=True).start()
    return job


def _expire(ttl: int):
    now = time.time()
    expired = [key for key, job in _jobs.items() if job.finished is not None and (ttl <= 0 or now - job.finished >= ttl)]
    for key in expired:
        del _jobs[key]


def get_job(job_id: str, *, settings: Settings | None = None) -> Job:
    settings = settings or get_settings()
    with _lock:
        _expire(settings.job_ttl_seconds)
        job = _jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Unknown job_id")
    return job


def analyze_blocking(query: str, *, bypass_cache: bool = False, settings: Settings | None = None) -> AnalyzeResponse:
    settings = settings or get_settings()
    feeds = load_feed_config(settings)
    cache = _cache(settings)
    key = cache_key(query, settings.methodology_version, feeds)
    if not bypass_cache:
        cached = cache.get(key)
        if cached is not None:
            return cached
    result = run_pipeline(query, settings=settings, feeds_config=feeds)
    cache.put(key, result)
    return result
