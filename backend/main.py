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
from backend.translation_config import HELSINKI_MODELS, NLLB_MODEL, TRANSLATION_BACKEND_BY_LANGUAGE

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
        "translation": "FrameLine translates article headlines and RSS summaries for display while preserving the original fields and source link. Per-language routing overrides: Hindi, Russian, and Italian use NLLB-200-distilled-600M based on sample quality review; other supported Helsinki languages use OPUS-MT. If an OPUS-MT model is unavailable, NLLB is attempted. Translations are machine generated and may change meaning.",
        "translation_backend_map": str({**{language: "helsinki" for language in HELSINKI_MODELS}, **TRANSLATION_BACKEND_BY_LANGUAGE}),
        "translation_fallback": "Languages without a configured Helsinki model use NLLB. If the selected model fails, the other available backend is tried; if both fail, the original remains available and translation_status is failed.",
        "translation_cache": f"Translated text segments are cached in SQLite for {get_settings().translation_cache_ttl_seconds} seconds. Batch size is {get_settings().translation_batch_size}; inference runs on CPU with num_beams=1.",
        "translation_licenses": f"Helsinki-NLP OPUS-MT model licenses are per-model: most configured models are Apache-2.0; opus-mt-ru-en is CC-BY-4.0. NLLB model {NLLB_MODEL} is CC-BY-NC-4.0 and is released for research use, not production deployment. Review each model card/license before deployment.",
        "translation_model_cards": "https://huggingface.co/Helsinki-NLP/opus-mt-de-en; https://huggingface.co/Helsinki-NLP/opus-mt-fr-en; https://huggingface.co/Helsinki-NLP/opus-mt-es-en; https://huggingface.co/Helsinki-NLP/opus-mt-ru-en; https://huggingface.co/Helsinki-NLP/opus-mt-hi-en; https://huggingface.co/Helsinki-NLP/opus-mt-it-en; https://huggingface.co/Helsinki-NLP/opus-mt-ROMANCE-en; https://huggingface.co/facebook/nllb-200-distilled-600M",
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
