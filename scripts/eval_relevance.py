"""Evaluate legacy and hybrid relevance rules on tests/relevance_gold.csv."""
from __future__ import annotations

import csv
import argparse
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.relevance import (  # noqa: E402
    DEFAULT_EMBEDDING_CACHE,
    LEXICAL_WEIGHT,
    MODEL_NAME,
    RELEVANCE_SCORE_THRESHOLD,
    WEAK_MATCH_MIN_SCORE,
    legacy_rule_matches,
    score_entries,
)

GOLD_PATH = ROOT / "tests" / "relevance_gold.csv"
TRAIN_QUERIES = {"AI regulation", "climate change", "Sudan famine"}
TEST_QUERIES = {"Israel Gaza", "Ukraine war"}
LEXICAL_WEIGHTS = tuple(step / 20 for step in range(2, 19))
THRESHOLDS = tuple(step / 100 for step in range(30, 91, 2))


def load_gold(
    path: Path = GOLD_PATH, *, validate_queries: bool = True,
) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        sample = handle.read(4096)
        handle.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",\t")
        except csv.Error:
            dialect = csv.excel_tab if "\t" in sample.partition("\n")[0] else csv.excel
        rows = list(csv.DictReader(handle, dialect=dialect))
    expected = {"query", "title", "summary", "source", "url", "relevant"}
    if not rows or set(rows[0]) != expected:
        raise ValueError(f"{path} must contain columns: {', '.join(sorted(expected))}")
    invalid = [
        row_number
        for row_number, row in enumerate(rows, start=2)
        if row["relevant"] not in {"0", "1"}
    ]
    if invalid:
        raise ValueError(
            "Every relevance label must be 0 or 1; invalid or blank rows: "
            + ", ".join(map(str, invalid[:20]))
        )
    queries = {row["query"] for row in rows}
    if validate_queries and queries != TRAIN_QUERIES | TEST_QUERIES:
        raise ValueError(
            "Gold queries must match the documented train/test split; found: "
            + ", ".join(sorted(queries))
        )
    return rows


def metrics(rows: list[dict], predictions: list[bool]) -> dict[str, float | int]:
    actual = [row["relevant"] == "1" for row in rows]
    true_positive = sum(expected and predicted for expected, predicted in zip(actual, predictions))
    false_positive = sum(not expected and predicted for expected, predicted in zip(actual, predictions))
    false_negative = sum(expected and not predicted for expected, predicted in zip(actual, predictions))
    precision = true_positive / (true_positive + false_positive) if true_positive + false_positive else 0.0
    recall = true_positive / (true_positive + false_negative) if true_positive + false_negative else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "tp": true_positive,
        "fp": false_positive,
        "fn": false_negative,
    }


def prepare_scores(
    rows: list[dict[str, str]], *, enforce_anchors: bool = True,
) -> tuple[dict[int, dict], str]:
    scored: dict[int, dict] = {}
    method = "hybrid"
    for query in sorted({row["query"] for row in rows}):
        indexes = [index for index, row in enumerate(rows) if row["query"] == query]
        entries = [
            {
                "_gold_index": index,
                "title": rows[index]["title"],
                "rss_summary": rows[index]["summary"],
                "url": rows[index]["url"],
            }
            for index in indexes
        ]
        results, method = score_entries(
            entries,
            query,
            minimum_score=0.0,
            embedding_cache_path=DEFAULT_EMBEDDING_CACHE,
            enforce_anchors=enforce_anchors,
            include_unmatched=not enforce_anchors,
        )
        scored.update({item["_gold_index"]: item for item in results})
    return scored, method


def predictions_for(
    rows: list[dict[str, str]],
    scored: dict[int, dict],
    *,
    lexical_weight: float,
    threshold: float,
    method: str,
) -> list[bool]:
    predictions = []
    for index, _ in enumerate(rows):
        result = scored.get(index)
        if result is None:
            predictions.append(False)
            continue
        components = result["relevance_components"]
        if not components["anchors_match"]:
            predictions.append(False)
            continue
        score = (
            components["lexical"]
            if method == "lexical_fallback"
            else lexical_weight * components["lexical"]
            + (1 - lexical_weight) * components["semantic"]
        )
        predictions.append(score >= threshold)
    return predictions


def tune(
    rows: list[dict[str, str]], scored: dict[int, dict], method: str,
) -> tuple[float, float, dict[str, float | int]]:
    train_indexes = [
        index for index, row in enumerate(rows) if row["query"] in TRAIN_QUERIES
    ]
    train_rows = [rows[index] for index in train_indexes]
    best: tuple[float, float, dict[str, float | int]] | None = None
    lexical_weights = LEXICAL_WEIGHTS if method == "hybrid" else (LEXICAL_WEIGHT,)
    for lexical_weight in lexical_weights:
        for threshold in THRESHOLDS:
            all_predictions = predictions_for(
                rows,
                scored,
                lexical_weight=lexical_weight,
                threshold=threshold,
                method=method,
            )
            train_predictions = [all_predictions[index] for index in train_indexes]
            result = metrics(train_rows, train_predictions)
            candidate = (lexical_weight, threshold, result)
            if best is None or (
                result["f1"], result["precision"], threshold
            ) > (
                best[2]["f1"], best[2]["precision"], best[1]
            ):
                best = candidate
    if best is None:
        raise RuntimeError("No relevance weights or thresholds were evaluated")
    return best


