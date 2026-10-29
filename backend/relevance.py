"""Hybrid relevance scoring for short RSS titles and summaries."""
from __future__ import annotations

import logging
import os
import re
import sqlite3
import struct
import threading
from html import unescape
from pathlib import Path
from typing import Protocol, Sequence

LOGGER = logging.getLogger(__name__)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
LEXICAL_WEIGHT = 0.4
SEMANTIC_WEIGHT = 0.6
TITLE_WEIGHT = 0.7
SUMMARY_WEIGHT = 0.3
RELEVANCE_SCORE_THRESHOLD = 0.55
WEAK_MATCH_MIN_SCORE = 0.25
DEFAULT_EMBEDDING_CACHE = Path(
    os.getenv("FRAMELINE_RELEVANCE_CACHE_PATH", "data/relevance_embeddings.db")
)

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
    "in", "is", "it", "of", "on", "or", "the", "to", "was", "were",
    "with", "about", "how", "what", "when", "where", "who", "why",
}
TOKEN_PATTERN = re.compile(r"[a-z0-9]+")
QUERY_ENTITY_PATTERN = re.compile(
    r"\b(?:[A-Z][a-z]+|[A-Z]{2,})(?:\s+(?:[A-Z][a-z]+|[A-Z]{2,}))*\b"
)


class Encoder(Protocol):
    def encode(
        self, sentences: Sequence[str], *, normalize_embeddings: bool,
        show_progress_bar: bool = False,
    ) -> object: ...


_MODEL: Encoder | None = None
_MODEL_LOAD_ATTEMPTED = False
_MODEL_LOCK = threading.Lock()


def stem(token: str) -> str:
    if token.endswith("ian") and len(token) > 5:
        return token[:-3]
    if token.endswith("ian") and len(token) > 4:
        return token[:-3]
    for suffix in ("ies", "ing", "ed", "es", "s"):
        if len(token) > len(suffix) + 2 and token.endswith(suffix):
            token = token[:-len(suffix)] + ("y" if suffix == "ies" else "")
            break
    if token.endswith("e") and len(token) > 4:
        token = token[:-1]
    return token


def terms(text: str) -> set[str]:
    return {
        stem(token)
        for token in TOKEN_PATTERN.findall(unescape(text).lower())
        if token not in STOPWORDS
    }


def _query_anchors(query: str) -> set[str]:
    anchors: set[str] = set()
    for match in QUERY_ENTITY_PATTERN.findall(query):
        anchors.update(terms(match))
    return anchors


def _anchors_present(anchors: set[str], text: str) -> bool:
    tokens = set(TOKEN_PATTERN.findall(unescape(text).lower()))
    for anchor in anchors:
        if anchor in tokens:
            continue
        if not any(
            token.startswith(anchor)
            and token[len(anchor):] in {"e", "ese", "ian", "ians"}
            for token in tokens
        ):
            return False
    return True


def _get_model() -> Encoder | None:
    global _MODEL, _MODEL_LOAD_ATTEMPTED
    with _MODEL_LOCK:
        if _MODEL_LOAD_ATTEMPTED:
            return _MODEL
        _MODEL_LOAD_ATTEMPTED = True
        try:
            from sentence_transformers import SentenceTransformer

            _MODEL = SentenceTransformer(MODEL_NAME, device="cpu")
        except Exception as exc:
            LOGGER.warning(
                "Relevance model %s is unavailable; using lexical fallback: %s: %s",
                MODEL_NAME,
                type(exc).__name__,
                exc,
            )
    return _MODEL


def _as_vectors(encoded: object, expected_count: int) -> list[list[float]]:
    values = encoded.tolist() if hasattr(encoded, "tolist") else encoded
    vectors = [[float(value) for value in row] for row in values]  # type: ignore[union-attr]
    if len(vectors) != expected_count or not vectors:
        raise ValueError("Embedding model returned an unexpected number of vectors")
    if not vectors[0] or any(len(vector) != len(vectors[0]) for vector in vectors):
        raise ValueError("Embedding model returned vectors with inconsistent dimensions")
    return vectors


