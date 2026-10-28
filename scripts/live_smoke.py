"""Opt-in real-network pipeline smoke test: python scripts/live_smoke.py [query ...]."""
from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("FRAMELINE_CONTACT_URL", "https://github.com/frameline")

from backend.pipeline import run_pipeline


EXPECTED_REGIONS = ("USA", "China", "Russia", "UK", "India", "Middle East")


def main() -> None:
    queries = sys.argv[1:] or ["Ukraine", "Sudan famine"]
    for query in queries:
        result = run_pipeline(query)
        print(f"QUERY {query!r}: {result.status}; matched_articles={len(result.articles)}")
        for feed in result.feed_statuses:
            print(f"  {feed.status:7} entries={feed.entry_count:3} {feed.response_time_ms:8.1f}ms {feed.feed}")
        region_counts = dict.fromkeys(EXPECTED_REGIONS, 0)
        for index, article in enumerate(result.articles, start=1):
            country_group = result.country_groups.get(article.iso_code)
            region = country_group.region if country_group else "Unknown"
            region_counts[region] = region_counts.get(region, 0) + 1
            print(
                f"  ARTICLE {index:02}: region={region!r}; "
                f"country={article.source_country!r}; iso_code={article.iso_code!r}; "
                f"source={article.publisher!r}; matched_terms={article.matched_terms!r}; "
                f"title={article.title!r}"
            )
        print("  MATCHED ARTICLES BY REGION:")
        for region, count in region_counts.items():
            print(f"    {region}: {count}")


if __name__ == "__main__":
    main()