def report(
    name: str, rows: list[dict[str, str]], predictions: list[bool],
) -> dict[str, float | int]:
    result = metrics(rows, predictions)
    print(
        f"{name}: precision={result['precision']:.3f} "
        f"recall={result['recall']:.3f} F1={result['f1']:.3f} "
        f"(TP={result['tp']}, FP={result['fp']}, FN={result['fn']})"
    )
    return result


def print_error_scores(
    rows: list[dict[str, str]],
    scored: dict[int, dict],
    predictions: list[bool],
) -> None:
    print("\nHybrid false positives/negatives (all labeled rows):")
    for index, (row, predicted) in enumerate(zip(rows, predictions)):
        expected = row["relevant"] == "1"
        if expected == predicted:
            continue
        result = scored[index]
        components = result["relevance_components"]
        combined = (
            LEXICAL_WEIGHT * components["lexical"]
            + (1 - LEXICAL_WEIGHT) * components["semantic"]
        )
        error_type = "FN" if expected else "FP"
        print(
            f"{error_type} | {row['query']} | {row['title']} | "
            f"lexical={components['lexical']:.4f} "
            f"semantic={components['semantic']:.4f} combined={combined:.4f} "
            f"anchor={components['anchors_match']}"
        )


def sample_candidates(
    rows: list[dict[str, str]],
    scored: dict[int, dict],
    queries: list[str],
) -> None:
    rng = random.Random(20261028)
    print("\nCandidate headlines for labeling:")
    for query in queries:
        indexes = [index for index, row in enumerate(rows) if row["query"] == query]
        print(f"\n[{query}]")
        if not indexes:
            print("  No rows found in the gold file.")
            continue
        old_matches = [
            index for index in indexes
            if legacy_rule_matches(
                {"title": rows[index]["title"], "rss_summary": rows[index]["summary"]},
                query,
            )
        ]
        near_threshold = [
            index for index in indexes
            if index in scored
            and abs(
                LEXICAL_WEIGHT * scored[index]["relevance_components"]["lexical"]
                + (1 - LEXICAL_WEIGHT)
                * scored[index]["relevance_components"]["semantic"]
                - RELEVANCE_SCORE_THRESHOLD
            ) <= 0.10
        ]
        random_indexes = rng.sample(indexes, min(3, len(indexes)))
        selected: list[tuple[str, int]] = []
        for label, candidates in (
            ("old-rule", old_matches),
            ("near-threshold", near_threshold),
            ("random", random_indexes),
        ):
            for index in candidates:
                if index not in {item[1] for item in selected}:
                    selected.append((label, index))
        for label, index in selected:
            print(f"  {label}: {rows[index]['title']}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--sample-candidates",
        nargs=5,
        metavar="QUERY",
        help="Print candidate headlines for exactly five queries in the gold file.",
    )
    args = parser.parse_args()
    rows = load_gold(validate_queries=not args.sample_candidates)
    scored, method = prepare_scores(rows, enforce_anchors=False)
    train_rows = [row for row in rows if row["query"] in TRAIN_QUERIES]
    test_rows = [row for row in rows if row["query"] in TEST_QUERIES]
    print(f"Gold set: {len(rows)} rows; model={MODEL_NAME}; scoring method={method}")
    print(
        "Split by query: train="
        + ", ".join(sorted(TRAIN_QUERIES))
        + "; held-out="
        + ", ".join(sorted(TEST_QUERIES))
    )

    baseline_train = [
        legacy_rule_matches(
            {"title": row["title"], "rss_summary": row["summary"]}, row["query"]
        )
        for row in train_rows
    ]
    baseline_test = [
        legacy_rule_matches(
            {"title": row["title"], "rss_summary": row["summary"]}, row["query"]
        )
        for row in test_rows
    ]
    report("Old rule, train", train_rows, baseline_train)
    report("Old rule, held-out", test_rows, baseline_test)

    default_predictions = predictions_for(
        rows,
        scored,
        lexical_weight=LEXICAL_WEIGHT,
        threshold=RELEVANCE_SCORE_THRESHOLD,
        method="hybrid",
    )
    test_indexes = [
        index for index, row in enumerate(rows) if row["query"] in TEST_QUERIES
    ]
    test_predictions = [default_predictions[index] for index in test_indexes]
    train_predictions = [
        default_predictions[index]
        for index, row in enumerate(rows)
        if row["query"] in TRAIN_QUERIES
    ]
    if method == "hybrid":
        report("Hybrid rule, train", train_rows, train_predictions)
        report("Hybrid rule, held-out", test_rows, test_predictions)
    else:
        print("Hybrid rule: unavailable because the embedding model did not load.")

    lexical_predictions = predictions_for(
        rows,
        scored,
        lexical_weight=LEXICAL_WEIGHT,
        threshold=RELEVANCE_SCORE_THRESHOLD,
        method="lexical_fallback",
    )
    report(
        "Lexical fallback, train",
        train_rows,
        [lexical_predictions[index] for index, row in enumerate(rows) if row["query"] in TRAIN_QUERIES],
    )
    report("Lexical fallback, held-out", test_rows, [lexical_predictions[index] for index in test_indexes])
    if method == "hybrid":
        print_error_scores(rows, scored, default_predictions)
    if args.sample_candidates:
        sample_candidates(rows, scored, args.sample_candidates)
    print(
        f"No tuning applied; runtime defaults: lexical_weight={LEXICAL_WEIGHT:.2f}, "
        f"semantic_weight={1 - LEXICAL_WEIGHT:.2f}, "
        f"relevance_score_threshold={RELEVANCE_SCORE_THRESHOLD:.2f}, "
        f"weak_match_min_score={WEAK_MATCH_MIN_SCORE:.2f}"
    )


if __name__ == "__main__":
    main()
