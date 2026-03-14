"""Integration tests for agent runner (require OpenAI-compatible model and Redis)."""
from __future__ import annotations

import os
import uuid

import pytest

from agent.redis_client import load_run
from agent.runner import run_feedback, run_generate


@pytest.fixture(autouse=True)
def use_model_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Point the runner at a local OpenAI-compatible endpoint (e.g. vLLM code model)."""
    monkeypatch.setenv("MODEL_URL", "http://localhost:8010/v1")
    # Default to a CPU-friendly code model, but allow override via env if needed.
    monkeypatch.setenv(
        "MODEL_NAME",
        os.environ.get("MODEL_NAME", "Qwen/Qwen2.5-Coder-1.5B-Instruct"),
    )


@pytest.mark.skipif(
    os.environ.get("SKIP_AGENT_INTEGRATION") == "1",
    reason="Integration: needs OpenAI-compatible model endpoint and Redis",
)
def test_run_generate_returns_snippet_and_libs() -> None:
    run_id = f"test-{uuid.uuid4().hex[:8]}"
    raw, libs = run_generate(
        run_id=run_id,
        field_explanations=[{"fieldName": "amount", "explanation": "Sale amount"}],
        user_prompt="Show a bar chart of amount",
        main_cube_name="sales",
        main_cube_data=[{"amount": 100}, {"amount": 200}],
    )
    assert isinstance(raw, str)
    assert "<html" in raw.lower() or "<!DOCTYPE" in raw
    assert isinstance(libs, list)
    data = load_run(run_id)
    assert data is not None
    assert data["raw_snippet"] == raw
    assert data["libraries_used"] == libs


@pytest.mark.skipif(
    os.environ.get("SKIP_AGENT_INTEGRATION") == "1",
    reason="Integration: needs model mock and Redis",
)
def test_run_feedback_requires_existing_run() -> None:
    with pytest.raises(KeyError, match="run not found"):
        run_feedback(run_id="nonexistent-run-id", feedback="Make it blue")
