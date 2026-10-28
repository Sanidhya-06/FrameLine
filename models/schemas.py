from datetime import datetime
from typing import Any

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
    development_only: bool = False
