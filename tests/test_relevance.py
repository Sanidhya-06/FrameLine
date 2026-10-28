from backend.relevance import MODEL_NAME, score_entries


class FixtureEncoder:
    def __init__(self):
        self.encoded = []

    def encode(self, sentences, *, normalize_embeddings, show_progress_bar=False):
        self.encoded.append(list(sentences))
        vectors = []
        for sentence in sentences:
            text = sentence.casefold()
            if "famine" in text or "hunger" in text or "food insecurity" in text:
                vectors.append([1.0, 0.0])
            else:
                vectors.append([0.0, 1.0])
        return vectors


def test_query_match_records_components_and_matched_terms():
    selected, method = score_entries(
        [
            {
                "title": "Sudan famine risk grows",
                "rss_summary": "Families face a deepening food crisis",
            },
            {"title": "Local weather outlook", "rss_summary": "Rain continues"},
        ],
        "Sudan famine",
        model=None,
        load_model=False,
    )
    assert method == "lexical_fallback"
    assert len(selected) == 1
    assert selected[0]["matched_terms"] == ["famin", "sudan"]
    assert selected[0]["relevance_method"] == "lexical_fallback"
    assert selected[0]["relevance_score"] == 0.7
    assert selected[0]["relevance_components"]["title_lexical"] == 1.0
    assert selected[0]["relevance_label"] == "relevant"


def test_summary_only_match_is_weak_and_proper_noun_anchor_is_required():
    selected, _ = score_entries(
        [
            {"title": "Aid update", "rss_summary": "Sudan hunger crisis"},
            {"title": "Famine crisis", "rss_summary": "Relief groups issue warning"},
        ],
        "Sudan famine",
        model=None,
        load_model=False,
    )
    assert len(selected) == 1
    assert selected[0]["matched_terms"] == ["sudan"]
    assert selected[0]["relevance_label"] == "weak_match"
    assert selected[0]["relevance_score"] < 0.25


def test_entity_anchor_accepts_nationality_form_but_requires_it():
    selected, _ = score_entries(
        [
            {"title": "Sudanese families face famine", "rss_summary": "Aid is needed"},
            {"title": "Famine risk grows", "rss_summary": "Hunger and food insecurity"},
        ],
        "Sudan famine",
        model=None,
        load_model=False,
    )
    assert len(selected) == 1
    assert selected[0]["title"].startswith("Sudanese")


def test_entity_anchor_accepts_the_unstemmed_query_form():
    selected, _ = score_entries(
        [{"title": "Truce begins in Ukraine city", "rss_summary": "Ceasefire talks"}],
        "Ukraine",
        model=None,
        load_model=False,
    )
    assert len(selected) == 1
    assert selected[0]["matched_terms"] == ["ukrain"]


def test_semantic_component_can_match_synonyms_but_not_without_anchor():
    model = FixtureEncoder()
    selected, method = score_entries(
        [
            {"title": "Sudan faces a worsening crisis", "rss_summary": "Hunger is rising"},
            {"title": "Famine crisis deepens", "rss_summary": "Food insecurity grows"},
        ],
        "Sudan famine",
        model=model,
        load_model=False,
    )
    assert method == "hybrid"
    assert len(selected) == 1
    assert selected[0]["title"].startswith("Sudan")
    assert selected[0]["relevance_components"]["semantic"] == 1.0
    assert selected[0]["matched_terms"] == ["sudan"]


def test_hybrid_borderline_score_is_labeled_weak():
    class BorderlineEncoder:
        def __init__(self):
            self.calls = 0

        def encode(self, sentences, *, normalize_embeddings, show_progress_bar=False):
            self.calls += 1
            return [[1.0, 0.0]] if self.calls == 1 else [[0.3, 0.9539392014]]

    selected, method = score_entries(
        [{"title": "Update", "rss_summary": "Sudan famine"}],
        "Sudan famine",
        model=BorderlineEncoder(),
        load_model=False,
    )
    assert method == "hybrid"
    assert len(selected) == 1
    assert selected[0]["relevance_score"] == 0.3
    assert selected[0]["relevance_label"] == "weak_match"


def test_semantic_failure_logs_and_falls_back_to_lexical_rule(caplog):
    class BrokenEncoder:
        def encode(self, sentences, *, normalize_embeddings, show_progress_bar=False):
            raise RuntimeError("model unavailable")

    selected, method = score_entries(
        [{"title": "Sudan famine risk", "rss_summary": "Urgent aid"}],
        "Sudan famine",
        model=BrokenEncoder(),
        load_model=False,
    )
    assert method == "lexical_fallback"
    assert selected[0]["relevance_method"] == "lexical_fallback"
    assert "using lexical fallback" in caplog.text


def test_article_embedding_is_cached_by_url_and_model(tmp_path):
    model = FixtureEncoder()
    cache_path = tmp_path / "relevance.db"
    entry = {
        "title": "Sudan famine crisis",
        "rss_summary": "Food insecurity deepens",
        "url": "https://example.test/article",
    }
    for _ in range(2):
        score_entries(
            [entry],
            "Sudan famine",
            model=model,
            load_model=False,
            embedding_cache_path=cache_path,
        )
    assert len(model.encoded) == 3

    import sqlite3

    with sqlite3.connect(cache_path) as connection:
        row = connection.execute(
            "SELECT url, model_name FROM article_embeddings"
        ).fetchone()
    assert row == (entry["url"], MODEL_NAME)
