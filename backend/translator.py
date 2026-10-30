"""Batched CPU headline/summary translation with a persistent SQLite text cache."""
from __future__ import annotations

import gc
import hashlib
import html
import os
import re
import sqlite3
import threading
import time
from collections import OrderedDict, Counter
from pathlib import Path
from typing import Callable

from models.schemas import Article, TranslationStats
from backend.translation_config import (
    HELSINKI_MODELS,
    NLLB_MODEL,
    NLLB_SOURCE_CODES,
    fallback_backend,
    resolve_backend,
)

_MODEL_CACHE_LIMIT = 2
_MODEL_CACHE: OrderedDict[tuple[str, str], tuple[object, object]] = OrderedDict()
_MODEL_LOCK = threading.RLock()
_RUN_LOCK = threading.RLock()


def _language_code(value: str) -> str:
    return (value or "").strip().lower().split("-")[0].split("_")[0]


def _cache_key(backend: str, language: str, text: str) -> str:
    model = NLLB_MODEL if backend == "nllb" else HELSINKI_MODELS[language]
    value = "\0".join(("translation-v1", model, language, text))
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _cache_get(path: Path, key: str, ttl_seconds: int) -> str | None:
    with sqlite3.connect(path, timeout=15) as db:
        db.execute("CREATE TABLE IF NOT EXISTS translations (key TEXT PRIMARY KEY, created REAL NOT NULL, value TEXT NOT NULL)")
        row = db.execute("SELECT created,value FROM translations WHERE key=?", (key,)).fetchone()
        if row is None:
            return None
        if ttl_seconds <= 0 or time.time() - row[0] >= ttl_seconds:
            db.execute("DELETE FROM translations WHERE key=?", (key,))
            return None
        return row[1]


def _cache_put(path: Path, key: str, value: str) -> None:
    with sqlite3.connect(path, timeout=15) as db:
        db.execute("CREATE TABLE IF NOT EXISTS translations (key TEXT PRIMARY KEY, created REAL NOT NULL, value TEXT NOT NULL)")
        db.execute("INSERT OR REPLACE INTO translations(key,created,value) VALUES (?,?,?)", (key, time.time(), value))


def _load_model(backend: str, language: str):
    cache_key = (backend, "nllb" if backend == "nllb" else language)
    with _MODEL_LOCK:
        if cache_key in _MODEL_CACHE:
            _MODEL_CACHE.move_to_end(cache_key)
            tokenizer, model = _MODEL_CACHE[cache_key]
            return tokenizer, model, 0.0
        started = time.perf_counter()
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

        model_name = NLLB_MODEL if backend == "nllb" else HELSINKI_MODELS[language]
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to("cpu").eval()
        if backend == "nllb":
            tokenizer.src_lang = NLLB_SOURCE_CODES[language]
        _MODEL_CACHE[cache_key] = (tokenizer, model)
        while len(_MODEL_CACHE) > _MODEL_CACHE_LIMIT:
            _MODEL_CACHE.popitem(last=False)
            gc.collect()
        return tokenizer, model, time.perf_counter() - started


def _translate_batch(backend: str, language: str, texts: list[str], batch_size: int = 8) -> tuple[list[str], float]:
    import torch

    torch.set_num_threads(min(4, os.cpu_count() or 1))
    tokenizer, model, load_seconds = _load_model(backend, language)
    if backend == "nllb":
        tokenizer.src_lang = NLLB_SOURCE_CODES[language]
    outputs: list[str] = []
    batch_size = max(1, batch_size)
    with torch.inference_mode():
        for start in range(0, len(texts), batch_size):
            batch = texts[start:start + batch_size]
            encoded = tokenizer(batch, return_tensors="pt", padding=True, truncation=True, max_length=384)
            kwargs = {"max_new_tokens": 160, "num_beams": 1}
            if backend == "nllb":
                kwargs["forced_bos_token_id"] = tokenizer.convert_tokens_to_ids("eng_Latn")
            generated = model.generate(**encoded, **kwargs)
            outputs.extend(tokenizer.batch_decode(generated, skip_special_tokens=True))
    return outputs, load_seconds


