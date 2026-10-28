import os
import sys
from pathlib import Path

os.environ.setdefault("FRAMELINE_CONTACT_URL", "https://example.com/frameline-tests")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.main import AnalyzeRequest, analyze, health, methodology


def test_phase_two_api_pipeline() -> None:
    assert health() == {"status": "ok"}
    methods = methodology()
    assert "relevance score" in methods["relevance_filter"]
    assert methods["relevance_model"] == "sentence-transformers/all-MiniLM-L6-v2"
    body = analyze(AnalyzeRequest(query="fixture"))
    assert body.articles == []
    assert body.status in {"no_results", "partial", "ok"}
    assert body.explanation is not None
