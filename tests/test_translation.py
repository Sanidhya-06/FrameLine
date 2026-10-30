from datetime import datetime, timezone

from backend.translation_config import fallback_backend, resolve_backend
from backend.translator import translate_articles
from models.schemas import Article


def article(language="fr", title="Bonjour monde", summary="<p>La presse parle.</p>"):
    return Article(
        article_id="sample", title=title, url="https://example.test/article",
        publisher="Fixture", source_country="France", iso_code="FR",
        retrieved_at=datetime.now(timezone.utc), extraction_status="unavailable",
        language=language, rss_summary=summary,
    )


def test_hybrid_language_routing_and_unknown_hls_falls_back_to_nllb():
    assert resolve_backend("hi") == "nllb"
    assert resolve_backend("ru") == "nllb"
    assert resolve_backend("it") == "nllb"
    assert resolve_backend("fr") == "helsinki"
    assert resolve_backend("ar") == "nllb"
    assert fallback_backend("fr", "helsinki") == "nllb"
    assert fallback_backend("ar", "nllb") is None


def test_translation_is_batched_cached_and_preserves_original(monkeypatch, tmp_path):
    calls = []

    def fake_translate(backend, language, texts, batch_size=8):
        assert batch_size == 8
        calls.append((backend, language, list(texts)))
        return [f"EN: {text}" for text in texts], 1.25

    monkeypatch.setattr("backend.translator._translate_batch", fake_translate)
    original = article()
    translated, stats = translate_articles([original], cache_path=tmp_path / "cache.sqlite3")
    assert len(calls) == 1
    assert calls[0][0:2] == ("helsinki", "fr")
    assert calls[0][2] == ["Bonjour monde", "La presse parle."]
    assert translated[0].title == original.title
    assert translated[0].translated_title == "EN: Bonjour monde"
    assert translated[0].translated_summary == "EN: La presse parle."
    assert translated[0].translation_status == "translated"
    assert stats.elapsed_seconds >= 0
    assert stats.model_load_seconds == 1.25

    def cache_only(*_args):
        raise AssertionError("cached translation should not invoke a model")

    monkeypatch.setattr("backend.translator._translate_batch", cache_only)
    cached, second_stats = translate_articles([original], cache_path=tmp_path / "cache.sqlite3")
    assert cached[0].translated_title == translated[0].translated_title
    assert second_stats.cache_hits == 2


def test_primary_model_failure_uses_alternate_backend(monkeypatch, tmp_path):
    calls = []

    def fail_helsinki_then_translate(backend, language, texts, batch_size=8):
        calls.append(backend)
        if backend == "helsinki":
            raise OSError("model unavailable")
        return [f"Fallback: {text}" for text in texts], .5

    monkeypatch.setattr("backend.translator._translate_batch", fail_helsinki_then_translate)
    translated, stats = translate_articles([article("fr")], cache_path=tmp_path / "cache.sqlite3")
    assert calls == ["helsinki", "nllb"]
    assert translated[0].translation_backend == "nllb"
    assert translated[0].translation_status == "translated"
    assert stats.fallback_segments == 2