class SQLiteEmbeddingCache:
    def __init__(self, path: Path = DEFAULT_EMBEDDING_CACHE) -> None:
        self._connection: sqlite3.Connection | None = None
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            self._connection = sqlite3.connect(path, timeout=5)
            self._connection.execute(
                """
                CREATE TABLE IF NOT EXISTS article_embeddings (
                    url TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    dimensions INTEGER NOT NULL,
                    embedding BLOB NOT NULL,
                    PRIMARY KEY (url, model_name)
                )
                """
            )
            self._connection.commit()
        except (OSError, sqlite3.Error) as exc:
            LOGGER.warning("Could not initialize relevance embedding cache: %s", exc)
            self.close()

    def get(self, url: str, model_name: str) -> list[float] | None:
        if self._connection is None:
            return None
        try:
            row = self._connection.execute(
                """
                SELECT dimensions, embedding FROM article_embeddings
                WHERE url = ? AND model_name = ?
                """,
                (url, model_name),
            ).fetchone()
            if row is None:
                return None
            dimensions, blob = row
            if len(blob) != dimensions * 4:
                LOGGER.warning("Discarding invalid cached article embedding")
                return None
            return list(struct.unpack(f"<{dimensions}f", blob))
        except sqlite3.Error as exc:
            LOGGER.warning("Could not read relevance embedding cache: %s", exc)
            self.close()
            return None

    def put(self, url: str, model_name: str, vector: Sequence[float]) -> None:
        if self._connection is None:
            return
        try:
            blob = struct.pack(f"<{len(vector)}f", *vector)
            self._connection.execute(
                """
                INSERT INTO article_embeddings (url, model_name, dimensions, embedding)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(url, model_name) DO UPDATE SET
                    dimensions = excluded.dimensions,
                    embedding = excluded.embedding
                """,
                (url, model_name, len(vector), blob),
            )
            self._connection.commit()
        except (sqlite3.Error, struct.error) as exc:
            LOGGER.warning("Could not write relevance embedding cache: %s", exc)
            self.close()

    def close(self) -> None:
        if self._connection is not None:
            self._connection.close()
            self._connection = None


def _cosine_similarity(left: Sequence[float], right: Sequence[float]) -> float:
    if len(left) != len(right):
        raise ValueError("Embedding dimensions do not match")
    left_norm = sum(value * value for value in left) ** 0.5
    right_norm = sum(value * value for value in right) ** 0.5
    if not left_norm or not right_norm:
        return 0.0
    cosine = sum(a * b for a, b in zip(left, right)) / (left_norm * right_norm)
    return max(0.0, min(1.0, cosine))


def _lexical_components(
    title: str, summary: str, query_terms: set[str], anchors: set[str],
) -> dict[str, object]:
    title_terms = terms(title)
    summary_terms = terms(summary)
    title_matches = query_terms & title_terms
    summary_matches = query_terms & summary_terms
    matched_terms = title_matches | summary_matches
    title_coverage = len(title_matches) / len(query_terms) if query_terms else 0.0
    summary_coverage = len(summary_matches) / len(query_terms) if query_terms else 0.0
    lexical_score = TITLE_WEIGHT * title_coverage + SUMMARY_WEIGHT * summary_coverage
    return {
        "lexical": lexical_score,
        "title_lexical": title_coverage,
        "summary_lexical": summary_coverage,
        "matched_terms": sorted(matched_terms),
        "anchors_match": _anchors_present(anchors, f"{title} {summary}"),
    }


def _article_text(entry: dict) -> tuple[str, str]:
    title = entry.get("title", "") or ""
    summary = entry.get("rss_summary", entry.get("summary", "")) or ""
    return title, summary


def _encode(model: Encoder, texts: Sequence[str]) -> list[list[float]]:
    encoded = model.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return _as_vectors(encoded, len(texts))


