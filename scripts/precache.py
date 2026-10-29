"""Warm the FrameLine analysis cache for one query per input line."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.jobs import analyze_blocking


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("queries", nargs="*", help="Queries to cache; if omitted, read one per stdin line")
    args = parser.parse_args()
    queries = args.queries or [line.strip() for line in sys.stdin if line.strip()]
    for query in queries:
        result = analyze_blocking(query, bypass_cache=True)
        print(f"Cached {query!r}: {len(result.articles)} articles ({result.status})")


if __name__ == "__main__":
    main()
