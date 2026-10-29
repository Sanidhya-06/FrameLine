"""SQLite cache for complete analysis responses."""
from __future__ import annotations

import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from models.schemas import AnalyzeResponse


def normalize_query(query: str) -> str:
    return " ".join(query.casefold().split())


def cache_key(query: str, methodology_version: str, feeds_config: dict) -> str:
    feeds_hash = hashlib.sha256(json.dumps(feeds_config, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()
    raw = "\0".join((normalize_query(query), methodology_version, feeds_hash))
    return hashlib.sha256(raw.encode()).hexdigest()


class SQLiteCache:
    def __init__(self, path: str | Path, ttl_seconds: int = 86400):
        self.path = Path(path)
        self.ttl_seconds = ttl_seconds
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as db:
            db.execute("CREATE TABLE IF NOT EXISTS analyses (key TEXT PRIMARY KEY, created REAL NOT NULL, payload TEXT NOT NULL)")

    def _connect(self):
        return sqlite3.connect(self.path, timeout=15)

    def get(self, key: str) -> AnalyzeResponse | None:
        now = datetime.now(timezone.utc).timestamp()
        with self._connect() as db:
            row = db.execute("SELECT created, payload FROM analyses WHERE key=?", (key,)).fetchone()
            if row is None:
                return None
            if self.ttl_seconds <= 0 or now - row[0] >= self.ttl_seconds:
                db.execute("DELETE FROM analyses WHERE key=?", (key,))
                return None
            return AnalyzeResponse.model_validate_json(row[1]).model_copy(update={"cached": True})

    def put(self, key: str, response: AnalyzeResponse) -> None:
        payload = response.model_copy(update={"cached": False}).model_dump_json()
        with self._connect() as db:
            db.execute("INSERT OR REPLACE INTO analyses(key, created, payload) VALUES (?, ?, ?)", (key, datetime.now(timezone.utc).timestamp(), payload))