def score_entries(
    entries: list[dict],
    query: str,
    *,
    model: Encoder | None = None,
    load_model: bool = True,
    embedding_cache_path: Path = DEFAULT_EMBEDDING_CACHE,
    minimum_score: float = WEAK_MATCH_MIN_SCORE,
    enforce_anchors: bool = True,
    include_unmatched: bool = False,
) -> tuple[list[dict], str]:
    """Score entries and return relevant plus borderline weak-match candidates."""
    query_terms = terms(query)
    if not query_terms:
        return [], "hybrid"

    if model is None and load_model:
        model = _get_model()
    relevance_method = "hybrid" if model is not None else "lexical_fallback"

    anchors = _query_anchors(query)
    prepared: list[tuple[dict, str, str, dict[str, object]]] = []
    for entry in entries:
        title, summary = _article_text(entry)
        components = _lexical_components(title, summary, query_terms, anchors)
        if not enforce_anchors or components["anchors_match"]:
            prepared.append((entry, title, summary, components))

    semantic_scores = [0.0] * len(prepared)
    if model is not None and prepared:
        cache = SQLiteEmbeddingCache(embedding_cache_path)
        try:
            query_vector = _encode(model, [query])[0]
            article_vectors: list[list[float] | None] = [None] * len(prepared)
            missing_indices: list[int] = []
            missing_texts: list[str] = []
            missing_urls: list[str] = []
            for index, (entry, title, summary, _) in enumerate(prepared):
                url = entry.get("url", "") or ""
                cached = cache.get(url, MODEL_NAME) if url else None
                if cached is not None:
                    article_vectors[index] = cached
                else:
                    missing_indices.append(index)
                    missing_texts.append(f"{title} {summary}".strip())
                    missing_urls.append(url)
            if missing_texts:
                computed = _encode(model, missing_texts)
                for index, url, vector in zip(missing_indices, missing_urls, computed):
                    article_vectors[index] = vector
                    if url:
                        cache.put(url, MODEL_NAME, vector)
            for index, vector in enumerate(article_vectors):
                if vector is not None:
                    semantic_scores[index] = _cosine_similarity(query_vector, vector)
        except Exception as exc:
            LOGGER.warning(
                "Relevance inference failed for %s; using lexical fallback: %s: %s",
                MODEL_NAME,
                type(exc).__name__,
                exc,
            )
            relevance_method = "lexical_fallback"
        finally:
            cache.close()

    selected: list[dict] = []
    for index, (entry, _, _, components) in enumerate(prepared):
        lexical_score = float(components["lexical"])
        semantic_score = semantic_scores[index]
        if relevance_method == "hybrid":
            relevance_score = (
                LEXICAL_WEIGHT * lexical_score + SEMANTIC_WEIGHT * semantic_score
            )
        else:
            relevance_score = lexical_score
        if relevance_method == "hybrid" and relevance_score < minimum_score:
            continue
        if (
            relevance_method == "lexical_fallback"
            and not components["matched_terms"]
            and not include_unmatched
        ):
            continue
        item = dict(entry)
        item["matched_terms"] = components["matched_terms"]
        item["relevance_score"] = round(relevance_score, 4)
        item["relevance_components"] = {
            "lexical": round(lexical_score, 4),
            "title_lexical": round(float(components["title_lexical"]), 4),
            "summary_lexical": round(float(components["summary_lexical"]), 4),
            "semantic": round(semantic_score, 4),
            "anchors_match": bool(components["anchors_match"]),
        }
        item["relevance_method"] = relevance_method
        is_relevant = (
            relevance_score >= RELEVANCE_SCORE_THRESHOLD
            if relevance_method == "hybrid"
            else lexical_score >= RELEVANCE_SCORE_THRESHOLD
        )
        item["relevance_label"] = "relevant" if is_relevant else "weak_match"
        selected.append(item)
    return selected, relevance_method


def filter_relevant(entries: list[dict], query: str) -> list[dict]:
    """Compatibility wrapper using the normal lazy-loaded scoring path."""
    selected, _ = score_entries(entries, query)
    return selected


def legacy_rule_matches(entry: dict, query: str) -> bool:
    """The pre-Phase-2.5 rule, retained for the labeled-set evaluator."""
    query_terms = terms(query)
    if not query_terms:
        return False
    title, summary = _article_text(entry)
    return bool(query_terms & terms(f"{title} {summary}"))
