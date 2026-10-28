from fastapi import FastAPI
from pydantic import BaseModel

from backend.config import get_settings
from models.schemas import AnalyzeResponse

app = FastAPI(title="FrameLine API")


class AnalyzeRequest(BaseModel):
    query: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/methodology")
def methodology() -> dict[str, str]:
    return {
        "methodology_version": get_settings().methodology_version,
        "status": "skeleton",
    }


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    settings = get_settings()
    return AnalyzeResponse(
        query=request.query,
        status="not_implemented",
        methodology_version=settings.methodology_version,
        development_only=False,
    )