def translate_articles(
    articles: list[Article],
    *,
    cache_path: str | Path,
    cache_ttl_seconds: int = 30 * 86400,
    batch_size: int = 8,
    progress: Callable[[int, int], None] | None = None,
) -> tuple[list[Article], TranslationStats]:
    """Translate article titles and RSS summaries, preserving original fields."""
    started = time.perf_counter()
    db_path = Path(cache_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    results: dict[tuple[int, str], tuple[str, str]] = {}
    segments: list[tuple[int, str, str, str]] = []
    languages = Counter()
    for index, article in enumerate(articles):
        language = _language_code(article.language)
        if not language or language == "en":
            continue
        for field, text in (("title", article.title), ("summary", article.rss_summary)):
            clean = html.unescape(re.sub(r"<[^>]+>", " ", text)).strip()
            if clean:
                segments.append((index, field, language, clean))
                languages[language] += 1
    total = len(segments)
    if progress:
        progress(0, total)
    cache_hits = fallback_count = model_load_seconds = completed = 0
    backend_counts: Counter[str] = Counter()
    with _RUN_LOCK:
        by_language: dict[str, list[tuple[int, str, str]]] = {}
        for index, field, language, text in segments:
            by_language.setdefault(language, []).append((index, field, text))
        for language, items in by_language.items():
            primary = resolve_backend(language)
            fallback = fallback_backend(language, primary)
            pending: list[tuple[int, str, str, str, str]] = []
            for index, field, text in items:
                found = None
                for backend in (primary, fallback):
                    if not backend:
                        continue
                    try:
                        found = _cache_get(db_path, _cache_key(backend, language, text), cache_ttl_seconds)
                    except Exception:
                        found = None
                    if found:
                        results[(index, field)] = (found, backend)
                        backend_counts[backend] += 1
                        cache_hits += 1
                        completed += 1
                        break
                if found is None:
                    pending.append((index, field, language, text, primary))
            if progress:
                progress(completed, total)
            for active_backend in (primary, fallback):
                batch_items = [item for item in pending if item[4] == active_backend]
                if not batch_items or active_backend is None:
                    continue
                try:
                    outputs, loaded = _translate_batch(active_backend, language, [item[3] for item in batch_items], batch_size)
                    model_load_seconds += loaded
                    if len(outputs) != len(batch_items) or any(not output.strip() for output in outputs):
                        raise RuntimeError("Translation model returned incomplete or empty outputs")
                except Exception:
                    if active_backend == primary and fallback:
                        pending = [(*item[:4], fallback) if item[4] == primary else item for item in pending]
                        continue
                    outputs = [""] * len(batch_items)
                for item, output in zip(batch_items, outputs):
                    index, field, lang, text, _ = item
                    if not output.strip():
                        completed += 1
                        continue
                    results[(index, field)] = (output.strip(), active_backend)
                    backend_counts[active_backend] += 1
                    if active_backend != primary:
                        fallback_count += 1
                    try:
                        _cache_put(db_path, _cache_key(active_backend, lang, text), output.strip())
                    except Exception:
                        pass
                    completed += 1
                if progress:
                    progress(completed, total)
    output_articles = []
    translated_count = 0
    failed_count = 0
    for index, article in enumerate(articles):
        title = results.get((index, "title"), (None, None))
        summary = results.get((index, "summary"), (None, None))
        attempted = _language_code(article.language) not in ("", "en")
        any_translation = bool(title[0] or summary[0])
        status = "not_requested" if not attempted else ("translated" if title[0] and (not article.rss_summary.strip() or summary[0]) else ("partial" if any_translation else "failed"))
        if status in {"translated", "partial"}:
            translated_count += 1
        elif status == "failed":
            failed_count += 1
        used = {backend for value, backend in (title, summary) if value and backend}
        actual_backend = next(iter(used)) if len(used) == 1 else ("mixed" if used else None)
        output_articles.append(article.model_copy(update={
            "translated_title": title[0], "translated_summary": summary[0],
            "translation_backend": actual_backend, "translation_status": status,
        }))
    elapsed = time.perf_counter() - started
    stats = TranslationStats(
        status="not_requested" if total == 0 else ("partial" if failed_count else "complete"),
        elapsed_seconds=round(elapsed, 3), model_load_seconds=round(model_load_seconds, 3),
        articles_total=sum(1 for article in articles if _language_code(article.language) not in ("", "en")),
        articles_translated=translated_count, articles_failed=failed_count,
        text_segments=total, cache_hits=cache_hits, fallback_segments=fallback_count,
        backend_counts=dict(backend_counts), language_counts=dict(languages),
    )
    return output_articles, stats
