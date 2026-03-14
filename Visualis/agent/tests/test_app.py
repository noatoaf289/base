"""TDD: Agent HTTP API /generate and /feedback."""
from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from agent.app import app

client = TestClient(app)


def test_health() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@patch("agent.app.run_generate")
def test_generate_returns_snippet_and_libs(mock_run: object) -> None:
    mock_run.return_value = ("<html><body>ok</body></html>", ["chart-js"])
    resp = client.post(
        "/generate",
        json={
            "runId": "run-1",
            "fieldExplanations": [{"fieldName": "x", "explanation": "value"}],
            "userPrompt": "Bar chart",
            "mainCubeName": "cube1",
            "mainCubeData": [{"x": 1}],
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "ok" in data["htmlSnippet"]
    assert data["librariesUsed"] == ["chart-js"]


@patch("agent.app.run_generate")
def test_generate_validation_max_16_fields(mock_run: object) -> None:
    many = [{"fieldName": f"f{i}", "explanation": "x"} for i in range(17)]
    resp = client.post(
        "/generate",
        json={
            "runId": "run-1",
            "fieldExplanations": many,
            "userPrompt": "Chart",
            "mainCubeName": "c",
            "mainCubeData": [],
        },
    )
    assert resp.status_code == 422


@patch("agent.app.run_feedback")
def test_feedback_returns_snippet(mock_feedback: object) -> None:
    mock_feedback.return_value = ("<html><body>updated</body></html>", ["chart-js", "lodash"])
    resp = client.post(
        "/feedback",
        json={"runId": "run-1", "feedback": "Make bars blue"},
    )
    assert resp.status_code == 200
    assert "updated" in resp.json()["htmlSnippet"]
    assert "lodash" in resp.json()["librariesUsed"]


@patch("agent.app.run_feedback")
def test_feedback_404_when_run_not_found(mock_feedback: object) -> None:
    mock_feedback.side_effect = KeyError("run not found: run-missing")
    resp = client.post(
        "/feedback",
        json={"runId": "run-missing", "feedback": "Fix it"},
    )
    assert resp.status_code == 404
