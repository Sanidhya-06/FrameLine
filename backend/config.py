import os
from dataclasses import dataclass
from pathlib import Path


class ConfigurationError(RuntimeError):
    """Raised when required FrameLine configuration is missing."""


@dataclass(frozen=True)
class Settings:
    feed_config_path: Path
    feed_timeout: float
    extraction_timeout: float
    cache_ttl_seconds: int
    methodology_version: str
    contact_url: str

    @property
    def user_agent(self) -> str:
        return (
            "FrameLine/1.0 (academic news-framing research prototype; "
            f"{self.contact_url}) python-requests/2.x"
        )


def get_settings() -> Settings:
    contact_url = os.getenv("FRAMELINE_CONTACT_URL", "").strip()
    if not contact_url:
        raise ConfigurationError(
            "FRAMELINE_CONTACT_URL is required to identify FrameLine requests. "
            "Set it to a project or maintainer URL."
        )

    return Settings(
        feed_config_path=Path(
            os.getenv("FRAMELINE_FEED_CONFIG", "data/rss_feeds.json")
        ),
        feed_timeout=float(os.getenv("FRAMELINE_FEED_TIMEOUT", "15")),
        extraction_timeout=float(
            os.getenv("FRAMELINE_EXTRACTION_TIMEOUT", "12")
        ),
        cache_ttl_seconds=int(os.getenv("FRAMELINE_CACHE_TTL", "86400")),
        methodology_version=os.getenv(
            "FRAMELINE_METHODOLOGY_VERSION", "phase1-v1"
        ),
        contact_url=contact_url,
    )


def load_feed_config(settings: Settings | None = None) -> dict:
    active_settings = settings or get_settings()
    with active_settings.feed_config_path.open(encoding="utf-8") as handle:
        import json

        return json.load(handle)
