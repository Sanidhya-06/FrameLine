from fastapi import FastAPI
from pydantic import BaseModel, field_validator

from backend.config import get_settings
from backend.relevance import (
    LEXICAL_WEIGHT,
    MODEL_NAME,
    RELEVANCE_SCORE_THRESHOLD,
    SEMANTIC_WEIGHT,
    SUMMARY_WEIGHT,
    TITLE_WEIGHT,
    WEAK_MATCH_MIN_SCORE,
)
from models.schemas import AnalyzeResponse
from backend.pipeline import run_pipeline

app = FastAPI(title="FrameLine API")


class AnalyzeRequest(BaseModel):
    query: str

    @field_validator("query")
    @classmethod
    def non_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("query must not be blank")
        return value.strip()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/methodology")
def methodology() -> dict[str, str]:
    return {
        "methodology_version": get_settings().methodology_version,
        "status": "available",
        "relevance_filter": (
            f"Hybrid relevance score: lexical component weight {LEXICAL_WEIGHT:.2f} "
            f"(title coverage weight {TITLE_WEIGHT:.2f}, RSS-summary coverage weight "
            f"{SUMMARY_WEIGHT:.2f}) and cosine-semantic component weight "
            f"{SEMANTIC_WEIGHT:.2f}; relevance score threshold "
            f"{RELEVANCE_SCORE_THRESHOLD:.2f}. In hybrid mode, scores from "
            f"{WEAK_MATCH_MIN_SCORE:.2f} up to the threshold are labeled weak_match "
            "and excluded from country groups. In lexical fallback mode, a matching "
            "article below the threshold is weak_match. Proper-noun query anchors "
            "must appear in the title or summary."
        ),
        "relevance_model": MODEL_NAME,
        "relevance_limits": (
            "Uses short RSS titles and summaries; full article text is unavailable "
            "or restricted for most sources. Proper-noun anchors use capitalization "
            "heuristics. Weak matches remain in the article list but not country groups."
        ),
        "relevance_fallback": (
            "If the embedding model is unavailable, the weighted lexical relevance "
            "score is used and responses report relevance_method=lexical_fallback."
        ),
    }


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    return run_pipeline(request.query)
