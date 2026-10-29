from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

from backend.config import get_settings
from backend.pipeline import run_pipeline
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
from backend.jobs import analyze_blocking, create_job, get_job

app = FastAPI(title="FrameLine API")
app.add_middleware(CORSMiddleware, allow_origins=list(get_settings().cors_origins), allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["*"])


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
        "cache": f"Full analysis responses are cached in SQLite for {get_settings().cache_ttl_seconds} seconds (default 24 hours). Cache keys include normalized query, methodology version, and feed configuration hash. Cache hits are marked cached=true; POST /analyze and POST /analyze/jobs accept bypass_cache=true.",
        "job_stages": "connecting_feeds: feed requests begin; retrieving_headlines: feed requests finish and entries are collected; checking_relevance: RSS entries are scored; extracting_text: selected articles are processed; preparing_map: country groups are prepared; done: response is ready; failed: pipeline stopped safely.",
    }


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest, bypass_cache: bool = Query(False)) -> AnalyzeResponse:
    return analyze_blocking(request.query, bypass_cache=bypass_cache)


@app.post("/analyze/jobs")
def analyze_job(request: AnalyzeRequest, bypass_cache: bool = Query(False)) -> dict:
    job = create_job(request.query, bypass_cache=bypass_cache)
    if job.stage == "done":
        return job.as_dict()
    return {"job_id": job.job_id}


@app.get("/analyze/jobs/{job_id}")
def analyze_job_status(job_id: str) -> dict:
    return get_job(job_id).as_dict()
