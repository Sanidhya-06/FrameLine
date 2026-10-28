import os
import sys
from pathlib import Path

os.environ.setdefault("FRAMELINE_CONTACT_URL", "https://example.com/frameline-tests")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.main import AnalyzeRequest, analyze, health


def test_phase_one_api_skeleton() -> None:
    assert health() == {"status": "ok"}
    body = analyze(AnalyzeRequest(query="fixture"))
    assert body.articles == []
    assert body.status == "not_implemented"
