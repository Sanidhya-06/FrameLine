from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class Article(BaseModel):
    article_id: str
    title: str
    url: str
    publisher: str
    source_country: str
    iso_code: str
    published_at: datetime | None = None
    published_raw: str | None = None
    rss_summary: str = ""
    article_text: str | None = None
    retrieved_at: datetime
    extraction_status: str
    language: str
    translation_status: str = "not_requested"
    matched_terms: list[str] = Field(default_factory=list)
    relevance_score: float | None = None
    relevance_components: dict[str, float] = Field(default_factory=dict)
    relevance_method: Literal["hybrid", "lexical_fallback"] = "lexical_fallback"
    relevance_label: Literal["relevant", "weak_match"] = "relevant"


class FeedStatus(BaseModel):
    feed: str
    url: str
    status: str
    error_text: str | None = None
    entry_count: int
    response_time_ms: float


class Signal(BaseModel):
    signal_name: str
    status: str
    value: Any | None = None
    label: str | None = None
    method: str
    confidence: float | None = None
    target: str | None = None
    evidence: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class CountryGroup(BaseModel):
    iso_code: str
    region: str
    display_name: str
    article_count: int
    sources: list[str] = Field(default_factory=list)
    coverage_status: str
    articles: list[Article] = Field(default_factory=list)
    signals: list[Signal] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class AnalyzeResponse(BaseModel):
    query: str
    status: str
    articles: list[Article] = Field(default_factory=list)
    country_groups: dict[str, CountryGroup] = Field(default_factory=dict)
    signals: list[Signal] = Field(default_factory=list)
    methodology_version: str
    relevance_method: Literal["hybrid", "lexical_fallback"] = "hybrid"
    development_only: bool = False
    explanation: str | None = None
    feed_statuses: list[FeedStatus] = Field(default_factory=list)
