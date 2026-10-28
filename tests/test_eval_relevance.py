import pytest

from scripts.eval_relevance import load_gold, metrics


def test_load_gold_accepts_tab_delimited_label_file(tmp_path):
    path = tmp_path / "gold.csv"
    path.write_text(
        "query\ttitle\tsummary\tsource\turl\trelevant\n"
        "Sudan famine\tFamine in Sudan\tFood insecurity\tFixture\thttps://example.test/1\t1\n",
        encoding="utf-8",
    )
    rows = load_gold(path, validate_queries=False)
    assert rows[0]["relevant"] == "1"


def test_metrics_calculate_precision_recall_and_f1():
    rows = [
        {"relevant": "1"},
        {"relevant": "1"},
        {"relevant": "0"},
        {"relevant": "0"},
    ]
    assert metrics(rows, [True, False, True, False]) == {
        "precision": 0.5,
        "recall": 0.5,
        "f1": 0.5,
        "tp": 1,
        "fp": 1,
        "fn": 1,
    }


def test_load_gold_rejects_unlabeled_rows(tmp_path):
    path = tmp_path / "gold.csv"
    path.write_text(
        "query,title,summary,source,url,relevant\n"
        "Sudan famine,Famine in Sudan,Food insecurity,Fixture,https://example.test/1,\n",
        encoding="utf-8",
    )
    with pytest.raises(ValueError, match="Every relevance label"):
        load_gold(path, validate_queries=False)
